import { useState, useEffect } from 'react';
import { useAuth } from '../services/useAuth';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

function Dashboard({ requireAuth = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérification optionnelle du rôle admin
    if (requireAuth && (!user || user.role !== 'admin')) {
      navigate('/unauthorized');
      return;
    }

    // Simulation de données - À remplacer par un appel API réel
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Ici, vous feriez un appel à votre API pour récupérer les statistiques
        // const response = await api.get('/admin/dashboard');
        
        // Données simulées pour la démonstration
        setTimeout(() => {
          setStats({
            totalUsers: 156,
            totalInvoices: 1247,
            totalRevenue: 2847500,
            pendingInvoices: 23,
            recentActivity: [
              { type: 'new_user', message: 'Nouvel utilisateur: Jean Dupont', time: '2 min', status: 'success' },
              { type: 'invoice_created', message: 'Facture #INV-2024-001 créée', time: '15 min', status: 'info' },
              { type: 'payment_received', message: 'Paiement reçu: 150,000 FCFA', time: '1h', status: 'success' },
              { type: 'system_alert', message: 'Sauvegarde automatique effectuée', time: '2h', status: 'info' },
              { type: 'user_login', message: 'Connexion: Marie Kouassi', time: '3h', status: 'info' }
            ]
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, navigate, requireAuth]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'new_user':
        return <UserGroupIcon className="w-5 h-5 text-green-500" />;
      case 'invoice_created':
        return <DocumentTextIcon className="w-5 h-5 text-blue-500" />;
      case 'payment_received':
        return <CurrencyDollarIcon className="w-5 h-5 text-green-500" />;
      case 'system_alert':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'user_login':
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
      default:
        return <CheckCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getActivityStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-admin">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-admin">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
          <p className="text-gray-900">Vue d'ensemble du système CMDT</p>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Utilisateurs totaux */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <UserGroupIcon className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600">+12% ce mois</span>
            </div>
          </div>

          {/* Factures totales */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Factures</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
              </div>
              <DocumentTextIcon className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600">+8% ce mois</span>
            </div>
          </div>

          {/* Chiffre d'affaires */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <CurrencyDollarIcon className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600">+15% ce mois</span>
            </div>
          </div>

          {/* Factures en attente */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingInvoices}</p>
              </div>
              <ClockIcon className="w-8 h-8 text-orange-500" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-orange-600">Nécessite attention</span>
            </div>
          </div>
        </div>

        {/* Graphiques et activité récente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Graphique des ventes (placeholder) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des ventes</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Graphique des ventes</p>
                <p className="text-sm text-gray-400">À implémenter</p>
              </div>
            </div>
          </div>

          {/* Activité récente */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getActivityStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button 
                onClick={() => navigate('/users')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Voir toute l'activité →
              </button>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/users')}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UserGroupIcon className="w-6 h-6 text-blue-500 mb-2" />
              <h4 className="font-medium text-gray-900">Gérer les utilisateurs</h4>
              <p className="text-sm text-gray-600">Ajouter, modifier ou supprimer des utilisateurs</p>
            </button>
            
            <button
              onClick={() => navigate('/settings')}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-500 mb-2" />
              <h4 className="font-medium text-gray-900">Paramètres système</h4>
              <p className="text-sm text-gray-600">Configurer les paramètres de l'application</p>
            </button>
            
            <button
              onClick={() => navigate('/admin-stats')}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChartBarIcon className="w-6 h-6 text-green-500 mb-2" />
              <h4 className="font-medium text-gray-900">Statistiques avancées</h4>
              <p className="text-sm text-gray-600">Consulter les rapports détaillés</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
