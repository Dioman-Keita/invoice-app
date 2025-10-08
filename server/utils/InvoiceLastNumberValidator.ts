import database from "../config/database";
import Invoice from "../models/Invoice";
import logger from "./Logger";

type AppSettingMap = {
    fiscal_year: string;
    cmdt_format: {
        padding: number;
        max: number;
    };
    year_end_warning_threshold: number
};

async function getSetting<K extends keyof AppSettingMap>(key: K): Promise<AppSettingMap[K]> {
    const rows = await database.execute<{setting_value: string}[]>(
        "SELECT setting_value FROM app_settings WHERE setting_key = ? LIMIT 1",
        [key]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error(`Clé de configuration "${key}" introuvable dans app_settings`)
    }
    return JSON.parse(rows[0].setting_value);
}

function isValidCmdtFormat(value: string, padding: number): boolean {
    const regex = new RegExp(`^\\d{${padding}}$`);
    return regex.test(value);
}

class InvoiceLastNumberValidator {
    async calculateNextNumberExpected(): Promise<{
        success: boolean;
        nextNumberExpected: string;
        errorMessage?: string;
    }> {
        try {

            const config = await getSetting('cmdt_format');
            const last = await Invoice.getLastInvoiceNum();
            const lastNumber = parseInt(last.invoiceNum || '0000');
    
            if (lastNumber >= config.max) {
                return {
                    success: false,
                    nextNumberExpected: '0000',
                    errorMessage: `Seuil maximal "${config.max}" atteint pour l'année fiscale en cours.`,
                };
            }
    
            const next = (lastNumber + 1).toString().padStart(config.padding, '0');
            return { success: true, nextNumberExpected: next };

        } catch (error) {
            logger.error(`Une erreur est survenue lors du calcule du prochain numero de facture`, {
                msg: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : "Unknown stack"
            });
            throw error;
        }
    }

    async validateInvoiceNumberExpected(invoiceNumber: string): Promise<{
        isValid: boolean;
        errorMessage?: string;
        nextNumberExpected?: string;
    }> {
        try {
            
            const fiscalYear = await getSetting('fiscal_year');
            const config = await getSetting('cmdt_format');
            const currentYear = new Date().getFullYear();
            const result = await this.calculateNextNumberExpected();
            const next = result.nextNumberExpected
            
            if (currentYear > parseInt(fiscalYear)) {
                return {
                    isValid: false,
                    errorMessage: "L'année fiscale est expirée. Veuillez contacter l'administrateur."
                };
            }
    
            if (!isValidCmdtFormat(invoiceNumber, config.padding)) {
                return {
                    isValid: false,
                    errorMessage: `Format invalide. Format attendu : ${'0'.repeat(config.padding)} (ex 0039)`,
                };
            }
    
            if (invoiceNumber === '0000') {
                return {
                    isValid: false,
                    errorMessage: `Le numéro "0000" est invalide. Numéro recommandé : ${next}`,
                };
            }

            const isInvoiceNumberExist = await database.execute(
                "SELECT * FROM invoice WHERE num_cmdt = ?",
                [invoiceNumber]
            )

            if (Array.isArray(isInvoiceNumberExist) && isInvoiceNumberExist.length > 0) {
                return {
                    isValid: false,
                    errorMessage: `Ce numéro de facture est déjà utilisé. Numéro suggéré "${next}"`
                }
            }

            if (invoiceNumber !== next) {
               return {
                isValid: false,
                errorMessage: `Numero de facture invalide. Le numero de facture attentu est le "${next}"`
               }
            }
    
            return result.success 
            ? { isValid: true, nextNumberExpected: result.nextNumberExpected }
            : { isValid: false, errorMessage: result.errorMessage, nextNumberExpected: '0000'};

        } catch (error) {
            logger.error(`Une erreur est survenue lors de la validation du prochain numero de facture`, {
                msg: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'Unknown stack'
            });
            throw error;
        }
    }

    async checkYearEndThresholdWarning(): Promise<{
        warning: boolean;
        remaining: number;
        threshold: number;
        max: number;
        lastNumber: number;
    }> {
        try {
            const config = await getSetting('cmdt_format');
            const threshold = await getSetting('year_end_warning_threshold');
            const last = await Invoice.getLastInvoiceNum();
            const lastNumber = parseInt(last.invoiceNum || '0000');

            const remaining = config.max - lastNumber;
            const warning = remaining <= threshold;

            if (warning) {
                logger.warn(`Seuil d'alerte atteint : ${lastNumber}/${config.max}. Il reste ${remaining} numéro avant la limite`);
            }

            return {
                warning,
                remaining,
                threshold,
                max: config.max,
                lastNumber
            }
        } catch (error) {
            logger.error(`Erreur lors du contrôle du seuil de fin d'année`, {
                msg: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'Unknown stack'
            });
            throw error;
        }
    }

    async validateInvoiceNumberUniqueness(invoiceNum: string): Promise<{success: boolean, errorMessage?: string}> {
        try {

            if (invoiceNum === '0') {
                return {
                    success: false,
                    errorMessage: 'Le numero d\'une facture ne peut pas être "0"',
                }
            }

            const regex = /^(?!^0$)\d{1,12}$/;
            if(!regex.test(invoiceNum)) {
                return {
                    success: false,
                    errorMessage: 'Format invalide. Format attendu (1 à 12 chiffres inclu. 0 au debut autorisé)'
                }
            }
            const result = await database.execute(
                "SELECT * FROM invoice WHERE num_invoice = ?",
                [invoiceNum]
            );

            if (Array.isArray(result) && result.length > 0) {
                return {
                    success: false,
                    errorMessage: 'Une facture est déjà enregistrée avec le même numéro. Veuillez en choisir un autre.',
                }
            }

            return {
                success: true
            }
        } catch (error) {
            logger.error(`Une erreur est survenue de la validation du numero de la facture depuis validateLatestInvoiceNumber de InvoiceNumberValidator.ts`, {
                msg: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'Unknown stack'
            });

            throw error;
        }
    }
}

export default new InvoiceLastNumberValidator();