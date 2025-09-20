import ApiResponder from "../utils/ApiResponder";
import type { Response, Request, NextFunction } from 'express';
import { verifyUserToken } from "../services/userToken";

export default function authGuard(req: Request, res: Response, next: NextFunction) {
    console.log('🔐 authGuard - Cookies received:', req.cookies);
    
    const token = req.cookies?.auth_token;
    console.log('🔐 authGuard - Token found:', !!token);
    
    if (!token) {
        console.log('❌ authGuard - No token found');
        return ApiResponder.unauthorized(res, 'Accès non autorisé');
    }

    try {
        const payload = verifyUserToken(token);
        console.log('✅ authGuard - Token valid, payload:', payload);
        
        (req as any).user = payload;
        next();
    } catch (error) {
        console.log('❌ authGuard - Token invalid:', error);
        return ApiResponder.unauthorized(res, 'Token invalide');
    }
}