// components/Verify.jsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/useAuth'; // Correction du chemin

function Verify() {
    const [params] = useSearchParams();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Vérification en cours...');
    const navigate = useNavigate();
    const { finalizeRegister, isAuthenticated, checkAuthStatus } = useAuth();

    useEffect(() => {
        const token = params.get('token');
        if (!token) {
            setStatus('error');
            setMessage('Lien invalide ou token manquant.');
            return;
        }

        const verify = async () => {
            try {
                const result = await finalizeRegister(token);
                
                if (result?.success) {
                    setStatus('success');
                    setMessage(result.message || 'Votre inscription est vérifiée.');
                    
                    // Nettoyer l'URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                    
                    // Forcer une vérification immédiate
                    await checkAuthStatus();
                    
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
    }, [finalizeRegister, params, checkAuthStatus]);

    // Redirection IMMÉDIATE si authentifié (au lieu d'attendre 4s)
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/facture', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // Redirection après succès (fallback)
    useEffect(() => {
        if (status === 'success') {
            const timeout = setTimeout(() => {
                navigate('/facture', { replace: true });
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, [status, navigate]);

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
                        <p className="text-sm text-gray-500 animate-pulse">
                            Redirection vers la page de facturation...
                        </p>
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
                            href="/register" 
                            className="inline-block px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-black transition-colors"
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