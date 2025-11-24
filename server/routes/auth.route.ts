import express from "express";
import { isValidEmail } from "../middleware/validator";
import { createUser, login, getCurrentToken, forgotPassword, logout, resetUserPassword, verifyRegistrationToken, getUserProfil, silentRefresh, resendVerificationEmail } from "../controllers/user.controller";
import authGuard from "../middleware/authGuard";
import { requireAdmin } from "../middleware/roleGuard";
import ApiResponder from "../utils/ApiResponder";
import { autoTrackActivity } from "../middleware/autoTrackActivity";
import { checkAuthStatus } from "../controllers/auth.controller";

const router = express.Router();

router.post('/auth/register', (req, res) => {
    const { email, terms } = req.body;
    if (!email || !isValidEmail(email)) {
        return ApiResponder.badRequest(res, "Email invalide");
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
router.post('/auth/resend-verification', resendVerificationEmail);
router.post('/auth/silent-refresh', authGuard, silentRefresh);
router.get('/auth/token', getCurrentToken);
router.get('/auth/profile', authGuard, autoTrackActivity('VIEW_PROFILE'), getUserProfil);
router.get('/auth/status', authGuard, autoTrackActivity('REFRESH_PROFILE'), checkAuthStatus);

// Route admin pour créer des utilisateurs (nécessite le rôle admin)
router.post('/auth/admin/create-user', authGuard, requireAdmin, createUser);

export default router;