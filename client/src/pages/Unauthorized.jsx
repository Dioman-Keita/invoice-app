import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../services/useAuth';
import useTitle from '../hooks/useTitle';

export default function UnauthorizedPage() {
    const location = useLocation();
    const { user, logout } = useAuth();
    useTitle('CMDT - Accès non autorisé');
    
    const { message, requiredRoles, currentRole } = location.state || {};

    const getRedirectPath = () => {
        if (!user?.role) return '/login';
        
        switch(user.role) {
            case 'invoice_manager':
                return '/facture';
            case 'dfc_agent':
                return '/dfc_traitment';
            case 'admin':
                return '/dashboard';
            default:
                return '/dashboard';
        }
    };

    const getPageName = () => {
        if (!user?.role) return 'connexion';
        
        switch(user.role) {
            case 'invoice_manager':
                return 'page de facturation';
            case 'dfc_agent':
                return 'page DFC';
            case 'admin':
                return 'tableau de bord';
            default:
                return 'tableau de bord';
        }
    };

    const redirectPath = getRedirectPath();
    const pageName = getPageName();

    // ✅ Gestionnaire de déconnexion
    const handleLogout = () => {
        logout();
    };

    // ✅ Gestionnaire de retour
    const handleGoBack = () => {
        window.history.back();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
            <div className="max-w-lg w-full">
                {/* En-tête simple */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès Non Autorisé</h1>
                    <p className="text-gray-600">{message || "Vous n'avez pas les permissions nécessaires pour accéder à cette page."}</p>
                </div>

                {/* Informations */}
                <div className="bg-white rounded-lg p-6 mb-6 shadow-lg hadow-cyan-500/50">
                    <div className="grid grid-cols-1 gap-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Votre rôle :</span>
                            <span className="font-medium text-blue-600">{user?.role || currentRole || 'Non connecté'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Rôles requis :</span>
                            <span className="font-medium text-green-600">{requiredRoles?.join(', ') || 'Aucun rôle spécifique'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Page suggérée :</span>
                            <span className="font-medium text-purple-600 capitalize">{pageName}</span>
                        </div>
                    </div>
                </div>

                {/* ✅ Actions avec styles améliorés */}
                <div className="space-y-3">
                    {/* Bouton principal */}
                    <Link 
                        to={redirectPath}
                        className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 focus:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-all duration-200 font-medium cursor-pointer transform hover:scale-105 focus:scale-105 active:scale-95"
                    >
                        {user ? `Aller à ${pageName}` : 'Se connecter'}
                    </Link>
                    
                    {user ? (
                        <>
                            {/* Profil */}
                            <Link 
                                to="/profile"
                                className="block w-full border border-gray-300 text-gray-700 text-center py-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:bg-gray-50 focus:border-gray-400 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:outline-none transition-all duration-200 font-medium cursor-pointer transform hover:scale-105 focus:scale-105 active:scale-95"
                            >
                                Voir mon profil
                            </Link>

                            {/* Dashboard admin */}
                            {user.role === 'admin' && (
                                <Link 
                                    to="/dashboard"
                                    className="block w-full border border-purple-300 text-purple-600 text-center py-3 rounded-lg hover:bg-purple-50 hover:border-purple-400 focus:bg-purple-50 focus:border-purple-400 focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 focus:outline-none transition-all duration-200 font-medium cursor-pointer transform hover:scale-105 focus:scale-105 active:scale-95"
                                >
                                    Tableau de bord admin
                                </Link>
                            )}

                            {/* Retour */}
                            <button
                                onClick={handleGoBack}
                                className="w-full border border-gray-300 text-gray-700 text-center py-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:bg-gray-50 focus:border-gray-400 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:outline-none transition-all duration-200 font-medium cursor-pointer transform hover:scale-105 focus:scale-105 active:scale-95"
                            >
                                Retour
                            </button>
                            
                            {/* Déconnexion */}
                            <button
                                onClick={handleLogout}
                                className="w-full border border-red-300 text-red-600 text-center py-3 rounded-lg hover:bg-red-50 hover:border-red-400 focus:bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-300 focus:ring-offset-2 focus:outline-none transition-all duration-200 font-medium cursor-pointer transform hover:scale-105 focus:scale-105 active:scale-95"
                            >
                                Se déconnecter
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Créer un compte */}
                            <Link 
                                to="/register"
                                className="block w-full border border-green-300 text-green-600 text-center py-3 rounded-lg hover:bg-green-50 hover:border-green-400 focus:bg-green-50 focus:border-green-400 focus:ring-2 focus:ring-green-300 focus:ring-offset-2 focus:outline-none transition-all duration-200 font-medium cursor-pointer transform hover:scale-105 focus:scale-105 active:scale-95"
                            >
                                Créer un compte
                            </Link>
                            
                            {/* Accueil */}
                            <Link 
                                to="/"
                                className="block w-full border border-gray-300 text-gray-700 text-center py-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:bg-gray-50 focus:border-gray-400 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:outline-none transition-all duration-200 font-medium cursor-pointer transform hover:scale-105 focus:scale-105 active:scale-95"
                            >
                                Page d'accueil
                            </Link>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        CMDT • Système sécurisé
                    </p>
                </div>
            </div>
        </div>
    );
}