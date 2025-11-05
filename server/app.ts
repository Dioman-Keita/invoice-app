import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import invoiceRoutes from './routes/invoice.routes';
import authRoutes from './routes/auth.route';
import supplierRoute from './routes/supplier.route';
import settingsRoute from './routes/settings.route';
import searchRoute from './routes/search.route';
import { requestIdMiddleware } from './middleware/requestIdMiddleware';
import { debugCookies } from './middleware/debugCookie';
import logger from './utils/Logger';
import ApiResponder from './utils/ApiResponder';
import type { Response, Request, NextFunction } from 'express';
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
app.use('/api', authRoutes);
app.use('/api', invoiceRoutes);
app.use('/api', supplierRoute);
app.use('/api', settingsRoute);
app.use('/api', searchRoute);

// Route de test
app.get('/api/health', (_req, res) => {
    res.json({ status: 'OK', message: 'Serveur fonctionnel' });
});

// Gestion des erreurs globaux
app.use((err: Error, req: Request, res: Response) => {
    logger.error('Erreur non gérée', { error: err.message, stack: err.stack});
    ApiResponder.error(res, err);
});

export default app;