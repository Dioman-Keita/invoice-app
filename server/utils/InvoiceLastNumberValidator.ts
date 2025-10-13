import database from "../config/database";
import logger from "./Logger";

type AppSettingMap = {
    fiscal_year: string;
    cmdt_format: {
        padding: number;
        max: number;
    };
    year_end_warning_threshold: number;
    auto_year_switch: boolean;
};

export async function getSetting<K extends keyof AppSettingMap>(key: K): Promise<AppSettingMap[K]> {
    const rows = await database.execute<{setting_value: string}[]>(
        "SELECT setting_value FROM app_settings WHERE setting_key = ? LIMIT 1",
        [key]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
        logger.warn(`Clé de configuration "${key}" introuvable dans app_settings`);
        throw new Error(`Clé de configuration "${key}" introuvable dans app_settings`)
    }
    return JSON.parse(rows[0].setting_value);
}

function isValidCmdtFormat(value: string, padding: number): boolean {
    const regex = new RegExp(`^\\d{${padding}}$`);
    return regex.test(value);
}

class InvoiceLastNumberValidator {

    async checkAndUpdateFiscalYear(): Promise<{changed: boolean, newYear?: string}> {
        try {
            const currentYear = new Date().getFullYear().toString();
            const currentFiscalYear = await getSetting('fiscal_year');
            const autoSwitch = await getSetting('auto_year_switch');

            if (currentYear !== currentFiscalYear && Boolean(autoSwitch)) {
                await database.execute(
                    "UPDATE app_settings SET setting_value = ? WHERE setting_key = 'fiscal_year'",
                    [JSON.stringify(currentYear)]
                );

                await this.initializeFiscalYearCounter(currentYear);

                logger.info(`Changement automatique d'année fiscale: ${currentFiscalYear} -> ${currentYear}`);

                return { changed: true, newYear: currentYear };
            }

            return { changed: false }
        } catch (error) {
            logger.error('Erreur lors de la vérification de l\'année fiscale', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return { changed: false };
        }
    }

    async initializeFiscalYearCounter(fiscalYear: string): Promise<void> {
        try {
            const fiscalYearNum = Number(fiscalYear);
            const currentYear = new Date().getFullYear();
    
            // LOGIQUE MÉTIER : Autoriser années courante et future uniquement
            if (fiscalYearNum < currentYear) {
                throw new Error(`Impossible d'initialiser un compteur pour une année antérieure (${fiscalYear}).`);
            }
    
            // Vérifier si le compteur existe déjà
            const existing = await database.execute(
                "SELECT id FROM fiscal_year_counter WHERE fiscal_year = ?",
                [fiscalYear]
            );
    
            if (!Array.isArray(existing) || existing.length === 0) {
                await database.execute(
                    "INSERT INTO fiscal_year_counter (fiscal_year, last_cmdt_number) VALUES (?, 0)",
                    [fiscalYear]
                );
    
                logger.info(`Compteur initialisé pour l'année fiscale ${fiscalYear}`);
            } else {
                logger.info(`Compteur pour ${fiscalYear} existe déjà`);
            }
        } catch (error) {
            logger.error('Erreur lors de l\'initialisation du compteur fiscal', {
                error: error instanceof Error ? error.message : 'Unknown error',
                fiscalYear
            });
            throw error;
        }
    }

    async getCurrentFiscalYearCounter(): Promise<{ fiscal_year: string; last_cmdt_number: number }> {
        try {
            const fiscalYear = await getSetting('fiscal_year');
            const rows = await database.execute<{fiscal_year: string; last_cmdt_number: number}[]>(
                "SELECT fiscal_year, last_cmdt_number FROM fiscal_year_counter WHERE fiscal_year = ? LIMIT 1",
                [fiscalYear]
            );

            if (Array.isArray(rows) && rows.length > 0) {
                return {
                    fiscal_year: rows[0].fiscal_year,
                    last_cmdt_number: rows[0].last_cmdt_number
                };
            }

            await this.initializeFiscalYearCounter(fiscalYear);
            return { fiscal_year: fiscalYear, last_cmdt_number: 0};
        } catch (error) {
            logger.error('Erreur lors de la récupération du compteur fiscal', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    async getNextCmdtNumber(): Promise<{ success: boolean; nextNumber: string; errorMessage?: string }> {
        try {
            await this.checkAndUpdateFiscalYear();

            const config = await getSetting('cmdt_format');
            const counter = await this.getCurrentFiscalYearCounter();

            if (counter.last_cmdt_number >= config.max) {
                return {
                    success: false,
                    nextNumber: '0000',
                    errorMessage: `Seuil "${config.max}" atteint pour l'année fiscal ${counter.fiscal_year}.`
                };
            }

            const nextNumber = counter.last_cmdt_number + 1;
            const nextNumberStr = nextNumber.toString().padStart(config.padding, '0');

            return { success: true, nextNumber: nextNumberStr };
        } catch (error) {
            logger.error('Erreur lors de la génération du prochain numéro CMDT attendu', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            throw error;
        }
    }
    
    async updateCmdtCounter(invoiceNumber: string): Promise<void> {
        try {
            const fiscalYear = await getSetting('fiscal_year');
            const numberValue = parseInt(invoiceNumber);

            await database.execute(
                "UPDATE fiscal_year_counter SET last_cmdt_number = ? WHERE fiscal_year = ?",
                [numberValue, fiscalYear]
            );

            logger.info(`Compteur CMDT mis à jour: ${invoiceNumber} pour l'année ${fiscalYear}`);
        } catch (error) {
            logger.error('Erreur lors de la mise à jour du compteur CMDT', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    async calculateNextNumberExpected(): Promise<{
        success: boolean;
        nextNumberExpected: string;
        fiscalYear: string;
        errorMessage?: string;
    }> {
        try {
            const result = await this.getNextCmdtNumber();
            const fiscalYear = await getSetting('fiscal_year');

            return {
                ...result,
                fiscalYear,
                nextNumberExpected: result.nextNumber
            };
        } catch (error) {
            logger.error(`Erreur lors du calcul du prochain numéro`, {
                msg: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'Unknown stack'
            });
            throw error;
        }
    }

    async validateInvoiceNumberExpected(invoiceNumber: string): Promise<{
        isValid: boolean;
        errorMessage?: string;
        nextNumberExpected?: string;
        fiscalYear?: string;
    }> {
        try {
            const fiscalYear = await getSetting('fiscal_year');
            const config = await getSetting('cmdt_format');
            const result = await this.calculateNextNumberExpected();

            if (!result.success) {
                return {
                    isValid: false,
                    errorMessage: result.errorMessage || 'Une erreur est survenue lors du calcul du prochain numéro CMDT de facture',
                    nextNumberExpected: '0000',
                    fiscalYear
                }
            };

            if (!isValidCmdtFormat(invoiceNumber, config.padding)) {
                return {
                    isValid: false,
                    errorMessage: `Format invalide. Format attendu : ${'0'.repeat(config.padding)} (ex 0039)`,
                    nextNumberExpected: result.nextNumberExpected,
                    fiscalYear
                };
            }

            const isInvoiceNumberExist = await database.execute(
                `SELECT i.* FROM invoice i
                WHERE i.num_cmdt = ?
                AND EXISTS (
                    SELECT 1 FROM app_settings a
                    WHERE a.setting_key = 'fiscal_year'
                    AND JSON_UNQUOTE(a.setting_value) = ?
                )`,
                [invoiceNumber, fiscalYear]
            );

            if (Array.isArray(isInvoiceNumberExist) && isInvoiceNumberExist.length > 0) {
                return {
                    isValid: false,
                    errorMessage: `Ce numéro de facture est déjà utilisé pour l'anneé ${fiscalYear}. Numéro suggéré "${result.nextNumberExpected}"`,
                    nextNumberExpected: result.nextNumberExpected,
                    fiscalYear
                };
            }

            if (invoiceNumber !== result.nextNumberExpected) {
                return {
                    isValid: false,
                    errorMessage: `Numéro de facture invalide. Le numéro attendu pour ${fiscalYear} est "${result.nextNumberExpected}"`,
                    nextNumberExpected: result.nextNumberExpected,
                    fiscalYear
                };
            }

            return {
                isValid: true,
                nextNumberExpected: result.nextNumberExpected,
                fiscalYear
            };

        } catch (error) {
            logger.error(`Erreur lors de la validation du numéro de facture`, {
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
        fiscalYear: string
    }> {
        try {
            const config = await getSetting('cmdt_format');
            const threshold = await getSetting('year_end_warning_threshold');
            const fiscalYear = await getSetting('fiscal_year');
            const counter = await this.getCurrentFiscalYearCounter();

            const remaining = config.max - counter.last_cmdt_number;
            const warning = remaining <= threshold;

            if (warning) {
                logger.warn(`Seuil d'alerte atteint pour ${fiscalYear}: ${counter.last_cmdt_number}/${config.max}. Il reste ${remaining} numéros`);
            }

            return {
                warning,
                remaining,
                threshold,
                max: config.max,
                lastNumber: counter.last_cmdt_number,
                fiscalYear
            };
        } catch (error) {
            logger.error(`Erreur lors du contrôle du seuil de fin d'année`, {
                msg: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'Unknown stack'
            });
            throw error;
        }
    }

    async manualFiscalYearSwitch(newYear: string): Promise<{ success: boolean; message: string }> {
        try {
            const currentFiscalYear = await getSetting('fiscal_year');
            const currentYear = new Date().getFullYear();
            const newYearNum = Number(newYear);
    
            // Validation basique
            if (newYear === currentFiscalYear) {
                return {
                    success: false,
                    message: `L'année fiscale est déjà définie sur ${newYear}`
                };
            }
    
            // LOGIQUE MÉTIER : Autoriser uniquement l'année courante ou future
            if (newYearNum < currentYear) {
                return {
                    success: false,
                    message: `Impossible de définir une année fiscale antérieure (${newYear}). Seules l'année courante (${currentYear}) et les années futures sont autorisées.`
                };
            }
    
            // Validation : l'année doit être raisonnable (pas trop dans le futur)
            if (newYearNum > currentYear + 1) {
                return {
                    success: false,
                    message: `Impossible de planifier une année fiscale au-delà de ${currentYear + 1}.`
                };
            }
    
            // ✅ MODIFICATION : Si le compteur existe déjà, c'est parfait !
            const existingCounter = await database.execute<{last_cmdt_number: number}[]>(
                "SELECT last_cmdt_number FROM fiscal_year_counter WHERE fiscal_year = ?",
                [newYear]
            );
    
            let counterInfo = "";
            
            if (Array.isArray(existingCounter) && existingCounter.length > 0) {
                const lastNumber = existingCounter[0].last_cmdt_number;
                counterInfo = ` Dernier numéro utilisé: ${lastNumber}.`;
            } else {
                // Initialiser le compteur seulement s'il n'existe pas
                await this.initializeFiscalYearCounter(newYear);
                counterInfo = " Nouveau compteur initialisé.";
            }
    
            // Mettre à jour l'année fiscale
            await database.execute(
                "UPDATE app_settings SET setting_value = ? WHERE setting_key = 'fiscal_year'",
                [JSON.stringify(newYear)]
            );
    
            logger.info(`Changement manuel d'année fiscale: ${currentFiscalYear} -> ${newYear}`);
    
            return {
                success: true,
                message: `Année fiscale changée avec succès vers ${newYear}.${counterInfo}`
            };
    
        } catch(error) {
            logger.error('Erreur lors du changement manuel d\'année fiscale', {
                error: error instanceof Error ? error.message : 'Unknown error',
                newYear
            });
            return {
                success: false,
                message: 'Erreur lors du changement d\'année fiscale'
            };
        }
    }
    
    async getFiscalYearHistory(): Promise<Promise<Array<{fiscal_year: string; last_cmdt_number: number}>>> {
        try {
            const rows = await database.execute<{fiscal_year: string; last_cmdt_number: number}[]> (
                "SELECT fiscal_year, last_cmdt_number FROM fiscal_year_counter ORDER BY fiscal_year DESC"
            );

            return Array.isArray(rows) ? rows : [];
        } catch (error) {
            logger.error('Erreur lors de la récupération de l\'historique fiscal', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
        }
    }

    async getAvailableFiscalYears(): Promise<Array<{ year: string; isCurrent: boolean; canActivate: boolean }>> {
        try {
            const currentYear = new Date().getFullYear();
            const currentFiscalYear = await getSetting('fiscal_year');
            
            const availableYears = [
                {
                    year: currentYear.toString(),
                    isCurrent: currentFiscalYear === currentYear.toString(),
                    canActivate: currentFiscalYear !== currentYear.toString()
                },
                {
                    year: (currentYear + 1).toString(),
                    isCurrent: currentFiscalYear === (currentYear + 1).toString(),
                    canActivate: true // Toujours autoriser l'année suivante
                }
            ];
    
            return availableYears;
        } catch (error) {
            logger.error('Erreur lors de la récupération des années disponibles', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return [];
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