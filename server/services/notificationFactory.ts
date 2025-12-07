export type NotificationKind = 'register' | 'reset' | 'generic' | 'migration_submitted' | 'migration_approved' | 'migration_rejected';

export interface NotificationPayload {
	name?: string;
	email?: string; // used for sending
	link?: string; // verification or reset link
	token?: string; // optional token
	// Migration specific
	role?: string;
	department?: string;
	motivation?: string;
	review_note?: string;
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
			case 'migration_submitted':
				return NotificationFactory.migrationSubmittedTemplate(payload);
			case 'migration_approved':
				return NotificationFactory.migrationApprovedTemplate(payload);
			case 'migration_rejected':
				return NotificationFactory.migrationRejectedTemplate(payload);
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

		const text = `Bonjour ${safeName},\n\nPour finaliser la création de votre compte et accéder à tous nos services, veuillez vérifier votre adresse email en cliquant sur le lien suivant :\n\n${actionLinkWithToken}\n\n${token ? 'Code de vérification : ' + token + '\n\n' : ''}Si vous n'avez pas créé de compte, vous pouvez ignorer cet email. Pour des raisons de sécurité, ce lien expirera dans <strong>1 heure</strong>.`;
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
										<p style="margin:15px;text-align:center;">Pour des raisons de sécurité, ce lien expirera dans 30 minutes.</p>
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
				${this.getHeader(subject)}
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
								${this.getFooter()}
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

	// Helper pour formater les rôles en libellés lisibles
	private static formatRole(role?: string): string {
		if (!role) return 'Non défini';
		switch (role) {
			case 'invoice_manager': return 'Chargé de facture';
			case 'dfc_agent': return 'Agent DFC';
			case 'admin': return 'Administrateur';
			default: return role;
		}
	}

	private static migrationSubmittedTemplate({ name, role, department, motivation }: NotificationPayload & { role?: string, department?: string, motivation?: string }): NotificationTemplate {
		const subject = 'Confirmation de réception - Demande de migration de rôle';
		const safeName = name ?? 'Cher employé';
		const displayRole = this.formatRole(role);

		const html = `
			<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
			<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
			<head>
				<title>${subject}</title>
				<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<style type="text/css">
					body { margin: 0; padding: 0; background-color: #f8f9fa; color: #202124; font-family: 'Google Sans', Roboto, Helvetica, Arial, sans-serif; }
				</style>
			</head>
				<body style="margin:0;padding:0;background-color:#f8f9fa;color:#202124;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;" class="body-dark">
				${this.getHeader(subject)}
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
										Accusé de réception
									</td>
								</tr>
								<tr>
									<td align="center" style="padding:0 40px 20px;font-size:16px;line-height:24px;color:#5f6368;text-align:center;" class="text-dark">
										Bonjour ${safeName},<br>Votre demande de migration vers le rôle d'<b>${displayRole}</b> a bien été enregistrée.
									</td>
								</tr>
								<tr>
									<td align="left" style="padding:0 40px 20px;font-size:14px;line-height:20px;color:#5f6368;" class="text-dark">
										<p><strong>Département :</strong> ${department}</p>
										<p><strong>Votre message :</strong></p>
										<blockquote style="border-left: 4px solid #1a73e8; padding-left: 10px; margin-left: 0; color: #5f6368; font-style: italic;">
											${motivation}
										</blockquote>
									</td>
								</tr>
								<tr>
									<td align="center" style="padding:0 40px 20px;font-size:13px;color:#d93025;background-color:#fce8e6;border-radius:4px;margin:0 40px;border:1px solid #f28b82;" bgcolor="#fce8e6">
										<p style="margin:15px;text-align:center;">Si vous n'êtes pas l'auteur de cette demande, veuillez contacter immédiatement l'administrateur.</p>
									</td>
								</tr>
								${this.getFooter()}
							</table>
						</td>
					</tr>
				</table>
			</body>
			</html>
		`;

		const text = `Bonjour ${safeName},\n\nVotre demande de migration vers le rôle de ${displayRole} (Département: ${department}) a bien été enregistrée.\n\nVotre motivation:\n${motivation}\n\nSi vous n'êtes pas l'auteur de cette demande, contactez immédiatement l'administrateur.`;
		return { subject, html, text };
	}

