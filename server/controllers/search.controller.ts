import type { Response } from 'express';
import ApiResponder from '../utils/ApiResponder';
import logger from '../utils/Logger';
import { QueryBuilder } from '../utils/QueryBuilder';
import ExcelJS from 'exceljs';
import { exportLog } from '../utils/auditLogger';
import { AuthenticatedRequest } from '../types/express/request';
import database from '../config/database';
import * as path from 'path';
import * as fs from 'fs';
import { renderTemplateToPdfBuffer } from '../utils/htmlPdfRenderer';

// =============================================================================
// FONCTIONS DE RECHERCHE
// =============================================================================

export async function advancedInvoiceSearch(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  try {
    const user = req.user;
    if (!user) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');

    const result = await QueryBuilder.searchInvoices(req.query);
    return ApiResponder.success(res, result.rows, undefined, result.meta);
  } catch (error) {
    logger.error(`[${requestId}] Erreur advancedInvoiceSearch`, {
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      stack: error instanceof Error ? error.stack : 'unknown stack',
      query: req.query
    });
    return ApiResponder.error(res, error);
  }
}

export async function advancedSupplierSearch(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  try {
    const user = req.user;
    if (!user) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');

    const result = await QueryBuilder.searchSuppliers(req.query);
    return ApiResponder.success(res, result.rows, undefined, result.meta);
  } catch (error) {
    logger.error(`[${requestId}] Erreur advancedSupplierSearch`, {
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      stack: error instanceof Error ? error.stack : 'unknown stack',
      query: req.query
    });
    return ApiResponder.error(res, error);
  }
}

export async function relationalSearch(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  try {
    const user = req.user;
    if (!user) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');

    const result = await QueryBuilder.searchRelational(req.query);
    return ApiResponder.success(res, result.rows, undefined, result.meta);
  } catch (error) {
    logger.error(`[${requestId}] Erreur relationalSearch`, {
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      stack: error instanceof Error ? error.stack : 'unknown stack',
      query: req.query
    });
    return ApiResponder.error(res, error);
  }
}

// =============================================================================
// FONCTIONS UTILITAIRES DE TRADUCTION ET FORMATAGE
// =============================================================================

function translateColumnName(key: string): string {
  const map: Record<string, string> = {
    id: 'Référence',
    num_cmdt: 'Numéro CMDT',
    num_invoice: 'Numéro de facture',
    invoice_object: 'Objet',
    supplier_id: 'Fournisseur',
    supplier_name: 'Nom fournisseur',
    supplier_account: 'Numéro de compte',
    supplier_account_number: 'Numéro de compte',
    supplier_phone: 'Téléphone',
    invoice_type: 'Type de facture',
    invoice_nature: 'Nature',
    invoice_arr_date: 'Date d\'arrivée',
    invoice_date: 'Date de facture',
    folio: 'Folio',
    amount: 'Montant',
    total_amount: 'Montant total',
    avg_amount: 'Montant moyen',
    invoice_count: 'Nombre de factures',
    last_invoice_date: 'Dernière facture',
    status: 'Statut',
    dfc_status: 'Statut DFC',
    create_at: 'Créée le',
    update_at: 'Mise à jour le',
    attachments_count: 'Nombre de documents',
    created_by: 'Créé par',
    created_by_email: 'Email du créateur',
    created_by_role: 'Rôle du créateur',
    last_dfc_decision_date: 'Date de la dernière décision DFC'
  };
  
  if (map[key]) return map[key];
  
  const pretty = key.replace(/_/g, ' ').trim();
  return pretty.charAt(0).toUpperCase() + pretty.slice(1);
}

function translateDfcStatus(status: unknown): string {
  const s = String(status ?? '').toLowerCase();
  if (s === 'approved') return 'Approuvé';
  if (s === 'rejected') return 'Rejeté';
  if (s === 'pending') return 'En attente';
  return s || 'Non traité';
}

