import { z } from 'zod';

// Minimal Zod schemas aligned to server/templates/odt_excel_carbone_data.json
// Fields are optional to avoid over-constraining; names strictly match the template keys.

const DateStr = z.string().optional();
const TimeStr = z.string().optional();
const Int = z.number().int().optional();
const NumStr = z.string().optional();

// LIST - ODT
export const InvoiceListOdtSchema = z.object({
  dateFrom: DateStr,
  dateTo: DateStr,
  day: z.string().optional(),
  generate_at: TimeStr,
  page: Int,
  total_inv: Int,
  total_page: Int,
  invoice: z.array(z.object({
    num_cmdt: z.string().optional(),
    num_inv: z.string().optional(),
    object: z.string().optional(),
    supplier: z.string().optional(),
    amount: NumStr,
    inv_date: DateStr,
    arr_date: DateStr,
    type: z.string().optional(),
  }))
});

export const SupplierListOdtSchema = z.object({
  dateTo: DateStr,
  dateFrom: DateStr,
  total_supp: Int,
  page: Int,
  total_page: Int,
  generate_at: z.string().optional(),
  generate_time: z.string().optional(),
  supplier: z.array(z.object({
    name: z.string().optional(),
    account_number: z.string().optional(),
    phone: z.string().optional(),
    created_at: z.string().optional(),
  }))
});

export const RelationalListOdtSchema = z.object({
  dateFrom: DateStr,
  dateTo: DateStr,
  day: z.string().optional(),
  generate_time: z.string().optional(),
  total_supplier: Int,
  page: Int,
  total_page: Int,
  supplier: z.array(z.object({
    name: z.string().optional(),
    total_amount: NumStr,
    avg_amount: NumStr,
    last_invoice: DateStr,
    total_inv: Int,
    phone: z.string().optional(),
  }))
});

// LIST - XLSX
export const InvoiceListXlsxSchema = z.object({
  fiscal_year: z.string().optional(),
  generate_time: z.string().optional(),
  day: z.string().optional(),
  dateFrom: DateStr,
  dateTo: DateStr,
  invoice: z.array(z.object({
    num_cmdt: z.string().optional(),
    num_inv: z.string().optional(),
    supplier: z.string().optional(),
    amount: NumStr,
    arr_date: DateStr,
    type: z.string().optional(),
    object: z.string().optional(),
  }))
});

export const SupplierListXlsxSchema = z.object({
  fiscal_year: z.string().optional(),
  day: z.string().optional(),
  dateFrom: DateStr,
  dateTo: DateStr,
  total: Int,
  supplier: z.array(z.object({
    name: z.string().optional(),
    account_number: z.string().optional(),
    phone: z.string().optional(),
    created_at: z.string().optional(),
  }))
});

export const RelationalListXlsxSchema = z.object({
  fiscal_year: z.string().optional(),
  day: z.string().optional(),
  dateFrom: DateStr,
  dateTo: DateStr,
  supplier: z.array(z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    total_inv: Int,
    last_inv: DateStr,
    avg_amount: NumStr,
    total_amount: NumStr,
  }))
});

// OVERVIEW - ODT
export const InvoiceOverviewOdtSchema = z.object({
  day: z.string().optional(),
  generate_at: z.string().optional(),
  fiscal_year: z.string().optional(),
  invoice: z.object({
    id: z.string().optional(),
    num_cmdt: z.string().optional(),
    inv_num: z.string().optional(),
    inv_date: DateStr,
    arr_date: DateStr,
    send_date: DateStr,
    amount: NumStr,
    type: z.string().optional(),
    nature: z.string().optional(),
    folio: z.string().optional(),
    status: z.string().optional(),
    object: z.string().optional(),
    fiscal_year: z.string().optional(),
    attachments: z.string().optional(),
  }),
  supplier: z.object({
    name: z.string().optional(),
    account_number: z.string().optional(),
    phone: z.string().optional(),
  })
});

