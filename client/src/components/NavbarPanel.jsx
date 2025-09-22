import { useEffect, useMemo, useState } from 'react';
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
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, CommandLineIcon } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';

function NavbarPanel({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [favoriteActions, setFavoriteActions] = useState(() => {
    try {
      const raw = localStorage.getItem('cmdt:favorites');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem('cmdt:favorites', JSON.stringify(favoriteActions));
  }, [favoriteActions]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(true);
        setPaletteQuery('');
      }
      if (e.key === 'Escape') {
        setIsPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const panelClasses = `
    fixed left-0 top-1/2 transform -translate-y-1/2 
    w-80 max-w-[90vw] sm:w-72 md:w-80 lg:w-96
    h-[calc(100vh-2rem)] overflow-hidden
    bg-white/95 backdrop-blur-md shadow-xl rounded-r-xl
    transition-transform duration-300 ease-in-out z-50
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    flex flex-col
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
    { label: 'Accueil', icon: <HomeIcon className="w-6 h-6" />, action: 'home' },
    { label: 'Aide & Support', icon: <QuestionMarkCircleIcon className="w-6 h-6" />, action: 'help' }

  ];

  // Menu admin uniquement
  const adminMenuItems = [
    { label: 'Tableau de bord', icon: <ChartBarIcon className="w-6 h-6" />, action: 'dashboard' },
    { label: 'Gestion des utilisateurs', icon: <UserGroupIcon className="w-6 h-6" />, action: 'users' },
    { label: 'Statistiques avancées', icon: <ChartBarIcon className="w-6 h-6" />, action: 'adminStats' },
  ];

  const availableActions = useMemo(() => {
    return [...baseMenuItems, ...adminMenuItems];
  }, []);

  const toggleFavorite = (action) => {
    setFavoriteActions((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    );
  };

  const handleFavKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(action);
    }
  };

  const favoriteItems = useMemo(
    () => availableActions.filter((item) => favoriteActions.includes(item.action)),
    [availableActions, favoriteActions]
  );

  const contentClasses = `p-4 space-y-3 overflow-y-auto flex-1 pb-6`;

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
      case 'adminStats':
        navigate('/admin-stats');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'help':
        navigate('/help');
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
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="px-2 py-1 rounded-md hover:bg-gray-100 transition-colors text-gray-600 flex items-center gap-1"
              aria-label="Command Palette (Ctrl+K)"
              title="Command Palette (Ctrl+K)"
            >
              <CommandLineIcon className="w-5 h-5" />
              <span className="text-xs text-gray-500 border border-gray-300 rounded px-1">Ctrl+K</span>
            </button>
            <button
              onClick={() => handleAction('settings')}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-600"
              aria-label="Paramètres"
              title="Paramètres"
            >
              <Cog6ToothIcon className="w-6 h-6" />
            </button>
            <button 
              onClick={onClose}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Fermer"
              title="Fermer"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <div className={contentClasses}>
          {favoriteItems.length > 0 && (
            <>
              <div className="pt-1 pb-1">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pl-4">Favoris</h3>
              </div>
              {favoriteItems.map(({ label, icon, action }) => (
                <button
                  key={`fav-${action}`}
                  onClick={() => handleAction(action)}
                  className="w-full max-w-md mx-auto flex items-center space-x-4 p-4 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 hover:shadow-md transition-all duration-200 text-left group overflow-hidden"
                >
                  <div className="text-amber-600 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 group-hover:text-amber-800 truncate">{label}</p>
                  </div>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(action); }}
                    onKeyDown={(e) => handleFavKeyDown(e, action)}
                    className="text-amber-500 hover:text-amber-600 cursor-pointer"
                    aria-label="Retirer des favoris"
                    title="Retirer des favoris"
                  >
                    <StarIconSolid className="w-5 h-5" />
                  </span>
                </button>
              ))}
              <div className="pt-2" />
            </>
          )}
          {/* Menu principal */}
          {baseMenuItems
            .filter(({ action }) => !favoriteActions.includes(action))
            .map(({ label, icon, action }) => (
            <button
              key={action}
              onClick={() => handleAction(action)}
              className="w-full max-w-md mx-auto flex items-center space-x-4 p-4 rounded-lg border border-gray-200 
              bg-white hover:bg-green-50 hover:border-green-200 hover:shadow-md transition-all duration-200 text-left group overflow-hidden"
            >
              <div className="text-green-600 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 group-hover:text-green-800 truncate">{label}</p>
              </div>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); toggleFavorite(action); }}
                onKeyDown={(e) => handleFavKeyDown(e, action)}
                className={favoriteActions.includes(action) ? 'text-amber-500 hover:text-amber-600 cursor-pointer' : 'text-gray-300 hover:text-amber-500 cursor-pointer'}
                aria-label={favoriteActions.includes(action) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                title={favoriteActions.includes(action) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                {favoriteActions.includes(action) ? (
                  <StarIconSolid className="w-5 h-5" />
                ) : (
                  <StarIcon className="w-5 h-5" />
                )}
              </span>
            </button>
          ))}

          {/* Menu admin */}
          <div className="pt-6 pb-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pl-4">Administration</h3>
          </div>
          
          {adminMenuItems
            .filter(({ action }) => !favoriteActions.includes(action))
            .map(({ label, icon, action }) => (
            <button
              key={action}
              onClick={() => handleAction(action)}
              className="w-full max-w-md mx-auto flex items-center space-x-4 p-4 rounded-lg border border-gray-200 
              bg-white hover:bg-blue-50 hover:border-blue-200 hover:shadow-md transition-all duration-200 text-left group overflow-hidden"
            >
              <div className="text-blue-600 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 group-hover:text-blue-800 truncate">{label}</p>
              </div>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); toggleFavorite(action); }}
                onKeyDown={(e) => handleFavKeyDown(e, action)}
                className={favoriteActions.includes(action) ? 'text-amber-500 hover:text-amber-600 cursor-pointer' : 'text-gray-300 hover:text-amber-500 cursor-pointer'}
                aria-label={favoriteActions.includes(action) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                title={favoriteActions.includes(action) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                {favoriteActions.includes(action) ? (
                  <StarIconSolid className="w-5 h-5" />
                ) : (
                  <StarIcon className="w-5 h-5" />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
      {isPaletteOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsPaletteOpen(false)} />
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="border-b border-gray-200 p-3">
              <input
                autoFocus
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder="Rechercher une action..."
                className="w-full outline-none px-3 py-2 rounded-md bg-gray-50 focus:bg-white"
              />
            </div>
            <div className="max-h-80 overflow-y-auto">
              {availableActions
                .filter(({ label, action }) =>
                  (label + ' ' + action).toLowerCase().includes(paletteQuery.toLowerCase())
                )
                .map(({ label, icon, action }) => (
                  <button
                    key={`palette-${action}`}
                    onClick={() => { setIsPaletteOpen(false); handleAction(action); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                  >
                    <div className="w-6 h-6 text-gray-600">{icon}</div>
                    <div className="flex-1">
                      <p className="text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">/{action}</p>
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(action); }}
                      onKeyDown={(e) => handleFavKeyDown(e, action)}
                      className={favoriteActions.includes(action) ? 'text-amber-500 hover:text-amber-600 cursor-pointer' : 'text-gray-300 hover:text-amber-500 cursor-pointer'}
                      aria-label={favoriteActions.includes(action) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      title={favoriteActions.includes(action) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      {favoriteActions.includes(action) ? (
                        <StarIconSolid className="w-5 h-5" />
                      ) : (
                        <StarIcon className="w-5 h-5" />
                      )}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NavbarPanel;