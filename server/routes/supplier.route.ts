import express from "express";
import { 
  createSupplier, 
  deleteSupplierById, 
  getSupplier, 
  listSuppliers, 
  findSupplierByPhone, 
  searchSuppliers,
  getSupplierByAnyField,
  findSupplierConflicts
} from "../controllers/supplier.controller";
import { requireAdmin, requireAgentOrManager, requireManagerOrAdmin } from "../middleware/roleGuard";
import authGuard from "../middleware/authGuard";

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authGuard);

// Routes avec 'supplier' au début
router.post('/supplier', requireManagerOrAdmin, createSupplier);  
router.post('/supplier/delete/:id', requireAdmin, deleteSupplierById);             // POST /supplier/delete/:id - Supprimer un fournisseur (simulation DELETE)                  // POST /supplier - Créer un fournisseur
router.get('/supplier', requireAgentOrManager, listSuppliers);                     // GET /supplier - Lister tous les fournisseurs
router.get('/supplier/phone', requireAgentOrManager, findSupplierByPhone);        // GET /supplier/search?phone=... - Recherche par téléphone
router.get('/supplier/:id', requireAgentOrManager, getSupplier);                   // GET /supplier/:id - Récupérer un fournisseur spécifique
router.get('/suppliers/search', requireManagerOrAdmin, searchSuppliers);          // GET /api/suppliers/search?field=name&value=ABC
router.get('/suppliers/find', requireManagerOrAdmin, getSupplierByAnyField);      // GET /api/suppliers/find?name=ABC&account_number=123...
router.get('/suppliers/verify-conflicts', requireAgentOrManager, findSupplierConflicts) // GET /api/suppliers/verify-conflicts?accont_number=09993993&phone=+223332233

export default router;