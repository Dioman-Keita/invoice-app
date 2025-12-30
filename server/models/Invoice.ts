import database from "../config/database";
import logger from "../utils/Logger";
import idGenerator from '../core/generators/IdGenerator';
import { InvoiceRecord, CreateInvoiceDto, UpdateInvoiceDto, InvoiceSearchParams } from "../types";
import { formatDate } from "../utils/Formatters";
import { auditLog } from "../utils/auditLogger";
import { getSetting } from "../helpers/settings";

export interface InvoiceModel {
	create(invoiceData: CreateInvoiceDto): Promise<{ success: boolean, data?: unknown }>;
	findInvoice(id: string | number, config: InvoiceSearchParams): Promise<InvoiceRecord[]>;
	deleteInvoice(id: number): Promise<{ success: boolean }>;
	updateInvoice(data: UpdateInvoiceDto): Promise<{ success: boolean }>;
	getLastInvoiceNum(): Promise<unknown>;
	getInvoiceAttachments(invoiceId: string): Promise<{ success: boolean; documents: string[] }>;
	updateInvoiceAttachments(invoiceId: string, documents: string[], performedBy: string): Promise<{ success: boolean }>;
	deleteInvoiceAttachments(invoiceId: string, performedBy: string): Promise<{ success: boolean }>;
}

class Invoice implements InvoiceModel {

	async create(invoiceData: CreateInvoiceDto): Promise<{ success: boolean; data?: unknown; }> {
		try {

			const id = await idGenerator.generateId('invoice');
			const fiscalYear = await getSetting('fiscal_year');
			const params = [
				id,
				invoiceData.num_cmdt,
				invoiceData.invoice_num,
				fiscalYear,
				invoiceData.invoice_object,
				invoiceData.supplier_id,
				invoiceData.invoice_nature,
				formatDate(invoiceData.invoice_arrival_date),
				formatDate(invoiceData.invoice_date),
				invoiceData.invoice_type,
				invoiceData.folio,
				String(invoiceData.invoice_amount).replace(/\s/g, '').replace(/\.(?=\d{3}(?:,|$))/g, '').replace(',', '.'),
				invoiceData.status,
				invoiceData.created_by,
				invoiceData.created_by_email,
				invoiceData.created_by_role
			]

			// Insertion incluant fiscal_year
			const query = "INSERT INTO invoice(id, num_cmdt, num_invoice, fiscal_year, invoice_object, supplier_id, invoice_nature, invoice_arr_date, invoice_date, invoice_type, folio, amount, status, created_by, created_by_email, created_by_role) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
			const result = await database.execute(query, params);

			if (Array.isArray(invoiceData.documents) && invoiceData.documents.length > 0) {
				await database.execute(
					"INSERT INTO attachments(documents, invoice_id) VALUES (?,?)",
					[JSON.stringify(invoiceData.documents), id]
				);
				await auditLog({
					table_name: 'attachments',
					action: 'INSERT',
					performed_by: invoiceData.created_by || null,
					record_id: id,
					description: `Ajout des documents à la facture nouvellement créée ${id}`
				});
			}

			await auditLog({
				table_name: 'invoice',
				action: 'INSERT',
				record_id: invoiceData.created_by,
				performed_by: invoiceData.created_by,
				description: `Création d'une facture par l'utilisateur ${invoiceData.created_by} role : [${invoiceData.created_by_role}]`
			})

			logger.debug("Création de la facture " + id + " avec succès", {
				userId: invoiceData.created_by,
				email: invoiceData.created_by_email,
				role: invoiceData.created_by_role
			});

			return {
				success: true,
				data: result
			}
		} catch (error) {
			logger.error(`Une erreur est survenue lors de la création de la facture`, {
				errorMessage: error instanceof Error ? error.message : 'unknown error',
				stack: error instanceof Error ? error.stack : 'unknown stack'
			})
			return {
				success: false,
				data: error instanceof Error ? error.message : 'unknown error'
			}
		}
	}

