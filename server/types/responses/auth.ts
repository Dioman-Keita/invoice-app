import { UserRole } from "../domain/User";

/**
 * Type for specify authentication service response
 */
export type VerifiedUser = {
    id: string;
    email: string;
    role: UserRole;
};

export type VerifyCredentialsResult = VerifiedUser | { error?: 'DATABASE_CONNECTION_ERROR'} | null;