import type { Response, Request } from "express";
import ApiResponder from "../utils/ApiResponder";
import { ActivityTracker } from "../utils/ActivityTracker";
import { AuthenticatedRequest } from "../types/express/request";

export async function checkAuthStatus(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
        const user = req.user;
        const rememberMe = req.cookies.rememberMe === 'true'
        const activityTracker = new ActivityTracker(undefined, rememberMe);
        console.log('🔐 checkAuthStatus - user object:', user); // Debug

        if (!user) {
            return ApiResponder.success(res, {
                isAuthenticated: false,
                user: null
            }, 'Utilisateur non authentifié');
        }


        const userId = user.sup;
        const userEmail = user.email;
        const userRole = user.role;
        const activity = user.activity || 'VIEW_PROFILE';

        if (!userId || !userEmail || !userRole || !activity) {
            console.error('❌ User object missing required fields:', user);
            return ApiResponder.success(res, {
                isAuthenticated: false,
                user: null
            }, 'Données utilisateur incomplètes');
        }

        const timeUntilExpirity = await activityTracker.getTimeUntilExpirity(userId);
        const shouldRefresh = timeUntilExpirity !== null && timeUntilExpirity < 15 * 60 * 1000 // 15 min

        return ApiResponder.success(res, {
            isAuthenticated: true,
            user: {
                id: userId,
                email: userEmail,
                role: userRole,
                userActivity: activity
            },
            shouldRefresh: shouldRefresh,
            expiresIn: timeUntilExpirity,
            rememberMe: rememberMe,
        }, 'Utilisateur authentifié');

    } catch (error) {
        console.error('❌ checkAuthStatus error:', error);
        return ApiResponder.error(res, error, 'Erreur lors de la vérification du statut');
    }
}

export async function openAppRedirect(req: Request, res: Response) {
    // 1. Retrieve parameters from the HTTP URL
    // Ex: http://127.0.0.1:3000/api/open-app?path=verify&token=xyz
    const { token, path } = req.query;

    if (!token || !path) {
        return res.status(400).send("Lien invalide : paramètres manquants.");
    }

    // 2. Construct the Deep Link for Electron
    // Result: invoice-app:///verify?token=xyz (Triple slash to force absolute path)
    const deepLink = `invoice-app:///${path}?token=${token}`;

    // 3. HTML Jump Page (Bridge)
    const html = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <title>Ouverture de Invoice App...</title>
            <style>
                body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f0f2f5; }
                .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
                .btn { display: inline-block; margin-top: 1rem; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>🚀 Ouverture de l'application...</h2>
                <p>Votre navigateur va vous demander la permission d'ouvrir <strong>Invoice App</strong>.</p>
                <p>Si rien ne se passe, cliquez sur le bouton ci-dessous :</p>
                <a href="${deepLink}" class="btn">Ouvrir l'application</a>
            </div>
            <script>
                // Automatic opening attempt
                setTimeout(function() {
                    window.location.href = "${deepLink}";
                }, 500);
            </script>
        </body>
        </html>
    `;

    res.send(html);
}