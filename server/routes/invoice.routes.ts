import express from 'express';
import authGuard from '../middleware/authGuard';
import { createInvoice, getInvoice, getUserInvoices } from '../controllers/invoice.controller';
import { canAccessInvoice, requireAdmin, requireAgentOrManager } from '../middleware/roleGuard';

const router = express.Router();

// Toutes les routes de factures nécessitent une authentification
router.use(authGuard);

// Routes protégées
router.post('/invoices', authGuard, requireAgentOrManager, createInvoice);           // Créer une facture
router.get('/invoices', authGuard, requireAdmin, getUserInvoices);          // Lister les factures de l'utilisateur
router.get('/invoices/:id', authGuard, getInvoice);           // Récupérer une facture spécifique

export default router;
