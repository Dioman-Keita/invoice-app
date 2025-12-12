import { useEffect } from 'react';
import { HashRouter, useNavigate } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { NotificationProvider } from './context/NotificationContext.jsx';
import NotificationManager from './components/notification/NotificationManager.jsx';

function DeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (window.electron && window.electron.onDeepLink) {
      window.electron.onDeepLink((url) => {
        console.log("🔗 Deep link brut:", url);
        
        // 1. On retire le protocole (peu importe s'il y a // ou ///)
        let path = url.replace(/^invoice-app:\/*/, '/');
        
        // 2. Nettoyage spécifique Windows (le # qui traîne parfois)
        path = path.replace('/#', '');
        
        // 3. On s'assure que ça commence par /
        if (!path.startsWith('/')) path = '/' + path;

        console.log("👉 Navigation nettoyée vers:", path);
        navigate(path);
      });
    }
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