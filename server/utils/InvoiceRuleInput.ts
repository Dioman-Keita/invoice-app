import InvoiceLastNumberValidator from "../core/rules/InvoiceNumberRule";
import { getSupplierId } from "../controllers/supplier.controller";
import logger from "./Logger";
import { CreateInvoiceDto, InvoiceNature, InvoiceType, FolioType } from "../types";
import type { UserDto } from "../types/dto/UserDto";
import { formatDate } from "./Formatters";
import { normalizeAccountNumber, isValidAccountNumber, formatAccountCanonical } from "../../common/helpers/formatAccountNumber";

export interface InvoiceValidationInput {
  invoice_num: string;
  num_cmdt: string;
  supplier_account_number: string;
  supplier_name: string;
  supplier_phone?: string;
  invoice_amount: string | number;
  invoice_arrival_date: string;
  invoice_date: string;
  invoice_nature: string;
  folio: string;
  invoice_status: string;
  invoice_type: string;
  invoice_object?: string;
  documents?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    suggestion?: string;
  }>;
  validatedData?: CreateInvoiceDto;
}

export interface SupplierValidationResult {
  success: boolean;
  supplierId?: number;
  message?: string;
}

class InvoiceDataValidator {

  async validateInvoiceData(
    data: InvoiceValidationInput,
    user: UserDto
  ): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; suggestion?: string }> = [];

    // Required fields validation
    this.validateRequiredFields(data, errors);

    // Format validation
    await this.validateFormats(data, errors);

    // Business logic validation
    this.validateBusinessLogic(data, errors);

    // Supplier validation
    const supplierResult = await this.validateSupplier(data, user, errors);

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Prepare validated data
    const validatedData = this.prepareValidatedData(data, supplierResult.supplierId!, user);

    return {
      isValid: true,
      errors: [],
      validatedData
    };
  }

  private validateRequiredFields(
    data: InvoiceValidationInput,
    errors: Array<{ field: string; message: string; suggestion?: string }>
  ): void {
    const requiredFields = [
      { field: 'invoice_num', name: 'numéro de facture' },
      { field: 'num_cmdt', name: 'numéro CMDT' },
      { field: 'supplier_account_number', name: 'numéro de compte fournisseur' },
      { field: 'supplier_name', name: 'nom du fournisseur' },
      { field: 'invoice_amount', name: 'montant de la facture' },
      { field: 'invoice_arrival_date', name: 'date d\'arrivée' },
      { field: 'invoice_date', name: 'date de facture' },
      { field: 'invoice_nature', name: 'nature de la facture' },
      { field: 'folio', name: 'folio' },
      { field: 'invoice_status', name: 'statut de la facture' },
      { field: 'invoice_type', name: 'types de facture' }
    ];

    requiredFields.forEach(({ field, name }) => {
      if (!data[field as keyof InvoiceValidationInput]?.toString().trim()) {
        errors.push({ field, message: `Le ${name} est requis` });
      }
    });
  }

  private async validateFormats(
    data: InvoiceValidationInput,
    errors: Array<{ field: string; message: string; suggestion?: string }>
  ): Promise<void> {
    // Invoice number validation
    if (data.invoice_num) {
      const validationResult = await InvoiceLastNumberValidator.validateInvoiceNumberUniqueness(data.invoice_num);
      if (!validationResult.success) {
        errors.push({
          field: 'invoice_num',
          message: validationResult.errorMessage!
        });
      }
    }

    // CMDT number validation
    if (data.num_cmdt) {
      const validationResult = await InvoiceLastNumberValidator.validateInvoiceNumberExpected(data.num_cmdt);
      if (!validationResult.isValid) {
        errors.push({
          field: 'num_cmdt',
          message: validationResult.errorMessage!,
          suggestion: validationResult.nextNumberExpected
        });
      }
    }

    if (data.supplier_account_number) {
      const normalized = normalizeAccountNumber(String(data.supplier_account_number));
      if (!isValidAccountNumber(normalized)) {
        errors.push({
          field: 'supplier_account_number',
          message: 'Numéro de compte invalide. Doit contenir 6–34 caractères alphanumériques.'
        });
      } else {
        data.supplier_account_number = formatAccountCanonical(normalized);
      }
    }

    // Amount validation
    if (data.invoice_amount) {
      const val = String(data.invoice_amount);
      const sanitizedAmount = val.includes(',')
        ? val.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
        : val.replace(/\s/g, '');
      const amount = Number(sanitizedAmount);
      if (isNaN(amount) || amount <= 0 || amount > 100_000_000_000) {
        errors.push({
          field: 'invoice_amount',
          message: 'Le montant doit être compris entre 1 et 100 000 000 000'
        });
      } else {
        // Update with cleaned version for further processing
        data.invoice_amount = sanitizedAmount;
      }
    }
  }

  private validateBusinessLogic(
    data: InvoiceValidationInput,
    errors: Array<{ field: string; message: string; suggestion?: string }>
  ): void {
    // Enums validation
    const validEnums = {
      invoice_nature: ['Paiement', 'Acompte', 'Avoir'],
      folio: ['1 copie', 'Orig + 1 copie', 'Orig + 2 copies', 'Orig + 3 copies'],
      invoice_status: ['Oui', 'Non'],
      invoice_type: ['Ordinaire', 'Transporteur', 'Transitaire']
    };

    Object.entries(validEnums).forEach(([field, validValues]) => {
      const value = data[field as keyof InvoiceValidationInput];
      if (value && !validValues.includes(value.toString())) {
        errors.push({
          field,
          message: `${this.getFieldLabel(field)} est invalide. Valeurs autorisées: ${validValues.join(', ')}`
        });
      }
    });

    // Dates validation
    if (data.invoice_arrival_date && data.invoice_date) {
      try {
        const invoiceDate = new Date(formatDate(data.invoice_date));
        const invoiceArrivalDate = new Date(formatDate(data.invoice_arrival_date));

        if (invoiceArrivalDate.getTime() < invoiceDate.getTime()) {
          errors.push({
            field: 'invoice_arrival_date',
            message: 'La date d\'arrivée de la facture ne peut pas être antérieure à la date réelle de la facture'
          });
        }
      } catch {
        errors.push({
          field: 'invoice_arrival_date',
          message: 'Format de date invalide'
        });
      }
    }
  }

  private async validateSupplier(
    data: InvoiceValidationInput,
    user: UserDto,
    errors: Array<{ field: string; message: string; suggestion?: string }>
  ): Promise<SupplierValidationResult> {
    try {
      const supplierResult = await getSupplierId({
        supplier_account_number: data.supplier_account_number,
        supplier_name: data.supplier_name,
        supplier_phone: data.supplier_phone || '',
        created_by: user.sup,
        created_by_email: user.email,
        created_by_role: user.role,
      });

      if (!supplierResult.success || !supplierResult.supplierId) {
        errors.push({
          field: 'supplier_account_number',
          message: supplierResult.message || 'Erreur lors de la gestion du fournisseur'
        });
      }

      return supplierResult;
    } catch (error) {
      logger.error('Erreur lors de la validation du fournisseur', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      errors.push({
        field: 'supplier_account_number',
        message: 'Erreur lors de la validation du fournisseur'
      });

      return { success: false, message: 'Erreur de validation du fournisseur' };
    }
  }

  private prepareValidatedData(
    data: InvoiceValidationInput,
    supplierId: number,
    user: UserDto
  ): CreateInvoiceDto {
    return {
      num_cmdt: data.num_cmdt,
      invoice_num: String(data.invoice_num),
      invoice_object: data.invoice_object ?? '',
      invoice_nature: data.invoice_nature as InvoiceNature,
      invoice_arrival_date: data.invoice_arrival_date,
      invoice_date: data.invoice_date,
      invoice_type: data.invoice_type as InvoiceType,
      folio: data.folio as FolioType,
      invoice_amount: String(data.invoice_amount),
      status: (data.invoice_status === 'Oui' ? 'Oui' : 'Non'),
      documents: data.documents || [],
      supplier_id: supplierId,
      created_by: user.sup,
      created_by_email: user.email,
      created_by_role: user.role
    };
  }

  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      invoice_nature: 'La nature de la facture',
      folio: 'Le folio',
      invoice_status: 'L\'état de la facture',
      invoice_type: 'Le types de facture'
    };
    return labels[field] || field;
  }
}

export default new InvoiceDataValidator();