import type { ActivityType } from "../services/userToken";
import database, { DatabaseInstance } from "../config/database";
import logger from "./Logger";
import { auditLog } from "./auditLogger";

type ActivityTimeType = number;

export interface UserActivity {
    track(activityName: ActivityType, userId: string): Promise<boolean>;
    getUserLastActivity(userId: string): Promise<ActivityTimeType | null>;
    getTimeUntilExpirity(userId: string): Promise<ActivityTimeType | null>;
    deleteUserActivity(userId: string): Promise<boolean>;
}

export class ActivityTracker implements UserActivity {
    private readonly inactivityThreshold: number;
    private readonly rememberMe: boolean;
    private database: DatabaseInstance = database;

    public constructor(
        inactivityThreshold: number | undefined = undefined, 
        rememberMe: boolean = false
    ) {
        this.rememberMe = rememberMe;
        this.inactivityThreshold = inactivityThreshold !== undefined 
            ? inactivityThreshold 
            : this.rememberMe 
                ? 30 * 60 * 1000  // 30 minutes
                : 5 * 60 * 1000;  // 5 minutes
    }

    async track(activityName: ActivityType, userId: string): Promise<boolean> {
        const now = Date.now();
        
        try {
            await this.database.execute(
                "INSERT INTO user_activity (user_id, name, created_at) VALUES (?, ?, ?)",
                [userId, activityName, now]
            );

            await auditLog({
                table_name: 'user_activity',
                action: 'INSERT',
                record_id: userId,
                performed_by: userId,
                description: `Activité ${activityName} enregistrée pour l'utilisateur ${userId}`
            });

            logger.debug(`Activité trackée avec succès`, {
                userId,
                activity: activityName,
                timestamp: now
            });

            return true;
            
        } catch (error) {
            logger.error(`Erreur lors de l'enregistrement de l'activité`, {
                userId,
                activity: activityName,
                error: error instanceof Error ? error.message : 'unknown',
                stack: error instanceof Error ? error.stack : 'unknown stack'
            });
            return false;
        }
    }

    async getUserLastActivity(userId: string): Promise<ActivityTimeType | null> {
        try {
            const result = await this.database.execute(
                "SELECT created_at FROM user_activity WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
                [userId]
            );
            
            if (Array.isArray(result) && result.length > 0 && result[0].created_at) {
                return result[0].created_at as ActivityTimeType;
            }
            return null;
            
        } catch (error) {
            logger.error('Erreur récupération dernière activité', { 
                userId, 
                error: error instanceof Error ? error.message : 'unknown',
                stack: error instanceof Error ? error.stack : 'unknown stack' 
            });
            return null;
        }
    }

    async getTimeUntilExpirity(userId: string): Promise<ActivityTimeType | null> {
        try {
            const lastActivity = await this.getUserLastActivity(userId);
            const now = Date.now();

            if (!lastActivity) {
                return null;
            }

            const timeSinceLastActivity = now - lastActivity;

            if (timeSinceLastActivity > this.inactivityThreshold) {
                return 0;
            }
            
            return this.inactivityThreshold - timeSinceLastActivity;
            
        } catch (error) {
            logger.error('Erreur calcul temps expiration', { 
                userId, 
                error: error instanceof Error ? error.message : 'unknown' 
            });
            return null;
        }
    }

    async deleteUserActivity(userId: string): Promise<boolean> {
        try {
            await this.database.execute(
                "DELETE FROM user_activity WHERE user_id = ?",
                [userId]
            );
            
            await auditLog({
                table_name: 'user_activity',
                action: 'DELETE',
                record_id: userId,
                performed_by: userId,
                description: `Suppression de l'activité de l'utilisateur ${userId}`
            });
            
            return true;
            
        } catch (error) {
            logger.error(`Erreur suppression activité utilisateur`, {
                userId,
                error: error instanceof Error ? error.message : 'unknown'
            });
            return false;
        }
    }
}

// Instance par défaut
const activityTracker = new ActivityTracker();
export default activityTracker;