import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import invoiceRoutes from './routes/invoice.routes';
import authRoutes from './routes/auth.route';
import supplierRoute from './routes/supplier.route';
import settingsRoute from './routes/settings.route';
import searchRoute from './routes/search.route';
import exportRoute from './routes/export.route';
import statsRoute from './routes/stats.route'
import { requestIdMiddleware } from './middleware/requestIdMiddleware';
import { debugCookies } from './middleware/debugCookie';
import logger from './utils/Logger';
import ApiResponder from './utils/ApiResponder';
import type { Response, Request, NextFunction } from 'express';
import usersRoute from './routes/users.route';
import migrationRoutes from './routes/migration.route';
import authGuard from './middleware/authGuard';
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

app.use(cors(corsOptions));

// Middlewares globaux
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(requestIdMiddleware);

// Debug en développement
if (process.env.NODE_ENV === 'development') {
    app.use(debugCookies);
}

// Montage des routes
app.use('/api/migration', migrationRoutes);
app.use('/api', authRoutes);
app.use('/api', invoiceRoutes);
app.use('/api', supplierRoute);
app.use('/api', settingsRoute);
app.use('/api', searchRoute);
app.use('/api', exportRoute);
app.use('/api', statsRoute);
app.use('/api', usersRoute);

// Route de test
app.get('/api/health', (_req, res) => {
    res.json({ status: 'OK', message: 'Serveur fonctionnel' });
});

// Gestion des erreurs globaux
app.use((err: Error & { type?: string; status?: number }, req: Request, res: Response, _next: NextFunction) => {
    if (err?.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400)) {
        logger.error('Erreur de parsing JSON', { error: err.message, stack: err.stack });
        return ApiResponder.badRequest(res, 'Requête JSON invalide');
    }
    logger.error('Erreur non gérée', { error: err.message, stack: err.stack });
    return ApiResponder.error(res, err);
});

export default app;