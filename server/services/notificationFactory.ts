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

	// Logo SVG moderne inspiré Google
	private static logoSVG(): string {
		return `
			<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<rect width="60" height="60" rx="12" fill="#4285F4"/>
				<path d="M30 15C35.5228 15 40 19.4772 40 25C40 30.5228 35.5228 35 30 35C24.4772 35 20 30.5228 20 25C20 19.4772 24.4772 15 30 15Z" fill="#34A853"/>
				<path d="M45 25C45 31.6274 39.6274 37 33 37C26.3726 37 21 31.6274 21 25C21 18.3726 26.3726 13 33 13C39.6274 13 45 18.3726 45 25Z" fill="#FBBC05"/>
				<path d="M15 25C15 31.6274 20.3726 37 27 37C33.6274 37 39 31.6274 39 25C39 18.3726 33.6274 13 27 13C20.3726 13 15 18.3726 15 25Z" fill="#EA4335"/>
				<circle cx="30" cy="25" r="8" fill="#4285F4"/>
			</svg>
		`;
	}

	// Helper : si token existe, l'ajoute en query param au lien
	private static attachTokenToLink(link: string, token?: string): string {
		if (!token) return link;
		try {
			const url = new URL(link, 'http://localhost');
			if (!url.searchParams.has('token')) {
				url.searchParams.set('token', token);
			}
			if (/^https?:\/\//i.test(link)) return url.toString();
			return url.pathname + url.search + url.hash;
		} catch {
			return link + (link.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token);
		}
	}

	private static registerTemplate({ name, link, token }: NotificationPayload): NotificationTemplate {
		const subject = 'Bienvenue - Activez votre compte';
		const actionLink = link ?? '#';
		const actionLinkWithToken = this.attachTokenToLink(actionLink, token);
		const safeName = name ?? 'Cher utilisateur';

		const html = `
			<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
			<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
			<head>
				<title>${subject}</title>
				<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta name="x-apple-disable-message-reformatting">
				<meta http-equiv="X-UA-Compatible" content="IE=edge">
				<style type="text/css">
					body { margin: 0; padding: 0; background-color: #f8f9fa; color: #202124; font-family: 'Google Sans', Roboto, Helvetica, Arial, sans-serif; }
					@media screen and (max-width: 600px) {
						.container { width: 100% !important; }
						.mobile-hidden { display: none !important; }
						.mobile-full { width: 100% !important; }
						.content { padding: 20px 15px !important; }
					}
					@media (prefers-color-scheme: dark) {
						.body-dark { background-color: #202124 !important; }
						.card-dark { background-color: #303134 !important; border-color: #5f6368 !important; }
						.text-dark { color: #e8eaed !important; }
						.footer-dark { color: #9aa0a6 !important; }
					}
				</style>
			</head>
			<body style="margin:0;padding:0;background-color:#f8f9fa;color:#202124;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;" class="body-dark">
				<div style="display:none;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
					Activez votre compte en cliquant sur le lien de vérification
				</div>
				<table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
					<tr>
						<td align="center" style="padding:40px 0;">
							<table width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" class="container" style="background-color:#ffffff;border-radius:8px;border:1px solid #dadce0;overflow:hidden;" bgcolor="#ffffff" class="card-dark">
								<tr>
									<td align="center" style="padding:40px 0 20px;">
										${this.logoSVG()}
									</td>
								</tr>
								<tr>
									<td align="center" style="padding:0 40px 10px;font-size:24px;font-weight:500;line-height:32px;color:#202124;" class="text-dark">
										Bonjour ${safeName},
									</td>
								</tr>
								<tr>
									<td align="center" style="padding:0 40px 20px;font-size:20px;font-weight:400;line-height:28px;color:#5f6368;" class="text-dark">
										Activez votre compte pour commencer
									</td>
								</tr>
								<tr>
									<td align="center" style="padding:0 40px 30px;font-size:16px;line-height:24px;color:#5f6368;text-align:center;" class="text-dark">
										Pour finaliser la création de votre compte et accéder à tous nos services, veuillez vérifier votre adresse email.
									</td>
								</tr>
								<tr>
									<td align="center" style="padding:0 40px 30px;">
										<table border="0" cellpadding="0" cellspacing="0" role="presentation">
											<tr>
												<td align="center" style="border-radius:4px;background-color:#1a73e8;" bgcolor="#1a73e8">
													<a href="${actionLinkWithToken}" target="_blank" style="font-size:14px;font-weight:500;line-height:20px;text-decoration:none;display:inline-block;padding:10px 24px;color:#ffffff;">
														Vérifier mon compte
													</a>
												</td>
											</tr>
										</table>
									</td>
								</tr>
								${token ? `
								<tr>
									<td align="center" style="padding:0 40px 20px;font-size:14px;line-height:20px;color:#5f6368;background-color:#f8f9fa;border-radius:4px;margin:0 40px;border:1px solid #dadce0;" class="text-dark" bgcolor="#f8f9fa">
										<p style="margin:15px 0 5px;font-weight:500;">Code de vérification :</p>
										<p style="margin:0;font-size:18px;font-weight:700;letter-spacing:1px;font-family:monospace;">${token}</p>
									</td>
								</tr>
								` : ''}
								<tr>
									<td align="center" style="padding:0 40px 30px;font-size:14px;line-height:20px;color:#5f6368;" class="text-dark">
										<p style="margin:0 0 15px;">Si le bouton ne fonctionne pas, copiez et collez le lien ci-dessous dans votre navigateur :</p>
										<p style="margin:0;word-break:break-all;color:#1a73e8;">${actionLinkWithToken}</p>
									</td>
								</tr>
								<tr>
									<td style="padding:30px 40px;background-color:#f8f9fa;border-top:1px solid #dadce0;font-size:12px;line-height:18px;color:#5f6368;" class="footer-dark" bgcolor="#f8f9fa">
										<p style="margin:0 0 10px;">Vous recevez cet email parce que vous avez créé un compte sur notre plateforme.</p>
										<p style="margin:0 0 10px;">Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
										<p style="margin:0;">© ${new Date().getFullYear()} Notre Société. Tous droits réservés.</p>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
			</body>
			</html>
		`;

		const text = `Bonjour ${safeName},\n\nPour finaliser la création de votre compte et accéder à tous nos services, veuillez vérifier votre adresse email en cliquant sur le lien suivant :\n\n${actionLinkWithToken}\n\n${token ? 'Code de vérification : ' + token + '\n\n' : ''}Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.`;
		return { subject, html, text };
	}

	private static resetTemplate({ name, link, token }: NotificationPayload): NotificationTemplate {
		const subject = 'Réinitialisation de votre mot de passe';
		const actionLink = link ?? '#';
		const actionLinkWithToken = this.attachTokenToLink(actionLink, token);
		const safeName = name ?? 'Cher utilisateur';

		const html = `
			<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
			<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
			<head>
				<title>${subject}</title>
				<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta name="x-apple-disable-message-reformatting">
				<meta http-equiv="X-UA-Compatible" content="IE=edge">
				<style type="text/css">
					body { margin: 0; padding: 0; background-color: #f8f9fa; color: #202124; font-family: 'Google Sans', Roboto, Helvetica, Arial, sans-serif; }
					@media screen and (max-width: 600px) {
						.container { width: 100% !important; }
						.mobile-hidden { display: none !important; }
						.mobile-full { width: 100% !important; }
						.content { padding: 20px 15px !important; }
					}
					@media (prefers-color-scheme: dark) {
						.body-dark { background-color: #202124 !important; }
						.card-dark { background-color: #303134 !important; border-color: #5f6368 !important; }
						.text-dark { color: #e8eaed !important; }
						.footer-dark { color: #9aa0a6 !important; }
					}
				</style>
			</head>
			<body style="margin:0;padding:0;background-color:#f8f9fa;color:#202124;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;" class="body-dark">
				<div style="display:none;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
					Réinitialisez votre mot de passe en cliquant sur le lien de confirmation
				</div>
				<table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
					<tr>
						<td align="center" style="padding:40px 0;">
							<table width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" class="container" style="background-color:#ffffff;border-radius:8px;border:1px solid #dadce0;overflow:hidden;" bgcolor="#ffffff" class="card-dark">
								<tr>
									<td align="center" style="padding:40px 0 20px;">
										${this.logoSVG()}
									</td>
								</tr>
								<tr>
									<td align="center" style="padding:0 40px 10px;font-size:24px;font-weight:500;line-height:32px;color:#202124;" class="text-dark">
										Réinitialisation du mot de passe
									</td>
								</tr>
								<tr>
									<td align="center" style="padding:0 40px 20px;font-size:16px;line-height:24px;color:#5f6368;text-align:center;" class="text-dark">
										Bonjour ${safeName},<br>vous avez demandé la réinitialisation du mot de passe de votre compte.
									</td>
								</tr>
								<tr>
									<td align="center" style="padding:0 40px 30px;">
										<table border="0" cellpadding="0" cellspacing="0" role="presentation">
											<tr>
												<td align="center" style="border-radius:4px;background-color:#1a73e8;" bgcolor="#1a73e8">
													<a href="${actionLinkWithToken}" target="_blank" style="font-size:14px;font-weight:500;line-height:20px;text-decoration:none;display:inline-block;padding:10px 24px;color:#ffffff;">
														Réinitialiser le mot de passe
													</a>
												</td>
											</tr>
										</table>
									</td>
								</tr>
								${token ? `
								<tr>
									<td align="center" style="padding:0 40px 20px;font-size:14px;line-height:20px;color:#5f6368;background-color:#f8f9fa;border-radius:4px;margin:0 40px;border:1px solid #dadce0;" class="text-dark" bgcolor="#f8f9fa">
										<p style="margin:15px 0 5px;font-weight:500;">Code de réinitialisation :</p>
										<p style="margin:0;font-size:18px;font-weight:700;letter-spacing:1px;font-family:monospace;">${token}</p>
									</td>
								</tr>
								` : ''}
								<tr>
									<td align="center" style="padding:0 40px 20px;font-size:14px;line-height:20px;color:#d93025;background-color:#fce8e6;border-radius:4px;margin:0 40px;border:1px solid #f28b82;" bgcolor="#fce8e6">
										<p style="margin:15px;text-align:center;">Pour des raisons de sécurité, ce lien expirera dans 24 heures.</p>
									</td>
								</tr>
								<tr>
									<td align="center" style="padding:0 40px 30px;font-size:14px;line-height:20px;color:#5f6368;" class="text-dark">
										<p style="margin:0 0 15px;">Si le bouton ne fonctionne pas, copiez et collez le lien ci-dessous dans votre navigateur :</p>
										<p style="margin:0;word-break:break-all;color:#1a73e8;">${actionLinkWithToken}</p>
									</td>
								</tr>
								<tr>
									<td style="padding:30px 40px;background-color:#f8f9fa;border-top:1px solid #dadce0;font-size:12px;line-height:18px;color:#5f6368;" class="footer-dark" bgcolor="#f8f9fa">
										<p style="margin:0 0 10px;">Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
										<p style="margin:0;">© ${new Date().getFullYear()} CMDT. Tous droits réservés.</p>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
			</body>
			</html>
		`;

		const text = `Bonjour ${safeName},\n\nVous avez demandé la réinitialisation du mot de passe de votre compte. Pour réinitialiser votre mot de passe, cliquez sur le lien suivant :\n\n${actionLinkWithToken}\n\n${token ? 'Code de réinitialisation : ' + token + '\n\n' : ''}Pour des raisons de sécurité, ce lien expirera dans 24 heures.\n\nSi vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.`;
		return { subject, html, text };
	}

	private static genericTemplate({ name, link, token }: NotificationPayload): NotificationTemplate {
		const subject = 'Notification';
		const safeName = name ?? 'Cher utilisateur';
		const actionLink = link ?? '#';
		const actionLinkWithToken = this.attachTokenToLink(actionLink, token);

		const html = `
			<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
			<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
			<head>
				<title>${subject}</title>
				<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta name="x-apple-disable-message-reformatting">
				<meta http-equiv="X-UA-Compatible" content="IE=edge">
				<style type="text/css">
					body { margin: 0; padding: 0; background-color: #f8f9fa; color: #202124; font-family: 'Google Sans', Roboto, Helvetica, Arial, sans-serif; }
					@media screen and (max-width: 600px) {
						.container { width: 100% !important; }
						.mobile-hidden { display: none !important; }
						.mobile-full { width: 100% !important; }
						.content { padding: 20px 15px !important; }
					}
					@media (prefers-color-scheme: dark) {
						.body-dark { background-color: #202124 !important; }
						.card-dark { background-color: #303134 !important; border-color: #5f6368 !important; }
						.text-dark { color: #e8eaed !important; }
						.footer-dark { color: #9aa0a6 !important; }
					}
				</style>
			</head>
			<body style="margin:0;padding:0;background-color:#f8f9fa;color:#202124;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;" class="body-dark">
				<div style="display:none;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
					Vous avez reçu une nouvelle notification
				</div>
				<table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
					<tr>
						<td align="center" style="padding:40px 0;">
							<table width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" class="container" style="background-color:#ffffff;border-radius:8px;border:1px solid #dadce0;overflow:hidden;" bgcolor="#ffffff" class="card-dark">
								<tr>
									<td align="center" style="padding:40px 0 20px;">
										${this.logoSVG()}
									</td>
								</tr>
								<tr>
									<td align="center" style="padding:0 40px 10px;font-size:24px;font-weight:500;line-height:32px;color:#202124;" class="text-dark">
										Nouvelle notification
									</td>
								</tr>
								<tr>
									<td align="center" style="padding:0 40px 20px;font-size:16px;line-height:24px;color:#5f6368;text-align:center;" class="text-dark">
										Bonjour ${safeName},<br>vous avez reçu une nouvelle notification.
									</td>
								</tr>
								${link ? `
								<tr>
									<td align="center" style="padding:0 40px 30px;">
										<table border="0" cellpadding="0" cellspacing="0" role="presentation">
											<tr>
												<td align="center" style="border-radius:4px;background-color:#1a73e8;" bgcolor="#1a73e8">
													<a href="${actionLinkWithToken}" target="_blank" style="font-size:14px;font-weight:500;line-height:20px;text-decoration:none;display:inline-block;padding:10px 24px;color:#ffffff;">
														Voir les détails
													</a>
												</td>
											</tr>
										</table>
									</td>
								</tr>
								` : ''}
								${token ? `
								<tr>
									<td align="center" style="padding:0 40px 20px;font-size:14px;line-height:20px;color:#5f6368;background-color:#f8f9fa;border-radius:4px;margin:0 40px;border:1px solid #dadce0;" class="text-dark" bgcolor="#f8f9fa">
										<p style="margin:15px 0 5px;font-weight:500;">Code de notification :</p>
										<p style="margin:0;font-size:18px;font-weight:700;letter-spacing:1px;font-family:monospace;">${token}</p>
									</td>
								</tr>
								` : ''}
								${link ? `
								<tr>
									<td align="center" style="padding:0 40px 30px;font-size:14px;line-height:20px;color:#5f6368;" class="text-dark">
										<p style="margin:0 0 15px;">Si le bouton ne fonctionne pas, copiez et collez le lien ci-dessous dans votre navigateur :</p>
										<p style="margin:0;word-break:break-all;color:#1a73e8;">${actionLinkWithToken}</p>
									</td>
								</tr>
								` : ''}
								<tr>
									<td style="padding:30px 40px;background-color:#f8f9fa;border-top:1px solid #dadce0;font-size:12px;line-height:18px;color:#5f6368;" class="footer-dark" bgcolor="#f8f9fa">
										<p style="margin:0 0 10px;">Ceci est un message automatique. Merci de ne pas y répondre.</p>
										<p style="margin:0;">© ${new Date().getFullYear()} Notre Société. Tous droits réservés.</p>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
			</body>
			</html>
		`;

		const text = `Bonjour ${safeName},\n\nVous avez reçu une nouvelle notification.\n\n${link ? 'Lien : ' + actionLinkWithToken + '\n' : ''}${token ? 'Code : ' + token + '\n' : ''}\n\nCeci est un message automatique. Merci de ne pas y répondre.`;
		return { subject, html, text };
	}
}