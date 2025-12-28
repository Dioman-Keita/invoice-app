import express from 'express';
import authGuard from '../middleware/authGuard';
import { requireAdmin } from '../middleware/roleGuard';
import { SystemController } from '../controllers/system.controller';

const router = express.Router();

// Protection globale : Authentification + Admin
router.use(authGuard);
router.use(requireAdmin);

// Routes pour les logs système
router.get('/logs', SystemController.getErrorLogs);
router.delete('/logs', SystemController.clearLogs);

export default router;
