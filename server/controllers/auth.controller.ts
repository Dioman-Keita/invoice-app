// controllers/authController.ts
import type { Response, Request } from "express";
import ApiResponder from "../utils/ApiResponder";
import { getTimeUntilExpirity } from "../middleware/activityTracker";

export async function checkAuthStatus(req: Request, res: Response): Promise<Response> {
    try {
        const user = (req as any).user;
        const rememberMe = req.cookies.rememberMe === 'true'
        console.log('🔐 checkAuthStatus - user object:', user); // Debug
        
        if (!user) {
            return ApiResponder.success(res, { 
                isAuthenticated: false,
                user: null 
            }, 'Utilisateur non authentifié');
        }

        // Vérifiez la structure de l'objet user
        const userId = user.sup;
        const userEmail = user.email;
        const userRole = user.role;

        if (!userId || !userEmail || !userRole) {
            console.error('❌ User object missing required fields:', user);
            return ApiResponder.success(res, { 
                isAuthenticated: false,
                user: null 
            }, 'Données utilisateur incomplètes');
        }

        const timeUntilExpirity = getTimeUntilExpirity(userId, rememberMe);
        const shouldRefresh = timeUntilExpirity !== null && timeUntilExpirity < 15 * 60 * 1000 // 15 min

        return ApiResponder.success(res, {
            isAuthenticated: true,
            user: {
                id: userId,
                email: userEmail,
                role: userRole
            },
            shouldRefresh: shouldRefresh,
            expiresIn: timeUntilExpirity,
            rememberMe: rememberMe,
        }, 'Utilisateur authentifié');

    } catch (error) {
        console.error('❌ checkAuthStatus error:', error);
        return ApiResponder.error(res, error, 'Erreur lors de la vérification du statut');
    }
}