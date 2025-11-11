import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';

// Lazy import Puppeteer to avoid loading cost during non-PDF code paths
async function getPuppeteer() {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const puppeteer = require('puppeteer');
	return puppeteer;
}

export interface HtmlRenderOptions {
	templateName: 'invoice' | 'supplier' | 'list';
	data: unknown;
}

export async function renderTemplateToHtml({ templateName, data }: HtmlRenderOptions): Promise<string> {
	const templateDir = path.join(__dirname, '..', 'templates');
	const filePath = path.join(templateDir, `${templateName}.hbs`);
	if (!fs.existsSync(filePath)) {
		throw new Error(`Template not found: ${filePath}`);
	}
	const templateSource = await fs.promises.readFile(filePath, 'utf8');
	const template = Handlebars.compile(templateSource, { noEscape: false });
	return template(data as Record<string, unknown>);
}

export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
	const puppeteer = await getPuppeteer();
	const browser = await puppeteer.launch({
		headless: 'new',
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	});
	try {
		const page = await browser.newPage();
		await page.setContent(html, { waitUntil: ['domcontentloaded', 'networkidle0'] });
		const buffer = await page.pdf({
			format: 'A4',
			printBackground: true,
			margin: { top: '20mm', right: '12mm', bottom: '20mm', left: '12mm' }
		});
		return buffer as Buffer;
	} finally {
		await browser.close();
	}
}

// Convenience: render by template name directly to PDF buffer
export async function renderTemplateToPdfBuffer(options: HtmlRenderOptions): Promise<Buffer> {
	const html = await renderTemplateToHtml(options);
	return await htmlToPdfBuffer(html);
}


