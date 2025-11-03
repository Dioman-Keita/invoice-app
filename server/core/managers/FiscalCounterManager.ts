import database from "../../config/database";
import logger from "../../utils/Logger";

export abstract class FiscalCounterManager {
    protected abstract getCounterTable(): string;
    protected abstract getCounterField(): string;
    protected abstract getEntityName(): string;

    /**
     * Initialise un compteur fiscal pour une année spécifique
     */
    async initializeFiscalCounter(fiscalYear: string, startNumber: number = 0): Promise<void> {
        try {
            const fiscalYearNum = Number(fiscalYear);
            const currentYear = new Date().getFullYear();

            // Validation de l'année fiscale
            if (isNaN(fiscalYearNum)) {
                throw new Error(`Année fiscale invalide: ${fiscalYear}`);
            }

            if (fiscalYearNum < currentYear) {
                throw new Error(`Impossible d'initialiser un compteur pour une année antérieure (${fiscalYear}).`);
            }

            // Vérifier si le compteur existe déjà
            const existing = await database.execute<{id: number}[]>(
                `SELECT id FROM ${this.getCounterTable()} WHERE fiscal_year = ?`,
                [fiscalYear]
            );

            if (!Array.isArray(existing) || existing.length === 0) {
                await database.execute(
                    `INSERT INTO ${this.getCounterTable()} (fiscal_year, ${this.getCounterField()}) VALUES (?, ?)`,
                    [fiscalYear, startNumber]
                );
                logger.info(`✅ Compteur ${this.getEntityName()} initialisé pour ${fiscalYear} à ${startNumber}`);
            } else {
                logger.info(`ℹ️ Compteur ${this.getEntityName()} pour ${fiscalYear} existe déjà`);
            }
        } catch (error) {
            logger.error(`❌ Erreur lors de l'initialisation du compteur ${this.getEntityName()} pour ${fiscalYear}`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'Unknown stack'
            });
            throw error;
        }
    }

    /**
     * Récupère le compteur fiscal actuel
     */
    async getCurrentCounter(fiscalYear: string): Promise<number> {
        try {
            const rows = await database.execute<{[key: string]: number}[]>(
                `SELECT ${this.getCounterField()} FROM ${this.getCounterTable()} WHERE fiscal_year = ? LIMIT 1`,
                [fiscalYear]
            );

            if (Array.isArray(rows) && rows.length > 0) {
                return Number(rows[0][this.getCounterField()]);
            }

            // Auto-initialisation si absent
            await this.initializeFiscalCounter(fiscalYear);
            return 0;
        } catch (error) {
            logger.error(`❌ Erreur lors de la récupération du compteur ${this.getEntityName()} pour ${fiscalYear}`, {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Met à jour le compteur fiscal
     */
    async updateCounter(fiscalYear: string, newValue: number): Promise<void> {
        try {
            await database.execute(
                `UPDATE ${this.getCounterTable()} 
                 SET ${this.getCounterField()} = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE fiscal_year = ?`,
                [newValue, fiscalYear]
            );

            logger.debug(`🔄 Compteur ${this.getEntityName()} mis à jour pour ${fiscalYear}: ${newValue}`);
        } catch (error) {
            logger.error(`❌ Erreur lors de la mise à jour du compteur ${this.getEntityName()} pour ${fiscalYear}`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'Unknown stack'
            });
            throw error;
        }
    }

    /**
     * Incrémente le compteur fiscal et retourne la nouvelle valeur
     */
    async incrementCounter(fiscalYear: string): Promise<number> {
        try {
            const current = await this.getCurrentCounter(fiscalYear);
            const newValue = current + 1;
            await this.updateCounter(fiscalYear, newValue);
            return newValue;
        } catch (error) {
            logger.error(`❌ Erreur lors de l'incrémentation du compteur ${this.getEntityName()} pour ${fiscalYear}`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'Unknown stack'
            });
            throw error;
        }
    }

    /**
     * Récupère l'historique des compteurs
     */
    async getCounterHistory(): Promise<Array<{fiscal_year: string; last_number: number}>> {
        try {
            const rows = await database.execute<{fiscal_year: string; last_number: number}[]>(
                `SELECT fiscal_year, ${this.getCounterField()} as last_number 
                 FROM ${this.getCounterTable()} 
                 ORDER BY fiscal_year DESC`
            );

            return Array.isArray(rows) ? rows.map(row => ({
                fiscal_year: row.fiscal_year,
                last_number: Number(row.last_number)
            })) : [];
        } catch (error) {
            logger.error(`❌ Erreur lors de la récupération de l'historique du compteur ${this.getEntityName()}`, {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }

    /**
     * Vérifie si un compteur existe pour une année fiscale
     */
    async counterExists(fiscalYear: string): Promise<boolean> {
        try {
            const rows = await database.execute<{id: number}[]>(
                `SELECT id FROM ${this.getCounterTable()} WHERE fiscal_year = ?`,
                [fiscalYear]
            );
            return Array.isArray(rows) && rows.length > 0;
        } catch (error) {
            logger.error(`❌ Erreur lors de la vérification de l'existence du compteur ${this.getEntityName()}`, {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }
}