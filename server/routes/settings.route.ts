import express from 'express';
import authGuard from '../middleware/authGuard';
import { requireAdmin } from '../middleware/roleGuard';
import { getFiscalSettingsInfo, setAutoYearSwitch, manualFiscalYearSwitch } from '../controllers/settings.controller';

const router = express.Router();

router.use(authGuard);

// Lire les informations complètes de configuration fiscale
router.get('/settings/fiscal', getFiscalSettingsInfo);

// Activer/Désactiver l'auto switch (manager/admin)
router.post('/settings/auto-year-switch', requireAdmin, setAutoYearSwitch);

// Bascule manuelle d'année fiscale (manager/admin) - refusée si auto activé côté service
router.post('/settings/fiscal-year/switch', requireAdmin, manualFiscalYearSwitch);

export default router;
