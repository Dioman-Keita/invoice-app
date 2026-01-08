import database from "../config/database";

export interface DBErrorLogParams {
    level?: 'ERROR' | 'WARN' | 'CRITICAL';
    message: string;
    error?: any;
    context?: any;
    path?: string;
    user_id?: string;
}

/**
 * Service to persist error logs in the database
 */
export class DBLogger {
    /**
     * Logs an error in the system_error_log table
     */
    static async log(message: string, meta?: any): Promise<void> {
        try {
            const level = meta?.level || 'ERROR';
            const stack = meta?.error instanceof Error ? meta.error.stack : (meta?.stack || null);

            // Extract contextual fields from meta
            const context = { ...meta };
            const path = meta?.path || meta?.url || null;
            const user_id = meta?.userId || meta?.user_id || null;

            // Remove large objects from context to avoid saturating the DB
            if (context.error) delete context.error;
            if (context.stack) delete context.stack;

            await database.execute(
                "INSERT INTO system_error_log(level, message, stack, context, path, user_id) VALUES(?,?,?,?,?,?)",
                [
                    level,
                    message,
                    stack,
                    JSON.stringify(context),
                    path,
                    user_id
                ]
            );
        } catch (dbError) {
            // Use console.error instead of logger.error to avoid infinite loop
            console.error('❌ Failed to persist log in DB:', dbError);
        }
    }
}
