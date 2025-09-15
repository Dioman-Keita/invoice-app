import ApiResponder from "../utils/ApiResponder";
import Invoice, { CreateInvoiceInput, InvoiceRecord } from "../models/Invoice";
import type { Response, Request } from 'express';
import logger from "../utils/Logger";
import { canAccessInvoice } from "../middleware/roleGuard";

export async function createInvoice(
  req: Request<unknown, unknown, CreateInvoiceInput>,
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

    const data = req.body as CreateInvoiceInput;
    
    // Associer la facture à l'utilisateur connecté
    const invoiceData = {
      ...data,
      createdBy: user.sup,        // ID de l'utilisateur qui crée la facture
      createdByEmail: user.email, // Email pour traçabilité
      createdByRole: user.role    // Rôle pour autorisation
    };

    const result = await Invoice.create(invoiceData);

    logger.info(`[${requestId}] Création de facture`, { 
      userId: user.sup, 
      email: user.email,
      role: user.role 
    });
    return ApiResponder.created(res, result, 'Facture créée');
  } catch (err) {
    logger.error(`[${requestId}] Erreur lors de la création de facture`, { 
      error: err instanceof Error ? err.message : 'Erreur inconnue' 
    });
    return ApiResponder.error(res, err);
  }
}

type GetInvoiceParams = { id: string };

export async function getInvoice(
  req: Request<GetInvoiceParams>,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  try {
    // Récupérer l'utilisateur connecté
    const user = (req as any).user;
    
    if (!user) {
      logger.warn(`[${requestId}] Tentative d'accès à une facture sans utilisateur authentifié`);
      return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    }

    const { id } = req.params;
    const invoice = (await Invoice.findById(id)) as InvoiceRecord[];
    
    if (!invoice || invoice.length === 0) {
      logger.warn(`[${requestId}] Facture introuvable`, { invoiceId: id, userId: user.sup });
      return ApiResponder.notFound(res, 'Facture introuvable');
    }

    // Vérifier que l'utilisateur peut accéder à cette facture
    const invoiceData = invoice[0];
    
    // Vérifier les permissions d'accès à la facture
    if (!canAccessInvoice(user, invoiceData.created_by as string)) {
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

    return ApiResponder.success(res, invoice);
  } catch (err) {
    logger.error(`[${requestId}] Erreur lors de la récupération de facture`, { 
      error: err instanceof Error ? err.message : 'Erreur inconnue' 
    });
    return ApiResponder.error(res, err);
  }
}

// Fonction pour lister les factures de l'utilisateur connecté
export async function getUserInvoices(
  req: Request,
  res: Response
): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  try {
    // Récupérer l'utilisateur connecté
    const user = (req as any).user;
    
    if (!user) {
      logger.warn(`[${requestId}] Tentative de récupération des factures sans utilisateur authentifié`);
      return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');
    }

    logger.info(`[${requestId}] Récupération des factures utilisateur`, { 
      userId: user.sup, 
      role: user.role 
    });

    // Si c'est un admin, récupérer toutes les factures
    // Sinon, récupérer seulement les factures de l'utilisateur
    let invoices;
    if (user.role === 'admin') {
      invoices = await Invoice.findAll();
    } else {
      invoices = await Invoice.findByUserId(user.sup);
    }

    return ApiResponder.success(res, invoices, 'Factures récupérées');
  } catch (err) {
    logger.error(`[${requestId}] Erreur lors de la récupération des factures`, { 
      error: err instanceof Error ? err.message : 'Erreur inconnue' 
    });
    return ApiResponder.error(res, err);
  }
}
