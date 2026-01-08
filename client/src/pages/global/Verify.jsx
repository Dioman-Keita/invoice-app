import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth.js';
import useTitle from '../../hooks/ui/useTitle.js';

function Verify() {
    useTitle('CMDT - Vérification');
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Vérification en cours...');
    const [countdown, setCountdown] = useState(5); // 5 seconds countdown
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
                console.log('🔐 Verify - Verification start');
                const result = await finalizeRegister(token);

                console.log('🔐 Verify - finalizeRegister result:', result);

                if (result?.success) {
                    setStatus('success');
                    setMessage('Votre inscription est vérifiée.');
                    // No longer manually touching window.history to avoid HashRouter conflicts
                } else {
                    setStatus('error');
                    setMessage(result.message || 'Échec de la vérification.');
                }
            } catch (err) {
                console.error("Error in verify():", err);
                setStatus('error');
                setMessage("Erreur lors de la vérification.");
            }
        };

        verify();
    }, [finalizeRegister, params]);

    // ✅ 5 seconds countdown
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

    // ✅ REDIRECTION WITH 5 SECONDS TIMEOUT
    useEffect(() => {
        if (isAuthenticated && user) {
            console.log('🔍 Redirection attempt...');
            console.log('🔍 User role:', user.role);

            // Clear any previous timeout
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

                console.log('📍 Redirection after 5s to:', targetPath);

                // ✅ Using navigate for HashRouter
                navigate(targetPath, { replace: true });
            }, 5000); // 5 secondes

            // Cleanup on component destruction
            return () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
            };
        }
    }, [isAuthenticated, user, navigate]);

    // ✅ Manual redirection function
    const handleManualRedirect = () => {
        let targetPath = '/dashboard';
        if (user?.role === 'invoice_manager') targetPath = '/facture';
        if (user?.role === 'dfc_agent') targetPath = '/dfc_traitment';

        console.log('🖱️ Manual redirection to:', targetPath);
        navigate(targetPath, { replace: true });
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
                                    <Link to="/dfc_traitment" className="text-sm text-blue-500 hover:underline">
                                        Aller à la page DFC
                                    </Link>
                                ) : user?.role === 'invoice_manager' ? (
                                    <Link to="/facture" className="text-sm text-blue-500 hover:underline">
                                        Aller à la facturation
                                    </Link>
                                ) : (
                                    <Link to="/dashboard" className="text-sm text-blue-500 hover:underline">
                                        Aller au tableau de bord
                                    </Link>
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
                        <Link
                            to="/register"
                            className="inline-block px-6 py-3 rounded-lg bg-gray-800 text-white hover:bg-black transition-colors font-medium"
                        >
                            Créer un compte
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}

export default Verify;