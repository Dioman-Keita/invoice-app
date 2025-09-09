import mysql from 'mysql2/promise'
import dotenv from 'dotenv';
import type { PoolConnection, Pool } from 'mysql2/promise'
dotenv.config();

class Database {
    private pool: Pool | null = null;
    private connection: PoolConnection | null = null;

    public constructor() {
        this.init();
    }

    init() {
        try {
            this.pool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME  || 'cmdt_invoice_db',
                port: Number(process.env.DB_PORT) || 3306,
                connectionLimit: 10,
                waitForConnections: true,
                idleTimeout: 60000,
                queueLimit: 0,
                charset: 'utf8mb4',
                timezone: '+00:00',
                enableKeepAlive: true,
                keepAliveInitialDelay: 0
            })
            console.log('✅ Pool MySQL initialisée avec succès');
        } catch (error) {
            console.log('Une erreur est survenue lors de l\'initialisation du pool:', error);
            throw error;
        }
    }
    /**
     * Retourne une connexion a la base de donnée
     */
    async getConnection() {
        try {
            this.connection = await this.pool?.getConnection() || null;
            return this.connection;
        } catch (error) {
            console.log('❌ Erreur lors de l\'obtention de la connexion:', error);
            throw error;
        }
    }

    /** 
     * Exécute une requête avec paramètres (préparation contre les injections SQL) 
     * @param {string} query - Requête SQL * @param {Array} params - Paramètres de la requête 
     * @returns {Promise} Résultats de la requête 
    */

    async execute(query, param = []) {
        let connection;
        try {
            connection = await this.getConnection();
            const [rows] = await connection.execute(query, param);
            return rows;
        } catch (error) {
            console.log("Une erreur est survenue lors de l'execution de votre requete: ", error);
            throw error;
        } finally {
            connection.release();
        }
    }
    /**
     * Verifie la connexion à la base de donnée
     */
    async checkConnection() {
       try {
        const connection = await this?.getConnection() || null;
        await connection?.execute("SELECT 1");
        connection?.release();
        console.log("✅ Connexion à la base de données réussie");
        return true;
       } catch (error) {
        console.log("Echec de la connection à la base de donnée:", error);
       }
    }
    /**
     * Ferme la pool de connexion
     */
    async close() {
        try {
           if (this.pool) {
            await this.pool.end();
            console.log('✅ Pool MySQL fermée avec succès');
           }
        } catch (error) {
            console.error('❌ Erreur lors de la fermeture de la pool:', error);
            throw error;
        }
    }
}

const database = new Database();
export default database;

/**
 * Gestion de la fermuture propre
 */
process.on("SIGINT", async () => {
    try {
        await database.close();
        process.exit(0);
    } catch (error) {
        console.log("Une erreur est survenue lors de la fermeture securisée la pool : ", error);
        throw error;
    }
})
