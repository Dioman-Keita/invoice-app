import { QueryBuilder, SearchInvoicesParams, SearchRelationalParams, SearchSuppliersParams } from '../../utils/QueryBuilder';
import { ExportType } from './types';

export type ProviderResult = {
  rows: any[];
  meta: { total: number; page: number; limit: number };
};

export async function runSearch(type: ExportType, search: Record<string, any>): Promise<ProviderResult> {
  if (type === 'invoice') {
    const s: SearchInvoicesParams = { ...(search as any), include_supplier: 'true' };
    return QueryBuilder.searchInvoices(s);
  }
  if (type === 'supplier') {
    const s: SearchSuppliersParams = search as any;
    return QueryBuilder.searchSuppliers(s);
  }
  if (type === 'relational') {
    const s: SearchRelationalParams = search as any;
    return QueryBuilder.searchRelational(s);
  }
  return { rows: [], meta: { total: 0, page: 1, limit: 10 } };
}
