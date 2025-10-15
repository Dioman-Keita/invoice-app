import database from "../config/database";
import logger from "../utils/Logger";
import generateId from "../services/generateId";
import { formatDate } from "../utils/Formatters";
import { auditLog } from "../utils/auditLogger";
import { getSetting } from "../utils/InvoiceLastNumberValidator";

type FolioType = '1 copie' | 'Orig + 1 copie' | 'Orig + 2 copies' | 'Orig + 3 copies';
type InvoiceType =  'Ordinaire' | 'Transporteur' | 'Transitaire';

export type InvoiceRecordType = {
	id: string;
    num_cmdt: string;
    num_invoice: string;
    invoice_object: string;
    supplier_id: string;
    invoice_type: InvoiceType;
    invoice_nature: 'Paiement' | 'Acompte' | 'Avoir';
    invoice_arr_date: string;
    invoice_date: string;
    folio: FolioType;
    amount: string;
    create_at: string;
    update_at: string;
    status: 'Oui'| 'Non';
    created_by: string;
    created_by_email: string;
    created_by_role: 'dfc_agent' | 'invoice_manager' | 'admin';
    fiscal_year: string;
}

export type InvoiceInputBody = {
	num_cmdt: string;
	invoice_num: string;
	invoice_object: string;
	invoice_nature: string;
	invoice_arrival_date: string;
	invoice_date: string;
	invoice_type: InvoiceType;
	invoice_status: 'Oui' | 'Non'
	folio: FolioType;
	invoice_amount: string;
	supplier_name: string;
	supplier_account_number: string;
	supplier_phone: string;
	documents: string[];
	status: 'Oui' | 'Non';
	created_by: string | null;
    created_by_email?: string;
    created_by_role?: 'dfc_agent' | 'invoice_manager' | 'admin';
}

export type CreateInvoiceInput = Omit<InvoiceInputBody, "supplier_name" | "supplier_account_number" | "supplier_phone"> & { supplier_id: number }

export type UpdateInvoiceData =  Omit<InvoiceRecordType, 'create_at' | 'update_at'>

export interface InvoiceModel {
	create(invoiceData: CreateInvoiceInput): Promise<{success: Boolean, data?: unknown}>;
	findInvoice(id: string | number, config: { 
		findBy: 'id' | 'phone' | 'account_number' | 'supplier_id' | 'all', 
		limit: number | null, orderBy: 'desc' | 'asc', fiscalYear?: string 
	}): Promise<InvoiceRecordType[]>;
	deleteInvoice(id: number): Promise<{success: boolean}>;
	updateInvoice(data: UpdateInvoiceData): Promise<{success: Boolean}>;
	getLastInvoiceNum(): Promise<unknown>;
}

class Invoice implements InvoiceModel {

