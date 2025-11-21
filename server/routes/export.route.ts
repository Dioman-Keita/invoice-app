import { Router } from 'express';
import { exportData } from '../controllers/export.controller';

const router = Router();

router.post('/export', exportData);

export default router;
