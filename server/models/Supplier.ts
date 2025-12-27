import database from "../config/database";
import logger from "../utils/Logger";
import { auditLog } from "../utils/auditLogger";
import { normalizeAccountNumber, isValidAccountNumber, formatAccountCanonical } from "../../common/helpers/formatAccountNumber";
import { getSetting } from "../helpers/settings";
import { SupplierRecord, CreateSupplierInput, UpdateSupplierData, SupplierConflictResult, SupplierSearchParams } from "../types";
import { ResultSetHeader } from 'mysql2';


export interface SupplierModel {
    create(supplierData: CreateSupplierInput): Promise<{ success: boolean; data?: unknown; id?: number }>;
    findSupplier(id: number | string, config: SupplierSearchParams): Promise<SupplierRecord[]>;
    findExactSupplier(
        accountNumber: string,
        phone: string,
        name: string
    ): Promise<SupplierRecord[]>;
    findSupplierConflicts(accountNumber: string, phone: string): Promise<SupplierConflictResult>;
    deleteSupplier(id: number): Promise<{ success: boolean }>;
    updateSupplier(data: UpdateSupplierData): Promise<{ success: boolean }>;
    searchSuppliersByName(name: string, limit: number): Promise<SupplierRecord[]>;
    findSupplierByAnyField(filters: {
        name?: string;
        account_number?: string;
        phone?: string;
    }): Promise<SupplierRecord | null>
}

class Supplier implements SupplierModel {

    async create(supplierData: CreateSupplierInput): Promise<{ success: boolean; data?: unknown; id?: number }> {

        try {
            const { supplier_name, supplier_account_number, supplier_phone, created_by, created_by_role, created_by_email } = supplierData;

            // Validation du numéro de compte
            if (!isValidAccountNumber(normalizeAccountNumber(supplier_account_number))) {
                throw new Error('Le numéro de compte est invalide (6–34 caractères alphanumériques)');
            }

            const fiscalYear = await getSetting('fiscal_year');

            const query = "INSERT INTO supplier(name, account_number, phone, fiscal_year, created_by, created_by_role, created_by_email) VALUES (?,?,?,?,?,?,?)";
            const params = [supplier_name, formatAccountCanonical(supplier_account_number), supplier_phone, fiscalYear, created_by, created_by_role, created_by_email];

            const connection = await database.getConnection();
            const result = await connection.execute<ResultSetHeader>(query, params);

            // Récupérer l'ID auto-généré (selon l'implémentation de votre base de données)
            const generatedId = result[0].insertId

            if (!generatedId || generatedId === 0) {
                throw new Error('Aucun ID généré lors de la création du fournisseur');
            }

            await auditLog({
                table_name: 'supplier',
                action: 'INSERT',
                record_id: generatedId.toString(),
                performed_by: generatedId.toString(),
                description: `Création du fournisseur ${supplier_name} (${supplier_account_number})`
            });

            logger.debug(`Fournisseur ${generatedId} créé avec succès`, {
                supplierId: generatedId,
                supplierName: supplier_name,
                accountNumber: supplier_account_number
            });

            return {
                success: true,
                data: result,
                id: generatedId
            };

        } catch (error) {
            logger.error('Erreur lors de la création du fournisseur', {
                errorMessage: error instanceof Error ? error.message : 'Erreur inconnue',
                stack: error instanceof Error ? error.stack : 'unknown stack',
                supplierData: {
                    name: supplierData.supplier_name,
                    accountNumber: supplierData.supplier_account_number
                }
            });

            return {
                success: false,
                data: error
            };
        }
    }

