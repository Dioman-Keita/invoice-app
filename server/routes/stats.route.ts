import express from 'express';
import authGuard from '../middleware/authGuard';
import { requireAdmin, requireAgentOrManager } from '../middleware/roleGuard';
import {
  getInvoicesSummary,
  getDfcOverview,
  getInvoicesByEmployee,
  getInvoicesByEmployeeTimeseries,
  getDfcAgentsRates,
  getDfcAgentTimeseries,
  getSuppliersCreatedSummary,
  getSuppliersCreatedByEmployee,
  getSuppliersCreatedByEmployeeTimeseries,
  getSuppliersActivity as getSuppliersOverview,
  getSupplierSummary,
  getSuppliersTop,
  getGlobalDashboardKpis,
  getPersonalStats,
  getAllAgentsStats
} from '../controllers/stats.controller';

const router = express.Router();
router.use(authGuard);

// KPIs (admin)
router.get('/stats/dashboard/kpis', requireAgentOrManager, getGlobalDashboardKpis);

// Invoices (invoice_manager/admin)
router.get('/stats/invoices/summary', requireAgentOrManager, getInvoicesSummary);
router.get('/stats/invoices/by-employee', requireAgentOrManager, getInvoicesByEmployee);
router.get('/stats/invoices/by-employee/:id/timeseries', requireAgentOrManager, getInvoicesByEmployeeTimeseries);

// DFC (dfc_agent / invoice_manager / admin)
router.get('/stats/dfc/overview', requireAgentOrManager, getDfcOverview);
router.get('/stats/dfc/agents/rates', requireAgentOrManager, getDfcAgentsRates);
router.get('/stats/dfc/agents/:id/timeseries', requireAgentOrManager, getDfcAgentTimeseries);

// Suppliers created
router.get('/stats/suppliers/created/summary', requireAgentOrManager, getSuppliersCreatedSummary);
router.get('/stats/suppliers/created/by-employee', requireAgentOrManager, getSuppliersCreatedByEmployee);
router.get('/stats/suppliers/created/by-employee/:id/timeseries', requireAgentOrManager, getSuppliersCreatedByEmployeeTimeseries);

// Suppliers activity
router.get('/stats/suppliers/activity', requireAgentOrManager, getSuppliersOverview);
router.get('/stats/suppliers/:id/summary', requireAgentOrManager, getSupplierSummary);
router.get('/stats/suppliers/top', requireAgentOrManager, getSuppliersTop);

// Personal stats
router.get('/stats/personal', requireAgentOrManager, getPersonalStats);
router.get('/stats/agents', requireAdmin, getAllAgentsStats);

export default router;