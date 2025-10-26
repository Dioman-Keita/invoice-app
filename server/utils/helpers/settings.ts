import database from "../../config/database";
import logger from "../Logger";

export type AppSettingMap = {
    fiscal_year: string;
    cmdt_format: {
        padding: number;
        max: number;
    };
    year_end_warning_threshold: number;
    auto_year_switch: boolean;
    app_version: string;
};

export async function getSetting<K extends keyof AppSettingMap>(key: K): Promise<AppSettingMap[K]> {
    const rows = await database.execute<{setting_value: any}[] | {setting_value: any}>(
        "SELECT setting_value FROM app_settings WHERE setting_key = ? LIMIT 1",
        [key]
    );

    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row || row.setting_value === undefined || row.setting_value === null) {
        logger.warn(`Clé de configuration "${key}" introuvable dans app_settings`);
        throw new Error(`Clé de configuration "${key}" introuvable dans app_settings`)
    }

    const raw = row.setting_value as any;

    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                return JSON.parse(trimmed);
            } catch (e) {
                logger.warn(`Echec du parsing JSON pour la clé ${String(key)}; utilisation de la valeur brute`);
                return trimmed as any;
            }
        }
        switch (key) {
            case 'year_end_warning_threshold':
                return Number(trimmed) as any;
            case 'auto_year_switch':
                return (trimmed === 'true' || trimmed === '1') as any;
            default:
                return trimmed as any;
        }
    }

    if (typeof raw === 'number' || typeof raw === 'boolean') {
        return raw as any;
    }

    if (typeof raw === 'object') {
        return raw as any;
    }

    try {
        return JSON.parse(String(raw));
    } catch {
        return raw as any;
    }
}
