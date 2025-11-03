import database from "../../config/database";
import logger from "../../utils/Logger";
import { getSetting } from "../../helpers/settings";
import isValidCmdtFormat from "../../helpers/cmdtFormat";
import { InvoiceCounterManager } from "../managers/InvoiceCounterManager";
import { EmployeeCounterManager } from "../managers/EmployeeCounterManager";

class InvoiceNumberRule {
    private invoiceCounter = new InvoiceCounterManager();
    private employeeCounter = new EmployeeCounterManager();

    async checkAndUpdateFiscalYear(): Promise<{changed: boolean, newYear?: string}> {
        try {
            const currentYear = new Date().getFullYear().toString();
            const currentFiscalYear = await getSetting('fiscal_year');
            const autoSwitch = await getSetting('auto_year_switch');

            if (currentYear !== currentFiscalYear && Boolean(autoSwitch)) {
                // Mettre à jour l'année fiscale
                await database.execute(
                    "UPDATE app_settings SET setting_value = ? WHERE setting_key = 'fiscal_year'",
                    [JSON.stringify(currentYear)]
                );

                // Initialiser les compteurs pour la nouvelle année
                await this.initializeFiscalYearCounter(currentYear);

                logger.info(`🔄 Changement automatique d'année fiscale: ${currentFiscalYear} -> ${currentYear}`);

                return { changed: true, newYear: currentYear };
            }

            return { changed: false };
        } catch (error) {
            logger.error('❌ Erreur lors de la vérification de l\'année fiscale', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'Unknown stack'
            });
            return { changed: false };
        }
    }

    async initializeFiscalYearCounter(fiscalYear: string): Promise<void> {
        try {
            // Initialiser les deux compteurs
            await this.invoiceCounter.initializeFiscalCounter(fiscalYear);
            await this.employeeCounter.initializeFiscalCounter(fiscalYear);

            logger.info(`✅ Compteurs fiscaux initialisés pour l'année ${fiscalYear}`);
        } catch (error) {
            logger.error(`❌ Erreur lors de l'initialisation des compteurs fiscaux pour ${fiscalYear}`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'Unknown stack'
            });
            throw error;
        }
    }

    async getCurrentFiscalYearCounter(): Promise<{ fiscal_year: string; last_cmdt_number: number }> {
        try {
            const fiscalYear = await getSetting('fiscal_year');
            const lastNumber = await this.invoiceCounter.getCurrentCounter(fiscalYear);

            return {
                fiscal_year: fiscalYear,
                last_cmdt_number: lastNumber
            };
        } catch (error) {
            logger.error("❌ Erreur lors de la récupération du compteur fiscal", {
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
                    errorMessage: `Seuil "${config.max}" atteint pour l'année fiscale ${counter.fiscal_year}.`
                };
            }

            const nextNumber = counter.last_cmdt_number + 1;
            const nextNumberStr = nextNumber.toString().padStart(config.padding, '0');

            return { success: true, nextNumber: nextNumberStr };
        } catch (error) {
            logger.error('❌ Erreur lors de la génération du prochain numéro CMDT', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }

    async updateCmdtCounter(invoiceNumber: string): Promise<void> {
        try {
            const fiscalYear = await getSetting('fiscal_year');
            const numberValue = parseInt(invoiceNumber);

            if (isNaN(numberValue)) {
                throw new Error(`Numéro de facture invalide: ${invoiceNumber}`);
            }

            await this.invoiceCounter.updateCounter(fiscalYear, numberValue);
            logger.info(`✅ Compteur CMDT mis à jour: ${invoiceNumber} pour l'année ${fiscalYear}`);
        } catch (error) {
            logger.error('❌ Erreur lors de la mise à jour du compteur CMDT', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'Unknown stack'
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
            logger.error(`❌ Erreur lors du calcul du prochain numéro attendu`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
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
                    errorMessage: result.errorMessage || 'Erreur lors du calcul du prochain numéro CMDT',
                    nextNumberExpected: '0000',
                    fiscalYear
                };
            }

            const invoiceNum = parseInt(invoiceNumber, 10);

            if (invoiceNum <= 999) {
                if (!isValidCmdtFormat(invoiceNumber, config.padding)) {
                    return {
                        isValid: false,
                        errorMessage: `Format invalide. Format attendu : ${'0'.repeat(config.padding)} (ex: 0039)`,
                        nextNumberExpected: result.nextNumberExpected,
                        fiscalYear
                    };
                }
            } else {
                if (isNaN(invoiceNum) || invoiceNum > config.max) {
                    return {
                        isValid: false,
                        errorMessage: `Numéro invalide. Doit être un nombre ≤ ${config.max}`,
                        nextNumberExpected: result.nextNumberExpected,
                        fiscalYear
                    };
                }
            }

            // Vérifier l'unicité
            const isInvoiceNumberExist = await database.execute(
                `SELECT id FROM invoice WHERE num_cmdt = ? AND fiscal_year = ?`,
                [invoiceNumber, fiscalYear]
            );

            if (Array.isArray(isInvoiceNumberExist) && isInvoiceNumberExist.length > 0) {
                return {
                    isValid: false,
                    errorMessage: `Numéro déjà utilisé pour ${fiscalYear}. Suggéré: "${result.nextNumberExpected}"`,
                    nextNumberExpected: result.nextNumberExpected,
                    fiscalYear
                };
            }

            if (invoiceNumber !== result.nextNumberExpected) {
                return {
                    isValid: false,
                    errorMessage: `Numéro invalide. Attendu: "${result.nextNumberExpected}" pour ${fiscalYear}`,
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
            logger.error(`❌ Erreur lors de la validation du numéro de facture`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
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
        fiscalYear: string;
    }> {
        try {
            const config = await getSetting('cmdt_format');
            const threshold = await getSetting('year_end_warning_threshold');
            const fiscalYear = await getSetting('fiscal_year');
            const counter = await this.getCurrentFiscalYearCounter();

            const remaining = config.max - counter.last_cmdt_number;
            const warning = remaining <= threshold;

            if (warning) {
                logger.warn(`⚠️ Seuil d'alerte atteint pour ${fiscalYear}: ${counter.last_cmdt_number}/${config.max}. Reste: ${remaining}`);
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
            logger.error("❌ Erreur lors du contrôle du seuil de fin d'année", {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }

    async manualFiscalYearSwitch(newYear: string): Promise<{ success: boolean; message: string }> {
        try {
            const currentFiscalYear = await getSetting('fiscal_year');
            const currentYear = new Date().getFullYear();
            const newYearNum = Number(newYear);
            const autoSwitch = await getSetting('auto_year_switch');

            if (Boolean(autoSwitch) !== false) {
                return {
                    success: false,
                    message: 'Changement manuel désactivé (mode automatique activé)'
                };
            }

            if (newYear === currentFiscalYear) {
                return {
                    success: false,
                    message: `Année fiscale déjà définie sur ${newYear}`
                };
            }

            if (newYearNum < currentYear) {
                return {
                    success: false,
                    message: `Impossible de définir une année antérieure (${newYear}). Années autorisées: ${currentYear}+`
                };
            }

            if (newYearNum > currentYear + 2) {
                return {
                    success: false,
                    message: `Impossible de planifier au-delà de ${currentYear + 2}`
                };
            }

            // Initialiser les compteurs pour la nouvelle année
            await this.initializeFiscalYearCounter(newYear);

            // Mettre à jour l'année fiscale
            await database.execute(
                "UPDATE app_settings SET setting_value = ? WHERE setting_key = 'fiscal_year'",
                [JSON.stringify(newYear)]
            );

            logger.info(`🔄 Changement manuel d'année fiscale: ${currentFiscalYear} -> ${newYear}`);
            return {
                success: true,
                message: `Année fiscale changée vers ${newYear}. Compteurs initialisés.`
            };

        } catch(error) {
            logger.error('❌ Erreur lors du changement manuel d\'année fiscale', {
                error: error instanceof Error ? error.message : 'Unknown error',
                newYear,
                stack: error instanceof Error ? error.stack : 'Unknown stack'
            });
            return {
                success: false,
                message: 'Erreur lors du changement d\'année fiscale'
            };
        }
    }

    async getFiscalYearHistory(): Promise<Array<{ fiscal_year: string; last_number: number }>> {
        return await this.invoiceCounter.getCounterHistory();
    }

    async getEmployeeCounterHistory(): Promise<Array<{fiscal_year: string; last_number: number}>> {
        return await this.employeeCounter.getCounterHistory();
    }

    async getAvailableFiscalYears(): Promise<Array<{ year: string; isCurrent: boolean; canActivate: boolean }>> {
        try {
            const currentSystemYear = new Date().getFullYear();
            const currentFiscalYear = await getSetting('fiscal_year');
            const currentYearNum = parseInt(currentFiscalYear, 10);

            const availableYears = [
                {
                    year: currentFiscalYear,
                    isCurrent: true,
                    canActivate: false
                },
                {
                    year: (currentYearNum + 1).toString(),
                    isCurrent: false,
                    canActivate: true
                },
                {
                    year: (currentYearNum + 2).toString(),
                    isCurrent: false,
                    canActivate: true
                }
            ];

            // Filtrer les années valides
            return availableYears.filter(item => {
                const yearNum = parseInt(item.year, 10);
                return yearNum >= currentSystemYear;
            });
        } catch (error) {
            logger.error('❌ Erreur lors de la récupération des années disponibles', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            return [];
        }
    }

    async validateInvoiceNumberUniqueness(invoiceNum: string): Promise<{success: boolean, errorMessage?: string}> {
        try {
            if (invoiceNum === '0' || invoiceNum === '' || invoiceNum === '0'.repeat(12)) {
                return {
                    success: false,
                    errorMessage: 'Le numéro de facture ne peut pas être "0"',
                };
            }

            const regex = /^(?!^0$)\d{1,12}$/;
            if(!regex.test(invoiceNum)) {
                return {
                    success: false,
                    errorMessage: 'Format invalide. 1 à 12 chiffres (0 au début autorisé)'
                };
            }

            const currentFiscalYear = await getSetting('fiscal_year');
            const result = await database.execute(
                `SELECT id FROM invoice WHERE num_invoice = ? AND fiscal_year = ?`,
                [invoiceNum, currentFiscalYear]
            );

            if (Array.isArray(result) && result.length > 0) {
                return {
                    success: false,
                    errorMessage: 'Une facture existe déjà avec ce numéro. Choisissez un autre.',
                };
            }

            return { success: true };
        } catch (error) {
            logger.error(`❌ Erreur lors de la validation de l'unicité du numéro de facture`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }
}

export default new InvoiceNumberRule();