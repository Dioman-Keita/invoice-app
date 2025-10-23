// components/Verify.jsx - Version corrigée avec timeout de 5s
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth.js';

function Verify() {
    const [params] = useSearchParams();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Vérification en cours...');
    const [countdown, setCountdown] = useState(5); // Compte à rebours de 5 secondes
    const { finalizeRegister, isAuthenticated, user } = useAuth();
    const timeoutRef = useRef(null);

    useEffect(() => {
        const token = params.get('token');
        if (!token) {
            setStatus('error');
            setMessage('Lien invalide ou token manquant.');
            return;
        }

        const verify = async () => {
            try {
                console.log('🔐 Verify - Début de vérification');
                const result = await finalizeRegister(token);
                
                console.log('🔐 Verify - Résultat finalizeRegister:', result);
                
                if (result?.success) {
                    setStatus('success');
                    setMessage('Votre inscription est vérifiée.');
                    window.history.replaceState({}, document.title, window.location.pathname);
                } else {
                    setStatus('error');
                    setMessage(result.message || 'Échec de la vérification.');
                }
            } catch (err) {
                console.error("Erreur dans verify():", err);
                setStatus('error');
                setMessage("Erreur lors de la vérification.");
            }
        };

        verify();
    }, [finalizeRegister, params]);

    // ✅ Compte à rebours de 5 secondes
    useEffect(() => {
        if (status === 'success' && isAuthenticated && user) {
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [status, isAuthenticated, user]);

    // ✅ REDIRECTION AVEC TIMEOUT DE 5 SECONDES
    useEffect(() => {
        if (isAuthenticated && user) {
            console.log('🔍 Tentative de redirection avec window.location...');
            console.log('🔍 User role:', user.role);
            
            // Nettoyer tout timeout précédent
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            
            timeoutRef.current = setTimeout(() => {
                let targetPath = '/dashboard';
                
                if (user.role === 'invoice_manager') {
                    targetPath = '/facture';
                } else if (user.role === 'dfc_agent') {
                    targetPath = '/dfc_traitment';
                }
                
                console.log('📍 Redirection après 5s vers:', targetPath);
                console.log('📍 URL complète:', window.location.origin + targetPath);
                
                // ✅ FORCER la redirection avec window.location.href
                window.location.href = targetPath;
            }, 5000); // 5 secondes
            
            // Nettoyage à la destruction du composant
            return () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
            };
        }
    }, [isAuthenticated, user]);

    console.log('=== ÉTAT ACTUEL ===');
    console.log('Status:', status);
    console.log('Authentifié:', isAuthenticated);
    console.log('User role:', user?.role);
    console.log('Countdown:', countdown);
    console.log('===================');

    // ✅ Fonction de redirection manuelle
    const handleManualRedirect = () => {
        let targetPath = '/dashboard';
        if (user?.role === 'invoice_manager') targetPath = '/facture';
        if (user?.role === 'dfc_agent') targetPath = '/dfc_traitment';
        
        console.log('🖱️ Redirection manuelle vers:', targetPath);
        window.location.href = targetPath;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-login p-4">
            <div className="w-full max-w-md bg-white/80 backdrop-blur rounded-2xl shadow p-8 text-center">
                {status === 'loading' && (
                    <>
                        <div className="mx-auto mb-4 h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        <h1 className="text-xl font-semibold text-gray-800">Vérification en cours</h1>
                        <p className="text-gray-600">Veuillez patienter...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-semibold text-green-800 mb-2">Inscription réussie !</h1>
                        <p className="text-gray-600 mb-4">{message}</p>
                        
                        {/* ✅ Affichage du compte à rebours */}
                        <div className="mb-6 p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-700 mb-2">
                                Redirection automatique dans :
                            </p>
                            <div className="text-2xl font-bold text-green-800">
                                {countdown} seconde{countdown > 1 ? 's' : ''}
                            </div>
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-4">
                            Vers {user?.role === 'dfc_agent' ? 'la page DFC' : 
                                 user?.role === 'invoice_manager' ? 'la page de facturation' : 
                                 'le tableau de bord'}
                        </p>
                        
                        {/* ✅ Bouton de redirection manuelle */}
                        <button 
                            onClick={handleManualRedirect}
                            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                        >
                            Rediriger maintenant
                        </button>
                        
                        {/* ✅ Lien manuel de secours */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-2">Si la redirection ne fonctionne pas :</p>
                            <div className="flex gap-4 justify-center">
                                {user?.role === 'dfc_agent' ? (
                                    <a href="/dfc_traitment" className="text-sm text-blue-500 hover:underline">
                                        Aller à la page DFC
                                    </a>
                                ) : user?.role === 'invoice_manager' ? (
                                    <a href="/facture" className="text-sm text-blue-500 hover:underline">
                                        Aller à la facturation
                                    </a>
                                ) : (
                                    <a href="/admin/Dashboard" className="text-sm text-blue-500 hover:underline">
                                        Aller au tableau de bord
                                    </a>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-semibold text-red-800 mb-2">Erreur de vérification</h1>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <a 
                            href="/globale/Register"
                            className="inline-block px-6 py-3 rounded-lg bg-gray-800 text-white hover:bg-black transition-colors font-medium"
                        >
                            Créer un compte
                        </a>
                    </>
                )}
            </div>
        </div>
    );
}

export default Verify;