import ApiResponder from "../utils/ApiResponder";
import database from "../config/database";
import InvoiceLastNumberValidator from "../core/rules/InvoiceNumberRule";
import InvoiceValidatorData from "../utils/InvoiceRuleInput";
import Invoice from "../models/Invoice";
import type { Response, Request } from 'express';
import logger from "../utils/Logger";
import { canAccessInvoice } from "../middleware/roleGuard";
import { getSetting } from "../helpers/settings";
import { ActivityTracker } from "../utils/ActivityTracker";
import { InvoiceInputDto, InvoiceRecord, UpdateInvoiceDto, SearchInvoiceQueryParams } from "../types";
import { AuthenticatedRequest } from "../types/express/request";

export async function createInvoice(
  req: Request<unknown, unknown, InvoiceInputDto>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';

  try {
    // Get connected user from req.user
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      logger.warn(`[${requestId}] Attempt to create invoice without authenticated user`);
      return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    }

    logger.info(`[${requestId}] Starting invoice creation`);
    const data = req.body;

    // Full data validation
    const validationResult = await InvoiceValidatorData.validateInvoiceData(data, user);

    if (!validationResult.isValid) {
      logger.warn(`[${requestId}] Data validation failed`, {
        errors: validationResult.errors,
        userId: user.sup
      });

      // Return the first error (or all depending on preference)
      const firstError = validationResult.errors[0];
      return ApiResponder.badRequest(
        res,
        firstError.message,
        {
          field: firstError.field,
          suggestion: firstError.suggestion,
          allErrors: validationResult.errors // Optional: return all errors
        }
      );
    }

    // Create invoice with validated data
    const result = await Invoice.create(validationResult.validatedData!);

    if (!result.success) {
      logger.error(`[${requestId}] Error during invoice creation in model`, {
        userId: user.sup,
        error: result.data
      });
      return ApiResponder.error(res, result.data);
    }

    logger.info(`[${requestId}] Facture créée avec succès 🎯`, {
      userId: user.sup,
      email: user.email,
      role: user.role,
      supplierId: validationResult.validatedData!.supplier_id
    });

    // User tracking
    const userActivity = new ActivityTracker();
    const trackingResult = await userActivity.track('SUBMIT_INVOICE', user.sup);

    if (!trackingResult) {
      logger.warn(`User tracking failed for user ${user.sup} during invoice form submission`, {
        role: user.role,
        email: user.email
      });
    }

    // Check year-end alerts
    const warningInfo = await InvoiceLastNumberValidator.checkYearEndThresholdWarning();

    return ApiResponder.created(res, result.data, 'Facture créée avec succès 🎯', { warningInfo });
  } catch (err) {
    logger.error(`[${requestId}] Error during invoice creation`, {
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : 'unknown stack',
      body: req.body
    });
    return ApiResponder.error(res, err);
  }
}

export async function getInvoice(
  req: Request<{ id: string }>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';

  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      logger.warn(`[${requestId}] Attempt to access invoice without authenticated user`);
      return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    }

    const { id } = req.params;

    if (!id) {
      return ApiResponder.badRequest(res, 'ID de la facture requis');
    }

    const invoices = await Invoice.findInvoice(id, {
      findBy: 'id',
      limit: 1,
      orderBy: 'desc'
    });

    if (!invoices || invoices.length === 0) {
      logger.warn(`[${requestId}] Facture introuvable`, { invoiceId: id, userId: user.sup });
      return ApiResponder.notFound(res, 'Facture introuvable');
    }

    // Check if user can access this invoice
    const invoiceData = invoices[0];

    if (!canAccessInvoice(user, invoiceData.created_by)) {
      logger.warn(`[${requestId}] Unauthorized access attempt to an invoice`, {
        invoiceId: id,
        userId: user.sup,
        invoiceOwner: invoiceData.created_by
      });
      return ApiResponder.forbidden(res, 'Accès refusé à cette facture');
    }

    logger.info(`[${requestId}] Invoice retrieved`, {
      invoiceId: id,
      userId: user.sup,
      role: user.role
    });

    return ApiResponder.success(res, invoiceData);
  } catch (err) {
    logger.error(`[${requestId}] Error during invoice retrieval`, {
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : 'unknown stack',
      invoiceId: req.params.id
    });
    return ApiResponder.error(res, err);
  }
}

