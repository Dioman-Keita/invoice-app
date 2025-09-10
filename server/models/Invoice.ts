import database from "../config/database";
import generateId from "../services/GenerateId";
import logger from "../utils/Logger";

export type InvoiceType = 'Ordinaire' | 'Transporteur' | 'Transitaire';
export type FolioType = '1 copie' | 'Org + 1 copie' | 'Org + 2 copies' | 'Org + 3 copies';
export type InvoiceStatus = 'Oui' | 'Non';

export type InvoiceRecord = {
	id: string;
	num_cmdt: string;
	num_invoice: string;
	invoice_object: string | null;
	supplier_id: number | null;
	invoice_type: InvoiceType;
	invoice_arr_date: string; // YYYY-MM-DD
	invoice_date: string; // YYYY-MM-DD
	amount: number; // DECIMAL(10,2)
	folio: FolioType;
	create_at?: string;
	update_at?: string;
	status: InvoiceStatus;
};

export type CreateInvoiceInput = Omit<InvoiceRecord, 'id' | 'create_at' | 'update_at'>;

class InvoiceModel {
	async create(data: CreateInvoiceInput): Promise<unknown> {
		const id = await generateId('invoice');
		const query =
			"INSERT INTO invoice(id, num_cmdt, num_invoice, invoice_object, supplier_id, invoice_type, invoice_arr_date, invoice_date, amount, folio, status) VALUES(?,?,?,?,?,?,?,?,?,?,?)";
		const params = [
			id,
			data.num_cmdt,
			data.num_invoice,
			data.invoice_object,
			data.supplier_id,
			data.invoice_type,
			data.invoice_arr_date,
			data.invoice_date,
			data.amount,
			data.folio,
			data.status,
		];
		const result = await database.execute(query, params);
		await logger.audit({
			action: 'INSERT',
			table_name: 'invoice',
			record_id: id,
			description: `Création de la facture ${data.num_invoice}`,
		});
		return result;
	}

	async findById(id: string): Promise<InvoiceRecord[] | unknown> {
		const query = "SELECT * FROM invoice WHERE id = ?";
		return database.execute(query, [id]);
	}

	async findByNumber(numInvoice: string): Promise<InvoiceRecord[] | unknown> {
		const query = "SELECT * FROM invoice WHERE num_invoice = ?";
		return database.execute(query, [numInvoice]);
	}

	async listBySupplier(supplierId: number): Promise<InvoiceRecord[] | unknown> {
		const query = "SELECT * FROM invoice WHERE supplier_id = ? ORDER BY create_at DESC";
		return database.execute(query, [supplierId]);
	}

	async listRecent(limit: number = 50): Promise<InvoiceRecord[] | unknown> {
		const query = "SELECT * FROM invoice ORDER BY create_at DESC LIMIT ?";
		return database.execute(query, [limit]);
	}

	async updateStatus(id: string, status: InvoiceStatus): Promise<unknown> {
		const query = "UPDATE invoice SET status = ? WHERE id = ?";
		const result = await database.execute(query, [status, id]);
		await logger.audit({
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
		await logger.audit({
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
		await logger.audit({
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


