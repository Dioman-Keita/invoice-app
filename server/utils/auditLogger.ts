import database from "../config/database";
import logger from "./Logger";

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'SELECT';

export type AuditLogParams = {
    action: AuditAction,
    table_name: string,
    record_id: string | null,
    description?: string | null,
    performed_by?: string | null,
};

export type ExportLogParams = {
    invoice_id: string | null,
    format: 'PDF' | 'Excel' | 'CSV' | 'JSON',
    exported_by: string,
};

export async function auditLog(params: AuditLogParams): Promise<void> {
    const { action, table_name, record_id, description = null, performed_by = null } = params;
    try {
        await database.execute(
            "INSERT INTO audit_log(action, table_name, record_id, description, performed_by) VALUES(?,?,?,?,?)",
            [action, table_name, record_id, description, performed_by]
        );
        logger.info('Audit log enregistré', { action, table_name, record_id, performed_by });
    } catch (error) {
        logger.error('Echec de l\'enregistrement de l\'audit_log', { error, params });
    }
}

export async function exportLog(params: ExportLogParams): Promise<void> {
    const { invoice_id, format, exported_by } = params;
    try {
        await database.execute(
            "INSERT INTO export_log(invoice_id, format, exported_by) VALUES(?,?,?)",
            [invoice_id, format, exported_by]
        );
        logger.info('Export log enregistré', { invoice_id, format, exported_by });
    } catch (error) {
        logger.error('Echec de l\'enregistrement de l\'export_log', { error, params });
    }
}
