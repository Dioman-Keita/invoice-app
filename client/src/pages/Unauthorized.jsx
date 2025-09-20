import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../services/useAuth';

export default function UnauthorizedPage() {
    const location = useLocation();
    const { user, logout } = useAuth();
    
    const { message, requiredRoles, currentRole } = location.state || {};

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès Non Autorisé</h1>
                
                <p className="text-gray-700 mb-6">
                    {message || "Vous n'avez pas les permissions nécessaires pour accéder à cette page."}
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-right text-gray-600">Votre rôle:</div>
                        <div className="text-left font-medium text-blue-600">{currentRole || 'Non connecté'}</div>
                        
                        <div className="text-right text-gray-600">Rôles requis:</div>
                        <div className="text-left font-medium text-green-600">
                            {requiredRoles?.join(', ') || 'Aucun rôle spécifique'}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Link 
                        to="/dashboard"
                        className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Retour au tableau de bord
                    </Link>
                    
                    {user ? (
                        <button
                            onClick={logout}
                            className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Se déconnecter
                        </button>
                    ) : (
                        <Link 
                            to="/login"
                            className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Se connecter
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}