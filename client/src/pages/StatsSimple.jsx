import { useState } from 'react';
import useTitle from '../hooks/useTitle';
import Navbar from '../components/Navbar';
import Header from '../components/Header';

import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

function StatsSimple() {
  useTitle('CMDT - Mes Statistiques');
  
  const [timeRange, setTimeRange] = useState('month');

  // Statistiques basiques pour les employés
  const basicStats = [
    { label: 'Mes factures ce mois', value: '23', change: '+5%', icon: DocumentTextIcon, color: 'blue' },
    { label: 'Montant total', value: '450K FCFA', change: '+12%', icon: CurrencyDollarIcon, color: 'green' },
    { label: 'Fournisseurs travaillés', value: '12', change: '+2%', icon: BuildingStorefrontIcon, color: 'purple' },
    { label: 'Taux de validation', value: '98%', change: '+1%', icon: ChartBarIcon, color: 'orange' }
  ];

  return (
    <>
      <div className="min-h-screen bg-stats">
        <Header />
        <Navbar />
        
        <div className="container mx-auto px-4 py-8">
          {/* En-tête */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Statistiques</h1>
                <p className="text-gray-900">Vue d'ensemble de mon activité</p>
              </div>
              <div className="flex gap-2">
                {['week', 'month', 'year'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      timeRange === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {range === 'week' ? 'Semaine' : 
                    range === 'month' ? 'Mois' : 'Année'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cartes de statistiques personnelles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {basicStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white/90 backdrop-blur-md rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                      <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Graphique simple */}
          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Mon activité récente</h2>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <ChartBarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Graphique de votre activité personnelle</p>
                <p className="text-sm">(Données personnalisées selon vos actions)</p>
              </div>
            </div>
          </div>

          {/* Tableau simple */}
          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Détails de mes factures</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Semaine</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Factures créées</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Montant total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">Cette semaine</td>
                    <td className="py-3 px-4">8</td>
                    <td className="py-3 px-4">125,000 FCFA</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">En cours</span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">Semaine dernière</td>
                    <td className="py-3 px-4">15</td>
                    <td className="py-3 px-4">325,000 FCFA</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Validé</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Message d'information */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Vue personnalisée</h3>
                <p className="mt-1 text-sm text-blue-700">
                  Ces statistiques montrent uniquement votre activité personnelle. 
                  Pour voir les statistiques globales de l'entreprise, contactez votre administrateur.
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
