import type { Request, Response, NextFunction } from 'express';

const userActivity = new Map<string, number>();

export function trackUserActivity(req: Request, _res: Response, next: NextFunction) {
    const user = (req as any).user;

    if (user && user.sup) {
        userActivity.set(user.sup, Date.now());
        (req as any).lastActivity = userActivity.get(user.sup);
    }

    next();
}

export function getUserLastActivity(userId: string): number | undefined {
    return userActivity.get(userId);
}

export function cleanupUserActivity(userId: string): boolean {
    if (userActivity.has(userId)) {
        userActivity.delete(userId);
        console.log(`🔐 Activité nettoyée pour l'utilisateur: ${userId}`);
        return true;
    }
    return false;
}

export function cleanupInactiveUsers(maxInactivity: number = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    for (const [userId, lastActivity] of userActivity) {
        if (now - lastActivity > maxInactivity) {
            userActivity.delete(userId);
        }
    }
}

export function getTimeUntilExpirity(
    userId: string,
    rememberMe: boolean = false,
    maxInactivity?: number
): number | null {
    const lastActivity = getUserLastActivity(userId);
    const now = Date.now();

    if (!lastActivity) {
        return null;
    }

    const inactivityThreshold = maxInactivity !== undefined
    ? maxInactivity
    : rememberMe 
    ? 30 * 60 * 1000 // 39 min
    : 5 * 60 * 1000; // 5 min

    const timeSinceLastActivity = now - lastActivity

    if (timeSinceLastActivity > inactivityThreshold) {
        return null;
    }
    return inactivityThreshold - timeSinceLastActivity;
}

setInterval(cleanupInactiveUsers, 60 * 60 * 1000) // periodique clean