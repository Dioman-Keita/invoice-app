import express from 'express';
import authGuard from '../middleware/authGuard';
import { requireAdmin } from '../middleware/roleGuard';
import { listUsers, getUser, updateUser, deleteUser, disableUser, enableUser, verifyUserEmail } from '../controllers/users.controller';
import { createUser } from '../controllers/user.controller';

const router = express.Router();
router.use(authGuard);

// Toutes les routes utilisateurs sont protégées et nécessitent le rôle admin
router.use(requireAdmin);

// Listing avec filtres et pagination
router.get('/users', listUsers);

// Détail
router.get('/users/:id', getUser);

// Création (réutilise createUser existant)
router.post('/users', createUser);

// Mise à jour
router.put('/users/:id', updateUser);

// Suppression
router.delete('/users/:id', deleteUser);

// Actions explicites
router.post('/users/:id/disable', disableUser);
router.post('/users/:id/enable', enableUser);
router.post('/users/:id/verify', verifyUserEmail);

export default router;
