import type { Response, Request } from "express";
import ApiResponder from "../utils/ApiResponder";
import { ActivityTracker } from "../utils/ActivityTracker";

export async function checkAuthStatus(req: Request, res: Response): Promise<Response> {
    try {
        const user = (req as any).user;
        const rememberMe = req.cookies.rememberMe === 'true'
        const activityTracker = new ActivityTracker(undefined, rememberMe);
        console.log('🔐 checkAuthStatus - user object:', user); // Debug
        
        if (!user) {
            return ApiResponder.success(res, { 
                isAuthenticated: false,
                user: null 
            }, 'Utilisateur non authentifié');
        }


        const userId = user.sup;
        const userEmail = user.email;
        const userRole = user.role;
        const activity = user.activity || 'VIEW_PROFILE';

        if (!userId || !userEmail || !userRole || !activity) {
            console.error('❌ User object missing required fields:', user);
            return ApiResponder.success(res, { 
                isAuthenticated: false,
                user: null 
            }, 'Données utilisateur incomplètes');
        }

        const timeUntilExpirity = await activityTracker.getTimeUntilExpirity(userId);
        const shouldRefresh = timeUntilExpirity !== null && timeUntilExpirity < 15 * 60 * 1000 // 15 min

        return ApiResponder.success(res, {
            isAuthenticated: true,
            user: {
                id: userId,
                email: userEmail,
                role: userRole,
                userActivity: activity
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