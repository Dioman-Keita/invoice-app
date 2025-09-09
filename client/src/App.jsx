import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { NotificationProvider } from './context/NotificationContext.jsx';
import NotificationManager from './components/NotificationManager';

function App() {
  return (

    <BrowserRouter>
      <NotificationProvider>
        <AppRoutes />
        <NotificationManager />
      </NotificationProvider>
    </BrowserRouter> 
  )
}

export default App;
