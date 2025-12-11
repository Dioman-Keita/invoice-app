import { useEffect, useState } from 'react';
import Navbar from '../../components/navbar/Navbar.jsx';
import useTitle from '../../hooks/ui/useTitle.js';
import {
    Cog6ToothIcon,
    ArrowPathIcon,
    CalendarDaysIcon,
    MoonIcon,
    SunIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    ShieldExclamationIcon,
    DocumentTextIcon,
    CogIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

function Settings() {
    useTitle('CMDT - Paramètres Système');

    const [prefs, setPrefs] = useState(() => {
        try {
            const raw = localStorage.getItem('cmdt:prefs');
            return raw ? JSON.parse(raw) : { prefersDark: false, autoYearSwitch: true };
        } catch {
            return { prefersDark: false, autoYearSwitch: true };
        }
    });

    const [yearSwitchInfo, setYearSwitchInfo] = useState(null);
    const [activeModal, setActiveModal] = useState(null);
    const [selectedYear, setSelectedYear] = useState('');
    const [_loading, setLoading] = useState(false);
    const [serverSettings, setServerSettings] = useState(null);
    const [warningInfo, setWarningInfo] = useState(null);
    const [errorMsg, setErroMsg] = useState(null);
    const [apiLoading, setApiLoading] = useState({ autoSwitch: false, yearSwitch: false });

    const immutableSettings = {
        cmdtFormat: {
            padding: 4,
            max: 9999,
            description: "Format des numéros CMDT (4 chiffres, maximum 9999)"
        },
        fiscalYear: {
            current: "2025",
            description: "Année fiscale de référence"
        },
        systemVersion: "2.1.0"
    };

    useEffect(() => {
        localStorage.setItem('cmdt:prefs', JSON.stringify(prefs));
    }, [prefs]);

    useEffect(() => {
        loadSettingsFromApi();
    }, []);

    const loadSettingsFromApi = async () => {
        try {
            setLoading(true);
            const resp = await fetch('/api/settings/fiscal', {
                method: 'GET',
                credentials: 'include'
            });
            if (!resp.ok) throw new Error('Failed to load fiscal settings');
            const data = await resp.json();
            if (data?.success) {
                setPrefs((p) => ({ ...p, autoYearSwitch: Boolean(data.data?.auto_year_switch) }));
                setServerSettings(data.data);

                const d = data.data || {};

                // UTILISE DIRECTEMENT le warning du backend !
                const shouldWarn = d.warningInfo?.warning || false;

                console.log('✅ Utilisation warning backend:', {
                    lastNumber: d.counter?.last_cmdt_number,
                    threshold: d.warningInfo?.threshold,
                    warningBackend: shouldWarn,
                    logiqueBackend: 'last_cmdt_number >= threshold'
                });

                setWarningInfo({
                    warning: shouldWarn, // ← Utilise la valeur du backend
                    remaining: d.counter?.remaining,
                    threshold: d.warningInfo?.threshold,
                    max: d.counter?.max,
                    lastNumber: d.counter?.last_cmdt_number,
                    fiscalYear: d.fiscalYear
                });
            }
        } catch (e) {
            console.error('Erreur chargement paramètres fiscaux:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoSwitchToggle = (enable) => {
        if (enable) {
            activateAutoSwitch();
        } else {
            openModal('autoSwitchWarning');
        }
    };

    const activateAutoSwitch = async () => {
        try {
            setApiLoading(prev => ({ ...prev, autoSwitch: true }));
            const resp = await fetch('/api/settings/auto-year-switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ enable: true })
            });
            const data = await resp.json();
            if (!resp.ok || !data?.success) throw new Error(data?.message || 'Echec activation auto switch');

            setPrefs((p) => ({ ...p, autoYearSwitch: true }));
            await loadSettingsFromApi();
            openModal('autoSwitchActivation');
        } catch (err) {
            console.error('Erreur activation auto switch:', err);
        } finally {
            setApiLoading(prev => ({ ...prev, autoSwitch: false }));
        }
    };

    const deactivateAutoSwitch = async () => {
        try {
            setApiLoading(prev => ({ ...prev, autoSwitch: true }));
            const resp = await fetch('/api/settings/auto-year-switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ enable: false })
            });
            const data = await resp.json();
            if (!resp.ok || !data?.success) throw new Error(data?.message || 'Echec désactivation auto switch');

            setPrefs((p) => ({ ...p, autoYearSwitch: false }));
            await loadSettingsFromApi();
            closeModal();
        } catch (err) {
            console.error('Erreur désactivation auto switch:', err);
        } finally {
            setApiLoading(prev => ({ ...prev, autoSwitch: false }));
        }
    };

    const openModal = (modalType) => {
        if (modalType === 'yearSwitch') {
            const hasValidTarget = Array.isArray(serverSettings?.availableYears)
                ? serverSettings.availableYears.some(y => !y.isCurrent && y.canActivate)
                : false;
            if (!hasValidTarget || prefs.autoYearSwitch) {
                setActiveModal('yearSwitchUnavailable');
                return;
            }
            fetchCurrentFiscalYearInfo(true);
            return;
        }
        setActiveModal(modalType);
    };

    const closeModal = () => {
        setActiveModal(null);
        setYearSwitchInfo(null);
        setSelectedYear('');
    };

    const fetchCurrentFiscalYearInfo = async (openOnSuccess = false) => {
        try {
            const resp = await fetch('/api/settings/fiscal', {
                method: 'GET',
                credentials: 'include'
            });
            if (!resp.ok) throw new Error('Failed to fetch fiscal info');
            const payload = await resp.json();
            const d = payload?.data;
            if (!d) throw new Error('Invalid payload');

            const currentYear = d.fiscalYear || d.counter?.fiscal_year;
            const lastNumber = d.counter?.last_cmdt_number ?? 0;
            const maxNumber = d.counter?.max ?? d.cmdt_format?.max ?? 9999;
            const remaining = d.counter?.remaining ?? Math.max(0, maxNumber - lastNumber);
            const availableYears = Array.isArray(d.availableYears) ? d.availableYears : [];
            const futureYears = availableYears
                .flatMap(item => item.year)
                .filter(y => y !== currentYear);

            const info = {
                currentYear,
                lastNumber,
                maxNumber,
                remaining,
                nextYear: futureYears[0] || '',
                canSwitchTo: futureYears
            };
            setYearSwitchInfo(info);
            setSelectedYear(futureYears[0] || '');
            if (openOnSuccess) {
                if (futureYears.length > 0) {
                    setActiveModal('yearSwitch');
                } else {
                    setActiveModal('yearSwitchUnavailable');
                }
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des informations fiscales:', error);
        }
    };

    const handleFiscalYearSwitch = async () => {
        if (!selectedYear) {
            alert('Veuillez sélectionner une année');
            return;
        }

        try {
            setApiLoading(prev => ({ ...prev, yearSwitch: true }));
            const resp = await fetch('/api/settings/fiscal-year/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ newYear: selectedYear })
            });
            const data = await resp.json();
            if (!resp.ok || !data?.success) {
                console.error('Echec bascule année fiscale:', data?.message);
                setErroMsg(data?.message);
                setActiveModal('error');
                return;
            }
            setActiveModal('yearSwitchSuccess');
            setTimeout(() => closeModal(), 3000);
            loadSettingsFromApi();
            fetchCurrentFiscalYearInfo();

        } catch (error) {
            console.error('Erreur lors du changement d\'année fiscale:', error);
            setErroMsg(error?.message || 'Une erreur interne est survenue');
            setActiveModal('error');
        } finally {
            setApiLoading(prev => ({ ...prev, yearSwitch: false }));
        }
    };

    // Formatage des nombres avec séparateurs
    const formatNumber = (num) => {
        if (!num && num !== 0) return '-';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    // MODALES DÉTAILLÉES (conservées de l'ancienne version)
    const AutoSwitchActivationModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6 mx-2">
                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Auto-switch Activé</h3>
                        <p className="text-sm text-green-600">Sécurité renforcée pour vos données</p>
                    </div>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <InformationCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-green-800">
                                <p><strong>Fonctionnalité activée :</strong> Le système changera automatiquement d'année fiscale au 1er janvier.</p>
                                <p className="mt-2"><CheckCircleIcon className="w-4 h-4 inline mr-1" />Transition automatique et sécurisée</p>
                                <p className="mt-1"><CheckCircleIcon className="w-4 h-4 inline mr-1" />Aucune intervention manuelle requise</p>
                                <p className="mt-1"><CheckCircleIcon className="w-4 h-4 inline mr-1" />Prévention des erreurs de numérotation</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <CalendarDaysIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-800">
                                <p><strong>Prochaine transition :</strong> 1er janvier {(parseInt(serverSettings?.fiscalYear || immutableSettings.fiscalYear.current, 10) + 1)}</p>
                                <p className="mt-1">Le système se préparera automatiquement pour la nouvelle année.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={closeModal}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                        Compris
                    </button>
                </div>
            </div>
        </div>
    );

    const YearSwitchUnavailableModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6 mx-2">
                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Bascule indisponible</h3>
                        <p className="text-sm text-gray-600">Aucune année cible valide n'est disponible actuellement.</p>
                    </div>
                </div>

                <div className="space-y-3 text-sm mb-6">
                    {prefs.autoYearSwitch ? (
                        <p className="text-gray-700">Le changement manuel est désactivé car le mode <strong>auto</strong> est activé.</p>
                    ) : (
                        <p className="text-gray-700">Le serveur ne propose pas d'année future activable. Réessayez plus tard ou contactez un administrateur.</p>
                    )}
                </div>

                <div className="flex gap-3">
                    <button onClick={closeModal} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );

    const FiscalYearSwitchModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 mx-2">
                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Transition d'Année Fiscale</h3>
                        <p className="text-sm text-gray-600">Passage contrôlé vers une nouvelle année</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <DocumentTextIcon className="w-4 h-4" />
                                Situation Actuelle
                            </h4>
                            {yearSwitchInfo && (
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-600">Année en cours:</span><span className="font-semibold">{yearSwitchInfo.currentYear}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Dernier numéro:</span><span className="font-semibold">{formatNumber(yearSwitchInfo.lastNumber)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Numéros utilisés:</span><span className="font-semibold">{formatNumber(yearSwitchInfo.lastNumber)}/{formatNumber(yearSwitchInfo.maxNumber)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">Restants:</span><span className="font-semibold text-green-600">{formatNumber(yearSwitchInfo.remaining)}</span></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-3">Transition Programmée</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nouvelle année fiscale</label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Sélectionner une année</option>
                                        {yearSwitchInfo?.canSwitchTo?.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="relative group">
                            <button
                                onClick={handleFiscalYearSwitch}
                                disabled={!selectedYear || prefs.autoYearSwitch || apiLoading.yearSwitch}
                                className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 
                  ${(!selectedYear || prefs.autoYearSwitch || apiLoading.yearSwitch)
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'}`}
                            >
                                {apiLoading.yearSwitch ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                        Transition en cours...
                                    </>
                                ) : (
                                    <>
                                        <ArrowPathIcon className="w-5 h-5" />
                                        Démarrer la Transition
                                    </>
                                )}
                            </button>
                            {prefs.autoYearSwitch && (
                                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-2 text-xs text-white bg-gray-900 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 w-64 text-center">
                                    Désactiver l'auto-switch fiscal avant toute programmation manuelle
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                        onClick={closeModal}
                        disabled={apiLoading.yearSwitch}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-200 disabled:opacity-50"
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );

    const AutoSwitchWarningModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6 mx-2">
                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <ShieldExclamationIcon className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Désactivation Risquée</h3>
                        <p className="text-sm text-red-600">Impact sur l'intégrité des données</p>
                    </div>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                                <p className="font-medium text-red-900 mb-2">Risques identifiés :</p>
                                <ul className="list-disc list-inside space-y-1 text-red-800">
                                    <li><strong>Oubli de changement manuel</strong> - Risque de continuer avec l'année précédente</li>
                                    <li><strong>Désynchronisation</strong> - Factures datées d'une année, numérotées d'une autre</li>
                                    <li><strong>Problèmes légaux</strong> - Non conformité fiscale possible</li>
                                    <li><strong>Perte de séquence</strong> - Risque de doublons ou sauts de numérotation</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-800">
                                <p><strong>Recommandation :</strong> Laissez l'auto-switch activé. Le système changera automatiquement au 1er janvier.</p>
                                <p className="mt-1">Si vous désactivez, <strong>notez dans votre calendrier</strong> de changer manuellement au 1er janvier.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={deactivateAutoSwitch}
                        disabled={apiLoading.autoSwitch}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {apiLoading.autoSwitch ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Désactivation...
                            </>
                        ) : (
                            'Je comprends les risques - Désactiver'
                        )}
                    </button>
                    <button
                        onClick={closeModal}
                        disabled={apiLoading.autoSwitch}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        Annuler - Garder activé
                    </button>
                </div>
            </div>
        </div>
    );

    const YearSwitchSuccessModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6 text-center mx-2">
                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Transition Réussie !</h3>
                <p className="text-gray-600 mb-4">
                    Le système est maintenant configuré pour l'année {selectedYear}.
                    Toutes les nouvelles factures utiliseront cette année fiscale.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-green-800">
                        <strong>Prochain numéro disponible:</strong> {yearSwitchInfo?.lastNumber ? formatNumber(yearSwitchInfo.lastNumber) : '0'}
                    </p>
                </div>
                <button
                    onClick={closeModal}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors duration-200"
                >
                    Compris
                </button>
            </div>
        </div>
    );

    const ErrorModal = ({ msg }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center mx-2">
                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur</h3>
                <p className="text-gray-600 mb-4">
                    {msg ? msg : `Une erreur est survenue lors de l'opération. Veuillez réessayer.`}
                </p>
                <button
                    onClick={closeModal}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                    Fermer
                </button>
            </div>
        </div>
    );

    return (
        <>
            <div className="min-h-screen bg-settings py-6 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <Navbar />

                    {/* Header épuré */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                            <Cog6ToothIcon className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Centre de Configuration</h1>
                        <p className="text-gray-900 max-w-2xl mx-auto font-semibold text-lg">
                            Gestion des paramètres système et fiscal. Les modifications critiques sont sécurisées.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                        {/* Colonne principale - Gestion Fiscale */}
                        <div className="xl:col-span-2 space-y-6">
                            {/* Carte Auto-switch avec infobulles */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">Gestion Fiscale Contrôlée</h2>
                                        <p className="text-gray-600 text-sm">Transition automatisée des années fiscales</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                        prefs.autoYearSwitch
                                            ? 'border-green-200 bg-green-50'
                                            : 'border-red-200 bg-red-50'
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${
                                                    prefs.autoYearSwitch ? 'bg-green-100' : 'bg-red-100'
                                                }`}>
                                                    {prefs.autoYearSwitch ? (
                                                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                                    ) : (
                                                        <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className={`font-semibold ${
                                                            prefs.autoYearSwitch ? 'text-green-900' : 'text-red-900'
                                                        }`}>
                                                            Changement automatique d'année
                                                        </p>
                                                        <div className="relative group">
                                                            <InformationCircleIcon className={`w-4 h-4 ${
                                                                prefs.autoYearSwitch ? 'text-green-600' : 'text-red-600'
                                                            } cursor-help`} />
                                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 w-64 text-left pointer-events-none">
                                                                {prefs.autoYearSwitch
                                                                    ? "Sécurité : Transition automatique au 1er janvier - Garantit une continuité sans intervention manuelle"
                                                                    : "Risque : Transition manuelle requise - Nécessite une intervention au 1er janvier avec risque d'oubli"
                                                                }
                                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className={`text-sm ${
                                                        prefs.autoYearSwitch ? 'text-green-700' : 'text-red-700'
                                                    }`}>
                                                        {prefs.autoYearSwitch
                                                            ? "Garantit une transition fluide sans intervention manuelle."
                                                            : "Nécessite une intervention manuelle au 1er janvier."
                                                        }
                                                    </p>
                                                </div>
                                            </div>

                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={prefs.autoYearSwitch}
                                                    onChange={(e) => handleAutoSwitchToggle(e.target.checked)}
                                                    disabled={apiLoading.autoSwitch}
                                                    className="sr-only"
                                                />
                                                <div className={`
                                                              w-12 h-6 rounded-full transition-all duration-200
                                                              ${prefs.autoYearSwitch ? 'bg-green-500' : 'bg-red-500'}
                                                              ${apiLoading.autoSwitch ? 'opacity-50' : ''}
                                                            `}>
                                                                                        <div className={`
                                                                bg-white rounded-full shadow-lg transform transition-transform duration-200
                                                                w-5 h-5 m-0.5
                                                                ${prefs.autoYearSwitch ? 'translate-x-6' : 'translate-x-0'}
                                                              `} />
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Transition manuelle avec infobulle */}
                                    <div className="p-4 rounded-xl border border-orange-200 bg-orange-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-orange-100">
                                                    <CalendarDaysIcon className="w-5 h-5 text-orange-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-orange-900">Transition d'année fiscale</p>
                                                    <p className="text-sm text-orange-700">
                                                        {prefs.autoYearSwitch
                                                            ? "Transition automatique activée - Aucune action requise"
                                                            : "Transition manuelle nécessaire - Planifiez le changement"
                                                        }
                                                    </p>
                                                    <div className="flex items-center gap-4 text-sm mt-1">
                                                        <div className="flex items-center gap-2 text-orange-600">
                                                            <DocumentTextIcon className="w-4 h-4" />
                                                            <span>Format: {(serverSettings?.cmdt_format?.padding ?? 4)} chiffres</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-orange-600">
                                                            <CalendarDaysIcon className="w-4 h-4" />
                                                            <span>Actuel: {serverSettings?.fiscalYear ?? '2025'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative group">
                                                <button
                                                    onClick={() => openModal('yearSwitch')}
                                                    disabled={prefs.autoYearSwitch}
                                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                                                        prefs.autoYearSwitch
                                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
                                                    }`}
                                                >
                                                    <CalendarDaysIcon className="w-4 h-4" />
                                                    Programmer
                                                </button>
                                                {prefs.autoYearSwitch && (
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 w-64 text-left pointer-events-none">
                                                        Désactiver l'auto-switch fiscal avant toute programmation manuelle
                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Carte Préférences */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                        <MoonIcon className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">Préférences d'Interface</h2>
                                        <p className="text-gray-600 text-sm">Personnalisez l'apparence de l'application</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl transition-all duration-300 ${
                                                prefs.prefersDark
                                                    ? 'bg-gray-800 text-gray-200'
                                                    : 'bg-amber-100 text-amber-600'
                                            }`}>
                                                {prefs.prefersDark ? (
                                                    <MoonIcon className="w-6 h-6" />
                                                ) : (
                                                    <SunIcon className="w-6 h-6" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Thème de l'interface</p>
                                                <p className="text-sm text-gray-600">
                                                    {prefs.prefersDark ? "Mode sombre activé - Confort visuel optimisé" : "Mode clair activé - Lisibilité naturelle"}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setPrefs(p => ({ ...p, prefersDark: !p.prefersDark }))}
                                            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                                                prefs.prefersDark
                                                    ? 'bg-gray-700 text-white hover:bg-gray-800'
                                                    : 'bg-amber-500 text-white hover:bg-amber-600'
                                            }`}
                                        >
                                            {prefs.prefersDark ? 'Mode sombre' : 'Mode clair'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Colonne latérale - Informations */}
                        <div className="space-y-6">
                            {/* Carte Configuration */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                                        <CogIcon className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">Configuration</h2>
                                        <p className="text-gray-600 text-sm">Paramètres système</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                        <span className="text-sm font-medium text-blue-900">Version</span>
                                        <div className="relative group">
                                        <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                                            v{serverSettings?.app_version ?? immutableSettings.systemVersion}
                                        </span>
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 pointer-events-none whitespace-nowrap shadow-lg">
                                                Version: v{serverSettings?.app_version ?? immutableSettings.systemVersion}
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                        <span className="text-sm font-medium text-green-900">Format CMDT</span>
                                        <div className="relative group">
                                        <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                                            {serverSettings?.cmdt_format?.padding ?? 4} digits
                                        </span>
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 pointer-events-none whitespace-nowrap shadow-lg">
                                                Format CMDT: {serverSettings?.cmdt_format?.padding ?? 4} chiffres
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                        <span className="text-sm font-medium text-purple-900">Année fiscale</span>
                                        <div className="relative group">
                                        <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                                            {serverSettings?.fiscalYear ?? '2025'}
                                        </span>
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 pointer-events-none whitespace-nowrap shadow-lg">
                                                Année fiscale: {serverSettings?.fiscalYear ?? '2025'}
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Carte Compteur CMDT - Version corrigée */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        // CORRECTION: Vérifiez directement la condition
                                        warningInfo?.remaining <= warningInfo?.threshold ? 'bg-red-100' : 'bg-green-100'
                                    }`}>
                                        <ExclamationTriangleIcon className={`w-5 h-5 ${
                                            warningInfo?.remaining <= warningInfo?.threshold ? 'text-red-600' : 'text-green-600'
                                        }`} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">État du Compteur CMDT</h2>
                                        <p className="text-gray-600 text-sm">
                                            {/* CORRECTION: Même condition ici */}
                                            {warningInfo?.warning && warningInfo.remaining > 0 ? 'Seuil critique approche' : warningInfo?.warning && warningInfo.remaining === 0 ? 'Limite annuelle atteinte' : 'Situation normale'}
                                        </p>
                                    </div>
                                </div>

                                {/* Indicateur visuel simple */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">Progression</span>
                                        <span className="text-sm font-bold text-blue-600">
                                            {formatNumber(warningInfo?.lastNumber || 0)} / {formatNumber(warningInfo?.max || 0)}
                                        </span>
                                    </div>
                                    {/* Barre de progression avec infobulle */}
                                    <div className="relative group">
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className={`h-3 rounded-full transition-all duration-500 ${
                                                    warningInfo?.warning ? 'bg-red-500' : 'bg-green-500'
                                                }`}
                                                style={{
                                                    width: `${Math.max((warningInfo?.lastNumber / warningInfo?.max) * 100 || 0, 1)}%`,
                                                    minWidth: '4px'
                                                }}
                                            ></div>
                                        </div>

                                        {/* Infobulle détaillée au hover */}
                                        <div className="absolute bottom-full left-0 right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none shadow-lg">
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                                <span className="text-gray-300">Dernier numéro:</span>
                                                <span className="font-mono">{formatNumber(warningInfo?.lastNumber || 0)}</span>

                                                <span className="text-gray-300">Maximum:</span>
                                                <span className="font-mono">{formatNumber(warningInfo?.max || 0)}</span>

                                                <span className="text-gray-300">Restants:</span>
                                                <span className={`font-mono ${
                                                    warningInfo?.warning ? 'text-red-300' : 'text-green-300'
                                                }`}>
                                                    {formatNumber(warningInfo?.remaining || 0)}
                                                </span>

                                                <span className="text-gray-300">Seuil d'alerte:</span>
                                                <span className="font-mono text-yellow-300">{formatNumber(warningInfo?.threshold || 0)}</span>

                                                <span className="text-gray-300">Progression:</span>
                                                <span className="font-mono">
                                                    {((warningInfo?.lastNumber / warningInfo?.max) * 100 || 0).toFixed(6)}%
                                                </span>

                                                <span className="text-gray-300">Statut:</span>
                                                <span className={`font-mono ${
                                                    warningInfo?.warning ? 'text-red-300' : 'text-green-300'
                                                }`}>
                                                    {warningInfo?.warning ? 'ALERTE' : 'NORMAL'}
                                                </span>
                                            </div>
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Numéro {formatNumber(warningInfo?.lastNumber || 0)}</span>
                                        <span className={`font-medium ${
                                            warningInfo?.warning ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                            {formatNumber(warningInfo?.remaining || 0)} restants
                                        </span>
                                    </div>

                                    {/* CORRECTION: Même condition pour l'alerte */}
                                    {warningInfo?.warning && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <div className="flex items-center gap-2">
                                                <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                                                <span className="text-sm text-red-800 font-medium">
                                                    Alerte: Seuil critique atteint - {formatNumber(warningInfo.remaining)} restants sur {formatNumber(warningInfo.max)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modales détaillées */}
            {activeModal === 'autoSwitchWarning' && <AutoSwitchWarningModal />}
            {activeModal === 'autoSwitchActivation' && <AutoSwitchActivationModal />}
            {activeModal === 'yearSwitch' && <FiscalYearSwitchModal />}
            {activeModal === 'yearSwitchUnavailable' && <YearSwitchUnavailableModal />}
            {activeModal === 'yearSwitchSuccess' && <YearSwitchSuccessModal />}
            {activeModal === 'error' && <ErrorModal msg={errorMsg}/>}
        </>
    );
}

export default Settings;