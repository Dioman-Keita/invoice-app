/**
 * User role types
 */
export type UserRole = 'invoice_manager' | 'admin' | 'dfc_agent';

/**
 * Base user type without database fields
 */
export type UserType = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    employeeId: string;
    role: UserRole;
    phone: string;
    department: string;
};

/**
 * Complete user type including database fields
 */
export type User = UserType & { 
    id: string; 
    create_at: string; 
    update_at: string; 
    isVerified: 0 | 1; 
    isActive: 0 | 1;
    fiscal_year: string; 
};

/**
 * Login credentials type
 */
export type LoginCredentials = {
    email: string;
    password: string;
    role: string;
};
