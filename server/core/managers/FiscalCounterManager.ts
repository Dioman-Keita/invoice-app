import database from "../../config/database";
import logger from "../../utils/Logger";

export abstract class FiscalCounterManager {
    protected abstract getCounterTable(): string;
    protected abstract getCounterField(): string;
    protected abstract getEntityName(): string;

    /**
     * Initializes a fiscal counter for a specific year
     */
    async initializeFiscalCounter(fiscalYear: string, startNumber: number = 0): Promise<void> {
        try {
            const fiscalYearNum = Number(fiscalYear);
            const currentYear = new Date().getFullYear();

            // Fiscal year validation
            if (isNaN(fiscalYearNum)) {
                throw new Error(`Invalid fiscal year: ${fiscalYear}`);
            }

            if (fiscalYearNum < currentYear) {
                throw new Error(`Cannot initialize counter for a past year (${fiscalYear}).`);
            }

            // Check if counter already exists
            const existing = await database.execute<{ id: number }[]>(
                `SELECT id FROM ${this.getCounterTable()} WHERE fiscal_year = ?`,
                [fiscalYear]
            );

            if (!Array.isArray(existing) || existing.length === 0) {
                await database.execute(
                    `INSERT INTO ${this.getCounterTable()} (fiscal_year, ${this.getCounterField()}) VALUES (?, ?)`,
                    [fiscalYear, startNumber]
                );
                logger.info(`✅ ${this.getEntityName()} counter initialized for ${fiscalYear} at ${startNumber}`);
            } else {
                logger.info(`ℹ️ ${this.getEntityName()} counter for ${fiscalYear} already exists`);
            }
        } catch (error) {
            logger.error(`❌ Error initializing ${this.getEntityName()} counter for ${fiscalYear}`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'Unknown stack'
            });
            throw error;
        }
    }

    /**
     * Retrieves the current fiscal counter
     */
    async getCurrentCounter(fiscalYear: string): Promise<number> {
        try {
            const rows = await database.execute<{ [key: string]: number }[]>(
                `SELECT ${this.getCounterField()} FROM ${this.getCounterTable()} WHERE fiscal_year = ? LIMIT 1`,
                [fiscalYear]
            );

            if (Array.isArray(rows) && rows.length > 0) {
                return Number(rows[0][this.getCounterField()]);
            }

            // Auto-initialize if missing
            await this.initializeFiscalCounter(fiscalYear);
            return 0;
        } catch (error) {
            logger.error(`❌ Error retrieving ${this.getEntityName()} counter for ${fiscalYear}`, {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Updates the fiscal counter
     */
    async updateCounter(fiscalYear: string, newValue: number): Promise<void> {
        try {
            await database.execute(
                `UPDATE ${this.getCounterTable()} 
                 SET ${this.getCounterField()} = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE fiscal_year = ?`,
                [newValue, fiscalYear]
            );

            logger.debug(`🔄 ${this.getEntityName()} counter updated for ${fiscalYear}: ${newValue}`);
        } catch (error) {
            logger.error(`❌ Error updating ${this.getEntityName()} counter for ${fiscalYear}`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'Unknown stack'
            });
            throw error;
        }
    }

    /**
     * Increments the fiscal counter and returns the new value
     */
    async incrementCounter(fiscalYear: string): Promise<number> {
        try {
            const current = await this.getCurrentCounter(fiscalYear);
            const newValue = current + 1;
            await this.updateCounter(fiscalYear, newValue);
            return newValue;
        } catch (error) {
            logger.error(`❌ Error incrementing ${this.getEntityName()} counter for ${fiscalYear}`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'Unknown stack'
            });
            throw error;
        }
    }

    /**
     * Retrieves counter history
     */
    async getCounterHistory(): Promise<Array<{ fiscal_year: string; last_number: number }>> {
        try {
            const rows = await database.execute<{ fiscal_year: string; last_number: number }[]>(
                `SELECT fiscal_year, ${this.getCounterField()} as last_number 
                 FROM ${this.getCounterTable()} 
                 ORDER BY fiscal_year DESC`
            );

            return Array.isArray(rows) ? rows.map(row => ({
                fiscal_year: row.fiscal_year,
                last_number: Number(row.last_number)
            })) : [];
        } catch (error) {
            logger.error(`❌ Error retrieving ${this.getEntityName()} counter history`, {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }

    /**
     * Checks if a counter exists for a fiscal year
     */
    async counterExists(fiscalYear: string): Promise<boolean> {
        try {
            const rows = await database.execute<{ id: number }[]>(
                `SELECT id FROM ${this.getCounterTable()} WHERE fiscal_year = ?`,
                [fiscalYear]
            );
            return Array.isArray(rows) && rows.length > 0;
        } catch (error) {
            logger.error(`❌ Error checking ${this.getEntityName()} counter existence`, {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }
}