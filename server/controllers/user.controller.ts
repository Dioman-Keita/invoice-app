import ApiResponder from "../utils/ApiResponder";
import { GmailEmailSender } from "../services/emailService";
import { NotificationFactory } from "../services/notificationFactory";
import Users, {UserType, User} from "../models/User";
import { generateUserToken, verifyUserToken } from "../services/userToken";
import type { Response, Request } from "express";
import { isValidEmail, isValidPassword, isValidPasswordStrength } from "../middleware/validator";
import database from "../config/database";
import logger from "../utils/Logger";
import { BcryptHasher } from "../utils/PasswordHasher";

export async function createUser(req: Request<unknown, unknown, UserType>, res: Response): Promise<Response> {
    const requestId = req.headers['x-request-id'] || 'unknown';
    try {
        const data = req.body as UserType;
        logger.info(`[${requestId}] Tentative de création d'utilisateur`, { email: data.email, role: data.role });
        
        const result = await Users.create(data);
        
        logger.info(`[${requestId}] Utilisateur créé avec succès`, { 
            email: data.email, 
            employeeId: data.employeeId,
            role: data.role 
        });
        return ApiResponder.created(res, result, 'Utilisateur créé');
    } catch (error) {
        logger.error(`[${requestId}] Échec de création d'utilisateur`, { 
            email: req.body?.email, 
            error: error instanceof Error ? error.message : 'Erreur inconnue',
            stack: error instanceof Error ? error.stack : undefined
        });
        return ApiResponder.error(res, error);
    }
}

export async function login(req: Request, res: Response): Promise<Response> {
    const requestId = req.headers['x-request-id'] || 'unknown';
    const { email } = req.body;
    
    try {
        logger.info(`[${requestId}] Tentative de connexion`, { email });
        
        const authUser = await Users.verifyCredentials({ email, password: req.body.password });
        if (!authUser) {
            logger.warn(`[${requestId}] Échec de connexion - identifiants invalides`, { email });
            return ApiResponder.unauthorized(res, "Identifiants invalides")
        }

        const token = generateUserToken({
            sup: authUser.id,
            email: authUser.email,
            role: authUser.role,
        });

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.MODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 60 * 60 * 1000,
        });
        
        logger.info(`[${requestId}] Connexion réussie`, { 
            userId: authUser.id, 
            email: authUser.email, 
            role: authUser.role 
        });
        return ApiResponder.success(res, { user: authUser }, "Connecté");
    } catch (error) {
        logger.error(`[${requestId}] Erreur lors de la connexion`, { 
            email, 
            error: error instanceof Error ? error.message : 'Erreur inconnue' 
        });
        return ApiResponder.error(res, error);
    }
}

export async function getCurrentToken(req: Request, res: Response): Promise<Response> {
    const token = req.cookies?.auth_token;
    if (!token) return ApiResponder.unauthorized(res, 'Jeton manquant')
    try {
        const payload = verifyUserToken(token);
        return ApiResponder.success(res, { token, payload }, 'Jeton actuel');
    } catch (error) {
        logger.error('Erreur lors de la vérification du jeton', { 
            error: error instanceof Error ? error.message : 'Erreur inconnue' 
        });
        return ApiResponder.unauthorized(res, 'Jeton invalide', error);
    }
}

export function logout(req: Request, res: Response): Response {
    const user = (req as any).user;
    const requestId = req.headers['x-request-id'] || 'unknown';
    if(!user) {
        logger.warn(`[${requestId}] Tentative de déconnexion invalide`, {id: user.sup, email: user.email, role: user.role})
        return ApiResponder.badRequest(res, 'Tentative de deconnexion d\'un utilisateur non connecté');
    } 
    
    res.clearCookie('auth_token', {
        httpOnly: true,
        sameSite: 'none',
        secure: process.env.MODE_ENV === 'production'
    });
    logger.debug(`[${requestId}] Utilisateur déconecté`, {id: user.sup, email: user.email, role: user.role});
    return ApiResponder.success(res, null, 'Déconnecté');
}

// Endpoint pour récupérer le profil de l'utilisateur connecté
export async function getCurrentUser(req: Request, res: Response): Promise<Response> {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
        // req.user est peuplé par le middleware authGuard
        const user = (req as any).user;
        
        if (!user) {
            logger.warn(`[${requestId}] Tentative d'accès au profil sans utilisateur authentifié`);
            return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
        }

        // Récupérer les informations complètes de l'utilisateur depuis la base
        const userDetails = await Users.findUser(user.sup, 'id') as UserType[];
        
        if (!userDetails || userDetails.length === 0) {
            logger.warn(`[${requestId}] Utilisateur introuvable en base`, { userId: user.sup });
            return ApiResponder.notFound(res, 'Utilisateur introuvable');
        }

        logger.info(`[${requestId}] Profil utilisateur récupéré`, { 
            userId: user.sup, 
            email: user.email 
        });

        return ApiResponder.success(res, userDetails[0], 'Profil utilisateur récupéré');
    } catch (error) {
        logger.error(`[${requestId}] Erreur lors de la récupération du profil`, { 
            error: error instanceof Error ? error.message : 'Erreur inconnue' 
        });
        return ApiResponder.error(res, error);
    }
}

