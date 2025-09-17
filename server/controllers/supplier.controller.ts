import type { Request, Response } from 'express';
import ApiResponder from "../utils/ApiResponder";
import supplier, {SupplierRecord} from "../models/Supplier";
import logger from '../utils/Logger';

type CreateSupplierBody = {
    supplier_name: string;
    supplier_account_number: string;
    supplier_phone?: string;
};

type SupplierIdParams = { id: string };

export async function createSupplier(
    req: Request<unknown, unknown, CreateSupplierBody>,
    res: Response
): Promise<Response> {
    try {
        const { supplier_name, supplier_account_number = '', supplier_phone = '' } = req.body || {};
        if (!supplier_name) {
            return ApiResponder.badRequest(res, 'Le nom du fournisseur est requis');
        }
        if (!supplier_account_number) {
            return ApiResponder.badRequest(res, 'Le numéro de compte du fournisseur est requis');
        }
        if (!/^\d{12}$/.test(supplier_account_number)) {
            return ApiResponder.badRequest(res, 'Le numéro de compte doit contenir exactement 12 chiffres');
        }

        const isSupplierExist: SupplierRecord[] = await supplier.findSupplier(supplier_account_number, 'account_number');
        if (isSupplierExist && isSupplierExist.length > 0) return ApiResponder.badRequest(res, 'Ce fournisseur existe déjà');

        const result = await supplier.create({
            suplier_name: supplier_name,
            suplier_account_number: supplier_account_number,
            suplier_phone: supplier_phone,
        } as any);
        return ApiResponder.created(res, result, 'Fournisseur créé');
    } catch (err) {
        logger.error('Erreur lors de la création du fournisseur', { 
            error: err instanceof Error ? err.message : 'Erreur inconnue' 
        });
        return ApiResponder.error(res, err);
    }
}

export async function getSupplier(
    req: Request<SupplierIdParams>,
    res: Response
): Promise<Response> {
    try {
        const { id } = req.params;
        const rows = await supplier.findSupplier(id);
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
        const rows = await supplier.getAllsupplier();
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


