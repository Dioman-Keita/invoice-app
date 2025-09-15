import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express';
import authRoutes from './routes/auth.route';
import invoiceRoutes from './routes/invoice.routes';
import { requestIdMiddleware } from './middleware/requestIdMiddleware';
import logger from './utils/Logger';
import ApiResponder from './utils/ApiResponder';
import type { Response, Request, NextFunction } from 'express';

const app = express();

// Middlewares globaux
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);

// Montage des routes
app.use('/api', authRoutes);        // /api/auth/*
app.use('/api', invoiceRoutes);     // /api/invoices/*

// Route de test
app.get('/api/health', (_req, res) => {
    res.json({ status: 'OK', message: 'Serveur fonctionnel' });
});

// Gestion des erreurs globaux
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Erreur non gérée', { error: err.message, stack: err.stack});
    ApiResponder.error(res, err);
})
export default app;