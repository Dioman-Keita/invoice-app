import database from "../config/database";

export async function getEntityDateRange(entity: 'invoice' | 'dfc_decision' | 'supplier', fiscalYear: string): Promise<{ dateFrom: string | null; dateTo: string | null }> {
  try {
    let table: string;
    let dateColumn: string;
    
    switch (entity) {
      case 'invoice':
        table = 'invoice';
        dateColumn = 'IFNULL(update_at, create_at)';
        break;
      case 'dfc_decision':
        table = 'dfc_decision';
        // CORRECTION : Pas de update_at, utiliser seulement decided_at
        dateColumn = 'decided_at';
        break;
      case 'supplier':
        table = 'supplier';
        dateColumn = 'IFNULL(update_at, create_at)';
        break;
      default:
        throw new Error(`Entité non supportée: ${entity}`);
    }

    // Récupérer les dates min et max pour l'année fiscale
    const result = await database.execute<Array<{ min_date: string; max_date: string }>>(
      `SELECT 
         MIN(${dateColumn}) as min_date,
         MAX(${dateColumn}) as max_date
       FROM ${table} 
       WHERE fiscal_year = ?`,
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