export const SupplierOverviewOdtSchema = z.object({
  day: DateStr,
  fiscal_year: z.string().optional(),
  generate_at: z.string().optional(),
  supplier: z.object({
    id: z.union([z.number(), z.string()]).optional(),
    name: z.string().optional(),
    account_number: z.string().optional(),
    phone: z.string().optional(),
    created_at: z.string().optional(),
    emp: z.object({
      id: z.string().optional(),
      email: z.string().optional(),
      role: z.string().optional(),
    }).partial().optional()
  })
});

export const RelationalOverviewOdtSchema = z.object({
  day: z.string().optional(),
  generate_time: z.string().optional(),
  fiscal_year: z.string().optional(),
  total_supplier: Int,
  page: Int,
  total_page: Int,
  supplier: z.object({
    id: z.union([z.number(), z.string()]).optional(),
    name: z.string().optional(),
    account_number: z.string().optional(),
    total_amount: NumStr,
    avg_amount: NumStr,
    last_invoice: DateStr,
    total_inv: Int,
  })
});

// OVERVIEW - XLSX
export const InvoiceOverviewXlsxSchema = z.object({
  fiscal_year: z.string().optional(),
  day: z.string().optional(),
  dateFrom: DateStr,
  dateTo: DateStr,
  invoice: z.object({
    id: z.string().optional(),
    num_cmdt: z.string().optional(),
    num_inv: z.string().optional(),
    date_inv: DateStr,
    date_send: DateStr,
    amount: NumStr,
    arr_date: DateStr,
    type: z.string().optional(),
    folio: z.string().optional(),
    nature: z.string().optional(),
    object: z.string().optional(),
    dfc_status: z.string().optional(),
    attachments: z.string().optional(),
    fiscal_year: z.string().optional(),
    supplier: z.object({
      name: z.string().optional(),
      account_number: z.string().optional(),
      phone: z.string().optional(),
    }).optional(),
  })
});

export const SupplierOverviewXlsxSchema = z.object({
  fiscal_year: z.string().optional(),
  day: z.string().optional(),
  dateFrom: DateStr,
  dateTo: DateStr,
  supplier: z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    account_number: z.string().optional(),
    phone: z.string().optional(),
    created_at: z.string().optional(),
    emp: z.object({
      id: z.string().optional(),
      name: z.string().optional(),
      email: z.string().optional(),
      role: z.string().optional(),
    }).partial().optional(),
  })
});

export const RelationalOverviewXlsxSchema = z.object({
  fiscal_year: z.string().optional(),
  day: z.string().optional(),
  dateFrom: DateStr,
  dateTo: DateStr,
  supplier: z.object({
    id: z.union([z.number(), z.string()]).optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
    account_number: z.string().optional(),
    total_inv: Int,
    last_inv: DateStr,
    avg_amount: NumStr,
    total_amount: NumStr,
  })
});

export const ExportSchemas = {
  'invoice-list_odt': InvoiceListOdtSchema,
  'supplier-list_odt': SupplierListOdtSchema,
  'relational-list_odt': RelationalListOdtSchema,
  'invoice-list_xlsx': InvoiceListXlsxSchema,
  'supplier-list_xlsx': SupplierListXlsxSchema,
  'relational-list_xlsx': RelationalListXlsxSchema,
  'invoice-overview_odt': InvoiceOverviewOdtSchema,
  'supplier-overview_odt': SupplierOverviewOdtSchema,
  'relational-overview_odt': RelationalOverviewOdtSchema,
  'invoice-overview_xlsx': InvoiceOverviewXlsxSchema,
  'supplier-overview_xlsx': SupplierOverviewXlsxSchema,
  'relational-overview_xlsx': RelationalOverviewXlsxSchema,
} as const;

export function validateExportData(templateKey: keyof typeof ExportSchemas, data: unknown) {
  const schema = ExportSchemas[templateKey];
  return schema.parse(data);
}
