import { InvoiceType, FolioType, InvoiceNature } from '../domain/Invoice';
import { UserRole } from '../domain/User';

/**
 * DTO for invoice response
 */
export interface InvoiceResponseDto {
    id: string;
    num_cmdt: string;
    num_invoice: string;
    invoice_object: string;
    supplier_id: number;
    supplier_name: string;
    supplier_account_number: string;
    supplier_phone: string;
    invoice_type: InvoiceType;
    invoice_nature: InvoiceNature;
    invoice_arr_date: string;
    invoice_date: string;
    folio: FolioType;
    amount: string;
    status: 'Oui' | 'Non';
    dfc_status: 'pending' | 'approved' | 'rejected';
    created_by: string;
    created_by_email: string;
    created_by_role: UserRole;
    fiscal_year: string;
    create_at: string;
    update_at: string;
    documents: string[];
}

/**
 * DTO for creating invoice from frontend formular
 */
export interface InvoiceInputDto {
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
    created_by?: string;
    created_by_email?: string;
    created_by_role?: 'dfc_agent' | 'invoice_manager' | 'admin';
}

/**
 * DTO for creating a new invoice
 */
export interface CreateInvoiceDto {
    num_cmdt: string;
    invoice_num: string;
    invoice_object: string;
    supplier_id: number;
    invoice_nature: InvoiceNature;
    invoice_arrival_date: string;
    invoice_date: string;
    invoice_type: InvoiceType;
    folio: FolioType;
    invoice_amount: string;
    status: 'Oui' | 'Non';
    documents: string[];
    created_by?: string;
    created_by_email?: string;
    created_by_role?: UserRole;
}

/**
 * DTO for updating an existing invoice
 */
export type UpdateInvoiceDto = Omit<CreateInvoiceDto, 'num_cmdt'> & {
    id: string;
};



/**
 * DTO for invoice list response with pagination
 */
export interface InvoiceListResponseDto {
    data: InvoiceResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * DTO for updating DFC status
 */
export interface UpdateDfcStatusDto {
    id: string;
    status: 'approved' | 'rejected';
    reason?: string;
}


