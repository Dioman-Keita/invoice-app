import express from 'express';
import authGuard from '../middleware/authGuard';
import { requireAdmin, requireRole } from '../middleware/roleGuard';
import {
  createRoleMigrationRequest,
  listRoleMigrationRequests,
  roleMigrationStats,
  getRoleMigrationRequest,
  approveRoleMigrationRequest,
  rejectRoleMigrationRequest,
} from '../controllers/migration.controller';

const router = express.Router();
router.use(authGuard);

// Soumission par un utilisateur authentifié (dfc_agent ou invoice_manager)
// Soumission par un utilisateur authentifié (dfc_agent ou invoice_manager)
router.post('/request', requireRole(['dfc_agent', 'invoice_manager', 'admin']), createRoleMigrationRequest);

// Lecture et actions côté admin seulement
router.get('/requests', requireAdmin, listRoleMigrationRequests);
router.get('/stats', requireAdmin, roleMigrationStats);
router.get('/requests/:id', requireAdmin, getRoleMigrationRequest);
router.post('/requests/:id/approve', requireAdmin, approveRoleMigrationRequest);
router.post('/requests/:id/reject', requireAdmin, rejectRoleMigrationRequest);

export default router;
