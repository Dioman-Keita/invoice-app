import { useState } from 'react';
import useTitle from '../hooks/useTitle';
import useBackground from '../hooks/useBackground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import { 
  MagnifyingGlassIcon, 
  BuildingStorefrontIcon,
  DocumentTextIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

function Search() {
  useTitle('CMDT - Recherche avancée');
  useBackground('bg-search');
  
  const [searchType, setSearchType] = useState('factures');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    status: ''
  });

  const searchTypes = [
    { id: 'factures', label: 'Factures', icon: DocumentTextIcon },
    { id: 'fournisseurs', label: 'Fournisseurs', icon: BuildingStorefrontIcon },
    { id: 'clients', label: 'Clients', icon: UserCircleIcon }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', { searchType, searchQuery, filters });
    // Logique de recherche ici
  };

  return (
    <>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Navbar */}
          <Navbar />
          {/* En-tête */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <MagnifyingGlassIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Recherche avancée</h1>
            <p className="text-gray-900">Trouvez rapidement les informations dont vous avez besoin</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md p-6 mb-8">
            {/* Type de recherche */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Type de recherche</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {searchTypes.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setSearchType(id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                      searchType === id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    <span className="font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Formulaire de recherche */}
            <form onSubmit={handleSearch} className="space-y-6">
              {/* Champ de recherche principal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {searchType === 'factures' ? 'Rechercher une facture' : 
                  searchType === 'fournisseurs' ? 'Rechercher un fournisseur' : 
                  'Rechercher un client'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      searchType === 'factures' ? 'Numéro de facture, référence...' :
                      searchType === 'fournisseurs' ? 'Nom du fournisseur, SIRET...' :
                      'Nom du client, email...'
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>

              {/* Filtres avancés */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Filtres avancés</h3>
                
                {searchType === 'factures' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Montant min</label>
                      <input
                        type="number"
                        value={filters.amountMin}
                        onChange={(e) => setFilters({...filters, amountMin: e.target.value})}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Tous</option>
                        <option value="paid">Payée</option>
                        <option value="pending">En attente</option>
                        <option value="cancelled">Annulée</option>
                      </select>
                    </div>
                  </div>
                )}

                {searchType === 'fournisseurs' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type de fournisseur</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Tous</option>
                        <option value="local">Local</option>
                        <option value="international">International</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Note minimale</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        placeholder="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center"
                >
                  <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                  Rechercher
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({ dateFrom: '', dateTo: '', amountMin: '', amountMax: '', status: '' });
                  }}
                  className="bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  Réinitialiser
                </button>
              </div>
            </form>
          </div>

          {/* Résultats de recherche */}
          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Résultats de recherche</h2>
            <div className="text-center py-12 text-gray-500">
              <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Utilisez le formulaire ci-dessus pour effectuer une recherche</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Search;