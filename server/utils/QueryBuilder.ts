import database from "../config/database";
import logger from "./Logger";

export type Pagination = { page: number; limit: number };
export type Order = { order_by: string; order_direction: 'asc' | 'desc' };

export type QueryResult<T = unknown> = {
  rows: T[];
  meta: { total: number; page: number; limit: number };
};

type CountRow = { cnt: number };

export type SearchInvoicesParams = Partial<{
  page: number | string;
  limit: number | string;
  order_by: string;
  order_direction: string;
  search: string;
  fiscal_year: string;
  num_invoice: string;
  num_cmdt: string;
  supplier_name: string;
  invoice_type: string;
  invoice_nature: string;
  dfc_status: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string | number;
  amountMax: string | number;
  include_supplier: string | boolean;
  include_attachments: string | boolean;
  include_dfc: string | boolean;
}>;

export type InvoiceSearchRow = Record<string, unknown> & {
  id: string;
  num_cmdt: string;
  num_invoice: string;
};

export type SearchSuppliersParams = Partial<{
  page: number | string;
  limit: number | string;
  order_by: string;
  order_direction: string;
  search: string;
  supplier_name: string;
  account_number: string;
  phone: string;
  supplier_created_from: string;
  supplier_created_to: string;
  supplier_with_invoices: string | boolean;
  has_active_invoices: string | boolean;
}>;

export type SupplierRow = Record<string, unknown> & { id: string };

export type SearchRelationalParams = Partial<{
  page: number | string;
  limit: number | string;
  order_by: string;
  order_direction: string;
  search: string;
  supplier_name: string;  // ✅ AJOUT : Support du filtre supplier_name
  fiscal_year: string;
  invoice_type: string;
  invoice_nature: string;
  dfc_status: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string | number;
  amountMax: string | number;
  group_by: string;
  group_by_supplier: string | boolean;
  supplier_with_invoices: string | boolean;
  invoice_with_attachments: string | boolean;
  invoice_with_dfc_decision: string | boolean;
  supplier_invoice_count_min: string | number;
  supplier_invoice_count_max: string | number;
  supplier_total_amount_min: string | number;
  supplier_total_amount_max: string | number;
  supplier_avg_amount_min: string | number;  // ✅ AJOUT : Montant moyen min
  supplier_avg_amount_max: string | number;  // ✅ AJOUT : Montant moyen max
}>;

export type RelationalGroupedRow = {
  supplier_id: string;
  supplier_name: string;
  supplier_account: string;
  invoice_count: number;
  total_amount: string;
  avg_amount: string;
  last_invoice_date: string;
};

export type RelationalFlatRow = {
  supplier_name: string;
  num_invoice: string;
  num_cmdt: string;
  amount: string;
  invoice_arr_date: string;
  dfc_status: string;
};

