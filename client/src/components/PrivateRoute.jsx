// components/PrivateRoute.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../services/useAuth';
import { useLocation, Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    const [showSpinner, setShowSpinner] = useState(true);
    const [shouldRedirect, setShouldRedirect] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            // Afficher le spinner pendant 1.5 secondes minimum
            const timer = setTimeout(() => {
                setShowSpinner(false);
                if (!isAuthenticated) {
                    // Attendre encore 0.5s après le spinner pour la redirection
                    setTimeout(() => setShouldRedirect(true), 500);
                }
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [isLoading, isAuthenticated]);

    // Afficher le spinner pendant le chargement
    if (isLoading || showSpinner) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="relative">
                    {/* Spinner principal */}
                    <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin"></div>
                    
                    {/* Cercle externe pour l'effet de profondeur */}
                    <div className="absolute top-0 left-0 w-12 h-12 border-2 border-blue-500 rounded-full animate-ping"></div>
                    
                    {/* Point central */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <p className="mt-4 text-gray-600 text-lg font-medium">Chargement en cours...</p>
                <p className="text-gray-400 text-sm">Veuillez patienter</p>
            </div>
        );
    }

    // Rediriger après l'animation
    if (shouldRedirect) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Si non authentifié mais pas encore de redirection
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="animate-bounce">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                </div>
                <p className="mt-4 text-red-600 text-lg font-medium">Accès non autorisé</p>
                <p className="text-gray-500 text-sm">Redirection vers la page de connexion...</p>
            </div>
        );
    }

    // Si authentifié, afficher le contenu
    return children;
}