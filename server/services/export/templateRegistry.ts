import path from 'path';
import { ExportFormat, ExportTemplateInfo, ExportType, ExportVariant } from './types';

export function getTemplateInfo(type: ExportType, variant: ExportVariant, format: ExportFormat): ExportTemplateInfo {
  const key = `${type}-${variant}_${format === 'pdf' ? 'odt' : format}` as const;

  // CORRECTION here :
  // 1. If the env variable exists (Electron mode), we use it.
  // 2. Otherwise (Classic dev mode), we keep your relative calculation.
  const baseDir = process.env.SERVER_TEMPLATES_PATH
    ? process.env.SERVER_TEMPLATES_PATH
    : path.resolve(__dirname, '..', '..', 'templates');

  // Log for debugging (optional, will be displayed in main.log)
  console.log(`[EXPORT] Looking for templates in: ${baseDir}`);

  const filename = (() => {
    switch (key) {
      case 'invoice-list_odt': return 'odt/invoice/invoice-list.odt';
      case 'invoice-overview_odt': return 'odt/invoice/invoice-overview.odt';
      case 'supplier-list_odt': return 'odt/supplier/supplier-list.odt';
      case 'supplier-overview_odt': return 'odt/supplier/supplier-overview.odt';
      case 'relational-list_odt': return 'odt/relational/relational-list.odt';
      case 'relational-overview_odt': return 'odt/relational/relational-overview.odt';
      case 'invoice-stats_odt': return 'odt/stats/invoice-stats.odt';
      case 'invoice-list_xlsx': return 'excel/invoice/invoice-list.xlsx';
      case 'invoice-overview_xlsx': return 'excel/invoice/invoice-overview.xlsx';
      case 'supplier-list_xlsx': return 'excel/supplier/supplier-list.xlsx';
      case 'supplier-overview_xlsx': return 'excel/supplier/supplier-overview.xlsx';
      case 'relational-list_xlsx': return 'excel/relational/relational-list.xlsx';
      case 'relational-overview_xlsx': return 'excel/relational/relational-overview.xlsx';
      default: return '';
    }
  })();

  return { key, path: path.join(baseDir, filename) };
}