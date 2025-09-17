// middleware/authGuard.ts
import type { Response, Request, NextFunction } from 'express'
import ApiResponder from '../utils/ApiResponder'
import { verifyUserToken } from '../services/userToken';

function authGuard(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.auth_token;
    if (!token) {
        // Ne pas envoyer de notification, juste bloquer l'accès
        return ApiResponder.unauthorized(res, 'Accès non autorisé');
    }
    try {
        const payload = verifyUserToken(token);
        (req as any).user = payload;
        next();
    } catch {
        return ApiResponder.unauthorized(res, 'Token invalide');
    }
}

export default authGuard;