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
        console.log("🔗 Deep link reçu:", url);
        
        try {
            // Nettoyage de l'URL brute (ex: "invoice-app://verify?token=xyz")
            // 1. On retire le protocole
            let path = url.replace(/^invoice-app:\/*/, '/');
            
            // 2. On retire les éventuels guillemets (bug fréquent Windows)
            path = path.replace(/["']/g, "");
            
            // 3. On s'assure que ça commence par un slash
            if (!path.startsWith('/')) path = '/' + path;

            // 4. On retire le slash final s'il existe (optionnel mais propre)
            path = path.replace(/\/$/, '');

            console.log("👉 Navigation vers:", path);
            navigate(path);
        } catch (e) {
            console.error("Erreur parsing deep link:", e);
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