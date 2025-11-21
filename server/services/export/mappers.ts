import { DateRange, ExportFormat, ExportType, ExportVariant } from './types';
import { getSetting } from '../../helpers/settings';

// Helpers
function nowDay(): string { return new Date().toLocaleDateString('fr-FR'); }
function nowTime(): string { return new Date().toLocaleTimeString('fr-FR'); }
function fmtDate(d: any): string | undefined {
  if (!d) return undefined;
  if (d instanceof Date) return d.toLocaleDateString('fr-FR');
  return typeof d === 'string' ? d : undefined;
}

// Per-template mappers. Each mapper is specific; no cross-template reuse.

export function mapInvoiceListOdt(rows: any[], dateRange: DateRange) {
  return {
    dateFrom: fmtDate(dateRange.dateFrom),
    dateTo: fmtDate(dateRange.dateTo),
    day: `Bamako, le ${nowDay()}`,
    generate_at: nowTime(),
    page: 1,
    total_inv: rows.length,
    total_page: 1,
    invoice: rows.map((r) => ({
      num_cmdt: r.num_cmdt ?? '',
      num_inv: r.num_invoice ?? '',
      object: r.invoice_object ?? '',
      supplier: r.supplier_name ?? '',
      amount: typeof r.amount === 'number' ? String(r.amount) : (r.amount ?? ''),
      inv_date: fmtDate(r.invoice_date),
      arr_date: fmtDate(r.invoice_arr_date),
      type: r.invoice_type ?? '',
    }))
  };
}

export function mapSupplierListOdt(rows: any[], dateRange: DateRange) {
  return {
    dateTo: fmtDate(dateRange.dateTo),
    dateFrom: fmtDate(dateRange.dateFrom),
    total_supp: rows.length,
    page: 1,
    total_page: 1,
    generate_at: nowDay(),
    generate_time: nowTime(),
    supplier: rows.map((r) => ({
      name: r.name ?? '',
      account_number: r.account_number ?? '',
      phone: r.phone ?? '',
      created_at: fmtDate(r.create_at ?? r.created_at) || ''
    }))
  };
}

export function mapRelationalListOdt(rows: any[], dateRange: DateRange) {
  return {
    dateFrom: fmtDate(dateRange.dateFrom),
    dateTo: fmtDate(dateRange.dateTo),
    day: `Bamako, le ${nowDay()}`,
    generate_time: nowTime(),
    total_supplier: rows.length,
    page: 1,
    total_page: 1,
    supplier: rows.map((r: any) => ({
      name: r.supplier_name ?? r.name ?? '',
      total_amount: r.total_amount ?? '',
      avg_amount: r.avg_amount ?? '',
      last_invoice: fmtDate(r.last_invoice_date ?? r.invoice_arr_date),
      total_inv: r.invoice_count ?? r.total_inv ?? undefined,
      phone: r.phone ?? undefined,
    }))
  };
}

export function mapInvoiceListXlsx(rows: any[], fiscalYear?: string) {
  return {
    fiscal_year: fiscalYear,
    generate_time: nowTime(),
    day: nowDay(),
    dateFrom: undefined,
    dateTo: undefined,
    invoice: rows.map((r) => ({
      num_cmdt: r.num_cmdt ?? '',
      num_inv: r.num_invoice ?? '',
      supplier: r.supplier_name ?? '',
      amount: typeof r.amount === 'number' ? String(r.amount) : (r.amount ?? ''),
      arr_date: fmtDate(r.invoice_arr_date),
      type: r.invoice_type ?? '',
      object: r.invoice_object ?? ''
    }))
  };
}

export function mapSupplierListXlsx(rows: any[], fiscalYear?: string) {
  return {
    fiscal_year: fiscalYear,
    day: nowDay(),
    dateFrom: undefined,
    dateTo: undefined,
    total: rows.length,
    supplier: rows.map((r) => ({
      name: r.name ?? '',
      account_number: r.account_number ?? '',
      phone: r.phone ?? '',
      created_at: fmtDate(r.create_at ?? r.created_at) || ''
    }))
  };
}

export function mapRelationalListXlsx(rows: any[], fiscalYear?: string) {
  return {
    fiscal_year: fiscalYear,
    day: nowDay(),
    dateFrom: undefined,
    dateTo: undefined,
    supplier: rows.map((r: any) => ({
      name: r.supplier_name ?? r.name ?? '',
      phone: r.phone ?? undefined,
      total_inv: r.invoice_count ?? r.total_inv ?? undefined,
      last_inv: fmtDate(r.last_invoice_date ?? r.invoice_arr_date),
      avg_amount: r.avg_amount ?? '',
      total_amount: r.total_amount ?? ''
    }))
  };
}

export async function resolveRootFiscalYear(): Promise<string | undefined> {
  try {
    const fy = await getSetting('fiscal_year');
    return fy;
  } catch {
    return undefined;
  }
}

