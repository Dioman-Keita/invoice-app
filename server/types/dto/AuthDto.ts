import { UserRole } from '../domain/User';

/**
 * Login request DTO
 */
export interface LoginDto {
    email: string;
    password: string;
    role: string;
    rememberMe: boolean;
}

/**
 * Registration request DTO
 */
export interface RegisterDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    employeeId: string;
    role: UserRole;
    phone: string;
    department: string;
}

/**
 * Authentication response DTO
 */
export interface AuthResponseDto {
    success: boolean;
    token?: string;
    user?: {
        id: string;
        email: string;
        role: UserRole;
        firstName: string;
        lastName: string;
    };
    error?: string;
    field?: string;
}

/**
 * Email verification DTO
 */
export interface VerifyEmailDto {
    token: string;
}

/**
 * Password reset request DTO
 */
export interface RequestPasswordResetDto {
    email: string;
}

/**
 * Password reset confirmation DTO
 */
export interface ResetPasswordDto {
    token: string;
    password: string; // new password
    confirmPassword: string;
}
