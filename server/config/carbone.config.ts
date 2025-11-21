/**
 * Configuration pour Carbone (npm package local)
 * Gestion centralisée des paramètres d'export
 */

export interface CarboneConfig {
  timeout: number;
  templateBasePath: string;
  maxRecords: number;
  tempDir: string;
}

export const carboneConfig: CarboneConfig = {
  timeout: parseInt(process.env.CARBONE_TIMEOUT || '30000'),
  templateBasePath: 'server/templates',
  maxRecords: parseInt(process.env.EXPORT_MAX_RECORDS || '5000'),
  tempDir: 'server/temp'
};

/**
 * Validation de la configuration Carbone
 */
export function validateCarboneConfig(): void {
  if (carboneConfig.timeout < 1000) {
    throw new Error('CARBONE_TIMEOUT must be at least 1000ms');
  }
  
  if (carboneConfig.maxRecords < 1) {
    throw new Error('EXPORT_MAX_RECORDS must be at least 1');
  }
}