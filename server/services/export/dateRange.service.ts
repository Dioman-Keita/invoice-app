import database from '../../config/database';
import logger from '../../utils/Logger';
import { ExportType } from './types';

export async function resolveDateRange(type: ExportType, dateFrom?: string, dateTo?: string): Promise<{ dateFrom?: string; dateTo?: string }>{
  const normalize = (d: any): string | undefined => {
    if (!d) return undefined;
    if (d instanceof Date) return d.toLocaleDateString('fr-FR');
    return typeof d === 'string' ? d : undefined;
  };

  const df = normalize(dateFrom as any);
  const dt = normalize(dateTo as any);
  if (df && dt) {
    logger.debug('resolveDateRange: using provided dateFrom/dateTo', { type, dateFrom: df, dateTo: dt });
    return { dateFrom: df, dateTo: dt };
  }
  if (type === 'invoice') {
    const row = await database.execute<{ min: any; max: any } | Array<{ min: any; max: any }>>(
      'SELECT MIN(create_at) AS min, MAX(create_at) AS max FROM invoice'
    );
    const r = Array.isArray(row) ? row[0] : row;
    const out = { dateFrom: df || normalize(r?.min), dateTo: dt || normalize(r?.max) };
    logger.debug('resolveDateRange: using fallback from invoice table', { ...out, type });
    return out;
  }
  if (type === 'supplier' || type === 'relational') {
    const row = await database.execute<{ min: any; max: any } | Array<{ min: any; max: any }>>(
      'SELECT MIN(create_at) AS min, MAX(create_at) AS max FROM supplier'
    );
    const r = Array.isArray(row) ? row[0] : row;
    const out = { dateFrom: df || normalize(r?.min), dateTo: dt || normalize(r?.max) };
    logger.debug('resolveDateRange: using fallback from supplier table', { ...out, type });
    return out;
  }
  logger.debug('resolveDateRange: unknown type, returning normalized inputs', { type, dateFrom: df, dateTo: dt });
  return { dateFrom: df, dateTo: dt };
}