export async function getUserInvoices(
  req: Request<unknown, unknown, unknown, SearchInvoiceQueryParams>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';

  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      logger.warn(`[${requestId}] Attempt to retrieve invoices without authenticated user`);
      return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    }

    const { supplier_id, account_number, phone, status, created_by, limit, orderBy, search, fiscal_year } = req.query;

    let invoices: InvoiceRecord[] = [];

    // If it's an admin, search by various criteria
    if (user.role === 'admin') {
      if (supplier_id) {
        invoices = await Invoice.findInvoice(supplier_id, {
          findBy: 'supplier_id',
          limit: limit ? parseInt(limit) : null,
          orderBy: orderBy || 'desc',
          fiscalYear: fiscal_year || await getSetting('fiscal_year')
        });
      } else if (account_number) {
        invoices = await Invoice.findInvoice(account_number, {
          findBy: 'account_number',
          limit: limit ? parseInt(limit) : null,
          orderBy: orderBy || 'desc',
          fiscalYear: fiscal_year || await getSetting('fiscal_year')
        });
      } else if (phone) {
        invoices = await Invoice.findInvoice(phone, {
          findBy: 'phone',
          limit: limit ? parseInt(limit) : null,
          orderBy: orderBy || 'desc',
          fiscalYear: fiscal_year || await getSetting('fiscal_year')
        });
      } else if (created_by) {
        // Search by creator (for admins)
        invoices = await searchInvoicesByCreator(created_by, limit ? parseInt(limit) : undefined, orderBy, fiscal_year || await getSetting('fiscal_year'));
      } else if (search) {
        // Global search (for admins)
        invoices = await globalSearchInvoices(search, limit ? parseInt(limit) : undefined, orderBy, fiscal_year || await getSetting('fiscal_year'));
      } else {
        // All invoices for admins
        invoices = await Invoice.findInvoice('', {
          findBy: 'all',
          limit: limit ? parseInt(limit) : null,
          orderBy: orderBy || 'desc',
          fiscalYear: fiscal_year || await getSetting('fiscal_year')
        });
      }
    } else {
      // For non-admins, only their own invoices
      invoices = await searchInvoicesByCreator(user.sup, limit ? parseInt(limit) : undefined, orderBy, fiscal_year || await getSetting('fiscal_year'));
    }

    // Filter by status if specified
    if (status && invoices.length > 0) {
      invoices = invoices.filter(invoice => invoice.status === status);
    }

    logger.info(`[${requestId}] Invoices retrieved`, {
      userId: user.sup,
      role: user.role,
      count: invoices.length,
      filters: req.query
    });

    return ApiResponder.success(res, invoices, `${invoices.length} facture(s) trouvée(s)`);
  } catch (err) {
    logger.error(`[${requestId}] Error during invoice retrieval`, {
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : 'unknown stack'
    });
    return ApiResponder.error(res, err);
  }
}

