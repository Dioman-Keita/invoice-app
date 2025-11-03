/**
 * Environment variables configuration
 */
export interface EnvVars {
    // Server configuration
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: number;
    HOST: string;
    
    // Database configuration
    DB_HOST: string;
    DB_PORT: number;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    DB_SSL: boolean;
    
    // JWT configuration
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRES_IN: string;
    
    // Email configuration
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_SECURE: boolean;
    SMTP_USER: string;
    SMTP_PASS: string;
    EMAIL_FROM: string;
    
    // Application URLs
    APP_URL: string;
    API_URL: string;
    CLIENT_URL: string;
    
    // Logging
    LOG_LEVEL: 'error' | 'warn' | 'info' | 'http' | 'debug';
    
    // Rate limiting
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX: number;
    
    // CORS
    CORS_ORIGIN: string;
    
    // File upload
    UPLOAD_DIR: string;
    MAX_FILE_SIZE: number;
    
    // Session
    SESSION_SECRET: string;
    SESSION_COOKIE_MAX_AGE: number;
    
    // Feature flags
    ENABLE_SWAGGER: boolean;
    ENABLE_GRAPHQL: boolean;
    
    // External services
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
    AWS_REGION?: string;
    AWS_S3_BUCKET?: string;
    
    // Application settings
    FISCAL_YEAR: string;
    
    // Debug
    DEBUG: string;
}

/**
 * Default environment variables
 */
export const defaultEnvVars: Partial<EnvVars> = {
    NODE_ENV: 'development',
    PORT: 3000,
    HOST: 'localhost',
    DB_PORT: 3306,
    DB_SSL: false,
    SMTP_PORT: 587,
    SMTP_SECURE: false,
    LOG_LEVEL: 'info',
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX: 100,
    CORS_ORIGIN: '*',
    UPLOAD_DIR: 'uploads',
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    SESSION_COOKIE_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
    ENABLE_SWAGGER: true,
    ENABLE_GRAPHQL: false,
    DEBUG: 'app:*',
};

/**
 * Type for environment variable names
 */
export type EnvVarName = keyof EnvVars;

/**
 * Type for required environment variables
 */
export type RequiredEnvVars = {
    [K in keyof EnvVars]-?: EnvVars[K];
};

/**
 * Type for partial environment variables (for defaults)
 */
export type PartialEnvVars = Partial<EnvVars>;

/**
 * Type for environment variable validators
 */
export type EnvVarValidators = {
    [K in keyof EnvVars]?: (value: string) => EnvVars[K];
};
