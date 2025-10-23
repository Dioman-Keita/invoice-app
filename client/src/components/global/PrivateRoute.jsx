// components/PrivateRoute.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/auth/useAuth.js';
import { useLocation, Navigate } from 'react-router-dom';

// ✅ Déplacer les fonctions helpers en dehors du composant
const getFrenchRoleName = (role) => {
    const roleNames = {
        'admin': 'Administrateur',
        'invoice_manager': 'Gestionnaire de factures',
        'dfc_agent': 'Agent DFC'
    };
    return roleNames[role] || role;
};

const getRoleSpecificMessage = (requiredRole, userRole) => {
    const roleNames = {
        'admin': 'administrateur',
        'invoice_manager': 'gestionnaire de factures', 
        'dfc_agent': 'agent DFC'
    };

    switch(requiredRole) {
        case 'admin':
            return "Accès réservé aux administrateurs uniquement";
        case 'invoice_manager':
            return "Espace réservé aux gestionnaires de factures";
        case 'dfc_agent':
            return "Zone réservée aux agents DFC";
        default:
            return `Accès réservé aux ${roleNames[requiredRole] || requiredRole}`;
    }
};

const getGenericRoleMessage = (requiredRoles, userRole) => {
    const roleNames = requiredRoles.map(role => {
        const names = {
            'admin': 'administrateurs',
            'invoice_manager': 'gestionnaires de factures',
            'dfc_agent': 'agents DFC'
        };
        return names[role] || role;
    });

    if (requiredRoles.length === 2) {
        return `Accès réservé aux ${roleNames.join(' et ')}`;
    } else {
        return `Accès réservé aux ${roleNames.join(', ')}`;
    }
};

export default function PrivateRoute({ 
    children, 
    requiredRoles = [],
    requireAuth = true,
    redirectTo = '/login',
    unauthorizedRedirect = '/unauthorized',
    customMessage = ''
}) {
    const { isAuthenticated, isLoading, isInitialized, user } = useAuth();
    const location = useLocation();
    const [accessState, setAccessState] = useState('checking');
    const [message, setMessage] = useState('');

    // Normaliser requiredRoles pour toujours avoir un tableau
    const normalizedRequiredRoles = Array.isArray(requiredRoles) 
        ? requiredRoles 
        : [requiredRoles].filter(Boolean);

    useEffect(() => {
        if (!isLoading && isInitialized) {
            let hasAccess = true;
            let accessMessage = '';

            // Vérifier l'authentification
            if (requireAuth && !isAuthenticated) {
                hasAccess = false;
                accessMessage = 'Authentication required';
                setMessage('Veuillez vous connecter pour accéder à cette page');
            } 
            // Vérifier les rôles si nécessaire
            else if (isAuthenticated && normalizedRequiredRoles.length > 0) {
                const userRole = user?.role;
                if (!userRole || !normalizedRequiredRoles.includes(userRole)) {
                    hasAccess = false;
                    
                    // ✅ Messages personnalisés selon le rôle requis
                    if (customMessage) {
                        setMessage(customMessage);
                    } else if (normalizedRequiredRoles.length === 1) {
                        // Message spécifique pour un seul rôle requis
                        const requiredRole = normalizedRequiredRoles[0];
                        setMessage(getRoleSpecificMessage(requiredRole, userRole));
                    } else {
                        // Message générique pour multiple rôles
                        setMessage(getGenericRoleMessage(normalizedRequiredRoles, userRole));
                    }
                }
            }

            if (!hasAccess) {
                setAccessState('denied');
                setTimeout(() => setAccessState('redirecting'), 2000);
            } else {
                setAccessState('granted');
            }
        }
    }, [isAuthenticated, isLoading, isInitialized, user, normalizedRequiredRoles, requireAuth, customMessage]);

    // États d'affichage
    const states = {
        checking: (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-gray-50">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-2 border-blue-500 rounded-full animate-ping"></div>
                </div>
                <p className="mt-6 text-gray-700 text-lg font-semibold">Vérification des permissions</p>
                <p className="text-gray-500">Vérification de votre accès en cours...</p>
            </div>
        ),

        denied: (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-6">
                <div className="text-center max-w-md">
                    <div className="animate-bounce mb-6">
                        <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                    </div>
                    
                    <h1 className="text-2xl font-bold text-red-800 mb-3">Accès Restreint</h1>
                    <p className="text-gray-700 mb-4 text-lg font-medium">{message}</p>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-red-100 mb-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-gray-600 text-right">Votre rôle:</span>
                            <span className="font-medium text-blue-600 text-left">
                                {user?.role ? getFrenchRoleName(user.role) : 'Non connecté'}
                            </span>
                            
                            <span className="text-gray-600 text-right">Rôle(s) requis:</span>
                            <span className="font-medium text-green-600 text-left">
                                {normalizedRequiredRoles.map(getFrenchRoleName).join(', ')}
                            </span>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 animate-pulse">Redirection vers la page appropriée...</p>
                </div>
            </div>
        ),

        redirecting: (
            <Navigate 
                to={isAuthenticated ? unauthorizedRedirect : redirectTo} 
                state={{ 
                    from: location,
                    message: message,
                    requiredRoles: normalizedRequiredRoles,
                    currentRole: user?.role
                }} 
                replace 
            />
        ),

        granted: children
    };

    if (isLoading || !isInitialized) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-gray-50">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-2 border-blue-500 rounded-full animate-ping"></div>
                </div>
                <p className="mt-6 text-gray-700 text-lg font-semibold">Chargement</p>
                <p className="text-gray-500">Vérification de votre session...</p>
            </div>
        );
    }

    return states[accessState];
}