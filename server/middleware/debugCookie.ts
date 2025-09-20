// middleware/debugCookies.ts
import type { Response, Request, NextFunction } from 'express';
import logger from '../utils/Logger';

export function debugCookies(req: Request, _res: Response, next: NextFunction) {
    if (process.env.NODE_ENV === 'development') {
        const requesId = req.headers['x-request-id'] || 'unknown';
        logger.debug('Cookie Debug', {
            url: req.url,
            cookies: req.cookies,
            requesId,
            headers: {
                origin: req.headers.origin,
                cookie: req.headers.cookie,
            }
        });
    }
    next();
}