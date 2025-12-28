import database from "../config/database";
import logger from "../utils/Logger";

/**
 * Nombre de jours de rétention des logs (par défaut 30 jours)
 */
function daysToKeep(): number {
    const v = Number(process.env.LOGS_RETENTION_DAYS);
    return Number.isFinite(v) && v > 0 ? v : 30;
}

/**
 * Démarre le job de nettoyage automatique des logs (Audit, Erreurs, Exports)
 * S'exécute une fois toutes les 24 heures.
 */
export function startCleanupLogsJob(): void {
    // Une fois toutes les 24h
    const intervalMs = 24 * 60 * 60 * 1000;

    const runCleanup = async () => {
        try {
            const days = daysToKeep();
            logger.info(`🧹 Démarrage du nettoyage des logs (Rétention: ${days} jours)`);

            // 1. Nettoyage des erreurs système
            const errorResult: any = await database.execute(
                "DELETE FROM system_error_log WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
                [days]
            );

            // 2. Nettoyage des logs d'audit
            const auditResult: any = await database.execute(
                "DELETE FROM audit_log WHERE performed_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
                [days]
            );

            // 3. Nettoyage des logs d'export
            const exportResult: any = await database.execute(
                "DELETE FROM export_log WHERE exported_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
                [days]
            );

            logger.info("✅ Nettoyage des logs terminé avec succès", {
                retentionDays: days,
                deletedErrors: errorResult?.affectedRows || 0,
                deletedAudit: auditResult?.affectedRows || 0,
                deletedExports: exportResult?.affectedRows || 0
            });

        } catch (error) {
            logger.error("❌ Échec du job de nettoyage des logs", { error });
        }
    };

    // Premier lancement après 30 secondes pour ne pas surcharger le démarrage
    setTimeout(runCleanup, 30 * 1000);

    // Puis toutes les 24h
    setInterval(runCleanup, intervalMs);
}