export async function searchInvoices(
  req: Request<unknown, unknown, unknown, SearchInvoiceQueryParams>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';

  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    }

    const { supplier_id, account_number, phone, status, limit, orderBy, fiscal_year } = req.query;

    // Check permissions for advanced search
    if (user.role !== 'admin' && (supplier_id || account_number || phone)) {
      logger.warn(`[${requestId}] Advanced search attempt without admin permissions`, {
        userId: user.sup,
        role: user.role,
        query: req.query
      });
      return ApiResponder.forbidden(res, 'Permissions insuffisantes pour cette recherche');
    }

    let invoices: InvoiceRecord[] = [];
    let searchType = '';

    if (supplier_id) {
      searchType = 'supplier_id';
      invoices = await Invoice.findInvoice(supplier_id, {
        findBy: 'supplier_id',
        limit: limit ? parseInt(limit) : null,
        orderBy: orderBy || 'desc',
        fiscalYear: fiscal_year || await getSetting('fiscal_year')
      });
    } else if (account_number) {
      searchType = 'account_number';
      invoices = await Invoice.findInvoice(account_number, {
        findBy: 'account_number',
        limit: limit ? parseInt(limit) : null,
        orderBy: orderBy || 'desc',
        fiscalYear: fiscal_year || await getSetting('fiscal_year')
      });
    } else if (phone) {
      searchType = 'phone';
      invoices = await Invoice.findInvoice(phone, {
        findBy: 'phone',
        limit: limit ? parseInt(limit) : null,
        orderBy: orderBy || 'desc',
        fiscalYear: fiscal_year || await getSetting('fiscal_year')
      });
    } else {
      return ApiResponder.badRequest(res, 'Critères de recherche requis (supplier_id, account_number, phone)');
    }

    // Filter by status if specified
    if (status && invoices.length > 0) {
      invoices = invoices.filter(invoice => invoice.status === status);
    }

    if (invoices.length === 0) {
      return ApiResponder.notFound(res, `Aucune facture trouvée avec les critères de recherche (${searchType})`);
    }

    logger.info(`[${requestId}] Invoice search performed`, {
      userId: user.sup,
      role: user.role,
      searchType,
      count: invoices.length
    });

    return ApiResponder.success(res, invoices, `${invoices.length} facture(s) trouvée(s) par ${searchType}`);
  } catch (err) {
    logger.error(`[${requestId}] Error during invoice search`, {
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : 'unknown stack',
      query: req.query
    });
    return ApiResponder.error(res, err);
  }
}

export async function updateInvoice(
  req: Request<{ id: string }, unknown, Partial<UpdateInvoiceDto>>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';

  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    }

    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return ApiResponder.badRequest(res, 'ID de la facture requis');
    }


    const existingInvoices = await Invoice.findInvoice(id, {
      findBy: 'id',
      limit: 1,
      orderBy: 'desc'
    });

    if (!existingInvoices || existingInvoices.length === 0) {
      return ApiResponder.notFound(res, 'Facture introuvable');
    }

    const existingInvoice = existingInvoices[0];

    if (!canAccessInvoice(user, existingInvoice.created_by)) {
      return ApiResponder.forbidden(res, 'Accès refusé à cette facture');
    }

    // Prepare update data (correctly map required fields)
    const updateInvoiceData: UpdateInvoiceDto = {
      id: existingInvoice.id,
      invoice_num: updateData.invoice_num ?? existingInvoice.num_invoice,
      invoice_object: updateData.invoice_object ?? existingInvoice.invoice_object,
      supplier_id: Number(updateData.supplier_id ?? existingInvoice.supplier_id),
      invoice_nature: updateData.invoice_nature ?? existingInvoice.invoice_nature,
      invoice_arrival_date: updateData.invoice_arrival_date ?? existingInvoice.invoice_arr_date,
      invoice_date: updateData.invoice_date ?? existingInvoice.invoice_date,
      invoice_type: updateData.invoice_type ?? existingInvoice.invoice_type,
      folio: updateData.folio ?? existingInvoice.folio,
      invoice_amount: updateData.invoice_amount
        ? String(updateData.invoice_amount).replace(/\s/g, '').replace(',', '.')
        : existingInvoice.amount,
      status: updateData.status ?? existingInvoice.status,
      documents: updateData.documents ?? [],
      created_by: existingInvoice.created_by,
      created_by_email: existingInvoice.created_by_email,
      created_by_role: existingInvoice.created_by_role
    };

    const result = await Invoice.updateInvoice(updateInvoiceData);

    if (!result.success) {
      return ApiResponder.error(res, 'Erreur lors de la mise à jour de la facture');
    }

    logger.info(`[${requestId}] Invoice updated`, {
      invoiceId: id,
      userId: user.sup,
      role: user.role
    });

    return ApiResponder.success(res, null, 'Facture mise à jour avec succès');
  } catch (err) {
    logger.error(`[${requestId}] Error during invoice update`, {
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : 'unknown stack',
      invoiceId: req.params.id,
      body: req.body
    });
    return ApiResponder.error(res, err);
  }
}

