import express from 'express';
import authGuard from '../middleware/authGuard';
import { 
  createInvoice, 
  deleteInvoice, 
  getInvoice, 
  getLastInvoiceNumber, 
  getNextInvoiceNumber, 
  getUserInvoices, 
  updateInvoice,
  getDfcPendingInvoices,
  approveDfcInvoice,
  rejectDfcInvoice 
} from '../controllers/invoice.controller';
import { requireAdmin, requireAgentOrManager, requireManagerOrAdmin } from '../middleware/roleGuard';

const router = express.Router();

// Toutes les routes de factures nécessitent une authentification
router.use(authGuard);

// Routes protégées

// GET - Routes fixes (les plus spécifiques en premier)
router.get('/invoices/last-num', requireAgentOrManager, getLastInvoiceNumber); // GET /invoices/last-num - Récupérer le numero de la derniere facture enregistrée dans le systeme
router.get('/invoices/next-num', requireManagerOrAdmin, getNextInvoiceNumber); // GET /invoices/next-num - Récupérer le prochain numero de facture attendu par le systeme
router.get('/invoices', requireAgentOrManager, getUserInvoices);             // GET /invoices - Lister les factures
router.get('/invoices/dfc/pending', requireAgentOrManager, getDfcPendingInvoices); // GET /invoices/dfc/pending - Lister factures en attente DFC année fiscale courante

// POST - Routes fixes
router.post('/invoices', requireAgentOrManager, createInvoice);              // POST /invoices - Créer une facture
router.post('/invoices/:id/dfc/approve', requireAgentOrManager, approveDfcInvoice); // POST /invoices/:id/dfc/approve - Approuver une facture DFC
router.post('/invoices/:id/dfc/reject', requireAgentOrManager, rejectDfcInvoice);   // POST /invoices/:id/dfc/reject - Rejeter une facture DFC

// Routes paramétrées (les plus génériques en dernier)
router.get('/invoices/:id', requireAgentOrManager, getInvoice);              // GET /invoices/:id - Récupérer une facture spécifique
router.post('/invoices/update/:id', requireManagerOrAdmin, updateInvoice);   // POST /invoices/update/:id - Mettre à jour une facture
router.post('/invoices/delete/:id', requireAdmin, deleteInvoice);            // POST /invoices/delete/:id - Supprimer une facture

export default router;