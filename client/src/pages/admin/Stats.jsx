import { useMemo, useState, useEffect } from 'react';
import useTitle from '../../hooks/ui/useTitle.js';
import useBackground from '../../hooks/ui/useBackground.js';
import Footer from '../../components/global/Footer.jsx';
import Navbar from '../../components/navbar/Navbar.jsx';
import api from '../../services/api';

// Import de Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Enregistrement des composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ChartTitle,
  Tooltip,
  Legend,
  ArcElement
);

import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BuildingStorefrontIcon,
  DocumentChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

// Composant pour état vide
function EmptyState({ title, description, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-yellow-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 max-w-md mx-auto">{description}</p>
    </div>
  );
}

// Carte de métrique avec données par année fiscale
function PrimaryMetricCard({ title, value, description, icon: Icon, color = 'blue', loading = false }) {
  const colorConfig = {
    blue: { 
      bg: 'bg-blue-50', 
      iconBg: 'bg-blue-100', 
      iconColor: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: { 
      bg: 'bg-green-50', 
      iconBg: 'bg-green-100', 
      iconColor: 'text-green-600',
      border: 'border-green-200'
    },
    purple: { 
      bg: 'bg-purple-50', 
      iconBg: 'bg-purple-100', 
      iconColor: 'text-purple-600',
      border: 'border-purple-200'
    },
    orange: { 
      bg: 'bg-orange-50', 
      iconBg: 'bg-orange-100', 
      iconColor: 'text-orange-600',
      border: 'border-orange-200'
    }
  };

  const config = colorConfig[color];

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg border-2 ${config.border} p-6 animate-pulse`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-3 rounded-xl ${config.iconBg} shadow-sm`}>
                <Icon className={`w-6 h-6 ${config.iconColor} opacity-50`} />
              </div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg border-2 ${config.border} p-6 hover:shadow-xl transition-all duration-300 group relative overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-3 rounded-xl ${config.iconBg} shadow-sm`}>
                <Icon className={`w-6 h-6 ${config.iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</p>
              </div>
            </div>
            
            <p className="text-3xl font-bold text-gray-900 mb-2 text-center">{value}</p>
            
            {description && (
              <p className="text-sm text-gray-600 leading-relaxed text-center">{description}</p>
            )}
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${
              color === 'blue' ? 'bg-blue-500' :
              color === 'green' ? 'bg-green-500' :
              color === 'purple' ? 'bg-purple-500' : 'bg-orange-500'
            }`}
            style={{ width: '100%' }}
          ></div>
        </div>
      </div>
    </div>
  );
}

// Composant de pagination CORRIGÉ - TOUJOURS VISIBLE SUR TOUS LES ÉCRANS
function Pagination({ currentPage, totalPages, onPageChange }) {
  console.log('Pagination - currentPage:', currentPage, 'totalPages:', totalPages); // Debug

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
      {/* Navigation mobile - TOUJOURS VISIBLE */}
      <div className="flex justify-between flex-1 sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Précédent
        </button>
        <div className="flex items-center">
          <span className="text-sm text-gray-700 mx-4">
            Page {currentPage} sur {totalPages}
          </span>
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Suivant
        </button>
      </div>

      {/* Navigation desktop - TOUJOURS VISIBLE */}
      <div className="flex flex-1 items-center justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Page <span className="font-medium">{currentPage}</span> sur{' '}
            <span className="font-medium">{totalPages}</span>
            {totalPages === 1 && ' (seule page)'}
          </p>
        </div>
        <div>
          <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 text-gray-400 rounded-l-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => onPageChange(index + 1)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border border-gray-300 ${
                  currentPage === index + 1
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 text-gray-400 rounded-r-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

// Fonction pour déterminer le statut d'activité du fournisseur
function getSupplierActivityStatus(invoiceCount) {
  if (invoiceCount === 0) return { status: 'Inactif', color: 'text-gray-500', bg: 'bg-gray-100' };
  if (invoiceCount <= 5) return { status: 'Faible', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  if (invoiceCount <= 15) return { status: 'Moyen', color: 'text-blue-600', bg: 'bg-blue-100' };
  if (invoiceCount <= 30) return { status: 'Élevé', color: 'text-orange-600', bg: 'bg-orange-100' };
  return { status: 'Très élevé', color: 'text-green-600', bg: 'bg-green-100' };
}

// COMPOSANT GRAPHIQUE LINÉAIRE POUR LES KPIs
function KpiLineChart({ data, title, selectedFiscalYear, loading = false }) {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#1F2937',
        bodyColor: '#374151',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        boxPadding: 10,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              const value = context.parsed.y;
              return `${label}${value.toLocaleString('fr-FR')}`;
            }
            return label;
          },
          title: function(tooltipItems) {
            return tooltipItems[0].label;
          }
        }
      },
      title: {
        display: false
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.04)',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6B7280',
          padding: 8,
          callback: function(value) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'K';
            }
            return value.toLocaleString();
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.04)',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6B7280',
          padding: 8
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 3,
        fill: true
      },
      point: {
        radius: 5,
        hoverRadius: 8,
        borderWidth: 2,
        hoverBorderWidth: 3,
        backgroundColor: '#FFFFFF'
      }
    },
    animations: {
      tension: {
        duration: 1000,
        easing: 'easeOutCubic'
      },
      points: {
        duration: 800,
        easing: 'easeOutQuad'
      }
    },
    hover: {
      animationDuration: 300
    }
  };

  const getChartData = () => {
    if (!data || data.length === 0) {
      return {
        labels: ['Aucune donnée'],
        datasets: [
          {
            label: 'Aucune donnée disponible',
            data: [0],
            borderColor: 'rgba(156, 163, 175, 0.8)',
            backgroundColor: 'rgba(156, 163, 175, 0.1)',
            borderWidth: 2,
            fill: true,
          },
        ],
      };
    }

    const labels = data.map(item => item.title || item.name || 'KPI');
    
    const values = data.map(item => {
      const value = item.value;
      if (typeof value === 'string') {
        const cleanValue = value.replace(/[%,MK]/g, '').replace(/,/g, '.').trim();
        const numValue = parseFloat(cleanValue) || 0;
        
        if (value.includes('M')) return numValue * 1000000;
        if (value.includes('K')) return numValue * 1000;
        if (value.includes('%')) return numValue;
        
        return numValue;
      }
      return value || 0;
    });

    const gradientColors = [
      { start: 'rgba(59, 130, 246, 0.8)', end: 'rgba(59, 130, 246, 0.1)' },
      { start: 'rgba(16, 185, 129, 0.8)', end: 'rgba(16, 185, 129, 0.1)' },
      { start: 'rgba(139, 92, 246, 0.8)', end: 'rgba(139, 92, 246, 0.1)' },
    ];

    const colorIndex = Math.floor(Math.random() * gradientColors.length);
    const selectedColor = gradientColors[colorIndex];

    return {
      labels,
      datasets: [
        {
          label: 'Valeurs des KPIs',
          data: values,
          borderColor: selectedColor.start,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, selectedColor.start);
            gradient.addColorStop(1, selectedColor.end);
            return gradient;
          },
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: selectedColor.start,
          pointHoverBackgroundColor: selectedColor.start,
          pointHoverBorderColor: '#FFFFFF',
          pointHoverBorderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 8,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="bg-gray-200 rounded h-64"></div>
        </div>
      </div>
    );
  }

  const hasData = data && data.length > 0 && data.some(item => {
    const value = item.value;
    if (typeof value === 'string') {
      return parseFloat(value.replace(/[%,MK]/g, '')) > 0;
    }
    return value > 0;
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-lg">📈</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Évolution des KPIs</h3>
            <p className="text-gray-600 text-sm">Tendances des indicateurs clés</p>
          </div>
        </div>
      </div>
      
      {hasData ? (
        <div className="h-80">
          <Line data={getChartData()} options={chartOptions} />
        </div>
      ) : (
        <div className="h-80 flex flex-col items-center justify-center text-gray-500">
          <ChartBarIcon className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">Aucune donnée disponible</p>
          <p className="text-sm text-gray-600 text-center max-w-md">
            Les données statistiques pour l'année {selectedFiscalYear} ne sont pas encore disponibles.
            <br />
            Veuillez sélectionner une autre année ou patienter que les données soient collectées.
          </p>
        </div>
      )}
    </div>
  );
}

// COMPOSANT GRAPHIQUE COMPARATIF CORRIGÉ
function ComparisonChart({ data, title, selectedFiscalYear, loading = false }) {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#1F2937',
        bodyColor: '#374151',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        boxPadding: 10,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.parsed.y.toLocaleString('fr-FR')}`;
          }
        }
      },
      title: {
        display: false
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.04)',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6B7280',
          padding: 8
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.04)',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 10
          },
          color: '#6B7280',
          padding: 8,
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 6,
        borderSkipped: false,
        borderWidth: 0,
      }
    },
    animations: {
      tension: {
        duration: 1000,
        easing: 'easeOutCubic'
      }
    }
  };

  const getChartData = () => {
    if (!data || data.length === 0) {
      return {
        labels: ['Aucune donnée'],
        datasets: [
          {
            label: 'Aucune donnée disponible',
            data: [0],
            backgroundColor: 'rgba(156, 163, 175, 0.8)',
          },
        ],
      };
    }

    // AFFICHER TOUS les fournisseurs sans abréviation
    const labels = data.map(item => item.name || item.label || 'Item');
    const values = data.map(item => item.value || item.count || 0);

    const backgroundColors = [
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(16, 185, 129, 0.8)',   // Green
      'rgba(139, 92, 246, 0.8)',   // Purple
      'rgba(245, 158, 11, 0.8)',   // Orange
      'rgba(239, 68, 68, 0.8)',    // Red
      'rgba(99, 102, 241, 0.8)',   // Indigo
      'rgba(236, 72, 153, 0.8)',   // Pink
      'rgba(6, 182, 212, 0.8)',    // Cyan
      'rgba(20, 184, 166, 0.8)',   // Teal
      'rgba(120, 53, 247, 0.8)',   // Violet
      'rgba(180, 83, 9, 0.8)',     // Amber
      'rgba(220, 38, 38, 0.8)',    // Red-600
    ];

    const hoverColors = [
      'rgba(59, 130, 246, 1)',
      'rgba(16, 185, 129, 1)',
      'rgba(139, 92, 246, 1)',
      'rgba(245, 158, 11, 1)',
      'rgba(239, 68, 68, 1)',
      'rgba(99, 102, 241, 1)',
      'rgba(236, 72, 153, 1)',
      'rgba(6, 182, 212, 1)',
      'rgba(20, 184, 166, 1)',
      'rgba(120, 53, 247, 1)',
      'rgba(180, 83, 9, 1)',
      'rgba(220, 38, 38, 1)',
    ];

    const getColor = (index) => backgroundColors[index % backgroundColors.length];
    const getHoverColor = (index) => hoverColors[index % hoverColors.length];

    return {
      labels,
      datasets: [
        {
          label: 'Valeurs comparatives',
          data: values,
          backgroundColor: data.map((_, index) => getColor(index)),
          hoverBackgroundColor: data.map((_, index) => getHoverColor(index)),
          borderWidth: 0,
          hoverBorderWidth: 0,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="bg-gray-200 rounded h-64"></div>
        </div>
      </div>
    );
  }

  const hasData = data && data.length > 0 && data.some(item => (item.value || item.count) > 0);

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-lg">📊</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Comparaison des Performances</h3>
            <p className="text-gray-600 text-sm">{title}</p>
          </div>
        </div>
      </div>
      
      {hasData ? (
        <div className="h-96"> {/* Hauteur augmentée pour accommoder plus de données */}
          <Bar data={getChartData()} options={chartOptions} />
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500">
          <ChartBarIcon className="w-12 h-12 text-gray-300 mb-3" />
          <p className="font-medium text-gray-900 mb-1">Données non disponibles</p>
          <p className="text-sm text-gray-600 text-center">
            Aucune donnée pour {selectedFiscalYear}
          </p>
        </div>
      )}
    </div>
  );
}

