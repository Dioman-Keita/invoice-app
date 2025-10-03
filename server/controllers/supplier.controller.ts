import type { Request, Response } from 'express';
import ApiResponder from "../utils/ApiResponder";
import supplier, { SupplierRecord, CreateSupplierInput } from "../models/Supplier";
import logger from '../utils/Logger';
import { auditLog } from '../utils/auditLogger';


type SupplierIdParams = { id: string };

export async function createSupplier(
    req: Request<unknown, unknown, CreateSupplierInput>,
    res: Response
): Promise<Response> {
    const requestId = req.headers['x-request-id'] || 'unknown';
    const user = (req as any).user;
    try {
        const { supplier_name, supplier_account_number = '', supplier_phone = '' } = req.body || {};
        if (!user || !user.sup) {
            logger.warn(`[${requestId}] Tentative de création de fournisseur pas un utilisateur non authentifier`);
            return ApiResponder.unauthorized(res, 'Accès non autorisé.');
        }
        if (!supplier_name) {
            return ApiResponder.badRequest(res, 'Le nom du fournisseur est requis');
        }
        if (!supplier_account_number) {
            return ApiResponder.badRequest(res, 'Le numéro de compte du fournisseur est requis');
        }
        if (!/^\d{12}$/.test(supplier_account_number)) {
            return ApiResponder.badRequest(res, 'Le numéro de compte doit contenir exactement 12 chiffres');
        }

        const isSupplierExist: SupplierRecord[] = await supplier.findSupplier(supplier_account_number, {findBy: 'account_number'});
        if (isSupplierExist && isSupplierExist.length > 0) return ApiResponder.badRequest(res, 'Ce fournisseur existe déjà');

        const result = await supplier.create({
            supplier_name,
            supplier_account_number,
            supplier_phone,
            created_by: user.sup,
            created_by_email: user.email,
            created_by_role: user.role
        } as CreateSupplierInput);
        return ApiResponder.created(res, result, 'Fournisseur créé');
    } catch (err) {
        logger.error(`[${requestId}] Erreur lors de la création du fournisseur`, { 
            error: err instanceof Error ? err.message : 'Erreur inconnue' 
        });
        return ApiResponder.error(res, err);
    }
}

export async function getSupplierId(
    supplierData: CreateSupplierInput, 
    _userId: string
): Promise<{success: boolean, supplierId?: number}> {
    try {
        const existingSupplier: SupplierRecord[] = await supplier.findSupplier(
            Number(supplierData.supplier_account_number), 
            {findBy: 'account_number'}
        );
        
        if (existingSupplier && existingSupplier.length > 0) {
            return {
                success: true,
                supplierId: Number(existingSupplier[0].id)
            };
        }

        // ⚠️ CORRECTION : Attendre la résolution de la Promise
        const result = await supplier.create(supplierData);
        const supplierId = (result as any).id; // Maintenant result est résolu

        if (!result.success || !result.id) {
            logger.error('Échec de la création du fournisseur ou ID non retourné', {
                result,
                supplierData: {
                    name: supplierData.supplier_name,
                    accountNumber: supplierData.supplier_account_number
                }
            });
            return { success: false };
        }

        return {
            success: true,
            supplierId
        };
    } catch (error) {
        logger.error('Erreur lors de la recuperation de l\'identifiant du fournisseur', {
            error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
        return { success: false };
    }
}

export async function getSupplier(
    req: Request<SupplierIdParams>,
    res: Response
): Promise<Response> {
    try {
        const { id } = req.params;
        const rows = await supplier.findSupplier(Number(id));
        if (!rows || rows.length === 0) {
            return ApiResponder.notFound(res, 'Fournisseur introuvable');
        }
        return ApiResponder.success(res, rows[0]);
    } catch (err) {
        logger.error('Erreur lors de la récupération du fournisseur', { 
            error: err instanceof Error ? err.message : 'Erreur inconnue' 
        });
        return ApiResponder.error(res, err);
    }
}

export async function listSuppliers(
    _req: Request,
    res: Response
): Promise<Response> {
    try {
        const rows = await supplier.getAllSupplier();
        return ApiResponder.success(res, rows);
    } catch (err) {
        logger.error('Erreur lors de la récupération de la liste des fournisseurs', { 
            error: err instanceof Error ? err.message : 'Erreur inconnue' 
        });
        return ApiResponder.error(res, err);
    }
}

export async function findSupplierByPhone(
    req: Request<unknown, unknown, unknown, { phone?: string }>,
    res: Response
): Promise<Response> {
    try {
        const phone = req.query?.phone || '';
        if (!phone) {
            return ApiResponder.badRequest(res, 'Paramètre phone requis');
        }
        const rows = await supplier.findSupplierByPhone(String(phone));
        return rows && rows.length > 0
            ? ApiResponder.success(res, rows[0])
            : ApiResponder.notFound(res, 'Fournisseur introuvable');
    } catch (err) {
        logger.error('Erreur lors de la recherche du fournisseur par téléphone', { 
            error: err instanceof Error ? err.message : 'Erreur inconnue' 
        });
        return ApiResponder.error(res, err);
    }
}

export async function deleteSupplierById(
    req: Request<unknown, unknown, unknown, { id?: string }>,
    res: Response
): Promise<Response> {
    try {
        const id = req.query?.id || '';
        if (!id) {
            return ApiResponder.badRequest(res, 'Paramètre id requis');
        }
        const rows = await supplier.deleteSupplier(Number(id as string));
        if (!rows) return ApiResponder.notFound(res, 'Fournisseur introuvable');
        return ApiResponder.success(res, rows, 'Fournisseur supprimé');
    } catch (err) {
        logger.error('Erreur lors de la suppression du fournisseur', {
            error: err instanceof Error ? err.message : 'Erreur inconnue'
        });
        return ApiResponder.error(res, err);
    }
}



