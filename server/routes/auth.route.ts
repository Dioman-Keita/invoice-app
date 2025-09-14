import express from "express";
import { isValidEmail, isValidPassword } from "../middleware/validator";
import { createUser, login, getCurrentToken, verifyResetToken, forgotPassword, getCurrentUser } from "../controllers/user.controller";
import authGuard from "../middleware/authGuard";
import { requireAdmin } from "../middleware/roleGuard";
import ApiResponder from "../utils/ApiResponder";
const router = express.Router();

router.post('/auth/register', (req, res, next) => {
    const { email } = req.body.email || {};
    if (!email || !isValidEmail(email)) {
        return ApiResponder.badRequest(res, "Email invalide");
    }
    if (!isValidPassword(req)) {
        return ApiResponder.badRequest(res, "Les mots de passe ne correspondent pas");
    }
    createUser(req, res);
    return next();
})
router.post('/auth/login', login);
router.post('/auth/forgot-password', forgotPassword);
router.get('/auth/verify-user-reset-token', verifyResetToken);
router.post('/auth/reset-password');
router.get('/auth/token', getCurrentToken);
router.get('/auth/me', authGuard, getCurrentUser);

// Route admin pour créer des utilisateurs (nécessite le rôle admin)
router.post('/auth/admin/create-user', authGuard, requireAdmin, createUser);

export default router;