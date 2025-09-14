import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express';
import authRoutes from './routes/auth.route';
import invoiceRoutes from './routes/invoice.routes';
import { requestIdMiddleware } from './middleware/requesrIdMiddleware';

const app = express();

// Middlewares globaux
app.use(cors({ origin: 'http://localhost:5173', credentials: true}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);

// Montage des routes
app.use('/api', authRoutes);        // /api/auth/*
app.use('/api', invoiceRoutes);     // /api/invoices/*

// Route de test
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Serveur fonctionnel' });
});

export default app;