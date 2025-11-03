/**
 * Standard API response format
 * @template T Type of the data payload
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    field?: string;
    code?: number;
    timestamp?: string;
}

/**
 * Paginated response format
 * @template T Type of the items in the paginated list
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

/**
 * Empty success response
 */
export type SuccessResponse = ApiResponse<{ success: true }>;

/**
 * Error response with error details
 */
export interface ErrorResponse extends ApiResponse<unknown> {
    success: false;
    error: string;
    code: number;
    details?: unknown;
}


