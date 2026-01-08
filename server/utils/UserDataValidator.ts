import { isValidEmail, isValidPasswordStrength } from "../middleware/validator";

export interface UserValidationInput {
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  phone: string;
  password: string;
  role: string;
  department: string;
}

export interface LoginValidationInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

class UserDataValidator {
  // Available departments for each role
  private readonly validDepartments = {
    dfc_agent: ['Finance', 'Comptabilité', 'Contrôle de gestion', 'Audit interne'],
    invoice_manager: ['Facturation', 'Comptabilité Client', 'Gestion des factures'],
    all: ['Finance', 'Comptabilité', 'Contrôle de gestion', 'Audit interne', 'Facturation', 'Comptabilité Client', 'Gestion des factures']
  };

  // Authorized roles for registration (admin excluded)
  private readonly validRoles = ['invoice_manager', 'dfc_agent'];

  async validateUserCreation(data: UserValidationInput): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string }> = [];

    // Validation of required fields
    this.validateRequiredFields(data, errors);

    // Validation of formats
    this.validateFormats(data, errors);

    // Validation of business logic
    this.validateBusinessLogic(data, errors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async validateLogin(data: LoginValidationInput): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string }> = [];

    // Validation of email
    if (!data.email?.trim()) {
      errors.push({ field: 'email', message: 'L\'email est requis' });
    } else if (!isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'Le format de l\'email est invalide' });
    }

    // Validation of password
    if (!data.password?.trim()) {
      errors.push({ field: 'password', message: 'Le mot de passe est requis' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateRequiredFields(
    data: UserValidationInput,
    errors: Array<{ field: string; message: string }>
  ): void {
    const requiredFields = [
      { field: 'firstName', name: 'prénom' },
      { field: 'lastName', name: 'nom' },
      { field: 'email', name: 'email' },
      { field: 'employeeId', name: 'identifiant CMDT' },
      { field: 'phone', name: 'numéro de téléphone' },
      { field: 'password', name: 'mot de passe' },
      { field: 'role', name: 'rôle' },
      { field: 'department', name: 'département' }
    ];

    requiredFields.forEach(({ field, name }) => {
      if (!data[field as keyof UserValidationInput]?.toString().trim()) {
        errors.push({ field, message: `Le ${name} est requis` });
      }
    });
  }

  private validateFormats(
    data: UserValidationInput,
    errors: Array<{ field: string; message: string }>
  ): void {
    // Validation of firstName
    if (data.firstName && !/^[A-Za-zÀ-ÖØ-öø-ÿ \-']+$/.test(data.firstName)) {
      errors.push({ field: 'firstName', message: 'Le format du prénom est invalide' });
    }

    // Validation of lastName
    if (data.lastName && !/^[A-Za-zÀ-ÖØ-öø-ÿ \-']+$/.test(data.lastName)) {
      errors.push({ field: 'lastName', message: 'Le format du nom est invalide' });
    }

    // Validation of email
    if (data.email && !isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'Le format de l\'email est invalide' });
    }

    // Validation of employeeId
    if (data.employeeId && !/^\d{5,7}$/.test(data.employeeId)) {
      errors.push({ field: 'employeeId', message: 'L\'identifiant CMDT doit contenir 5 à 7 chiffres' });
    }

    // Validation of phone
    if (data.phone && !/^\+223\s\d{2}\s\d{2}\s\d{2}\s\d{2}$/.test(data.phone)) {
      errors.push({ field: 'phone', message: 'Le format du numéro de téléphone est invalide. Format attendu: +223 XX XX XX XX' });
    }

    // Validation of password
    if (data.password && !isValidPasswordStrength(data.password)) {
      errors.push({ field: 'password', message: 'Le mot de passe est trop faible. Il doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial' });
    }
  }

  private validateBusinessLogic(
    data: UserValidationInput,
    errors: Array<{ field: string; message: string }>
  ): void {
    // Validation of role
    if (data.role && !this.validRoles.includes(data.role)) {
      errors.push({
        field: 'role',
        message: 'Invalid role. Choose "invoice_manager" or "dfc_agent"'
      });
    }

    // Validation of department
    if (data.department && !this.validDepartments.all.includes(data.department)) {
      errors.push({
        field: 'department',
        message: 'Département invalide'
      });
    }

    // Validation of role and department coherence
    if (data.role && data.department) {
      if (data.role === 'dfc_agent' && !this.validDepartments.dfc_agent.includes(data.department)) {
        errors.push({
          field: 'department',
          message: 'Département invalide pour un Agent DFC. Départements autorisés: Finance, Comptabilité, Contrôle de gestion, Audit interne'
        });
      }

      if (data.role === 'invoice_manager' && !this.validDepartments.invoice_manager.includes(data.department)) {
        errors.push({
          field: 'department',
          message: 'Département invalide pour un Chargé de facture. Départements autorisés: Facturation, Comptabilité Client, Gestion des factures'
        });
      }
    }
  }

  // Utility methods to retrieve valid data
  getValidDepartments(role?: string): string[] {
    if (role && this.validRoles.includes(role)) {
      return this.validDepartments[role as keyof typeof this.validDepartments] || [];
    }
    return this.validDepartments.all;
  }

  getValidRoles(): string[] {
    return [...this.validRoles];
  }
}

export default new UserDataValidator();