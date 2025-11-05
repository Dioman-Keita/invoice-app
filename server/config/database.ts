import mysql from 'mysql2/promise';
import type { PoolConnection, Pool } from 'mysql2/promise';
import logger from '../utils/Logger';

export type DatabaseInstance = Database;

class Database {
    private pool: Pool | null = null;

    public constructor() {
        this.init();
    }

    init(): void {
        try {
            this.pool = mysql.createPool({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                port: Number(process.env.DB_PORT),
                connectionLimit: 10,
                waitForConnections: true,
                idleTimeout: 60000,
                queueLimit: 0,
                charset: 'utf8mb4',
                timezone: '+00:00',
                enableKeepAlive: true,
                keepAliveInitialDelay: 0
            });
            logger.info('Pool MySQL initialisée avec succès');
        } catch (error) {
            logger.error('Une erreur est survenue lors de l\'initialisation du pool', error);
            throw error;
        }
    }

    public async getConnection(): Promise<PoolConnection> {
        try {
            if (!this.pool) {
                throw new Error('Pool de connexion non initialisé');
            }
            return await this.pool.getConnection();
        } catch (error) {
            logger.error('Erreur lors de l\'obtention de la connexion', error);
            throw error;
        }
    }

    async execute<T = unknown>(query: string, params: unknown[] = []): Promise<T> {
        let connection: PoolConnection | null = null;
        try {
            connection = await this.getConnection();
            const [rows] = await connection.execute(query, params);
            return rows as T;
        } catch (error) {
            logger.error("Une erreur est survenue lors de l'execution de votre requete", { error, query, params });
            throw error;
        } finally {
            connection?.release();
        }
    }

    async checkConnection(): Promise<boolean> {
        let connection: PoolConnection | null = null;
        try {
            connection = await this.getConnection();
            await connection.execute("SELECT 1");
            logger.info("Connexion à la base de données réussie");
            return true;
        } catch (error) {
            logger.error("Echec de la connection à la base de donnée", error);
            return false;
        } finally {
            connection?.release();
        }
    }

    async close(): Promise<void> {
        try {
            if (this.pool) {
                await this.pool.end();
                logger.info('Pool MySQL fermée avec succès');
            }
        } catch (error) {
            logger.error('Erreur lors de la fermeture de la pool', error);
            throw error;
        }
    }
}

const database = new Database();
export default database;

process.on("SIGINT", async () => {
    try {
        await database.close();
        process.exit(0);
    } catch (error) {
        logger.error("Une erreur est survenue lors de la fermeture securisée de la pool", error);
        process.exit(1);
    }
});