import * as path from 'path';
import * as carbone from 'carbone';
import { ExportFormat, ExportTemplateInfo } from './types';
import { ExportSchemas } from './schemas';
import logger from '../../utils/Logger';

let loPathInjected = false;
function ensureLibreOfficeOnPath() {
  if (loPathInjected) return;
  const loDir = process.env.LIBREOFFICE_PATH; // e.g. C:\\Program Files\\LibreOffice\\program
  if (loDir && typeof loDir === 'string' && loDir.trim().length > 0) {
    const sep = process.platform === 'win32' ? ';' : ':';
    const current = process.env.PATH || '';
    if (!current.split(sep).some((p) => p.toLowerCase() === loDir.toLowerCase())) {
      process.env.PATH = `${loDir}${sep}${current}`;
      logger.info('LIBREOFFICE_PATH injected into PATH for Carbone PDF conversion', { loDir });
    } else {
      logger.debug('LIBREOFFICE_PATH already present in PATH');
    }
  } else {
    logger.debug('LIBREOFFICE_PATH not set; relying on system PATH for soffice');
  }
  loPathInjected = true;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// Simple in-process queue to serialize PDF conversions (LibreOffice can be flaky under concurrency on Windows)
let pdfQueue: Promise<void> = Promise.resolve();
async function enqueuePdf<T>(fn: () => Promise<T>): Promise<T> {
  let release!: () => void;
  const next = new Promise<void>((r) => { release = r; });
  const prev = pdfQueue;
  pdfQueue = pdfQueue.then(() => next).catch(() => next); // keep chain even on error
  await prev; // wait previous job
  try {
    return await fn();
  } finally {
    release();
  }
}

export async function renderWithCarbone(template: ExportTemplateInfo, data: any, format: ExportFormat): Promise<{ buffer: Buffer; filename: string }>{
  ensureLibreOfficeOnPath();
  const absoluteTemplatePath = path.resolve(template.path);
  const convertTo = format === 'pdf' ? 'pdf' : (format === 'odt' ? 'odt' : 'xlsx');
  // Validate against schema if available
  const schema = (ExportSchemas as any)[template.key];
  if (schema) {
    try {
      // Will throw if invalid
      (schema as any).parse(data);
    } catch (e: any) {
      const msg = e?.message || 'Invalid export data';
      throw new Error(`Export data validation failed for ${template.key}: ${msg}`);
    }
  }
  const maxAttempts = convertTo === 'pdf' ? (parseInt(process.env.EXPORT_PDF_MAX_ATTEMPTS || '3', 10) || 3) : 1;
  let attempt = 0;
  let lastError: any;
  const doRender = async (): Promise<{ buffer: Buffer; filename: string }> => {
    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        const result: Buffer = await new Promise((resolve, reject) => {
          carbone.render(absoluteTemplatePath, data, { convertTo, timezone: 'Africa/Bamako', lang: 'fr' }, (err: any, res: Buffer) => {
            if (err) return reject(err);
            resolve(res);
          });
        });
        const base = path.basename(absoluteTemplatePath, path.extname(absoluteTemplatePath));
        const ext = convertTo === 'pdf' ? 'pdf' : (convertTo === 'xlsx' ? 'xlsx' : 'odt');
        return { buffer: result, filename: `${base}_${Date.now()}.${ext}` };
      } catch (err: any) {
        lastError = err;
        if (convertTo !== 'pdf' || attempt >= maxAttempts) {
          // Enhance non-retriable or final failure
          if (convertTo === 'pdf') {
            const hint = `PDF conversion requires LibreOffice (soffice). ` +
              `Install LibreOffice and ensure soffice is available on PATH, or set LIBREOFFICE_PATH to the 'program' directory. ` +
              `(platform=${process.platform}, LIBREOFFICE_PATH=${process.env.LIBREOFFICE_PATH ? 'set' : 'not set'})`;
            const enhanced = new Error(`PDF conversion failed: ${err?.message || err}. ${hint}`);
            logger.error('Carbone PDF conversion failed', { attempt, maxAttempts, error: err?.message || err, platform: process.platform, LIBREOFFICE_PATH: process.env.LIBREOFFICE_PATH || null });
            throw enhanced;
          }
          throw err;
        }
        const baseBackoff = parseInt(process.env.EXPORT_PDF_BACKOFF_MS || '250', 10) || 250;
        const backoff = baseBackoff * attempt; // e.g., 250ms, 500ms, 750ms
        logger.warn('Retrying PDF conversion after failure', { attempt, backoffMs: backoff, error: err?.message || err });
        await sleep(backoff);
      }
    }
    throw lastError;
  };
  if (convertTo === 'pdf') {
    // Serialize PDF conversions
    return enqueuePdf(doRender);
  }
  return doRender();
}
