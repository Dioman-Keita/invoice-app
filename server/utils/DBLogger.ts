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
 * Service pour persister les logs d'erreur en base de données
 */
export class DBLogger {
    /**
     * Enregistre une erreur dans la table system_error_log
     */
    static async log(message: string, meta?: any): Promise<void> {
        try {
            const level = meta?.level || 'ERROR';
            const stack = meta?.error instanceof Error ? meta.error.stack : (meta?.stack || null);

            // On extrait d'éventuels champs contextuels du meta
            const context = { ...meta };
            const path = meta?.path || meta?.url || null;
            const user_id = meta?.userId || meta?.user_id || null;

            // Supprimer les gros objets du contexte pour éviter de saturer la DB
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
            // On utilise console.error au lieu de logger.error pour éviter une boucle infinie
            console.error('❌ Échec de la persistance du log en DB:', dbError);
        }
    }
}
