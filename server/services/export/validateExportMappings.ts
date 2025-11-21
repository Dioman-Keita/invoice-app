import logger from '../../utils/Logger';
import { ExportSchemas } from './schemas';
import {
  mapInvoiceListOdt,
  mapInvoiceListXlsx,
  mapRelationalListOdt,
  mapRelationalListXlsx,
  mapSupplierListOdt,
  mapSupplierListXlsx,
  mapInvoiceOverviewOdt,
  mapInvoiceOverviewXlsx,
  mapSupplierOverviewOdt,
  mapSupplierOverviewXlsx,
  mapRelationalOverviewOdt,
  mapRelationalOverviewXlsx,
} from './mappers';
import type { DateRange } from './types';

async function main() {
  const dateRange: DateRange = { dateFrom: '2023-01-01', dateTo: '2025-01-01' };
  const rows: any[] = [];
  const detail: any = {}; // minimal, mappers fill optional fields correctly

  type Case = { name: string; key: keyof typeof ExportSchemas; payload: any };

  const cases: Case[] = [
    // LIST - ODT
    { name: 'invoice-list_odt', key: 'invoice-list_odt', payload: mapInvoiceListOdt(rows, dateRange) },
    { name: 'supplier-list_odt', key: 'supplier-list_odt', payload: mapSupplierListOdt(rows, dateRange) },
    { name: 'relational-list_odt', key: 'relational-list_odt', payload: mapRelationalListOdt(rows, dateRange) },

    // LIST - XLSX (controller ajoute dateFrom/dateTo, mais schéma les rend optionnels)
    { name: 'invoice-list_xlsx', key: 'invoice-list_xlsx', payload: { ...mapInvoiceListXlsx(rows, undefined), dateFrom: dateRange.dateFrom, dateTo: dateRange.dateTo } },
    { name: 'supplier-list_xlsx', key: 'supplier-list_xlsx', payload: { ...mapSupplierListXlsx(rows, undefined), dateFrom: dateRange.dateFrom, dateTo: dateRange.dateTo } },
    { name: 'relational-list_xlsx', key: 'relational-list_xlsx', payload: { ...mapRelationalListXlsx(rows, undefined), dateFrom: dateRange.dateFrom, dateTo: dateRange.dateTo } },

    // OVERVIEW - ODT
    { name: 'invoice-overview_odt', key: 'invoice-overview_odt', payload: mapInvoiceOverviewOdt(detail) },
    { name: 'supplier-overview_odt', key: 'supplier-overview_odt', payload: mapSupplierOverviewOdt(detail) },
    { name: 'relational-overview_odt', key: 'relational-overview_odt', payload: mapRelationalOverviewOdt(detail) },

    // OVERVIEW - XLSX
    { name: 'invoice-overview_xlsx', key: 'invoice-overview_xlsx', payload: mapInvoiceOverviewXlsx(detail, dateRange, undefined) },
    { name: 'supplier-overview_xlsx', key: 'supplier-overview_xlsx', payload: mapSupplierOverviewXlsx(detail, dateRange, undefined) },
    { name: 'relational-overview_xlsx', key: 'relational-overview_xlsx', payload: mapRelationalOverviewXlsx(detail, dateRange, undefined) },
  ];

  let failures = 0;

  for (const c of cases) {
    try {
      const schema = ExportSchemas[c.key];
      schema.parse(c.payload);
      logger.info(`[validateExportMappings] OK: ${c.name}`);
    } catch (error: any) {
      failures += 1;
      logger.error(`[validateExportMappings] FAIL: ${c.name}`, { error: error?.message || error });
      console.error(`Validation failed for ${c.name}:`, error?.message || error);
    }
  }

  if (failures > 0) {
    logger.error(`[validateExportMappings] Completed with ${failures} failure(s)`);
    process.exitCode = 1;
  } else {
    logger.info('[validateExportMappings] All export mappings validated successfully');
  }
}

main().catch((err) => {
  logger.error('[validateExportMappings] Unexpected error', { err });
  process.exitCode = 1;
});
