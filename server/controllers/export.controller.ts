import type { Response } from 'express';
import { AuthenticatedRequest } from '../types/express/request';
import ApiResponder from '../utils/ApiResponder';
import logger from '../utils/Logger';
import { ExportFormat, ExportType, ExportVariant } from '../services/export/types';
import { getTemplateInfo } from '../services/export/templateRegistry';
import { renderWithCarbone } from '../services/export/generator';
import { runSearch } from '../services/export/providers';
import { resolveDateRange } from '../services/export/dateRange.service';
import { mapInvoiceListOdt, mapInvoiceListXlsx, mapRelationalListOdt, mapRelationalListXlsx, mapSupplierListOdt, mapSupplierListXlsx, resolveRootFiscalYear, mapInvoiceOverviewOdt, mapInvoiceOverviewXlsx, mapSupplierOverviewOdt, mapSupplierOverviewXlsx, mapRelationalOverviewOdt, mapRelationalOverviewXlsx } from '../services/export/mappers';
import { fetchInvoiceDetailsById, fetchRelationalDetailsBySupplierId, fetchSupplierDetailsById } from '../services/export/enrichment';
import database from '../config/database';
import { getSetting } from '../helpers/settings';
import { mapInvoiceStatsOdt } from '../services/export/mappers';

export async function exportData(req: AuthenticatedRequest, res: Response): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const user = req.user;
    if (!user) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');

    const { type, variant, format, search } = (req.body || {}) as {
      type: ExportType;
      variant: ExportVariant;
      format: ExportFormat;
      search: Record<string, any>;
    };

    if (!type || !variant || !format) {
      return ApiResponder.badRequest(res, 'type, variant et format sont requis');
    }

    // Exécuter la même recherche que le module Search
    const result = await runSearch(type, search || {});

    // Résoudre le range de dates manquant si la structure le requiert
    const dateFrom = search?.dateFrom || search?.supplier_created_from;
    const dateTo = search?.dateTo || search?.supplier_created_to;
    const dateRange = await resolveDateRange(type, dateFrom, dateTo);

    // Fiscal year (racine) si nécessaire
    const rootFiscalYear = await resolveRootFiscalYear();

    // Mapper en structure JSON spécifique au template
    let payload: any;
    const isOdt = format === 'odt' || format === 'pdf';
    const norm = (d: any): string | undefined => {
      if (!d) return undefined;
      if (d instanceof Date) return d.toLocaleDateString('fr-FR');
      return typeof d === 'string' ? d : undefined;
    };

    if (type === 'invoice' && variant === 'list' && isOdt) {
      payload = mapInvoiceListOdt(result.rows, dateRange);
    } else if (type === 'supplier' && variant === 'list' && isOdt) {
      payload = mapSupplierListOdt(result.rows, dateRange);
    } else if (type === 'relational' && variant === 'list' && isOdt) {
      payload = mapRelationalListOdt(result.rows, dateRange);
    } else if (type === 'invoice' && variant === 'list' && format === 'xlsx') {
      payload = { ...mapInvoiceListXlsx(result.rows, rootFiscalYear), dateFrom: norm(dateRange.dateFrom), dateTo: norm(dateRange.dateTo) };
    } else if (type === 'supplier' && variant === 'list' && format === 'xlsx') {
      payload = { ...mapSupplierListXlsx(result.rows, rootFiscalYear), dateFrom: norm(dateRange.dateFrom), dateTo: norm(dateRange.dateTo) };
    } else if (type === 'relational' && variant === 'list' && format === 'xlsx') {
      payload = { ...mapRelationalListXlsx(result.rows, rootFiscalYear), dateFrom: norm(dateRange.dateFrom), dateTo: norm(dateRange.dateTo) };
    } else if (type === 'invoice' && variant === 'overview' && isOdt) {
      const invoiceId = (search && (search.id || search.invoice_id)) || (Array.isArray(result.rows) && (result.rows[0]?.id));
      if (!invoiceId) return ApiResponder.badRequest(res, 'invoice id manquant pour overview');
      const detail = await fetchInvoiceDetailsById(String(invoiceId));
      if (!detail) return ApiResponder.notFound(res, 'Facture introuvable');
      payload = mapInvoiceOverviewOdt(detail);
    } else if (type === 'invoice' && variant === 'overview' && format === 'xlsx') {
      const invoiceId = (search && (search.id || search.invoice_id)) || (Array.isArray(result.rows) && (result.rows[0]?.id));
      if (!invoiceId) return ApiResponder.badRequest(res, 'invoice id manquant pour overview');
      const detail = await fetchInvoiceDetailsById(String(invoiceId));
      if (!detail) return ApiResponder.notFound(res, 'Facture introuvable');
      payload = mapInvoiceOverviewXlsx(detail, dateRange, rootFiscalYear);
    } else if (type === 'supplier' && variant === 'overview' && isOdt) {
      const supplierId = (search && (search.id || search.supplier_id)) || (Array.isArray(result.rows) && (result.rows[0]?.id));
      if (!supplierId) return ApiResponder.badRequest(res, 'supplier id manquant pour overview');
      const detail = await fetchSupplierDetailsById(supplierId);
      if (!detail) return ApiResponder.notFound(res, 'Fournisseur introuvable');
      payload = mapSupplierOverviewOdt(detail, rootFiscalYear);
    } else if (type === 'supplier' && variant === 'overview' && format === 'xlsx') {
      const supplierId = (search && (search.id || search.supplier_id)) || (Array.isArray(result.rows) && (result.rows[0]?.id));
      if (!supplierId) return ApiResponder.badRequest(res, 'supplier id manquant pour overview');
      const detail = await fetchSupplierDetailsById(supplierId);
      if (!detail) return ApiResponder.notFound(res, 'Fournisseur introuvable');
      payload = mapSupplierOverviewXlsx(detail, dateRange, rootFiscalYear);
    } else if (type === 'relational' && variant === 'overview' && isOdt) {
      const supplierId = (search && (search.id || search.supplier_id)) || (Array.isArray(result.rows) && (result.rows[0]?.supplier_id || result.rows[0]?.id));
      if (!supplierId) return ApiResponder.badRequest(res, 'supplier id manquant pour overview relationnel');
      const detail = await fetchRelationalDetailsBySupplierId(supplierId);
      if (!detail) return ApiResponder.notFound(res, 'Données relationnelles introuvables');
      payload = mapRelationalOverviewOdt(detail, rootFiscalYear);
    } else if (type === 'relational' && variant === 'overview' && format === 'xlsx') {
      const supplierId = (search && (search.id || search.supplier_id)) || (Array.isArray(result.rows) && (result.rows[0]?.supplier_id || result.rows[0]?.id));
      if (!supplierId) return ApiResponder.badRequest(res, 'supplier id manquant pour overview relationnel');
      const detail = await fetchRelationalDetailsBySupplierId(supplierId);
      if (!detail) return ApiResponder.notFound(res, 'Données relationnelles introuvables');
      payload = mapRelationalOverviewXlsx(detail, dateRange, rootFiscalYear);
    } else if (type === 'invoice' && variant === 'stats' && isOdt) {
      // date format attendue: 'YYYY-MM-DD' (fallback: aujourd'hui)
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const selectedDate = (search && search.date) ? String(search.date) : `${y}-${m}-${d}`;
      const fy = await getSetting('fiscal_year');
      const employeeId = req?.user?.sup;
      const rows = await database.execute<any[] | any>(
        `SELECT i.id, 
        i.num_cmdt, 
        i.num_invoice, 
        i.invoice_date, 
        i.invoice_arr_date, 
        i.amount, 
        i.invoice_type, 
        i.invoice_object, 
        s.name AS supplier_name  
        FROM invoice i 
        LEFT JOIN supplier s ON s.id = i.supplier_id 
        WHERE i.fiscal_year = ? AND i.created_by = ? AND DATE(i.create_at) = ? 
        ORDER BY i.create_at DESC`,
        [fy, employeeId, selectedDate]
      );

      const arr = Array.isArray(rows) ? rows : (rows ? [rows] : []);
      payload = mapInvoiceStatsOdt(arr, selectedDate);

    } else {
      return ApiResponder.badRequest(res, 'Cette combinaison type/variant/format n\'est pas encore implémentée');
    }

    // Rendu via Carbone
    const template = getTemplateInfo(type, variant, format);
    const { buffer, filename } = await renderWithCarbone(template, payload, format);

    // Réponse HTTP
    const contentType = format === 'pdf' ? 'application/pdf' : (format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/vnd.oasis.opendocument.text');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.end(buffer, 'binary');
  } catch (error) {
    logger.error(`[${requestId}] exportData error`, { error });
    return ApiResponder.error(res, error);
  }
}
