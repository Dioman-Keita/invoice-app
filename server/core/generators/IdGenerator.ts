import database from "../../config/database";
import { getSetting } from "../../helpers/settings";
import { InvoiceCounterManager } from "../managers/InvoiceCounterManager";
import { EmployeeCounterManager } from "../managers/EmployeeCounterManager";
import logger from "../../utils/Logger";

type IdConfig = {
    prefix: string;
    table: string;
    idLength: number;
    maxAttempts: number;
    useFiscalYear: boolean;
}

export type EntityType = 'invoice' | 'employee';

const idMap: Record<EntityType, IdConfig> = {
    invoice: {
        prefix: 'INV',
        table: 'invoice',
        idLength: 12,
        maxAttempts: 5,
        useFiscalYear: true
    },
    employee: {
        prefix: 'EMP',
        table: 'employee',
        idLength: 8,
        maxAttempts: 10,
        useFiscalYear: true
    }
}

export class IdGenerator {
    private invoiceCounter = new InvoiceCounterManager();
    private employeeCounter = new EmployeeCounterManager();

    private getCounterManager(entity: EntityType): InvoiceCounterManager | EmployeeCounterManager {
        return entity === 'invoice' ? this.invoiceCounter : this.employeeCounter;
    }

    private async generateSecureId(
        entity: EntityType,
        fiscalYear: string,
        sequenceNumber: number
    ): Promise<string> {
        const config = idMap[entity];
        const fiscalPrefix = config.useFiscalYear ? `FY${fiscalYear}` : fiscalYear;
        return `${config.prefix}-${fiscalPrefix}-${sequenceNumber.toString().padStart(config.idLength, '0')}`;
    }

    private async isIdExists(table: string, id: string): Promise<boolean> {
        try {
            const result = await database.execute<{id: string}[]>(
                `SELECT id FROM ${table} WHERE id = ? LIMIT 1`,
                [id]
            );
            return Array.isArray(result) && result.length > 0;
        } catch (error) {
            logger.error(`❌ Erreur lors de la vérification de l'existence de l'ID ${id}`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'Unknown stack',
                table
            });
            throw error;
        }
    }

    /**
     * Génère un identifiant unique pour une entité
     */
    async generateId(entity: EntityType): Promise<string> {
        const config = idMap[entity];
        const counterManager = this.getCounterManager(entity);

        try {
            const fiscalYear = await getSetting('fiscal_year');

            let attempts = 0;
            let generatedId: string;
            let sequenceNumber: number;

            do {
                attempts++;

                if (attempts > config.maxAttempts) {
                    throw new Error(`Impossible de générer un ID unique après ${config.maxAttempts} tentatives pour ${entity}`);
                }

                // Incrémenter le compteur et récupérer le nouveau numéro
                sequenceNumber = await counterManager.incrementCounter(fiscalYear);

                // Générer l'ID
                generatedId = await this.generateSecureId(entity, fiscalYear, sequenceNumber);

                // Vérifier l'unicité
                const exists = await this.isIdExists(config.table, generatedId);

                if (!exists) {
                    logger.info(`✅ ID généré avec succès: ${generatedId}`, {
                        entity,
                        fiscalYear,
                        sequenceNumber,
                        attempts
                    });
                    return generatedId;
                }

                logger.warn(`⚠️ Conflit d'ID détecté, régénération: ${generatedId}`, {
                    entity,
                    fiscalYear,
                    sequenceNumber,
                    attempts
                });

            } while (attempts <= config.maxAttempts);

            throw new Error(`Échec de la génération d'ID pour ${entity} après ${attempts} tentatives`);

        } catch (error) {
            logger.error(`❌ Erreur critique lors de la génération d'ID pour ${entity}`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'Unknown stack',
            });
            throw error;
        }
    }

    /**
     * Génère plusieurs IDs en lot
     */
    async generateBatchIds(entity: EntityType, count: number = 1): Promise<string[]> {
        if (count < 1 || count > 100) {
            throw new Error('Le nombre d\'IDs à générer doit être compris entre 1 et 100');
        }

        const ids: string[] = [];

        for (let i = 0; i < count; i++) {
            try {
                const id = await this.generateId(entity);
                ids.push(id);
            } catch (error) {
                logger.error(`❌ Échec de la génération d'ID batch #${i + 1} pour ${entity}`, {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                throw error;
            }
        }

        logger.info(`✅ Lot de ${count} IDs générés avec succès pour ${entity}`);
        return ids;
    }

    /**
     * Valide le format d'un ID généré
     */
    validateIdFormat(id: string, entity: EntityType): boolean {
        const config = idMap[entity];
        const regex = new RegExp(
            `^${config.prefix}-${config.useFiscalYear ? 'FY' : ''}\\d{4}-\\d{${config.idLength}}$`
        );
        return regex.test(id);
    }

    /**
     * Extrait les informations d'un ID généré
     */
    parseGeneratedId(id: string): {
        prefix: string;
        year: string;
        sequence: number;
        entityType?: EntityType;
        isValid: boolean;
    } | null {
        const parts = id.split('-');

        if (parts.length !== 3) return null;

        const [prefix, yearPart, sequencePart] = parts;
        const sequence = parseInt(sequencePart, 10);
        const isFiscalYear = yearPart.startsWith('FY');
        const year = isFiscalYear ? yearPart.substring(2) : yearPart;

        if (isNaN(sequence) || isNaN(parseInt(year, 10))) {
            return null;
        }

        // Déterminer le type d'entité
        let entityType: EntityType | undefined;
        if (prefix === 'INV') entityType = 'invoice';
        if (prefix === 'EMP') entityType = 'employee';

        return {
            prefix,
            year,
            sequence,
            entityType,
            isValid: sequence > 0 && parseInt(year, 10) > 2000
        };
    }
}

// Export singleton pour compatibilité
export const idGenerator = new IdGenerator();

// Exports individuels pour la rétrocompatibilité
export const IDGenerator = idGenerator.generateId.bind(idGenerator);
export const generateBatchIds = idGenerator.generateBatchIds.bind(idGenerator);
export const validateIdFormat = idGenerator.validateIdFormat.bind(idGenerator);
export const parseGeneratedId = idGenerator.parseGeneratedId.bind(idGenerator);

export default idGenerator;