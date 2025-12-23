import type { Request, Response } from 'express';

import ApiResponder from '../utils/ApiResponder';
import logger from '../utils/Logger';
import database from '../config/database';
import { getSetting } from '../helpers/settings';
import { getEntityDateRange } from '../helpers/statsDateRange';
import { getDatabaseCreationDate } from '../helpers/databaseCreationDate';
import { AuthenticatedRequest } from '../types/express/request';

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
      total_amount: acc.total_amount + Number(r.total_amount || 0),
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
export async function getGlobalDashboardKpis(
  req: Request<unknown, unknown, unknown, { type?: string; dateFrom?: string; dateTo?: string }>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const g = parseGranularity(req.query.type);

    // Période étendue : création DB à maintenant
    const dateFrom = req.query.dateFrom || await getDatabaseCreationDate();
    const dateTo = req.query.dateTo || new Date().toISOString().split('T')[0];

    const totalEmployee = await database.execute<{ total_employee: number }[] | { total_employee: number }>(
      `SELECT COUNT(*) AS total_employee FROM employee WHERE isVerified = 1 AND isActive = 1 AND DATE(IFNULL(update_at, created_at)) BETWEEN ? AND ?`,
      [dateFrom, dateTo]
    );
    const totalInvoices = await database.execute<{ total_invoices: number }[] | { total_invoices: number }>(
      `SELECT COUNT(*) AS total_invoices FROM invoice WHERE DATE(IFNULL(update_at, create_at)) BETWEEN ? AND ?`,
      [dateFrom, dateTo]
    );
    const totalSuppliers = await database.execute<{ total_suppliers: number }[] | { total_suppliers: number }>(
      `SELECT COUNT(*) AS total_suppliers FROM supplier WHERE DATE(IFNULL(update_at, create_at)) BETWEEN ? AND ?`,
      [dateFrom, dateTo]
    );
    const totalInvoicePendingDfc = await database.execute<{ total_invoice_pending: number }[] | { total_invoice_pending: number }>(
      `SELECT COUNT(*) AS total_invoice_pending
       FROM invoice 
       WHERE status = 'Non' 
         AND dfc_status = 'pending'`,
      []
    );

    const businessAmount = await database.execute<{ business_amount: number }[] | { business_amount: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS business_amount 
       FROM invoice 
       WHERE status = 'Non' 
         AND DATE(IFNULL(update_at, create_at)) BETWEEN ? AND ?`,
      [dateFrom, dateTo]
    );

    return ApiResponder.success(res, {
      total_employee: asArray<{ total_employee: number }>(totalEmployee)[0]?.total_employee || 0,
      total_invoices: asArray<{ total_invoices: number }>(totalInvoices)[0]?.total_invoices || 0,
      total_suppliers: asArray<{ total_suppliers: number }>(totalSuppliers)[0]?.total_suppliers || 0,
      total_invoice_pending: asArray<{ total_invoice_pending: number }>(totalInvoicePendingDfc)[0]?.total_invoice_pending || 0,
      business_amount: asArray<{ business_amount: number }>(businessAmount)[0]?.business_amount || 0,
      dateTo,
      dateFrom
    });
  } catch (error) {
    logger.error(`[${requestId}] Erreur getGlobalDashboardKpis`, {
      error: error instanceof Error ? error.message : 'unknown'
    });
    return ApiResponder.error(res, error);
  }
}

// ========================= Statistiques Personnelles =========================
// Types pour les stats personnelles
type PersonalStats = {
  // Pour invoice_manager
  totalInvoices?: number;
  totalSuppliers?: number;
  invoiceCreationRate?: number;

  // Pour dfc_agent
  approvalRate?: number;
  rejectionRate?: number;
  processingRate?: number;

  // Pour admin (combinaison des deux)
  role: string;
};

export async function getPersonalStats(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';

  try {
    const userId = (req.user as any).sup;
    const userRole = req.user?.role;

    if (!userId) {
      return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    }

    const fy = await getSetting('fiscal_year');

    // Récupérer les stats selon le rôle
    let personalStats: PersonalStats = { role: userRole as string };

    if (userRole === 'invoice_manager' || userRole === 'admin') {
      const invoiceStats = await getInvoiceManagerStats(userId, fy);
      personalStats = { ...personalStats, ...invoiceStats };
    }

    if (userRole === 'dfc_agent' || userRole === 'admin') {
      const dfcStats = await getDfcAgentStats(userId, fy);
      personalStats = { ...personalStats, ...dfcStats };
    }

    return ApiResponder.success(res, personalStats, 'Statistiques personnelles récupérées', {
      fiscalYear: fy,
      userId,
      userRole
    });

  } catch (error) {
    logger.error(`[${requestId}] Erreur getPersonalStats`, {
      error: error instanceof Error ? error.message : 'unknown',
      userId: req.user?.sup
    });
    return ApiResponder.error(res, error);
  }
}

// ========================= Stats pour Invoice Manager =========================
async function getInvoiceManagerStats(userId: string, fiscalYear: string): Promise<Partial<PersonalStats>> {
  const { dateFrom, dateTo } = await getEntityDateRange('invoice', fiscalYear);

  if (!dateFrom || !dateTo) {
    return {
      totalInvoices: 0,
      totalSuppliers: 0,
      invoiceCreationRate: 0
    };
  }

  // 1. Nombre total de factures créées par l'utilisateur
  const invoicesResult = await database.execute<{ total_invoices: number }[] | { total_invoices: number }>(
    `SELECT COUNT(*) as total_invoices 
     FROM invoice 
     WHERE fiscal_year = ? 
       AND created_by = ?`,
    [fiscalYear, userId]
  );
  const totalInvoices = asArray<{ total_invoices: number }>(invoicesResult)[0]?.total_invoices || 0;

  // 2. Nombre de fournisseurs créés par l'utilisateur
  const suppliersResult = await database.execute<{ total_suppliers: number }[] | { total_suppliers: number }>(
    `SELECT COUNT(*) as total_suppliers 
     FROM supplier 
     WHERE fiscal_year = ? 
       AND created_by = ?`,
    [fiscalYear, userId]
  );
  const totalSuppliers = asArray<{ total_suppliers: number }>(suppliersResult)[0]?.total_suppliers || 0;

  // 3. Taux de création moyen (factures/jour) - CORRIGÉ
  const creationRateResult = await database.execute<{ avg_daily_invoices: any }[] | { avg_daily_invoices: any }>(
    `SELECT 
       COUNT(*) / NULLIF(DATEDIFF(MAX(create_at), MIN(create_at)) + 1, 0) as avg_daily_invoices
     FROM invoice 
     WHERE fiscal_year = ? 
       AND created_by = ?
     HAVING COUNT(*) > 0`,
    [fiscalYear, userId]
  );

  const avgDailyResult = asArray<{ avg_daily_invoices: any }>(creationRateResult)[0];
  let invoiceCreationRate = 0;

  if (avgDailyResult?.avg_daily_invoices) {
    // Convertir en number et formater
    const rate = parseFloat(avgDailyResult.avg_daily_invoices);
    invoiceCreationRate = isNaN(rate) ? 0 : parseFloat(rate.toFixed(1));
  }

  return {
    totalInvoices,
    totalSuppliers,
    invoiceCreationRate
  };
}

// ========================= Stats pour Agent DFC =========================
async function getDfcAgentStats(userId: string, fiscalYear: string): Promise<Partial<PersonalStats>> {
  const { dateFrom, dateTo } = await getEntityDateRange('dfc_decision', fiscalYear);

  if (!dateFrom || !dateTo) {
    return {
      approvalRate: 0,
      rejectionRate: 0,
      processingRate: 0
    };
  }

  // 1. Décisions totales et taux
  const decisionsResult = await database.execute<{
    approved: number;
    rejected: number;
    total: number
  }[] | {
    approved: number;
    rejected: number;
    total: number
  }>(
    `SELECT 
       SUM(decision = 'approved') as approved,
       SUM(decision = 'rejected') as rejected,
       COUNT(*) as total
     FROM dfc_decision 
     WHERE fiscal_year = ? 
       AND decided_by = ?`,
    [fiscalYear, userId]
  );

  const decisions = asArray<{ approved: number; rejected: number; total: number }>(decisionsResult)[0] || {
    approved: 0,
    rejected: 0,
    total: 0
  };

  const approvalRate = decisions.total > 0 ?
    parseFloat(((decisions.approved / decisions.total) * 100).toFixed(1)) : 0;

  const rejectionRate = decisions.total > 0 ?
    parseFloat(((decisions.rejected / decisions.total) * 100).toFixed(1)) : 0;

  // 2. Taux de traitement moyen (décisions/jour) - CORRIGÉ
  const processingRateResult = await database.execute<{ avg_daily_decisions: any }[] | { avg_daily_decisions: any }>(
    `SELECT 
       COUNT(*) / NULLIF(DATEDIFF(MAX(decided_at), MIN(decided_at)) + 1, 0) as avg_daily_decisions
     FROM dfc_decision 
     WHERE fiscal_year = ? 
       AND decided_by = ?
     HAVING COUNT(*) > 0`,
    [fiscalYear, userId]
  );

  const avgDailyDecisions = asArray<{ avg_daily_decisions: any }>(processingRateResult)[0];
  let processingRate = 0;

  if (avgDailyDecisions?.avg_daily_decisions) {
    // Convertir en number et formater
    const rate = parseFloat(avgDailyDecisions.avg_daily_decisions);
    processingRate = isNaN(rate) ? 0 : parseFloat(rate.toFixed(1));
  }

  return {
    approvalRate,
    rejectionRate,
    processingRate
  };
}
// ========================= Stats pour Tous les Agents (Admin seulement) =========================
export async function getAllAgentsStats(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';

  try {
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return ApiResponder.forbidden(res, 'Accès réservé aux administrateurs');
    }

    const fy = await getSetting('fiscal_year');

    // Récupérer tous les employés actifs
    const employeesResult = await database.execute<{
      id: string;
      firstname: string;
      lastname: string;
      email: string;
      role: string;
      department: string;
    }[] | {
      id: string;
      firstname: string;
      lastname: string;
      email: string;
      role: string;
      department: string;
    }>(
      `SELECT id, firstname, lastname, email, role, department
       FROM employee 
       WHERE isActive = 1 AND isVerified = 1
       ORDER BY role, firstname, lastname`,
      []
    );

    const employees = asArray(employeesResult);
    const agentsStats = [];

    for (const employee of employees) {
      let stats: any = {
        id: employee.id,
        name: `${employee.firstname} ${employee.lastname}`,
        email: employee.email,
        role: employee.role,
        department: employee.department
      };

      // Stats pour invoice_manager et admin
      if (employee.role === 'invoice_manager' || employee.role === 'admin') {
        const invoiceStats = await getInvoiceManagerStats(employee.id, fy);
        stats = { ...stats, ...invoiceStats };
      }

      // Stats pour dfc_agent et admin
      if (employee.role === 'dfc_agent' || employee.role === 'admin') {
        const dfcStats = await getDfcAgentStats(employee.id, fy);
        stats = { ...stats, ...dfcStats };
      }

      agentsStats.push(stats);
    }

    return ApiResponder.success(res, agentsStats, 'Statistiques de tous les agents récupérées', {
      fiscalYear: fy,
      totalAgents: agentsStats.length
    });

  } catch (error) {
    logger.error(`[${requestId}] Erreur getAllAgentsStats`, {
      error: error instanceof Error ? error.message : 'unknown'
    });
    return ApiResponder.error(res, error);
  }
}

export async function getAvailableInvoiceDays(req: AuthenticatedRequest, res: Response): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const user = req.user
    if (!user || !user.sup) {
      return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    }
    const fy = await getSetting('fiscal_year');
    const rows = await database.execute<{ day: string }[] | { day: string }>(
      "SELECT DISTINCT DATE(create_at) AS day FROM invoice WHERE fiscal_year = ? AND created_by = ? ORDER BY day DESC", [fy, user.sup]);
    const list = (Array.isArray(rows) ? rows : (rows ? [rows] : [])).map(r => r.day);
    return ApiResponder.success(res, list, 'Jours disponibles', { fiscalYear: fy });
  } catch (error) {
    logger.error(`[${requestId}] Erreur getAvailableInvoiceDays`, { error: error instanceof Error ? error.message : 'unknown' });
    return ApiResponder.error(res, error);
  }
} 