import type { Request, Response } from 'express';
import ApiResponder from "../utils/ApiResponder";
import supplier from "../models/Supplier";
import logger from '../utils/Logger';

type CreateSupplierBody = {
    supplier_name: string;
    supplier_email?: string;
    supplier_phone?: string;
};

type SupplierIdParams = { id: string };

export async function createSupplier(
    req: Request<unknown, unknown, CreateSupplierBody>,
    res: Response
): Promise<Response> {
    try {
        const { supplier_name, supplier_email = '', supplier_phone = '' } = req.body || {};
        if (!supplier_name) {
            return ApiResponder.badRequest(res, 'Le nom du fournisseur est requis');
        }

        const isSupplierExist = await supplier.findSupplier(supplier_email, 'email');
        if (isSupplierExist || isSupplierExist.length > 0) return ApiResponder.badRequest(res, 'Ce fournisseur existe déjà');

        const result = await supplier.create({
            suplier_name: supplier_name,
            suplier_email: supplier_email,
            suplier_phone: supplier_phone,
        } as any);
        return ApiResponder.created(res, result, 'Fournisseur créé');
    } catch (err) {
        logger.error(err);
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
        logger.error(err);
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
        logger.error(err);
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
        logger.error(err);
        return ApiResponder.error(res, err);
    }
}


