import ApiResponder from "../utils/ApiResponder";
import { GmailEmailSender } from "../services/emailService";
import { NotificationFactory } from "../services/notificationFactory";
import Users, {UserType, User, UserModel} from "../models/User";
import { generateUserToken, verifyUserToken } from "../services/userToken";
import type { Response, Request } from "express";
import { isValidEmail, isValidPassword, isValidPasswordStrength } from "../middleware/validator";
import database from "../config/database";
import logger from "../utils/Logger";
import { auditLog } from "../utils/auditLogger";
import { BcryptHasher } from "../utils/PasswordHasher";

export async function createUser(req: Request<unknown, unknown, UserType>, res: Response): Promise<Response> {
    const requestId = req.headers['x-request-id'] || 'unknown';
    const data = req.body as UserType;
    logger.info(`[${requestId}] Tentative de création d'utilisateur`, { email: data.email, role: data.role });

    try {
        
        const result = await Users.create(data);
        
        if(!result.success) {
            logger.warn(`[${requestId}] Échec de création d'utilisateur`, {
                email: data.email,
                employeeId: data.employeeId,
                role: data.role,
                userId: result.userId
            });

            return ApiResponder.badRequest(res, result.message, {
                success: false,
                message: result.message,
                field: result.field
            });
        }
        logger.info(`[${requestId}] Utilisateur créé avec succès`, { 
            email: data.email, 
            employeeId: data.employeeId,
            role: data.role,
            userId: result.userId
        });

        return ApiResponder.created(res, { success: true, userId: result.userId }, 'Un email de verification vous a été envoyé pour completer votre inscription');
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
    const { email, rememberMe } = req.body;
    
    try {
        logger.info(`[${requestId}] Tentative de connexion`, { email });
        
        const authUser = await Users.verifyCredentials({ email, password: req.body.password });
        
        console.log('🔧 DEBUG - authUser reçu:', authUser);
        console.log('🔧 DEBUG - Type de authUser:', typeof authUser);
        console.log('🔧 DEBUG - authUser.error:', (authUser as any)?.error);
        
        // Vérifier si c'est une erreur de connexion à la base de données
        if (authUser && (authUser as any).error === 'DATABASE_CONNECTION_ERROR') {
            console.log('🔧 DEBUG - Erreur de connexion DB détectée');
            logger.error(`[${requestId}] Erreur de connexion à la base de données`, { email });
            return ApiResponder.error(res, null, "Service temporairement indisponible. Veuillez réessayer plus tard.");
        }
        
        if (!authUser || !authUser.id) {
            console.log('🔧 DEBUG - Identifiants invalides détectés');
            logger.warn(`[${requestId}] Échec de connexion - identifiants invalides`, { email });
            return ApiResponder.unauthorized(res, "Identifiants invalides");
        }

        const token = generateUserToken({
            sup: authUser.id,
            email: authUser.email,
            role: authUser.role,
        });

        const oneDay = 24 * 60 * 60 * 1000; // 1 jour en ms;
        const sevenDays = 7 * oneDay;

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: rememberMe ? sevenDays : oneDay,
            domain: process.env.COOKIE_DOMAINE,
            path: '/',
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
    if (!token) {
        return ApiResponder.unauthorized(res, 'Veuillez vous connecter pour accéder à cette page.');
    }
    try {
        const payload = verifyUserToken(token);
        return ApiResponder.success(res, { token, payload }, 'Jeton actuel');
    } catch (error) {
        logger.error('Erreur lors de la vérification du jeton', { 
            error: error instanceof Error ? error.message : 'Erreur inconnue' 
        });
        return ApiResponder.unauthorized(res, 'Veuillez vous connecter pour accéder à cette page.', error);
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
        secure: process.env.NODE_ENV === 'production'
    });
    logger.debug(`[${requestId}] Utilisateur déconecté`, {id: user.sup, email: user.email, role: user.role});
    return ApiResponder.success(res, null, 'Déconnecté');
}

// Endpoint pour récupérer le profil de l'utilisateur connecté
export async function getUserProfil(req: Request, res: Response): Promise<Response> {
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

        return ApiResponder.success(res, { user: userDetails[0] }, 'Profil utilisateur récupéré');
    } catch (error) {
        logger.error(`[${requestId}] Erreur lors de la récupération du profil`, { 
            error: error instanceof Error ? error.message : 'Erreur inconnue' 
        });
        return ApiResponder.error(res, error, 'Veuillez vous connecter pour accéder à cette page.');
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

        await auditLog({
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
        await auditLog({
            action: 'UPDATE',
            table_name: 'employee',
            record_id: payload.sup,
            performed_by: payload.sup
        })

        await database.execute(
            "UPDATE auth_token SET token = null WHERE token = ?",
            [token]
        )
        await auditLog({
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

export async function verifyRegistrationToken(req: Request, res: Response): Promise<Response> {
    const requestId = req.headers['x-request-id'] || 'unknown';
    const currentToken = req.body.token || req.query.token;

    logger.info(`[${requestId}] Vérification du token d'inscription`, { currentToken });
    console.log('🔐 verifyRegistrationToken - Token reçu:', currentToken);

    if (!currentToken) {
        logger.warn(`[${requestId}] Token manquant dans la requête`);
        console.log('❌ Token manquant');
        return ApiResponder.badRequest(res, 'Token de vérification manquant');
    }

    try {
        const payload = verifyUserToken(currentToken);
        const userId = payload.sup;
        
        logger.info(`[${requestId}] Token décodé`, { userId, email: payload.email });
        console.log('🔐 verifyRegistrationToken - Payload décodé:', payload);
        console.log('🔐 verifyRegistrationToken - UserID extrait:', userId);

        const users = await Users.findUser(userId, 'id');
        
        logger.info(`[${requestId}] Résultat findUser`, { 
            userId, 
            usersCount: users.length,
            userFound: users.length > 0 
        });
        console.log('🔐 verifyRegistrationToken - Résultat findUser:', {
            nombreUtilisateurs: users.length,
            utilisateurs: users
        });

        // ✅ CORRECTION ICI : Vérification correcte du tableau
        if (!Array.isArray(users) || users.length === 0) {
            logger.warn(`[${requestId}] Utilisateur introuvable pour le token`, { userId });
            console.log('❌ Utilisateur non trouvé pour ID:', userId);
            return ApiResponder.notFound(res, 'Utilisateur introuvable');
        }

        const user = users[0];
        logger.info(`[${requestId}] Utilisateur trouvé`, { 
            userId: user.id, 
            email: user.email, 
            isVerified: user.isVerified 
        });
        console.log('🔐 Utilisateur trouvé:', user);
        
        // ✅ Vérification que user existe et a les propriétés nécessaires
        if (!user || typeof user !== 'object') {
            logger.warn(`[${requestId}] Format de données utilisateur invalide`, { userId });
            console.log('❌ Format utilisateur invalide');
            return ApiResponder.unauthorized(res, 'Données utilisateur invalides');
        }

        // ✅ Vérification de isVerified
        if (user.isVerified === undefined || user.isVerified === null) {
            logger.warn(`[${requestId}] Propriété isVerified manquante`, { userId });
            console.log('❌ Propriété isVerified manquante');
            return ApiResponder.unauthorized(res, 'Données utilisateur incomplètes');
        }

        if (user.isVerified === 1) {
            logger.info(`[${requestId}] Utilisateur déjà vérifié`, { userId });
            console.log('✅ Utilisateur déjà vérifié');
            return ApiResponder.success(res, null, 'Compte déjà vérifié');
        }

        const updateResult = await Users.updateVerificationStatus(userId, 1);

        if (!updateResult.success) {
            logger.error(`[${requestId}] Échec de la mise à jour du statut de vérification`, { userId });
            console.log('❌ Échec mise à jour statut vérification');
            return ApiResponder.error(res, null, 'Impossible de vérifier le compte');
        }

        await auditLog({
            table_name: 'employee',
            action: 'UPDATE',
            record_id: userId,
            performed_by: userId,
            description: `Activation du compte utilisateur via lien de vérification`
        });

        const token = generateUserToken({
            sup: user.id,
            email: user.email,
            role: user.role,
        });

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            domain: process.env.COOKIE_DOMAINE,
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        });

        logger.info(`[${requestId}] Vérification réussie et utilisateur connecté`, { userId });
        console.log('✅ Vérification réussie et utilisateur connecté');
        
        return ApiResponder.success(res, {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            }
        }, 'Compte vérifié et utilisateur connecté');

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        logger.error(`[${requestId}] Erreur lors de la vérification du token`, {
            error: errorMessage
        });
        console.error('❌ verifyRegistrationToken - Erreur:', error);
        return ApiResponder.unauthorized(res, 'Token invalide ou expiré');
    }
}