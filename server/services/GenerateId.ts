import database from "../config/database";

type Row = {
    id: string
}

type IdConfig = {
    prefix: string,
    table: string
}

type EntityType = 'invoice' | 'employee';

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
    const year = new Date().getFullYear();
    const defaultFormat = `${config.prefix}-${year}-0001`;

    const result = await database.execute<Row[]>(`SELECT id FROM ${config.table} ORDER BY create_at DESC LIMIT 1`);

    if (result && result.length > 0) {
        const parts = result[0].id.split('-');
        if (parts.length === 3) {
            const lastInsertId = Number(parts[parts.length - 1]);
            if (!isNaN(lastInsertId)) {
                const format = `${config.prefix}-${year}-${(lastInsertId + 1).toString().padStart(4, '0')}`;
                return format;
            }
        }
    }

    return defaultFormat;
}

export default generateId;