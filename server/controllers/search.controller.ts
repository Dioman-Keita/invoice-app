import type { Response } from 'express';
import ApiResponder from '../utils/ApiResponder';
import logger from '../utils/Logger';
import { QueryBuilder } from '../utils/QueryBuilder';
import { AuthenticatedRequest } from '../types/express/request';
import database from '../config/database';

// ==================
// SEARCH FUNCTIONS
// ==================

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
    logger.error(`[${requestId}] Error advancedInvoiceSearch`, {
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
    logger.error(`[${requestId}] Error advancedSupplierSearch`, {
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
    logger.error(`[${requestId}] Error relationalSearch`, {
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      stack: error instanceof Error ? error.stack : 'unknown stack',
      query: req.query
    });
    return ApiResponder.error(res, error);
  }
}

// =============================================================================
// HISTORY AND CONFIGURATION FUNCTIONS
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
    logger.error(`[${requestId}] Error getExportHistory`, {
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
    logger.error(`[${requestId}] Error getFiscalYears`, {
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      stack: error instanceof Error ? error.stack : 'unknown stack'
    });
    return ApiResponder.error(res, error);
  }
}
