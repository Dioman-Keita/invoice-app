import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuth.js";
import useTitle from "../../hooks/ui/useTitle.js";
import useToastFeedback from "../../hooks/ui/useToastFeedBack.js";
import Header from '../../components/global/Header.jsx';
import Navbar from "../../components/navbar/Navbar.jsx";

function Profile() {
    useTitle("CMDT - Profile");
    const { 
        isAuthenticated, 
        isLoading, 
        isInitialized, 
        fetchUserProfile,
        willExpireSoon,
        silentRefresh,
        isSessionPersistent,
        logout
    } = useAuth();
    
    const navigate = useNavigate();
    const { error, info } = useToastFeedback();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState('');
    const [userData, setUserData] = useState(null);
    const [showSessionAlert, setShowSessionAlert] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(false);

    useEffect(() => {
        async function fetchData() {
            if (!isLoading && isInitialized) {
                if (!isAuthenticated) {
                    navigate('/login');
                } else if (!userData) {
                    const data = await fetchUserProfile();
                    setUserData(data);
                } else {
                    setLastUpdate(new Date().toLocaleTimeString());
                }
            }
        }
        fetchData();
    }, [isAuthenticated, isLoading, isInitialized, userData, fetchUserProfile, navigate]);

    // Gestion fluide de l'alerte de session
    useEffect(() => {
        if (willExpireSoon && !showSessionAlert) {
            // Afficher l'alerte avec animation
            setShowSessionAlert(true);
            setTimeout(() => setIsAlertVisible(true), 10);
        } else if (!willExpireSoon && showSessionAlert) {
            // Masquer l'alerte avec animation
            setIsAlertVisible(false);
            setTimeout(() => setShowSessionAlert(false), 300);
        }
    }, [willExpireSoon, showSessionAlert]);

    // Fonction pour générer les initiales
    const getInitials = () => {
        if (!userData?.firstName) return '?';
        const first = userData.firstName[0];
        const last = userData.lastName?.[0] || '';
        return (first + last).toUpperCase();
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await new Promise(res => setTimeout(res, 1500));
            let data = await fetchUserProfile();
            if(data.success) {
                setUserData(data);
                setLastUpdate(new Date().toLocaleTimeString());
                info('Profil rafraîchi avec succès');
            } else {
                setUserData(null);
                error(data?.message || 'Une erreur interne est survenue');
            }
        } catch (err) {
            console.error('Erreur lors du rafraîchissement:', err);
            error('Erreur lors du rafraîchissement du profil');
        } finally {
            setIsRefreshing(false);
        }
    };

    const isSilentRefreshingRef = useRef(false);

    const handleSilentRefresh = async () => {
        if (isSilentRefreshingRef.current) return;
        
        isSilentRefreshingRef.current = true;
        setIsRefreshing(true);
        
        try {
            await new Promise(res => setTimeout(res, 1500));
            await silentRefresh();
            setLastUpdate(new Date().toLocaleTimeString());
            info('Session rafraîchie avec succès');
        } catch (err) {
            console.error('Erreur lors du rafraîchissement de session:', err);
            error('Erreur lors du rafraîchissement de la session');
        } finally {
            isSilentRefreshingRef.current = false;
            setIsRefreshing(false);
        }
    };

    const handleAlertRefresh = async () => {
        await handleSilentRefresh();
    };

    const handleLogout = async () => {
        await logout();
    };

    if (isLoading || !isInitialized) {
        return (
            <div className="min-h-screen bg-login">
                <Header />
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded-full w-64 mb-8"></div>
                        <div className="flex space-x-6">
                            <div className="w-20 h-20 bg-gray-200 rounded-2xl"></div>
                            <div className="flex-1 space-y-3">
                                <div className="h-6 bg-gray-200 rounded-full w-1/2"></div>
                                <div className="h-4 bg-gray-200 rounded-full w-1/3"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-login">
            <Header />
            <Navbar />
            
            {/* Session Alert avec animation fluide */}
            {showSessionAlert && (
                <div className={`
                    bg-gradient-to-r from-amber-400 to-orange-400 text-white 
                    transition-all duration-300 ease-in-out
                    ${isAlertVisible 
                        ? 'opacity-100 translate-y-0 mt-4' 
                        : 'opacity-0 -translate-y-2 h-0 overflow-hidden'
                    }
                `}>
                    <div className="max-w-6xl mx-auto px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                <span className="font-medium">Votre session expire bientôt</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Mon Profil</h1>
                        <p className="text-gray-600">Consultez et gérez vos informations personnelles</p>
                    </div>
                    <button 
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 hover:border-gray-400 hover:shadow-sm transition-all self-start lg:self-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {isRefreshing ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        )}
                        <span>{isRefreshing ? 'Actualisation...' : 'Actualiser'}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Profile Sidebar */}
                    <div className="xl:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center sticky top-8">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <span className="text-2xl font-bold text-white">
                                    {getInitials()}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 truncate" title={`${userData?.firstName} ${userData?.lastName}`}>
                                {userData?.firstName} {userData?.lastName}
                            </h2>
                            <p className="text-gray-600 text-sm mt-1 truncate" title={userData?.email}>
                                {userData?.email}
                            </p>
                            <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full mt-3 capitalize">
                                {userData?.role?.replace('_', ' ') || 'Utilisateur'}
                            </div>

                            <div className="mt-6 space-y-3 text-left">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Compte vérifié</span>
                                    <span className={userData?.isVerified ? 'text-green-600 font-medium' : 'text-amber-600'}>
                                        {userData?.isVerified ? '✓ Vérifié' : '⏳ En attente'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">ID</span>
                                    <span className="text-gray-900 font-medium font-mono">
                                        {userData?.userId || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Dernière mise à jour</span>
                                    <span className="text-gray-900 font-medium">{lastUpdate}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Statut</span>
                                    <span className={`font-medium ${userData?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                        {userData?.isActive ? 'Actif' : 'Inactif'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="xl:col-span-3 space-y-6">
                        {/* Section Informations Personnelles */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations Personnelles</h3>
                                    <p className="text-gray-600 text-sm">Vos coordonnées et informations de contact</p>
                                </div>
                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Prénom</label>
                                        <div className="text-lg font-medium text-gray-900 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                                            {userData?.firstName || 'Non renseigné'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Email</label>
                                        <div className="text-lg font-medium text-gray-900 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 flex items-center justify-between">
                                            <span>{userData?.email}</span>
                                            {userData?.isVerified && (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                                    ✓ Vérifié
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Nom</label>
                                        <div className="text-lg font-medium text-gray-900 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                                            {userData?.lastName || 'Non renseigné'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Téléphone</label>
                                        <div className="text-lg font-medium text-gray-900 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                                            {userData?.phone || 'Non renseigné'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section Informations Professionnelles */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations Professionnelles</h3>
                                    <p className="text-gray-600 text-sm">Votre poste et département au sein de l'entreprise</p>
                                </div>
                                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                                    </svg>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Matricule</label>
                                    <div className="text-lg font-medium text-gray-900 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 font-mono">
                                        {userData?.employeeId || '—'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Département</label>
                                    <div className="text-lg font-medium text-gray-900 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                                        {userData?.department || 'Non renseigné'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Poste</label>
                                    <div className="text-lg font-medium text-gray-900 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 capitalize">
                                        {userData?.role ? userData.role.replace('_', ' ') : 'Non renseigné'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section Sécurité */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Sécurité et Session</h3>
                                    <p className="text-gray-600 text-sm">Gérez votre session et votre sécurité</p>
                                </div>
                                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Colonne gauche */}
                                <div className="space-y-6">
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-gray-700 font-medium">Type de session</span>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                isSessionPersistent 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {isSessionPersistent ? 'Persistante' : 'Standard'}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm">
                                            {isSessionPersistent 
                                                ? 'Votre session restera active plus longtemps' 
                                                : 'Session temporaire sécurisée'
                                            }
                                        </p>
                                    </div>

                                    <button 
                                        onClick={handleSilentRefresh}
                                        disabled={isRefreshing}
                                        className="w-full flex items-center justify-between p-4 bg-white border border-gray-300 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </div>
                                            <div className="text-left">
                                                <div className="font-semibold text-gray-900">Rafraîchir la session</div>
                                                <div className="text-sm text-gray-600">Renouveler votre session</div>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Colonne droite */}
                                <div className="space-y-6">
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-gray-700 font-medium">Statut du compte</span>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                userData?.isActive 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {userData?.isActive ? 'Actif' : 'Inactif'}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm">
                                            {userData?.isActive 
                                                ? 'Votre compte est actif et fonctionnel' 
                                                : 'Votre compte est temporairement désactivé'
                                            }
                                        </p>
                                    </div>

                                    <button 
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-between p-4 bg-white border border-gray-300 rounded-xl hover:border-red-400 hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                            </div>
                                            <div className="text-left">
                                                <div className="font-semibold text-gray-900">Déconnexion</div>
                                                <div className="text-sm text-gray-600">Quitter la session en cours</div>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;