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

// --------------- 1. FRONTEND PATH CONFIGURATION ---------------
// Link with Electron via environment variable
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

// --------------- 3. STATIC FILES (CSS, JS, IMAGES) ---------------
// Serve frontend assets before everything else
app.use(express.static(FRONTEND_PATH));

// Health Check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// --------------- 4. API ROUTES (IMPORTANT: BEFORE FRONTEND) ---------------
// Declare APIs first to ensure they are prioritized
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

// --------------- 5. FRONTEND FALLBACK ROUTE (SPA) ---------------
// CRITICAL FIX FOR EXPRESS 5: 
// Use Regex /^(.*)$/ instead of '*' which crashes Express 5
app.get(/^(.*)$/, (req, res, next) => {
    // Extra security: if it's an /api route not found above
    if (req.path.startsWith('/api')) {
        return next(); // Pass to 404 error handler
    }

    // Otherwise, return React's index.html
    res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});

// --------------- 6. ERROR HANDLING ---------------
app.use((err: Error & { type?: string; status?: number }, req: Request, res: Response, _next: NextFunction) => {
    const errorContext = {
        url: req.originalUrl,
        method: req.method,
        userId: (req as any).user?.id || (req as any).user?.sub || null,
        error: err.message,
        stack: err.stack
    };

    // Handle malformed JSON
    if (err?.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400)) {
        logger.error('JSON parsing error', errorContext);
        return ApiResponder.badRequest(res, 'Invalid JSON request');
    }

    // Generic error handler
    logger.error('Unhandled error', errorContext);
    return ApiResponder.error(res, err);
});

export { app };
export default app;