	async create(invoiceData: CreateInvoiceInput): Promise<{ success: Boolean; data?: unknown; }> {
		try {
			
			const id = await generateId('invoice');
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
				invoiceData.invoice_amount,
				invoiceData.status,
				invoiceData.created_by,
				invoiceData.created_by_email,
				invoiceData.created_by_role
			]
	
			// Insertion incluant fiscal_year
			const query = "INSERT INTO invoice(id, num_cmdt, num_invoice, fiscal_year, invoice_object, supplier_id, invoice_nature, invoice_arr_date, invoice_date, invoice_type, folio, amount, status, created_by, created_by_email, created_by_role) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
			const result = await database.execute(query, params);

			if(Array.isArray(invoiceData.documents) && invoiceData.documents.length > 0) {
				await database.execute(
					"INSERT INTO attachments(documents, invoice_id) VALUES (?,?)",
					[JSON.stringify(invoiceData.documents), id]
				);
				await auditLog({
					table_name: 'attachments',
					action: 'INSERT',
					performed_by: invoiceData.created_by,
					record_id: invoiceData.created_by,
					description: `Ajout des decoument a la facture nouvellement creee ${id}`
				});
			}
			
			await auditLog({
				table_name: 'invoice', // Correction : table invoice au lieu de employee
				action: 'INSERT',
				record_id: invoiceData.created_by,
				performed_by: invoiceData.created_by,
				description: `Création d'une facture par l'utilisateur ${invoiceData.created_by} role : [${invoiceData.created_by_role}]`
			})
			
			logger.debug("Création de la facture " + id + " avec succès", {
				userId: invoiceData.created_by,
				email: invoiceData.created_by_email,
				role: invoiceData.created_by_role
			})

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

	async findInvoice(id: string | number, config: { 
			findBy: "id" | "phone" | "account_number" | "supplier_id" | "all"; 
			limit: number | null; 
			orderBy: "desc" | "asc";
			fiscalYear?: string;
		} = { findBy: 'id', limit: null, orderBy: 'asc'}): Promise<InvoiceRecordType[]> {
		
		try {
			let query = "";
			let params: any[] = [];
			let rows: any;
			const validOrderBy = config.orderBy === 'asc' ? 'asc' : 'desc';
			const fy = config.fiscalYear;

            switch (config.findBy) {
                case 'id':
                    query = `SELECT * FROM invoice WHERE id = ? ${fy ? 'AND fiscal_year = ?' : ''} ORDER BY create_at ${validOrderBy}`;
                    params = fy ? [id, fy] : [id];
                    if (config.limit) query += ` LIMIT ${config.limit}`;
                    rows = await database.execute(query, params);
                    break;

                case 'supplier_id':
                    query = `SELECT * FROM invoice WHERE supplier_id = ? ${fy ? 'AND fiscal_year = ?' : ''} ORDER BY create_at ${validOrderBy}`;
                    params = fy ? [id, fy] : [id];
                    if (config.limit) query += ` LIMIT ${config.limit}`;
                    rows = await database.execute(query, params);
                    break;

                case 'phone':
                case 'account_number':
                    // Ces critères nécessitent une jointure avec la table supplier
                    query = `
                        SELECT i.* FROM invoice i 
                        INNER JOIN supplier s ON i.supplier_id = s.id 
                        WHERE ${config.findBy === 'phone' ? 's.phone' : 's.account_number'} = ? ${fy ? 'AND i.fiscal_year = ?' : ''}
                        ORDER BY i.create_at ${validOrderBy}
                    `;
                    params = fy ? [id, fy] : [id];
                    if (config.limit) query += ` LIMIT ${config.limit}`;
                    rows = await database.execute(query, params);
                    break;

                case 'all':
                    query = `SELECT * FROM invoice ${fy ? 'WHERE fiscal_year = ?' : ''} ORDER BY create_at ${config.orderBy}`;
                    if (config.limit) query += ` LIMIT ${config.limit}`;
                    rows = fy ? await database.execute(query, [fy]) : await database.execute(query);
                    break;

				default:
					throw new Error('Type de recherche non supporté');
			}

			// Normaliser le résultat en tableau
			if (rows && !Array.isArray(rows)) {
				rows = [rows];
			}

			if (rows && rows.length > 0) {
				await auditLog({
					table_name: 'invoice',
					action: 'SELECT',
					record_id: typeof id === 'string' ? id : id.toString(),
					performed_by: 'system', // À remplacer par l'ID utilisateur réel si disponible
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

	async deleteInvoice(id: number): Promise<{success: boolean}> {
		try {
			// Vérifier d'abord si la facture existe
			const existingInvoice = await this.findInvoice(id, { findBy: 'id', limit: 1, orderBy: 'desc' });
			
			if (!existingInvoice || existingInvoice.length === 0) {
				logger.warn(`Tentative de suppression d'une facture inexistante: ${id}`);
				return { success: false };
			}

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

	async updateInvoice(data: UpdateInvoiceData): Promise<{success: Boolean}> {
		try {
			const params = [
				data.num_cmdt,
				data.num_invoice,
				data.invoice_object,
				data.supplier_id,
				data.invoice_nature,
				formatDate(data.invoice_arr_date),
				formatDate(data.invoice_date),
				data.invoice_type,
				data.folio,
				data.amount,
				data.status,
				data.created_by,
				data.created_by_email,
				data.created_by_role,
				data.id // Pour la clause WHERE
			];

			const query = `
				UPDATE invoice 
				SET num_cmdt = ?, num_invoice = ?, invoice_object = ?, supplier_id = ?, 
					invoice_nature = ?, invoice_arr_date = ?, invoice_date = ?, invoice_type = ?, 
					folio = ?, amount = ?, status = ?, created_by = ?, created_by_email = ?, created_by_role = ?
				WHERE id = ?
			`;

			await database.execute(query, params);

			await auditLog({
				table_name: 'invoice',
				action: 'UPDATE',
				record_id: data.id,
				performed_by: data.created_by,
				description: `Mise à jour de la facture ${data.id} par l'utilisateur ${data.created_by}`
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

	async getLastInvoiceNum(): Promise<{success: boolean, invoiceNum: string | null}> {
		try {
		  const fiscalYear = await getSetting('fiscal_year');
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
			record_id: null,
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

	async getTheLatestInvoiceNumber(): Promise<{success: boolean; lastInvoiceNumber: string}> {
		try {
			const fiscalYear = await getSetting('fiscal_year');
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
			  record_id: null,
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
}
export default new Invoice();