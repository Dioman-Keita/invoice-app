// hooks/useAuth.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useToastFeedback from '../hooks/useToastFeedback';
import api from './api';

export function useAuth() {
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        user: null,
        isLoading: true,
        isInitialized: false
    });
    
    const { success, error } = useToastFeedback();
    const navigate = useNavigate();
    const location = useLocation();

    // Vérification légère du statut d'authentification
    const checkAuthStatus = useCallback(async () => {
        try {
            const response = await api.get('/auth/status');
            console.log('🔐 checkAuthStatus response:', response);
            
            // Vérifiez la structure de réponse
            if (response?.success === true && response.data?.isAuthenticated) {
                setAuthState({
                    isAuthenticated: true,
                    user: response.data.user, // response.data.user et non response.user
                    isLoading: false,
                    isInitialized: true
                });
                return true;
            } else {
                setAuthState({
                    isAuthenticated: false,
                    user: null,
                    isLoading: false,
                    isInitialized: true
                });
                return false;
            }
        } catch (err) {
            console.error('🔐 Auth status error:', err);
            setAuthState({
                isAuthenticated: false,
                user: null,
                isLoading: false,
                isInitialized: true
            });
            return false;
        }
    }, []);

    // Chargement complet du profil (seulement quand nécessaire)
    const fetchUserProfile = useCallback(async () => {
        try {
            const response = await api.get('/auth/profile');
            
            if (response?.success === true && response.user) {
                setAuthState(prev => ({
                    ...prev,
                    user: response.user
                }));
                return response.user;
            }
            return null;
        } catch (err) {
            console.error('Erreur lors du chargement du profil:', err);
            return null;
        }
    }, []);

    // Vérification initiale
    useEffect(() => {
        const publicPages = ['/register', '/login', '/verify', '/forgot-password'];
        const isPublicPage = publicPages.some(page => location.pathname.startsWith(page));

        if (isPublicPage) {
            setAuthState(prev => ({ ...prev, isLoading: false, isInitialized: true }));
            return;
        }

        checkAuthStatus();
    }, [location.pathname, checkAuthStatus]);

    const register = useCallback(async (payload) => {

        try {

            const response = await api.post('/auth/register', payload);
    
            if (response.success !== true) {
                return {
                    success: false,
                    message: response.message,
                };
            }

            return {
                success: true,
                userId: response.userId,
                email: payload.email
            };
    
        } catch (err) {
            let message = "Erreur lors de l'inscription";
            let field = undefined;
            
            // Gestion d'erreur structurée
            if (err?.response?.data) {
                message = err.response.data.message || message;
                field = err.response.data?.field;
            } else if (err.message) {
                message = err.message;
            }
            return {
                success: false,
                message,
            };
        }
    }, []);

// hooks/useAuth.ts - Correction de finalizeRegister
const finalizeRegister = useCallback(async (token) => {
    try {
        const response = await api.post('/auth/verify-registration-token', { token });

        if (response?.success === true) {
            // FORCER la vérification du statut d'authentification
            await checkAuthStatus();
                        
            return { 
                success: true, 
                message: response.message,
                user: response.data?.user 
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
}, [success, error, checkAuthStatus]); // Ajouter checkAuthStatus aux dépendances

    const login = useCallback(async (credentials) => {
        try {
            const response = await api.post('/auth/login', credentials);
            
            if (response?.success === true) {
                await checkAuthStatus();
                return { success: true, message: response.message || "Connexion réussie" };
            } else {
                return { success: false, message: response?.message };
            }
        } catch (err) {
            const message = err?.response?.data?.message || "Échec de la connexion";
            return { success: false, message };
        }
    }, [navigate, checkAuthStatus]);

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout');
            success('Déconnexion réussie');
        } catch (err) {
            console.error('Erreur lors de la déconnexion:', err);
        } finally {
            setAuthState({
                isAuthenticated: false,
                user: null,
                isLoading: false,
                isInitialized: true
            });
            navigate('/login', { replace: true });
        }
    }, [success, navigate]);

    return useMemo(() => ({
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
        isLoading: authState.isLoading,
        isInitialized: authState.isInitialized,
        login,
        logout,
        register,
        finalizeRegister,
        checkAuthStatus,
        fetchUserProfile
    }), [authState, login, logout, register, finalizeRegister, checkAuthStatus, fetchUserProfile]);
}