import { useState } from 'react';
import useTitle from '../../hooks/ui/useTitle.js';
import useBackground from '../../hooks/ui/useBackground.js';
import Footer from '../../components/global/Footer.jsx';
import Navbar from '../../components/navbar/Navbar.jsx';

import { 
  DocumentArrowDownIcon, 
  TableCellsIcon, 
  DocumentTextIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

function Export() {
  useTitle('CMDT - Exportation de données');
  useBackground('bg-export');
  
  const [exportSettings, setExportSettings] = useState({
    format: 'pdf',
    dateRange: 'month',
    include: ['factures', 'fournisseurs', 'statistiques'],
    columns: ['numero', 'date', 'montant', 'fournisseur', 'statut']
  });

  const exportOptions = [
    { id: 'factures', label: 'Factures', Icon: DocumentTextIcon },
    { id: 'fournisseurs', label: 'Fournisseurs', Icon: TableCellsIcon },
    { id: 'statistiques', label: 'Statistiques', Icon: ChartBarIcon },
    { id: 'transactions', label: 'Transactions', Icon: CalendarIcon }
  ];

  const handleExport = () => {
    console.log('Exporting with settings:', exportSettings);
    // Logique d'exportation ici
  };

  return (
    <>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        {/* Navbar */}
        <Navbar />
        <div className="max-w-4xl mx-auto">
          {/* En-tête */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <DocumentArrowDownIcon className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Exportation des données</h1>
            <p className="text-gray-900">Exportez vos données dans différents formats pour analyse et archivage</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Options d'exportation</h2>
            
            {/* Format d'exportation */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Format d'export</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['pdf', 'excel', 'csv', 'json'].map((format) => (
                  <button
                    key={format}
                    onClick={() => setExportSettings({...exportSettings, format})}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      exportSettings.format === format
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium capitalize">{format}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Période */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Période</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'day', label: 'Aujourd\'hui' },
                  { value: 'week', label: 'Cette semaine' },
                  { value: 'month', label: 'Ce mois' },
                  { value: 'custom', label: 'Personnalisée' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setExportSettings({...exportSettings, dateRange: value})}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      exportSettings.dateRange === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Données à inclure */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Données à inclure</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportOptions.map(({ id, label, Icon }) => (
                  <label key={id} className="flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors duration-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportSettings.include.includes(id)}
                      onChange={(e) => {
                        const newInclude = e.target.checked
                          ? [...exportSettings.include, id]
                          : exportSettings.include.filter(item => item !== id);
                        setExportSettings({...exportSettings, include: newInclude});
                      }}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <Icon className="w-5 h-5 ml-3 mr-2 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bouton d'exportation */}
            <button
              onClick={handleExport}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium flex items-center justify-center"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              Exporter les données
            </button>
          </div>

          {/* Historique des exports */}
          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Historique des exports</h2>
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">Export_{new Date().toISOString().split('T')[0]}_{item}.pdf</p>
                    <p className="text-sm text-gray-500">Exporté le {new Date().toLocaleDateString()}</p>
                  </div>
                  <button className="text-green-600 hover:text-green-800 font-medium">
                    Télécharger
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <Footer />
    </>
  );
}

export default Export;