	private static migrationApprovedTemplate({ name, role }: NotificationPayload & { role?: string }): NotificationTemplate {
		const subject = 'Félicitations - Demande Approuvée';
		const safeName = name ?? 'Cher employé';
		const displayRole = this.formatRole(role);

		const html = `
			<!DOCTYPE html>
			<html lang="fr">
			<head><title>${subject}</title></head>
			<body style="margin:0;padding:0;background-color:#f8f9fa;color:#202124;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
				${this.getHeader(subject)}
				<table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
					<tr>
						<td align="center" style="padding:40px 0;">
							<table width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" class="container" style="background-color:#ffffff;border-radius:8px;border:1px solid #dadce0;overflow:hidden;">
								<tr><td align="center" style="padding:40px 0 20px;">${this.logoSVG()}</td></tr>
								<tr><td align="center" style="padding:0 40px 10px;font-size:24px;font-weight:500;color:#1e8e3e;">Demande Approuvée !</td></tr>
								<tr><td align="center" style="padding:0 40px 20px;font-size:16px;color:#5f6368;">
									Bonjour ${safeName},<br>L'administrateur a validé votre migration vers le rôle d'<b>${displayRole}</b>.
								</td></tr>
								<tr><td align="center" style="padding:0 40px 30px;font-size:14px;color:#5f6368;background-color:#e6f4ea;margin:0 40px;border-radius:4px;">
									<p style="margin:15px;">Votre mot de passe reste inchangé. Veuillez vous reconnecter pour accéder à votre nouvelle interface.</p>
								</td></tr>
								${this.getFooter()}
							</table>
						</td>
					</tr>
				</table>
			</body>
			</html>
		`;
		return { subject, html, text: `Félicitations ${safeName}, votre demande pour devenir ${displayRole} a été approuvée.` };
	}

	private static migrationRejectedTemplate({ name, review_note }: NotificationPayload & { review_note?: string }): NotificationTemplate {
		const subject = 'Mise à jour concernant votre demande';
		const safeName = name ?? 'Cher employé';

		const html = `
			<!DOCTYPE html>
			<html lang="fr">
			<head><title>${subject}</title></head>
			<body style="margin:0;padding:0;background-color:#f8f9fa;color:#202124;font-family:'Google Sans',Roboto,Helvetica,Arial,sans-serif;">
				${this.getHeader(subject)}
				<table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
					<tr>
						<td align="center" style="padding:40px 0;">
							<table width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" class="container" style="background-color:#ffffff;border-radius:8px;border:1px solid #dadce0;overflow:hidden;">
								<tr><td align="center" style="padding:40px 0 20px;">${this.logoSVG()}</td></tr>
								<tr><td align="center" style="padding:0 40px 10px;font-size:24px;font-weight:500;color:#d93025;">Demande Refusée</td></tr>
								<tr><td align="center" style="padding:0 40px 20px;font-size:16px;color:#5f6368;">
									Bonjour ${safeName},<br>Votre demande de migration n'a pas été retenue par l'administration.
								</td></tr>
								${review_note ? `<tr><td align="left" style="padding:0 40px 20px;font-size:14px;color:#5f6368;"><p><strong>Motif :</strong> ${review_note}</p></td></tr>` : ''}
								<tr><td align="center" style="padding:0 40px 20px;font-size:14px;color:#5f6368;">
									Pour plus d'informations, veuillez contacter l'administrateur.
								</td></tr>
								${this.getFooter()}
							</table>
						</td>
					</tr>
				</table>
			</body>
			</html>
		`;
		return { subject, html, text: `Bonjour ${safeName}, votre demande a été refusée. ${review_note ? 'Motif: ' + review_note : ''}` };
	}

	// Helpers pour réduire la duplication code HTML
	private static getHeader(title: string): string {
		return `<div style="display:none;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${title}</div>`;
	}

	private static getFooter(): string {
		return `
		<tr>
			<td style="padding:30px 40px;background-color:#f8f9fa;border-top:1px solid #dadce0;font-size:12px;line-height:18px;color:#5f6368;" class="footer-dark" bgcolor="#f8f9fa">
				<p style="margin:0 0 10px;">Ceci est un message automatique. Merci de ne pas y répondre.</p>
				<p style="margin:0;">© ${new Date().getFullYear()} CMDT. Tous droits réservés.</p>
			</td>
		</tr>`;
	}
}
