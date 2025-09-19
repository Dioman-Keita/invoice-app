import nodemailer, { Transporter } from 'nodemailer';

export type EmailRecipient = {
	to: string;
	name?: string;
};

export type EmailContent = {
	subject: string;
	html: string;
	text?: string;
};

export interface EmailSender {
	send(recipient: EmailRecipient, content: EmailContent): Promise<void>;
}

export class GmailEmailSender implements EmailSender {
	private transporter: Transporter;

	constructor(
		private readonly gmailUser: string = process.env.GMAIL_USER as string,
		private readonly gmailPass: string = process.env.GMAIL_PASS as string,
	) {
		if (!this.gmailUser || !this.gmailPass) {
			throw new Error('GMAIL_USER and GMAIL_PASS must be set');
		}
		
		this.transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: this.gmailUser,
				pass: this.gmailPass,
			},
		});
	}

	async send(recipient: EmailRecipient, content: EmailContent): Promise<void> {
		await this.transporter.sendMail({
			from: {
				name: 'CMDT Gestion des factures',
				address: this.gmailUser,
			},
			to: recipient.to,
			subject: content.subject,
			html: content.html,
			text: content.text,
		});
	}
}


