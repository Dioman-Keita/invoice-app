import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import invoiceRoutes from './routes/invoice.routes';
import authRoutes from './routes/auth.route';
import { requestIdMiddleware } from './middleware/requestIdMiddleware';
import { corsHeaders } from './middleware/corsHeader';
import { debugCookies } from './middleware/debugCookie';
import logger from './utils/Logger';
import ApiResponder from './utils/ApiResponder';
import type { Response, Request, NextFunction } from 'express';
import { trackUserActivity } from './middleware/activityTracker';

const app = express();

// Configuration CORS
const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            'http://localhost:5173',
            'http://localhost:3000'
        ].filter(Boolean) as string[];

        if (process.env.NODE_ENV === 'development' || !origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-request-id']
};

// ✅ SEULEMENT cette ligne - SUPPRIMEZ app.options('*', ...)
app.use(cors(corsOptions));

// Middlewares globaux
app.use(corsHeaders);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);
app.use(trackUserActivity);

// Debug en développement
if (process.env.NODE_ENV === 'development') {
    app.use(debugCookies);
}

// Montage des routes
app.use('/api', authRoutes);
app.use('/api', invoiceRoutes);

// Route de test
app.get('/api/health', (_req, res) => {
    res.json({ status: 'OK', message: 'Serveur fonctionnel' });
});

// Gestion des erreurs globaux
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Erreur non gérée', { error: err.message, stack: err.stack});
    ApiResponder.error(res, err);
});

export default app;