	async updateDfcStatusIfCurrentFiscalYear(id: string, newStatus: 'approved' | 'rejected', performedBy: string): Promise<{ success: boolean; message?: string }> {
		try {
			const fiscalYear = await getSetting('fiscal_year');
			// Ensure form exists, matches fiscal year, and is pending
			const checkQuery = `SELECT id, fiscal_year, dfc_status FROM invoice WHERE id = ?`;
			const rows = await database.execute(checkQuery, [id]);
			const invoice = Array.isArray(rows) ? rows[0] : rows;
			if (!invoice) return { success: false, message: 'Facture introuvable' };
			if (invoice.fiscal_year !== fiscalYear) return { success: false, message: "Facture hors de l'année fiscale courante" };
			if (invoice.dfc_status !== 'pending') return { success: false, message: 'Facture déjà traitée DFC' };

			await database.execute(`UPDATE invoice SET dfc_status = ?, update_at = CURRENT_TIMESTAMP WHERE id = ?`, [newStatus, id]);

			await auditLog({
				table_name: 'invoice',
				action: 'UPDATE',
				record_id: id,
				performed_by: performedBy,
				description: `Mise à jour du statut DFC à ${newStatus} pour la facture ${id}`
			});

			return {
				success: true
			}
		} catch (error) {
			logger.error(`Erreur lors de la mise à jour du statut DFC pour la facture ${id}`, {
				errorMessage: error instanceof Error ? error.message : 'unknown error',
				stack: error instanceof Error ? error.stack : 'unknown stack'
			});
			return { success: false, message: 'Erreur interne' }
		}
	}

