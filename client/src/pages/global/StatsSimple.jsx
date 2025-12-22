import { useState, useEffect, useRef } from 'react';
import useTitle from '../../hooks/ui/useTitle.js';
import Navbar from '../../components/navbar/Navbar.jsx';
import Header from '../../components/global/Header.jsx';
import { useAuth } from '../../hooks/auth/useAuth.js';
import Chart from 'chart.js/auto';

import {
  DocumentTextIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  UserCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

function StatsSimple() {
  useTitle('CMDT - Mes Statistiques');
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [fiscalYear, setFiscalYear] = useState('2024');
  const [chartData, setChartData] = useState(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Données de fallback minimales
  const getFallbackStats = (role = 'invoice_manager') => {
    const baseStats = {
      invoice_manager: {
        totalInvoices: 0,
        totalSuppliers: 0,
        invoiceCreationRate: 0,
        role: 'invoice_manager'
      },
      dfc_agent: {
        approvalRate: 0,
        rejectionRate: 0,
        processingRate: 0,
        role: 'dfc_agent'
      },
      admin: {
        totalInvoices: 0,
        totalSuppliers: 0,
        invoiceCreationRate: 0,
        approvalRate: 0,
        rejectionRate: 0,
        processingRate: 0,
        role: 'admin'
      }
    };
    return baseStats[role] || baseStats.invoice_manager;
  };

  // Charger les stats personnelles depuis l'API
  useEffect(() => {
    const fetchPersonalStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialiser avec les données de fallback immédiatement
        setStats(getFallbackStats(user?.role));

        const response = await fetch('/api/stats/personal', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          setStats(result.data);
          // Utiliser l'année fiscale de l'API si disponible
          if (result.meta?.fiscalYear) {
            setFiscalYear(result.meta.fiscalYear);
          }

          // Créer les données graphiques à partir des stats existantes
          prepareChartData(result.data);
        } else {
          throw new Error('Erreur lors du chargement des statistiques');
        }
      } catch (error) {
        console.error('Erreur chargement stats personnelles:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPersonalStats();
    } else {
      // Fallback si pas d'utilisateur
      setStats(getFallbackStats());
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const loadAvailableDates = async () => {
      try {
        if (!user || user.role !== 'invoice_manager') return;
        const res = await fetch('/api/stats/invoices/available-dates', { credentials: 'include', headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          const json = await res.json();
          const dates = Array.isArray(json.data) ? json.data : [];
          setAvailableDates(dates);
          if (dates.length > 0) {
            setSelectedDate(dates[0]);
          } else {
            const today = new Date();
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, '0');
            const d = String(today.getDate()).padStart(2, '0');
            setSelectedDate(`${y}-${m}-${d}`);
          }
        }
      } catch (e) {
        console.log(e);
      }
    };
    loadAvailableDates();
  }, [user]
  );

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const body = {
        type: 'invoice',
        variant: 'stats',
        format: 'pdf',
        search: { date: selectedDate }
      };
      const res = await fetch('/api/export', {
        method: 'POST', credentials: 'include', headers: { 'Accept': 'application/octet-stream', 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error('Export échoué');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-stats_${selectedDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erreur export:', e);
    } finally {
      setExporting(false);
    }
  };

  // Créer des données graphiques significatives selon le rôle
  const prepareChartData = (statsData) => {
    if (!statsData) return;

    const { role } = statsData;

    if (role === 'invoice_manager') {
      // Diagramme en barres pour les gestionnaires de factures
      setChartData({
        type: 'bar',
        data: {
          labels: ['Factures Créées', 'Fournisseurs', 'Taux Journalier'],
          datasets: [{
            label: 'Performance Facturation',
            data: [
              statsData.totalInvoices || 0,
              statsData.totalSuppliers || 0,
              statsData.invoiceCreationRate || 0
            ],
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(139, 92, 246, 0.8)'
            ],
            borderColor: [
              'rgb(59, 130, 246)',
              'rgb(16, 185, 129)',
              'rgb(139, 92, 246)'
            ],
            borderWidth: 2
          }]
        },
        title: 'Performance de Gestion des Factures'
      });
    }
    else if (role === 'dfc_agent') {
      // Diagramme en barres pour les agents DFC
      setChartData({
        type: 'bar',
        data: {
          labels: ['Taux Approbation', 'Taux Rejet', 'Taux Traitement'],
          datasets: [{
            label: 'Performance Validation DFC',
            data: [
              statsData.approvalRate || 0,
              statsData.rejectionRate || 0,
              statsData.processingRate || 0
            ],
            backgroundColor: [
              'rgba(16, 185, 129, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(59, 130, 246, 0.8)'
            ],
            borderColor: [
              'rgb(16, 185, 129)',
              'rgb(239, 68, 68)',
              'rgb(59, 130, 246)'
            ],
            borderWidth: 2
          }]
        },
        title: 'Performance de Validation DFC'
      });
    }
    else if (role === 'admin') {
      // Diagramme combiné pour les administrateurs
      setChartData({
        type: 'bar',
        data: {
          labels: ['Factures', 'Fournisseurs', 'Approbation', 'Rejet', 'Traitement'],
          datasets: [{
            label: 'Performance Globale',
            data: [
              statsData.totalInvoices || 0,
              statsData.totalSuppliers || 0,
              statsData.approvalRate || 0,
              statsData.rejectionRate || 0,
              statsData.processingRate || 0
            ],
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(139, 92, 246, 0.8)'
            ],
            borderColor: [
              'rgb(59, 130, 246)',
              'rgb(16, 185, 129)',
              'rgb(34, 197, 94)',
              'rgb(239, 68, 68)',
              'rgb(139, 92, 246)'
            ],
            borderWidth: 2
          }]
        },
        title: 'Performance Administrative Globale'
      });
    }
  };

  // Initialiser le graphique
  useEffect(() => {
    if (!chartData || !chartRef.current) return;

    createChart();
  }, [chartData]);

  const createChart = () => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');

    chartInstance.current = new Chart(ctx, {
      type: chartData.type,
      data: chartData.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#6B7280',
              font: {
                size: 12,
                weight: '500'
              },
              usePointStyle: true,
              padding: 20
            }
          },
          title: {
            display: true,
            text: chartData.title,
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#1F2937',
            padding: {
              bottom: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            titleColor: '#1F2937',
            bodyColor: '#374151',
            borderColor: '#E5E7EB',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            padding: 12,
            bodyFont: {
              size: 13,
              weight: '500'
            },
            callbacks: {
              label: function (context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                const dataLabel = chartData.data.labels[context.dataIndex];

                if (dataLabel.includes('Taux') || dataLabel.includes('Approbation') || dataLabel.includes('Rejet')) {
                  return `${dataLabel}: ${value}%`;
                }
                return `${dataLabel}: ${value}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              color: '#6B7280',
              font: {
                size: 11
              },
              precision: 0
            },
            title: {
              display: true,
              text: 'Valeurs',
              color: '#6B7280',
              font: {
                size: 12
              }
            }
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#6B7280',
              font: {
                size: 11,
                weight: '500'
              }
            }
          }
        },
        elements: {
          bar: {
            borderRadius: 6,
            borderSkipped: false,
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    });
  };

  // Statistiques pour Invoice Manager - LIBELLÉS EXPLICITES
  const getInvoiceManagerStats = () => [
    {
      label: 'Factures créées',
      value: stats?.totalInvoices || 0,
      icon: DocumentTextIcon,
      color: 'blue',
      description: 'Total des factures enregistrées'
    },
    {
      label: 'Fournisseurs créés',
      value: stats?.totalSuppliers || 0,
      icon: BuildingStorefrontIcon,
      color: 'green',
      description: 'Fournisseurs ajoutés au système'
    },
    {
      label: 'Taux création de factures',
      value: `${stats?.invoiceCreationRate || 0}/jour`,
      icon: ChartBarIcon,
      color: 'purple',
      description: 'Moyenne de factures créées par jour'
    }
  ];

  // Statistiques pour Agent DFC
  const getDfcAgentStats = () => [
    {
      label: 'Taux d\'approbation',
      value: `${stats?.approvalRate || 0}%`,
      icon: CheckCircleIcon,
      color: 'green',
      description: 'Factures approuvées'
    },
    {
      label: 'Taux de rejet',
      value: `${stats?.rejectionRate || 0}%`,
      icon: XCircleIcon,
      color: 'red',
      description: 'Factures rejetées'
    },
    {
      label: 'Taux de traitement',
      value: `${stats?.processingRate || 0}/jour`,
      icon: ClockIcon,
      color: 'blue',
      description: 'Décisions quotidiennes sur les factures'
    }
  ];

  // Statistiques pour Admin (combinaison des deux)
  const getAdminStats = () => [
    ...getInvoiceManagerStats(),
    ...getDfcAgentStats()
  ];

  const getStatsByRole = () => {
    if (!stats) return [];

    switch (stats.role) {
      case 'invoice_manager':
        return getInvoiceManagerStats();
      case 'dfc_agent':
        return getDfcAgentStats();
      case 'admin':
        return getAdminStats();
      default:
        return getInvoiceManagerStats();
    }
  };

  const getRoleTitle = () => {
    if (!stats) return 'Utilisateur';

    switch (stats.role) {
      case 'invoice_manager':
        return 'Gestionnaire de Factures';
      case 'dfc_agent':
        return 'Agent DFC';
      case 'admin':
        return 'Administrateur';
      default:
        return 'Utilisateur';
    }
  };

  const getRoleDescription = () => {
    if (!stats) return '';

    switch (stats.role) {
      case 'invoice_manager':
        return 'Gestion et enregistrement des factures fournisseurs';
      case 'dfc_agent':
        return 'Contrôle et validation des factures DFC';
      case 'admin':
        return 'Supervision complète du système';
      default:
        return 'Utilisateur du système CMDT';
    }
  };

  const currentStats = getStatsByRole();

  const isStatsEmpty = () => {
    if (!stats) return true;
    if (stats.role === 'invoice_manager') {
      return !stats.totalInvoices && !stats.totalSuppliers;
    }
    if (stats.role === 'dfc_agent') {
      return !stats.approvalRate && !stats.rejectionRate && !stats.processingRate;
    }
    if (stats.role === 'admin') {
      return !stats.totalInvoices && !stats.totalSuppliers && !stats.approvalRate;
    }
    return true;
  };

  return (
    <>
      <div className="min-h-screen bg-stats">
        <Header />
        <Navbar />

        <div className="container mx-auto px-4 py-8">
          {/* En-tête simplifiée */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${loading ? 'bg-gray-100' : 'bg-blue-50'}`}>
                    <UserCircleIcon className={`w-8 h-8 ${loading ? 'text-gray-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                      Mes Statistiques
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className={`flex items-center px-3 py-1 rounded-full ${loading ? 'bg-gray-100' : 'bg-blue-50'}`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${loading ? 'bg-gray-400' : 'bg-blue-500'}`}></div>
                        <span className={`font-medium ${loading ? 'text-gray-500' : 'text-blue-700'}`}>
                          {loading ? 'Chargement...' : getRoleTitle()}
                        </span>
                      </div>
                      <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
                        <CalendarIcon className="w-4 h-4 mr-1 text-gray-500" />
                        <span>Année fiscale {fiscalYear}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 lg:mt-0">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full border ${loading ? 'bg-gray-100 border-gray-200' : 'bg-green-50 border-green-200'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${loading ? 'bg-gray-400' : 'bg-green-500'}`}></div>
                    <span className={`text-sm font-medium ${loading ? 'text-gray-500' : 'text-green-700'}`}>
                      {loading ? 'Connexion...' : 'Système actif'}
                    </span>
                  </div>
                </div>
                {stats?.role === 'invoice_manager' && (
                  <div className="mt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-700 font-medium">Date d'export</label>
                        <select
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          {availableDates.length > 0 ? (
                            availableDates.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))
                          ) : (
                            <option value={selectedDate}>{selectedDate || "Aujourd'hui"}</option>
                          )}
                        </select>
                      </div>
                      <div>
                        <button
                          onClick={handleExport}
                          disabled={exporting || availableDates.length === 0}
                          title={availableDates.length === 0 ? "Aucune donnée disponible pour l'export" : "Exporter les statistiques"}
                          className={`inline-flex items-center px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${(exporting || availableDates.length === 0) ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                          {exporting && (
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                            </svg>
                          )}
                          Exporter l'état
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!loading && isStatsEmpty() ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <ChartBarIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune statistique disponible</h3>
              <p className="text-gray-500 max-w-md">
                Il semble qu'il n'y ait pas encore de données suffisantes pour générer vos statistiques.
                Commencez à utiliser le système pour voir apparaître vos indicateurs de performance.
              </p>
            </div>
          ) : (
            <>
              {/* Cartes de statistiques personnelles */}
              <div className={`grid gap-6 mb-8 ${stats?.role === 'admin'
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}>
                {currentStats.map((stat, index) => {
                  const Icon = stat.icon;
                  const colorClasses = {
                    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
                    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
                    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' },
                    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' }
                  };
                  const colors = loading
                    ? { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-400' }
                    : colorClasses[stat.color] || colorClasses.blue;

                  return (
                    <div
                      key={index}
                      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 group relative ${loading ? 'opacity-70' : 'hover:shadow-md'
                        }`}
                    >
                      {/* Tooltip amélioré */}
                      {!loading && (
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                          {stat.description}
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                        </div>
                      )}

                      <div className="flex flex-col items-center text-center">
                        <div className={`p-3 rounded-xl ${colors.bg} border ${colors.border} mb-4 transition-transform duration-200 ${loading ? '' : 'group-hover:scale-105'
                          }`}>
                          <Icon className={`w-7 h-7 ${colors.text}`} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                        <p className="text-gray-700 font-medium">{stat.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Diagramme en barres avec données réelles */}
              {chartData && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                  <div className="h-80">
                    <canvas ref={chartRef} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Message d'information */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-white p-2 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  {loading ? 'Chargement en cours...' : 'Performance Personnelle'}
                </h3>
                <p className="text-blue-800">
                  {loading
                    ? 'Vos données statistiques sont en cours de chargement...'
                    : 'Ces statistiques représentent votre activité individuelle dans le système CMDT. Les données sont mises à jour automatiquement et reflètent votre contribution à l\'efficacité globale de l\'organisation.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default StatsSimple;