function formatDateFR(dateString: unknown): string {
  if (!dateString) return '';
  const d = new Date(String(dateString));
  if (Number.isNaN(d.getTime())) return String(dateString);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatAmountFCFA(amount: unknown): string {
  const num = Number(amount);
  if (!Number.isFinite(num)) return String(amount ?? '');
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(num) + ' FCFA';
}

function formatAmountFR(value: unknown): string {
  const num = Number(value);
  if (Number.isFinite(num)) {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(num);
  }
  return String(value ?? '');
}

function isAmountColumn(col: string): boolean {
  return /amount|montant/i.test(col);
}

function isCountColumn(col: string): boolean {
  return /count|nombre/i.test(col);
}

function isDateColumn(col: string): boolean {
  return /(date|create_at|update_at)/i.test(col);
}

function sanitizePdfText(input: unknown): string {
  const s = String(input ?? '');
  const replaced = s.replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000]/g, ' ');
  return Array.from(replaced).map(ch => ch.codePointAt(0)! > 0xFF ? '?' : ch).join('');
}

// =============================================================================
// FONCTIONS D'EXPORT (Excel, PDF via HTML)
// =============================================================================

async function generateExcelBuffer(rows: Record<string, unknown>[], sheetName = 'Export'): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (rows.length === 0) {
    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }

  // Pas de logo par défaut (laisse le template Excel gérer l'entête/logo si besoin)

  const keys = Object.keys(rows[0]);
  const headers = keys.map(k => ({
    header: translateColumnName(k),
    key: k,
    width: Math.min(40, Math.max(12, translateColumnName(k).length + 4))
  }));
  
  worksheet.columns = headers as any;

  rows.forEach((row) => {
    const r: Record<string, unknown> = {};
    keys.forEach(k => {
      let v = row[k];
      if (k === 'dfc_status') v = translateDfcStatus(v);
      else if (isAmountColumn(k) || k === 'amount') v = Number(row[k] ?? 0);
      else if (isDateColumn(k)) {
        const d = row[k] ? new Date(String(row[k])) : null;
        v = d && !isNaN(d.getTime()) ? d : row[k];
      }
      r[k] = v;
    });
    worksheet.addRow(r);
  });

  // Styles en-tête
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A472A' } };

  // Formats par colonne
  headers.forEach((h, idx) => {
    const col = worksheet.getColumn(idx + 1);
    if (typeof h.key === 'string') {
      if (isAmountColumn(h.key) || h.key === 'amount') {
        col.numFmt = '#,##0" FCFA"';
        col.alignment = { horizontal: 'right' };
      } else if (isDateColumn(h.key)) {
        col.numFmt = 'dd/mm/yyyy';
        col.alignment = { horizontal: 'center' };
      } else if (h.key === 'dfc_status') {
        col.alignment = { horizontal: 'center' };
      }
    }
  });

  // Mise en forme conditionnelle DFC
  const dfcIdx = keys.indexOf('dfc_status');
  if (dfcIdx >= 0) {
    const colLetter = worksheet.getColumn(dfcIdx + 1).letter;
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const cell = worksheet.getCell(`${colLetter}${i}`);
      const val = String(cell.value ?? '').toLowerCase();
      if (val.includes('approuvé')) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1F2D7' } };
        cell.font = { color: { argb: 'FF1E7E34' } };
      } else if (val.includes('rejeté')) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
        cell.font = { color: { argb: 'FF842029' } };
      } else if (val.includes('attente')) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
        cell.font = { color: { argb: 'FF664D03' } };
      }
    }
  }

  worksheet.eachRow((row, rowNumber) => {
    row.alignment = rowNumber === 1 ? { vertical: 'middle' } : { vertical: 'middle' };
    row.height = rowNumber === 1 ? 22 : 18;
  });

  const uint8Array = await workbook.xlsx.writeBuffer();
  return Buffer.from(uint8Array);
}

