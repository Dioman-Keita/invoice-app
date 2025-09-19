import database from "../config/database";
import logger from "../utils/Logger";
import { auditLog } from "../utils/auditLogger";

type CreateSupplierInput = {
    suplier_name: string,
    suplier_account_number: string,
    suplier_phone: string,
}

export type SupplierRecord = {
    id: string,
    name: string,
    account_number: string,
    phone: string,
    create_at: string,
    update_at: string,
}


class Supplier {

    async create(supplierData: CreateSupplierInput): Promise<unknown> {
        try {
            const { suplier_name, suplier_account_number, suplier_phone } = supplierData;
            if (!/^\d{12}$/.test(String(suplier_account_number))) {
                throw new Error('Le numéro de compte doit contenir exactement 12 chiffres');
            }
            const query = "INSERT INTO supplier(name, account_number, phone) VALUES (?,?,?)";
            const params = [
                suplier_name,
                suplier_account_number,
                suplier_phone,
            ]
            
            auditLog({
                table_name: 'Supplier',
                action: 'INSERT',
                performed_by: 'By current current user',
                record_id: 'Current user',
                description: `Création du fournisseur ${suplier_name} ${suplier_account_number}`,
            })
            return await database.execute(query, params);
        } catch (error) {
            logger.error('Erreur lors de la création du fournisseur', { 
                error: error instanceof Error ? error.message : 'Erreur inconnue' 
            });
            throw error;
        }
    }

    async findSupplier(id: string, type: 'account_number' | 'id' = 'id'): Promise<SupplierRecord[]> {
        const focus = type === 'account_number' ? 'account_number' : 'id';
        const result = await database.execute(`SELECT * FROM supplier WHERE ${focus} = ? LIMIT 1`, [id]);
        auditLog({
            table_name: 'supplier',
            action: 'SELECT',
            record_id: id,
            performed_by: id,
        });
        return result;
    }

    async findSupplierByPhone(phone: string): Promise<SupplierRecord[]> {
        const result = await database.execute("SELECT * FROM supplier WHERE phone = ? LIMIT 1", [phone]);
        auditLog({
            action: 'SELECT',
            table_name: 'supplier',
            record_id: phone,
            performed_by: phone,
        });
        return result
    }

    async getAllSupplier(): Promise<SupplierRecord[]> {
        const result = await database.execute("SELECT * FROM supplier");
        auditLog({
            action: 'SELECT',
            table_name: 'supplier',
            record_id: 'all supplier in table supplier',
        });
        return result;
    }

    async deleteSupplier(id: number): Promise<unknown> {
        const result = await database.execute(
            "DELETE FROM supplier WHERE id = ?",
            [id]
        );
        auditLog({
            table_name: 'supplier',
            action: 'DELETE',
            record_id: id.toString(),
        })
        return result;
    }

    async updateSupplier(data: CreateSupplierInput, id: number): Promise<unknown> {
        const result = await database.execute(
            "UPDATE supplier SET (name, acount_number, phone) WHERE id = ?",
            [data.suplier_name, data.suplier_account_number, data.suplier_phone]
        )
        auditLog({
            table_name: 'supplier',
            action: 'UPDATE',
            record_id: id.toString(),
            performed_by: null
        });
        return result;
    }
}

const supplier = new Supplier();
export default supplier;