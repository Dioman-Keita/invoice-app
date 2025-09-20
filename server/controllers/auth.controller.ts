// controllers/authController.ts
import type { Response, Request } from "express";
import ApiResponder from "../utils/ApiResponder";

export async function checkAuthStatus(req: Request, res: Response): Promise<Response> {
    try {
        const user = (req as any).user;
        
        console.log('🔐 checkAuthStatus - user object:', user); // Debug
        
        if (!user) {
            return ApiResponder.success(res, { 
                isAuthenticated: false,
                user: null 
            }, 'Utilisateur non authentifié');
        }

        // Vérifiez la structure de l'objet user
        const userId = user.sup || user.id || user.userId;
        const userEmail = user.email;
        const userRole = user.role;

        if (!userId || !userEmail || !userRole) {
            console.error('❌ User object missing required fields:', user);
            return ApiResponder.success(res, { 
                isAuthenticated: false,
                user: null 
            }, 'Données utilisateur incomplètes');
        }

        return ApiResponder.success(res, {
            isAuthenticated: true,
            user: {
                id: userId,
                email: userEmail,
                role: userRole
            }
        }, 'Utilisateur authentifié');

    } catch (error) {
        console.error('❌ checkAuthStatus error:', error);
        return ApiResponder.error(res, error, 'Erreur lors de la vérification du statut');
    }
}