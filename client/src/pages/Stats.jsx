import { useState } from 'react';
import useTitle from '../hooks/useTitle';
import useBackground from '../hooks/useBackground';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BuildingStorefrontIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

function Stats() {
  useTitle('CMDT - Statistiques');
  useBackground('bg-stats')
  
  const [timeRange, setTimeRange] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');

  const statsData = {
    overview: [
      { label: 'Factures totales', value: '1,247', change: '+12%', icon: DocumentTextIcon, color: 'blue' },
      { label: 'Montant total', value: '4.2M €', change: '+8%', icon: CurrencyDollarIcon, color: 'green' },
      { label: 'Fournisseurs actifs', value: '89', change: '+5%', icon: BuildingStorefrontIcon, color: 'purple' },
      { label: 'Taux de paiement', value: '94%', change: '+2%', icon: ChartBarIcon, color: 'orange' }
    ],
    trends: [
      { month: 'Jan', factures: 45, montant: 120000 },
      { month: 'Fév', factures: 52, montant: 145000 },
      { month: 'Mar', factures: 48, montant: 138000 },
      { month: 'Avr', factures: 67, montant: 189000 },
      { month: 'Mai', factures: 72, montant: 210000 },
      { month: 'Juin', factures: 85, montant: 245000 }
    ]
  };

  return (
    <>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Navbar */}
          <Navbar />
          {/* En-tête */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistiques</h1>
                <p className="text-gray-900">Analyse et tendances de votre activité</p>
              </div>
              <div className="flex gap-2">
                {['day', 'week', 'month', 'year'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      timeRange === range
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {range === 'day' ? 'Jour' : 
                    range === 'week' ? 'Semaine' : 
                    range === 'month' ? 'Mois' : 'Année'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation par onglets */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', label: 'Vue d\'ensemble' },
                  { id: 'trends', label: 'Tendances' },
                  { id: 'comparison', label: 'Comparaisons' },
                  { id: 'forecast', label: 'Prévisions' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-gray-900 ${
                      activeTab === tab.id
                        ? 'border-green-300 text-green-300'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Cartes de statistiques */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsData.overview.map((stat, index) => {
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
          )}

          {/* Graphiques et visualisations */}
          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Évolution des factures</h2>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <ChartBarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Visualisation graphique des données</p>
                <p className="text-sm">(Intégration avec bibliothèque de graphiques)</p>
              </div>
            </div>
          </div>

          {/* Tableau des tendances */}
          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Détails par mois</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Mois</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nombre de factures</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Montant total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Moyenne par facture</th>
                  </tr>
                </thead>
                <tbody>
                  {statsData.trends.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{item.month}</td>
                      <td className="py-3 px-4">{item.factures}</td>
                      <td className="py-3 px-4">{item.montant.toLocaleString()} €</td>
                      <td className="py-3 px-4">{Math.round(item.montant / item.factures).toLocaleString()} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export des statistiques */}
          <div className="mt-8 bg-white/90 backdrop-blur-md rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Exporter les statistiques</h3>
                <p className="text-gray-600">Téléchargez les données au format Excel ou PDF</p>
              </div>
              <div className="flex gap-3">
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium">
                  Excel
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Stats;