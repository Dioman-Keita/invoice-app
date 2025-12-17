import { useEffect } from 'react';
import { HashRouter, useNavigate } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { NotificationProvider } from './context/NotificationContext.jsx';
import NotificationManager from './components/notification/NotificationManager.jsx';

function DeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    // Vérification de sécurité
    if (!window.electron || !window.electron.onDeepLink) return;

    // Fonction de traitement
    const handleDeepLink = (url) => {
      console.log("🔗 Deep link reçu (Raw):", url);

      try {
        // Nettoyage de l'URL brute (ex: "invoice-app://verify?token=xyz")
        // Regex robsute : gère invoice-app: avec 1, 2 ou 3 slashs
        let path = url.replace(/^invoice-app:\/*/, '/');

        // On retire les éventuels guillemets
        path = path.replace(/["']/g, "");

        // On s'assure que ça commence par un slash
        if (!path.startsWith('/')) path = '/' + path;

        // On retire le slash final s'il existe (sauf si c'est juste "/")
        if (path.length > 1) {
          path = path.replace(/\/$/, '');
        }

        // CORRECTION CRITIQUE : /verify/?token -> /verify?token
        path = path.replace(/\/\?/, '?');

        // DEBUG: Alert pour confirmer la réception
        // alert(`Deep Link Recu: ${url}\nVers: ${path}`);
        console.log("👉 Navigation React vers:", path);

        // Tentative de navigation
        navigate(path);

        // Fallback si navigate échoue (pour HashRouter)
        // window.location.hash = path;
      } catch (e) {
        console.error("❌ Erreur parsing deep link:", e);
      }
    };

    // Abonnement (retourne la fonction de nettoyage grâce au nouveau preload)
    const removeListener = window.electron.onDeepLink(handleDeepLink);

    // Désabonnement automatique quand le composant est démonté
    return () => {
      if (removeListener) removeListener();
    };
  }, [navigate]);

  return null;
}


function App() {
  return (
    <HashRouter>
      <DeepLinkHandler />
      <NotificationProvider>
        <AppRoutes />
        <NotificationManager />
      </NotificationProvider>
    </HashRouter>
  );
}

export default App;