// Tente de remplir un modèle Excel existant (un enregistrement)
async function generateExcelFromTemplate(data: Record<string, unknown>, exportType: 'invoices'|'suppliers'|'relational'): Promise<Buffer | null> {
  try {
    const templatePath = path.join(__dirname, `../../common/templates/excel/${exportType}.xlsx`);
    if (!fs.existsSync(templatePath)) return null;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const ws = workbook.worksheets[0] ?? workbook.addWorksheet('Feuille1');

    // Mapping simple cellule -> clé
    const mapping: Record<string, string> = exportType === 'invoices'
      ? {
          A2: 'id',
          B2: 'num_cmdt',
          C2: 'num_invoice',
          D2: 'supplier_name',
          E2: 'invoice_arr_date',
          F2: 'amount',
          G2: 'dfc_status'
        }
      : exportType === 'suppliers'
      ? {
          A2: 'id',
          B2: 'name',
          C2: 'account_number',
          D2: 'phone',
          E2: 'create_at'
        }
      : {
          A2: 'supplier_name',
          B2: 'supplier_account',
          C2: 'invoice_count',
          D2: 'total_amount',
          E2: 'avg_amount',
          F2: 'last_invoice_date'
        };

    Object.entries(mapping).forEach(([cellRef, key]) => {
      let value = data[key];
      if (key === 'dfc_status') value = translateDfcStatus(value);
      else if (isDateColumn(key)) value = formatDateFR(value);
      else if (isAmountColumn(key) || key === 'amount' || key.includes('total') || key.includes('avg')) {
        value = formatAmountFCFA(value);
      }
      ws.getCell(cellRef).value = String(value ?? '');
    });

    const bytes = await workbook.xlsx.writeBuffer();
    return Buffer.from(bytes);
  } catch (e) {
    logger.error('Erreur génération Excel depuis template', { error: e instanceof Error ? e.message : e });
    return null;
  }
}

// legacy PDF generators removed: now only HTML→PDF via Puppeteer is supported

// =============================================================================
// FONCTIONS D'HISTORIQUE ET CONFIGURATION
// =============================================================================

export async function getExportHistory(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  try {
    const user = req.user;
    if (!user) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');

    logger.info('getExportHistory user', { userId: user.sup, userKeys: Object.keys(user) });

    const query = `
      SELECT invoice_id, format, exported_at 
      FROM export_log 
      WHERE exported_by = ? 
      ORDER BY exported_at DESC 
      LIMIT 20
    `;
    
    if (!user.sup) {
      logger.warn('getExportHistory: user.sup is undefined');
      return ApiResponder.success(res, [], 'Aucun export trouvé');
    }
    
    const rows = await database.execute<Array<{ invoice_id: string; format: string; exported_at: string }>>(query, [user.sup]);

    return ApiResponder.success(res, rows, 'Historique des exports récupéré');
  } catch (error) {
    logger.error(`[${requestId}] Erreur getExportHistory`, {
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      stack: error instanceof Error ? error.stack : 'unknown stack'
    });
    return ApiResponder.error(res, error);
  }
}

export async function getFiscalYears(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  try {
    const user = req.user;
    if (!user) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');

    const query = 'SELECT fiscal_year FROM fiscal_year_counter ORDER BY fiscal_year DESC';
    const rows = await database.execute<Array<{ fiscal_year: string }>>(query);
    const fiscalYears = rows.map((row) => row.fiscal_year);

    return ApiResponder.success(res, fiscalYears, 'Années fiscales récupérées');
  } catch (error) {
    logger.error(`[${requestId}] Erreur getFiscalYears`, {
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      stack: error instanceof Error ? error.stack : 'unknown stack'
    });
    return ApiResponder.error(res, error);
  }
}

// =============================================================================
// FONCTIONS D'EXPORT PRINCIPALES
// =============================================================================

