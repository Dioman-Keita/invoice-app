import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../services/useAuth";
import useTitle from "../hooks/useTitle";
import useToastFeedback from "../hooks/useToastFeedback";
import Header from '../components/Header';

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
    const [activeTab, setActiveTab] = useState('personal');
    const [userData, setUserData] = useState(null);

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

    // Fonction simplifiée pour générer les initiales
    const getInitials = () => {
        if (!userData?.firstName) return '?';
        const first = userData.firstName[0];
        const last = userData.lastName?.[0] || '';
        return (first + last).toUpperCase();
    };

    // Icônes SVG
    const TabIcons = {
        personal: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
        security: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
        activity: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        invoice: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        )
    };

    const SecurityIcons = {
        refresh: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
        password: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
        ),
        shield: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        logout: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
        ),
        invoice: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        )
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await new Promise(res => setTimeout(res, 3000));
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

    const isSilentRefreshingRef = useRef(false);  // ← AJOUTE cette ligne

    const handleSilentRefresh = async () => {
        // 🔒 Vérifier si déjà en cours
        if (isSilentRefreshingRef.current) {
            console.log('🔄 silentRefresh déjà en cours dans Profile');
            return;
        }
        
        isSilentRefreshingRef.current = true;  // 🔒 Activer le verrou
        setIsRefreshing(true);
        
        try {
            await new Promise(res => setTimeout(res, 3000));
            await silentRefresh();
            setLastUpdate(new Date().toLocaleTimeString());
            info('Session rafraîchie avec succès');
        } catch (err) {
            console.error('Erreur lors du rafraîchissement de session:', err);
            error('Erreur lors du rafraîchissement de la session');
        } finally {
            isSilentRefreshingRef.current = false;  // 🔒 Désactiver le verrou
            setIsRefreshing(false);
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    const handleNewInvoice = () => {
        info('Redirection vers la page de facturation...');
        // Petit délai pour laisser voir le toast
        setTimeout(() => {
            navigate('/facture');
        }, 3000);
    };

    const handleDashboardAccess = () => {
        info('Redirection vers le dashboard...');
        setTimeout(() => {
            navigate('/dashboard');
        }, 3000);
    };

    if (isLoading || !isInitialized) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
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

    const tabs = [
        { id: 'personal', label: 'Profil', icon: TabIcons.personal },
        { id: 'security', label: 'Sécurité', icon: TabIcons.security },
        { id: 'activity', label: 'Activité', icon: TabIcons.activity },
        { id: 'invoice', label: 'Facturation', icon: TabIcons.invoice }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'personal':
                return (
                    <div className="space-y-8">
                        {/* Section Informations Personnelles */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                                Informations Personnelles
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Prénom</label>
                                        <div className="text-lg font-medium text-gray-900 py-2">
                                            {userData?.firstName || 'Non renseigné'}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Email</label>
                                        <div className="text-lg font-medium text-gray-900 py-2 flex items-center">
                                            {userData?.email}
                                            {userData?.isVerified && (
                                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                                    ✓ Vérifié
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Nom</label>
                                        <div className="text-lg font-medium text-gray-900 py-2">
                                            {userData?.lastName || 'Non renseigné'}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Téléphone</label>
                                        <div className="text-lg font-medium text-gray-900 py-2">
                                            {userData?.phone || 'Non renseigné'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section Informations Professionnelles */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                                Informations Professionnelles
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Matricule</label>
                                    <div className="text-lg font-medium text-gray-900 py-2">
                                        {userData?.employeeId || '—'}
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Département</label>
                                    <div className="text-lg font-medium text-gray-900 py-2">
                                        {userData?.department || 'Non renseigné'}
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Poste</label>
                                    <div className="text-lg font-medium text-gray-900 py-2">
                                        {userData?.role ? (
                                            <span className="capitalize">{userData.role.replace('_', ' ')}</span>
                                        ) : (
                                            'Non renseigné'
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-4 justify-end">
                            <button className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Modifier le profil
                            </button>
                            <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Exporter les données
                            </button>
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="space-y-8">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                                Session actuelle
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-xl p-5 border border-amber-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-gray-600 font-medium">Type de session</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            isSessionPersistent 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {isSessionPersistent ? 'Persistante' : 'Standard'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {isSessionPersistent 
                                            ? 'Votre session restera active plus longtemps' 
                                            : 'Session temporaire, sécurisée'
                                        }
                                    </p>
                                </div>
                                <div className="bg-white rounded-xl p-5 border border-amber-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-gray-600 font-medium">Statut du compte</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            userData?.isActive 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {userData?.isActive ? 'Actif' : 'Inactif'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {userData?.isActive 
                                            ? 'Votre compte est actif et fonctionnel' 
                                            : 'Votre compte est temporairement désactivé'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button 
                                onClick={handleSilentRefresh}
                                disabled={isRefreshing}
                                className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all text-left group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                        {SecurityIcons.refresh}
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                                <div className="font-semibold text-gray-900 mb-2">Rafraîchir la session</div>
                                <div className="text-sm text-gray-600">Renouveler votre session de manière sécurisée</div>
                            </button>

                            <button className="p-6 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all text-left group focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                        {SecurityIcons.password}
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                                <div className="font-semibold text-gray-900 mb-2">Changer le mot de passe</div>
                                <div className="text-sm text-gray-600">Mettre à jour votre sécurité d'accès</div>
                            </button>

                            <button className="p-6 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all text-left group focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                        {SecurityIcons.shield}
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                                <div className="font-semibold text-gray-900 mb-2">Authentification 2FA</div>
                                <div className="text-sm text-gray-600">Sécurité renforcée par double authentification</div>
                            </button>

                            <button 
                                onClick={handleLogout}
                                className="p-6 bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-lg transition-all text-left group focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                        {SecurityIcons.logout}
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                                <div className="font-semibold text-gray-900 mb-2">Déconnexion</div>
                                <div className="text-sm text-gray-600">Quitter la session en cours</div>
                            </button>
                        </div>
                    </div>
                );

            case 'activity':
                return (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                                <div className="text-3xl font-bold mb-2">12</div>
                                <div className="text-blue-100">Connexions ce mois</div>
                                <div className="text-blue-200 text-sm mt-2">+2 vs mois dernier</div>
                            </div>
                            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                                <div className="text-3xl font-bold mb-2">3j 4h</div>
                                <div className="text-green-100">Session active</div>
                                <div className="text-green-200 text-sm mt-2">Depuis votre dernière connexion</div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                                <div className="text-3xl font-bold mb-2">99%</div>
                                <div className="text-purple-100">Disponibilité</div>
                                <div className="text-purple-200 text-sm mt-2">Performance optimale</div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                                Activité récente
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 truncate">Connexion réussie</div>
                                        <div className="text-sm text-gray-600 truncate">Navigateur Chrome • IP: 192.168.1.1</div>
                                    </div>
                                    <div className="text-xs text-gray-500 whitespace-nowrap">Maintenant</div>
                                </div>
                                
                                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 truncate">Session rafraîchie</div>
                                        <div className="text-sm text-gray-600 truncate">Rafraîchissement automatique</div>
                                    </div>
                                    <div className="text-xs text-gray-500 whitespace-nowrap">Il y a 15 min</div>
                                </div>
                                
                                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="w-3 h-3 bg-gray-500 rounded-full flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 truncate">Profil consulté</div>
                                        <div className="text-sm text-gray-600 truncate">Page des paramètres utilisateur</div>
                                    </div>
                                    <div className="text-xs text-gray-500 whitespace-nowrap">Il y a 1 heure</div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

                case 'invoice':
                    return (
                        <div className="space-y-8">
                            {/* Section adaptée selon le rôle */}
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                                    Gestion des Factures
                                </h3>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Pour invoice_manager - design inchangé */}
                                    {userData?.role === 'invoice_manager' && (
                                        <>
                                            <button 
                                                onClick={handleNewInvoice}
                                                className="p-8 bg-white rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-500 hover:shadow-lg transition-all text-center group focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            >
                                                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-100 transition-colors">
                                                    {SecurityIcons.invoice}
                                                </div>
                                                <div className="font-semibold text-gray-900 mb-2 text-lg">
                                                    Enregistrer une nouvelle facture
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Créer et enregistrer une nouvelle facture dans le système
                                                </div>
                                                <div className="mt-4 text-purple-600 text-sm font-medium flex items-center justify-center">
                                                    <span>Accéder à la facturation</span>
                                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </button>
                                        </>
                                    )}
                
                                    {/* Pour dfc_agent - seulement gestion des factures */}
                                    {userData?.role === 'dfc_agent' && (
                                        <button 
                                            onClick={() => {
                                                info('Redirection vers la gestion des factures...');
                                                setTimeout(() => navigate('/dfc_traitment'), 3000);
                                            }}
                                            className="p-8 bg-white rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-500 hover:shadow-lg transition-all text-center group focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        >
                                            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-100 transition-colors">
                                                {SecurityIcons.invoice}
                                            </div>
                                            <div className="font-semibold text-gray-900 mb-2 text-lg">
                                                Gérer les factures
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Traiter et gérer les factures en attente de validation
                                            </div>
                                            <div className="mt-4 text-purple-600 text-sm font-medium flex items-center justify-center">
                                                <span>Accéder au traitement</span>
                                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </button>
                                    )}
                
                                    {/* Pour admin - les deux sections */}
                                    {userData?.role === 'admin' && (
                                        <>
                                            <button 
                                                onClick={handleNewInvoice}
                                                className="p-8 bg-white rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-500 hover:shadow-lg transition-all text-center group focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            >
                                                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-100 transition-colors">
                                                    {SecurityIcons.invoice}
                                                </div>
                                                <div className="font-semibold text-gray-900 mb-2 text-lg">
                                                    Enregistrer une nouvelle facture
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Créer et enregistrer une nouvelle facture dans le système
                                                </div>
                                                <div className="mt-4 text-purple-600 text-sm font-medium flex items-center justify-center">
                                                    <span>Accéder à la facturation</span>
                                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </button>
                
                                            <button 
                                                onClick={() => {
                                                    info('Redirection vers la gestion des factures...');
                                                    setTimeout(() => navigate('/dfc_traitment'), 3000);
                                                }}
                                                className="p-8 bg-white rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 hover:shadow-lg transition-all text-center group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <div className="font-semibold text-gray-900 mb-2 text-lg">
                                                    Gérer les factures
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Traiter et gérer les factures en attente de validation
                                                </div>
                                                <div className="mt-4 text-blue-600 text-sm font-medium flex items-center justify-center">
                                                    <span>Accéder au traitement</span>
                                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </button>
                                        </>
                                    )}
                
                                    {/* Statistiques communes à tous */}
                                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                                        <h4 className="font-semibold text-gray-900 mb-4">Statistiques des factures</h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Factures ce mois</span>
                                                <span className="font-semibold text-gray-900">24</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">En attente</span>
                                                <span className="font-semibold text-amber-600">3</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Validées</span>
                                                <span className="font-semibold text-green-600">18</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Rejetées</span>
                                                <span className="font-semibold text-red-600">3</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                
                            {/* Section Dashboard uniquement pour admin */}
                            {userData?.role === 'admin' && (
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                                        Administration
                                    </h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <button 
                                            onClick={handleDashboardAccess}
                                            className="p-8 bg-white rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:shadow-lg transition-all text-center group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        >
                                            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-100 transition-colors">
                                                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                            </div>
                                            <div className="font-semibold text-gray-900 mb-2 text-lg">
                                                Accéder au Dashboard
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Consulter les statistiques et indicateurs de performance
                                            </div>
                                            <div className="mt-4 text-indigo-600 text-sm font-medium flex items-center justify-center">
                                                <span>Voir le dashboard</span>
                                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                
                            {/* Actions rapides communes */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <button className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all text-left group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="font-semibold text-gray-900 mb-2">Voir mes factures</div>
                                    <div className="text-sm text-gray-600">Consulter l'historique des factures</div>
                                </button>
                
                                <button className="p-6 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all text-left group focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="font-semibold text-gray-900 mb-2">Rapports</div>
                                    <div className="text-sm text-gray-600">Générer des rapports de facturation</div>
                                </button>
                
                                <button className="p-6 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all text-left group focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="font-semibold text-gray-900 mb-2">Modèles</div>
                                    <div className="text-sm text-gray-600">Gérer les modèles de facture</div>
                                </button>
                            </div>
                        </div>
                    );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-login">
            <Header />
            
            {/* Session Alert */}
            {willExpireSoon && (
                <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white mt-4">
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

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Mon Profil</h1>
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
                        <span>{isRefreshing ? 'Actualisation' : 'Actualiser'}</span>
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
                                    <span className="text-gray-500">Numéro employé</span>
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
                    <div className="xl:col-span-3">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Tabs - Focus amélioré */}
                            <div className="border-b border-gray-200">
                                <div className="flex overflow-x-auto scrollbar-hide p-2">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                                                activeTab === tab.id
                                                    ? 'bg-blue-50 text-blue-600 font-medium border border-blue-200'
                                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                        >
                                            {tab.icon}
                                            <span>{tab.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {renderTabContent()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;