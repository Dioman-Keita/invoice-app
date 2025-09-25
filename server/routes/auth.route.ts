import express from "express";
import { isValidEmail, isValidPassword } from "../middleware/validator";
import { createUser, login, getCurrentToken, verifyResetToken, forgotPassword, logout, resetUserPassword, verifyRegistrationToken, getUserProfil, silentRefresh } from "../controllers/user.controller";
import authGuard from "../middleware/authGuard";
import { requireAdmin } from "../middleware/roleGuard";
import ApiResponder from "../utils/ApiResponder";
import { checkAuthStatus } from "../controllers/auth.controller";
const router = express.Router();

router.post('/auth/register', (req, res, next) => {
    const { email, terms } = req.body;
    if (!email || !isValidEmail(email)) {
        return ApiResponder.badRequest(res, "Email invalide");
    }
    if (!isValidPassword(req)) {
        return ApiResponder.badRequest(res, "Les mots de passe ne correspondent pas");
    }
    if(!terms) {
        return ApiResponder.badRequest(res, "L'acceptation des conditions d'utilisation est obligatoire");
    }
    createUser(req, res);
})
router.post('/auth/login', login);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetUserPassword);
router.post('/auth/logout', logout);
router.post('/auth/verify-registration-token', verifyRegistrationToken);
router.post('/auth/silent-refresh', silentRefresh);
router.get('/auth/verify-user-reset-token', verifyResetToken);
router.get('/auth/token', getCurrentToken);
router.get('/auth/profil', authGuard, authGuard, getUserProfil);
router.get('/auth/status', authGuard, checkAuthStatus);
// Route admin pour créer des utilisateurs (nécessite le rôle admin)
router.post('/auth/admin/create-user', authGuard, requireAdmin, createUser);

export default router;