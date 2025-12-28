import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import path from 'path';

import invoiceRoutes from './routes/invoice.routes';
import authRoutes from './routes/auth.route';
import supplierRoute from './routes/supplier.route';
import settingsRoute from './routes/settings.route';
import searchRoute from './routes/search.route';
import exportRoute from './routes/export.route';
import statsRoute from './routes/stats.route';
import usersRoute from './routes/users.route';
import migrationRoutes from './routes/migration.route';
import systemRoutes from './routes/system.route';

import { requestIdMiddleware } from './middleware/requestIdMiddleware';
import { debugCookies } from './middleware/debugCookie';
import logger from './utils/Logger';
import ApiResponder from './utils/ApiResponder';

import type { Response, Request, NextFunction } from 'express';

const app = express();

// --------------- 1. CONFIGURATION CHEMIN FRONTEND ---------------
// C'est ici que le lien avec Electron se fait (via la variable d'env)
const FRONTEND_PATH = process.env.CLIENT_DIST_PATH || path.join(__dirname, '..', 'client', 'dist');

console.log('📂 EXPRESS SERVING FRONTEND FROM:', FRONTEND_PATH);

// --------------- 2. CORS & MIDDLEWARES ---------------
const corsOptions = {
    origin: (_origin: string | undefined, callback: Function) => {
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-request-id']
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(requestIdMiddleware);

if (process.env.NODE_ENV === 'development') {
    app.use(debugCookies);
}

// --------------- 3. FICHIERS STATIQUES (CSS, JS, IMAGES) ---------------
// Servir les assets du frontend avant tout le reste
app.use(express.static(FRONTEND_PATH));

// Health Check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'OK', message: 'Serveur fonctionnel' });
});

// --------------- 4. ROUTES API (IMPORTANT : AVANT LE FRONTEND) ---------------
// On déclare les API avant pour être sûr qu'elles soient prioritaires
app.use('/api/migration', migrationRoutes);
app.use('/api', authRoutes);
app.use('/api', invoiceRoutes);
app.use('/api', supplierRoute);
app.use('/api', settingsRoute);
app.use('/api', searchRoute);
app.use('/api', exportRoute);
app.use('/api', statsRoute);
app.use('/api', usersRoute);
app.use('/api/system', systemRoutes);

// --------------- 5. ROUTE FALLBACK FRONTEND (SPA) ---------------
// C'EST LA CORRECTION CRITIQUE POUR EXPRESS 5
// On utilise une Regex /^(.*)$/ au lieu de '*' qui fait crasher Express 5
app.get(/^(.*)$/, (req, res, next) => {
    // Sécurité supplémentaire : si c'est une route /api qui n'a pas été trouvée plus haut
    if (req.path.startsWith('/api')) {
        return next(); // On passe au gestionnaire d'erreur 404
    }

    // Sinon, on renvoie l'index.html de React
    res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});

// --------------- 6. GESTION DES ERREURS ---------------
app.use((err: Error & { type?: string; status?: number }, req: Request, res: Response, _next: NextFunction) => {
    const errorContext = {
        url: req.originalUrl,
        method: req.method,
        userId: (req as any).user?.id || (req as any).user?.sub || null,
        error: err.message,
        stack: err.stack
    };

    // Gestion spécifique JSON malformé
    if (err?.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400)) {
        logger.error('Erreur de parsing JSON', errorContext);
        return ApiResponder.badRequest(res, 'Requête JSON invalide');
    }

    // Gestion générique
    logger.error('Erreur non gérée', errorContext);
    return ApiResponder.error(res, err);
});

export { app };
export default app;