	async findDfcPendingCurrentFiscalYear(limit?: number): Promise<InvoiceRecord[]> {
		try {
			const fiscalYear = await getSetting('fiscal_year');
			let query = `
				SELECT i.*, s.name AS supplier_name, s.account_number AS supplier_account_number, s.phone AS supplier_phone
				FROM invoice i
				LEFT JOIN supplier s ON i.supplier_id = s.id
				WHERE i.fiscal_year = ? AND i.dfc_status = 'pending'
				ORDER BY i.create_at DESC
			`;
			if (limit && Number.isFinite(limit)) {
				query += ` LIMIT ${limit}`;
			}
			let rows = await database.execute<InvoiceRecord[] | InvoiceRecord>(query, [fiscalYear]);
			if (rows && !Array.isArray(rows)) {
				rows = [rows];
			}
			await auditLog({
				table_name: 'invoice',
				action: 'SELECT',
				performed_by: null,
				description: `Récupération des factures DFC en attente pour l'année fiscale ${fiscalYear}`
			});
			return rows || [];
		} catch (error) {
			logger.error('Erreur lors de la récupération des factures DFC en attente', {
				errorMessage: error instanceof Error ? error.message : 'unknown error'
			});
			return [];
		}
	}
	async findInvoice(id: string | number, config: InvoiceSearchParams = { findBy: 'id', limit: null, orderBy: 'asc' }): Promise<InvoiceRecord[]> {

		try {
			let query = "";
			let params = [];
			let rows;
			const validOrderBy = config.orderBy === 'asc' ? 'asc' : 'desc';
			const fy = config.fiscalYear;

			switch (config.findBy) {
				case 'id':
					query = `SELECT i.*, 
                    COALESCE(JSON_EXTRACT(a.documents, '$'), JSON_ARRAY()) AS documents
                    FROM invoice i 
                    LEFT JOIN attachments a ON a.invoice_id = i.id 
                    WHERE i.id = ? ${fy ? 'AND i.fiscal_year = ?' : ''} 
                    ORDER BY i.create_at ${validOrderBy}`;
					params = fy ? [id, fy] : [id];
					if (config.limit) query += ` LIMIT ${config.limit}`;
					rows = await database.execute<InvoiceRecord[] | InvoiceRecord>(query, params);
					break;

				case 'supplier_id':
					query = `SELECT i.*, 
                    COALESCE(JSON_EXTRACT(a.documents, '$'), JSON_ARRAY()) AS documents
                    FROM invoice i 
                    LEFT JOIN attachments a ON a.invoice_id = i.id 
                    WHERE i.supplier_id = ? ${fy ? 'AND i.fiscal_year = ?' : ''} 
                    ORDER BY i.create_at ${validOrderBy}`;
					params = fy ? [id, fy] : [id];
					if (config.limit) query += ` LIMIT ${config.limit}`;
					rows = await database.execute<InvoiceRecord[] | InvoiceRecord>(query, params);
					break;

				case 'phone':
				case 'account_number':
					query = `
                    SELECT i.*, 
                        COALESCE(JSON_EXTRACT(a.documents, '$'), JSON_ARRAY()) AS documents
                    FROM invoice i 
                    LEFT JOIN attachments a ON a.invoice_id = i.id
                    INNER JOIN supplier s ON i.supplier_id = s.id 
                    WHERE ${config.findBy === 'phone' ? 's.phone' : 's.account_number'} = ? ${fy ? 'AND i.fiscal_year = ?' : ''}
                    ORDER BY i.create_at ${validOrderBy}
                `;
					params = fy ? [id, fy] : [id];
					if (config.limit) query += ` LIMIT ${config.limit}`;
					rows = await database.execute<InvoiceRecord[] | InvoiceRecord>(query, params);
					break;

				case 'all':
					query = `SELECT i.*, 
                    COALESCE(JSON_EXTRACT(a.documents, '$'), JSON_ARRAY()) AS documents
                    FROM invoice i 
                    LEFT JOIN attachments a ON a.invoice_id = i.id 
                    ${fy ? 'WHERE i.fiscal_year = ?' : ''} 
                    ORDER BY i.create_at ${config.orderBy}`;
					if (config.limit) query += ` LIMIT ${config.limit}`;
					rows = fy ? await database.execute<InvoiceRecord[] | InvoiceRecord>(query, [fy]) : await database.execute<InvoiceRecord[] | InvoiceRecord>(query);
					break;

				default:
					throw new Error('Type de recherche non supporté');
			}

			// Normaliser le résultat en tableau
			if (rows && !Array.isArray(rows)) {
				rows = [rows];
			}

			// Parser les documents JSON
			if (rows && rows.length > 0) {
				rows = rows.map((row: InvoiceRecord & { documents?: string | string[] }) => {
					const invoiceRow = row as InvoiceRecord;
					if (row.documents) {
						try {
							invoiceRow.documents = typeof row.documents === 'string'
								? JSON.parse(row.documents)
								: (Array.isArray(row.documents) ? row.documents : []);
						} catch {
							invoiceRow.documents = [];
						}
					} else {
						invoiceRow.documents = [];
					}
					return invoiceRow;
				});
			}

			if (rows && rows.length > 0) {
				await auditLog({
					table_name: 'invoice',
					action: 'SELECT',
					record_id: typeof id === 'string' ? id : id.toString(),
					performed_by: null, // À remplacer par l'ID utilisateur réel si disponible
					description: `Recherche de facture par ${config.findBy}`
				});
			}

			return rows || [];

		} catch (error) {
			logger.error(`Une erreur est survenue lors de la recherche de la facture`, {
				errorMessage: error instanceof Error ? error.message : 'unknown error',
				stack: error instanceof Error ? error.stack : 'unknown stack',
				findType: config.findBy,
				id: id
			});
			throw error; // Propager l'erreur pour que l'appelant puisse la gérer
		}
	}

	async deleteInvoice(id: number): Promise<{ success: boolean }> {
		try {
			// Vérifier d'abord si la facture existe
			const existingInvoice = await this.findInvoice(id, { findBy: 'id', limit: 1, orderBy: 'desc' });

			if (!existingInvoice || existingInvoice.length === 0) {
				logger.warn(`Tentative de suppression d'une facture inexistante: ${id}`);
				return { success: false };
			}

			// Utiliser 'invoice' au lieu de 'form'
			const query = "DELETE FROM invoice WHERE id = ?";
			await database.execute(query, [id]);

			await auditLog({
				table_name: 'invoice',
				action: 'DELETE',
				record_id: id.toString(),
				performed_by: 'system', // À remplacer par l'ID utilisateur réel
				description: `Suppression de la facture ${id}`
			});

			logger.debug(`Facture ${id} supprimée avec succès`);
			return { success: true };

		} catch (error) {
			logger.error(`Erreur lors de la suppression de la facture ${id}`, {
				errorMessage: error instanceof Error ? error.message : 'unknown error',
				stack: error instanceof Error ? error.stack : 'unknown stack'
			});
			return { success: false };
		}
	}

