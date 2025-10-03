import ApiResponder from "../utils/ApiResponder";
import Invoice, { CreateInvoiceInput, InvoiceInputBody, InvoiceRecordType, UpdateInvoiceData } from "../models/Invoice";
import type { Response, Request } from 'express';
import logger from "../utils/Logger";
import { canAccessInvoice } from "../middleware/roleGuard";
import { getSupplierId } from "./supplier.controller";

type SearchInvoiceQueryParams = {
    supplier_id?: string;
    account_number?: string;
    phone?: string;
    status?: string;
    created_by?: string;
    limit?: string;
    orderBy?: 'desc' | 'asc';
    search?: string;
};

export async function createInvoice(
  req: Request<unknown, unknown, InvoiceInputBody>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  try {
    // Récupérer l'utilisateur connecté depuis req.user
    const user = (req as any).user;
    
    if (!user) {
      logger.warn(`[${requestId}] Tentative de création de facture sans utilisateur authentifié`);
      return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    }

    logger.info(`[${requestId}] Debut de la création de la facture`);
    const data = req.body;

    // Validations des champs obligatoires
    if (!data.invoice_num?.trim()) {
      return ApiResponder.badRequest(res, 'Le numéro de facture est requis');
    }
    if (!data.supplier_account_number?.trim()) {
      return ApiResponder.badRequest(res, 'Le numéro de compte fournisseur est requis');
    }
    if (!data.supplier_name?.trim()) {
      return ApiResponder.badRequest(res, 'Le nom du fournisseur est requis');
    }
    if (!data.invoice_amount || isNaN(Number(data.invoice_amount))) {
      return ApiResponder.badRequest(res, 'Le montant de la facture est invalide');
    }

    // Validation du numéro de compte fournisseur
    if (!/^\d{12}$/.test(data.supplier_account_number)) {
      return ApiResponder.badRequest(res, 'Le numéro de compte doit contenir exactement 12 chiffres');
    }

    // Validation du montant
    const amount = Number(data.invoice_amount);
    if (amount <= 0 || amount > 100_000_000_000) {
      return ApiResponder.badRequest(res, 'Le montant doit être compris entre 1 et 100 000 000 000');
    }

    // Récupérer ou créer le fournisseur
    const supplierResult = await getSupplierId({ 
      supplier_account_number: data.supplier_account_number,
      supplier_name: data.supplier_name,
      supplier_phone: data.supplier_phone || '',
      created_by: user.sup,
      created_by_email: user.email,
      created_by_role: user.role,
    }, user.sup);

    if (!supplierResult.success || !supplierResult.supplierId) {
      logger.warn(`[${requestId}] Erreur lors de la récupération/création du fournisseur`, {
        userId: user.sup,
        email: user.email,
        role: user.role,
        supplierData: {
          name: data.supplier_name,
          account_number: data.supplier_account_number
        }
      });
      return ApiResponder.badRequest(res, "Erreur lors de la gestion du fournisseur");
    }

    // Préparer les données pour la création de la facture
    const invoiceData = {
      num_cmdt: data.num_cmdt,
      invoice_num: data.invoice_num,
      invoice_object: data.invoice_object,
      invoice_nature: data.invoice_nature,
      invoice_arrival_date: data.invoice_arrival_date,
      invoice_date: data.invoice_date,
      invoice_type: data.invoice_type,
      folio: data.folio,
      invoice_amount: data.invoice_amount,
      status: data.invoice_status || 'Non',
      documents: data.documents,
      supplier_id: supplierResult.supplierId,
      created_by: user.sup,
      created_by_email: user.email,
      created_by_role: user.role
    } as CreateInvoiceInput;

    const result = await Invoice.create(invoiceData);

    if (!result.success) {
      logger.error(`[${requestId}] Erreur lors de la création de la facture dans le modèle`, {
        userId: user.sup,
        error: result.data
      });
      return ApiResponder.error(res, result.data);
    }

    logger.info(`[${requestId}] Facture créée avec succès`, { 
      userId: user.sup, 
      email: user.email,
      role: user.role,
      supplierId: supplierResult.supplierId
    });

    return ApiResponder.created(res, result.data, 'Facture créée avec succès');
  } catch (err) {
    logger.error(`[${requestId}] Erreur lors de la création de facture`, { 
      errorMessage: err instanceof Error ? err.message : 'Erreur inconnue',
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
    const user = (req as any).user;
    
    if (!user) {
      logger.warn(`[${requestId}] Tentative d'accès à une facture sans utilisateur authentifié`);
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

    // Vérifier que l'utilisateur peut accéder à cette facture
    const invoiceData = invoices[0];
    
    if (!canAccessInvoice(user, invoiceData.created_by)) {
      logger.warn(`[${requestId}] Tentative d'accès non autorisé à une facture`, { 
        invoiceId: id, 
        userId: user.sup, 
        invoiceOwner: invoiceData.created_by 
      });
      return ApiResponder.forbidden(res, 'Accès refusé à cette facture');
    }

    logger.info(`[${requestId}] Facture récupérée`, { 
      invoiceId: id, 
      userId: user.sup, 
      role: user.role 
    });

    return ApiResponder.success(res, invoiceData);
  } catch (err) {
    logger.error(`[${requestId}] Erreur lors de la récupération de facture`, { 
      errorMessage: err instanceof Error ? err.message : 'Erreur inconnue',
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
    const user = (req as any).user;
    
    if (!user) {
      logger.warn(`[${requestId}] Tentative de récupération des factures sans utilisateur authentifié`);
      return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    }

    const { supplier_id, account_number, phone, status, created_by, limit, orderBy, search } = req.query;

    let invoices: InvoiceRecordType[] = [];

    // Si c'est un admin, on peut chercher par différents critères
    if (user.role === 'admin') {
      if (supplier_id) {
        invoices = await Invoice.findInvoice(supplier_id, {
          findBy: 'supplier_id',
          limit: limit ? parseInt(limit) : null,
          orderBy: orderBy || 'desc'
        });
      } else if (account_number) {
        invoices = await Invoice.findInvoice(account_number, {
          findBy: 'account_number',
          limit: limit ? parseInt(limit) : null,
          orderBy: orderBy || 'desc'
        });
      } else if (phone) {
        invoices = await Invoice.findInvoice(phone, {
          findBy: 'phone',
          limit: limit ? parseInt(limit) : null,
          orderBy: orderBy || 'desc'
        });
      } else if (created_by) {
        // Recherche par créateur (pour les admins)
        invoices = await searchInvoicesByCreator(created_by, limit ? parseInt(limit) : undefined, orderBy);
      } else if (search) {
        // Recherche globale (pour les admins)
        invoices = await globalSearchInvoices(search, limit ? parseInt(limit) : undefined, orderBy);
      } else {
        // Toutes les factures pour les admins
        invoices = await Invoice.findInvoice('', {
          findBy: 'all',
          limit: limit ? parseInt(limit) : null,
          orderBy: orderBy || 'desc'
        });
      }
    } else {
      // Pour les non-admins, seulement leurs propres factures
      invoices = await searchInvoicesByCreator(user.sup, limit ? parseInt(limit) : undefined, orderBy);
    }

    // Filtrer par statut si spécifié
    if (status && invoices.length > 0) {
      invoices = invoices.filter(invoice => invoice.status === status);
    }

    logger.info(`[${requestId}] Factures récupérées`, { 
      userId: user.sup, 
      role: user.role,
      count: invoices.length,
      filters: req.query
    });

    return ApiResponder.success(res, invoices, `${invoices.length} facture(s) trouvée(s)`);
  } catch (err) {
    logger.error(`[${requestId}] Erreur lors de la récupération des factures`, { 
      errorMessage: err instanceof Error ? err.message : 'Erreur inconnue',
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
    const user = (req as any).user;
    
    if (!user) {
      return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    }

    const { supplier_id, account_number, phone, status, limit, orderBy } = req.query;

    // Vérifier les permissions pour la recherche avancée
    if (user.role !== 'admin' && (supplier_id || account_number || phone)) {
      logger.warn(`[${requestId}] Tentative de recherche avancée sans permissions admin`, {
        userId: user.sup,
        role: user.role,
        query: req.query
      });
      return ApiResponder.forbidden(res, 'Permissions insuffisantes pour cette recherche');
    }

    let invoices: InvoiceRecordType[] = [];
    let searchType = '';

    if (supplier_id) {
      searchType = 'supplier_id';
      invoices = await Invoice.findInvoice(supplier_id, {
        findBy: 'supplier_id',
        limit: limit ? parseInt(limit) : null,
        orderBy: orderBy || 'desc'
      });
    } else if (account_number) {
      searchType = 'account_number';
      invoices = await Invoice.findInvoice(account_number, {
        findBy: 'account_number',
        limit: limit ? parseInt(limit) : null,
        orderBy: orderBy || 'desc'
      });
    } else if (phone) {
      searchType = 'phone';
      invoices = await Invoice.findInvoice(phone, {
        findBy: 'phone',
        limit: limit ? parseInt(limit) : null,
        orderBy: orderBy || 'desc'
      });
    } else {
      return ApiResponder.badRequest(res, 'Critère de recherche requis (supplier_id, account_number, phone)');
    }

    // Filtrer par statut si spécifié
    if (status && invoices.length > 0) {
      invoices = invoices.filter(invoice => invoice.status === status);
    }

    if (invoices.length === 0) {
      return ApiResponder.notFound(res, `Aucune facture trouvée avec les critères de recherche (${searchType})`);
    }

    logger.info(`[${requestId}] Recherche de factures effectuée`, {
      userId: user.sup,
      role: user.role,
      searchType,
      count: invoices.length
    });

    return ApiResponder.success(res, invoices, `${invoices.length} facture(s) trouvée(s) par ${searchType}`);
  } catch (err) {
    logger.error(`[${requestId}] Erreur lors de la recherche des factures`, {
      errorMessage: err instanceof Error ? err.message : 'Erreur inconnue',
      stack: err instanceof Error ? err.stack : 'unknown stack',
      query: req.query
    });
    return ApiResponder.error(res, err);
  }
}

export async function updateInvoice(
  req: Request<{ id: string }, unknown, Partial<UpdateInvoiceData>>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  try {
    const user = (req as any).user;
    
    if (!user) {
      return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    }

    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return ApiResponder.badRequest(res, 'ID de la facture requis');
    }

    // Vérifier que la facture existe et que l'utilisateur y a accès
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

    // Préparer les données de mise à jour
    const updateInvoiceData = {
      ...existingInvoice,
      ...updateData,
      id: existingInvoice.id,
      created_by: existingInvoice.created_by, // Garder le créateur original
      created_by_email: existingInvoice.created_by_email,
      created_by_role: existingInvoice.created_by_role
    };

    const result = await Invoice.updateInvoice(updateInvoiceData);

    if (!result.success) {
      return ApiResponder.error(res, 'Erreur lors de la mise à jour de la facture');
    }

    logger.info(`[${requestId}] Facture mise à jour`, {
      invoiceId: id,
      userId: user.sup,
      role: user.role
    });

    return ApiResponder.success(res, null, 'Facture mise à jour avec succès');
  } catch (err) {
    logger.error(`[${requestId}] Erreur lors de la mise à jour de la facture`, {
      errorMessage: err instanceof Error ? err.message : 'Erreur inconnue',
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
    const user = (req as any).user;
    
    if (!user) {
      return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    }

    const { id } = req.params;

    if (!id) {
      return ApiResponder.badRequest(res, 'ID de la facture requis');
    }

    // Vérifier que la facture existe et que l'utilisateur y a accès
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

    logger.info(`[${requestId}] Facture supprimée`, {
      invoiceId: id,
      userId: user.sup,
      role: user.role
    });

    return ApiResponder.success(res, null, 'Facture supprimée avec succès');
  } catch (err) {
    logger.error(`[${requestId}] Erreur lors de la suppression de la facture`, {
      errorMessage: err instanceof Error ? err.message : 'Erreur inconnue',
      stack: err instanceof Error ? err.stack : 'unknown stack',
      invoiceId: req.params.id
    });
    return ApiResponder.error(res, err);
  }
}

// Fonctions utilitaires pour la recherche avancée

/**
 * Recherche des factures par créateur
 */
async function searchInvoicesByCreator(
  createdBy: string,
  limit?: number,
  orderBy: 'desc' | 'asc' = 'desc'
): Promise<InvoiceRecordType[]> {
  try {
    const query = `
      SELECT * FROM invoice 
      WHERE created_by = ? 
      ORDER BY create_at ${orderBy}
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    const result = await (Invoice as any).database.execute(query, [createdBy]);
    
    if (result && !Array.isArray(result)) {
      return [result];
    }
    return result || [];
  } catch (error) {
    logger.error('Erreur lors de la recherche des factures par créateur', {
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      createdBy
    });
    return [];
  }
}

/**
 * Recherche globale dans les factures
 */
async function globalSearchInvoices(
  searchTerm: string,
  limit?: number,
  orderBy: 'desc' | 'asc' = 'desc'
): Promise<InvoiceRecordType[]> {
  try {
    const query = `
      SELECT i.* FROM invoice i
      LEFT JOIN supplier s ON i.supplier_id = s.id
      WHERE i.num_invoice LIKE ? 
         OR i.num_cmdt LIKE ?
         OR i.invoice_object LIKE ?
         OR s.name LIKE ?
         OR s.account_number LIKE ?
      ORDER BY i.create_at ${orderBy}
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    const params = [
      `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`,
      `%${searchTerm}%`, `%${searchTerm}%`
    ];
    
    const result = await (Invoice as any).database.execute(query, params);
    
    if (result && !Array.isArray(result)) {
      return [result];
    }
    return result || [];
  } catch (error) {
    logger.error('Erreur lors de la recherche globale des factures', {
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      searchTerm
    });
    return [];
  }
}