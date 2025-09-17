// hooks/useAuth.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useToastFeedback from '../hooks/useToastFeedback';
import api from './api';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [isLoading, setLoading] = useState(true);
    const { success, error } = useToastFeedback();
    const navigate = useNavigate();

    const fetchMe = useCallback(async () => {
        try {
            const me = await api.get('/auth/me');
            if (me?.success !== true) {
                setUser(null);
                return null;
            }
            setUser(me);
            return me;
        } catch (err) {
            setUser(null);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [error]);

    useEffect(() => {
        if (window.location.pathname === '/login') {
            setLoading(false);
            return;
        }
        fetchMe(true);
    }, [fetchMe]);

    const login = useCallback(async ({ email, password }) => {
        try {
            const data = await api.post('/auth/login', { email, password });
            if (data?.success === true) {
                success(data.message || 'Connexion réussie');
                await fetchMe(false); // Ne pas montrer d'erreur ici
                setTimeout(() => {
                    navigate('/facture', { replace: true });
                }, 2000); // Réduit à 2s pour une meilleure UX
            } else {
                error(data?.message || "Échec de la connexion");
            }
        } catch (err) {
            error(err?.response?.data?.message || "Échec de la connexion");
            throw err;
        }
    }, [success, error, fetchMe, navigate]);

    const register = useCallback(async (payload) => {
        try {
            const data = await api.post('/auth/register', { ...payload });
            if (data.success !== true) {
                error(data?.message || "Erreur lors de l'inscription");
                return;
            } else {
                success(data.message || "Consulter votre courrier pour finaliser la création de votre compte");
            }
            await fetchMe(false);
        } catch (err) {
            error(err?.response?.data?.message || "Erreur lors de l'inscription");
            throw err;
        }
    }, [success, error, fetchMe]);

    const logout = useCallback(async () => {
        try {
            const data = await api.post('/auth/logout');
            if (data?.success !== true) {
                error(data?.message || "Erreur lors de la déconnexion");
            } else {
                success(data.message || 'Déconnecté');
            }
            setUser(null);
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 2000);
        } catch (err) {
            error(err?.response?.data?.message || "Erreur lors de la déconnexion");
            throw err;
        }
    }, [success, error, navigate]);

    return useMemo(() => ({
        isAuthenticated: Boolean(user),
        isLoading,
        user,
        register,
        login,
        logout,
        refresh: fetchMe
    }), [user, isLoading, register, login, logout, fetchMe]);
}