export async function deleteInvoice(
  req: Request<{ id: string }>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';

  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    }

    const { id } = req.params;

    if (!id) {
      return ApiResponder.badRequest(res, 'ID de la facture requis');
    }

    // Check that the invoice exists and that the user has access to it
    const existingInvoices = await Invoice.findInvoice(id, {
      findBy: 'id',
      limit: 1,
      orderBy: 'desc'
    });

    if (!existingInvoices || existingInvoices.length === 0) {
      return ApiResponder.notFound(res, 'Facture introuvable');
    }

    const existingInvoice = existingInvoices[0];

    if (!canAccessInvoice(user, existingInvoice.created_by)) {
      return ApiResponder.forbidden(res, 'Accès refusé à cette facture');
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return ApiResponder.badRequest(res, 'ID de facture invalide');
    }

    const result = await Invoice.deleteInvoice(numericId);

    if (!result.success) {
      return ApiResponder.error(res, 'Erreur lors de la suppression de la facture');
    }

    logger.info(`[${requestId}] Invoice deleted`, {
      invoiceId: id,
      userId: user.sup,
      role: user.role
    });

    return ApiResponder.success(res, null, 'Facture supprimée avec succès');
  } catch (err) {
    logger.error(`[${requestId}] Error during invoice deletion`, {
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : 'unknown stack',
      invoiceId: req.params.id
    });
    return ApiResponder.error(res, err);
  }
}

// Utility functions for advanced search

/**
 * Search invoices by creator
 */
async function searchInvoicesByCreator(
  createdBy: string,
  limit?: number,
  orderBy: 'desc' | 'asc' = 'desc',
  fiscalYear?: string
): Promise<InvoiceRecord[]> {
  try {
    const query = `
      SELECT * FROM invoice 
      WHERE created_by = ? ${fiscalYear ? 'AND fiscal_year = ?' : ''}
      ORDER BY create_at ${orderBy}
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    const params = fiscalYear ? [createdBy, fiscalYear] : [createdBy];
    const result = await database.execute<InvoiceRecord[] | InvoiceRecord>(query, params);

    if (result && !Array.isArray(result)) {
      return [result];
    }
    return result || [];
  } catch (error) {
    logger.error('Error during invoice search by creator', {
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      createdBy
    });
    return [];
  }
}

/**
 * Global search in invoices
 */
async function globalSearchInvoices(
  searchTerm: string,
  limit?: number,
  orderBy: 'desc' | 'asc' = 'desc',
  fiscalYear?: string
): Promise<InvoiceRecord[]> {
  try {
    const query = `
      SELECT i.* FROM invoice i
      LEFT JOIN supplier s ON i.supplier_id = s.id
      WHERE (
         i.num_invoice LIKE ? 
         OR i.num_cmdt LIKE ?
         OR i.invoice_object LIKE ?
         OR s.name LIKE ?
         OR s.account_number LIKE ?
      ) ${fiscalYear ? 'AND i.fiscal_year = ?' : ''}
      ORDER BY i.create_at ${orderBy}
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    const params = [
      `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`,
      `%${searchTerm}%`, `%${searchTerm}%`
    ];
    const finalParams = fiscalYear ? [...params, fiscalYear] : params;

    const result = await database.execute<InvoiceRecord[] | InvoiceRecord>(query, finalParams);

    if (result && !Array.isArray(result)) {
      return [result];
    }
    return result || [];
  } catch (error) {
    logger.error('Error during global invoice search', {
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      searchTerm
    });
    return [];
  }
}

export async function getLastInvoiceNumber(req: AuthenticatedRequest, res: Response): Promise<Response> {
  const requestId = req.headers['x-request-id'];

  try {
    const user = req.user;
    if (!user || !user.sup) {
      logger.warn(`[${requestId}] Attempt to access resources by unauthenticated user`);
      return ApiResponder.unauthorized(res, 'Accès refusé');
    }

    logger.info(`[${requestId}] Starting search for the last used invoice number`);

    // ✅ FIX: Get current counter, not next number
    const counter = await InvoiceLastNumberValidator.getCurrentFiscalYearCounter();
    const config = await getSetting('cmdt_format');

    // Format last used number (not the next one)
    const lastInvoiceNumber = counter.last_cmdt_number.toString().padStart(config.padding, '0');

    logger.info(`[${requestId}] Last invoice number retrieved successfully: ${lastInvoiceNumber} for year ${counter.fiscal_year}`);

    return ApiResponder.success(res, {
      lastInvoiceNum: lastInvoiceNumber,
      fiscalYear: counter.fiscal_year,
      rawLastNumber: counter.last_cmdt_number // Optional: for debug
    }, 'Dernier numéro de facture récupéré avec succès');

  } catch (error) {
    logger.error(`[${requestId}] Error during last invoice number retrieval`, {
      errorMsg: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'Unknown stack'
    });

    // Safe fallback
    return ApiResponder.success(res, {
      lastInvoiceNum: '0000',
      fiscalYear: new Date().getFullYear().toString()
    }, 'Erreur lors de la récupération, utilisation de la valeur par défaut');
  }
}

