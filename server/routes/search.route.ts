import express from 'express';
import authGuard from '../middleware/authGuard';
import { requireAgentOrManager } from '../middleware/roleGuard';
import { advancedInvoiceSearch, advancedSupplierSearch, relationalSearch, getFiscalYears, getExportHistory } from '../controllers/search.controller';

const router = express.Router();

router.use(authGuard);

// Advanced searches
router.get('/search/invoices', requireAgentOrManager, advancedInvoiceSearch);
router.get('/search/suppliers', requireAgentOrManager, advancedSupplierSearch);
router.get('/search/relational', requireAgentOrManager, relationalSearch);

// Fiscal years
router.get('/fiscal-years', requireAgentOrManager, getFiscalYears);

// Export history (gardé ici car lié à la recherche)
router.get('/export/history', requireAgentOrManager, getExportHistory);

export default router;