    async findSupplier(id: number | string, config: {
        findBy: 'id' | 'account_number' | 'phone' | 'all';
        limit?: number;
        orderBy?: 'desc' | 'asc';
    } = { findBy: 'id', orderBy: 'asc' }): Promise<SupplierRecord[]> {
        try {
            let query = "";
            let params: unknown[] = [];
            const validOrderBy = config.orderBy === 'asc' ? 'asc' : 'desc';

            switch (config.findBy) {
                case 'id':
                    // Conversion en number pour l'ID
                    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
                    if (isNaN(numericId)) {
                        return [];
                    }
                    query = `SELECT * FROM supplier WHERE id = ? ORDER BY create_at ${validOrderBy}`;
                    params = [numericId];
                    if (config.limit) query += ` LIMIT ${config.limit}`;
                    break;

                case 'account_number':
                    query = `SELECT * FROM supplier WHERE account_number = ? ORDER BY create_at ${validOrderBy}`;
                    params = [id];
                    if (config.limit) query += ` LIMIT ${config.limit}`;
                    break;

                case 'phone':
                    query = `SELECT * FROM supplier WHERE phone = ? ORDER BY create_at ${validOrderBy}`;
                    params = [id];
                    if (config.limit) query += ` LIMIT ${config.limit}`;
                    break;

                case 'all':
                    query = `SELECT * FROM supplier ORDER BY create_at ${validOrderBy}`;
                    if (config.limit) query += ` LIMIT ${config.limit}`;
                    break;

                default:
                    throw new Error('Type de recherche non supporté');
            }

            const rows = await database.execute<SupplierRecord[] | SupplierRecord>(query, params);

            // Normaliser le résultat en tableau
            const result = Array.isArray(rows) ? rows : (rows ? [rows] : []);


            if (result.length > 0) {
                await auditLog({
                    table_name: 'supplier',
                    action: 'SELECT',
                    record_id: config.findBy === 'all' ? 'all' : id.toString(),
                    performed_by: null,
                    description: `Recherche de fournisseur par ${config.findBy}`
                });
            }

            return result;

        } catch (error) {
            logger.error(`Erreur lors de la recherche du fournisseur`, {
                errorMessage: error instanceof Error ? error.message : 'unknown error',
                stack: error instanceof Error ? error.stack : 'unknown stack',
                findType: config.findBy,
                id: id
            });
            throw error;
        }
    }

    async findExactSupplier(
        accountNumber: string,
        phone: string,
        name: string
    ): Promise<SupplierRecord[]> {

        try {
            const query = `
                SELECT * FROM supplier
                WHERE account_number = ?
                AND phone = ?
                AND name = ?
                LIMIT 1
            `;
            const params = [accountNumber, phone, name];
            const rows = await database.execute<SupplierRecord[] | SupplierRecord>(query, params);

            return Array.isArray(rows) ? rows : (rows ? [rows] : []);
        } catch (error) {
            logger.error(`Erreur lors de la recherche exacte fournisseur`, {
                errorMessage: error instanceof Error ? error.message : 'unknowns error',
                accountNumber,
                name
            });
            throw error;
        }
    }

    async findSupplierConflicts(accountNumber: string, phone: string): Promise<{
        hasAccountConflict: boolean;
        hasPhoneConflict: boolean;
        conflictingSuppliers: SupplierRecord[];
    }> {
        try {
            // Construire la query dynamiquement selon les paramètres fournis
            let query = 'SELECT * FROM supplier WHERE ';
            const params = [];
            const conditions = [];

            // Ajouter seulement les conditions pour les paramètres non vides
            if (accountNumber && accountNumber !== '') {
                conditions.push('account_number = ?');
                params.push(accountNumber);
            }

            if (phone && phone !== '') {
                conditions.push('phone = ?');
                params.push(phone);
            }

            // Si aucun paramètre fourni, retourner aucun conflit
            if (conditions.length === 0) {
                return {
                    hasAccountConflict: false,
                    hasPhoneConflict: false,
                    conflictingSuppliers: []
                };
            }

            // Joindre les conditions avec OR
            query += conditions.join(' OR ');

            const rows = await database.execute<SupplierRecord[] | SupplierRecord>(query, params);
            const suppliers = Array.isArray(rows) ? rows : (rows ? [rows] : []);

            // Vérifier les conflits seulement pour les paramètres fournis
            const hasAccountConflict = accountNumber && accountNumber !== ''
                ? suppliers.some(s => s.account_number === accountNumber)
                : false;

            const hasPhoneConflict = phone && phone !== ''
                ? suppliers.some(s => s.phone === phone)
                : false;

            return {
                hasAccountConflict,
                hasPhoneConflict,
                conflictingSuppliers: suppliers
            };

        } catch (error) {
            logger.error('Erreur lors de la recherche de conflits fournisseur', {
                errorMessage: error instanceof Error ? error.message : 'unknown error',
                accountNumber,
                phone
            });
            throw error;
        }
    }
    async deleteSupplier(id: number): Promise<{ success: boolean }> {
        try {
            // Vérifier d'abord si le fournisseur existe
            const existingSupplier = await this.findSupplier(id, {
                findBy: 'id',
                limit: 1,
                orderBy: 'desc'
            });

            if (!existingSupplier || existingSupplier.length === 0) {
                logger.warn(`Tentative de suppression d'un fournisseur inexistant: ${id}`);
                return { success: false };
            }

            const query = "DELETE FROM supplier WHERE id = ?";
            await database.execute(query, [id]);

            await auditLog({
                table_name: 'supplier',
                action: 'DELETE',
                record_id: id.toString(),
                performed_by: 'system',
                description: `Suppression du fournisseur ${id}`
            });

            logger.debug(`Fournisseur ${id} supprimé avec succès`);
            return { success: true };

        } catch (error) {
            logger.error(`Erreur lors de la suppression du fournisseur ${id}`, {
                errorMessage: error instanceof Error ? error.message : 'unknown error',
                stack: error instanceof Error ? error.stack : 'unknown stack'
            });
            return { success: false };
        }
    }

