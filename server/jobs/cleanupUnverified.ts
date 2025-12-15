import database from "../config/database";
import logger from "../utils/Logger";

function hoursToKeep(): number {
  const v = Number(process.env.UNVERIFIED_RETENTION_HOURS);
  return Number.isFinite(v) && v > 0 ? v : 24;
}

export function startCleanupUnverifiedJob(): void {
  const intervalMs = 60 * 60 * 1000;
  const run = async () => {
    try {
      const hours = hoursToKeep();
      const candidates: Array<{ id: string }> = await database.execute(
        "SELECT id FROM employee WHERE isVerified = 0 AND created_at < DATE_SUB(NOW(), INTERVAL ? HOUR)",
        [hours]
      );
      if (!Array.isArray(candidates) || candidates.length === 0) return;
      const ids = candidates.map(r => r.id);
      const placeholders = ids.map(() => '?').join(',');
      await database.execute(
        `DELETE FROM auth_token WHERE employee_id IN (${placeholders})`,
        ids
      );
      await database.execute(
        `DELETE FROM audit_log WHERE performed_by IN (${placeholders})`,
        ids
      );
      await database.execute(
        `DELETE FROM employee WHERE id IN (${placeholders})`,
        ids
      );
      logger.info("Nettoyage des utilisateurs non vérifiés effectué", { count: ids.length, hours });
    } catch (error) {
      logger.error("Erreur lors du nettoyage des utilisateurs non vérifiés", { error });
    }
  };
  setTimeout(run, 10 * 1000);
  setInterval(run, intervalMs);
}
