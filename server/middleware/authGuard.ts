import type { Response, Request, NextFunction} from 'express'
import ApiResponder from '../utils/ApiResponder'
import { verifyUserToken } from '../services/userToken';

function authGuard(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.auth_token;
    if (!token) return ApiResponder.unauthorized(res, 'Jeton manquant');
    try {
        const payload = verifyUserToken(token);
        (req as any).user = payload;
        next();
    } catch {
        return ApiResponder.unauthorized(res, 'Jeton invalide');
    }
}

export default authGuard;