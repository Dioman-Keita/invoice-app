/**
 * Type for specify Database error structure
 */
export type DBError = Error & {
    code?: string;
    errno?: string;
};
