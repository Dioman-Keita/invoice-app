import database from "../config/database";

export async function getDatabaseCreationDate(): Promise<string> {
  try {
    // Direct approach - use the oldest table
    const queries = [
      `SELECT MIN(created_at) as min_date FROM app_settings`,
      `SELECT MIN(create_at) as min_date FROM invoice`,
      `SELECT MIN(created_at) as min_date FROM employee`,
      `SELECT MIN(create_at) as min_date FROM supplier`
    ];

    for (const query of queries) {
      try {
        const result = await database.execute<any>(query);
        const data = Array.isArray(result) ? result[0] : result;
        const dateValue = data?.min_date;

        if (dateValue) {
          return new Date(dateValue).toISOString().split('T')[0];
        }
      } catch (error) {
        continue;
      }
    }

    return '2024-01-01';

  } catch (error) {
    return '2024-01-01';
  }
}