export async function forgotPassword(req: Request, res: Response): Promise<Response> {
    const requestId = req.headers['x-request-id'] || 'unknown';
    const { email } = req.body;
    
    try {
        logger.info(`[${requestId}] Demande de réinitialisation de mot de passe`, { email });
        
        const ok = isValidEmail(email);
        if (!ok) {
            logger.warn(`[${requestId}] Email invalide pour réinitialisation`, { email });
            return ApiResponder.badRequest(res, "Email invalide");
        }
    
        const user = (await Users.findUser(email, 'email') as User[]);
        if (!user || user.length === 0) {
            logger.info(`[${requestId}] Demande de réinitialisation pour email inexistant`, { email });
            return ApiResponder.badRequest(res, 'Si un compte existe, un lien a été envoyé.');
        }
    
        const baseLink = process.env.APP_URL || 'http://localhost:5173';
        const token = generateUserToken({
            sup: user[0].id,
            role: user[0].role,
            email: user[0].email,
        });
        
        await database.execute(
            "INSERT INTO auth_token(token, employee_id) VALUES (?,?)",
            [token, user[0].id]
        )
        
        await logger.audit({
            table_name: 'auth_token',
            action: 'INSERT',
            record_id: user[0].id,
            performed_by: user[0].id,
            description: `Token de réinitialisation généré pour ${email}`
        })
        
        const resetPasswordLink = `${baseLink}/reset-password?token=${token}`;
    
        const template = NotificationFactory.create('reset', {
            name: user[0].firstName,
            email: user[0].email,
            link: resetPasswordLink,
        });
    
        const send = new GmailEmailSender();
        await send.send({
            to: user[0].email as string,
            name: `${user[0].firstName} ${user[0].lastName}`
        }, template);

        logger.info(`[${requestId}] Email de réinitialisation envoyé`, { 
            userId: user[0].id, 
            email: user[0].email 
        });
        return ApiResponder.success(res, null, 'Si un compte existe, un lien a été envoyé.');
    } catch (error) {
        logger.error(`[${requestId}] Erreur lors de la réinitialisation`, { 
            email, 
            error: error instanceof Error ? error.message : 'Erreur inconnue' 
        });
        return ApiResponder.error(res, error);
    }
}

export function verifyResetToken(token: string): boolean {
    try {
        verifyUserToken(token);
        return true;
    } catch(err) {
        logger.error('Erreur lors de la vérification du token de réinitialisation', { 
            error: err instanceof Error ? err.message : 'Erreur inconnue' 
        });
        return false;
    }
}

export async function resetUserPassword(res: Response, req: Request): Promise<Response> {
    const { password, token } = req.body;

    try {
        if (!isValidPassword(req)) return ApiResponder.badRequest(res, 'Les mots de passe ne correspondent pas');
        if (!isValidPasswordStrength(password)) return ApiResponder.badRequest(res, 'Format du mot de passe invalide');
        const payload = verifyUserToken(token);
        const user = await Users.findUser(payload.sup, 'id');

        if(!user || user.length === 0) {
            return ApiResponder.notFound(res, 'Utilisateur non trouvé');
        }

        const isUserExist: User[] = await database.execute(
            "SELECT * FROM auth_token WHERE token = ? AND created_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)",
            [token]
        );
        if (!isUserExist || isUserExist.length === 0) {
            return ApiResponder.badRequest(res, "Lien de réinitialisation expiré");
        }

        const hash = await BcryptHasher.hash(password);
        await database.execute(
            "UPDATE employee SET password = ? WHERE id = ?",
            [hash, payload.sup]
        )
        await logger.audit({
            action: 'UPDATE',
            table_name: 'employee',
            record_id: payload.sup,
            performed_by: payload.sup
        })

        await database.execute(
            "UPDATE auth_token SET token = null WHERE token = ?",
            [token]
        )
        await logger.audit({
            action: 'UPDATE',
            table_name: 'auth_token',
            record_id: payload.sup,
            performed_by: payload.sup
        })
        logger.info(`Succès de la réinitialisation du mot de passe de l'utilisateur ${user[0].id}`);
        return ApiResponder.success(res, null, 'Mot de passe réinitialiser avec succès');
    } catch (error) {
        logger.error('Erreur lors de la réinitialisation du mot de passe', { 
            error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
        return ApiResponder.error(res, error);
    }
}