import type { Request, Response } from 'express';
import ApiResponder from '../utils/ApiResponder';
import logger from '../utils/Logger';
import database from '../config/database';
import InvoiceLastNumberValidator from '../core/rules/InvoiceNumberRule';
import { getSetting } from "../helpers/settings";
import { AuthenticatedRequest } from '../types/express/request';

export async function getFiscalSettingsInfo(req: AuthenticatedRequest, res: Response): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const user = req.user;
    if (!user) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');

    // Read parameters
    const fiscalYear = await getSetting('fiscal_year');
    const cmdtFormat = await getSetting('cmdt_format');
    const autoYearSwitch = await getSetting('auto_year_switch');
    const threshold = await getSetting('year_end_warning_threshold');
    const appVersion = await getSetting('app_version');

    // Current counter + warning
    const counter = await InvoiceLastNumberValidator.getCurrentFiscalYearCounter();
    const warningInfo = await InvoiceLastNumberValidator.checkYearEndThresholdWarning();

    const remaining = cmdtFormat.max - counter.last_cmdt_number;

    // Available years (current + future)
    const available = await InvoiceLastNumberValidator.getAvailableFiscalYears();

    return ApiResponder.success(res, {
      fiscalYear,
      cmdt_format: cmdtFormat,
      auto_year_switch: autoYearSwitch,
      year_end_warning_threshold: threshold,
      app_version: appVersion,
      counter: {
        fiscal_year: counter.fiscal_year,
        last_cmdt_number: counter.last_cmdt_number,
        remaining,
        max: cmdtFormat.max
      },
      availableYears: available,
      warningInfo
    });
  } catch (err) {
    logger.error(`[${requestId}] Error getFiscalSettingsInfo`, {
      error: err instanceof Error ? err.message : 'unknown'
    });
    return ApiResponder.error(res, err);
  }
}

export async function setAutoYearSwitch(req: AuthenticatedRequest, res: Response): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const user = req.user;
    if (!user) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');

    const { enable } = req.body as { enable?: boolean };
    if (typeof enable !== 'boolean') {
      return ApiResponder.badRequest(res, 'Paramètre "enable" (boolean) requis');
    }

    await database.execute(
      "UPDATE app_settings SET setting_value = ? WHERE setting_key = 'auto_year_switch'",
      [JSON.stringify(enable)]
    );

    let updatedFiscalYear = await getSetting('fiscal_year');

    // If auto-switch is enabled, reset fiscal year to current system year
    if (enable === true) {
      const systemYear = new Date().getFullYear().toString();
      if (updatedFiscalYear !== systemYear) {
        await database.execute(
          "UPDATE app_settings SET setting_value = ? WHERE setting_key = 'fiscal_year'",
          [JSON.stringify(systemYear)]
        );

        // Initialize current year counter if it doesn't exist
        await InvoiceLastNumberValidator.initializeFiscalYearCounter(systemYear);
        updatedFiscalYear = systemYear;
        logger.info(`[${requestId}] auto_year_switch enabled: fiscal_year reset to ${systemYear}`);
      }
    }

    // Reconstitute a minimal snapshot for the client
    const cmdtFormat = await getSetting('cmdt_format');
    const counter = await InvoiceLastNumberValidator.getCurrentFiscalYearCounter();

    logger.info(`[${requestId}] auto_year_switch set to ${enable}`);
    return ApiResponder.success(res, {
      auto_year_switch: enable,
      fiscalYear: updatedFiscalYear,
      counter,
      cmdt_format: cmdtFormat
    }, 'Paramètre mis à jour');
  } catch (err) {
    logger.error(`[${requestId}] Error setAutoYearSwitch`, {
      error: err instanceof Error ? err.message : 'unknown'
    });
    return ApiResponder.error(res, err);
  }
}

export async function manualFiscalYearSwitch(req: AuthenticatedRequest, res: Response): Promise<Response> {
  const requestId = req.headers['x-request-id'] || 'unknown';
  try {
    const user = req.user;
    if (!user) return ApiResponder.unauthorized(res, 'Utilisateur non authentifié');

    const { newYear } = req.body as { newYear?: string };
    if (!newYear) {
      return ApiResponder.badRequest(res, "Le champ 'newYear' est requis");
    }

    const result = await InvoiceLastNumberValidator.manualFiscalYearSwitch(newYear);

    if (!result.success) {
      return ApiResponder.badRequest(res, result.message);
    }

    return ApiResponder.success(res, { newYear }, result.message);
  } catch (err) {
    logger.error(`[${requestId}] Error manualFiscalYearSwitch`, {
      error: err instanceof Error ? err.message : 'unknown'
    });
    return ApiResponder.error(res, err);
  }
}
