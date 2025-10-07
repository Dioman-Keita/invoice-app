import express from 'express';
import authGuard from '../middleware/authGuard';
import { 
  createInvoice, 
  deleteInvoice, 
  getInvoice, 
  getLastInvoiceNumber, 
  getUserInvoices, 
  updateInvoice 
} from '../controllers/invoice.controller';
import { requireAdmin, requireAgentOrManager, requireManagerOrAdmin } from '../middleware/roleGuard';

const router = express.Router();

// Toutes les routes de factures nécessitent une authentification
router.use(authGuard);

// Routes protégées

// GET - Routes fixes (les plus spécifiques en premier)
router.get('/invoices/last-invoice-num', requireAgentOrManager, getLastInvoiceNumber); // GET /invoices/last-invoice-num - Récupérer le numero de la derniere facture enregistrée dans le systeme
router.get('/invoices', requireAgentOrManager, getUserInvoices);             // GET /invoices - Lister les factures

// POST - Routes fixes
router.post('/invoices', requireAgentOrManager, createInvoice);              // POST /invoices - Créer une facture

// Routes paramétrées (les plus génériques en dernier)
router.get('/invoices/:id', requireAgentOrManager, getInvoice);              // GET /invoices/:id - Récupérer une facture spécifique
router.post('/invoices/update/:id', requireManagerOrAdmin, updateInvoice);   // POST /invoices/update/:id - Mettre à jour une facture
router.post('/invoices/delete/:id', requireAdmin, deleteInvoice);            // POST /invoices/delete/:id - Supprimer une facture

export default router;