export async function advancedExport(
  req: AuthenticatedRequest,
  res: Response
): Promise<unknown> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  try {
    const user = req.user;
    if (!user) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');

    const { type = 'invoices', format = 'xlsx' } = req.query as Record<string, string>;

    let result;
    if (type === 'suppliers') {
      result = await QueryBuilder.searchSuppliers(req.query);
    } else if (type === 'relational') {
      result = await QueryBuilder.searchRelational(req.query);
    } else {
      result = await QueryBuilder.searchInvoices(req.query);
    }

    const filename = `export-${type}-${new Date().toISOString().split('T')[0]}`;
    const fmt = String(format).toLowerCase();
    let buffer: Buffer;

    if (fmt === 'xlsx') {
      buffer = await generateExcelBuffer(result.rows, 'Export');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    } else if (fmt === 'pdf') {
      const rows = result.rows as Record<string, unknown>[];
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      const data = {
        title: type,
        headers: headers.map(h => translateColumnName(h)),
        rows: rows.map(r => {
          const out: Record<string, unknown> = {};
          headers.forEach((h) => {
            let v = r[h];
            if (h === 'dfc_status') v = translateDfcStatus(v);
            else if (isAmountColumn(h) || h === 'amount') v = formatAmountFCFA(v);
            else if (isDateColumn(h)) v = formatDateFR(v);
            out[translateColumnName(h)] = v ?? '';
          });
          return out;
        }),
        _generated_at: new Date().toLocaleString('fr-FR')
      };
      buffer = await renderTemplateToPdfBuffer({ templateName: 'list', data });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    } else {
      return ApiResponder.badRequest(res, 'Format non supporté. Utilisez pdf ou xlsx.');
    }

    // Log export in database
    await exportLog({
      invoice_id: null,
      format: fmt === 'xlsx' ? 'Excel' : 'PDF',
      exported_by: user.sup
    });

    return res.send(buffer);
  } catch (error) {
    logger.error(`[${requestId}] Erreur advancedExport`, {
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      stack: error instanceof Error ? error.stack : 'unknown stack',
      query: req.query
    });
    return ApiResponder.error(res, error);
  }
}

export async function exportInvoiceOverview(
  req: AuthenticatedRequest,
  res: Response
): Promise<unknown> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  try {
    const user = req.user;
    if (!user) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');

    const { id } = req.params;
    const { format = 'pdf' } = req.query as Record<string, string>;

    if (!id) {
      return ApiResponder.badRequest(res, 'ID de la facture requis');
    }

    const queryParams: Record<string, string | number> = {};
    
    Object.entries(req.query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'format') {
        const strValue = Array.isArray(value) ? String(value[0]) : String(value);
        queryParams[key] = strValue;
      }
    });
    
    queryParams.search = id;
    queryParams.include_supplier = String(queryParams.include_supplier || 'true');
    queryParams.include_attachments = String(queryParams.include_attachments || 'true');
    queryParams.include_dfc = String(queryParams.include_dfc || 'true');
    queryParams.limit = '1';

    const result = await QueryBuilder.searchInvoices(queryParams);

    if (!result.rows || result.rows.length === 0) {
      return ApiResponder.notFound(res, 'Facture introuvable');
    }

    const invoice = result.rows[0] as Record<string, unknown>;
    const filename = `facture-${String(invoice.num_cmdt || invoice.id)}-${new Date().toISOString().split('T')[0]}`;
    const fmt = String(format).toLowerCase();
    let buffer: Buffer;

    if (fmt === 'xlsx') {
      const templ = await generateExcelFromTemplate(invoice as Record<string, unknown>, 'invoices');
      if (!templ) return ApiResponder.badRequest(res, 'Modèle Excel introuvable pour invoices.xlsx');
      buffer = templ;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    } else if (fmt === 'pdf') {
      const data = {
        ...invoice,
        _generated_at: new Date().toLocaleString('fr-FR'),
        amount: formatAmountFCFA((invoice as Record<string, unknown>).amount),
        dfc_status: translateDfcStatus((invoice as Record<string, unknown>).dfc_status),
        invoice_arr_date: formatDateFR((invoice as Record<string, unknown>).invoice_arr_date)
      };
      buffer = await renderTemplateToPdfBuffer({ templateName: 'invoice', data });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    } else {
      return ApiResponder.badRequest(res, 'Format non supporté. Utilisez pdf ou xlsx.');
    }

    await exportLog({
      invoice_id: String(invoice.id || ''),
      format: fmt === 'xlsx' ? 'Excel' : 'PDF',
      exported_by: user.sup
    });

    return res.send(buffer);
  } catch (error) {
    logger.error(`[${requestId}] Erreur exportInvoiceOverview`, {
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      stack: error instanceof Error ? error.stack : 'unknown stack',
      invoiceId: req.params.id,
      query: req.query
    });
    return ApiResponder.error(res, error);
  }
}

