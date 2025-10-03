import express from 'express';
import authGuard from '../middleware/authGuard';
import { 
  createInvoice, 
  deleteInvoice, 
  getInvoice, 
  getUserInvoices, 
  updateInvoice 
} from '../controllers/invoice.controller';
import { requireAdmin, requireAgentOrManager, requireManagerOrAdmin } from '../middleware/roleGuard';

const router = express.Router();

// Toutes les routes de factures nécessitent une authentification
router.use(authGuard);

// Routes protégées
router.post('/invoices', requireAgentOrManager, createInvoice);              // POST /invoices - Créer une facture
router.post('/invoices/update/:id', requireManagerOrAdmin, updateInvoice);   // POST /invoices/update/:id - Mettre à jour une facture
router.post('/invoices/delete/:id', requireAdmin, deleteInvoice);            // POST /invoices/delete/:id - Supprimer une facture
router.get('/invoices', requireAgentOrManager, getUserInvoices);             // GET /invoices - Lister les factures
router.get('/invoices/:id', requireAgentOrManager, getInvoice);              // GET /invoices/:id - Récupérer une facture spécifique

export default router;