	async updateInvoice(data: UpdateInvoiceDto): Promise<{ success: boolean }> {
		try {
			const params = [
				data.invoice_num,
				data.invoice_object,
				data.supplier_id,
				data.invoice_nature,
				formatDate(data.invoice_arrival_date),
				formatDate(data.invoice_date),
				data.invoice_type,
				data.folio,
				String(data.invoice_amount).replace(/\s/g, '').replace(/\.(?=\d{3}(?:,|$))/g, '').replace(',', '.'),
				data.status,
				data.created_by || 'system',
				data.created_by_email,
				data.created_by_role,
				data.id
			];

			const query = `
				UPDATE invoice 
				SET num_invoice = ?, invoice_object = ?, supplier_id = ?, 
					invoice_nature = ?, invoice_arr_date = ?, invoice_date = ?, invoice_type = ?, 
					folio = ?, amount = ?, status = ?, created_by = ?, created_by_email = ?, created_by_role = ?
				WHERE id = ?
			`;

			await database.execute(query, params);

			// Mise à jour des pièces jointes
			if (data.documents) {
				// On supprime les anciens documents pour cette facture
				await database.execute("DELETE FROM attachments WHERE invoice_id = ?", [data.id]);

				// On insère les nouveaux documents s'il y en a
				if (Array.isArray(data.documents) && data.documents.length > 0) {
					await database.execute(
						"INSERT INTO attachments(documents, invoice_id) VALUES (?,?)",
						[JSON.stringify(data.documents), data.id]
					);
				}
			}

			await auditLog({
				table_name: 'invoice',
				action: 'UPDATE',
				record_id: data.id,
				performed_by: data.created_by || null,
				description: `Mise à jour de la facture ${data.id} par l'utilisateur ${data.created_by || 'Utilisateur'}`
			});

			logger.debug(`Facture ${data.id} mise à jour avec succès`, {
				userId: data.created_by,
				email: data.created_by_email
			});

			return { success: true };

		} catch (error) {
			logger.error(`Erreur lors de la mise à jour de la facture ${data.id}`, {
				errorMessage: error instanceof Error ? error.message : 'unknown error',
				stack: error instanceof Error ? error.stack : 'unknown stack'
			});
			return { success: false };
		}
	}

	async getLastInvoiceNum(): Promise<{ success: boolean, invoiceNum: string | null }> {
		try {
			const fiscalYear = await getSetting('fiscal_year');
			// Utiliser 'invoice' au lieu de 'form'
			const result = await database.execute(
				"SELECT num_cmdt FROM invoice WHERE fiscal_year = ? ORDER BY create_at DESC LIMIT 1",
				[fiscalYear]
			);

			// Correction du traitement du résultat
			let invoiceNum = null;

			if (result && Array.isArray(result) && result.length > 0) {
				invoiceNum = result[0].num_cmdt;
			}

			await auditLog({
				table_name: 'invoice',
				action: 'SELECT',
				performed_by: null,
				description: 'Récupération du dernier numéro de facture'
			});

			return {
				success: true,
				invoiceNum: invoiceNum
			};

		} catch (error) {
			logger.error('Une erreur est survenue lors de la récupération du dernier numéro de facture', {
				err: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : 'Unknown stack'
			});
			return {
				success: false,
				invoiceNum: null
			}
		}
	}

