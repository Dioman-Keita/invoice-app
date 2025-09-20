import type { Response, Request, NextFunction } from 'express';

export function corsHeaders(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;
    
    // Liste des origines autorisées
    const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:5173',
        'http://localhost:3000'
    ].filter(Boolean) as string[];

    if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-request-id');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
}