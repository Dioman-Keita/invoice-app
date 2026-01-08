import ApiResponder from "../utils/ApiResponder";
import type { Response, Request, NextFunction } from 'express';
import { verifyUserToken } from "../services/userToken";
import logger from "../utils/Logger";
import { AuthenticatedRequest } from "../types/express/request";

export default function authGuard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] || 'unknow';
    console.log('🔐 authGuard - Cookies received:', req.cookies);

    const accessToken = req.cookies?.auth_token;
    const refreshToken = req.cookies?.refresh_token;
    const rememberMe = req.cookies?.rememberMe === 'true';
    console.log('🔐 authGuard - Tokens status:', {
        accessToken: !!accessToken,
        refreshToken: !!refreshToken,
        rememberMe: rememberMe, // Actual value
        rememberMeRaw: req.cookies?.rememberMe // Raw cookie value
    });


    if (!accessToken) {
        console.log('❌ authGuard - No token found');
        logger.warn(`[${requestId}] Unauthorized access`, { details: 'Invalid token' });
        return ApiResponder.unauthorized(res, 'Unauthorized access');
    }

    try {
        const payload = verifyUserToken(accessToken);
        console.log('✅ authGuard - Token valid, payload:', payload);

        req.user = payload;
        logger.info(`[${requestId}] Valid token and authenticated user`, { email: payload.email });
        next();
    } catch (error) {
        console.log('❌ authGuard - Token invalid:', error);
        req.user = undefined;
        logger.error(`[${requestId}] An error occurred during token verification`, {
            errorMessage: error instanceof Error ? error.message : 'unknown error',
            stack: error instanceof Error ? error.stack : 'unknown stack of error',
        })
        return ApiResponder.unauthorized(res, 'Invalid token');
    }
}