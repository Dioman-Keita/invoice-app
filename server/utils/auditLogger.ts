import database from "../config/database";
import logger from "./Logger";

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'SELECT';

export type AuditLogParams = {
    action: AuditAction,
    table_name: string,
    record_id?: string,
    description?: string | null,
    performed_by?: string | null,
};

export type ExportLogParams = {
    invoice_id: string | null,
    format: 'PDF' | 'Excel' | 'CSV' | 'JSON' | 'TXT',
    exported_by: string,
};

export async function auditLog(params: AuditLogParams): Promise<void> {
    const { action, table_name, record_id, description = null } = params;
    // The audit_log table has a FK constraint on employee(id). 
    // 'system' or other non-ID strings will cause an error.
    let performed_by = params.performed_by;
    if (performed_by === 'system' || !performed_by) {
        performed_by = null;
    }

    try {
        await database.execute(
            "INSERT INTO audit_log(action, table_name, record_id, description, performed_by) VALUES(?,?,?,?,?)",
            [action, table_name, record_id, description, performed_by]
        );
        logger.info('Audit log saved', { action, table_name, record_id, performed_by });
    } catch (error) {
        logger.error('Failed to save audit log', {
            error,
            params,
            user_id: performed_by
        });
    }
}

export async function exportLog(params: ExportLogParams): Promise<void> {
    const { invoice_id, format, exported_by } = params;
    try {
        await database.execute(
            "INSERT INTO export_log(invoice_id, format, exported_by) VALUES(?,?,?)",
            [invoice_id, format, exported_by]
        );
        logger.info('Export log saved', { invoice_id, format, exported_by });
    } catch (error) {
        logger.error('Failed to save export log', {
            error,
            params,
            user_id: exported_by
        });
    }
}