export async function exportSupplierOverview(
  req: AuthenticatedRequest,
  res: Response
): Promise<unknown> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  try {
    const user = req.user;
    if (!user) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');

    const { id } = req.params;
    const { format = 'pdf' } = req.query as Record<string, string>;

    if (!id) {
      return ApiResponder.badRequest(res, 'ID du fournisseur requis');
    }

    const queryParams: Record<string, string | number> = {};
    
    Object.entries(req.query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'format') {
        const strValue = Array.isArray(value) ? String(value[0]) : String(value);
        queryParams[key] = strValue;
      }
    });
    
    queryParams.search = id;
    queryParams.limit = '1';

    const result = await QueryBuilder.searchSuppliers(queryParams);

    if (!result.rows || result.rows.length === 0) {
      return ApiResponder.notFound(res, 'Fournisseur introuvable');
    }

    const supplier = result.rows[0] as Record<string, unknown>;
    const filename = `fournisseur-${String(supplier.id)}-${new Date().toISOString().split('T')[0]}`;
    const fmt = String(format).toLowerCase();
    let buffer: Buffer;

    if (fmt === 'xlsx') {
      const templ = await generateExcelFromTemplate(supplier as Record<string, unknown>, 'suppliers');
      if (!templ) return ApiResponder.badRequest(res, 'Modèle Excel introuvable pour suppliers.xlsx');
      buffer = templ;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    } else if (fmt === 'pdf') {
      const data = {
        ...supplier,
        _generated_at: new Date().toLocaleString('fr-FR'),
        create_at: formatDateFR((supplier as Record<string, unknown>).create_at)
      };
      buffer = await renderTemplateToPdfBuffer({ templateName: 'supplier', data });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    } else {
      return ApiResponder.badRequest(res, 'Format non supporté. Utilisez pdf ou xlsx.');
    }

    await exportLog({
      invoice_id: `supplier_${String(supplier.id)}`,
      format: fmt === 'xlsx' ? 'Excel' : 'PDF',
      exported_by: user.sup
    });

    return res.send(buffer);
  } catch (error) {
    logger.error(`[${requestId}] Erreur exportSupplierOverview`, {
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      stack: error instanceof Error ? error.stack : 'unknown stack',
      supplierId: req.params.id,
      query: req.query
    });
    return ApiResponder.error(res, error);
  }
}

