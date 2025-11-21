// Types pour le système d'export

export interface ExportMetadata {
  title: string;
  exportType: 'list' | 'detail';
  dataType: 'invoices' | 'suppliers' | 'relational';
  dateRange?: {
    from: string;
    to: string;
    formatted: string;
  };
  fiscalYear: string; // Année fiscale (de la recherche ou en cours)
  currentYear: string; // Année calendaire actuelle
  filters: Record<string, any>;
  totalRecords: number;
  generatedAt: string;
}

export interface InvoiceExportData {
  id: string;
  num_cmdt: string;
  num_invoice: string;
  supplier_name: string;
  supplier_account_number: string;
  supplier_phone: string;
  invoice_arr_date: string;
  invoice_date: string;
  amount: number;
  invoice_type: string;
  invoice_nature: string;
  dfc_status: string;
  attachments_count: number;
  folio: string;
  invoice_object?: string;
  create_at: string;
  update_at: string;
  created_by?: string;
  created_by_email?: string;
  created_by_role?: string;
}

export interface SupplierExportData {
  id: string;
  name: string;
  account_number: string;
  phone: string;
  fiscal_year: string;
  create_at: string;
  created_by?: string;
  created_by_email?: string;
  created_by_role?: string;
}

export interface RelationalExportData {
  supplier_id: string;
  supplier_name: string;
  supplier_account: string;
  supplier_phone?: string;
  invoice_count: number;
  total_amount: number;
  avg_amount: number;
  last_invoice_date?: string;
}
