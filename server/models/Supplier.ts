import database from "../config/database";
import logger from "../utils/Logger";

type CreateSupplierInput = {
    suplier_name: string,
    suplier_email: string,
    suplier_phone: string,
}

type SupplierRecord = {
    id: string,
    name: string,
    email: string,
    phone: string,
    create_at: string,
    update_at: string,
}


class Supplier {

    async create(supplierData: CreateSupplierInput): Promise<unknown> {
        try {
            const { suplier_name, suplier_email, suplier_phone } = supplierData;
            const query = "INSERT INTO supplier(name, email, phone) VALUES (?,?,?)";
            const params = [
                suplier_name,
                suplier_phone,
                suplier_phone,
            ]
            
            logger.audit({
                table_name: 'Supplier',
                action: 'INSERT',
                performed_by: null,
                record_id: null,
                description: `Création du fournisseur ${suplier_name} ${suplier_email}`,
            })
            return await database.execute(query, params);
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    async findSupplier(id: string, type: 'email' | 'id' = 'id'): Promise<SupplierRecord[]> {
        const focus = type === 'email' ? 'email' : 'id';
        const result = await database.execute(`SELECT * FROM supplier WHERE ${focus} = ? LIMIT 1`, [id]);
        logger.audit({
            table_name: 'supplier',
            action: 'SELECT',
            record_id: id,
            performed_by: id,
        });
        return result;
    }

    async findSupplierByPhone(phone: string): Promise<SupplierRecord[]> {
        const result = await database.execute("SELECT * FROM supplier WHERE phone = ? LIMIT 1", [phone]);
        logger.audit({
            action: 'SELECT',
            table_name: 'supplier',
            record_id: phone,
            performed_by: phone,
        });
        return result
    }

    async getAllsupplier(): Promise<SupplierRecord[]> {
        const result = await database.execute("SELECT * FROM supplier");
        logger.audit({
            action: 'SELECT',
            table_name: 'supplier',
            record_id: 'all supplier in table supplier',
            performed_by: null
        });
        return result;
    }
}

const supplier = new Supplier()
export default supplier;