function toInt(value: unknown, fallback: number): number {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function normalizeOrder(dir?: string): 'asc' | 'desc' {
  return (String(dir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc');
}

function isNumeric(value: string): boolean {
  return /^\d+(?:[\.,]\d+)?$/.test((value || '').toString().trim());
}

function isCmdt(value: string): boolean {
  return /^\d{1,4}$/.test((value || '').toString().trim());
}

function isInvoiceRef(value: string): boolean {
  return /^([A-Za-z]{2,6}-)?\d{4}-\d{1,6}$/i.test((value || '').toString().trim());
}

function isPhone(value: string): boolean {
  return /^\+?\d[\d\s\-]{5,}$/.test((value || '').toString().trim());
}

function looksLikeAccount(value: string): boolean {
  const s = (value || '').toString().trim();
  return s.length >= 6 && s.length <= 34 && /[A-Za-z0-9]/.test(s) && /\d/.test(s);
}

export class QueryBuilder {
  static async searchInvoices(q: SearchInvoicesParams): Promise<QueryResult<InvoiceSearchRow>> {
    const page = toInt(q.page, 1);
    const limit = toInt(q.limit, 10);
    const offset = (page - 1) * limit;

    // Whitelisted order fields
    const allowedOrder = new Set([
      'create_at','invoice_arr_date','amount','num_cmdt','num_invoice','supplier_name'
    ]);
    const orderByCandidate = String(q.order_by || '').trim();
    // ✅ MODIFICATION : Ne pas trier si order_by est vide
    const orderBy = orderByCandidate && allowedOrder.has(orderByCandidate) 
      ? orderByCandidate 
      : null;
    const orderDir = orderBy ? normalizeOrder(q.order_direction) : 'desc';

    const conditions: string[] = [];
    const params: unknown[] = [];

    try {
      // Global search over invoice and supplier fields with heuristics
      if (q.search) {
        const term = String(q.search).trim();
        const like = `%${term}%`;
        const orParts: string[] = [];
        const orParams: unknown[] = [];

        // Heuristics: system reference (id) -> num_cmdt (system counter) -> num_invoice (intra)
        if (isInvoiceRef(term)) {
          // INV-2025-XXXX matches id column
          orParts.push('i.id LIKE ?');
          orParams.push(like);
        } else if (isCmdt(term)) {
          // Simple CMDT like 0001 matches num_cmdt first (system source of truth)
          orParts.push('i.num_cmdt LIKE ?');
          orParams.push(like);
        } else if (isNumeric(term)) {
          // Numeric: try amount exact match first
          orParts.push('CAST(i.amount AS DECIMAL(18,2)) = ?');
          orParams.push(term.replace(',', '.'));
        }
        // Phone and account
        if (isPhone(term)) {
          orParts.push('s.phone LIKE ?');
          orParams.push(like);
        }
        if (looksLikeAccount(term)) {
          orParts.push('s.account_number LIKE ?');
          orParams.push(like);
        }
        // Always include fuzzy name/object
        orParts.push('s.name LIKE ?');
        orParams.push(like);
        orParts.push('i.invoice_object LIKE ?');
        orParams.push(like);
        // Fallback numeric fields
        if (!isInvoiceRef(term) && !isCmdt(term)) {
          orParts.push('i.num_invoice LIKE ?');
          orParams.push(like);
          orParts.push('i.num_cmdt LIKE ?');
          orParams.push(like);
        }

        conditions.push(`(${orParts.join(' OR ')})`);
        params.push(...orParams);
      }

      // Direct field filters
      if (q.fiscal_year) { conditions.push('i.fiscal_year = ?'); params.push(q.fiscal_year); }
      if (q.num_invoice) { conditions.push('i.num_invoice LIKE ?'); params.push(`%${q.num_invoice}%`); }
      if (q.num_cmdt) { conditions.push('i.num_cmdt LIKE ?'); params.push(`%${q.num_cmdt}%`); }
      if (q.supplier_name) { conditions.push('s.name LIKE ?'); params.push(`%${q.supplier_name}%`); }
      if (q.invoice_type) { conditions.push('i.invoice_type = ?'); params.push(q.invoice_type); }
      if (q.invoice_nature) { conditions.push('i.invoice_nature = ?'); params.push(q.invoice_nature); }
      if (q.dfc_status) { conditions.push('i.dfc_status = ?'); params.push(q.dfc_status); }
      if (q.status) { conditions.push('i.status = ?'); params.push(q.status); }
      if (q.dateFrom) { conditions.push('i.invoice_arr_date >= ?'); params.push(q.dateFrom); }
      if (q.dateTo) { conditions.push('i.invoice_arr_date <= ?'); params.push(q.dateTo); }
      if (q.amountMin) { conditions.push('CAST(i.amount AS DECIMAL(18,2)) >= ?'); params.push(q.amountMin); }
      if (q.amountMax) { conditions.push('CAST(i.amount AS DECIMAL(18,2)) <= ?'); params.push(q.amountMax); }

      // Optional joins
      const includeSupplier = String(q.include_supplier) === 'true';
      const includeAttachments = String(q.include_attachments) === 'true';
      const includeDfc = String(q.include_dfc) === 'true';

      const selectParts = ['i.*'];
      let leftJoins = '';

      if (includeSupplier) {
        leftJoins += ' LEFT JOIN supplier s ON i.supplier_id = s.id';
        selectParts.push('s.name AS supplier_name', 's.account_number AS supplier_account_number', 's.phone AS supplier_phone');
      }
      if (includeAttachments) {
        leftJoins += ' LEFT JOIN attachments a ON a.invoice_id = i.id';
        selectParts.push('JSON_LENGTH(a.documents) AS attachments_count');
      }
      if (includeDfc) {
        // last dfc
        selectParts.push(`(SELECT d.decision FROM dfc_decision d WHERE d.invoice_id = i.id ORDER BY d.id DESC LIMIT 1) AS last_dfc_decision`);
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const baseQuery = `FROM invoice i ${leftJoins} ${whereClause}`;
      // ✅ MODIFICATION : Ajouter ORDER BY seulement si orderBy existe
      const selectQuery = orderBy
        ? `SELECT ${selectParts.join(', ')} ${baseQuery} ORDER BY ${orderBy} ${orderDir} LIMIT ${limit} OFFSET ${offset}`
        : `SELECT ${selectParts.join(', ')} ${baseQuery} LIMIT ${limit} OFFSET ${offset}`;
      const countQuery = `SELECT COUNT(*) AS cnt ${baseQuery}`;

      logger.info('QueryBuilder.searchInvoices start', { filters: q, page, limit, orderBy, orderDir });
      logger.info('QueryBuilder.searchInvoices SQL', { sql: selectQuery, params });
      let rows = await database.execute<InvoiceSearchRow[] | InvoiceSearchRow>(selectQuery, params);
      if (rows && !Array.isArray(rows)) rows = [rows];
      const countRows = await database.execute<CountRow[] | CountRow>(countQuery, params);
      const total = Array.isArray(countRows) ? (countRows[0]?.cnt || 0) : ((countRows as CountRow)?.cnt || 0);

      return { rows: (rows as InvoiceSearchRow[]) || [], meta: { total, page, limit } };
    } catch (error) {
      logger.error('QueryBuilder.searchInvoices error', {
        errorMessage: error instanceof Error ? error.message : 'unknown error',
        stack: error instanceof Error ? error.stack : 'unknown stack',
        filters: q
      });
      throw error;
    }
  }

  static async searchSuppliers(q: SearchSuppliersParams): Promise<QueryResult<SupplierRow>> {
    const page = toInt(q.page, 1);
    const limit = toInt(q.limit, 10);
    const offset = (page - 1) * limit;

    const allowedOrder = new Set(['create_at','name','account_number']);
    const orderByCandidate = String(q.order_by || '').trim();
    // ✅ MODIFICATION : Ne pas trier si order_by est vide
    const orderBy = orderByCandidate && allowedOrder.has(orderByCandidate) 
      ? orderByCandidate 
      : null;
    const orderDir = orderBy ? normalizeOrder(q.order_direction) : 'desc';

    const conditions: string[] = [];
    const params: unknown[] = [];

    try {
      if (q.search) {
        const term = String(q.search).trim();
        const like = `%${term}%`;
        const orParts: string[] = [];
        const orParams: unknown[] = [];
        // Placeholder: name, account, phone
        if (looksLikeAccount(term)) { orParts.push('s.account_number LIKE ?'); orParams.push(like); }
        if (isPhone(term)) { orParts.push('s.phone LIKE ?'); orParams.push(like); }
        // Always include name fuzzy
        orParts.push('s.name LIKE ?'); orParams.push(like);
        conditions.push(`(${orParts.join(' OR ')})`);
        params.push(...orParams);
      }
      if (q.supplier_name) { conditions.push('s.name LIKE ?'); params.push(`%${q.supplier_name}%`); }
      if (q.account_number) { conditions.push('s.account_number LIKE ?'); params.push(`%${q.account_number}%`); }
      if (q.phone) { conditions.push('s.phone LIKE ?'); params.push(`%${q.phone}%`); }
      if (q.supplier_created_from) { conditions.push('s.create_at >= ?'); params.push(q.supplier_created_from); }
      if (q.supplier_created_to) { conditions.push('s.create_at <= ?'); params.push(q.supplier_created_to); }

      // relational flags
      const withInvoices = String(q.supplier_with_invoices) === 'true';
      const hasActiveInvoices = String(q.has_active_invoices) === 'true';

      let joins = '';
      if (withInvoices || hasActiveInvoices) {
        joins += ' LEFT JOIN invoice i ON i.supplier_id = s.id';
      }

      if (withInvoices) {
        conditions.push('i.id IS NOT NULL');
      }
      if (hasActiveInvoices) {
        conditions.push("i.status = 'Oui'");
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const base = `FROM supplier s ${joins} ${whereClause}`;
      // ✅ MODIFICATION : Ajouter ORDER BY seulement si orderBy existe
      const select = orderBy
        ? `SELECT s.* ${base} GROUP BY s.id ORDER BY ${orderBy} ${orderDir} LIMIT ${limit} OFFSET ${offset}`
        : `SELECT s.* ${base} GROUP BY s.id LIMIT ${limit} OFFSET ${offset}`;
      const count = `SELECT COUNT(DISTINCT s.id) AS cnt ${base}`;

      logger.info('QueryBuilder.searchSuppliers start', { filters: q, page, limit, orderBy, orderDir });
      let rows = await database.execute<SupplierRow[] | SupplierRow>(select, params);
      if (rows && !Array.isArray(rows)) rows = [rows];
      const countRows = await database.execute<CountRow[] | CountRow>(count, params);
      const total = Array.isArray(countRows) ? (countRows[0]?.cnt || 0) : ((countRows as CountRow)?.cnt || 0);

      return { rows: (rows as SupplierRow[]) || [], meta: { total, page, limit } };
    } catch (error) {
      logger.error('QueryBuilder.searchSuppliers error', {
        errorMessage: error instanceof Error ? error.message : 'unknown error',
        stack: error instanceof Error ? error.stack : 'unknown stack',
        filters: q
      });
      throw error;
    }
  }

  static async searchRelational(q: SearchRelationalParams): Promise<QueryResult<RelationalGroupedRow | RelationalFlatRow>> {
    const page = toInt(q.page, 1);
    const limit = toInt(q.limit, 10);
    const offset = (page - 1) * limit;

    const allowedOrder = new Set(['total_amount','invoice_count','last_invoice_date','supplier_name','avg_amount','supplier_account']);
    const orderByCandidate = String(q.order_by || '').trim();
    // ✅ MODIFICATION : Ne pas trier si order_by est vide
    const orderBy = orderByCandidate && allowedOrder.has(orderByCandidate) 
      ? orderByCandidate 
      : null;
    const orderDir = orderBy ? normalizeOrder(q.order_direction) : 'desc';

    const groupBySupplier = String(q.group_by) === 'supplier' || String(q.group_by_supplier) === 'true';

    const whereConditions: string[] = [];
    const havingConditions: string[] = [];
    const whereParams: unknown[] = [];
    const havingParams: unknown[] = [];

    try {
      if (q.search) {
        const term = String(q.search).trim();
        const like = `%${term}%`;
        const orParts: string[] = [];
        const orParams: unknown[] = [];
        // Placeholder: Fournisseur, montant, référence...
        if (isNumeric(term)) { orParts.push('CAST(i.amount AS DECIMAL(18,2)) = ?'); orParams.push(term.replace(',', '.')); }
        if (isInvoiceRef(term)) { orParts.push('i.num_invoice LIKE ?'); orParams.push(like); }
        if (isCmdt(term)) { orParts.push('i.num_cmdt LIKE ?'); orParams.push(like); }
        // Always include supplier name
        orParts.push('s.name LIKE ?'); orParams.push(like);
        whereConditions.push(`(${orParts.join(' OR ')})`);
        whereParams.push(...orParams);
      }
      // ✅ AJOUT : Support du filtre supplier_name
      if (q.supplier_name) {
        whereConditions.push('s.name LIKE ?');
        whereParams.push(`%${String(q.supplier_name).trim()}%`);
      }
      if (q.fiscal_year) { whereConditions.push('i.fiscal_year = ?'); whereParams.push(q.fiscal_year); }
      if (q.invoice_type) { whereConditions.push('i.invoice_type = ?'); whereParams.push(q.invoice_type); }
      if (q.invoice_nature) { whereConditions.push('i.invoice_nature = ?'); whereParams.push(q.invoice_nature); }
      if (q.dfc_status) { whereConditions.push('i.dfc_status = ?'); whereParams.push(q.dfc_status); }
      if (q.dateFrom) { whereConditions.push('i.invoice_arr_date >= ?'); whereParams.push(q.dateFrom); }
      if (q.dateTo) { whereConditions.push('i.invoice_arr_date <= ?'); whereParams.push(q.dateTo); }
      if (q.amountMin) { whereConditions.push('CAST(i.amount AS DECIMAL(18,2)) >= ?'); whereParams.push(q.amountMin); }
      if (q.amountMax) { whereConditions.push('CAST(i.amount AS DECIMAL(18,2)) <= ?'); whereParams.push(q.amountMax); }

      if (String(q.supplier_with_invoices) === 'true') {
        whereConditions.push('i.id IS NOT NULL');
      }
      if (String(q.invoice_with_attachments) === 'true') {
        whereConditions.push('EXISTS (SELECT 1 FROM attachments a WHERE a.invoice_id = i.id)');
      }
      if (String(q.invoice_with_dfc_decision) === 'true') {
        whereConditions.push('EXISTS (SELECT 1 FROM dfc_decision d WHERE d.invoice_id = i.id)');
      }

      // ✅ MODIFICATION : Filtres d'agrégation dans HAVING (seulement quand groupé)
      if (groupBySupplier) {
        if (q.supplier_invoice_count_min) {
          havingConditions.push('COUNT(i.id) >= ?');
          havingParams.push(q.supplier_invoice_count_min);
        }
        if (q.supplier_invoice_count_max) {
          havingConditions.push('COUNT(i.id) <= ?');
          havingParams.push(q.supplier_invoice_count_max);
        }
        if (q.supplier_total_amount_min) {
          havingConditions.push('SUM(CAST(i.amount AS DECIMAL(18,2))) >= ?');
          havingParams.push(q.supplier_total_amount_min);
        }
        if (q.supplier_total_amount_max) {
          havingConditions.push('SUM(CAST(i.amount AS DECIMAL(18,2))) <= ?');
          havingParams.push(q.supplier_total_amount_max);
        }
        if (q.supplier_avg_amount_min) {
          havingConditions.push('AVG(CAST(i.amount AS DECIMAL(18,2))) >= ?');
          havingParams.push(q.supplier_avg_amount_min);
        }
        if (q.supplier_avg_amount_max) {
          havingConditions.push('AVG(CAST(i.amount AS DECIMAL(18,2))) <= ?');
          havingParams.push(q.supplier_avg_amount_max);
        }
      }

      const where = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';
      const having = havingConditions.length ? `HAVING ${havingConditions.join(' AND ')}` : '';
      const params = [...whereParams, ...havingParams];

      if (groupBySupplier) {
        const base = `FROM invoice i LEFT JOIN supplier s ON s.id = i.supplier_id ${where}`;
        // ✅ MODIFICATION : Ajouter ORDER BY seulement si orderBy existe
        const select = orderBy
          ? `SELECT 
            s.id AS supplier_id,
            s.name AS supplier_name,
            s.account_number AS supplier_account,
            s.phone AS phone,
            COUNT(i.id) AS invoice_count,
            SUM(CAST(i.amount AS DECIMAL(18,2))) AS total_amount,
            AVG(CAST(i.amount AS DECIMAL(18,2))) AS avg_amount,
            MAX(i.invoice_arr_date) AS last_invoice_date
          ${base}
          GROUP BY s.id
          ${having}
          ORDER BY ${orderBy} ${orderDir}
          LIMIT ${limit} OFFSET ${offset}`
          : `SELECT 
            s.id AS supplier_id,
            s.name AS supplier_name,
            s.account_number AS supplier_account,
            s.phone AS phone,
            COUNT(i.id) AS invoice_count,
            SUM(CAST(i.amount AS DECIMAL(18,2))) AS total_amount,
            AVG(CAST(i.amount AS DECIMAL(18,2))) AS avg_amount,
            MAX(i.invoice_arr_date) AS last_invoice_date
          ${base}
          GROUP BY s.id
          ${having}
          LIMIT ${limit} OFFSET ${offset}`;
        // ✅ MODIFICATION : Compter les groupes qui passent le HAVING
        const count = having 
          ? `SELECT COUNT(*) AS cnt FROM (SELECT s.id ${base} GROUP BY s.id ${having}) AS grouped`
          : `SELECT COUNT(DISTINCT s.id) AS cnt ${base}`;

        logger.info('QueryBuilder.searchRelational start (grouped)', { filters: q, page, limit, orderBy, orderDir });
        let rows = await database.execute<RelationalGroupedRow[] | RelationalGroupedRow>(select, params);
        if (rows && !Array.isArray(rows)) rows = [rows];
        const countRows = await database.execute<CountRow[] | CountRow>(count, params);
        const total = Array.isArray(countRows) ? (countRows[0]?.cnt || 0) : ((countRows as CountRow)?.cnt || 0);
        return { rows: (rows as RelationalGroupedRow[]) || [], meta: { total, page, limit } };
      } else {
        const base = `FROM invoice i LEFT JOIN supplier s ON s.id = i.supplier_id ${where}`;
        // ✅ MODIFICATION : Ajouter ORDER BY seulement si orderBy existe
        const select = orderBy
          ? `SELECT 
            s.name AS supplier_name,
            s.phone AS phone,
            i.num_invoice,
            i.num_cmdt,
            i.amount,
            i.invoice_arr_date,
            i.dfc_status
          ${base}
          ORDER BY ${orderBy === 'supplier_name' ? 'supplier_name' : 'i.invoice_arr_date'} ${orderDir}
          LIMIT ${limit} OFFSET ${offset}`
          : `SELECT 
            s.name AS supplier_name,
            s.phone AS phone,
            i.num_invoice,
            i.num_cmdt,
            i.amount,
            i.invoice_arr_date,
            i.dfc_status
          ${base}
          LIMIT ${limit} OFFSET ${offset}`;
        const count = `SELECT COUNT(*) AS cnt ${base}`;

        logger.info('QueryBuilder.searchRelational start (flat)', { filters: q, page, limit, orderBy, orderDir });
        let rows = await database.execute<RelationalFlatRow[] | RelationalFlatRow>(select, params);
        if (rows && !Array.isArray(rows)) rows = [rows];
        const countRows = await database.execute<CountRow[] | CountRow>(count, params);
        const total = Array.isArray(countRows) ? (countRows[0]?.cnt || 0) : ((countRows as CountRow)?.cnt || 0);
        return { rows: (rows as RelationalFlatRow[]) || [], meta: { total, page, limit } };
      }
    } catch (error) {
      logger.error('QueryBuilder.searchRelational error', {
        errorMessage: error instanceof Error ? error.message : 'unknown error',
        stack: error instanceof Error ? error.stack : 'unknown stack',
        filters: q
      });
      throw error;
    }
  }
}
