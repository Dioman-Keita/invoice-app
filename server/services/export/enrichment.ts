import database from '../../config/database';

export type InvoiceDetails = {
  id: string;
  num_cmdt?: string;
  num_invoice?: string;
  invoice_date?: string;
  invoice_arr_date?: string;
  create_at?: string; // used as send_date/date_send
  invoice_type?: string;
  invoice_nature?: string;
  folio?: string;
  status?: string;
  invoice_object?: string;
  fiscal_year?: string;
  supplier?: {
    name?: string;
    account_number?: string;
    phone?: string;
  };
  attachments?: string; // flattened list for templates that expect string
};

export type SupplierDetails = {
  id: string | number;
  name?: string;
  account_number?: string;
  phone?: string;
  create_at?: string;
  emp?: { id?: string; name?: string; email?: string; role?: string };
};

export type RelationalDetails = {
  supplier: {
    id: string | number;
    name?: string;
    account_number?: string;
    total_amount?: string;
    avg_amount?: string;
    last_invoice?: string;
    total_inv?: number;
  };
};

export async function fetchInvoiceDetailsById(id: string): Promise<InvoiceDetails | null> {
  const sql = `
    SELECT i.*, s.name AS supplier_name, s.account_number AS supplier_account_number, s.phone AS supplier_phone
    FROM invoice i
    LEFT JOIN supplier s ON s.id = i.supplier_id
    WHERE i.id = ?
    LIMIT 1
  `;
  const row = await database.execute<any[] | any>(sql, [id]);
  const r = Array.isArray(row) ? row[0] : row;
  if (!r) return null;
  return {
    id: r.id,
    num_cmdt: r.num_cmdt,
    num_invoice: r.num_invoice,
    invoice_date: r.invoice_date,
    invoice_arr_date: r.invoice_arr_date,
    create_at: r.create_at,
    invoice_type: r.invoice_type,
    invoice_nature: r.invoice_nature,
    folio: r.folio,
    status: r.status,
    invoice_object: r.invoice_object,
    fiscal_year: r.fiscal_year,
    supplier: {
      name: r.supplier_name,
      account_number: r.supplier_account_number,
      phone: r.supplier_phone,
    },
    attachments: r.attachments || undefined,
  };
}

export async function fetchSupplierDetailsById(id: string | number): Promise<SupplierDetails | null> {
  const sql = `SELECT * FROM supplier WHERE id = ? LIMIT 1`;
  const row = await database.execute<any[] | any>(sql, [id]);
  const r = Array.isArray(row) ? row[0] : row;
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    account_number: r.account_number,
    phone: r.phone,
    create_at: r.create_at,
    // emp is optional and depends on your model. Leaving undefined by default.
  };
}

export async function fetchRelationalDetailsBySupplierId(id: string | number): Promise<RelationalDetails | null> {
  const base = `FROM invoice i LEFT JOIN supplier s ON s.id = i.supplier_id WHERE s.id = ?`;
  const aggSql = `SELECT 
      s.id AS supplier_id,
      s.name AS supplier_name,
      s.account_number AS supplier_account,
      COUNT(i.id) AS invoice_count,
      SUM(CAST(i.amount AS DECIMAL(18,2))) AS total_amount,
      AVG(CAST(i.amount AS DECIMAL(18,2))) AS avg_amount,
      MAX(i.invoice_arr_date) AS last_invoice_date
    ${base}
    GROUP BY s.id, s.name, s.account_number
  `;
  const row = await database.execute<any[] | any>(aggSql, [id]);
  const r = Array.isArray(row) ? row[0] : row;
  if (!r) return null;
  return {
    supplier: {
      id: r.supplier_id,
      name: r.supplier_name,
      account_number: r.supplier_account,
      total_amount: r.total_amount,
      avg_amount: r.avg_amount,
      last_invoice: r.last_invoice_date,
      total_inv: r.invoice_count,
    }
  };
}