// Tableau de données avec pagination CORRIGÉ - PAGINATION TOUJOURS VISIBLE
function PrimaryDataTable({ 
  title, 
  headers, 
  data, 
  icon: Icon, 
  selectedFiscalYear, 
  loading = false,
  itemsPerPage = 8 
}) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [data, selectedFiscalYear]);

  const totalPages = Math.ceil((data?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = data?.slice(startIndex, startIndex + itemsPerPage) || [];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              {headers.map((_, j) => (
                <div key={j} className="h-4 bg-gray-200 rounded flex-1"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <p className="text-gray-600 text-sm">
            Données de l'année {selectedFiscalYear}
            {data && data.length > 0 && ` - ${data.length} résultat(s)`}
          </p>
        </div>
      </div>

      {currentData.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  {headers.map((header, index) => (
                    <th key={index} className="text-center py-4 px-4 font-semibold text-gray-700 uppercase tracking-wide text-xs">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentData.map((row, index) => (
                  <tr 
                    key={index} 
                    className="border-b border-gray-100 last:border-0 hover:bg-blue-50 transition-colors duration-200 group"
                  >
                    {Object.values(row).map((cell, cellIndex) => (
                      <td key={cellIndex} className="py-3 px-4 text-gray-700 group-hover:text-gray-900 font-medium text-center">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* PAGINATION TOUJOURS VISIBLE MÊME AVEC UNE SEULE PAGE */}
          {data && data.length > 0 && (
            <div className="mt-6">
              <Pagination 
                currentPage={currentPage}
                totalPages={Math.max(totalPages, 1)} // Garantit au moins 1 page
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium">Aucune donnée disponible</p>
          <p className="text-sm mt-1">Les données pour {selectedFiscalYear} apparaîtront ici une fois disponibles</p>
        </div>
      )}
    </div>
  );
}

// Hook personnalisé pour les données par année fiscale
function useFiscalYearStatsData(endpoint, fiscalYearId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fiscalYearId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = { fiscalYear: fiscalYearId };
        const response = await api.get(endpoint, { params });
        setData(response.data || response);
      } catch (err) {
        console.error(`Erreur lors du chargement des données ${endpoint}:`, err);
        setError(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, fiscalYearId]);

  return { data, loading, error };
}

// Hook pour récupérer les années fiscales
function useFiscalYears() {
  const [fiscalYears, setFiscalYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFiscalYears = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/fiscal-years');
        
        let years = [];
        if (response.data && Array.isArray(response.data.data)) {
          years = response.data.data;
        } else if (Array.isArray(response.data)) {
          years = response.data;
        } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
          years = response.data.data;
        }
        
        setFiscalYears(years);
      } catch (err) {
        console.error('Erreur lors du chargement des années fiscales:', err);
        setError(err);
        setFiscalYears([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFiscalYears();
  }, []);

  return { fiscalYears, loading, error };
}

function Stats() {
  useTitle('CMDT - Tableau de Bord Statistiques par Année Fiscale');
  useBackground('bg-stats');
  
  const [activeTab, setActiveTab] = useState('invoices');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState('');

  const { fiscalYears, loading: fiscalYearsLoading, error: fiscalYearsError } = useFiscalYears();

  useEffect(() => {
    if (fiscalYears.length > 0 && !selectedFiscalYear) {
      setSelectedFiscalYear(fiscalYears[0]);
    }
  }, [fiscalYears, selectedFiscalYear]);

  const endpoints = {
    invoices: {
      summary: '/api/stats/invoices/summary',
      byEmployee: '/api/stats/invoices/by-employee',
    },
    dfc: {
      overview: '/api/stats/dfc/overview',
      agentsRates: '/api/stats/dfc/agents/rates',
    },
    suppliers_created: {
      summary: '/api/stats/suppliers/created/summary',
      byEmployee: '/api/stats/suppliers/created/by-employee',
    },
    suppliers_activity: {
      overview: '/api/stats/suppliers/activity',
      top: '/api/stats/suppliers/top',
    }
  };

  const { data: invoicesSummary, loading: invoicesLoading } = useFiscalYearStatsData(
    endpoints.invoices.summary, 
    selectedFiscalYear
  );
  
  const { data: invoicesByEmployee, loading: invoicesByEmployeeLoading } = useFiscalYearStatsData(
    endpoints.invoices.byEmployee,
    selectedFiscalYear
  );

  const { data: dfcOverview, loading: dfcLoading } = useFiscalYearStatsData(
    endpoints.dfc.overview,
    selectedFiscalYear
  );

  const { data: dfcAgentsRates, loading: dfcAgentsLoading } = useFiscalYearStatsData(
    endpoints.dfc.agentsRates,
    selectedFiscalYear
  );

  const { data: suppliersCreatedSummary, loading: suppliersCreatedLoading } = useFiscalYearStatsData(
    endpoints.suppliers_created.summary,
    selectedFiscalYear
  );

  const { data: suppliersCreatedByEmployee, loading: suppliersCreatedByEmployeeLoading } = useFiscalYearStatsData(
    endpoints.suppliers_created.byEmployee,
    selectedFiscalYear
  );

  const { data: suppliersActivity, loading: suppliersActivityLoading } = useFiscalYearStatsData(
    endpoints.suppliers_activity.overview,
    selectedFiscalYear
  );

  const { data: suppliersTop, loading: suppliersTopLoading } = useFiscalYearStatsData(
    endpoints.suppliers_activity.top,
    selectedFiscalYear
  );

  const metricsData = useMemo(() => {
    const totalAmount = invoicesSummary?.total_amount || 0;
    const formattedTotalAmount = totalAmount ? 
      `${Math.round(totalAmount / 1000000)}M` : '0';

    const suppliersActivityData = suppliersActivity || [];
    const totalSupplierInvoices = suppliersActivityData.reduce((sum, supplier) => sum + (supplier.total_invoices || 0), 0);
    const totalSupplierAmount = suppliersActivityData.reduce((sum, supplier) => sum + (parseFloat(supplier.total_amount) || 0), 0);
    const formattedSupplierAmount = totalSupplierAmount ? 
      `${Math.round(totalSupplierAmount / 1000000)}M` : '0';

    const baseMetrics = {
      invoices: {
        metrics: [
          { 
            title: 'Factures Total', 
            value: invoicesSummary?.total?.toLocaleString() || '0', 
            description: 'Total des factures traitées',
            icon: DocumentTextIcon,
            color: 'blue'
          },
          { 
            title: 'Montant Total', 
            value: formattedTotalAmount, 
            description: 'Valeur cumulée des factures',
            icon: CurrencyDollarIcon,
            color: 'green'
          },
          { 
            title: 'Employés Actifs', 
            value: invoicesByEmployee?.length?.toLocaleString() || '0', 
            description: 'Nombre d\'employés ayant créé des factures',
            icon: UserGroupIcon,
            color: 'purple'
          }
        ],
        overview: invoicesByEmployee?.map(emp => ({
          employe: emp.employee_name || 'N/A',
          factures: emp.total || 0,
          montant: emp.total_amount ? `${Math.round(emp.total_amount / 1000)}K` : '0'
        })) || [],
        comparisonData: invoicesByEmployee?.map(emp => ({
          name: emp.employee_name || 'N/A',
          value: emp.total || 0
        })) || []
      },
      dfc: {
        metrics: [
          { 
            title: 'Décisions Total', 
            value: dfcOverview?.total?.toLocaleString() || '0', 
            description: 'Total des décisions prises',
            icon: ClipboardDocumentCheckIcon,
            color: 'green'
          },
          { 
            title: 'Taux d\'Appro.', 
            value: dfcOverview?.approved_rate ? `${dfcOverview.approved_rate}%` : '0%', 
            description: 'Taux moyen de validation DFC',
            icon: ChartBarIcon,
            color: 'blue'
          },
          { 
            title: 'Taux de Rejet', 
            value: dfcOverview?.rejected_rate ? `${dfcOverview.rejected_rate}%` : '0%', 
            description: 'Taux moyen de rejet DFC',
            icon: ExclamationTriangleIcon,
            color: 'orange'
          }
        ],
        overview: dfcAgentsRates?.map(agent => ({
          agent: agent.agent_name || 'N/A',
          decisions: agent.total || 0,
          approbation: agent.approved_rate ? `${agent.approved_rate}%` : '0%',
          rejet: agent.rejected_rate ? `${agent.rejected_rate}%` : '0%'
        })) || [],
        comparisonData: dfcAgentsRates?.map(agent => ({
          name: agent.agent_name || 'N/A',
          value: agent.total || 0
        })) || []
      },
      suppliers_created: {
        metrics: [
          { 
            title: 'Fournisseurs Créés', 
            value: suppliersCreatedSummary?.total?.toLocaleString() || '0', 
            description: 'Total des fournisseurs créés',
            icon: UserGroupIcon,
            color: 'purple'
          },
          { 
            title: 'Employés Actifs', 
            value: suppliersCreatedByEmployee?.length?.toLocaleString() || '0', 
            description: 'Employés ayant créé des fournisseurs',
            icon: UserGroupIcon,
            color: 'blue'
          },
          { 
            title: 'Moyenne par Employé', 
            value: suppliersCreatedSummary?.total && suppliersCreatedByEmployee?.length 
              ? (suppliersCreatedSummary.total / suppliersCreatedByEmployee.length).toFixed(1) 
              : '0', 
            description: 'Nombre moyen de créations par employé',
            icon: ChartBarIcon,
            color: 'green'
          }
        ],
        overview: suppliersCreatedByEmployee?.map(emp => ({
          employe: emp.employee_name || 'N/A',
          creations: emp.total || 0,
          pourcentage: suppliersCreatedSummary?.total 
            ? `${((emp.total / suppliersCreatedSummary.total) * 100).toFixed(1)}%` 
            : '0%'
        })) || [],
        comparisonData: suppliersCreatedByEmployee?.map(emp => ({
          name: emp.employee_name || 'N/A',
          value: emp.total || 0
        })) || []
      },
      suppliers_activity: {
        metrics: [
          { 
            title: 'Fournisseurs Actifs', 
            value: suppliersActivity?.length?.toLocaleString() || '0', 
            description: 'Fournisseurs avec activité',
            icon: BuildingStorefrontIcon,
            color: 'green'
          },
          { 
            title: 'Factures Total', 
            value: totalSupplierInvoices.toLocaleString() || '0', 
            description: 'Nombre total de factures',
            icon: DocumentTextIcon,
            color: 'blue'
          },
          { 
            title: 'Montant Total', 
            value: formattedSupplierAmount, 
            description: 'Valeur totale des transactions',
            icon: ChartBarIcon,
            color: 'purple'
          }
        ],
        overview: suppliersTop?.map(supplier => {
          const activityStatus = getSupplierActivityStatus(supplier.total_invoices || 0);
          return {
            fournisseur: supplier.supplier_name || 'N/A',
            factures: supplier.total_invoices || 0,
            montant: supplier.total_amount ? `${Math.round(supplier.total_amount / 1000)}K` : '0',
            statut: (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${activityStatus.bg} ${activityStatus.color}`}>
                {activityStatus.status}
              </span>
            )
          };
        }) || [],
        comparisonData: suppliersTop?.map(supplier => ({
          name: supplier.supplier_name || 'N/A',
          value: supplier.total_invoices || 0
        })) || []
      }
    };

    return baseMetrics;
  }, [
    invoicesSummary, 
    invoicesByEmployee, 
    dfcOverview, 
    dfcAgentsRates, 
    suppliersCreatedSummary, 
    suppliersCreatedByEmployee,
    suppliersActivity,
    suppliersTop,
    selectedFiscalYear
  ]);

  const currentData = metricsData[activeTab] || {};
  const hasMetrics = currentData.metrics && currentData.metrics.length > 0;

  const isLoading = {
    invoices: invoicesLoading || invoicesByEmployeeLoading,
    dfc: dfcLoading || dfcAgentsLoading,
    suppliers_created: suppliersCreatedLoading || suppliersCreatedByEmployeeLoading,
    suppliers_activity: suppliersActivityLoading || suppliersTopLoading
  };

  const getTableTitle = () => {
    const titles = {
      invoices: 'Performance par Employé - Factures',
      dfc: 'Performance par Agent - DFC', 
      suppliers_created: 'Créations par Employé - Fournisseurs',
      suppliers_activity: 'Top Fournisseurs - Activité'
    };
    return titles[activeTab];
  };

  const getTableHeaders = () => {
    const headers = {
      invoices: ['Employé', 'Factures', 'Montant'],
      dfc: ['Agent', 'Décisions', 'Approbation', 'Rejet'],
      suppliers_created: ['Employé', 'Créations', 'Pourcentage'],
      suppliers_activity: ['Fournisseur', 'Factures', 'Montant', 'Statut']
    };
    return headers[activeTab] || [];
  };

  const getTableIcon = () => {
    const icons = {
      invoices: DocumentTextIcon,
      dfc: ClipboardDocumentCheckIcon,
      suppliers_created: UserGroupIcon,
      suppliers_activity: BuildingStorefrontIcon
    };
    return icons[activeTab] || DocumentTextIcon;
  };

  return (
    <>
      <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Navbar />

          <div className="mb-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-xl">
                <DocumentChartBarIcon className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                Tableau de Bord Statistiques Avancées
              </h1>
              <p className="text-gray-700 max-w-2xl mx-auto font-semibold text-lg leading-relaxed">
                Analyse détaillée par année fiscale - Données spécifiques
              </p>
            </div>
            
            {selectedFiscalYear && (
              <div className="flex justify-center">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg">
                  📊 Données de l'année {selectedFiscalYear}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
            <div className="xl:col-span-2 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-8 bg-blue-500 rounded-full"></div>
                    <h2 className="text-2xl font-bold text-gray-900">Indicateurs Clés de Performance</h2>
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    Année {selectedFiscalYear}
                  </div>
                </div>
                
                {hasMetrics ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {currentData.metrics.map((metric, index) => (
                      <PrimaryMetricCard
                        key={index}
                        title={metric.title}
                        value={metric.value}
                        description={metric.description}
                        icon={metric.icon}
                        color={metric.color}
                        loading={isLoading[activeTab]}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Aucune donnée disponible"
                    description={`Les indicateurs de performance pour le module "${activeTab}" seront affichés ici une fois les données disponibles.`}
                    icon={ExclamationTriangleIcon}
                  />
                )}
              </div>

              <KpiLineChart
                data={currentData.metrics}
                title={`Évolution des KPIs - ${activeTab.replace('_', ' ')}`}
                selectedFiscalYear={selectedFiscalYear}
                loading={isLoading[activeTab]}
              />

              <ComparisonChart
                data={currentData.comparisonData}
                title={`Comparaison des ${activeTab.replace('_', ' ')}`}
                selectedFiscalYear={selectedFiscalYear}
                loading={isLoading[activeTab]}
              />
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Modules Statistiques</h2>
                    <p className="text-gray-600 text-sm">Données par année fiscale</p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Année Fiscale
                  </label>
                  
                  {fiscalYearsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-12 bg-gray-200 rounded-lg"></div>
                    </div>
                  ) : fiscalYearsError ? (
                    <div className="text-center py-3 text-red-600 text-sm bg-red-50 rounded-lg border border-red-200">
                      Erreur de chargement des années
                    </div>
                  ) : fiscalYears.length > 0 ? (
                    <div className="relative">
                      <select
                        value={selectedFiscalYear}
                        onChange={(e) => setSelectedFiscalYear(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                      >
                        {fiscalYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <ChevronDownIcon className="w-4 h-4" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-yellow-600 text-sm bg-yellow-50 rounded-lg border border-yellow-200">
                      Aucune année fiscale disponible
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {[
                    { id: 'invoices', label: 'Factures', icon: DocumentTextIcon, tooltip: 'Gestion des factures' },
                    { id: 'dfc', label: 'Agents DFC', icon: ClipboardDocumentCheckIcon, tooltip: 'Validation DFC' },
                    { id: 'suppliers_created', label: 'Fournisseurs Créés', icon: UserGroupIcon, tooltip: 'Création fournisseurs' },
                    { id: 'suppliers_activity', label: 'Activité Fournisseurs', icon: BuildingStorefrontIcon, tooltip: 'Activité fournisseurs' }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                          activeTab === tab.id
                            ? 'bg-blue-50 border border-blue-200 text-blue-700 shadow-sm font-semibold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium border border-gray-200'
                        }`}
                        title={tab.tooltip}
                      >
                        <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span>{tab.label}</span>
                        {activeTab === tab.id && (
                          <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <PrimaryDataTable
                title={getTableTitle()}
                headers={getTableHeaders()}
                data={currentData.overview}
                icon={getTableIcon()}
                selectedFiscalYear={selectedFiscalYear}
                loading={isLoading[activeTab]}
                itemsPerPage={5}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Stats;