/* Simple smoke checks for PDF/Excel generation without running the server */
import { renderTemplateToPdfBuffer } from '../utils/htmlPdfRenderer';
import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - ExcelJS is used indirectly in app; here we avoid heavy imports
import ExcelJS from 'exceljs';

async function run() {
	const outDir = path.join(__dirname, '../../.smoke-artifacts');
	await fs.promises.mkdir(outDir, { recursive: true });

	// PDF from HTML template (invoice)
	const pdfBuf = await renderTemplateToPdfBuffer({
		templateName: 'invoice',
		data: {
			id: 'INV-001',
			num_cmdt: 'CMDT-2025-0001',
			num_invoice: 'F-0001',
			supplier_name: 'ACME SARL',
			invoice_arr_date: '11/11/2025',
			amount: '1 000 000 FCFA',
			dfc_status: 'Approuvé',
			_generated_at: new Date().toLocaleString('fr-FR')
		}
	});
	await fs.promises.writeFile(path.join(outDir, 'invoice.html.pdf'), pdfBuf);

	// Excel simple buffer using ExcelJS directly
	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet('Export');
	sheet.addRow(['Référence', 'Fournisseur', 'Montant']);
	sheet.addRow(['INV-001', 'ACME SARL', 1000000]);
	const xlsx = await workbook.xlsx.writeBuffer();
	await fs.promises.writeFile(path.join(outDir, 'list.xlsx'), Buffer.from(xlsx));

	// Basic assertions by size
	if (pdfBuf.length < 1000) throw new Error('PDF seems too small');
	if ((xlsx as ArrayBuffer).byteLength < 1000) throw new Error('XLSX seems too small');
	// eslint-disable-next-line no-console
	console.log('Smoke artifacts written to', outDir);
}

run().catch((e) => {
	// eslint-disable-next-line no-console
	console.error(e);
	process.exit(1);
});


