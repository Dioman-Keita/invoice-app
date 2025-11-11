import { UserRole } from './User';

/**
 * Types of folio for invoices
 */
export type FolioType = '1 copie' | 'Orig + 1 copie' | 'Orig + 2 copies' | 'Orig + 3 copies';

/**
 * Types of invoices
 */
export type InvoiceType = 'Ordinaire' | 'Transporteur' | 'Transitaire';

/**
 * Invoice nature types
 */
export type InvoiceNature = 'Paiement' | 'Acompte' | 'Avoir';

/**
 * DFC status types
 */
export type DfcStatus = 'pending' | 'approved' | 'rejected';

/**
 * Complete invoice record type from database
 */
export interface InvoiceRecord {
    id: string;
    num_cmdt: string;
    num_invoice: string;
    invoice_object: string;
    supplier_id: string;
    invoice_type: InvoiceType;
    invoice_nature: InvoiceNature;
    invoice_arr_date: string;
    invoice_date: string;
    folio: FolioType;
    amount: string;
    create_at: string;
    update_at: string;
    status: 'Oui' | 'Non';
    dfc_status: DfcStatus;
    created_by: string;
    created_by_email: string;
    created_by_role: UserRole;
    fiscal_year: string;
    documents?: string | string[];
}

/**
 * Invoice status type
 */
export type InvoiceStatus = 'Oui' | 'Non';


/**
 * Invoice search parameters
 */
export interface InvoiceSearchParams {
    findBy: 'id' | 'phone' | 'account_number' | 'supplier_id' | 'all';
    limit?: number | null;
    orderBy?: 'desc' | 'asc';
    fiscalYear?: string;
}


/**
 * Invoice seach query
 */

export type SearchInvoiceQueryParams = {
    supplier_id?: string;
    account_number?: string;
    phone?: string;
    status?: string;
    created_by?: string;
    limit?: string;
    orderBy?: 'desc' | 'asc';
    search?: string;
    fiscal_year?: string;
};
