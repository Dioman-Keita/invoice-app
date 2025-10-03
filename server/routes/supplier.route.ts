import express from "express";
import { 
  createSupplier, 
  deleteSupplierById, 
  getSupplier, 
  listSuppliers, 
  findSupplierByPhone 
} from "../controllers/supplier.controller";
import { requireAdmin, requireAgentOrManager, requireManagerOrAdmin } from "../middleware/roleGuard";
import authGuard from "../middleware/authGuard";

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authGuard);

// Routes avec 'supplier' au début
router.post('/supplier', requireManagerOrAdmin, createSupplier);                    // POST /supplier - Créer un fournisseur
router.get('/supplier', requireAgentOrManager, listSuppliers);                     // GET /supplier - Lister tous les fournisseurs
router.get('/supplier/search', requireAgentOrManager, findSupplierByPhone);        // GET /supplier/search?phone=... - Recherche par téléphone
router.get('/supplier/:id', requireAgentOrManager, getSupplier);                   // GET /supplier/:id - Récupérer un fournisseur spécifique
router.post('/supplier/delete/:id', requireAdmin, deleteSupplierById);             // POST /supplier/delete/:id - Supprimer un fournisseur (simulation DELETE)

export default router;