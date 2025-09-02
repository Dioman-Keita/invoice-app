import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Import des icônes Heroicons
import {
  DocumentArrowDownIcon,
  ChartBarIcon,
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  UserPlusIcon,
  HomeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightStartOnRectangleIcon
} from '@heroicons/react/24/outline';

function NavbarPanel({ isOpen, onClose, isConnected, userType, userName, onLogout }) {
  const navigate = useNavigate();
  
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
  }, [isOpen]);

  const panelClasses = `
    fixed left-0 top-1/2 transform -translate-y-1/2 
    w-80 max-w-[90vw] sm:w-72 md:w-80 lg:w-96
    h-[calc(100vh-2rem)] overflow-hidden
    bg-white/95 backdrop-blur-md shadow-xl rounded-r-xl
    transition-transform duration-300 ease-in-out z-50
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  const overlayClasses = `
    fixed inset-0 bg-black/20 backdrop-blur-sm z-40
    transition-opacity duration-300 ease-in-out
    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
  `;

  // Menu de base pour les utilisateurs non connectés
  const baseMenuItems = [
    { label: 'Exporter en PDF', icon: <DocumentArrowDownIcon className="w-6 h-6" />, action: 'export' },
    { label: 'Statistiques', icon: <ChartBarIcon className="w-6 h-6" />, action: 'stats' },
    { label: 'Nouvelle facture', icon: <DocumentPlusIcon className="w-6 h-6" />, action: 'newInvoice' },
    { label: 'Rechercher', icon: <MagnifyingGlassIcon className="w-6 h-6" />, action: 'search' },
    { label: 'Imprimer une facture', icon: <PrinterIcon className="w-6 h-6" />, action: 'print' },
    { label: 'Devenir agent DFC', icon: <UserPlusIcon className="w-6 h-6" />, action: 'joinDFC' },
    { label: 'Accueil', icon: <HomeIcon className="w-6 h-6" />, action: 'home' }
  ];

  // Menu supplémentaire pour les utilisateurs connectés
  const connectedMenuItems = [
    { label: 'Tableau de bord', icon: <ChartBarIcon className="w-6 h-6" />, action: 'dashboard' },
    { label: 'Gestion des utilisateurs', icon: <UserGroupIcon className="w-6 h-6" />, action: 'users' },
    { label: 'Paramètres', icon: <Cog6ToothIcon className="w-6 h-6" />, action: 'settings' },
    { label: 'Aide & Support', icon: <QuestionMarkCircleIcon className="w-6 h-6" />, action: 'help' }
  ];

  const handleAction = (action) => {
    switch(action) {
      case 'export':
        navigate('/export');
        break;
      case 'stats':
        navigate('/stats');
        break;
      case 'newInvoice':
        navigate('/facture');
        break;
      case 'search':
        navigate('/search');
        break;
      case 'print':
        navigate('/print');
        break;
      case 'joinDFC':
        navigate('/joinDFC');
        break;
      case 'home':
        navigate('/');
        break;
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'users':
        navigate('/users');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'help':
        navigate('/help');
        break;
      case 'logout':
        onLogout();
        navigate('/');
        break;
      default:
        console.log(`${action}`);
        break;
    }
    onClose();
  };

  return (
    <>
      <div className={overlayClasses} onClick={onClose} />

      <div className={panelClasses}>
        <div className="p-6 border-b border-gray-200/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Menu CMDT</h2>
            {isConnected && (
              <p className="text-sm text-gray-600 mt-1">
                Connecté en tant que <span className="font-medium">{userName}</span>
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {userType === 'dfc' ? 'Agent DFC' : 'Chargé des factures'}
                </span>
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto h-full pb-24">
          {/* Menu principal */}
          {baseMenuItems.map(({ label, icon, action }) => (
            <button
              key={action}
              onClick={() => handleAction(action)}
              className="w-full flex items-center space-x-4 p-4 rounded-lg border border-gray-200 
              bg-white hover:bg-green-50 hover:border-green-200 hover:shadow-md transition-all duration-200 text-left group overflow-hidden"
            >
              <div className="text-green-600 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 group-hover:text-green-800 truncate">{label}</p>
              </div>
            </button>
          ))}

          {/* Menu pour utilisateurs connectés */}
          {isConnected && (
            <>
              <div className="pt-6 pb-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pl-4">Espace personnel</h3>
              </div>
              
              {connectedMenuItems.map(({ label, icon, action }) => (
                <button
                  key={action}
                  onClick={() => handleAction(action)}
                  className="w-full flex items-center space-x-4 p-4 rounded-lg border border-gray-200 
                  bg-white hover:bg-blue-50 hover:border-blue-200 hover:shadow-md transition-all duration-200 text-left group overflow-hidden"
                >
                  <div className="text-blue-600 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 group-hover:text-blue-800 truncate">{label}</p>
                  </div>
                </button>
              ))}
              
              {/* Bouton de déconnexion */}
              <button
                onClick={() => handleAction('logout')}
                className="w-full flex items-center space-x-4 p-4 rounded-lg border border-gray-200 
                bg-white hover:bg-red-50 hover:border-red-200 hover:shadow-md transition-all duration-200 text-left group overflow-hidden mt-6"
              >
                <div className="text-red-600 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <ArrowRightStartOnRectangleIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 group-hover:text-red-800 truncate">Déconnexion</p>
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default NavbarPanel;