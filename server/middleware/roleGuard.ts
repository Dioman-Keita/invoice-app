import type { Response, Request, NextFunction } from 'express';
import ApiResponder from '../utils/ApiResponder';
import logger from '../utils/Logger';
import { AuthenticatedRequest } from '../types/express/request';
import { UserDto } from '../types/dto/UserDto';

// Types de rôles autorisés
type AllowedRole = 'admin' | 'invoice_manager' | 'dfc_agent';

// Fonction pour créer un middleware de vérification de rôle
export function requireRole(allowedRoles: AllowedRole[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const requestId = req.headers['x-request-id'] || 'unknown';
        
        try {
            // Récupérer l'utilisateur depuis req.user (peuplé par authGuard)
            const user = req.user;
            
            if (!user) {
                logger.warn(`[${requestId}] Tentative d'accès sans utilisateur authentifié`);
                return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
            }

            // Vérifier si le rôle de l'utilisateur est autorisé
            if (!allowedRoles.includes(user.role as AllowedRole)) {
                logger.warn(`[${requestId}] Accès refusé - rôle insuffisant`, { 
                    userRole: user.role, 
                    allowedRoles,
                    userId: user.sup 
                });
                return ApiResponder.forbidden(res, 'Accès refusé - permissions insuffisantes');
            }

            logger.debug(`[${requestId}] Accès autorisé`, { 
                userRole: user.role, 
                userId: user.sup 
            });

            next();
        } catch (error) {
            logger.error(`[${requestId}] Erreur lors de la vérification des rôles`, { 
                error: error instanceof Error ? error.message : 'Erreur inconnue' 
            });
            return ApiResponder.error(res, error);
        }
    };
}

// Middlewares prédéfinis pour les rôles courants
export const requireAdmin = requireRole(['admin']);
export const requireManagerOrAdmin = requireRole(['admin', 'invoice_manager']);
export const requireAgentOrManager = requireRole(['dfc_agent', 'invoice_manager', 'admin']);
export const requireAnyRole = requireRole(['admin', 'invoice_manager', 'dfc_agent']);

// Fonction utilitaire pour vérifier les permissions dans les contrôleurs
export function hasRole(user: UserDto, allowedRoles: AllowedRole[]): boolean {
    return user && allowedRoles.includes(user.role as AllowedRole);
}

// Fonctions utilitaires spécifiques
export function isAdmin(user: UserDto): boolean {
    return hasRole(user, ['admin']);
}

export function isManagerOrAdmin(user: UserDto): boolean {
    return hasRole(user, ['admin', 'invoice_manager']);
}

export function canAccessInvoice(user: UserDto, invoiceOwnerId: string): boolean {
    return isAdmin(user) || user.sup === invoiceOwnerId;
}

export default { 
    requireRole, 
    requireAdmin, 
    requireManagerOrAdmin, 
    requireAgentOrManager, 
    requireAnyRole,
    hasRole,
    isAdmin,
    isManagerOrAdmin,
    canAccessInvoice
};
