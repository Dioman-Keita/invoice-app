import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth.js';
import {
  ChartBarIcon,
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  UserIcon,
  DocumentCheckIcon,
  ArrowsRightLeftIcon,
  EnvelopeIcon, // Icône de messagerie ajoutée
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, CommandLineIcon } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';

function NavbarPanel({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favoriteActions, setFavoriteActions] = useState(() => {
    try {
      const raw = localStorage.getItem('cmdt:favorites');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.log(e);
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

  // Tous les items disponibles (y compris GitHub et Messagerie)
  const allMenuItems = useMemo(() => ([
    { label: 'Statistiques', icon: <ChartBarIcon className="w-6 h-6" />, action: 'stats' },
    { label: 'Nouvelle facture', icon: <DocumentPlusIcon className="w-6 h-6" />, action: 'newInvoice' },
    { label: 'Rechercher', icon: <MagnifyingGlassIcon className="w-6 h-6" />, action: 'search' },
    {
      label: 'Migration de rôle',
      icon: <ArrowsRightLeftIcon className="w-6 h-6" />,
      action: 'roleMigration'
    },
    { label: 'Traitement DFC', icon: <DocumentCheckIcon className="w-6 h-6" />, action: 'dfc_traitment' },
    { label: 'Accueil', icon: <HomeIcon className="w-6 h-6" />, action: 'home' },
    { label: 'Mon Profil', icon: <UserIcon className="w-6 h-6" />, action: 'profile' },
    { label: 'Aide & Support', icon: <QuestionMarkCircleIcon className="w-6 h-6" />, action: 'help' },
    { label: 'Tableau de bord', icon: <ChartBarIcon className="w-6 h-6" />, action: 'dashboard' },
    { label: 'Gestion des utilisateurs', icon: <UserGroupIcon className="w-6 h-6" />, action: 'users' },
    { label: 'Statistiques avancées', icon: <ChartBarIcon className="w-6 h-6" />, action: 'adminStats' },
    // NOUVEAU: Messagerie admin
    {
      label: 'Messagerie Admin',
      icon: <EnvelopeIcon className="w-6 h-6" />,
      action: 'adminMessaging'
    },
    {
      label: 'Code Source GitHub',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ),
      action: 'github',
      external: true
    }
  ]), []);

  // Filtrer les actions disponibles selon le rôle
  const availableActions = useMemo(() => {
    const userRole = user?.role;

    // Définir les actions admin (y compris la messagerie)
    const adminActions = ['dashboard', 'users', 'adminStats', 'adminMessaging'];

    // Pour les non-connectés, montrer seulement les pages publiques
    if (!userRole) {
      return allMenuItems.filter(item =>
        ['home', 'help', 'github'].includes(item.action)
      );
    }

    // Filtrer selon le rôle
    let filteredItems = [...allMenuItems];

    switch (userRole) {
      case 'admin':
        // Admin voit tout SAUF roleMigration
        filteredItems = filteredItems.filter(item => item.action !== 'roleMigration');
        break;

      case 'invoice_manager':
        // Invoice manager voit tout SAUF les pages admin, dfc_traitment ET adminMessaging
        filteredItems = filteredItems.filter(item =>
          !adminActions.includes(item.action) &&
          item.action !== 'dfc_traitment'
        );
        break;

      case 'dfc_agent':
        // DFC agent voit tout SAUF admin, newInvoice, adminMessaging
        // MAIS IL VOIT roleMigration (car il peut migrer vers invoice_manager)
        filteredItems = filteredItems.filter(item =>
          !adminActions.includes(item.action) &&
          item.action !== 'newInvoice'
        );
        break;

      default:
        // Par défaut, cacher roleMigration et adminMessaging pour les autres rôles
        filteredItems = filteredItems.filter(item =>
          item.action !== 'roleMigration' &&
          !adminActions.includes(item.action)
        );
        break;
    }

    return filteredItems;
  }, [user, allMenuItems]);

  // Séparer les items en catégories
  const { baseItems, adminItems, additionalItems } = useMemo(() => {
    const adminActions = ['dashboard', 'users', 'adminStats', 'adminMessaging'];

    const baseItems = availableActions.filter(item =>
      !adminActions.includes(item.action) && item.action !== 'github'
    );

    const adminItems = availableActions.filter(item =>
      adminActions.includes(item.action)
    );

    const additionalItems = availableActions.filter(item =>
      item.action === 'github'
    );

    return { baseItems, adminItems, additionalItems };
  }, [availableActions]);

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

  // Fonction pour vérifier si une section est vide (tous les éléments sont dans les favoris)
  const isSectionEmpty = (sectionItems) => {
    return sectionItems.every(({ action }) => favoriteActions.includes(action));
  };

  const contentClasses = `p-4 space-y-3 overflow-y-auto flex-1 pb-6`;

  // Fonction pour ouvrir le lien GitHub
  const openGitHub = () => {
    window.open('https://github.com/Dioman-Keita/invoice-app', '_blank', 'noopener,noreferrer');
  };

  const handleAction = (action) => {
    switch (action) {
      case 'stats':
        navigate('/stats');
        break;
      case 'newInvoice':
        navigate('/facture');
        break;
      case 'search':
        navigate('/search');
        break;
      case 'roleMigration':
        navigate('/role-migration');
        break;
      case 'dfc_traitment':
        navigate('/dfc_traitment');
        break;
      case 'home':
        navigate('/');
        break;
      case 'profile':
        navigate('/profile');
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
      // NOUVEAU: Navigation vers la page de messagerie admin
      case 'adminMessaging':
        navigate('/admin-messaging');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'help':
        navigate('/help');
        break;
      case 'github':
        openGitHub();
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
            {user?.role && (
              <p className="text-sm text-gray-500 mt-1">
                Rôle: <span className="font-medium capitalize">{user.role.replace('_', ' ')}</span>
              </p>
            )}
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

          {/* Menu principal - Afficher le titre seulement si la section n'est pas vide */}
          {!isSectionEmpty(baseItems) && (
            <div className="pt-1 pb-1">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pl-4">Menu Principal</h3>
            </div>
          )}

          {baseItems
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

          {/* Menu admin - Afficher le titre seulement si la section n'est pas vide */}
          {!isSectionEmpty(adminItems) && (
            <div className="pt-6 pb-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pl-4">Administration</h3>
            </div>
          )}

          {adminItems
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

          {/* Options supplémentaires (GitHub) - Afficher le titre seulement si la section n'est pas vide */}
          {!isSectionEmpty(additionalItems) && (
            <div className="pt-6 pb-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pl-4">Autres</h3>
            </div>
          )}

          {additionalItems
            .filter(({ action }) => !favoriteActions.includes(action))
            .map(({ label, icon, action }) => (
              <button
                key={action}
                onClick={() => handleAction(action)}
                className="w-full max-w-md mx-auto flex items-center space-x-4 p-4 rounded-lg border border-gray-200 
              bg-white hover:bg-purple-50 hover:border-purple-200 hover:shadow-md transition-all duration-200 text-left group overflow-hidden"
              >
                <div className="text-purple-600 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 group-hover:text-purple-800 truncate">{label}</p>
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
                .map(({ label, icon, action, external }) => (
                  <button
                    key={`palette-${action}`}
                    onClick={() => {
                      setIsPaletteOpen(false);
                      if (external) {
                        window.open('https://github.com/Dioman-Keita/invoice-app', '_blank', 'noopener,noreferrer');
                      } else {
                        handleAction(action);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                  >
                    <div className="w-6 h-6 text-gray-600">{icon}</div>
                    <div className="flex-1">
                      <p className="text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">/{action}</p>
                      {external && (
                        <p className="text-xs text-blue-400">Lien externe</p>
                      )}
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