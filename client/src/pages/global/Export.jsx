import { useState, useEffect } from 'react';
import useTitle from '../../hooks/ui/useTitle.js';
import useBackground from '../../hooks/ui/useBackground.js';
import Footer from '../../components/global/Footer.jsx';
import Navbar from '../../components/navbar/Navbar.jsx';

import { 
  DocumentArrowDownIcon, 
  TableCellsIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline';

function Export() {
  useTitle('CMDT - Exportation de données');
  useBackground('bg-export');
  
  const [exportSettings, setExportSettings] = useState({
    format: 'txt',
    dateRange: 'month',
    customDates: {
      start: '',
      end: '',
      fiscalYear: 'toute'
    },
    include: ['factures', 'fournisseurs', 'statistiques'],
    columns: ['numero', 'date', 'montant', 'fournisseur', 'statut']
  });

  const [fiscalYears, setFiscalYears] = useState([]);
  const [exportHistory, setExportHistory] = useState([]);

  const exportOptions = [
    { id: 'factures', label: 'Factures', Icon: DocumentTextIcon },
    { id: 'fournisseurs', label: 'Fournisseurs', Icon: TableCellsIcon },
    { id: 'statistiques', label: 'Statistiques', Icon: ChartBarIcon },
    { id: 'settings', label: 'Paramètres de l\'application', Icon: CogIcon }
  ];

  const handleExport = async () => {
    try {
      // Build query parameters from settings
      const params = new URLSearchParams();
      params.set('type', exportSettings.include[0] || 'invoices'); // Use first selected
      params.set('format', exportSettings.format);
      
      // Add date filters
      if (exportSettings.dateRange === 'custom') {
        if (exportSettings.customDates.start) params.set('dateFrom', exportSettings.customDates.start);
        if (exportSettings.customDates.end) params.set('dateTo', exportSettings.customDates.end);
        if (exportSettings.customDates.fiscalYear && exportSettings.customDates.fiscalYear !== 'toute') {
          params.set('fiscal_year', exportSettings.customDates.fiscalYear);
        }
      }
      
      // Trigger download
      const response = await fetch(`/api/export/advanced?${params.toString()}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error('Erreur lors de l\'export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${exportSettings.include[0]}-${new Date().toISOString().split('T')[0]}.${exportSettings.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Refresh history
      await loadExportHistory();
    } catch (err) {
      console.error('Erreur export:', err);
      alert('Erreur lors de l\'export des données');
    }
  };

  const loadFiscalYears = async () => {
    try {
      const response = await fetch('/api/fiscal-years', {
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setFiscalYears(data.data || []);
      }
    } catch (err) {
      console.error('Erreur chargement années fiscales:', err);
    }
  };

  const loadExportHistory = async () => {
    try {
      const response = await fetch('/api/export/history', {
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setExportHistory(data.data || []);
      }
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadFiscalYears();
    loadExportHistory();
  }, []);

  const handleCustomDateChange = (field, value) => {
    setExportSettings({
      ...exportSettings,
      customDates: {
        ...exportSettings.customDates,
        [field]: value
      }
    });
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
            
            {/* Format d'exportation - CSV changé en TXT */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Format d'export</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['pdf', 'excel', 'txt', 'json'].map((format) => (
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

              {/* Contenu personnalisé qui s'affiche seulement quand "Personnalisée" est sélectionnée */}
              {exportSettings.dateRange === 'custom' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Date de début */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de début
                      </label>
                      <input
                        type="date"
                        value={exportSettings.customDates.start}
                        onChange={(e) => handleCustomDateChange('start', e.target.value)}
                        className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* Date de fin */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de fin
                      </label>
                      <input
                        type="date"
                        value={exportSettings.customDates.end}
                        onChange={(e) => handleCustomDateChange('end', e.target.value)}
                        className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* Année fiscale */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Année fiscale
                      </label>
                      <select
                        value={exportSettings.customDates.fiscalYear}
                        onChange={(e) => handleCustomDateChange('fiscalYear', e.target.value)}
                        className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="toute">Toute</option>
                        {fiscalYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Données à inclure */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Données à inclure</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportOptions.map((opt) => (
                  <label key={opt.id} className="flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors duration-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportSettings.include.includes(opt.id)}
                      onChange={(e) => {
                        const newInclude = e.target.checked
                          ? [...exportSettings.include, opt.id]
                          : exportSettings.include.filter(item => item !== opt.id);
                        setExportSettings({...exportSettings, include: newInclude});
                      }}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <opt.Icon className="w-5 h-5 ml-3 mr-2 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{opt.label}</span>
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
              {exportHistory.length > 0 ? (
                exportHistory.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">Export_{item.invoice_id}_{new Date(item.exported_at).toISOString().split('T')[0]}.{item.format.toLowerCase()}</p>
                      <p className="text-sm text-gray-500">Exporté le {new Date(item.exported_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{item.format}</span>
                      <button className="text-green-600 hover:text-green-800 font-medium">
                        Télécharger
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DocumentArrowDownIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun export trouvé</p>
                  <p className="text-sm">Vos exports apparaîtront ici</p>
                </div>
              )}
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