import ApiResponder from "../utils/ApiResponder";
import type { Response, Request, NextFunction } from 'express';
import { verifyUserToken } from "../services/userToken";
import logger from "../utils/Logger";

export default function authGuard(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] || 'unknow';
    console.log('🔐 authGuard - Cookies received:', req.cookies);
    
    const accessToken = req.cookies?.auth_token;
    const refreshToken = req.cookies?.refresh_token;
    const rememberMe = req.cookies?.rememberMe === 'true';
    console.log('🔐 authGuard - Token found:', !!accessToken && !!refreshToken && !!rememberMe);
    
    if (!accessToken) {
        console.log('❌ authGuard - No token found');
        logger.warn(`[${requestId}] Accès non autorisé`, { details: 'Token invalide' });
        return ApiResponder.unauthorized(res, 'Accès non autorisé');
    }

    try {
        const payload = verifyUserToken(accessToken);
        console.log('✅ authGuard - Token valid, payload:', payload);
        
        (req as any).user = payload;
        logger.info(`[${requestId}] Token valide et utilisateur auhtentifié`, {email: payload.email});
        next();
    } catch (error) {
        console.log('❌ authGuard - Token invalid:', error);
        (req as any).user = null;
        logger.error(`[${requestId}] Une erreur est survenue lors de la verification du token`, {
            errorMessage: error instanceof Error ? error.message : 'unknown error',
            stack: error instanceof Error ? error.stack : 'unknown stack of error',
        })
        return ApiResponder.unauthorized(res, 'Token invalide');
    }
}