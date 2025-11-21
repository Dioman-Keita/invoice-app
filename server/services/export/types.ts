export type ExportType = 'invoice' | 'supplier' | 'relational';
export type ExportVariant = 'list' | 'overview';
export type ExportFormat = 'odt' | 'xlsx' | 'pdf';

export interface ExportRequest {
  type: ExportType;
  variant: ExportVariant;
  format: ExportFormat;
  search: Record<string, any>;
}

export interface ExportTemplateInfo {
  key: string;
  path: string;
}

export interface DateRange {
  dateFrom?: string;
  dateTo?: string;
}