// =============================
// OVERVIEW MAPPERS (ODT/XLSX)
// =============================

export function mapInvoiceOverviewOdt(detail: any) {
  return {
    day: nowDay(),
    generate_at: `${nowDay()} ${nowTime()}`,
    fiscal_year: detail?.fiscal_year ?? undefined,
    invoice: {
      id: detail?.id ?? '',
      num_cmdt: detail?.num_cmdt ?? '',
      inv_num: detail?.num_invoice ?? '',
      inv_date: fmtDate(detail?.invoice_date),
      arr_date: fmtDate(detail?.invoice_arr_date),
      send_date: fmtDate(detail?.create_at), // rule: send_date from create_at
      type: detail?.invoice_type ?? '',
      nature: detail?.invoice_nature ?? '',
      folio: detail?.folio ?? '',
      status: detail?.status ?? '',
      object: detail?.invoice_object ?? '',
      fiscal_year: detail?.fiscal_year ?? undefined,
      attachments: detail?.attachments ?? undefined,
    },
    supplier: {
      name: detail?.supplier?.name ?? '',
      account_number: detail?.supplier?.account_number ?? '',
      phone: detail?.supplier?.phone ?? '',
    }
  };
}

export function mapInvoiceOverviewXlsx(detail: any, dateRange: DateRange, rootFiscalYear?: string) {
  return {
    fiscal_year: rootFiscalYear,
    day: nowDay(),
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
    invoice: {
      id: detail?.id ?? '',
      num_cmdt: detail?.num_cmdt ?? '',
      num_inv: detail?.num_invoice ?? '',
      date_inv: fmtDate(detail?.invoice_date),
      date_send: fmtDate(detail?.create_at), // rule: date_send from create_at
      amount: typeof detail?.amount === 'number' ? String(detail?.amount) : (detail?.amount ?? ''),
      arr_date: fmtDate(detail?.invoice_arr_date),
      type: detail?.invoice_type ?? '',
      folio: detail?.folio ?? '',
      nature: detail?.invoice_nature ?? '',
      object: detail?.invoice_object ?? '',
      dfc_status: detail?.dfc_status ?? detail?.status ?? '',
      attachments: detail?.attachments ?? undefined,
      fiscal_year: detail?.fiscal_year ?? undefined,
      supplier: {
        name: detail?.supplier?.name ?? '',
        account_number: detail?.supplier?.account_number ?? '',
        phone: detail?.supplier?.phone ?? '',
      }
    }
  };
}

export function mapSupplierOverviewOdt(detail: any, rootFiscalYear?: string) {
  return {
    day: nowDay(),
    fiscal_year: rootFiscalYear,
    generate_at: nowTime(),
    supplier: {
      id: detail?.id ?? '',
      name: detail?.name ?? '',
      account_number: detail?.account_number ?? '',
      phone: detail?.phone ?? '',
      created_at: fmtDate(detail?.create_at ?? detail?.created_at) || '',
      emp: detail?.emp ?? undefined,
    }
  };
}

export function mapSupplierOverviewXlsx(detail: any, dateRange: DateRange, rootFiscalYear?: string) {
  return {
    fiscal_year: rootFiscalYear,
    day: nowDay(),
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
    supplier: {
      id: detail?.id ?? '',
      name: detail?.name ?? '',
      account_number: detail?.account_number ?? '',
      phone: detail?.phone ?? '',
      created_at: fmtDate(detail?.create_at ?? detail?.created_at) || '',
      emp: detail?.emp ?? undefined,
    }
  };
}

export function mapRelationalOverviewOdt(detail: any, rootFiscalYear?: string) {
  return {
    day: nowDay(),
    generate_time: nowTime(),
    fiscal_year: rootFiscalYear,
    total_supplier: 1,
    page: 1,
    total_page: 1,
    supplier: {
      id: detail?.supplier?.id ?? '',
      name: detail?.supplier?.name ?? '',
      account_number: detail?.supplier?.account_number ?? '',
      total_amount: detail?.supplier?.total_amount ?? '',
      avg_amount: detail?.supplier?.avg_amount ?? '',
      last_invoice: fmtDate(detail?.supplier?.last_invoice),
      total_inv: detail?.supplier?.total_inv ?? undefined,
    }
  };
}

export function mapRelationalOverviewXlsx(detail: any, dateRange: DateRange, rootFiscalYear?: string) {
  return {
    fiscal_year: rootFiscalYear,
    day: nowDay(),
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
    supplier: {
      id: detail?.supplier?.id ?? '',
      name: detail?.supplier?.name ?? '',
      phone: detail?.supplier?.phone ?? undefined,
      account_number: detail?.supplier?.account_number ?? '',
      total_inv: detail?.supplier?.total_inv ?? undefined,
      last_inv: fmtDate(detail?.supplier?.last_invoice),
      avg_amount: detail?.supplier?.avg_amount ?? '',
      total_amount: detail?.supplier?.total_amount ?? '',
    }
  };
}
