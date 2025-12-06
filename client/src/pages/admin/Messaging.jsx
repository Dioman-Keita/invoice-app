import { useState, useEffect } from 'react';
import api from '../../services/api';
import useToastFeedback from '../../hooks/ui/useToastFeedBack.js';
import { useAuth } from '../../hooks/auth/useAuth.js';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/global/Header.jsx';
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
  TrashIcon,
  ArchiveBoxIcon,
  BellIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

function Messaging() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const { success, error } = useToastFeedback();

  // Données simplifiées
  const [requests, setRequests] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  // Fetch requests and stats
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchRequests();
      fetchStats();
    }
  }, [user, filter, search]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/migration/stats');
      // Backend returns { total, pending, approved, rejected }
      if (response.data) setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/migration/requests', {
        params: { status: filter, search }
      });
      const rawData = response.data?.requests || [];
      const mappedData = rawData.map(req => ({
        id: req.id,
        name: `${req.firstName || ''} ${req.lastName || ''}`.trim() || req.email,
        email: req.email,
        from: req.from_role,
        to: req.to_role,
        dept: req.department,
        reason: req.motivation,
        status: req.status,
        date: new Date(req.created_at).toLocaleDateString(),
        // Extra fields for details view
        reviewer: req.reviewed_by ? 'Admin' : null, // ID only in backend, might need name lookup or just generic
        reviewDate: req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : null,
        response: req.review_note
      }));
      setRequests(mappedData);
    } catch (err) {
      console.error("Failed to fetch requests", err);
      error('Erreur chargement demandes');
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id) => {
    try {
      await api.post(`/api/migration/requests/${id}/approve`);
      success('Demande approuvée');
      fetchRequests(); // Refresh
      if (selected?.id === id) setSelected(prev => ({ ...prev, status: 'approved' }));
    } catch (err) {
      error('Erreur approbation');
    }
  };

  const reject = async (id) => {
    const reason = prompt('Raison rejet (optionnel) :');
    if (reason === null) return;
    try {
      await api.post(`/api/migration/requests/${id}/reject`, { review_note: reason });
      success('Demande rejetée');
      fetchRequests(); // Refresh
      if (selected?.id === id) setSelected(prev => ({ ...prev, status: 'rejected' }));
    } catch (err) {
      error('Erreur rejet');
    }
  };

  // Filtrage simple (peut être amélioré plus tard)
  const filtered = requests;

  const remove = (id) => {
    // Pas d'endpoint delete implémenté, à voir si nécessaire
    alert("Suppression non implémentée");
    /*
  if (window.confirm('Supprimer cette demande ?')) {
    setRequests(prev => prev.filter(req => req.id !== id));
    if (selected?.id === id) setSelected(null);
  }
  */
  };

  const archive = (id) => {
    // A implémenter si besoin
    alert("Archivage non implémenté");
  };

  // Vérifications d'accès
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center">
          <InboxIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Connexion requise</h2>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center">
          <XCircleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Accès admin seulement</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Dashboard
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
        {/* Header compact */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messagerie Admin</h1>
              <p className="text-gray-600 text-sm">Gestion demandes changement rôle</p>
            </div>
            {stats.pending > 0 && (
              <div className="bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2">
                  <BellIcon className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    {stats.pending} demande{stats.pending > 1 ? 's' : ''} en attente
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats compactes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <InboxIcon className="w-5 h-5 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">En attente</p>
                <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <ClockIcon className="w-5 h-5 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approuvées</p>
                <p className="text-xl font-bold text-gray-900">{stats.approved}</p>
              </div>
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rejetées</p>
                <p className="text-xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
              <XCircleIcon className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste gauche */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Barre outils */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Recherche..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <FunnelIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Toutes</option>
                    <option value="pending">En attente</option>
                    <option value="approved">Approuvées</option>
                    <option value="rejected">Rejetées</option>
                  </select>

                  <button
                    onClick={() => window.location.reload()}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    title="Actualiser"
                  >
                    <ArrowPathIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Liste */}
              <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-8 text-center">
                    <InboxIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucune demande</p>
                  </div>
                ) : (
                  filtered.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => setSelected(req)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selected?.id === req.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Ligne 1: Nom + Statut */}
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{req.name}</h3>
                              <p className="text-xs text-gray-500">{req.email}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              req.status === 'approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                              {req.status === 'pending' ? 'En attente' :
                                req.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                            </span>
                          </div>

                          {/* Ligne 2: Migration */}
                          <div className="flex items-center gap-3 bg-gray-100 rounded p-2 mb-2">
                            <div className="text-center flex-1">
                              <p className="text-xs text-gray-500">Actuel</p>
                              <p className="text-sm font-medium">{req.from}</p>
                            </div>
                            <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                            <div className="text-center flex-1">
                              <p className="text-xs text-gray-500">Nouveau</p>
                              <p className="text-sm font-medium text-blue-600">{req.to}</p>
                            </div>
                          </div>

                          {/* Ligne 3: Métadonnées */}
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <BuildingOfficeIcon className="w-3 h-3" />
                              <span>{req.dept}</span>
                            </div>
                            <span>{req.date}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="ml-3">
                          {req.status === 'pending' && (
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); approve(req.id); }}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Approuver"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); reject(req.id); }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Rejeter"
                              >
                                <XCircleIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Détails droite */}
          <div>
            {selected ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-900">Détails demande</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => archive(selected.id)}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="Archiver"
                      >
                        <ArchiveBoxIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => remove(selected.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Supprimer"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Info utilisateur */}
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{selected.name}</h3>
                        <p className="text-sm text-gray-600">{selected.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Migration */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">CHANGEMENT DE RÔLE</p>
                    <div className="flex items-center justify-between bg-gray-100 p-3 rounded">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">De</p>
                        <p className="font-medium">{selected.from}</p>
                      </div>
                      <ArrowRightIcon className="w-4 h-4 text-blue-500" />
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Vers</p>
                        <p className="font-medium text-blue-600">{selected.to}</p>
                      </div>
                    </div>
                  </div>

                  {/* Département */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">DÉPARTEMENT</p>
                    <div className="flex items-center gap-2 bg-gray-100 p-3 rounded">
                      <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{selected.dept}</span>
                    </div>
                  </div>

                  {/* Motivation */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <ChatBubbleLeftRightIcon className="w-3 h-3" />
                      MOTIVATION
                    </p>
                    <div className="bg-gray-100 p-3 rounded">
                      <p className="text-sm text-gray-700">{selected.reason}</p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">SOUMIS LE</p>
                      <div className="bg-gray-100 p-2 rounded">
                        <p className="text-sm">{selected.date}</p>
                      </div>
                    </div>
                    {selected.reviewDate && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">EXAMINÉ LE</p>
                        <div className="bg-gray-100 p-2 rounded">
                          <p className="text-sm">{selected.reviewDate}</p>
                          <p className="text-xs text-gray-500">Par {selected.reviewer}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Statut */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">STATUT</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded ${selected.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selected.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                      {selected.status === 'pending' && <ClockIcon className="w-4 h-4" />}
                      {selected.status === 'approved' && <CheckCircleIcon className="w-4 h-4" />}
                      {selected.status === 'rejected' && <XCircleIcon className="w-4 h-4" />}
                      <span className="font-medium">
                        {selected.status === 'pending' ? 'En attente' :
                          selected.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                      </span>
                    </div>
                  </div>

                  {/* Réponse admin */}
                  {selected.response && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">RÉPONSE ADMIN</p>
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm text-gray-700">{selected.response}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {selected.status === 'pending' && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex gap-3">
                        <button
                          onClick={() => approve(selected.id)}
                          className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => reject(selected.id)}
                          className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                        >
                          Rejeter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <EyeIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Sélectionnez une demande</p>
              </div>
            )}
          </div>
        </div>

        {/* Note info */}
        <div className="mt-6 bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-blue-600 mt-0.5" />
            <p className="text-xs text-blue-700">
              Toutes les actions sont enregistrées. Les utilisateurs sont notifiés par email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Messaging;