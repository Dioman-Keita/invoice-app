import database from "../config/database";

type EntityConfig = {
  table: string;
  dateColumn: string;
  filters: string;
};

export async function getEntityDateRange(entity: 'invoice' | 'dfc_decision' | 'supplier', fiscalYear: string): Promise<{ dateFrom: string | null; dateTo: string | null }> {
  try {
    const configs: Record<typeof entity, EntityConfig> = {
      'invoice': {
        table: 'invoice',
        dateColumn: 'IFNULL(update_at, create_at)',
        filters: 'fiscal_year = ? AND status = "Non"' // ← EXCLURE LES ANNULEES
      },
      'dfc_decision': {
        table: 'dfc_decision', 
        dateColumn: 'decided_at',
        filters: 'fiscal_year = ?' // Décisions = seulement factures valides
      },
      'supplier': {
        table: 'supplier',
        dateColumn: 'IFNULL(update_at, create_at)',
        filters: 'fiscal_year = ?' // Tous les fournisseurs
      }
    };

    const config = configs[entity];

    const result = await database.execute<Array<{ min_date: string; max_date: string }>>(
      `SELECT 
         MIN(${config.dateColumn}) as min_date,
         MAX(${config.dateColumn}) as max_date
       FROM ${config.table} 
       WHERE ${config.filters}`,
      [fiscalYear]
    );

    const data = Array.isArray(result) ? result[0] : result;
    
    return {
      dateFrom: data?.min_date || null,
      dateTo: data?.max_date || null
    };
  } catch (error) {
    console.error(`Erreur getEntityDateRange pour ${entity}:`, error);
    return { dateFrom: null, dateTo: null };
  }
}