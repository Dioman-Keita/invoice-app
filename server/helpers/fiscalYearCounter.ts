import database from "../config/database";
import logger from "../utils/Logger";
import { getSetting } from "./settings";

export async function initializeFiscalYearCounter(fiscalYear: string): Promise<void> {
  try {
    const fiscalYearNum = Number(fiscalYear);
    const currentYear = new Date().getFullYear();

    if (fiscalYearNum < currentYear) {
      throw new Error(`Impossible d'initialiser un compteur pour une année antérieure (${fiscalYear}).`);
    }

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
      logger.info(`Compteur existant pour ${fiscalYear} existe déjà`);
    }
  } catch (error) {
    logger.error("Erreur lors de l'initialisation du compteur fiscal", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'Unknown stack',
      fiscalYear,
    });
    throw error;
  }
}

export async function getCurrentFiscalYearCounter(): Promise<{ fiscal_year: string; last_cmdt_number: number }> {
  try {
    const fiscalYear = await getSetting('fiscal_year');
    const rows = await database.execute<{fiscal_year: string; last_cmdt_number: number}[]>(
      "SELECT fiscal_year, last_cmdt_number FROM fiscal_year_counter WHERE fiscal_year = ? LIMIT 1",
      [fiscalYear]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      return {
        fiscal_year: rows[0].fiscal_year,
        last_cmdt_number: Number(rows[0].last_cmdt_number)
      };
    }

    await initializeFiscalYearCounter(fiscalYear);
    return { fiscal_year: fiscalYear, last_cmdt_number: 0};
  } catch (error) {
    logger.error("Erreur lors de la récupération du compteur fiscal", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'Unknown stack',
    });
    throw error;
  }
}

export async function updateCmdtCounter(invoiceNumber: string): Promise<void> {
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

export async function getFiscalYearHistory(): Promise<Array<{fiscal_year: string; last_cmdt_number: number}>> {
  try {
    const rows = await database.execute<{fiscal_year: string; last_cmdt_number: number}[]> (
      "SELECT fiscal_year, last_cmdt_number FROM fiscal_year_counter ORDER BY fiscal_year DESC"
    );
    return rows.map(row => ({
      ...row,
      last_cmdt_number: Number(row.last_cmdt_number)
    }));
  } catch (error) {
    logger.error("Erreur lors de la récupération de l'historique fiscal", {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return [];
  }
}

export async function checkYearEndThresholdWarning(): Promise<{
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
    const counter = await getCurrentFiscalYearCounter();

    const remaining = config.max - Number(counter.last_cmdt_number);
    const warning = remaining <= threshold;

    if (warning) {
      logger.warn(`Seuil d'alerte atteint pour ${fiscalYear}: ${counter.last_cmdt_number}/${config.max}. Il reste ${remaining} numéros`);
    }

    return {
      warning,
      remaining,
      threshold,
      max: config.max,
      lastNumber: Number(counter.last_cmdt_number),
      fiscalYear
    };
  } catch (error) {
    logger.error("Erreur lors du contrôle du seuil de fin d'année", {
      msg: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'Unknown stack'
    });
    throw error;
  }
}
