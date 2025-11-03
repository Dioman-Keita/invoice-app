import database from "../config/database";
import logger from "../utils/Logger";

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
    const rows = await database.execute<{setting_value: string}[] | {setting_value: string}>(
        "SELECT setting_value FROM app_settings WHERE setting_key = ? LIMIT 1",
        [key]
    );

    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row || row.setting_value === undefined || row.setting_value === null) {
        logger.warn(`Clé de configuration "${key}" introuvable dans app_settings`);
        throw new Error(`Clé de configuration "${key}" introuvable dans app_settings`)
    }

    const raw = row.setting_value;

    // Parse based on specific key to preserve exact return types
    switch (key) {
        case 'fiscal_year': {
            const v = typeof raw === 'string' ? raw : String(raw);
            return v as AppSettingMap[K];
        }
        case 'app_version': {
            const v = typeof raw === 'string' ? raw : String(raw);
            return v as AppSettingMap[K];
        }
        case 'year_end_warning_threshold': {
            const v = typeof raw === 'number' ? raw : Number(String(raw));
            return v as AppSettingMap[K];
        }
        case 'auto_year_switch': {
            if (typeof raw === 'boolean') return raw as AppSettingMap[K];
            const s = String(raw).trim().toLowerCase();
            const v = s === 'true' || s === '1';
            return v as AppSettingMap[K];
        }
        case 'cmdt_format': {
            if (typeof raw === 'object' && raw !== null) {
                return raw as AppSettingMap[K];
            }
            const s = String(raw).trim();
            try {
                const v = JSON.parse(s) as AppSettingMap['cmdt_format'];
                return v as AppSettingMap[K];
            } catch (e) {
                logger.warn(`Echec du parsing JSON pour la clé ${String(key)}; utilisation de la valeur par défaut { padding: 4, max: 9999 }`, {
                    errorMsg: e instanceof Error ? e.message : String(e)
                });
                const fallback = { padding: 4, max: 9999 } as AppSettingMap['cmdt_format'];
                return fallback as AppSettingMap[K];
            }
        }
        default: {
            // Exhaustive check safeguard
            const _exhaustive: never = key;
            return _exhaustive as unknown as AppSettingMap[K];
        }
    }
}