export async function exportGroupedOverview(
  req: AuthenticatedRequest,
  res: Response
): Promise<unknown> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  try {
    const user = req.user;
    if (!user) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');

    const { supplierId } = req.params;
    const { format = 'pdf' } = req.query;

    if (!supplierId) {
      return ApiResponder.badRequest(res, 'ID du fournisseur requis');
    }

    const queryParams: Record<string, string | number> = {};
    
    Object.entries(req.query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'format') {
        const strValue = Array.isArray(value) ? String(value[0]) : String(value);
        queryParams[key] = strValue;
      }
    });
    
    queryParams.group_by = 'supplier';
    queryParams.aggregate = 'true';
    queryParams.include_supplier = 'true';
    queryParams.limit = '1';
    
    const whereConditions: string[] = ['s.id = ?'];
    const params: unknown[] = [supplierId];
    
    if (queryParams.fiscal_year) {
      whereConditions.push('i.fiscal_year = ?');
      params.push(queryParams.fiscal_year);
    }
    if (queryParams.invoice_type) {
      whereConditions.push('i.invoice_type = ?');
      params.push(queryParams.invoice_type);
    }
    if (queryParams.invoice_nature) {
      whereConditions.push('i.invoice_nature = ?');
      params.push(queryParams.invoice_nature);
    }
    if (queryParams.dfc_status) {
      whereConditions.push('i.dfc_status = ?');
      params.push(queryParams.dfc_status);
    }
    if (queryParams.dateFrom) {
      whereConditions.push('i.invoice_arr_date >= ?');
      params.push(queryParams.dateFrom);
    }
    if (queryParams.dateTo) {
      whereConditions.push('i.invoice_arr_date <= ?');
      params.push(queryParams.dateTo);
    }
    if (queryParams.amountMin) {
      whereConditions.push('CAST(i.amount AS DECIMAL(18,2)) >= ?');
      params.push(queryParams.amountMin);
    }
    if (queryParams.amountMax) {
      whereConditions.push('CAST(i.amount AS DECIMAL(18,2)) <= ?');
      params.push(queryParams.amountMax);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const directQuery = `
      SELECT 
        s.id AS supplier_id,
        s.name AS supplier_name,
        s.account_number AS supplier_account,
        COUNT(i.id) AS invoice_count,
        SUM(CAST(i.amount AS DECIMAL(18,2))) AS total_amount,
        AVG(CAST(i.amount AS DECIMAL(18,2))) AS avg_amount,
        MAX(i.invoice_arr_date) AS last_invoice_date
      FROM invoice i
      LEFT JOIN supplier s ON s.id = i.supplier_id
      ${whereClause}
      GROUP BY s.id
      LIMIT 1
    `;
    
    const rows = await database.execute<Record<string, unknown>[] | Record<string, unknown>>(directQuery, params);
    const groupedData = Array.isArray(rows) ? rows[0] : rows as Record<string, unknown> | undefined;

    if (!groupedData) {
      return ApiResponder.notFound(res, 'Statistiques introuvables pour ce fournisseur');
    }

    const supplierIdValue = String(groupedData.supplier_id || supplierId);
    const filename = `statistiques-fournisseur-${supplierIdValue}-${new Date().toISOString().split('T')[0]}`;
    const fmt = String(format).toLowerCase();
    let buffer: Buffer;

    if (fmt === 'xlsx') {
      const templ = await generateExcelFromTemplate(groupedData as Record<string, unknown>, 'relational');
      if (!templ) return ApiResponder.badRequest(res, 'Modèle Excel introuvable pour relational.xlsx');
      buffer = templ;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    } else if (fmt === 'pdf') {
      const headers = Object.keys(groupedData as Record<string, unknown>);
      const data = {
        title: 'relational',
        headers: headers.map(h => translateColumnName(h)),
        rows: [groupedData].map((r) => {
          const out: Record<string, unknown> = {};
          headers.forEach(h => {
            let v = (r as Record<string, unknown>)[h];
            if (h === 'dfc_status') v = translateDfcStatus(v);
            else if (isAmountColumn(h) || h === 'amount') v = formatAmountFCFA(v);
            else if (isDateColumn(h)) v = formatDateFR(v);
            out[translateColumnName(h)] = v ?? '';
          });
          return out;
        }),
        _generated_at: new Date().toLocaleString('fr-FR')
      };
      buffer = await renderTemplateToPdfBuffer({ templateName: 'list', data });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    } else {
      return ApiResponder.badRequest(res, 'Format non supporté. Utilisez pdf ou xlsx.');
    }

    await exportLog({
      invoice_id: `grouped_${supplierIdValue}`,
      format: fmt === 'xlsx' ? 'Excel' : 'PDF',
      exported_by: user.sup
    });

    return res.send(buffer);
  } catch (error) {
    logger.error(`[${requestId}] Erreur exportGroupedOverview`, {
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      stack: error instanceof Error ? error.stack : 'unknown stack',
      supplierId: req.params.supplierId,
      query: req.query
    });
    return ApiResponder.error(res, error);
  }
}