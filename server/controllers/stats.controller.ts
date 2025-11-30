import type { Request, Response } from 'express';

import ApiResponder from '../utils/ApiResponder';
import logger from '../utils/Logger';
import database from '../config/database';
import { getSetting } from '../helpers/settings';
import { getEntityDateRange } from '../helpers/statsDateRange';

type Granularity = 'day' | 'week' | 'month' | 'fiscal_year';

function parseGranularity(t?: string): Granularity {
  return t && ['day', 'week', 'month', 'fiscal_year'].includes(t) ? (t as Granularity) : 'fiscal_year';
}

// Types de lignes utilisées
type EmployeeInvoiceRow = { employee_id: string | null; employee_name: string | null; total: number; total_amount?: number };
type DfcAgentRow = { agent_id: string | null; agent_name: string | null; approved: number; rejected: number; total: number };
type SupplierCreatedRow = { employee_id: string | null; employee_name: string | null; total: number };
type SupplierActivityRow = { supplier_id: number | null; supplier_name: string | null; total_invoices: number; total_amount: number; activity_status?: string };
type InvoiceBucketRow = { bucket?: string; total: number; total_amount: number };
type DfcTotals = { approved: number; rejected: number; total: number };

// Helper: normaliser en tableau avec typage générique
function asArray<T>(value: T | T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

// ========================= Invoices by employee =========================
export async function getInvoicesByEmployee(
  req: Request<unknown, unknown, unknown, { fiscalYear?: string; type?: string }>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const fy = req.query.fiscalYear || await getSetting('fiscal_year');
    const g = parseGranularity(req.query.type);

    const { dateFrom, dateTo } = await getEntityDateRange('invoice', fy);
    
    if (!dateFrom || !dateTo) {
      return ApiResponder.success(res, [], 'Aucune facture pour cette année fiscale', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    if (g === 'fiscal_year') {
      const rows = await database.execute<EmployeeInvoiceRow[] | EmployeeInvoiceRow>(
        `SELECT 
           i.created_by AS employee_id, 
           CONCAT_WS(' ', e.firstname, e.lastname) AS employee_name, 
           COUNT(*) AS total,
           SUM(i.amount) AS total_amount
         FROM invoice i
         LEFT JOIN employee e ON e.id = i.created_by
         WHERE i.fiscal_year = ?
          AND i.status = 'Non'
         GROUP BY i.created_by, e.firstname, e.lastname
         ORDER BY total DESC`,
        [fy]
      );
      const data = asArray<EmployeeInvoiceRow>(rows);
      return ApiResponder.success(res, data, 'Factures par employé', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    const bucket = bucketExpr('invoice', g);
    const rows = await database.execute<(EmployeeInvoiceRow & { bucket: string })[] | (EmployeeInvoiceRow & { bucket: string })>(
      `SELECT 
         ${bucket} AS bucket, 
         i.created_by AS employee_id, 
         CONCAT_WS(' ', e.firstname, e.lastname) AS employee_name, 
         COUNT(*) AS total,
         SUM(i.amount) AS total_amount
       FROM invoice i
       LEFT JOIN employee e ON e.id = i.created_by
       WHERE i.fiscal_year = ?
         AND i.status = 'Non'
       GROUP BY bucket, i.created_by, e.firstname, e.lastname
       ORDER BY bucket ASC, total DESC`,
      [fy]
    );
    const dataSeries = asArray<EmployeeInvoiceRow & { bucket: string }>(rows);
    return ApiResponder.success(res, dataSeries, 'Série temporelle factures par employé', { 
      fiscalYear: fy, 
      dateFrom, 
      dateTo, 
      type: g 
    });
  } catch (error) {
    logger.error(`[${requestId}] Erreur getInvoicesByEmployee`, { 
      error: error instanceof Error ? error.message : 'unknown' 
    });
    return ApiResponder.error(res, error);
  }
}

// ========================= DFC agents rates =========================
export async function getDfcAgentsRates(
  req: Request<unknown, unknown, unknown, { fiscalYear?: string; type?: string }>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const fy = req.query.fiscalYear || await getSetting('fiscal_year');
    const g = parseGranularity(req.query.type);

    const { dateFrom, dateTo } = await getEntityDateRange('dfc_decision', fy);
    
    if (!dateFrom || !dateTo) {
      return ApiResponder.success(res, [], 'Aucune décision DFC pour cette année fiscale', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    if (g === 'fiscal_year') {
      const rows = await database.execute<DfcAgentRow[] | DfcAgentRow>(
        `SELECT 
           d.decided_by AS agent_id, 
           CONCAT_WS(' ', e.firstname, e.lastname) AS agent_name,
           SUM(d.decision = 'approved') AS approved,
           SUM(d.decision = 'rejected') AS rejected,
           COUNT(*) AS total
         FROM dfc_decision d
         LEFT JOIN employee e ON e.id = d.decided_by
         WHERE d.fiscal_year = ?
         GROUP BY d.decided_by, e.firstname, e.lastname
         ORDER BY total DESC`,
        [fy]
      );
      const base = asArray<DfcAgentRow>(rows);
      const data = base.map((r) => ({
        agent_id: r.agent_id,
        agent_name: r.agent_name,
        approved: r.approved,
        rejected: r.rejected,
        total: r.total,
        rejected_rate: r.total ? Number((100 * r.rejected / r.total).toFixed(2)) : 0,
        approved_rate: r.total ? Number((100 * r.approved / r.total).toFixed(2)) : 0,
      }));
      
      return ApiResponder.success(res, data, 'Taux de décision par agent DFC', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    const bucket = bucketExpr('dfc_decision', g);
    const rows = await database.execute<(DfcAgentRow & { bucket: string })[] | (DfcAgentRow & { bucket: string })>(
      `SELECT 
         ${bucket} AS bucket, 
         d.decided_by AS agent_id, 
         CONCAT_WS(' ', e.firstname, e.lastname) AS agent_name,
         SUM(d.decision = 'approved') AS approved,
         SUM(d.decision = 'rejected') AS rejected,
         COUNT(*) AS total
       FROM dfc_decision d
       LEFT JOIN employee e ON e.id = d.decided_by
       WHERE d.fiscal_year = ?
       GROUP BY bucket, d.decided_by, e.firstname, e.lastname
       ORDER BY bucket, total DESC`,
      [fy]
    );
    const base = asArray<DfcAgentRow & { bucket: string }>(rows);
    const data = base.map((r) => ({
      bucket: r.bucket,
      agent_id: r.agent_id,
      agent_name: r.agent_name,
      approved: r.approved,
      rejected: r.rejected,
      total: r.total,
      rejected_rate: r.total ? Number((100 * r.rejected / r.total).toFixed(2)) : 0,
      approved_rate: r.total ? Number((100 * r.approved / r.total).toFixed(2)) : 0,
    }));
    
    return ApiResponder.success(res, data, 'Série temporelle décisions par agent', { 
      fiscalYear: fy, 
      dateFrom, 
      dateTo, 
      type: g 
    });
  } catch (error) {
    logger.error(`[${requestId}] Erreur getDfcAgentsRates`, { 
      error: error instanceof Error ? error.message : 'unknown' 
    });
    return ApiResponder.error(res, error);
  }
}

// ========================= Suppliers created by employee =========================
export async function getSuppliersCreatedByEmployee(
  req: Request<unknown, unknown, unknown, { fiscalYear?: string; type?: string }>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const fy = req.query.fiscalYear || await getSetting('fiscal_year');
    const g = parseGranularity(req.query.type);

    const { dateFrom, dateTo } = await getEntityDateRange('supplier', fy);
    
    if (!dateFrom || !dateTo) {
      return ApiResponder.success(res, [], 'Aucun fournisseur créé pour cette année fiscale', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    if (g === 'fiscal_year') {
      const rows = await database.execute<SupplierCreatedRow[] | SupplierCreatedRow>(
        `SELECT 
           s.created_by AS employee_id, 
           CONCAT_WS(' ', e.firstname, e.lastname) AS employee_name, 
           COUNT(*) AS total
         FROM supplier s
         LEFT JOIN employee e ON e.id = s.created_by
         WHERE s.fiscal_year = ?
         GROUP BY s.created_by, e.firstname, e.lastname
         ORDER BY total DESC`,
        [fy]
      );
      const data = asArray<SupplierCreatedRow>(rows);
      return ApiResponder.success(res, data, 'Fournisseurs créés par employé', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    const bucket = supplierBucketExpr(g);
    const rows = await database.execute<(SupplierCreatedRow & { bucket: string })[] | (SupplierCreatedRow & { bucket: string })>(
      `SELECT 
         ${bucket} AS bucket, 
         s.created_by AS employee_id, 
         CONCAT_WS(' ', e.firstname, e.lastname) AS employee_name, 
         COUNT(*) AS total
       FROM supplier s
       LEFT JOIN employee e ON e.id = s.created_by
       WHERE s.fiscal_year = ?
       GROUP BY bucket, s.created_by, e.firstname, e.lastname
       ORDER BY bucket, total DESC`,
      [fy]
    );
    const data = asArray<SupplierCreatedRow & { bucket: string }>(rows);
    return ApiResponder.success(res, data, 'Série temporelle fournisseurs créés', { 
      fiscalYear: fy, 
      dateFrom, 
      dateTo, 
      type: g 
    });
  } catch (error) {
    logger.error(`[${requestId}] Erreur getSuppliersCreatedByEmployee`, { 
      error: error instanceof Error ? error.message : 'unknown' 
    });
    return ApiResponder.error(res, error);
  }
}

// ========================= Suppliers activity =========================
export async function getSuppliersActivity(
  req: Request<unknown, unknown, unknown, { fiscalYear?: string; type?: string }>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const fy = req.query.fiscalYear || await getSetting('fiscal_year');
    const g = parseGranularity(req.query.type);

    const { dateFrom, dateTo } = await getEntityDateRange('invoice', fy);
    
    if (!dateFrom || !dateTo) {
      return ApiResponder.success(res, [], 'Aucune activité fournisseur pour cette année fiscale', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    if (g === 'fiscal_year') {
      const rows = await database.execute<SupplierActivityRow[] | SupplierActivityRow>(
        `SELECT 
          s.id AS supplier_id,
          s.name AS supplier_name,
          COUNT(i.id) AS total_invoices,
          COALESCE(SUM(i.amount), 0) AS total_amount,
          CASE 
            WHEN COUNT(i.id) > 0 THEN 'Actif'
            ELSE 'Inactif'
          END AS activity_status
        FROM supplier s
        LEFT JOIN invoice i ON i.supplier_id = s.id 
          AND i.fiscal_year = ? 
          AND i.status = 'Non'
        GROUP BY s.id, s.name
        HAVING total_invoices > 0
        ORDER BY total_invoices DESC`,
        [fy]
      );
      
      const data = asArray<SupplierActivityRow>(rows);
      return ApiResponder.success(res, data, 'Activité des fournisseurs', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    const bucket = bucketExpr('invoice', g);
    const rows = await database.execute<(SupplierActivityRow & { bucket: string })[] | (SupplierActivityRow & { bucket: string })>(
      `SELECT 
         ${bucket} AS bucket,
         s.id AS supplier_id,
         s.name AS supplier_name,
         COUNT(i.id) AS total_invoices,
         SUM(i.amount) AS total_amount
       FROM supplier s
       INNER JOIN invoice i ON i.supplier_id = s.id
       WHERE i.fiscal_year = ? 
         AND i.status = 'Non'  // ← AJOUT CRITIQUE
       GROUP BY bucket, s.id, s.name
       ORDER BY bucket, total_invoices DESC`,
      [fy]
    );
    
    const dataSeries = asArray<SupplierActivityRow & { bucket: string }>(rows);
    return ApiResponder.success(res, dataSeries, 'Série temporelle activité fournisseurs', { 
      fiscalYear: fy, 
      dateFrom, 
      dateTo, 
      type: g 
    });
  } catch (error) {
    logger.error(`[${requestId}] Erreur getSuppliersActivity`, { 
      error: error instanceof Error ? error.message : 'unknown' 
    });
    return ApiResponder.error(res, error);
  }
}

// ========================= Statistiques globales =========================
export async function getInvoicesSummary(
  req: Request<unknown, unknown, unknown, { fiscalYear?: string; type?: string }>, 
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const fy = req.query.fiscalYear || await getSetting('fiscal_year');
    const g = parseGranularity(req.query.type);

    const { dateFrom, dateTo } = await getEntityDateRange('invoice', fy);
    
    if (!dateFrom || !dateTo) {
      return ApiResponder.success(res, { 
        series: [], 
        total: 0, 
        total_amount: 0 
      }, 'Aucune facture pour cette année fiscale', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    if (g === 'fiscal_year') {
      const row = await database.execute<{ total: number; total_amount: number }[] | { total: number; total_amount: number }>(
        `SELECT 
           COUNT(*) AS total,
           SUM(amount) AS total_amount
         FROM invoice 
         WHERE fiscal_year = ?
           AND status = 'Non'`,
        [fy]
      );
      const arr = asArray<{ total: number; total_amount: number }>(row);
      const data = arr[0] || { total: 0, total_amount: 0 };
      return ApiResponder.success(res, data, 'Résumé des factures', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    const bucket = bucketExpr('invoice', g);
    const rows = await database.execute<InvoiceBucketRow[] | InvoiceBucketRow>(
      `SELECT 
         ${bucket} AS bucket,
         COUNT(*) AS total,
         SUM(amount) AS total_amount
       FROM invoice
       WHERE fiscal_year = ?
        AND status = 'Non'
       GROUP BY bucket
       ORDER BY bucket`,
      [fy]
    );
    const series = asArray<InvoiceBucketRow>(rows);
    const totals = series.reduce<{ total: number; total_amount: number }>((acc, r) => ({
      total: acc.total + (r.total || 0),
      total_amount: acc.total_amount + (r.total_amount || 0),
    }), { total: 0, total_amount: 0 });
    
    return ApiResponder.success(res, { series, ...totals }, 'Série temporelle factures', { 
      fiscalYear: fy, 
      dateFrom, 
      dateTo, 
        type: g 
    });
  } catch (error) {
    logger.error(`[${requestId}] Erreur getInvoicesSummary`, { 
      error: error instanceof Error ? error.message : 'unknown' 
    });
    return ApiResponder.error(res, error);
  }
}

export async function getDfcOverview(
  req: Request<unknown, unknown, unknown, { fiscalYear?: string; type?: string }>, 
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const fy = req.query.fiscalYear || await getSetting('fiscal_year');
    const g = parseGranularity(req.query.type);

    const { dateFrom, dateTo } = await getEntityDateRange('dfc_decision', fy);
    
    if (!dateFrom || !dateTo) {
      return ApiResponder.success(res, { 
        series: [], 
        approved: 0, 
        rejected: 0, 
        total: 0 
      }, 'Aucune décision DFC pour cette année fiscale', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    if (g === 'fiscal_year') {
      const row = await database.execute<DfcTotals[] | DfcTotals>(
        `SELECT 
           SUM(decision = 'approved') AS approved,
           SUM(decision = 'rejected') AS rejected,
           COUNT(*) AS total
         FROM dfc_decision
         WHERE fiscal_year = ?`,
        [fy]
      );
      const arr = asArray<DfcTotals>(row);
      const data = arr[0] || { approved: 0, rejected: 0, total: 0 };
      const rates = {
        approved_rate: data.total ? Number((100 * data.approved / data.total).toFixed(2)) : 0,
        rejected_rate: data.total ? Number((100 * data.rejected / data.total).toFixed(2)) : 0,
      };
      
      return ApiResponder.success(res, { ...data, ...rates }, 'Vue globale DFC', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    const bucket = bucketExpr('dfc_decision', g);
    const rows = await database.execute<(DfcTotals & { bucket: string })[] | (DfcTotals & { bucket: string })>(
      `SELECT 
         ${bucket} AS bucket,
         SUM(decision = 'approved') AS approved,
         SUM(decision = 'rejected') AS rejected,
         COUNT(*) AS total
       FROM dfc_decision
       WHERE fiscal_year = ?
       GROUP BY bucket
       ORDER BY bucket`,
      [fy]
    );
    const series = asArray<DfcTotals & { bucket: string }>(rows).map((r) => ({
      bucket: r.bucket,
      approved: r.approved,
      rejected: r.rejected,
      total: r.total,
      approved_rate: r.total ? Number((100 * r.approved / r.total).toFixed(2)) : 0,
      rejected_rate: r.total ? Number((100 * r.rejected / r.total).toFixed(2)) : 0,
    }));
    
    const totals = series.reduce<{ approved: number; rejected: number; total: number }>((acc, r) => ({
      approved: acc.approved + (r.approved || 0),
      rejected: acc.rejected + (r.rejected || 0),
      total: acc.total + (r.total || 0),
    }), { approved: 0, rejected: 0, total: 0 });
    
    return ApiResponder.success(res, { series, ...totals }, 'Série temporelle DFC', { 
      fiscalYear: fy, 
      dateFrom, 
      dateTo, 
      type: g 
    });
  } catch (error) {
    logger.error(`[${requestId}] Erreur getDfcOverview`, { 
      error: error instanceof Error ? error.message : 'unknown' 
    });
    return ApiResponder.error(res, error);
  }
}

// Fonctions utilitaires pour les buckets
function bucketExpr(entity: 'invoice' | 'dfc_decision', type: Granularity): string {
  const ts = entity === 'invoice' ? 'IFNULL(update_at, create_at)' : 'IFNULL(update_at, decided_at)';
  switch (type) {
    case 'day': return `DATE(${ts})`;
    case 'week': return `YEARWEEK(${ts}, 1)`;
    case 'month': return `DATE_FORMAT(${ts}, '%Y-%m')`;
    case 'fiscal_year': return '';
    default: return `DATE(${ts})`;
  }
}

function supplierBucketExpr(type: Granularity): string {
  const ts = 'IFNULL(update_at, create_at)';
  switch (type) {
    case 'day': return `DATE(${ts})`;
    case 'week': return `YEARWEEK(${ts}, 1)`;
    case 'month': return `DATE_FORMAT(${ts}, '%Y-%m')`;
    case 'fiscal_year': return '';
    default: return `DATE(${ts})`;
  }
}

// AJOUT: Fonctions manquantes pour la compatibilité avec les routes
export async function getInvoicesByEmployeeTimeseries(
  req: Request<{ id: string }, unknown, unknown, { fiscalYear?: string; type?: string }>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const { id } = req.params;
    const fy = req.query.fiscalYear || await getSetting('fiscal_year');
    const g = parseGranularity(req.query.type);
    
    if (!id) return ApiResponder.badRequest(res, 'Paramètre employé manquant');

    const { dateFrom, dateTo } = await getEntityDateRange('invoice', fy);
    
    if (!dateFrom || !dateTo) {
      return ApiResponder.success(res, { series: [], total: 0 }, 'Aucune facture pour cette année fiscale', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    if (g === 'fiscal_year') {
      const row = await database.execute<{ total: number }[] | { total: number }>(
        `SELECT COUNT(*) AS total FROM invoice WHERE fiscal_year = ? AND created_by = ? AND status = 'Non'`, 
        [fy, id]
      );
      const arr = asArray<{ total: number }>(row);
      const total = arr[0]?.total || 0;
      return ApiResponder.success(res, { total }, 'Factures employé', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    const bucket = bucketExpr('invoice', g);
    const rows = await database.execute<{ bucket: string; total: number }[] | { bucket: string; total: number }>(
      `SELECT ${bucket} AS bucket, COUNT(*) AS total
       FROM invoice
       WHERE fiscal_year = ? AND created_by = ?
         AND status = 'Non'
       GROUP BY bucket
       ORDER BY bucket`,
      [fy, id]
    );
    const series = asArray<{ bucket: string; total: number }>(rows);
    const total = series.reduce((sum, r) => sum + (r.total || 0), 0);
    
    return ApiResponder.success(res, { series, total }, 'Série temporelle factures employé', { 
      fiscalYear: fy, 
      dateFrom, 
      dateTo, 
      type: g 
    });
  } catch (error) {
    logger.error(`[${requestId}] Erreur getInvoicesByEmployeeTimeseries`, { 
      error: error instanceof Error ? error.message : 'unknown' 
    });
    return ApiResponder.error(res, error);
  }
}

export async function getDfcAgentTimeseries(
  req: Request<{ id: string }, unknown, unknown, { fiscalYear?: string; type?: string }>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const { id } = req.params;
    const fy = req.query.fiscalYear || await getSetting('fiscal_year');
    const g = parseGranularity(req.query.type);
    
    if (!id) return ApiResponder.badRequest(res, 'Paramètre agent manquant');

    const { dateFrom, dateTo } = await getEntityDateRange('dfc_decision', fy);
    
    if (!dateFrom || !dateTo) {
      return ApiResponder.success(res, { series: [], approved: 0, rejected: 0, total: 0 }, 'Aucune décision pour cette année fiscale', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    if (g === 'fiscal_year') {
      const row = await database.execute<DfcTotals[] | DfcTotals>(
        `SELECT 
           SUM(decision = 'approved') AS approved, 
           SUM(decision = 'rejected') AS rejected, 
           COUNT(*) AS total 
         FROM dfc_decision 
         WHERE fiscal_year = ? AND decided_by = ?`, 
        [fy, id]
      );
      const arr = asArray<DfcTotals>(row);
      const data = arr[0] || { approved: 0, rejected: 0, total: 0 };
      const rates = {
        approved_rate: data.total ? Number((100 * data.approved / data.total).toFixed(2)) : 0,
        rejected_rate: data.total ? Number((100 * data.rejected / data.total).toFixed(2)) : 0,
      };
      
      return ApiResponder.success(res, { ...data, ...rates }, 'Décisions agent', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    const bucket = bucketExpr('dfc_decision', g);
    const rows = await database.execute<(DfcTotals & { bucket: string })[] | (DfcTotals & { bucket: string })>(
      `SELECT 
         ${bucket} AS bucket,
         SUM(decision = 'approved') AS approved,
         SUM(decision = 'rejected') AS rejected,
         COUNT(*) AS total
       FROM dfc_decision
       WHERE fiscal_year = ? AND decided_by = ?
       GROUP BY bucket
       ORDER BY bucket`,
      [fy, id]
    );
    const series = asArray<DfcTotals & { bucket: string }>(rows).map((r) => ({
      bucket: r.bucket,
      approved: r.approved,
      rejected: r.rejected,
      total: r.total,
      approved_rate: r.total ? Number((100 * r.approved / r.total).toFixed(2)) : 0,
      rejected_rate: r.total ? Number((100 * r.rejected / r.total).toFixed(2)) : 0,
    }));
    
    const totals = series.reduce<{ approved: number; rejected: number; total: number }>((acc, r) => ({
      approved: acc.approved + (r.approved || 0),
      rejected: acc.rejected + (r.rejected || 0),
      total: acc.total + (r.total || 0),
    }), { approved: 0, rejected: 0, total: 0 });
    
    return ApiResponder.success(res, { series, ...totals }, 'Série temporelle décisions agent', { 
      fiscalYear: fy, 
      dateFrom, 
      dateTo, 
      type: g 
    });
  } catch (error) {
    logger.error(`[${requestId}] Erreur getDfcAgentTimeseries`, { 
      error: error instanceof Error ? error.message : 'unknown' 
    });
    return ApiResponder.error(res, error);
  }
}

// AJOUT: Fonctions pour la compatibilité avec les anciennes routes
export async function getSuppliersCreatedSummary(
  req: Request<unknown, unknown, unknown, { fiscalYear?: string; type?: string }>,
  res: Response
): Promise<Response> {
  // Utiliser getSuppliersCreatedByEmployee mais avec agrégation globale
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const fy = req.query.fiscalYear || await getSetting('fiscal_year');
    const g = parseGranularity(req.query.type);

    const { dateFrom, dateTo } = await getEntityDateRange('supplier', fy);
    
    if (!dateFrom || !dateTo) {
      return ApiResponder.success(res, { series: [], total: 0 }, 'Aucun fournisseur pour cette année fiscale', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    if (g === 'fiscal_year') {
      const row = await database.execute<{ total: number }[] | { total: number }>(
        `SELECT COUNT(*) AS total FROM supplier WHERE fiscal_year = ?`, 
        [fy]
      );
      const arr = asArray<{ total: number }>(row);
      const total = arr[0]?.total || 0;
      return ApiResponder.success(res, { total }, 'Fournisseurs créés', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    const bucket = supplierBucketExpr(g);
    const rows = await database.execute<{ bucket: string; total: number }[] | { bucket: string; total: number }>(
      `SELECT ${bucket} AS bucket, COUNT(*) AS total
       FROM supplier
       WHERE fiscal_year = ?
       GROUP BY bucket
       ORDER BY bucket`,
      [fy]
    );
    const series = asArray<{ bucket: string; total: number }>(rows);
    const total = series.reduce((sum, r) => sum + (r.total || 0), 0);
    
    return ApiResponder.success(res, { series, total }, 'Série temporelle fournisseurs créés', { 
      fiscalYear: fy, 
      dateFrom, 
      dateTo, 
      type: g 
    });
  } catch (error) {
    logger.error(`[${requestId}] Erreur getSuppliersCreatedSummary`, { 
      error: error instanceof Error ? error.message : 'unknown' 
    });
    return ApiResponder.error(res, error);
  }
}

export async function getSuppliersCreatedByEmployeeTimeseries(
  req: Request<{ id: string }, unknown, unknown, { fiscalYear?: string; type?: string }>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const { id } = req.params;
    const fy = req.query.fiscalYear || await getSetting('fiscal_year');
    const g = parseGranularity(req.query.type);
    
    if (!id) return ApiResponder.badRequest(res, 'Paramètre employé manquant');

    const { dateFrom, dateTo } = await getEntityDateRange('supplier', fy);
    
    if (!dateFrom || !dateTo) {
      return ApiResponder.success(res, { series: [], total: 0 }, 'Aucun fournisseur pour cette année fiscale', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    if (g === 'fiscal_year') {
      const row = await database.execute<{ total: number }[] | { total: number }>(
        `SELECT COUNT(*) AS total FROM supplier WHERE fiscal_year = ? AND created_by = ?`, 
        [fy, id]
      );
      const arr = asArray<{ total: number }>(row);
      const total = arr[0]?.total || 0;
      return ApiResponder.success(res, { total }, 'Fournisseurs créés par employé', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    const bucket = supplierBucketExpr(g);
    const rows = await database.execute<{ bucket: string; total: number }[] | { bucket: string; total: number }>(
      `SELECT ${bucket} AS bucket, COUNT(*) AS total
       FROM supplier
       WHERE fiscal_year = ? AND created_by = ?
       GROUP BY bucket
       ORDER BY bucket`,
      [fy, id]
    );
    const series = asArray<{ bucket: string; total: number }>(rows);
    const total = series.reduce((sum, r) => sum + (r.total || 0), 0);
    
    return ApiResponder.success(res, { series, total }, 'Série temporelle fournisseurs créés par employé', { 
      fiscalYear: fy, 
      dateFrom, 
      dateTo, 
      type: g 
    });
  } catch (error) {
    logger.error(`[${requestId}] Erreur getSuppliersCreatedByEmployeeTimeseries`, { 
      error: error instanceof Error ? error.message : 'unknown' 
    });
    return ApiResponder.error(res, error);
  }
}

// AJOUT: Fonctions de compatibilité pour les anciens noms
export const getSuppliersOverview = getSuppliersActivity;

export async function getSupplierSummary(
  req: Request<{ id: string }, unknown, unknown, { fiscalYear?: string; type?: string }>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const { id } = req.params;
    const fy = req.query.fiscalYear || await getSetting('fiscal_year');
    const g = parseGranularity(req.query.type);
    
    if (!id) return ApiResponder.badRequest(res, 'Paramètre fournisseur manquant');

    const { dateFrom, dateTo } = await getEntityDateRange('invoice', fy);
    
    if (!dateFrom || !dateTo) {
      return ApiResponder.success(res, { total_invoices: 0, total_amount: 0 }, 'Aucune facture pour cette année fiscale', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g 
      });
    }

    const row = await database.execute<{ total_invoices: number; total_amount: number }[] | { total_invoices: number; total_amount: number }>(
      `SELECT 
         COUNT(*) AS total_invoices, 
         SUM(amount) AS total_amount 
       FROM invoice 
       WHERE fiscal_year = ? AND supplier_id = ?
          AND status = 'Non'`,
      [fy, id]
    );
    const arr = asArray<{ total_invoices: number; total_amount: number }>(row);
    const data = arr[0] || { total_invoices: 0, total_amount: 0 };
    
    return ApiResponder.success(res, data, 'Résumé fournisseur', { 
      fiscalYear: fy, 
      dateFrom, 
      dateTo, 
      type: g 
    });
  } catch (error) {
    logger.error(`[${requestId}] Erreur getSupplierSummary`, { 
      error: error instanceof Error ? error.message : 'unknown' 
    });
    return ApiResponder.error(res, error);
  }
}

export async function getSuppliersTop(
  req: Request<unknown, unknown, unknown, { fiscalYear?: string; type?: string; metric?: string }>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const fy = req.query.fiscalYear || await getSetting('fiscal_year');
    const g = parseGranularity(req.query.type);
    const metric = (req.query.metric || 'volume').toLowerCase();

    const { dateFrom, dateTo } = await getEntityDateRange('invoice', fy);
    
    if (!dateFrom || !dateTo) {
      return ApiResponder.success(res, [], 'Aucune facture pour cette année fiscale', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g,
        metric
      });
    }

    const orderBy = metric === 'amount' ? 'total_amount DESC' : 'total_invoices DESC';

    if (g === 'fiscal_year') {
      const rows = await database.execute<SupplierActivityRow[] | SupplierActivityRow>(
        `SELECT 
           s.id AS supplier_id,
           s.name AS supplier_name,
           COUNT(i.id) AS total_invoices,
           SUM(i.amount) AS total_amount
         FROM supplier s
         INNER JOIN invoice i ON i.supplier_id = s.id
         WHERE i.fiscal_year = ? 
           AND i.status = 'Non'
         GROUP BY s.id, s.name
         ORDER BY ${orderBy}
         LIMIT 10`,
        [fy]
      );
      const data = asArray<SupplierActivityRow>(rows);
      return ApiResponder.success(res, data, 'Top fournisseurs', { 
        fiscalYear: fy, 
        dateFrom, 
        dateTo, 
        type: g,
        metric
      });
    }

    const bucket = bucketExpr('invoice', g);
    const rows = await database.execute<(SupplierActivityRow & { bucket: string })[] | (SupplierActivityRow & { bucket: string })>(
      `SELECT 
         ${bucket} AS bucket,
         s.id AS supplier_id,
         s.name AS supplier_name,
         COUNT(i.id) AS total_invoices,
         SUM(i.amount) AS total_amount
       FROM supplier s
       INNER JOIN invoice i ON i.supplier_id = s.id
       WHERE i.fiscal_year = ? 
         AND i.status = 'Non'
       GROUP BY bucket, s.id, s.name
       ORDER BY bucket, ${orderBy}`,
      [fy]
    );
    const data = asArray<SupplierActivityRow & { bucket: string }>(rows);
    return ApiResponder.success(res, data, 'Top fournisseurs par période', { 
      fiscalYear: fy, 
      dateFrom, 
      dateTo, 
      type: g,
      metric
    });
  } catch (error) {
    logger.error(`[${requestId}] Erreur getSuppliersTop`, { 
      error: error instanceof Error ? error.message : 'unknown' 
    });
    return ApiResponder.error(res, error);
  }
}

// ========================= KPIs Globaux du Dashboard =========================
type GlobalKpis = {
  totalRevenue: number;
  pendingInvoices: number;
  approvedInvoices: number;
  rejectedInvoices: number;
  totalDfcDecisions: number;
  totalSuppliers: number;
  totalEmployees: number;
};

export async function getGlobalDashboardKpis(
  req: Request<unknown, unknown, unknown, { fiscalYear?: string }>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const fy = req.query.fiscalYear || await getSetting('fiscal_year');

    // CORRECTION CRITIQUE : Ajouter le filtre sur le status
    const kpiInvoicesDfcQuery = `
      SELECT
          COALESCE(SUM(CASE WHEN i.dfc_status = 'approved' AND i.status = 'Non' THEN i.amount ELSE 0 END), 0) AS totalRevenue,
          COALESCE(SUM(CASE WHEN i.dfc_status = 'pending' AND i.status = 'Non' THEN 1 ELSE 0 END), 0) AS pendingInvoices,
          COALESCE(SUM(CASE WHEN i.dfc_status = 'approved' AND i.status = 'Non' THEN 1 ELSE 0 END), 0) AS approvedInvoices,
          COALESCE(SUM(CASE WHEN i.dfc_status = 'rejected' AND i.status = 'Non' THEN 1 ELSE 0 END), 0) AS rejectedInvoices,
          (SELECT COUNT(*) FROM dfc_decision dd WHERE dd.fiscal_year = i.fiscal_year) AS totalDfcDecisions
      FROM invoice i
      WHERE i.fiscal_year = ?
    `;

    const totalsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM supplier s WHERE s.fiscal_year = ?) AS totalSuppliers,
        (SELECT COUNT(*) FROM employee e WHERE e.fiscal_year = ?) AS totalEmployees
    `;

    const [kpiResults] = await database.execute<any[]>(kpiInvoicesDfcQuery, [fy]);
    const [totalsResults] = await database.execute<any[]>(totalsQuery, [fy, fy]);

    const kpis = kpiResults[0] || {};
    const totals = totalsResults[0] || {};

    const data: GlobalKpis = {
        totalRevenue: parseFloat(kpis.totalRevenue) || 0,
        pendingInvoices: parseInt(kpis.pendingInvoices) || 0,
        approvedInvoices: parseInt(kpis.approvedInvoices) || 0,
        rejectedInvoices: parseInt(kpis.rejectedInvoices) || 0,
        totalDfcDecisions: parseInt(kpis.totalDfcDecisions) || 0,
        totalSuppliers: parseInt(totals.totalSuppliers) || 0,
        totalEmployees: parseInt(totals.totalEmployees) || 0,
    };

    return ApiResponder.success(res, data, 'KPIs globaux du Dashboard', { fiscalYear: fy });
  } catch (error) {
    logger.error(`[${requestId}] Erreur getGlobalDashboardKpis`, { 
      error: error instanceof Error ? error.message : 'unknown' 
    });
    return ApiResponder.error(res, error);
  }
}