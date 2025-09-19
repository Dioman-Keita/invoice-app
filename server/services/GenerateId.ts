import database from "../config/database";

type Row = {
    id: string
}

type IdConfig = {
    prefix: string,
    table: string
}

export type EntityType = 'invoice' | 'employee';

const idMap: Record<EntityType, IdConfig> = {
    invoice: {table: 'invoice', prefix: 'INV'},
    employee: {table: 'employee', prefix: 'EMP'}
}

/**
 * Génère un identifiant personnalisé et ordonné en fonction de l'entité passée en paramètre
 * @param entity <EntityType> - Entité pour laquelle générer l'ID
 * @returns {Promise<string>} 
 */

export async function generateId(entity: EntityType): Promise<string> {
    const config = idMap[entity];
    const currentYear = new Date().getFullYear();
    const defaultFormat = `${config.prefix}-${currentYear}-0001`;

    const result = await database.execute<Row[]>(`SELECT id FROM ${config.table} ORDER BY created_at DESC LIMIT 1`);

    if (result && result.length > 0) {
        const lastId = result[0].id;
        const parts = lastId.split('-');

        if (parts.length === 3) {
            const lastYear = Number(parts[1]);
            const lastNumber = Number(parts[2]);

            if (!isNaN(lastYear) && !isNaN(lastNumber)) {
                const newNumber = lastYear === currentYear ? lastNumber + 1 : 1;
                const formatted = `${config.prefix}-${currentYear}-${newNumber.toString().padStart(4, '0')}`;
                return formatted;
            }
        }
    }

    return defaultFormat;
}


export default generateId;