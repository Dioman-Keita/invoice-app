import database from "../config/database";
import generateId from "../services/generateId";
import logger from "../utils/Logger";
import { formatDate } from "../utils/Formatters";
import { auditLog } from "../utils/auditLogger";

export type InvoiceType = 'Ordinaire' | 'Transporteur' | 'Transitaire';
export type FolioType = '1 copie' | 'Org + 1 copie' | 'Org + 2 copies' | 'Org + 3 copies';
export type InvoiceStatus = 'Oui' | 'Non';

export type InvoiceRecord = {
	id: string;
	num_cmdt: string;
	num_invoice: string; // 1..12 chiffres, zéros en tête autorisés
	invoice_object: string | null;
	supplier_id: number | null;
	invoice_type: InvoiceType;
	invoice_arr_date: string; // YYYY-MM-DD
	invoice_date: string; // YYYY-MM-DD
	amount: number; // Montant <= 100 000 000 000
	folio: FolioType;
	create_at?: string;
	update_at?: string;
	status: InvoiceStatus; // défaut "Non"
	documents?: string[];
	created_by?: string;
	created_by_email?: string;
	created_by_role?: string;
};

export type CreateInvoiceInput = Omit<InvoiceRecord, 'id' | 'create_at' | 'update_at'> & {
	createdBy?: string;
	createdByEmail?: string;
	createdByRole?: string;
};

class InvoiceModel {
	async create(data: CreateInvoiceInput): Promise<unknown> {
		const id = await generateId('invoice');

		// Garde serveur: statut par défaut, format numéro, plafond montant
		const status: InvoiceStatus = (data.status as InvoiceStatus) ?? 'Non';
		const numInvoice = String(data.num_invoice ?? '').trim();
		if (!/^\d{1,12}$/.test(numInvoice)) {
			throw new Error('Le numéro de facture doit contenir 1 à 12 chiffres');
		}
		const amount = Number(data.amount);
		if (!(amount > 0) || amount > 100_000_000_000) {
			throw new Error('Montant invalide: maximum 100 000 000 000');
		}
		const query =
			"INSERT INTO invoice(id, num_cmdt, num_invoice, invoice_object, supplier_id, invoice_type, invoice_arr_date, invoice_date, amount, folio, status, created_by, created_by_email, created_by_role) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
		const params = [
			id,
			data.num_cmdt,
			numInvoice,
			data.invoice_object,
			data.supplier_id,
			data.invoice_type,
			formatDate(data.invoice_arr_date),
			formatDate(data.invoice_date),
			amount,
			data.folio,
			status,
			data.createdBy || null,
			data.createdByEmail || null,
			data.createdByRole || null,
		];
		const result = await database.execute(query, params);
		logger.info(`Création de la facture ${data.num_invoice}`);
		await auditLog({
			action: 'INSERT',
			table_name: 'invoice',
			record_id: id,
			performed_by: data.createdBy,
			description: `Création de la facture ${data.num_invoice}`,
		});
		if (data.documents && data.documents.length > 0) {
			await database.execute("INSERT INTO attachments(documents, invoice_id) VALUES (?,?)", [JSON.stringify(data.documents), id]);
			await auditLog({
				action: 'INSERT',
				table_name: 'attachments',
				record_id: id,
				performed_by: data.createdBy,
				description: `Ajout des documents liés à la facture ${data.num_invoice}`,
			});
		}
		return result;
	}

	async findById(id: string): Promise<InvoiceRecord[] | unknown> {
		const query = "SELECT * FROM invoice WHERE id = ?";
		const result = await database.execute(query, [id]);
		auditLog({
			action: 'SELECT',
			table_name: 'invoice',
			record_id: id,
			performed_by: id,
		});
		return result;
	}

	async findAll(): Promise<InvoiceRecord[] | unknown> {
		const query = "SELECT * FROM invoice ORDER BY create_at DESC";
		const result = await database.execute(query, []);
		auditLog({
			action: 'SELECT',
			table_name: 'invoice',
			record_id: 'all',
			description: 'Récupération de toutes les factures',
			performed_by: 'system'
		});
		return result;
	}

	async findByUserId(userId: string): Promise<InvoiceRecord[] | unknown> {
		const query = "SELECT * FROM invoice WHERE created_by = ? ORDER BY create_at DESC";
		const result = await database.execute(query, [userId]);
		auditLog({
			action: 'SELECT',
			table_name: 'invoice',
			record_id: userId,
			description: `Récupération des factures de l'utilisateur ${userId}`,
			performed_by: 'system'
		});
		return result;
	}

	async findByNumber(numInvoice: string): Promise<InvoiceRecord[] | unknown> {
		const query = "SELECT * FROM invoice WHERE num_invoice = ?";
		const result = await database.execute(query, [numInvoice]);
		auditLog({
			action: 'SELECT',
			table_name: 'invoice',
			record_id: numInvoice,
			performed_by: numInvoice,
		});
		return result;
	}

	async listBySupplier(supplierId: number): Promise<InvoiceRecord[] | unknown> {
		const query = "SELECT * FROM invoice WHERE supplier_id = ? ORDER BY create_at DESC";
		const result = await database.execute(query, [supplierId]);
		auditLog({
			action: 'SELECT',
			table_name: 'invoice',
			record_id: supplierId.toString(),
			performed_by: supplierId.toString(),
		});
		return result;
	}

	async listRecent(limit: number = 50): Promise<InvoiceRecord[] | unknown> {
		const query = "SELECT * FROM invoice ORDER BY create_at DESC LIMIT ?";
		const result = await database.execute(query, [limit]);
		auditLog({
			action: 'SELECT',
			table_name: 'invoice',
			record_id: null,
			description: `Obtention des ${limit} dernières factures`,
		});
		return result;
	}

	async updateStatus(id: string, status: InvoiceStatus): Promise<unknown> {
		const query = "UPDATE invoice SET status = ? WHERE id = ?";
		const result = await database.execute(query, [status, id]);
		await auditLog({
			action: 'UPDATE',
			table_name: 'invoice',
			record_id: id,
			description: `Mise à jour du statut de la facture vers ${status}`,
		});
		return result;
	}

	async updateAmount(id: string, amount: number): Promise<unknown> {
		const query = "UPDATE invoice SET amount = ? WHERE id = ?";
		const result = await database.execute(query, [amount, id]);
		await auditLog({
			action: 'UPDATE',
			table_name: 'invoice',
			record_id: id,
			description: `Mise à jour du montant de la facture à ${amount}`,
		});
		return result;
	}

	async remove(id: string): Promise<unknown> {
		const query = "DELETE FROM invoice WHERE id = ?";
		const result = await database.execute(query, [id]);
		await auditLog({
			action: 'DELETE',
			table_name: 'invoice',
			record_id: id,
			description: `Suppression de la facture`,
		});
		return result;
	}
}

const Invoice = new InvoiceModel();
export default Invoice;


