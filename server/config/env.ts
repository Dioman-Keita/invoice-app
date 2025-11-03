import dotenv from 'dotenv';
import path from 'path';
import { EnvVars } from '../types';

// Charger les variables d'environnement depuis le fichier .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Configuration par défaut
const defaultConfig: Partial<EnvVars> = {
  NODE_ENV: 'development',
  PORT: 3000,
  HOST: '0.0.0.0',
  DB_PORT: 3306,
  DB_HOST: 'localhost',
  DB_NAME: 'cmdt_invoice_db',
  DB_USER: 'root',
  DB_PASSWORD: '',
  JWT_SECRET: 'I-am-atomic',
  JWT_EXPIRES_IN: '1d',
  JWT_REFRESH_SECRET: 'I-am-atomic-refresh',
  JWT_REFRESH_EXPIRES_IN: '7d',
  APP_URL: 'http://localhost:5173',
  API_URL: 'http://localhost:3000',
  CLIENT_URL: 'http://localhost:5173',
  CORS_ORIGIN: 'http://localhost:5173',
  UPLOAD_DIR: 'uploads',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
};

// Fusionner avec les variables d'environnement
export const env: EnvVars = {
  ...defaultConfig,
  ...process.env,
  // Convertir les chaînes en nombres si nécessaire
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : defaultConfig.PORT,
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : defaultConfig.DB_PORT,
} as unknown as EnvVars;

// Valider les variables d'environnement requises
const requiredVars: (keyof EnvVars)[] = [
  'DB_NAME',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'JWT_REFRESH_SECRET',
  'JWT_REFRESH_EXPIRES_IN',
  'APP_URL',
  'API_URL',
  'CLIENT_URL',
  'CORS_ORIGIN',
  'UPLOAD_DIR',
  'MAX_FILE_SIZE'
];

// Vérifier les variables obligatoires
for (const key of requiredVars) {
  if (!env[key]) {
    throw new Error(`La variable d'environnement ${key} est requise mais n'est pas définie`);
  }
}

// Exporter les variables typées
export default env;
