import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useToastFeedback from '../ui/useToastFeedBack.js';
import api from '../../services/api.js';

export function useAuth() {
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        user: null,
        isLoading: true,
        isInitialized: false,
        shouldRefresh: false,
        expiresIn: null,
        rememberMe: false
    });
    
    const { success } = useToastFeedback();
    const navigate = useNavigate();
    const location = useLocation();

    // Références pour gérer les intervalles et états
    const checkIntervalRef = useRef(null);
    const isCheckingRef = useRef(false);
    const lastCheckRef = useRef(0);

    // Configuration modifiable
    const CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes entre les checks
    const MIN_CHECK_INTERVAL = 30 * 1000; // 30s minimum entre checks forcés
    const REFRESH_THRESHOLD = 15 * 60 * 1000; // 15 minutes avant expiration

    // Détection d'activité utilisateur
    const setupActivityMonitoring = useCallback(() => {
        const events = ['click', 'keypress', 'scroll', 'mousemove', 'touchstart'];
        
        const handleActivity = () => {
            lastCheckRef.current = Date.now();
        };

        events.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
        };
    }, []);

    // Vérification intelligente du statut d'authentification
    const checkAuthStatus = useCallback(async (forceCheck = false) => {
        if (isCheckingRef.current && !forceCheck) {
            console.log('🔐 Check déjà en cours, skip...');
            return authState.isAuthenticated;
        }

        const now = Date.now();
        if (!forceCheck && (now - lastCheckRef.current < MIN_CHECK_INTERVAL)) {
            console.log('🔐 Check trop rapproché, skip...');
            return authState.isAuthenticated;
        }

        isCheckingRef.current = true;
        lastCheckRef.current = now;

        try {
            const response = await api.get('/auth/status');
            console.log('🔐 checkAuthStatus response:', response);

            if (response?.success === true && response.data?.isAuthenticated) {
                setAuthState(prev => ({
                    ...prev,
                    isAuthenticated: true,
                    user: response.data.user,
                    isLoading: false,
                    isInitialized: true,
                    shouldRefresh: response.data.shouldRefresh || false,
                    expiresIn: response.data.expiresIn,
                    rememberMe: response.data.rememberMe || false
                }));
                return true;
            } else {
                setAuthState(prev => ({
                    ...prev,
                    isAuthenticated: false,
                    user: null,
                    isLoading: false,
                    isInitialized: true,
                    shouldRefresh: false,
                    expiresIn: null,
                    rememberMe: false
                }));
                return false;
            }
        } catch (error) {
            // Gestion silencieuse des erreurs pour éviter de polluer la console
            if (error?.response?.status === 401) {
                // Erreur d'authentification normale - pas de log
                setAuthState(prev => ({
                    ...prev,
                    isAuthenticated: false,
                    user: null,
                    isLoading: false,
                    isInitialized: true,
                    shouldRefresh: false,
                    expiresIn: null,
                    rememberMe: false
                }));
            } else {
                // Autres erreurs - log seulement en mode développement
                if (import.meta.env.MODE === 'development') {
                    console.error('🔐 Auth status error:', error);
                }
                setAuthState(prev => ({
                    ...prev,
                    isAuthenticated: false,
                    user: null,
                    isLoading: false,
                    isInitialized: true,
                    shouldRefresh: false,
                    expiresIn: null,
                    rememberMe: false
                }));
            }
            return false;
        } finally {
            isCheckingRef.current = false;
        }
    }, [authState.isAuthenticated, MIN_CHECK_INTERVAL]);

    // Renouvellement silencieux intelligent
    const silentRefresh = useCallback(async () => {
        try {
            const response = await api.post('/auth/silent-refresh');
            
            if (response?.success === true && response.data?.renewed) {
                setAuthState(prev => ({
                    ...prev,
                    shouldRefresh: false,
                    expiresIn: response.data.expiresIn,
                    rememberMe: response.data.rememberMe
                }));
                
                console.log('🔄 Token renouvelé silencieusement');
                return true;
            }
            return false;
        } catch (err) {
            // Gestion silencieuse des erreurs de refresh
            if (err?.response?.status === 401) {
                console.log('🔄 silentRefresh échoué - vérification statut sans boucle');
                setAuthState(prev => ({
                    ...prev,
                    isAuthenticated: false,
                    user: null,
                    shouldRefresh: false,  // ← IMPORTANT : forcer à false
                    expiresIn: null,
                    rememberMe: false
                }));
            } else if (import.meta.env.MODE === 'development') {
                // Log seulement en mode développement pour les autres erreurs
                console.error('🔐 Silent refresh error:', err);
            }
            return false;
        }
    }, []);

    // Démarrage de la surveillance périodique améliorée
    const startPeriodicCheck = useCallback(() => {
        if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
        }

        if (authState.isAuthenticated) {
            checkIntervalRef.current = setInterval(async () => {
                const isStillAuthenticated = await checkAuthStatus();
                
                if (isStillAuthenticated) {
                    console.log('🔐 Statut vérifié - session active');
                }
            }, CHECK_INTERVAL);

            console.log('🔐 Surveillance intelligente démarrée');
        }
    }, [authState.isAuthenticated, checkAuthStatus, CHECK_INTERVAL]);

    // Arrêt de la surveillance
    const stopPeriodicCheck = useCallback(() => {
        if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
            console.log('🔐 Surveillance arrêtée');
        }
    }, []);

    // Vérification proactive avant expiration
    const startProactiveRefresh = useCallback(() => {
        if (!authState.expiresIn || authState.expiresIn <= 0) return;

        const refreshTime = Math.max(authState.expiresIn - 5 * 60 * 1000, 5000);
        
        console.log(`🔄 Refresh planifié dans ${refreshTime}ms`);
        
        const timeoutId = setTimeout(async () => {
            if (authState.isAuthenticated) {
                await silentRefresh();
            }
        }, refreshTime);

        return () => clearTimeout(timeoutId);
    }, [authState.expiresIn, authState.isAuthenticated, silentRefresh]);

    // Gestion automatique de la surveillance
    useEffect(() => {
        if (authState.isInitialized) {
            if (authState.isAuthenticated) {
                startPeriodicCheck();
                const cleanupActivity = setupActivityMonitoring();
                
                return () => {
                    stopPeriodicCheck();
                    cleanupActivity();
                };
            } else {
                stopPeriodicCheck();
            }
        }
    }, [authState.isAuthenticated, authState.isInitialized, startPeriodicCheck, stopPeriodicCheck, setupActivityMonitoring]);

    // Refresh proactive basé sur l'expiration
    useEffect(() => {
        if (authState.isAuthenticated && authState.expiresIn) {
            let cleanup;
            cleanup = startProactiveRefresh();
            return cleanup;
        }
    }, [authState.isAuthenticated, authState.expiresIn, startProactiveRefresh]);

    // Vérification initiale au chargement
    useEffect(() => {
        const publicPage = ['/register', '/login', '/verify', '/forgot-password', '/reset-password'];
        const isPublicPage = publicPage.some(page => location.pathname.startsWith(page));

        if (isPublicPage) {
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                isInitialized: true,
            }));
            return;
        }
        checkAuthStatus(true);
    }, [location.pathname, checkAuthStatus]);

    // ✅ register - CONSERVÉ
    const register = useCallback(async (payload) => {
        try {
            const response = await api.post('/auth/register', payload, { timeout: 30000 });
    
            if (response.success !== true) {
                return {
                    success: false,
                    message: response.message,
                };
            }

            return {
                success: true,
                userId: response.data.userId,
                email: payload.email,
                message: response.message
            };
        } catch (err) {
            let message = "Erreur lors de l'inscription";
            let field = undefined;

            const isBackendError = err?.response?.status >= 400 &&
                                   err?.response?.status <= 500 &&
                                   err?.response?.data?.message;
            if (isBackendError) {
                message = err.response.data.message;
                field = err.response.data?.field;
            } else {
                // Probable timeout réseau (envoi d'email peut dépasser 10s)
                message = err?.code === 'ECONNABORTED' ?
                    'Délai de réponse dépassé. Veuillez réessayer dans 1h.' :
                    "Une erreur technique est survenue. Veuillez réessayer.";
            }

            return {
                success: false,
                message,
                field
            };
        }
    }, []);

    // ✅ finalizeRegister - CONSERVÉ
    const finalizeRegister = useCallback(async (token) => {
        try {
            const response = await api.post('/auth/verify-registration-token', { token }, { timeout: 30000 });

            if (response?.success === true) {
                await checkAuthStatus();
                return { 
                    success: true, 
                    message: response.message,
                    user: response.user 
                };
            } else {
                return { 
                    success: false, 
                    message: response?.message 
                };
            }
        } catch (err) {
            let message = "Erreur lors de la vérification";
            
            if (err?.response?.data?.message) {
                message = err.response.data.message;
            } else if (err.message) {
                message = err.message;
            }
            
            return { 
                success: false, 
                message 
            };
        }
    }, [checkAuthStatus]);

    // Renvoyer l'email de vérification d'inscription
    const resendVerification = useCallback(async (email) => {
        try {
            const response = await api.post('/auth/resend-verification', { email });
            if (response?.success === true) {
                return { success: true, message: response.message || 'Email renvoyé' };
            }
            return { success: false, message: response?.message || 'Échec du renvoi' };
        } catch (err) {
            const message = err?.response?.data?.message || err?.message || 'Erreur lors du renvoi';
            return { success: false, message };
        }
    }, []);

    // Login amélioré avec gestion rememberMe
    const login = useCallback(async (credentials) => {
        try {
            const response = await api.post('/auth/login', credentials);
            
            if (response?.success === true) {
                await checkAuthStatus(true);
                return { 
                    success: true, 
                    message: response.message || "Connexion réussie",
                    rememberMe: credentials.rememberMe,
                    role: response.role,
                };
            } else {
                return { success: false, message: response?.message };
            }
        } catch (err) {
            let message = "Erreur lors de l'inscription";
            let field = undefined;

            const isBackendError = err?.response?.status >= 400 &&
                                   err?.response?.status <= 500 &&
                                   err?.response?.data?.message;
            if (isBackendError) {
                message = err.response.data.message;
                field = err.response.data?.field;
            } else {
                message = "Une erreur technique est survenue. Veuillez réessayer.";
            }

            return {
                success: false,
                message,
                field
            };
        }
    }, [checkAuthStatus]);

    // Logout amélioré
    const logout = useCallback(async () => {
        stopPeriodicCheck();
        try {
            const response = await api.post('/auth/logout');
            if (response.success === true) {
                success(response.message || 'Déconnexion réussie');
                return;
            }
        } catch (err) {
            console.error('Erreur lors de la déconnexion:', err);
        } finally {
            setAuthState({
                isAuthenticated: false,
                user: null,
                isLoading: false,
                isInitialized: true,
                shouldRefresh: false,
                expiresIn: null,
                rememberMe: false
            });
            navigate('/login', { replace: true });
        }
    }, [navigate, success, stopPeriodicCheck]);

    // Chargement complet du profil (seulement quand nécessaire) - CONSERVÉ
    const fetchUserProfile = useCallback(async () => {
        try {
            const response = await api.get('/auth/profile');
            
            if (response?.success === true && response.data?.user) {
                const user = response.data.user;
                return {
                    success: true,
                    firstName: user.firstname || '',
                    lastName: user.lastname || '',
                    email: user.email || '',
                    hash: user.password || '',
                    role: user.role || '',
                    phone: user.phone || '',
                    department: user.department || '',
                    userId: user.id,
                    employeeId: user.employee_cmdt_id || '',
                    createAt: user.create_at,
                    updateAt: user.update_at || user.create_at || '',
                    isVerified: Boolean(user.isVerified),
                    isActive: Boolean(user.isActive),
                }
            }
            return {
                success: false
            };
        } catch (err) {
            console.error('Erreur lors du chargement du profil:', err);
            return {
                success: false,
                message: err?.response?.data?.message || 'Une erreur interne est survenue'
            };
        }
    }, []);

    const forgotPassword = useCallback(async (credential) => {
        try {
            const response = await api.post('/auth/forgot-password', credential);
            if (response?.success === true) {
                return {
                    success: true,
                    message: response?.message,
                }
            }
            return {
                success: false,
                message: response?.data?.message || 'Erreur lors de l\'envoi du lien'
            }
        } catch (error) {
            if (error?.response?.status >= 400 && error?.response?.status <= 500) {
                return {
                    success: false,
                    message: error?.response?.data?.message || 'Erreur lors de l\'envoi du lien'
                }
            }
            return {
                success: false,
                message: 'Erreur de connexion'
            }
        }
    }, [])

    const resetPassword = useCallback(async (credentials) => {
        try {
            const response = await api.post('/auth/reset-password', credentials);
            if (response?.success === true) {
                return {
                    success: true,
                    message: response?.message
                }
            }
            return {
                success: false,
                message: response?.message || 'Erreur lors de la réinitialisation'
            }
        } catch (error) {
            if (error?.response?.status >= 400 && error?.response?.status <= 500) {
                return {
                    success: false,
                    message: error?.response?.data?.message || 'Erreur lors de la réinitialisation'
                }
            }
            return {
                success: false,
                message: 'Erreur de connexion'
            }
        }
    }, [])

    // Refresh manuel pour les composants
    const refreshAuth = useCallback(async () => {
        return await checkAuthStatus(true);
    }, [checkAuthStatus]);

    return useMemo(() => ({
        // État étendu
        ...authState,
        
        // Actions originales - CONSERVÉES
        login,
        logout,
        register,
        finalizeRegister,
        resendVerification,
        forgotPassword,
        resetPassword,
        checkAuthStatus: refreshAuth,
        fetchUserProfile,
        startPeriodicCheck,
        stopPeriodicCheck,
        
        // Nouvelles actions intelligentes
        silentRefresh,
        
        // Utilitaires avancés
        hasSession: authState.isAuthenticated && authState.expiresIn !== null,
        willExpireSoon: authState.expiresIn ? authState.expiresIn < REFRESH_THRESHOLD : false,
        isSessionPersistent: authState.rememberMe
    }), [
        authState,
        login,
        logout,
        register,
        finalizeRegister,
        refreshAuth,
        fetchUserProfile,
        forgotPassword,
        resetPassword,
        startPeriodicCheck,
        stopPeriodicCheck,
        silentRefresh,
        REFRESH_THRESHOLD
    ]);
}