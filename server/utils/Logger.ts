import database from "../config/database";
import fs from 'fs';
import path from 'path';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'SELECT';

type AuditLogParams = {
    action: AuditAction,
    table_name: string,
    record_id: string | null,
    description?: string | null,
    performed_by?: string | null,
};

type ExportLogParams = {
    invoice_id: string | null,
    format: 'PDF' | 'Excel' | 'CSV' | 'JSON',
    exported_by: string,
};

class Logger {
    private static instance: Logger | null = null;
    private logDirectory: string;

    private constructor() {
        this.logDirectory = path.resolve(__dirname, '..', 'logs');
        this.ensureLogDirectory();
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private ensureLogDirectory(): void {
        try {
            if (!fs.existsSync(this.logDirectory)) {
                fs.mkdirSync(this.logDirectory, { recursive: true });
            }
        } catch (error) {
            // As a last resort, print to console if we cannot create log dir
            // eslint-disable-next-line no-console
            console.error('Impossible de créer le répertoire de logs:', error);
        }
    }

    private getLogFilePath(): string {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const fileName = `app-${yyyy}-${mm}-${dd}.log`;
        return path.join(this.logDirectory, fileName);
    }

    private formatLine(level: LogLevel, message: string, meta?: unknown): string {
        const timestamp = new Date().toISOString();
        const metaString = meta === undefined ? '' : ` | meta=${this.safeStringify(meta)}`;
        return `${timestamp} [${level}] ${message}${metaString}`;
    }

    private safeStringify(value: unknown): string {
        try {
            return typeof value === 'string' ? value : JSON.stringify(value);
        } catch {
            return '[Unserializable]';
        }
    }

    private writeToFile(line: string): void {
        try {
            fs.appendFileSync(this.getLogFilePath(), line + "\n", { encoding: 'utf8' });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Erreur lors de l\'écriture du log dans le fichier:', error);
        }
    }

    private log(level: LogLevel, message: string, meta?: unknown): void {
        const line = this.formatLine(level, message, meta);
        this.writeToFile(line);
        if (level === 'ERROR') {
            // eslint-disable-next-line no-console
            console.error(line);
        }
    }

    info(message: string, meta?: unknown): void {
        this.log('INFO', message, meta);
    }

    warn(message: string, meta?: unknown): void {
        this.log('WARN', message, meta);
    }

    error(message: string, meta?: unknown): void {
        this.log('ERROR', message, meta);
    }

    debug(message: string, meta?: unknown): void {
        this.log('DEBUG', message, meta);
    }

    async audit(params: AuditLogParams): Promise<void> {
        const { action, table_name, record_id, description = null, performed_by = null } = params;
        try {
            await database.execute(
                "INSERT INTO audit_log(action, table_name, record_id, description, performed_by) VALUES(?,?,?,?,?)",
                [action, table_name, record_id, description, performed_by]
            );
            this.info('Audit log enregistré', { action, table_name, record_id, performed_by });
        } catch (error) {
            this.error('Echec de l\'enregistrement de l\'audit_log', { error, params });
        }
    }

    async export(params: ExportLogParams): Promise<void> {
        const { invoice_id, format, exported_by } = params;
        try {
            await database.execute(
                "INSERT INTO export_log(invoice_id, format, exported_by) VALUES(?,?,?)",
                [invoice_id, format, exported_by]
            );
            this.info('Export log enregistré', { invoice_id, format, exported_by });
        } catch (error) {
            this.error('Echec de l\'enregistrement de l\'export_log', { error, params });
        }
    }
}

const logger = Logger.getInstance();
export default logger;

