import { useState, useEffect } from 'react';
import useTitle from '../../hooks/ui/useTitle.js';
import useBackground from '../../hooks/ui/useBackground.js';
import api from '../../services/api.js';
import useToastFeedback from '../../hooks/ui/useToastFeedBack.js';
import {
    BugAntIcon,
    TrashIcon,
    ArrowPathIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClockIcon,
    UserIcon,
    GlobeAltIcon,
    DocumentMagnifyingGlassIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import Header from '../../components/global/Header.jsx';
import Navbar from '../../components/navbar/Navbar.jsx';
import Footer from '../../components/global/Footer.jsx';

const SystemLogs = () => {
    useTitle('CMDT - Logs Système');
    useBackground('bg-log');
    const { toastSuccess, toastError } = useToastFeedback();

    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [currentPage, setCurrentPage] = useState(1); // ✅ Added an explicit state for the current page
    const [loading, setLoading] = useState(true);
    const [filterLevel, setFilterLevel] = useState('all');
    const [selectedLog, setSelectedLog] = useState(null);
    const [isClearing, setIsClearing] = useState(false);

    const fetchLogs = async (page) => {
        setLoading(true);
        try {
            const response = await api.get(`/system/logs?page=${page}&limit=50&level=${filterLevel}`);
            if (response.success) {
                setLogs(response.data.logs);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            console.error('Erreur logs:', err);
            toastError('Impossible de charger les logs');
        } finally {
            setLoading(false);
        }
    };

    // ✅ A single useEffect that listens to the page and the filter
    useEffect(() => {
        fetchLogs(currentPage);
    }, [currentPage, filterLevel]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterLevel]);

    const handleClearLogs = async () => {
        if (!window.confirm('Voulez-vous vraiment supprimer TOUS les logs système ?')) return;

        setIsClearing(true);
        try {
            const response = await api.delete('/system/logs');
            if (response.success) {
                toastSuccess('Logs réinitialisés');
                setLogs([]); // Clear immediately
                if (currentPage === 1) {
                    fetchLogs(1);
                } else {
                    setCurrentPage(1);
                }
            }
        } catch (err) {
            toastError('Erreur lors de la suppression');
        } finally {
            setIsClearing(false);
        }
    };

    const getLevelBadge = (level) => {
        switch (level) {
            case 'CRITICAL':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'ERROR':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'WARN':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            default:
                return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <Navbar />

            <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">

                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <select
                                value={filterLevel}
                                onChange={(e) => setFilterLevel(e.target.value)}
                                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="all">Tous les niveaux</option>
                                <option value="ERROR">Erreurs</option>
                                <option value="WARN">Avertissements</option>
                                <option value="CRITICAL">Critique</option>
                            </select>

                            <button
                                onClick={() => fetchLogs(currentPage)}
                                disabled={loading}
                                className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                                title="Actualiser"
                            >
                                <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        <button
                            onClick={handleClearLogs}
                            disabled={isClearing || logs.length === 0}
                            className="flex items-center px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            <TrashIcon className="w-4 h-4 mr-2" />
                            Effacer tout
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                                    <th className="px-6 py-4">Niveau</th>
                                    <th className="px-6 py-4">Message</th>
                                    <th className="px-6 py-4">Utilisateur</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading && logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center">
                                                <ArrowPathIcon className="w-8 h-8 animate-spin mb-2" />
                                                Chargement des logs...
                                            </div>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">
                                            Aucun log trouvé
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getLevelBadge(log.level)}`}>
                                                    {log.level}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 max-w-md">
                                                <div className="text-sm font-medium text-gray-900 truncate" title={log.message}>
                                                    {log.message}
                                                </div>
                                                <div className="text-xs text-gray-500 font-mono truncate">
                                                    {log.path || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <UserIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                                                    {log.user_id || 'Système'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <ClockIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                                                    {formatDateTime(log.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center text-xs font-semibold"
                                                >
                                                    <DocumentMagnifyingGlassIcon className="w-5 h-5 mr-1" />
                                                    Détails
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                            Total: <span className="font-semibold">{pagination.total}</span> logs
                        </span>
                        <div className="flex items-center space-x-2">
                            <button
                                disabled={pagination.page === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-40 transition-colors"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-medium px-4">
                                Page {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-40 transition-colors"
                            >
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                                    <BugAntIcon className="w-6 h-6 mr-2 text-red-600" />
                                    Détails du log #{selectedLog.id}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">{formatDateTime(selectedLog.created_at)}</p>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Niveau</span>
                                    <div className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-sm font-bold border ${getLevelBadge(selectedLog.level)}`}>
                                        {selectedLog.level}
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Utilisateur</span>
                                    <div className="mt-1 flex items-center text-gray-900 font-medium font-mono text-sm uppercase">
                                        <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
                                        {selectedLog.user_id || 'SYSTÈME'}
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 col-span-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Chemin / URL</span>
                                    <div className="mt-1 flex items-center text-gray-900 font-mono text-sm break-all">
                                        <GlobeAltIcon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                                        {selectedLog.path || '/'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <span className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-wider">Message d'erreur</span>
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-800 font-medium">
                                    {selectedLog.message}
                                </div>
                            </div>

                            {selectedLog.context && (
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-wider">Contexte JSON</span>
                                    <pre className="p-4 bg-gray-900 text-green-400 rounded-xl text-xs overflow-auto max-h-48 font-mono leading-relaxed shadow-inner">
                                        {JSON.stringify(typeof selectedLog.context === 'string' ? JSON.parse(selectedLog.context) : selectedLog.context, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.stack && (
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-wider">Stack Trace</span>
                                    <pre className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-[10px] text-gray-700 overflow-auto font-mono leading-tight max-h-96">
                                        {selectedLog.stack}
                                    </pre>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-6 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default SystemLogs;
