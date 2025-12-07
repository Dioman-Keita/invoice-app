import { HashRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { NotificationProvider } from './context/NotificationContext.jsx';
import NotificationManager from './components/notification/NotificationManager.jsx';

function App() {
  return (

    <HashRouter>
      <NotificationProvider>
        <AppRoutes />
        <NotificationManager />
      </NotificationProvider>
    </HashRouter>
  )
}

export default App;
