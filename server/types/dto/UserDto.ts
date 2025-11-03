import { UserType } from '../domain/User'
/**
 * DTO for user payload
 */
export type UserRole = 'invoice_manager' | 'dfc_agent' | 'admin';

export type ActivityType = 
| 'SIGN_UP'
| 'LOGIN' 
| 'LOGOUT'
| 'UPDATE_PASSWORD'
| 'RESET_PASSWORD'
| 'SEND_PASSWORD_RESET_EMAIL'
| 'REFRESH_SESSION'
| 'SUBMIT_INVOICE'
| 'VALIDATE_INVOICE'
| 'UPDATE_EMPLOYEE_ID'
| 'VIEW_PROFILE'
| 'UPDATE_PROFILE'
| 'REFRESH_PROFILE';

/**
 * DTO for specify entity user structure
 */
export interface UserDto {
    sup: string;        // User ID
    email: string;      // User email
    role: UserRole;     // User role
    activity: ActivityType; // Current activity
    exp?: number;       // Expiration timestamp
    iat?: number;       // Issued at timestamp
}

/**
 * DTO for creating user from frontend
 */
export type createUserDto = UserType;