export async function getNextInvoiceNumber(req: AuthenticatedRequest, res: Response): Promise<Response> {
  const requestId = req.headers['x-request-id'];

  try {
    const user = req.user;
    if (!user || !user.sup) {
      logger.warn(`[${requestId}] Attempt to access resources by unauthenticated user`);
      return ApiResponder.unauthorized(res, 'Accès refusé');
    }

    logger.info(`[${requestId}] Calculating next expected invoice number`);

    // ✅ For next number, use calculateNextNumberExpected()
    const result = await InvoiceLastNumberValidator.calculateNextNumberExpected();

    if (result.success) {
      logger.info(`[${requestId}] Prochain numéro de facture calculé avec succès: ${result.nextNumberExpected}`);
      return ApiResponder.success(res, {
        nextInvoiceNum: result.nextNumberExpected, // Note: champ différent
        fiscalYear: result.fiscalYear
      }, 'Prochain numéro de facture calculé avec succès');
    } else {
      logger.warn(`[${requestId}] Impossible de calculer le prochain numéro: ${result.errorMessage}`);

      return ApiResponder.error(res, {
        nextInvoiceNum: '0000',
        fiscalYear: new Date().getFullYear().toString(),
        warning: result.errorMessage
      }, 'Calcul du prochain numéro impossible, utilisation de la valeur par défaut');
    }
  } catch (error) {
    logger.error(`[${requestId}] Error during next invoice number calculation`, {
      errorMsg: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'Unknown stack'
    });

    return ApiResponder.error(res, {
      nextInvoiceNum: '0000',
      fiscalYear: new Date().getFullYear().toString()
    }, 'Erreur lors du calcul, utilisation de la valeur par défaut');
  }
}

// List of pending DFC invoices for the current fiscal year
export async function getDfcPendingInvoices(
  req: Request<unknown, unknown, unknown, { limit?: string }>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      logger.warn(`[${requestId}] Attempt to access DFC invoices without authenticated user`);
      return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const invoices = await Invoice.findDfcPendingCurrentFiscalYear(limit);
    const fiscalYear = await getSetting('fiscal_year');

    logger.info(`[${requestId}] Pending DFC invoices retrieved`, {
      userId: user.sup,
      role: user.role,
      count: invoices.length
    });

    return ApiResponder.success(res, invoices, `${invoices.length} facture(s) DFC en attente`, { fiscalYear });
  } catch (error) {
    logger.error(`[${requestId}] Error during pending DFC invoices retrieval`, {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'unknown stack'
    });
    return ApiResponder.error(res, error);
  }
}