	async getTheLatestInvoiceNumber(): Promise<{ success: boolean; lastInvoiceNumber: string }> {
		try {
			const fiscalYear = await getSetting('fiscal_year');
			// Utiliser 'invoice' au lieu de 'form'
			const result = await database.execute(
				"SELECT num_cmdt FROM invoice WHERE fiscal_year = ? ORDER BY create_at DESC LIMIT 1",
				[fiscalYear]
			);

			// Correction du traitement du résultat
			let invoiceNum = null;

			if (result && Array.isArray(result) && result.length > 0) {
				invoiceNum = result[0].num_cmdt;
			}

			await auditLog({
				table_name: 'invoice',
				action: 'SELECT',
				performed_by: null,
				description: 'Récupération du dernier numéro de facture'
			});

			return {
				success: true,
				lastInvoiceNumber: invoiceNum
			};

		} catch (error) {
			logger.error('Une erreur est survenue lors de la récupération du dernier numéro de facture', {
				err: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : 'Unknown stack'
			});
			return {
				success: false,
				lastInvoiceNumber: '0000'
			}
		}
	}

	// ✅ NOUVEAU : Méthode pour récupérer les attachments d'une facture
	async getInvoiceAttachments(invoiceId: string): Promise<{ success: boolean; documents: string[] }> {
		try {
			const result = await database.execute<Array<{ documents: string }>>(
				"SELECT documents FROM attachments WHERE invoice_id = ?",
				[invoiceId]
			);

			if (result && Array.isArray(result) && result.length > 0) {
				const documents = typeof result[0].documents === 'string'
					? JSON.parse(result[0].documents)
					: result[0].documents;
				return {
					success: true,
					documents: Array.isArray(documents) ? documents : []
				};
			}

			return {
				success: true,
				documents: []
			};
		} catch (error) {
			logger.error(`Erreur lors de la récupération des attachments pour la facture ${invoiceId}`, {
				errorMessage: error instanceof Error ? error.message : 'unknown error',
				stack: error instanceof Error ? error.stack : 'unknown stack'
			});
			return {
				success: false,
				documents: []
			};
		}
	}

	// ✅ NOUVEAU : Méthode pour mettre à jour les attachments
	async updateInvoiceAttachments(invoiceId: string, documents: string[], performedBy: string): Promise<{ success: boolean }> {
		try {
			// Vérifier si la facture existe
			const invoice = await this.findInvoice(invoiceId, { findBy: 'id', limit: 1 });
			if (!invoice || invoice.length === 0) {
				return { success: false };
			}

			// Vérifier si des attachments existent déjà
			const existing = await database.execute(
				"SELECT id FROM attachments WHERE invoice_id = ?",
				[invoiceId]
			);

			if (existing && Array.isArray(existing) && existing.length > 0) {
				// Mettre à jour
				await database.execute(
					"UPDATE attachments SET documents = ? WHERE invoice_id = ?",
					[JSON.stringify(documents), invoiceId]
				);
			} else {
				// Créer
				await database.execute(
					"INSERT INTO attachments(documents, invoice_id) VALUES (?,?)",
					[JSON.stringify(documents), invoiceId]
				);
			}

			await auditLog({
				table_name: 'attachments',
				action: 'UPDATE',
				performed_by: performedBy,
				record_id: invoiceId,
				description: `Mise à jour des attachments pour la facture ${invoiceId}`
			});

			return { success: true };
		} catch (error) {
			logger.error(`Erreur lors de la mise à jour des attachments pour la facture ${invoiceId}`, {
				errorMessage: error instanceof Error ? error.message : 'unknown error',
				stack: error instanceof Error ? error.stack : 'unknown stack'
			});
			return { success: false };
		}
	}

	// ✅ NOUVEAU : Méthode pour supprimer les attachments
	async deleteInvoiceAttachments(invoiceId: string, performedBy: string): Promise<{ success: boolean }> {
		try {
			await database.execute(
				"DELETE FROM attachments WHERE invoice_id = ?",
				[invoiceId]
			);

			await auditLog({
				table_name: 'attachments',
				action: 'DELETE',
				performed_by: performedBy,
				record_id: invoiceId,
				description: `Suppression des attachments pour la facture ${invoiceId}`
			});

			return { success: true };
		} catch (error) {
			logger.error(`Erreur lors de la suppression des attachments pour la facture ${invoiceId}`, {
				errorMessage: error instanceof Error ? error.message : 'unknown error',
				stack: error instanceof Error ? error.stack : 'unknown stack'
			});
			return { success: false };
		}
	}
}
export default new Invoice();