    async updateSupplier(data: UpdateSupplierData): Promise<{ success: boolean }> {
        try {
            // Validation du numéro de compte
            if (!isValidAccountNumber(String(data.account_number))) {
                throw new Error('Le numéro de compte est invalide (6–34 caractères alphanumériques)');
            }

            // Validation du nom
            if (!data.name || data.name.trim().length === 0) {
                throw new Error('Le nom du fournisseur est obligatoire');
            }

            const params = [
                data.name,
                normalizeAccountNumber(String(data.account_number)),
                data.phone,
                data.id
            ];

            const query = `
                UPDATE supplier 
                SET name = ?, account_number = ?, phone = ?, update_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            await database.execute(query, params);

            await auditLog({
                table_name: 'supplier',
                action: 'UPDATE',
                record_id: data.id.toString(),
                performed_by: 'system',
                description: `Mise à jour du fournisseur ${data.name} (${data.account_number})`
            });

            logger.debug(`Fournisseur ${data.id} mis à jour avec succès`, {
                supplierId: data.id,
                supplierName: data.name,
                accountNumber: data.account_number
            });

            return { success: true };

        } catch (error) {
            logger.error(`Erreur lors de la mise à jour du fournisseur ${data.id}`, {
                errorMessage: error instanceof Error ? error.message : 'unknown error',
                stack: error instanceof Error ? error.stack : 'unknown stack',
                supplierData: {
                    id: data.id,
                    name: data.name,
                    accountNumber: data.account_number
                }
            });
            return { success: false };
        }
    }

    // Méthode utilitaire pour la recherche par téléphone
    async findSupplierByPhone(phone: string): Promise<SupplierRecord[]> {
        return this.findSupplier(phone, { findBy: 'phone', limit: 1 });
    }

    // Méthode utilitaire pour obtenir tous les fournisseurs
    async getAllSupplier(limit?: number, orderBy: 'desc' | 'asc' = 'asc'): Promise<SupplierRecord[]> {
        return this.findSupplier('', { findBy: 'all', limit, orderBy });
    }

    async searchSuppliersByName(name: string, limit: number = 5): Promise<SupplierRecord[]> {
        try {
            const safeName = (name || '').toString().trim();
            const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 50) : 5;

            const query = `
                SELECT * FROM supplier
                WHERE name LIKE ?
                ORDER BY
                    CASE
                        WHEN name = ? THEN 1
                        WHEN name LIKE ? THEN 2
                        ELSE 3
                    END,
                    name ASC
                LIMIT ${safeLimit}
            `;
            const params = [
                `%${safeName}%`,
                safeName,
                `%${safeName}%`
            ];

            const rows = await database.execute<SupplierRecord[] | SupplierRecord>(query, params);
            return Array.isArray(rows) ? rows : (rows ? [rows] : []);
        } catch (error) {
            logger.error('Erreur lors de la recherche de fournisseurs par nom', {
                errorMessage: error instanceof Error ? error.message : 'unknown error',
                name,
                limit
            });
            throw error;
        }
    }

    async findSupplierByAnyField(filters: {
        name?: string;
        account_number?: string;
        phone?: string;
    }): Promise<SupplierRecord | null> {
        try {
            const conditions: string[] = [];
            const params: unknown[] = [];

            if (filters.name) {
                conditions.push('name = ?');
                params.push(filters.name);
            }
            if (filters.account_number) {
                conditions.push('account_number = ?');
                params.push(filters.account_number);
            }
            if (filters.phone) {
                conditions.push('phone = ?');
                params.push(filters.phone);
            }
            if (conditions.length === 0) {
                return null;
            }

            const query = `SELECT * FROM supplier WHERE ${conditions.join(' OR ')} LIMIT 1`;
            const rows = await database.execute<SupplierRecord[] | SupplierRecord>(query, params);

            const result = Array.isArray(rows) ? rows : (rows ? [rows] : []);
            return result.length > 0 ? result[0] : null;
        } catch (error) {
            logger.error('Erreur lors de la recherche de fournisseur par champs multiples', {
                errorMessage: error instanceof Error ? error.message : 'unknown error',
                filters,
                stack: error instanceof Error ? error.stack : 'unknown stack'
            });
            throw error;
        }
    }
}

// Export en tant qu'instance singleton
const supplier = new Supplier();
export default supplier;