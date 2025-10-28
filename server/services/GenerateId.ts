import database from "../config/database";
import { getSetting } from "../utils/helpers/settings";

type Row = {
    id: string;
    fiscal_year: string;
}

type IdConfig = {
    prefix: string,
    table: string,
    create_at: 'create_at' | 'created_at',
    useFiscalYear: boolean
}

export type EntityType = 'invoice' | 'employee';

const idMap: Record<EntityType, IdConfig> = {
    invoice: {table: 'invoice', prefix: 'INV', create_at: 'create_at', useFiscalYear: true},
    employee: {table: 'employee', prefix: 'EMP', create_at: 'created_at', useFiscalYear: false}
}

/**
 * Génère un identifiant personnalisé et ordonné en fonction de l'entité passée en paramètre
 * Supporte jusqu'à 1 milliard d'entrées par année fiscale
 * Format: INV-FY2025-000000001 (12 chiffres séquentiels)
 * @param entity <EntityType> - Entité pour laquelle générer l'ID
 * @returns {Promise<string>} 
 */

export async function generateId(entity: EntityType): Promise<string> {
    const config = idMap[entity];
    
    // Récupérer l'année fiscale correcte pour les factures
    const fiscalYear = config.useFiscalYear 
        ? await getSetting('fiscal_year') 
        : new Date().getFullYear().toString();
    
    const fiscalPrefix = config.useFiscalYear ? `FY${fiscalYear}` : fiscalYear;
    const defaultFormat = `${config.prefix}-${fiscalPrefix}-000000001`;

    // Pour les factures, vérifier le dernier ID existant ET utiliser le compteur d'année fiscale
    if (entity === 'invoice') {
        // 1. Récupérer le dernier ID réellement créé pour cette année fiscale
        const lastIdQuery = `
            SELECT id 
            FROM invoice 
            WHERE fiscal_year = ? 
            ORDER BY create_at DESC 
            LIMIT 1
        `;
        const lastIdResult = await database.execute<{id: string}[]>(lastIdQuery, [fiscalYear]);
        
        let nextNumber = 1; // Valeur par défaut
        
        if (lastIdResult && lastIdResult.length > 0) {
            const lastId = lastIdResult[0].id;
            const parts = lastId.split('-');
            
            if (parts.length === 3 && parts[0] === config.prefix && parts[1] === fiscalPrefix) {
                const lastNumber = Number(parts[2]);
                if (!isNaN(lastNumber)) {
                    nextNumber = lastNumber + 1;
                }
            }
        }
        
        // 2. Récupérer/Mettre à jour le compteur d'année fiscale
        const counterQuery = `
            SELECT last_cmdt_number 
            FROM fiscal_year_counter 
            WHERE fiscal_year = ?
        `;
        const counterResult = await database.execute<{last_cmdt_number: number}[]>(counterQuery, [fiscalYear]);
        
        if (counterResult && counterResult.length > 0) {
            // Utiliser le maximum entre le compteur et le dernier ID réel
            const counterNumber = counterResult[0].last_cmdt_number + 1;
            nextNumber = Math.max(nextNumber, counterNumber);
            
            // Mettre à jour le compteur avec la bonne valeur
            if (nextNumber > counterResult[0].last_cmdt_number + 1) {
                await database.execute(
                    "UPDATE fiscal_year_counter SET last_cmdt_number = ? WHERE fiscal_year = ?",
                    [nextNumber - 1, fiscalYear]
                );
            }
        } else {
            // Créer le compteur s'il n'existe pas
            await database.execute(
                "INSERT INTO fiscal_year_counter (fiscal_year, last_cmdt_number) VALUES (?, ?)",
                [fiscalYear, nextNumber - 1]
            );
        }
        
        return `${config.prefix}-${fiscalPrefix}-${nextNumber.toString().padStart(12, '0')}`;
    }

    // Pour les autres entités (employees), logique standard
    const result = await database.execute<Row[]>(`
        SELECT id FROM ${config.table} 
        ORDER BY ${config.create_at} DESC 
        LIMIT 1
    `);

    if (result && result.length > 0) {
        const lastId = result[0].id;
        const parts = lastId.split('-');

        if (parts.length === 3) {
            const lastYear = parts[1];
            const lastNumber = Number(parts[2]);

            if (!isNaN(lastNumber)) {
                // Reset si changement d'année/fiscal year
                const newNumber = lastYear === fiscalPrefix ? lastNumber + 1 : 1;
                const formatted = `${config.prefix}-${fiscalPrefix}-${newNumber.toString().padStart(4, '0')}`;
                return formatted;
            }
        }
    }

    return defaultFormat;
}

/**
 * Met à jour le compteur d'année fiscale après création de facture
 * @param fiscalYear - Année fiscale concernée
 */
export async function updateFiscalYearCounter(fiscalYear: string): Promise<void> {
    await database.execute(
        "UPDATE fiscal_year_counter SET last_cmdt_number = last_cmdt_number + 1 WHERE fiscal_year = ?",
        [fiscalYear]
    );
}

export default generateId;