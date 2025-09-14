import express from 'express';
import authGuard from '../middleware/authGuard';
import { createInvoice, getInvoice, getUserInvoices } from '../controllers/invoice.controller';

const router = express.Router();

// Toutes les routes de factures nécessitent une authentification
router.use(authGuard);

// Routes protégées
router.post('/invoices', createInvoice);           // Créer une facture
router.get('/invoices', getUserInvoices);          // Lister les factures de l'utilisateur
router.get('/invoices/:id', getInvoice);           // Récupérer une facture spécifique

export default router;
