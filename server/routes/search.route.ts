import express from 'express';
import authGuard from '../middleware/authGuard';
import { requireAgentOrManager } from '../middleware/roleGuard';
import { advancedInvoiceSearch, advancedSupplierSearch, relationalSearch, advancedExport, getFiscalYears, getExportHistory, exportInvoiceOverview, exportSupplierOverview, exportGroupedOverview } from '../controllers/search.controller';

const router = express.Router();

router.use(authGuard);

// Advanced searches
router.get('/search/invoices', requireAgentOrManager, advancedInvoiceSearch);
router.get('/search/suppliers', requireAgentOrManager, advancedSupplierSearch);
router.get('/search/relational', requireAgentOrManager, relationalSearch);

// Fiscal years
router.get('/fiscal-years', requireAgentOrManager, getFiscalYears);

// Export history
router.get('/export/history', requireAgentOrManager, getExportHistory);

// Export
router.get('/export/advanced', requireAgentOrManager, advancedExport);

// ✅ AJOUT : Routes spécifiques pour les overviews
router.get('/export/invoice/:id', requireAgentOrManager, exportInvoiceOverview);
router.get('/export/supplier/:id', requireAgentOrManager, exportSupplierOverview);
router.get('/export/grouped/:supplierId', requireAgentOrManager, exportGroupedOverview);

export default router;
