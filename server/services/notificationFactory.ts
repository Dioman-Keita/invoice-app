export type NotificationKind = 'register' | 'reset' | 'generic';

export interface NotificationPayload {
	name?: string;
	email?: string;
	link?: string; // verification or reset link
	token?: string; // optional token to embed
}

export interface NotificationTemplate {
	subject: string;
	html: string;
	text?: string;
}

export class NotificationFactory {
	static create(kind: NotificationKind, payload: NotificationPayload): NotificationTemplate {
		switch (kind) {
			case 'register':
				return NotificationFactory.registerTemplate(payload);
			case 'reset':
				return NotificationFactory.resetTemplate(payload);
			default:
				return NotificationFactory.genericTemplate(payload);
		}
	}

	private static registerTemplate({ name, link, token }: NotificationPayload): NotificationTemplate {
		const subject = 'Bienvenue sur CMDT - Vérification de votre compte';
		const actionLink = link ? link : '#';
		const safeName = name ? name : 'Cher utilisateur';
		const html = `
			<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
				<tr><td align="center">
					<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.06); overflow:hidden;">
						<tr>
							<td style="padding:24px 24px 0 24px; font-size:16px; color:#0f172a;">
								<p>Bonjour ${safeName},</p>
								<p>Merci de vous être inscrit. Veuillez vérifier votre adresse email pour activer votre compte.</p>
							</td>
						</tr>
						<tr>
							<td style="padding:16px 24px 24px 24px;">
								<a href="${actionLink}" style="display:inline-block; background:#0ea5e9; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:6px;">Vérifier mon compte</a>
								${token ? `<p style="font-size:12px; color:#64748b; margin-top:12px;">Code: ${token}</p>` : ''}
							</td>
						</tr>
					</table>
				</td></tr>
			</table>
		`;
		const text = `Bonjour ${safeName}, allez à ${actionLink} pour vérifier votre compte.${token ? ' Code: ' + token : ''}`;
		return { subject, html, text };
	}

	private static resetTemplate({ name, link, token }: NotificationPayload): NotificationTemplate {
		const subject = 'CMDT - Réinitialisation de mot de passe';
		const actionLink = link ? link : '#';
		const safeName = name ? name : 'Cher utilisateur';
		const html = `
			<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
				<tr><td align="center">
					<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.06); overflow:hidden;">
						<tr>
							<td style="padding:24px 24px 0 24px; font-size:16px; color:#0f172a;">
								<p>Bonjour ${safeName},</p>
								<p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour continuer.</p>
							</td>
						</tr>
						<tr>
							<td style="padding:16px 24px 24px 24px;">
								<a href="${actionLink}" style="display:inline-block; background:#16a34a; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:6px;">Réinitialiser le mot de passe</a>
								${token ? `<p style="font-size:12px; color:#64748b; margin-top:12px;">Code: ${token}</p>` : ''}
							</td>
						</tr>
					</table>
				</td></tr>
			</table>
		`;
		const text = `Bonjour ${safeName}, allez à ${actionLink} pour réinitialiser votre mot de passe.${token ? ' Code: ' + token : ''}`;
		return { subject, html, text };
	}

	private static genericTemplate({ name, link, token }: NotificationPayload): NotificationTemplate {
		const subject = 'CMDT Notification';
		const html = `<p>${name ? 'Bonjour ' + name + ',' : 'Bonjour,'}</p><p>Consultez ce lien: ${link ?? '#'}</p>${token ? `<p>Code: ${token}</p>` : ''}`;
		const text = `${name ? 'Bonjour ' + name + ',' : 'Bonjour,'} Consultez ${link ?? '#'} ${token ? ' Code: ' + token : ''}`;
		return { subject, html, text };
	}
}


