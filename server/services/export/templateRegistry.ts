import path from 'path';
import { ExportFormat, ExportTemplateInfo, ExportType, ExportVariant } from './types';

export function getTemplateInfo(type: ExportType, variant: ExportVariant, format: ExportFormat): ExportTemplateInfo {
  const key = `${type}-${variant}_${format === 'pdf' ? 'odt' : format}` as const;
  
  // CORRECTION ICI :
  // 1. Si la variable d'env existe (Mode Electron), on l'utilise.
  // 2. Sinon (Mode Dev classique), on garde ton ancien calcul relatif.
  const baseDir = process.env.SERVER_TEMPLATES_PATH 
    ? process.env.SERVER_TEMPLATES_PATH 
    : path.resolve(__dirname, '..', '..', 'templates');

  // Log pour le débogage (optionnel, s'affichera dans main.log)
  console.log(`[EXPORT] Looking for templates in: ${baseDir}`);

  const filename = (() => {
    switch (key) {
      case 'invoice-list_odt': return 'odt/invoice/invoice-list.odt';
      case 'invoice-overview_odt': return 'odt/invoice/invoice-overview.odt';
      case 'supplier-list_odt': return 'odt/supplier/supplier-list.odt';
      case 'supplier-overview_odt': return 'odt/supplier/supplier-overview.odt';
      case 'relational-list_odt': return 'odt/relational/relational-list.odt';
      case 'relational-overview_odt': return 'odt/relational/relational-overview.odt';
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