// Approve a DFC invoice (current fiscal year only)
export async function approveDfcInvoice(
  req: Request<{ id: string }>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    const { id } = req.params;
    if (!id) return ApiResponder.badRequest(res, 'ID de la facture requis');

    const result = await Invoice.updateDfcStatusIfCurrentFiscalYear(id, 'approved', user.sup);
    if (!result.success) {
      return ApiResponder.badRequest(res, result.message || "Impossible d'approuver la facture");
    }

    const fiscalYear = await getSetting('fiscal_year');
    const body = (req as AuthenticatedRequest).body || {};
    await database.execute(
      "INSERT INTO dfc_decision(invoice_id, decision, comment, decided_by, fiscal_year) VALUES (?,?,?,?,?)",
      [id, 'approved', body.comments || null, user.sup, fiscalYear]
    );

    logger.info(`[${requestId}] Facture DFC approuvée`, { invoiceId: id, userId: user.sup, role: user.role });
    return ApiResponder.success(res, null, 'Facture approuvée avec succès');
  } catch (error) {
    logger.error(`[${requestId}] Error during DFC approval`, {
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    return ApiResponder.error(res, error);
  }
}

// Reject a DFC invoice (current fiscal year only)
export async function rejectDfcInvoice(
  req: Request<{ id: string }>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    const { id } = req.params;
    if (!id) return ApiResponder.badRequest(res, 'ID de la facture requis');

    const result = await Invoice.updateDfcStatusIfCurrentFiscalYear(id, 'rejected', user.sup);
    if (!result.success) {
      return ApiResponder.badRequest(res, result.message || 'Impossible de rejeter la facture');
    }

    const fiscalYear = await getSetting('fiscal_year');
    const body = req.body || {};
    await database.execute(
      "INSERT INTO dfc_decision(invoice_id, decision, comment, decided_by, fiscal_year) VALUES (?,?,?,?,?)",
      [id, 'rejected', body.comments || null, user.sup, fiscalYear]
    );

    logger.info(`[${requestId}] Facture DFC rejetée`, { invoiceId: id, userId: user.sup, role: user.role });
    return ApiResponder.success(res, null, 'Facture mise à jour avec succès');
  } catch (error) {
    logger.error(`[${requestId}] Error during DFC rejection`, {
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    return ApiResponder.error(res, error);
  }
}

// ✅ NEW: Get invoice attachments
export async function getInvoiceAttachments(
  req: Request<{ id: string }>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';

  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    }

    const { id } = req.params;

    if (!id) {
      return ApiResponder.badRequest(res, 'ID de la facture requis');
    }

    const result = await Invoice.getInvoiceAttachments(id);

    if (!result.success) {
      return ApiResponder.error(res, new Error('Erreur lors de la récupération des pièces jointes'));
    }

    return ApiResponder.success(res, { documents: result.documents });
  } catch (err) {
    logger.error(`[${requestId}] Error during attachments retrieval`, {
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : 'unknown stack',
      invoiceId: req.params.id
    });
    return ApiResponder.error(res, err);
  }
}

// ✅ NEW: Update invoice attachments
export async function updateInvoiceAttachments(
  req: Request<{ id: string }, unknown, { documents: string[] }>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';

  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    }

    const { id } = req.params;
    const { documents } = req.body;

    if (!id) {
      return ApiResponder.badRequest(res, 'ID de la facture requis');
    }

    if (!Array.isArray(documents)) {
      return ApiResponder.badRequest(res, 'Les documents doivent être un tableau');
    }

    const result = await Invoice.updateInvoiceAttachments(id, documents, user.sup || 'unknown');

    if (!result.success) {
      return ApiResponder.error(res, new Error('Erreur lors de la mise à jour des pièces jointes'));
    }

    return ApiResponder.success(res, { message: 'Pièces jointes mises à jour avec succès' });
  } catch (err) {
    logger.error(`[${requestId}] Erreur lors de la mise à jour des attachments`, {
      errorMessage: err instanceof Error ? err.message : 'Erreur inconnue',
      stack: err instanceof Error ? err.stack : 'unknown stack',
      invoiceId: req.params.id
    });
    return ApiResponder.error(res, err);
  }
}

// ✅ NEW: Delete invoice attachments
export async function deleteInvoiceAttachments(
  req: Request<{ id: string }>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';

  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    }

    const { id } = req.params;

    if (!id) {
      return ApiResponder.badRequest(res, 'ID de la facture requis');
    }

    const result = await Invoice.deleteInvoiceAttachments(id, user.sup || 'unknown');

    if (!result.success) {
      return ApiResponder.error(res, new Error('Erreur lors de la suppression des pièces jointes'));
    }

    return ApiResponder.success(res, { message: 'Pièces jointes supprimées avec succès' });
  } catch (err) {
    logger.error(`[${requestId}] Erreur lors de la suppression des attachments`, {
      errorMessage: err instanceof Error ? err.message : 'Erreur inconnue',
      stack: err instanceof Error ? err.stack : 'unknown stack',
      invoiceId: req.params.id
    });
    return ApiResponder.error(res, err);
  }
}

