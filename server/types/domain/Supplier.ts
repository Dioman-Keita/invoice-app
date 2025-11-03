import { UserRole } from './User'
/**
 * Supplier record type from database
 */
export interface SupplierRecord {
    id: number;
    name: string;
    account_number: string;
    phone: string;
    fiscal_year: string;
    created_by?: string;
    created_by_email: string;
    created_by_role: UserRole;
    create_at: string;
    update_at: string;
}

/**
 * Input type for creating a new supplier from frontend
 */
export interface CreateSupplierInput {
    supplier_name: string;
    supplier_account_number: string;
    supplier_phone: string;
    created_by?: string;
    created_by_email?: string;
    created_by_role?: UserRole;
}

/**
 * Type for updating an existing supplier
 */
export type UpdateSupplierData = Omit<SupplierRecord, 'create_at' | 'update_at'>;

/**
 * Search parameters for finding suppliers
 */
export interface SupplierSearchParams {
    findBy: 'id' | 'account_number' | 'phone' | 'all';
    limit?: number;
    orderBy?: 'desc' | 'asc';
}

/**
 * Result of checking for supplier conflicts
 */
export interface SupplierConflictResult {
    hasAccountConflict: boolean;
    hasPhoneConflict: boolean;
    conflictingSuppliers: SupplierRecord[];
}

/**
 * Search filters for suppliers
 */
export interface SupplierSearchFilters {
    name?: string;
    account_number?: string;
    phone?: string;
}
