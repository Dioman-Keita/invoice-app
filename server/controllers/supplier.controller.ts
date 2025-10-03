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
    supplierData: CreateSupplierInput
): Promise<{success: boolean, supplierId?: number, message?: string}> {
    try {

        const { supplier_account_number, supplier_phone, supplier_name } = supplierData;

        const exactSupplier = await supplier.findExactSupplier(
            supplier_account_number,
            supplier_phone,
            supplier_name
        );
        
        if (exactSupplier && exactSupplier.length > 0) {
            logger.debug('Fournisseur exact trouvé', {
                supplierId: exactSupplier[0].id,
                accountNumber: supplier_account_number,
                phone: supplier_phone,
                name: supplier_name
            });

            return {
                success: true,
                supplierId: Number(exactSupplier[0].id)
            };
        }

        const conflicts = await supplier.findSupplierConflicts(
            supplier_account_number,
            supplier_phone
        );

        if (conflicts.hasAccountConflict || conflicts.hasPhoneConflict) {
            logger.warn('Conflit détecté lors de la création du fournisseur', {
                accountNumber: supplier_account_number,
                phone: supplier_phone,
                name: supplier_name,
                conflicts: {
                    accountConflict: conflicts.hasAccountConflict,
                    phoneConflict: conflicts.hasPhoneConflict,
                    existingSuppliers: conflicts.conflictingSuppliers.map(s => ({
                        id: s.id,
                        name: s.name,
                        accountNumber: s.account_number,
                        phone: s.phone
                    }))
                }
            });
        }
        
        if (conflicts.hasAccountConflict && conflicts.hasPhoneConflict) {
            return {
                success: false,
                message: 'Un fournisseur existe déjà avec ce numéro de compte et ce téléphone'
            };
        } else if (conflicts.hasAccountConflict) {
            const existing = conflicts.conflictingSuppliers.find(s => s.account_number === supplier_account_number);
            return {
                success: false,
                message: `Le numéro de compte existe déjà pour le fournisseur "${existing?.name}"`
            }
        } else if (conflicts.hasPhoneConflict){
            const existing = conflicts.conflictingSuppliers.find(s => s.phone === supplier_phone);
            return {
                success: false,
                message: `Le numéro de téléphone extiste déjà pour le fournisseur "${existing?.name}"`
            }
        } else {
            const result = await supplier.create({
                ...supplierData,
                created_by: supplierData.created_by,
                created_by_email: supplierData.created_by_email,
                created_by_role: supplierData.created_by_role
            });

            if (!result.success || !result.id) {
                logger.error('Échec de la création du fournisseur', {
                    result,
                    supplierData: {
                        name: supplier_name,
                        accountNumber: supplier_account_number,
                        phone: supplier_phone
                    }
                });
                return {
                    success: false,
                    message: 'Erreur lors de la création du fournisseur'
                };
            }

            logger.debug('Nouveau fournisseur créé avec succès', {
                supplierId: result.id,
                accountNumber: supplier_account_number,
                phone: supplier_phone
            });

            return {
                success: true,
                supplierId: result.id                
            }
        }

    } catch (error) {
        logger.error('Erreur lors de la récupération de l\'identifiant du fournisseur', {
            error: error instanceof Error ? error.message : 'Erreur inconnue',
            supplierData: {
                name: supplierData.supplier_name,
                accountNumber: supplierData.supplier_account_number,
                phone: supplierData.supplier_phone
            }
        });
        return { 
            success: false,
            message: 'Erreur interne lors de la gestion du fournisseur'
        };
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



