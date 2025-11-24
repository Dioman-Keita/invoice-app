import ApiResponder from "../utils/ApiResponder";
import { GmailEmailSender } from "../services/emailService";
import { NotificationFactory } from "../services/notificationFactory";
import { UserType, User, LoginDto, RegisterDto, VerifyEmailDto, RequestPasswordResetDto, ResetPasswordDto } from "../types";
import Users from '../models/User';
import { generateRefreshToken, generateUserToken, verifyUserToken } from "../services/userToken";
import activityTracker, { ActivityTracker } from "../utils/ActivityTracker";
import UserDataValidator from "../utils/UserDataValidator";
import type { Response, Request } from "express";
import { isValidEmail, isValidPassword, isValidPasswordStrength } from "../middleware/validator";
import { JsonWebTokenError } from "jsonwebtoken";
import database from "../config/database";
import logger from "../utils/Logger";
import { auditLog } from "../utils/auditLogger";
import { BcryptHasher } from "../utils/PasswordHasher";
import { AuthenticatedRequest } from "../types/express/request";

export async function createUser(
    req: Request<unknown, unknown, RegisterDto>, 
    res: Response
  ): Promise<Response> {
    const requestId = req.headers['x-request-id'] || 'unknown';
    const data = req.body as UserType;
    
    logger.info(`[${requestId}] Tentative de création d'utilisateur`, { 
      email: data.email, 
      role: data.role 
    });
    const validationResult = await UserDataValidator.validateUserCreation(data);
  
    if (!validationResult.isValid) {
      logger.warn(`[${requestId}] Validation des données utilisateur échouée`, {
        errors: validationResult.errors,
        email: data.email
      });
      
      const firstError = validationResult.errors[0];
      return ApiResponder.badRequest(res, firstError.message, {
        field: firstError.field,
        allErrors: validationResult.errors
      });
    }
  
    try {
      const result = await Users.create(data);
      
      if (!result.success) {
        logger.warn(`[${requestId}] Échec de création d'utilisateur`, {
          email: data.email,
          employeeId: data.employeeId,
          role: data.role,
          error: result.message
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
  
      return ApiResponder.created(res, { 
        userId: result.userId 
      }, 'Un email de verification vous a été envoyé pour completer votre inscription 😊');
      
    } catch (error) {
      logger.error(`[${requestId}] Échec de création d'utilisateur`, { 
        email: data.email, 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      });
      return ApiResponder.badRequest(res, "Service temporairement indisponible veuillez reéssayer plus tard");
    }
  }

// Renvoi d'email de vérification d'inscription
export async function resendVerificationEmail(req: Request, res: Response): Promise<Response> {
    const requestId = req.headers['x-request-id'] || 'unknown';
    const { email } = req.body as { email?: string };

    if (!email || !isValidEmail(email)) {
        return ApiResponder.badRequest(res, "Email invalide");
    }

    try {
        logger.info(`[${requestId}] Demande de renvoi d'email de vérification`, { email });

        const users = await Users.findUser(email, 'email');
        if (!Array.isArray(users) || users.length === 0) {
            return ApiResponder.notFound(res, "Utilisateur introuvable");
        }

        const user = users[0];
        if (user.isVerified) {
            return ApiResponder.badRequest(res, "Ce compte est déjà vérifié");
        }

        const token = generateUserToken({
            sup: user.id,
            email: user.email,
            role: user.role,
            activity: 'SIGN_UP'
        });

        const verifyLinkBase = process.env.APP_URL || "http://localhost:5173";
        const verifyLink = `${verifyLinkBase}/verify?token=${encodeURIComponent(token)}`;

        const template = NotificationFactory.create('register', {
            name: `${(user as any).firstName ?? ''} ${(user as any).lastName ?? ''}`.trim(),
            email: user.email,
            link: verifyLink,
            token,
        });

        const sender = new GmailEmailSender();
        await sender.send({ to: user.email as string, name: `${(user as any).firstName ?? ''} ${(user as any).lastName ?? ''}`.trim() }, template);

        return ApiResponder.success(res, { email: user.email }, "Un nouvel email de vérification a été envoyé");
    } catch (error) {
        logger.error(`[${requestId}] Échec du renvoi d'email de vérification`, {
            email,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
        return ApiResponder.badRequest(res, "Impossible d'envoyer l'email de vérification. Veuillez réessayer plus tard.");
    }
}

export async function login(req: Request<unknown, unknown, LoginDto>, res: Response): Promise<Response> {
    const requestId = req.headers['x-request-id'] || 'unknown';
    const { email, rememberMe } = req.body;
    
    try {
      logger.info(`[${requestId}] Tentative de connexion`, { email });
  
      // Validation des données de connexion
      const validationResult = await UserDataValidator.validateLogin(req.body);
  
      if (!validationResult.isValid) {
        logger.warn(`[${requestId}] Validation des données de connexion échouée`, {
          errors: validationResult.errors,
          email
        });
        
        const firstError = validationResult.errors[0];
        return ApiResponder.badRequest(res, firstError.message, {
          field: firstError.field
        });
      }
  
      const authUser = await Users.verifyCredentials({ 
        email, 
        password: req.body.password, 
        role: req.body.role 
      });
      
      // Vérifier si c'est une erreur de connexion à la base de données
      if (authUser && typeof authUser === 'object' && 'error' in authUser && authUser.error === 'DATABASE_CONNECTION_ERROR') {
        logger.error(`[${requestId}] Erreur de connexion à la base de données`, { email });
        return ApiResponder.error(res, null, "Service temporairement indisponible. Veuillez réessayer plus tard.");
      }

      if (
        !authUser ||
        typeof authUser !== 'object' ||
        !('id' in authUser) ||
        typeof authUser.id !== 'string'
      ) {
        logger.warn(`[${requestId}] Échec de connexion - identifiants invalides`, { email });
        return ApiResponder.unauthorized(res, "Identifiants invalides");
      }
  
      // Génération des tokens
      const accessToken = generateUserToken({
        sup: authUser.id,
        email: authUser.email,
        role: authUser.role,
        activity: 'LOGIN'
      }, { expiresIn: rememberMe ? '2h' : '1h' });
  
      const refreshToken = generateRefreshToken({ id: authUser.id });
      
      // Configuration des cookies
      const cookieConfig = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' as 'none' | 'lax' | 'strict',
        domain: process.env.COOKIE_DOMAIN,
        path: '/',
      }
  
      // Définition des cookies
      res.cookie('auth_token', accessToken, {
        ...cookieConfig,
        maxAge: rememberMe ? 2 * 60 * 60 * 1000 : 60 * 60 * 1000,
      });
  
      res.cookie('refresh_token', refreshToken, {
        ...cookieConfig,
        maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
      });
  
      res.cookie('rememberMe', Boolean(rememberMe) ? 'true' : 'false', {
        ...cookieConfig,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      
      logger.info(`[${requestId}] Connexion réussie`, { 
        userId: authUser.id, 
        email: authUser.email, 
        role: authUser.role
      });
  
      // Tracking de l'activité
      const isTrack = await activityTracker.track('LOGIN', authUser.id);
      
      if (!isTrack) {
        logger.warn(`[${requestId}] Erreur lors du suivi de l'activité utilisateur`, {
          userId: authUser.id,
          role: authUser.role,
          email: authUser.email
        });
        // On ne bloque pas la connexion pour une erreur de tracking
      }
  
      return ApiResponder.success(res, { 
        userId: authUser.id, 
        role: authUser.role 
      }, "Connecté avec succès 🎉");
      
    } catch (error) {
      logger.error(`[${requestId}] Erreur lors de la connexion`, { 
        email, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
      return ApiResponder.badRequest(res, "Service temporairement indisponible veuillez reéssayer plus tard");
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

function clearAllCookies(res: Response): void {
    const options = {
        path: '/',
        domain: process.env.COOKIE_DOMAIN,
    };

    res.clearCookie('auth_token', options);
    res.clearCookie('refresh_token', options);
    res.clearCookie('rememberMe', options);
}
export async function logout(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const user = req.user || undefined;
    const requestId = req.headers['x-request-id'] as string || 'unknown';
    try {
        
        const cookieOptions = {
            secure: process.env.NODE_ENV === 'production',
            sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax' | 'strict', // or as const
            domain: process.env.COOKIE_DOMAIN,
            path: '/',
        }
        
        res.clearCookie('auth_token', { ...cookieOptions, httpOnly: true });
        res.clearCookie('refresh_token', { ...cookieOptions, httpOnly: true});
        res.clearCookie('rememberMe', { ...cookieOptions, httpOnly: true });
        
        if (user && user.sup) {
            try {
                await activityTracker.track('LOGOUT', user.sup);
                logger.debug(`[${requestId}] Utilisateur déconnecté`, {
                    id: user.sup, 
                    email: user.email, 
                    role: user.role
                });
            } catch (cleanupError) {
                logger.warn(`[${requestId}]  Erreur lors du nettoyage de l'activité`, {
                    error: cleanupError
                });
            }
        } else {
            logger.debug(`[${requestId}] Cookies nettoyés (utilisateur non authentifié)`, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
        }

        return ApiResponder.success(res, null, 'Déconnecté');
    } catch (error) {
        logger.error(`[${requestId}] Echec critique de la deconexion`, {
            errorMessage: error instanceof Error ? error.message : 'unknow error',
            stack: error instanceof Error ? error.stack : 'unknow_stack'
        });

        try {
            clearAllCookies(res);
        } catch (cookieError) {
            logger.error(`[${requestId}] Impossible de nettoyer les cookies`, {
                errorMessage: cookieError instanceof Error ? cookieError.message : 'unknow error',
                error: cookieError
            })
        }
        return ApiResponder.success(res, null, 'Déconnecté (avec erreur de nettoyage)');
    }
}

// Endpoint pour récupérer le profil de l'utilisateur connecté
export async function getUserProfil(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
        // req.user est peuplé par le middleware authGuard
        const user = req.user;
        
        if (!user) {
            logger.warn(`[${requestId}] Tentative d'accès au profile sans utilisateur authentifié`);
            return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
        }

        // Récupérer les informations complètes de l'utilisateur depuis la base
        const userDetails = await Users.findUser(user.sup, 'id') as User[];
        
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

export async function forgotPassword(req: Request<unknown, unknown, RequestPasswordResetDto>, res: Response): Promise<Response> {
    const requestId = req.headers['x-request-id'] || 'unknown';
    const { email } = req.body;
    
    try {
        logger.info(`[${requestId}] Demande de réinitialisation de mot de passe`, { email });
        console.log('🔐 [DEBUG] forgotPassword - Email reçu:', email);
        
        const ok = isValidEmail(email);
        if (!ok) {
            logger.warn(`[${requestId}] Email invalide pour réinitialisation`, { email });
            return ApiResponder.badRequest(res, "Email invalide");
        }
    
        const user = (await Users.findUser(email, 'email') as User[]);
        console.log('🔐 [DEBUG] forgotPassword - Résultat findUser:', {
            userTrouvé: !!user,
            nombreUsers: user?.length,
            user: user?.[0] ? { id: user[0].id, email: user[0].email } : null
        });

        if (!user || user.length === 0) {
            logger.info(`[${requestId}] Demande de réinitialisation pour email inexistant`, { email });
            return ApiResponder.success(res, 'Si un compte existe, un lien a été envoyé.');
        }

        const currentUser = user[0];
        console.log('🔐 [DEBUG] forgotPassword - Utilisateur trouvé:', {
            id: currentUser.id,
            email: currentUser.email,
            firstName: currentUser.firstName
        });
    
        const baseLink = process.env.APP_URL || 'http://localhost:5173';
        const token = generateUserToken({
            sup: currentUser.id,
            role: currentUser.role,
            email: currentUser.email,
            activity: 'SEND_PASSWORD_RESET_EMAIL'
        });
        
        console.log('🔐 [DEBUG] forgotPassword - Token généré:', {
            tokenDébut: token.substring(0, 20) + '...',
            tokenLongueur: token.length,
            employeeId: currentUser.id
        });
        
        try {
            const insertResult = await database.execute(
                "INSERT INTO auth_token(token, employee_id) VALUES (?,?)",
                [token, currentUser.id]
            );

            console.log('🔐 [DEBUG] forgotPassword - Résultat insertion token:', insertResult);
            console.log('🔐 [DEBUG] forgotPassword - Token inséré avec succès');

            // Vérifiez que le token est bien en base
            const verifyToken = await database.execute<unknown[]>(
                "SELECT * FROM auth_token WHERE token = ?",
                [token]
            );
            console.log('🔐 [DEBUG] forgotPassword - Vérification token en base:', {
                tokensTrouvés: verifyToken.length,
                tokenExiste: verifyToken.length > 0
            });

        } catch (insertError) {
            console.error('🔐 [DEBUG] forgotPassword - ERREUR insertion token:', insertError);
            throw insertError;
        }

        await auditLog({
            table_name: 'auth_token',
            action: 'INSERT',
            record_id: currentUser.id,
            performed_by: currentUser.id,
            description: `Token de réinitialisation généré pour ${email}`
        });
        
        const resetPasswordLink = `${baseLink}/reset-password?token=${token}`;
        console.log('🔐 [DEBUG] forgotPassword - Lien généré:', resetPasswordLink);
    
        const template = NotificationFactory.create('reset', {
            name: currentUser.firstName,
            email: currentUser.email,
            link: resetPasswordLink,
        });
    
        const send = new GmailEmailSender();
        await send.send({
            to: currentUser.email as string,
            name: `${currentUser.firstName} ${currentUser.lastName}`
        }, template);

        logger.info(`[${requestId}] Email de réinitialisation envoyé`, { 
            userId: currentUser.id, 
            email: currentUser.email 
        });
        
        console.log('🔐 [DEBUG] forgotPassword - Processus terminé avec succès');
        return ApiResponder.success(res, null, 'Si un compte existe, un lien a été envoyé.');
    } catch (error) {
        console.error('🔐 [DEBUG] forgotPassword - ERREUR FINALE:', error);
        logger.error(`[${requestId}] Erreur lors de la réinitialisation`, { 
            email, 
            error: error instanceof Error ? error.message : 'Erreur inconnue' 
        });
        return ApiResponder.error(res, error);
    }
}


export async function resetUserPassword(req: Request<unknown, unknown, ResetPasswordDto>, res: Response): Promise<Response> {
    const requestId = req.headers['x-request-id'] || 'unknown';
    const { password, token, confirmPassword } = req.body;
    const currentToken = token;

    logger.info(`[${requestId}] Réinitialisation du mot de passe`, { 
        hasToken: !!currentToken,
        hasPassword: !!password,
        hasConfirmPassword: !!confirmPassword
    });
    console.log('🔐 resetUserPassword - Données reçues:', { 
        token: currentToken ? `${currentToken.substring(0, 10)}...` : 'none',
        passwordLength: password?.length || 0,
        confirmPasswordLength: confirmPassword?.length || 0
    });

    if (!currentToken) {
        logger.warn(`[${requestId}] Token manquant dans la requête`);
        console.log('❌ Token manquant');
        return ApiResponder.badRequest(res, 'Token de réinitialisation manquant');
    }

    if (!password || !confirmPassword) {
        logger.warn(`[${requestId}] Données manquantes`, { 
            hasPassword: !!password, 
            hasConfirmPassword: !!confirmPassword 
        });
        return ApiResponder.badRequest(res, 'Les champs mot de passe et confirmation sont requis');
    }

    try {
        // Validation des mots de passe
        if (!isValidPassword(password, confirmPassword)) {
            logger.warn(`[${requestId}] Les mots de passe ne correspondent pas`);
            console.log('❌ Mots de passe différents');
            return ApiResponder.badRequest(res, 'Les mots de passe ne correspondent pas');
        }

        if (!isValidPasswordStrength(password)) {
            logger.warn(`[${requestId}] Format du mot de passe invalide`);
            console.log('❌ Force du mot de passe insuffisante');
            return ApiResponder.badRequest(res, 'Format du mot de passe invalide');
        }

        // Vérification du token
        const payload = verifyUserToken(currentToken);
        
        logger.info(`[${requestId}] Token décodé`, { 
            userId: payload?.sup,
            activity: payload?.activity 
        });
        console.log('🔐 resetUserPassword - Payload décodé:', payload);

        if (!payload || payload.activity !== "SEND_PASSWORD_RESET_EMAIL") {
            logger.warn(`[${requestId}] Token invalide ou activité incorrecte`, { 
                activity: payload?.activity 
            });
            console.log('❌ Token invalide - activité:', payload?.activity);
            return ApiResponder.badRequest(res, "Token invalide ou expiré");
        }

        const userId = payload.sup;
        
        // Vérification de l'existence de l'utilisateur
        const users = await Users.findUser(userId, 'id');
        
        logger.info(`[${requestId}] Résultat findUser`, { 
            userId, 
            usersCount: users.length,
            userFound: users.length > 0 
        });
        console.log('🔐 resetUserPassword - Résultat findUser:', {
            nombreUtilisateurs: users.length,
            utilisateurs: users
        });

        if (!Array.isArray(users) || users.length === 0) {
            logger.warn(`[${requestId}] Utilisateur introuvable pour le token`, { userId });
            console.log('❌ Utilisateur non trouvé pour ID:', userId);
            return ApiResponder.notFound(res, 'Utilisateur non trouvé');
        }

        const user = users[0];

        // Vérification que user existe et a les propriétés nécessaires
        if (!user || typeof user !== 'object') {
            logger.warn(`[${requestId}] Format de données utilisateur invalide`, { userId });
            console.log('❌ Format utilisateur invalide');
            return ApiResponder.unauthorized(res, 'Données utilisateur invalides');
        }

        logger.info(`[${requestId}] Utilisateur trouvé`, { 
            userId: user.id, 
            email: user.email
        });
        console.log('🔐 Utilisateur trouvé:', user);

        // Vérification du token en base de données
        const tokenRecords: unknown[] = await database.execute(
            "SELECT * FROM auth_token WHERE token = ? AND create_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)",
            [currentToken]
        );

        logger.info(`[${requestId}] Vérification du token en base`, { 
            tokenRecordsCount: tokenRecords.length,
            tokenValide: tokenRecords.length > 0
        });

        if (!Array.isArray(tokenRecords) || tokenRecords.length === 0) {
            logger.warn(`[${requestId}] Lien de réinitialisation expiré ou invalide`, { userId });
            console.log('❌ Token expiré en base de données');
            return ApiResponder.badRequest(res, "Lien de réinitialisation expiré");
        }

        // Hash du nouveau mot de passe
        const hash = await BcryptHasher.hash(password);
        
        logger.info(`[${requestId}] Mot de passe hashé avec succès`, { userId });

        // Mise à jour du mot de passe
        await database.execute(
            "UPDATE employee SET password = ? WHERE id = ?",
            [hash, userId]
        );

        await auditLog({
            action: 'UPDATE',
            table_name: 'employee',
            record_id: userId,
            performed_by: userId,
            description: `Réinitialisation du mot de passe utilisateur`
        });

        // Invalidation du token utilisé
        await database.execute(
            "DELETE FROM auth_token WHERE token = ?",
            [currentToken]
        );

        await auditLog({
            action: 'UPDATE',
            table_name: 'auth_token',
            record_id: userId,
            performed_by: userId,
            description: `Invalidation du token de réinitialisation de mot de passe`
        });

        // Track l'activité
        const trackResult = await activityTracker.track('RESET_PASSWORD', userId);

        logger.info(`[${requestId}] Réinitialisation du mot de passe réussie`, { 
            userId,
            email: user.email,
            activityTracked: trackResult
        });
        console.log('✅ Réinitialisation du mot de passe réussie pour:', user.email);

        if (trackResult) {
            return ApiResponder.success(res, {
                resetInfo: {
                    userId: user.id,
                    email: user.email,
                    resetAt: new Date().toISOString()
                }
            }, 'Mot de passe réinitialisé avec succès');
        } else {
            logger.warn(`[${requestId}] Échec du suivi de l'activité pour l'utilisateur ${user.email}`, {
                details: 'Suivi impossible',
                isTracked: trackResult
            });
            return ApiResponder.success(res, {
                resetInfo: {
                    userId: user.id,
                    email: user.email,
                    resetAt: new Date().toISOString()
                }
            }, 'Mot de passe réinitialisé avec succès (suivi d\'activité échoué)');
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        logger.error(`[${requestId}] Erreur lors de la réinitialisation du mot de passe`, {
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined
        });
        console.error('❌ resetUserPassword - Erreur:', error);
        
        if (error instanceof JsonWebTokenError) {
            return ApiResponder.unauthorized(res, 'Token invalide ou expiré');
        }
        
        return ApiResponder.error(res, error);
    }
}

export async function verifyRegistrationToken(req: Request<unknown, unknown, VerifyEmailDto>, res: Response): Promise<Response> {
    const requestId = req.headers['x-request-id'] || 'unknown';
    const currentToken = req.body.token;

    logger.info(`[${requestId}] Vérification du token d'inscription`, { currentToken });
    console.log('🔐 verifyRegistrationToken - Token reçu:', currentToken);

    if (!currentToken) {
        logger.warn(`[${requestId}] Token manquant dans la requête`);
        console.log('❌ Token manquant');
        return ApiResponder.badRequest(res, 'Token de vérification manquant');
    }

    try {
        const payload = verifyUserToken(currentToken);
        if (payload && payload.activity !== 'SIGN_UP') {
            return ApiResponder.badRequest(res, "Token expiré ou invalide");
        }
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

        // ✅ Vérification que user existe et a les propriétés nécessaires
        if (!user || typeof user !== 'object') {
            logger.warn(`[${requestId}] Format de données utilisateur invalide`, { userId });
            console.log('❌ Format utilisateur invalide');
            return ApiResponder.unauthorized(res, 'Données utilisateur invalides');
        }

        logger.info(`[${requestId}] Utilisateur trouvé`, { 
            userId: user.id, 
            email: user.email,
            role: user.role, 
            isVerified: user.isVerified 
        });
        console.log('🔐 Utilisateur trouvé:', user);

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

        const rememberMe = false;
        const tokenDuration = rememberMe ? '2h' : '1h';

        const accessToken = generateUserToken({
            sup: user.id,
            email: user.email,
            role: user.role,
            activity: 'SIGN_UP'
        }, { expiresIn: tokenDuration });

        const refreshToken = generateRefreshToken({ id: user.id });

        res.cookie('auth_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            domain: process.env.COOKIE_DOMAIN,
            maxAge: rememberMe ? 2 * 60 * 60 * 1000 : 60 * 60 * 1000, // 1h pour l'inscription
            path: '/',
        });

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 24h pour inscription
            domain: process.env.COOKIE_DOMAIN,
            path: '/',
        });

        res.cookie('rememberMe', 'false', {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
            domain: process.env.COOKIE_DOMAIN,
            path: '/'
        })

        logger.info(`[${requestId}] Vérification réussie et utilisateur connecté`, { 
            userId,
            sessionType: 'standard',
            silentRefresh: true,
            rememberMe: false, 
        });
        const trackResult = await activityTracker.track('SIGN_UP', user.id);

        if (trackResult) {

            console.log('✅ Vérification réussie et utilisateur connecté');
            
            return ApiResponder.success(res, {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
                sessionInfo: {
                    isRegistration: true,
                    hasSilentRefresh: true,
                    rememberMe: false,
                    expiresIn: 60 * 60 * 1000 // 1 heure
                }
            }, 'Compte vérifié et utilisateur connecté');
        } else {
            logger.warn(`[${requestId}] Echec du suivit de l'utilisateur ${user.email}`, {
                details: 'Suivit impossible',
                isTracked: trackResult
            });
            return ApiResponder.badRequest(res, 'Connexion impossible (SUIVIT IMPOSSIBLE)');
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        logger.error(`[${requestId}] Erreur lors de la vérification du token`, {
            error: errorMessage
        });
        console.error('❌ verifyRegistrationToken - Erreur:', error);
        return ApiResponder.unauthorized(res, 'Token invalide ou expiré');
    }
}

export async function silentRefresh(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const requestId = req.headers['x-request-id'] || 'unknow';
    const user = req.user;
    const rememberMe = req.cookies.rememberMe === 'true';
    const activityTracker = new ActivityTracker(undefined, rememberMe);

    try {
        if (!user || !user.sup) {
            logger.warn(`[${requestId}]  Silent refresh sans utilisateur valide`, { details: 'Utilisateur non renseigné dans req.user' });
            return ApiResponder.unauthorized(res, 'Session invalide');
        }

        const userExists = await Users.findUser(user.sup, 'id');

        if (!userExists || userExists.length === 0 || !userExists[0].isActive) {
                logger.warn(`[${requestId}] Silent refresh pour utilisateur inexistant/inactif`, {
                    userId: user.sup
                });
                return ApiResponder.unauthorized(res, 'Session expirée');
        }


        const lastActivity = await activityTracker.getUserLastActivity(user.sup);
        const now = Date.now();
        const maxInactivity = rememberMe ? 30 * 60 * 1000 : 5 * 60 * 1000; // 30 min vs 5 min

        if(lastActivity && (now - lastActivity > maxInactivity)) {
            await activityTracker.track('LOGOUT', user.sup);
            logger.warn(`[${requestId}] Inactivité détectée`, {
                id: user.sup,
                email: user.email,
                role: user.role,
                maxInactivityOfUser: now - lastActivity,
            })
            return ApiResponder.badRequest(res, 'Session expirée pour inactivité');
        }

        const tokenDuration = rememberMe ? '2h' : '1h';
        const newAccessToken = generateUserToken({
            sup: user.sup,
            email: user.email,
            role: user.role,
            activity: 'REFRESH_SESSION'
        }, { expiresIn: tokenDuration});

        let newRefreshToken;
        if(rememberMe) {
            newRefreshToken = generateRefreshToken({ id: user.sup });
        }
        
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' as 'none' | 'lax' | 'strict',
            domain: process.env.COOKIE_DOMAIN, 
            path: '/',
        }
        res.cookie('auth_token', newAccessToken, {
            ...cookieOptions,
            maxAge: rememberMe ? 2 * 60 * 60 * 1000 : 60 * 60 * 1000, // 2h vs 1h
        });

        if(newRefreshToken) {
            res.cookie('refresh_token', newRefreshToken, {
                ...cookieOptions,
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jrs
            });
        }

        const trackResult = await activityTracker.track('REFRESH_SESSION', user.sup);

        if (!trackResult) {
            logger.warn(`[${requestId}] Échec du tracking pour le refresh`, {
                userId: user.sup,
                activity: 'REFRESH_SESSION'
            })
        }

        logger.info(`[${requestId}] Token renouvelé avec succès pour l'utiliseur ${user.sup}`, {
            role: user.role,
            email: user.email,
            renewed: true,
            activity: 'REFRESH_SESSION',
            expiresIn: rememberMe ? 2 * 60 * 60 * 1000 : 60 * 60 * 1000,
            rememberMe: rememberMe
        });

        return ApiResponder.success(res, {
            renewed: true,
            expiresIn: rememberMe ? 2 * 60 * 60 * 1000 : 60 * 60 * 1000, // 2h vs  1h
            rememberMe: rememberMe,
            userActivity: 'REFRESH_SESSION',
        }, 'Token renouvelé avec succès');

    } catch (error) {
        logger.error(`[${requestId}] Une erreur est survenue lors du renouvellement de token pour l'utilisateur ${user?.email}`, {
            userId: user?.sup,
            email: user?.email,
            errorMessage: error instanceof Error ? error.message : 'unknow error',
            stack: error instanceof Error ? error.stack : 'unknow stack'
        })
        return ApiResponder.error(res, error);
    }
}