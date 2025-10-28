import type { Request, Response } from 'express';
import ApiResponder from '../utils/ApiResponder';
import logger from '../utils/Logger';
import { QueryBuilder } from '../utils/QueryBuilder';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { exportLog } from '../utils/auditLogger';

export async function advancedInvoiceSearch(
  req: Request,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const user = (req as any).user;
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
  req: Request,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const user = (req as any).user;
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
  req: Request,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const user = (req as any).user;
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

function toCSV(rows: any[]): string {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const r of rows) {
    const vals = headers.map(h => {
      const v = r[h];
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return `"${s}"`;
    });
    lines.push(vals.join(','));
  }
  return lines.join('\n');
}

export async function getExportHistory(
  req: Request,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const user = (req as any).user;
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
    
    const rows: any = await (require('../config/database').default.execute(query, [user.sup]));

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
  req: Request,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const user = (req as any).user;
    if (!user) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');

    const query = 'SELECT fiscal_year FROM fiscal_year_counter ORDER BY fiscal_year DESC';
    const rows: any = await (require('../config/database').default.execute(query));

    const fiscalYears = rows.map((row: any) => row.fiscal_year);

    return ApiResponder.success(res, fiscalYears, 'Années fiscales récupérées');
  } catch (error) {
    logger.error(`[${requestId}] Erreur getFiscalYears`, {
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      stack: error instanceof Error ? error.stack : 'unknown stack'
    });
    return ApiResponder.error(res, error);
  }
}

export async function advancedExport(
  req: Request,
  res: Response
): Promise<any> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const user = (req as any).user;
    if (!user) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');

    const { type = 'invoices', format = 'xlsx' } = req.query as any;

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
      // Generate proper Excel file (.xlsx) with exceljs
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Export');
      
      if (result.rows.length > 0) {
        const headers = Object.keys(result.rows[0]);
        worksheet.addRow(headers);
        result.rows.forEach(row => {
          worksheet.addRow(headers.map(h => row[h] ?? ''));
        });
        
        // Auto-width columns
        worksheet.columns.forEach(column => {
          if (column.header) {
            column.width = column.header.toString().length < 15 ? 15 : column.header.toString().length;
          }
        });
      }
      
      const uint8Array = await workbook.xlsx.writeBuffer();
      buffer = Buffer.from(uint8Array);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    } else if (fmt === 'pdf') {
      // Generate simple PDF table
      const doc = new PDFDocument({ margin: 30 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.fontSize(14).text(`Export ${type} - ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown();

      if (result.rows.length > 0) {
        const headers = Object.keys(result.rows[0]);
        let y = doc.y;
        // Headers
        headers.forEach((h, i) => {
          doc.fontSize(10).text(h, 50 + i * 100, y, { width: 90 });
        });
        y += 20;
        // Rows
        result.rows.forEach(row => {
          if (y > 700) { doc.addPage(); y = 50; }
          headers.forEach((h, i) => {
            doc.text(String(row[h] ?? ''), 50 + i * 100, y, { width: 90 });
          });
          y += 15;
        });
      } else {
        doc.text('Aucune donnée');
      }

      doc.end();
      buffer = await new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    } else {
      // CSV fallback
      const csv = toCSV(result.rows);
      buffer = Buffer.from(csv, 'utf8');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    }

    // Log export in database
    await exportLog({
      invoice_id: type === 'invoices' ? 'bulk_export' : `${type}_export`,
      format: fmt === 'xlsx' ? 'Excel' : fmt === 'pdf' ? 'PDF' : fmt === 'csv' ? 'CSV' : fmt === 'txt' ? 'TXT' : 'JSON',
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
