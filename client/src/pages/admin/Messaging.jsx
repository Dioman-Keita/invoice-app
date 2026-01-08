import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import useToastFeedback from '../../hooks/ui/useToastFeedBack.js';
import { useAuth } from '../../hooks/auth/useAuth.js';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/global/Header.jsx';
import Footer from '../../components/global/Footer.jsx';
import Navbar from '../../components/navbar/Navbar.jsx';
import {
  InboxIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  EyeIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  WifiIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import useTitle from '../../hooks/ui/useTitle.js';

function Messaging() {
  useTitle('CMDT - Messagerie Admin');
  // 1. Auth improvement : Get loading if available, otherwise handle manually
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Interface states
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // Timer for button

  // 2. Connection improvement : State for network detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const { success, error, warning } = useToastFeedback();

  // Data
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Timer Ref for cleanup
  const timerRef = useRef(null);

  // --- Connection & Timer Management ---

  // Online status listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Timer management during action loading
  useEffect(() => {
    if (actionLoading) {
      setElapsedTime(0);
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedTime(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [actionLoading]);

  // --- Helpers ---

  const formatRole = (role) => {
    switch (role) {
      case 'invoice_manager': return 'Chargé de facture';
      case 'dfc_agent': return 'Agent DFC';
      case 'admin': return 'Administrateur';
      default: return role || 'Inconnu';
    }
  };

  // --- Fetching ---

  // Fetch requests and stats
  useEffect(() => {
    // Wait for auth to resolve before fetching
    if (!authLoading && user?.role === 'admin' && isOnline) {
      fetchRequests();
      fetchStats();
    }
  }, [user, authLoading, filter, search, currentPage, isOnline]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  const fetchStats = async () => {
    if (!isOnline) return;
    try {
      const response = await api.get('/migration/stats');
      if (response.data && response.data.stats) {
        setStats(response.data.stats);
      } else if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const fetchRequests = async () => {
    if (!isOnline) return;
    setLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const response = await api.get('/migration/requests', {
        params: {
          status: filter,
          search,
          limit: itemsPerPage,
          offset
        }
      });
      const rawData = response.data?.requests || [];
      const mappedData = rawData.map(req => ({
        id: req.id,
        name: `${req.firstName || ''} ${req.lastName || ''}`.trim() || req.email,
        email: req.email,
        from: formatRole(req.from_role),
        to: formatRole(req.to_role),
        dept: req.department,
        reason: req.motivation,
        status: req.status,
        date: new Date(req.created_at).toLocaleDateString(),
        reviewer: req.reviewed_by ? 'Admin' : null,
        reviewDate: req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : null,
        response: req.review_note
      }));
      setRequests(mappedData);

      let totalCount = 0;
      if (filter === 'all') totalCount = stats.total;
      else if (filter === 'pending') totalCount = stats.pending;
      else if (filter === 'approved') totalCount = stats.approved;
      else if (filter === 'rejected') totalCount = stats.rejected;

      if (search) {
        setTotalPages(mappedData.length === itemsPerPage ? currentPage + 1 : currentPage);
      } else {
        setTotalPages(Math.ceil(totalCount / itemsPerPage) || 1);
      }

    } catch (err) {
      console.error("Failed to fetch requests", err);
      // Avoid spamming toasts if it's just a temporary network error
      if (isOnline) error('Erreur chargement demandes');
    } finally {
      setLoading(false);
    }
  };

  // --- Actions ---

  const approve = async (id) => {
    if (!isOnline) {
      warning('Pas de connexion internet');
      return;
    }
    if (actionLoading) return; // Security against double click

    setActionLoading(true);
    try {
      await api.post(`/migration/requests/${id}/approve`);
      success('Demande approuvée avec succès');

      // Optimistic update for immediate reactivity
      if (selected?.id === id) {
        setSelected(prev => ({ ...prev, status: 'approved' }));
      }

      await fetchRequests();
      fetchStats();
    } catch (err) {
      console.error(err);
      error('Erreur lors de l\'approbation');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (id) => {
    setRejectId(id);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    if (actionLoading) return; // Prevent closing during submission
    setIsRejectModalOpen(false);
    setRejectId(null);
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!isOnline) {
      warning('Pas de connexion internet');
      return;
    }
    if (actionLoading || !rejectId) return;

    setActionLoading(true);
    try {
      await api.post(`/migration/requests/${rejectId}/reject`, { review_note: rejectReason });
      success('Demande rejetée');

      if (selected?.id === rejectId) {
        setSelected(prev => ({ ...prev, status: 'rejected' }));
      }

      // Close modal first
      setIsRejectModalOpen(false);
      setRejectId(null);
      setRejectReason('');

      await fetchRequests();
      fetchStats();
    } catch (err) {
      console.error(err);
      error('Erreur lors du rejet');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Conditional rendering Auth ---

  // 1. Global auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 2. Not connected
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-8 h-8 text-gray-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Connexion requise</h2>
          <p className="text-gray-600 mb-6">Vous devez être connecté pour accéder à cette page.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  // 3. Wrong role
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <NoSymbolIcon className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-600 mb-6">Cet espace est réservé aux administrateurs.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors font-medium"
          >
            Retour au Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-roleMigration bg-cover bg-center">
      <Header />
      <Navbar />

      <div className="container mx-auto px-4 py-6">

        {/* Offline alert */}
        {!isOnline && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm flex items-center justify-between animate-pulse">
            <div className="flex items-center">
              <WifiIcon className="h-6 w-6 text-red-500 mr-3" />
              <div>
                <h3 className="text-red-800 font-bold">Connexion perdue</h3>
                <p className="text-red-700 text-sm">Vérifiez votre connexion internet. Les actions sont désactivées.</p>
              </div>
            </div>
          </div>
        )}

        {/* Header compact */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg inline-block">Messagerie Admin</h1>
            </div>
            {stats.pending > 0 && (
              <div className="bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                  </span>
                  <span className="text-sm font-bold text-yellow-800">
                    {stats.pending} demande{stats.pending > 1 ? 's' : ''} en attente
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats compactes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total</p>
                <p className="text-xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-full">
                <InboxIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">En attente</p>
                <p className="text-xl font-bold text-gray-900">{stats.pending || 0}</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded-full">
                <ClockIcon className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Approuvées</p>
                <p className="text-xl font-bold text-gray-900">{stats.approved || 0}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-full">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Rejetées</p>
                <p className="text-xl font-bold text-gray-900">{stats.rejected || 0}</p>
              </div>
              <div className="p-2 bg-red-50 rounded-full">
                <XCircleIcon className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left list */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              {/* Tools bar */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Rechercher par nom ou email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <FunnelIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="approved">Approuvées</option>
                    <option value="rejected">Rejetées</option>
                  </select>

                  <button
                    onClick={() => { fetchRequests(); fetchStats(); }}
                    disabled={loading || !isOnline}
                    className="p-2 border border-gray-300 bg-white rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
                    title="Actualiser"
                  >
                    <ArrowPathIcon className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto custom-scrollbar">
                {loading && requests.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
                    <p className="mt-2 text-gray-500">Chargement des demandes...</p>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center">
                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                      <InboxIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Aucune demande trouvée</h3>
                    <p className="text-gray-500 text-sm mt-1">Essayez de modifier vos filtres de recherche</p>
                  </div>
                ) : (
                  <>
                    {requests.map((req) => (
                      <div
                        key={req.id}
                        onClick={() => setSelected(req)}
                        className={`p-4 hover:bg-blue-50/50 cursor-pointer transition-all border-l-4 ${selected?.id === req.id
                          ? 'bg-blue-50 border-l-blue-600 shadow-inner'
                          : 'border-l-transparent hover:border-l-gray-300'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* Line 1: Name + Status */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm">
                                  {req.name.substring(0, 2)}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 text-sm">{req.name}</h3>
                                  <p className="text-xs text-gray-500">{req.email}</p>
                                </div>
                              </div>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${req.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                req.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                  'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                {req.status === 'pending' ? 'En attente' :
                                  req.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                              </span>
                            </div>

                            {/* Line 2: Migration */}
                            <div className="flex items-center gap-2 bg-gray-50/80 rounded-lg p-2 mb-2 border border-gray-100">
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Actuel</p>
                                <p className="text-xs font-medium text-gray-700 truncate" title={req.from}>{req.from}</p>
                              </div>
                              <ArrowRightIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Demandé</p>
                                <p className="text-xs font-bold text-blue-600 truncate" title={req.to}>{req.to}</p>
                              </div>
                            </div>

                            {/* Line 3: Metadata */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-1.5">
                                <BuildingOfficeIcon className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[150px]">{req.dept}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ClockIcon className="w-3.5 h-3.5" />
                                <span>{req.date}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Pagination */}
              <div className="p-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Précédent
                </button>
                <span className="text-sm text-gray-600 font-medium bg-white px-3 py-1 rounded border border-gray-200">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={requests.length < itemsPerPage || (totalPages > 1 && currentPage >= totalPages) || loading}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>

          {/* Right details */}
          <div>
            {selected ? (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 sticky top-6 animate-in slide-in-from-right-4 duration-300">
                <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                      <EyeIcon className="w-5 h-5 text-blue-600" />
                      Détails de la demande
                    </h2>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* User info */}
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl shadow-sm">
                      {selected.name.substring(0, 1)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{selected.name}</h3>
                      <div className="flex items-center gap-1.5 text-gray-600 text-sm mt-0.5">
                        <UserIcon className="w-3.5 h-3.5" />
                        {selected.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 text-sm mt-0.5">
                        <BuildingOfficeIcon className="w-3.5 h-3.5" />
                        {selected.dept}
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Migration Box */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">Changement de rôle demandé</p>
                    <div className="flex items-center justify-between relative">
                      {/* Connector line */}
                      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-300 -z-10"></div>

                      <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm z-10 w-5/12 text-center">
                        <span className="block text-xs text-gray-400 mb-1">Actuel</span>
                        <span className="font-semibold text-gray-700 text-sm block truncate" title={selected.from}>{selected.from}</span>
                      </div>

                      <div className="bg-blue-600 rounded-full p-1.5 z-10 shadow-md">
                        <ArrowRightIcon className="w-4 h-4 text-white" />
                      </div>

                      <div className="bg-white p-2 rounded-lg border-2 border-blue-100 shadow-sm z-10 w-5/12 text-center">
                        <span className="block text-xs text-blue-400 mb-1">Nouveau</span>
                        <span className="font-bold text-blue-700 text-sm block truncate" title={selected.to}>{selected.to}</span>
                      </div>
                    </div>
                  </div>

                  {/* Motivation */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                      <ChatBubbleLeftRightIcon className="w-4 h-4" />
                      MOTIVATION DU DEMANDEUR
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700 leading-relaxed italic">
                      "{selected.reason}"
                    </div>
                  </div>

                  {/* Dates & Status Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Date soumission</p>
                      <p className="font-medium text-sm text-gray-900">{selected.date}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Statut actuel</p>
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-sm font-medium ${selected.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selected.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        {selected.status === 'pending' ? 'En attente' :
                          selected.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                      </div>
                    </div>
                  </div>

                  {/* Admin response if exists */}
                  {selected.response && (
                    <div className="border-t pt-4">
                      <p className="text-xs font-bold text-gray-500 mb-2">NOTE DE RÉVISION</p>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <p className="text-sm text-gray-800">{selected.response}</p>
                        <div className="mt-2 text-xs text-gray-500 flex justify-end">
                          Examiné le {selected.reviewDate} par {selected.reviewer}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action buttons with timer */}
                  {selected.status === 'pending' && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => approve(selected.id)}
                          disabled={actionLoading || !isOnline}
                          className="py-2.5 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                        >
                          {actionLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-sm">Traitement ({elapsedTime}s)</span>
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="w-5 h-5" />
                              Approuver
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => openRejectModal(selected.id)}
                          disabled={actionLoading || !isOnline}
                          className="py-2.5 px-4 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                        >
                          <XCircleIcon className="w-5 h-5" />
                          Rejeter
                        </button>
                      </div>
                      {!isOnline && (
                        <p className="text-xs text-red-500 text-center mt-2">Action indisponible hors ligne</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center h-[400px] flex flex-col items-center justify-center border-dashed">
                <div className="bg-gray-50 p-6 rounded-full mb-4">
                  <EyeIcon className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Aucune sélection</h3>
                <p className="text-gray-500 max-w-xs mx-auto mt-2">Sélectionnez une demande dans la liste de gauche pour voir les détails et effectuer des actions.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject modal with timer */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <XCircleIcon className="w-6 h-6 text-red-500" />
                Rejeter la demande
              </h3>
              <button
                onClick={closeRejectModal}
                disabled={actionLoading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <span className="sr-only">Fermer</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif du rejet (obligatoire)
                </label>
                <div className="relative">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    disabled={actionLoading}
                    placeholder="Veuillez expliquer pourquoi la demande est rejetée..."
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none text-sm shadow-sm disabled:bg-gray-100"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Ce message sera envoyé directement à l'utilisateur par email.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={closeRejectModal}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white hover:shadow-sm font-medium text-sm transition-all disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmReject}
                disabled={actionLoading || !rejectReason.trim() || !isOnline}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-all"
              >
                {actionLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Traitement ({elapsedTime}s)...</span>
                  </>
                ) : (
                  'Confirmer le rejet'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default Messaging;