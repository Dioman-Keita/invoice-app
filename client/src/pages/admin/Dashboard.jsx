import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/auth/useAuth.js';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/global/Header.jsx';
import Navbar from '../../components/navbar/Navbar.jsx';
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import Chart from 'chart.js/auto';
import useTitle from '../../hooks/ui/useTitle.js';

// Données de fallback minimales
const FALLBACK_DATA = null;

function Dashboard({ requireAuth = false }) {
  useTitle('CMDT - Tableau de bord');
  const { user } = useAuth();
  const navigate = useNavigate();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartReady, setChartReady] = useState(false);

  // Un seul useEffect pour tout gérer
  useEffect(() => {
    if (requireAuth && (!user || user.role !== 'admin')) {
      navigate('/unauthorized');
      return;
    }

    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setDashboardData(null);
        setLoading(true);

        const response = await fetch('/api/stats/dashboard/kpis', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok && isMounted) {
          const result = await response.json();
          const data = result.data;

          const newData = {
            totalUsers: data.total_employee || 0,
            totalInvoices: data.total_invoices || 0,
            totalRevenue: data.business_amount || 0,
            pendingInvoices: data.total_invoice_pending || 0,
            dateFrom: data.dateFrom,
            dateTo: data.dateTo
          };

          setDashboardData(newData);

          // Mettre à jour le graphique après un petit délai
          setTimeout(() => {
            if (isMounted && chartRef.current) {
              createChart(newData);
              setChartReady(true);
            }
          }, 50);
        } else {
          setDashboardData(null);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setDashboardData(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [user, navigate, requireAuth]);

  const createChart = (data) => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');

    const labels = ['Utilisateurs', 'Factures', 'Chiffre d\'affaires', 'En attente DFC'];

    const maxValue = Math.max(data.totalUsers, data.totalInvoices, data.pendingInvoices, 1);
    const dataValues = [
      data.totalUsers,
      data.totalInvoices,
      data.totalRevenue / (data.totalRevenue / maxValue),
      data.pendingInvoices
    ];

    const backgroundColors = [
      'rgba(59, 130, 246, 0.7)',
      'rgba(34, 197, 94, 0.7)',
      'rgba(234, 179, 8, 0.7)',
      'rgba(249, 115, 22, 0.7)'
    ];

    const borderColors = [
      'rgb(59, 130, 246)',
      'rgb(34, 197, 94)',
      'rgb(234, 179, 8)',
      'rgb(249, 115, 22)'
    ];

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            data: dataValues,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: `Comparaison des indicateurs - ${formatDateFrench(data.dateFrom)} à ${formatDateFrench(data.dateTo)}`,
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
            enabled: true,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            titleColor: '#1F2937',
            bodyColor: '#374151',
            borderColor: '#E5E7EB',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            padding: 12,
            bodyFont: {
              size: 13,
              weight: '500'
            },
            callbacks: {
              title: function (tooltipItems) {
                return tooltipItems[0].label;
              },
              label: function (context) {
                const index = context.dataIndex;
                let value;

                switch (index) {
                  case 0: // Utilisateurs
                    value = `${formatNumber(data.totalUsers)} utilisateurs`;
                    break;
                  case 1: // Factures
                    value = `${formatNumber(data.totalInvoices)} factures`;
                    break;
                  case 2: // Chiffre d'affaires
                    value = formatCurrencyExact(data.totalRevenue);
                    break;
                  case 3: // En attente DFC
                    value = `${formatNumber(data.pendingInvoices)} en attente`;
                    break;
                  default:
                    value = formatNumber(context.raw);
                }

                return value;
              },
              labelColor: function (context) {
                return {
                  borderColor: borderColors[context.dataIndex],
                  backgroundColor: borderColors[context.dataIndex],
                  borderWidth: 2
                };
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false,
            },
            ticks: {
              color: '#6B7280',
              font: {
                size: 11
              },
              callback: function (value) {
                return formatNumber(value);
              }
            }
          },
          x: {
            grid: {
              display: false,
              drawBorder: false,
            },
            ticks: {
              color: '#6B7280',
              font: {
                size: 12,
                weight: '600'
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

  // Format M/k pour le KPI
  const formatCurrencyKPI = (amount) => {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + ' M';
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(0) + ' k';
    }
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format exact pour le tooltip
  const formatCurrencyExact = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' F CFA';
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('fr-FR').format(number);
  };

  // Format de date français
  const formatDateFrench = (dateString) => {
    if (!dateString) return '';

    if (dateString.includes('/')) {
      return dateString;
    }

    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Helper pour vérifier si les données sont vides
  const isDashboardEmpty = () => {
    if (!dashboardData) return true;
    return dashboardData.totalUsers === 0 && dashboardData.totalInvoices === 0 && dashboardData.totalRevenue === 0;
  };

  // Afficher le contenu principal même pendant le chargement avec les fallbacks
  return (
    <div className="min-h-screen bg-admin">
      <Header />
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* En-tête avec période */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
              <p className="text-gray-900">Vue d'ensemble du système CMDT</p>
            </div>
            {dashboardData && dashboardData.dateFrom && dashboardData.dateTo && (
              <div className="mt-4 sm:mt-0">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-900">
                      Période : {formatDateFrench(dashboardData.dateFrom)} → {formatDateFrench(dashboardData.dateTo)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Indicateur de chargement subtil */}
        {loading && (
          <div className="fixed top-20 right-4 z-50">
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm animate-pulse">
              Chargement...
            </div>
          </div>
        )}

        {!loading && isDashboardEmpty() ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-200 text-center mb-8">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <ExclamationTriangleIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune donnée disponible</h3>
            <p className="text-gray-500 max-w-md">
              Le tableau de bord ne contient aucune donnée pour le moment.
              Les statistiques s'afficheront ici une fois que l'activité aura commencé.
            </p>
          </div>
        ) : (
          <>
            {/* Statistiques principales - Toujours affichées si données présentes */}
            {dashboardData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-sm border border-blue-100 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-blue-100 p-3 rounded-full mb-3">
                      <UserGroupIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Utilisateurs</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? (
                        <span className="inline-block h-8 w-16 bg-gray-200 rounded animate-pulse"></span>
                      ) : (
                        formatNumber(dashboardData.totalUsers)
                      )}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl shadow-sm border border-green-100 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-green-100 p-3 rounded-full mb-3">
                      <DocumentTextIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-green-600 mb-1">Factures</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? (
                        <span className="inline-block h-8 w-16 bg-gray-200 rounded animate-pulse"></span>
                      ) : (
                        formatNumber(dashboardData.totalInvoices)
                      )}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-white p-6 rounded-xl shadow-sm border border-yellow-100 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-yellow-100 p-3 rounded-full mb-3">
                      <CurrencyDollarIcon className="w-6 h-6 text-yellow-600" />
                    </div>
                    <p className="text-sm font-medium text-yellow-600 mb-1">Chiffre d'affaires</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? (
                        <span className="inline-block h-8 w-20 bg-gray-200 rounded animate-pulse"></span>
                      ) : (
                        `${formatCurrencyKPI(dashboardData.totalRevenue)} F CFA`
                      )}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-xl shadow-sm border border-orange-100 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-orange-100 p-3 rounded-full mb-3">
                      <ClockIcon className="w-6 h-6 text-orange-600" />
                    </div>
                    <p className="text-sm font-medium text-orange-600 mb-1">En attente DFC</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? (
                        <span className="inline-block h-8 w-16 bg-gray-200 rounded animate-pulse"></span>
                      ) : (
                        formatNumber(dashboardData.pendingInvoices)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Histogramme - Toujours affiché si données présentes */}
            {dashboardData && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                <div className="h-96">
                  {!chartReady && (
                    <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Chargement du graphique...</p>
                      </div>
                    </div>
                  )}
                  <canvas
                    ref={chartRef}
                    className={!chartReady ? 'hidden' : ''}
                  />
                </div>
              </div>
            )}

            {/* Le reste du contenu... */}
            {dashboardData && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-8">
                <div className="flex items-center">
                  <ChartBarIcon className="w-5 h-5 text-blue-600 mr-3" />
                  <p className="text-sm text-blue-700">
                    <strong>Info :</strong> Les hauteurs des barres sont normalisées pour une visualisation optimale.
                    Passez la souris sur chaque barre pour voir la valeur réelle.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Actions rapides */}
        <div className="mt-8 bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/users')}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-white transition-all duration-200 hover:shadow-md hover:border-blue-200"
            >
              <UserGroupIcon className="w-6 h-6 text-blue-500 mb-2" />
              <h4 className="font-medium text-gray-900">Gérer les utilisateurs</h4>
              <p className="text-sm text-gray-600">Ajouter, modifier ou supprimer des utilisateurs</p>
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-white transition-all duration-200 hover:shadow-md hover:border-orange-200"
            >
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-500 mb-2" />
              <h4 className="font-medium text-gray-900">Paramètres système</h4>
              <p className="text-sm text-gray-600">Configurer les paramètres de l'application</p>
            </button>

            <button
              onClick={() => navigate('/admin-stats')}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-white transition-all duration-200 hover:shadow-md hover:border-green-200"
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