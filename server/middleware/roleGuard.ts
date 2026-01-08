import type { Response, Request, NextFunction } from 'express';
import ApiResponder from '../utils/ApiResponder';
import logger from '../utils/Logger';
import { AuthenticatedRequest } from '../types/express/request';
import { UserDto } from '../types/dto/UserDto';

// Allowed roles types
type AllowedRole = 'admin' | 'invoice_manager' | 'dfc_agent';

// Function to create role verification middleware
export function requireRole(allowedRoles: AllowedRole[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const requestId = req.headers['x-request-id'] || 'unknown';

        try {
            // Get user from req.user (populated by authGuard)
            const user = req.user;

            if (!user) {
                logger.warn(`[${requestId}] Access attempt without authenticated user`);
                return ApiResponder.unauthorized(res, 'Unauthenticated user');
            }

            // Check if user's role is allowed
            if (!allowedRoles.includes(user.role as AllowedRole)) {
                logger.warn(`[${requestId}] Access denied - insufficient role`, {
                    userRole: user.role,
                    allowedRoles,
                    userId: user.sup
                });
                return ApiResponder.forbidden(res, 'Access denied - insufficient permissions');
            }

            logger.debug(`[${requestId}] Access granted`, {
                userRole: user.role,
                userId: user.sup
            });

            next();
        } catch (error) {
            logger.error(`[${requestId}] Error during role verification`, {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return ApiResponder.error(res, error);
        }
    };
}

// Predefined middlewares for common roles
export const requireAdmin = requireRole(['admin']);
export const requireManagerOrAdmin = requireRole(['admin', 'invoice_manager']);
export const requireAgentOrManager = requireRole(['dfc_agent', 'invoice_manager', 'admin']);
export const requireAnyRole = requireRole(['admin', 'invoice_manager', 'dfc_agent']);

// Utility function to check permissions in controllers
export function hasRole(user: UserDto, allowedRoles: AllowedRole[]): boolean {
    return user && allowedRoles.includes(user.role as AllowedRole);
}

// Specific utility functions
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
