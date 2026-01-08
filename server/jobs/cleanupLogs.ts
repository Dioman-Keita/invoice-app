import database from "../config/database";
import logger from "../utils/Logger";

/**
 * Number of days to keep logs (default 30 days)
 */
function daysToKeep(): number {
    const v = Number(process.env.LOGS_RETENTION_DAYS);
    return Number.isFinite(v) && v > 0 ? v : 30;
}

/**
 * Start the automatic log cleanup job (Audit, Errors, Exports)
 * Runs once every 24 hours.
 */
export function startCleanupLogsJob(): void {
    // Once every 24h
    const intervalMs = 24 * 60 * 60 * 1000;

    const runCleanup = async () => {
        try {
            const days = daysToKeep();
            logger.info(`🧹 Starting log cleanup (Retention: ${days} days)`);

            // 1. Clean system errors
            const errorResult: any = await database.execute(
                "DELETE FROM system_error_log WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
                [days]
            );

            // 2. Clean audit logs
            const auditResult: any = await database.execute(
                "DELETE FROM audit_log WHERE performed_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
                [days]
            );

            // 3. Clean export logs
            const exportResult: any = await database.execute(
                "DELETE FROM export_log WHERE exported_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
                [days]
            );

            logger.info("✅ Log cleanup completed successfully", {
                retentionDays: days,
                deletedErrors: errorResult?.affectedRows || 0,
                deletedAudit: auditResult?.affectedRows || 0,
                deletedExports: exportResult?.affectedRows || 0
            });

        } catch (error) {
            logger.error("❌ Failed log cleanup job", { error });
        }
    };

    // First launch after 30 seconds to avoid overloading the startup
    setTimeout(runCleanup, 30 * 1000);

    // After every 24h
    setInterval(runCleanup, intervalMs);
}
