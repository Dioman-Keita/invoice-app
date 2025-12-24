import type { Request, Response } from 'express';
import ApiResponder from "../utils/ApiResponder";
import { SupplierRecord, CreateSupplierInput, UpdateSupplierData } from "../types";
import supplier from '../models/Supplier';
import { normalizeAccountNumber, isValidAccountNumber, formatAccountCanonical } from "../../common/helpers/formatAccountNumber";
import logger from '../utils/Logger';
import { AuthenticatedRequest } from '../types/express/request';


type SupplierIdParams = { id: string };

export async function createSupplier(
    req: Request<unknown, unknown, CreateSupplierInput>,
    res: Response
): Promise<Response> {
    const requestId = req.headers['x-request-id'] || 'unknown';
    const user = (req as AuthenticatedRequest).user;
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

        if (!isValidAccountNumber(normalizeAccountNumber(supplier_account_number))) {
            return ApiResponder.badRequest(res, 'Le format du numero de compte est invalide (6-34)')
        }
        const normalizeAccount = formatAccountCanonical(supplier_account_number);
        const isSupplierExist: SupplierRecord[] = await supplier.findSupplier(normalizeAccount, { findBy: 'account_number' });
        if (isSupplierExist && isSupplierExist.length > 0) return ApiResponder.badRequest(res, 'Ce fournisseur existe déjà');

        const result = await supplier.create({
            supplier_name,
            supplier_account_number: normalizeAccount,
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
): Promise<{ success: boolean, supplierId?: number, message?: string }> {
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
        } else if (conflicts.hasPhoneConflict) {
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

export async function searchSuppliers(
    req: Request<unknown, unknown, unknown, {
        field: 'name' | 'account_number' | 'phone';
        value: string;
    }>,
    res: Response
): Promise<Response> {
    try {
        const { field, value } = req.query;

        if (!field || !value) {
            return ApiResponder.badRequest(res, 'Les paramètres field et value sont requis');
        }

        if (!['name', 'account_number', 'phone'].includes(decodeURIComponent(field))) {

            return ApiResponder.badRequest(res, 'Le champ de recherche doit être name, account_number ou phone');
        }

        let suppliers: SupplierRecord[] = [];

        switch (field) {
            case 'name':
                suppliers = await supplier.searchSuppliersByName(decodeURIComponent(value));
                break;
            case 'account_number':
                suppliers = await supplier.findSupplier(decodeURIComponent(value), {
                    findBy: 'account_number',
                    limit: 1
                });
                break;
            case 'phone':
                suppliers = await supplier.findSupplier(decodeURIComponent(value), {
                    findBy: 'phone',
                    limit: 1
                });
                break;
            default:
                throw new Error('Type de champ non supporté')
        }

        if (suppliers.length === 0) {
            return ApiResponder.success(res, [], 'Aucun fournisseur trouvé');
        }

        const suggestions = suppliers.map(supplier => ({
            id: supplier.id,
            name: supplier.name,
            account_number: supplier.account_number,
            phone: supplier.phone
        }));

        return ApiResponder.success(res, suggestions, `${suppliers.length} fournisseurs(s) trouvé(s)`);
    } catch (err) {
        logger.error('Erreur lors de la recherche du fournisseurs', {
            error: err instanceof Error ? err.message : 'unknown error',
            query: req.query
        });
        return ApiResponder.error(res, err);
    }
}

export async function getSupplierByAnyField(
    req: Request<unknown, unknown, unknown, {
        name?: string;
        account_number?: string;
        phone?: string
    }>,
    res: Response
): Promise<Response> {
    try {
        const { name, account_number, phone } = req.query;

        if (!name && !account_number && !phone) {
            return ApiResponder.badRequest(res, 'Au moins un champ (name, account_number ou phone) est requis');
        }

        let supplierResult: SupplierRecord | null = null;

        if (account_number) {
            const suppliers = await supplier.findSupplier(decodeURIComponent(account_number), {
                findBy: 'account_number',
                limit: 1
            });
            if (suppliers.length > 0) supplierResult = suppliers[0];
        }

        if (!supplierResult && phone) {
            const suppliers = await supplier.findSupplier(decodeURIComponent(phone), {
                findBy: 'phone',
                limit: 1
            });
            if (suppliers.length > 0) supplierResult = suppliers[0];
        }

        if (!supplierResult && name) {
            const suppliers = await supplier.searchSuppliersByName(decodeURIComponent(name), 1);
            if (suppliers.length > 0) supplierResult = suppliers[0];
        }

        if (!supplierResult) {
            return ApiResponder.notFound(res, 'Fournisseur introuvable');
        }

        return ApiResponder.success(res, {
            id: supplierResult.id,
            name: supplierResult.name,
            account_number: supplierResult.account_number,
            phone: supplierResult.phone
        });
    } catch (err) {
        logger.error('Erreur lors de la recherche de fournisseur par champs', {
            error: err instanceof Error ? err.message : 'unknown error',
            query: req.query,
            stack: err instanceof Error ? err.stack : 'unknown stack of error'
        });

        return ApiResponder.error(res, err);
    }
}

export async function findSupplierConflicts(
    req: Request<unknown, unknown, unknown, {
        account_number?: string,
        phone?: string
    }>,
    res: Response
): Promise<Response> {
    const requestId = req.headers['x-request-id'] || 'unknown';

    try {
        const user = (req as AuthenticatedRequest).user;

        if (!user || !user.sup) {
            logger.warn(`[${requestId}] Tentative d'accès aux ressources par un utilisateur non authentifié`);
            return ApiResponder.unauthorized(res, 'Accès interdit');
        }

        logger.info(`[${requestId}] Début de la vérification du fournisseur`);

        const { account_number, phone } = req.query;

        if ((!account_number || account_number.trim() === '') && (!phone || phone.trim() === '')) {
            logger.warn(`[${requestId}] Paramètre manquant lors de l'appel à findSupplierConflicts`, {
                account_number: !!account_number,
                phone: !!phone
            });
            return ApiResponder.badRequest(res, 'Au moins un numéro de compte ou de téléphone est requis');
        }

        const supplierConflictsResult = await supplier.findSupplierConflicts(
            decodeURIComponent(account_number as string) || '',
            decodeURIComponent(phone as string) || ''
        );

        // Si on a deux types de conflits simultanément
        if (supplierConflictsResult.hasAccountConflict && supplierConflictsResult.hasPhoneConflict) {
            const accountSupplier = supplierConflictsResult.conflictingSuppliers.find(s => s.account_number === account_number);
            const phoneSupplier = supplierConflictsResult.conflictingSuppliers.find(s => s.phone === decodeURIComponent(phone as string));

            // Si c'est le même fournisseur, on utilise un message global
            if (accountSupplier && phoneSupplier && accountSupplier.id === phoneSupplier.id) {
                return ApiResponder.badRequest(res,
                    `Un fournisseur existe déjà avec ce numéro de compte et ce numéro de téléphone : "${accountSupplier.name}"`,
                    {
                        conflictType: 'both',
                        existingSupplier: accountSupplier,
                        conflictingSuppliers: supplierConflictsResult.conflictingSuppliers
                    }
                );
            } else {
                // Deux fournisseurs différents
                return ApiResponder.badRequest(res,
                    'Conflits détectés : le numéro de compte et le numéro de téléphone sont déjà utilisés par des fournisseurs différents',
                    {
                        conflictType: 'both',
                        accountConflict: accountSupplier,
                        phoneConflict: phoneSupplier,
                        conflictingSuppliers: supplierConflictsResult.conflictingSuppliers
                    }
                );
            }
        }

        // Un seul type de conflit
        if (supplierConflictsResult.hasAccountConflict || supplierConflictsResult.hasPhoneConflict) {
            let existingSupplier = null;
            let conflictType = '';
            let message = '';

            if (supplierConflictsResult.hasAccountConflict) {
                conflictType = 'account_number';
                existingSupplier = supplierConflictsResult.conflictingSuppliers.find(s => s.account_number === account_number);
                message = `Ce numéro de compte est déjà utilisé par le fournisseur "${existingSupplier?.name}"`;
            }

            if (supplierConflictsResult.hasPhoneConflict) {
                conflictType = 'phone';
                existingSupplier = supplierConflictsResult.conflictingSuppliers.find(s => s.phone === decodeURIComponent(phone as string));
                message = `Ce numéro de téléphone est déjà utilisé par le fournisseur "${existingSupplier?.name}"`;
            }

            return ApiResponder.badRequest(res, message, {
                conflictType: conflictType,
                existingSupplier: existingSupplier,
                conflictingSuppliers: supplierConflictsResult.conflictingSuppliers
            });
        }

        logger.info(`[${requestId}] Fournisseur vérifié et aucun conflit détecté`);
        return ApiResponder.success(res, null, 'Aucun conflit détecté');
    } catch (error) {
        logger.error(`[${requestId}] Une erreur est survenue lors de la vérification du fournisseur par findSupplierConflicts dans le contrôleur`, {
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : 'Unknown stack of error'
        });

        return ApiResponder.badRequest(res, "Une erreur interne est survenue lors de la vérification des conflits fournisseurs");
    }
}

export async function updateSupplier(
    req: Request<{ id: string }, unknown, { name: string; account_number: string; phone: string }>,
    res: Response
): Promise<Response> {
    const requestId = req.headers['x-request-id'] || 'unknown';
    const { id } = req.params;
    const { name, account_number, phone } = req.body;

    try {
        if (!name || name.trim() === '') {
            return ApiResponder.badRequest(res, 'Le nom du fournisseur est requis');
        }
        if (!account_number || account_number.trim() === '') {
            return ApiResponder.badRequest(res, 'Le numéro de compte est requis');
        }

        if (!isValidAccountNumber(normalizeAccountNumber(account_number))) {
            return ApiResponder.badRequest(res, 'Le format du numéro de compte est invalide (6-34 chiffres)');
        }

        // Vérifier si le fournisseur existe
        const existingResult = await supplier.findSupplier(Number(id));
        if (!existingResult || existingResult.length === 0) {
            return ApiResponder.notFound(res, 'Fournisseur introuvable');
        }

        const normalizedAccount = formatAccountCanonical(account_number);

        // Optionnel: Vérifier les conflits si le compte ou le téléphone a changé
        if (normalizedAccount !== existingResult[0].account_number || phone !== existingResult[0].phone) {
            const conflicts = await supplier.findSupplierConflicts(
                normalizedAccount !== existingResult[0].account_number ? normalizedAccount : '',
                phone !== existingResult[0].phone ? phone : ''
            );

            // On exclut le fournisseur actuel des conflits
            const realConflicts = conflicts.conflictingSuppliers.filter(s => s.id !== Number(id));

            if (realConflicts.length > 0) {
                const conflict = realConflicts[0];
                if (conflict.account_number === normalizedAccount) {
                    return ApiResponder.badRequest(res, `Le numéro de compte existe déjà pour le fournisseur "${conflict.name}"`);
                }
                if (conflict.phone === phone) {
                    return ApiResponder.badRequest(res, `Le numéro de téléphone existe déjà pour le fournisseur "${conflict.name}"`);
                }
            }
        }

        const updateData: UpdateSupplierData = {
            ...existingResult[0],
            name,
            account_number: normalizedAccount,
            phone: phone || ''
        };

        const result = await supplier.updateSupplier(updateData);
        if (result.success) {
            logger.info(`[${requestId}] Fournisseur ${id} mis à jour par le système`);
            return ApiResponder.success(res, null, 'Fournisseur mis à jour avec succès');
        } else {
            return ApiResponder.error(res, 'Échec de la mise à jour du fournisseur');
        }

    } catch (err) {
        logger.error(`[${requestId}] Erreur lors de la mise à jour du fournisseur ${id}`, {
            error: err instanceof Error ? err.message : 'Erreur inconnue'
        });
        return ApiResponder.error(res, err);
    }
}