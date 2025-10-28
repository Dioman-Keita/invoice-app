import { useState, useEffect } from 'react';
import useTitle from '../../hooks/ui/useTitle.js';
import useBackground from '../../hooks/ui/useBackground.js';
import { useSearch } from '../../hooks/api/useSearch.js';
import Navbar from '../../components/navbar/Navbar.jsx';
import Footer from '../../components/global/Footer.jsx';
import { 
  MagnifyingGlassIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  PencilSquareIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  AdjustmentsHorizontalIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  DocumentCheckIcon,
  PaperClipIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

function Search() {
  useTitle('CMDT - Recherche avancée');
  useBackground('bg-search');
  
  const [activeTab, setActiveTab] = useState('invoices');
  const [globalSearch, setGlobalSearch] = useState('');
  
  const [filters, setFilters] = useState({
    // Filtres communs
    fiscal_year: '',
    dateFrom: '',
    dateTo: '',
    
    // Filtres factures
    num_invoice: '',
    num_cmdt: '',
    supplier_name: '',
    invoice_type: '',
    invoice_nature: '',
    dfc_status: '',
    amountMin: '',
    amountMax: '',
    
    // Filtres fournisseurs
    account_number: '',
    phone: '',
    supplier_created_from: '',
    supplier_created_to: '',

    // Filtres relationnels avancés
    supplier_with_invoices: false,
    supplier_invoice_count_min: '',
    supplier_invoice_count_max: '',
    supplier_total_amount_min: '',
    supplier_total_amount_max: '',
    invoice_with_attachments: false,
    invoice_with_dfc_decision: false,
    has_active_invoices: false
  });

  const [advancedOptions, setAdvancedOptions] = useState({
    order_by: 'create_at',
    order_direction: 'desc',
    limit: 50,
    page: 1,
    include_supplier_details: true,
    include_attachments_count: false,
    include_dfc_history: false,
    group_by_supplier: false,
    calculate_totals: false
  });

  const [fiscalYears, setFiscalYears] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showRelationalOptions, setShowRelationalOptions] = useState(false);

  // Charger les années fiscales au montage
  useEffect(() => {
    const fetchFiscalYears = async () => {
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
    fetchFiscalYears();
  }, []);

  // Réinitialiser les filtres quand on change d'onglet
  useEffect(() => {
    setGlobalSearch('');
    setFilters({
      fiscal_year: '',
      dateFrom: '',
      dateTo: '',
      num_invoice: '',
      num_cmdt: '',
      supplier_name: '',
      invoice_type: '',
      invoice_nature: '',
      dfc_status: '',
      amountMin: '',
      amountMax: '',
      account_number: '',
      phone: '',
      supplier_created_from: '',
      supplier_created_to: '',
      supplier_with_invoices: false,
      supplier_invoice_count_min: '',
      supplier_invoice_count_max: '',
      supplier_total_amount_min: '',
      supplier_total_amount_max: '',
      invoice_with_attachments: false,
      invoice_with_dfc_decision: false,
      has_active_invoices: false
    });
  }, [activeTab]);

  // Utilisation du hook unique pour chaque type de recherche
  const invoiceSearch = useSearch('/search/invoices', 'factures');
  const supplierSearch = useSearch('/search/suppliers', 'fournisseurs');
  const relationalSearch = useSearch('/search/relational', 'relationnel');

  // Prépare les filtres et options spécifiques à chaque onglet
  const buildOptionsForTab = (tab) => {
    const base = {
      order_by: advancedOptions.order_by,
      order_direction: advancedOptions.order_direction,
      limit: advancedOptions.limit
    };
    if (tab === 'invoices') {
      base.include_supplier = advancedOptions.include_supplier_details;
      base.include_attachments = advancedOptions.include_attachments_count;
      base.include_dfc = advancedOptions.include_dfc_history;
    }
    if (tab === 'relational') {
      base.group_by = advancedOptions.group_by_supplier ? 'supplier' : undefined;
      base.aggregate = advancedOptions.calculate_totals ? 'true' : undefined;
      base.include_supplier = advancedOptions.include_supplier_details;
    }
    return base;
  };

  const buildFiltersForTab = (tab) => {
    if (tab === 'invoices') {
      const {
        account_number: _acc,
        phone: _ph,
        supplier_created_from: _crF,
        supplier_created_to: _crT,
        supplier_with_invoices: _withInv,
        has_active_invoices: _hasAct,
        ...rest
      } = filters;
      // conserver tous sauf les filtres fournisseurs spécifiques
      return rest;
    }
    if (tab === 'suppliers') {
      const {
        fiscal_year: _fy,
        dateFrom: _dF,
        dateTo: _dT,
        num_invoice: _numInv,
        num_cmdt: _numCmdt,
        supplier_name: _supName,
        invoice_type: _invType,
        invoice_nature: _invNat,
        dfc_status: _dfc,
        amountMin: _min,
        amountMax: _max,
        invoice_with_attachments: _att,
        invoice_with_dfc_decision: _dfcDec,
        ...suppFilters
      } = filters;
      return suppFilters;
    }
    if (tab === 'relational') {
      return filters;
    }
    return filters;
  };

  // Gestionnaire de recherche
  const handleSearch = async (e) => {
    e.preventDefault();
    
    const options = buildOptionsForTab(activeTab);
    const filtersForTab = buildFiltersForTab(activeTab);

    if (activeTab === 'invoices') {
      await invoiceSearch.search(globalSearch, filtersForTab, options, 1, options.limit || 10);
    } else if (activeTab === 'suppliers') {
      await supplierSearch.search(globalSearch, filtersForTab, options, 1, options.limit || 10);
    } else if (activeTab === 'relational') {
      await relationalSearch.search(globalSearch, filtersForTab, options, 1, options.limit || 10);
    }
  };

  // Réinitialiser les filtres
  const handleReset = () => {
    setGlobalSearch('');
    setFilters({
      fiscal_year: '',
      dateFrom: '',
      dateTo: '',
      num_invoice: '',
      num_cmdt: '',
      supplier_name: '',
      invoice_type: '',
      invoice_nature: '',
      dfc_status: '',
      amountMin: '',
      amountMax: '',
      account_number: '',
      phone: '',
      supplier_created_from: '',
      supplier_created_to: '',
      supplier_with_invoices: false,
      supplier_invoice_count_min: '',
      supplier_invoice_count_max: '',
      supplier_total_amount_min: '',
      supplier_total_amount_max: '',
      invoice_with_attachments: false,
      invoice_with_dfc_decision: false,
      has_active_invoices: false
    });
    setAdvancedOptions({
      order_by: 'create_at',
      order_direction: 'desc',
      limit: 50,
      page: 1,
      include_supplier_details: true,
      include_attachments_count: false,
      include_dfc_history: false,
      group_by_supplier: false,
      calculate_totals: false
    });
    invoiceSearch.reset();
    supplierSearch.reset();
    relationalSearch.reset();
  };

  // Export des résultats
  const handleExport = async (format) => {
    try {
      const params = new URLSearchParams();
      
      if (globalSearch) params.append('search', globalSearch);
      
      const filtersForTab = buildFiltersForTab(activeTab);
      Object.entries(filtersForTab).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'boolean') {
            params.append(key, value.toString());
          } else {
            params.append(key, value);
          }
        }
      });
      
      const options = buildOptionsForTab(activeTab);
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      
      params.append('format', format);
      params.append('type', activeTab);

      const response = await fetch(`/api/export/advanced?${params.toString()}`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error('Erreur lors de l\'export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${activeTab}-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erreur export:', err);
      alert('Erreur lors de l\'export des données');
    }
  };

  // Navigation des pages
  const handlePageChange = async (type, newPage) => {
    const options = buildOptionsForTab(type);
    const filtersForTab = buildFiltersForTab(type);
    const limit = options.limit || 10;

    if (type === 'invoices') {
      await invoiceSearch.search(globalSearch, filtersForTab, options, newPage, limit);
    } else if (type === 'suppliers') {
      await supplierSearch.search(globalSearch, filtersForTab, options, newPage, limit);
    } else if (type === 'relational') {
      await relationalSearch.search(globalSearch, filtersForTab, options, newPage, limit);
    }
  };

  // Fonctions utilitaires
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' FCFA';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'approved': return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected': return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending': return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default: return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  // Options de tri disponibles
  const orderOptions = {
    invoices: [
      { value: 'create_at', label: 'Date de création' },
      { value: 'invoice_arr_date', label: 'Date d\'arrivée' },
      { value: 'amount', label: 'Montant' },
      { value: 'num_cmdt', label: 'Numéro CMDT' },
      { value: 'num_invoice', label: 'Numéro facture' },
      { value: 'supplier_name', label: 'Nom fournisseur' }
    ],
    suppliers: [
      { value: 'create_at', label: 'Date de création' },
      { value: 'name', label: 'Nom' },
      { value: 'account_number', label: 'Numéro de compte' }
    ],
    relational: [
      { value: 'total_amount', label: 'Montant total' },
      { value: 'invoice_count', label: 'Nombre de factures' },
      { value: 'last_invoice_date', label: 'Dernière facture' },
      { value: 'supplier_name', label: 'Nom fournisseur' },
      { value: 'avg_amount', label: 'Montant moyen' }
    ]
  };

  return (
    <>
      <div className="min-h-screen">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* En-tête avec icône */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <MagnifyingGlassIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Recherche avancée</h1>
            <p className="text-gray-900">Trouvez rapidement les informations dont vous avez besoin</p>
          </div>

          {/* Formulaire de recherche */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <form onSubmit={handleSearch}>
              {/* Type de recherche */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Type de recherche
                </label>
                <div className="flex space-x-4">
                  <button type="button" onClick={() => setActiveTab('invoices')} className={`flex items-center px-4 py-2 rounded-lg border-2 transition-colors ${activeTab === 'invoices' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <DocumentTextIcon className="w-5 h-5 mr-2" />
                    Factures
                  </button>
                  <button type="button" onClick={() => setActiveTab('suppliers')} className={`flex items-center px-4 py-2 rounded-lg border-2 transition-colors ${activeTab === 'suppliers' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <BuildingStorefrontIcon className="w-5 h-5 mr-2" />
                    Fournisseurs
                  </button>
                  <button type="button" onClick={() => setActiveTab('relational')} className={`flex items-center px-4 py-2 rounded-lg border-2 transition-colors ${activeTab === 'relational' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <LinkIcon className="w-5 h-5 mr-2" />
                    Recherche Relationnelle
                  </button>
                </div>
              </div>

              {/* Champ de recherche globale */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {activeTab === 'invoices' 
                    ? 'Recherche globale (numéro facture, CMDT, fournisseur, objet...)' 
                    : activeTab === 'suppliers'
                    ? 'Recherche globale (nom, compte, téléphone...)'
                    : 'Recherche globale (tous les champs relationnels)'
                  }
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={
                      activeTab === 'invoices'
                        ? 'Ex: INV-2025-0001, 0001, Société ABC, transport...'
                        : activeTab === 'suppliers'
                        ? 'Ex: Société XYZ, FR763000..., +33...'
                        : 'Ex: Fournisseur, montant, référence...'
                    }
                  />
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>

              {/* Champs de recherche spécifiques */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* Champs communs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du fournisseur
                  </label>
                  <input
                    type="text"
                    value={filters.supplier_name}
                    onChange={(e) => setFilters({...filters, supplier_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Société ABC"
                  />
                </div>

                {/* Champs spécifiques aux factures */}
                {activeTab === 'invoices' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro de facture
                      </label>
                      <input
                        type="text"
                        value={filters.num_invoice}
                        onChange={(e) => setFilters({...filters, num_invoice: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: INV-2025-0001"
                        maxLength={20}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro CMDT
                      </label>
                      <input
                        type="text"
                        value={filters.num_cmdt}
                        onChange={(e) => setFilters({...filters, num_cmdt: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: 0001"
                        maxLength={4}
                        pattern="[0-9]{1,4}"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Année fiscale
                      </label>
                      <select value={filters.fiscal_year} onChange={(e) => setFilters({...filters, fiscal_year: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Toutes</option>
                        {fiscalYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de facture
                      </label>
                      <select value={filters.invoice_type} onChange={(e) => setFilters({...filters, invoice_type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Tous</option>
                        <option value="Ordinaire">Ordinaire</option>
                        <option value="Transporteur">Transporteur</option>
                        <option value="Transitaire">Transitaire</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Statut DFC
                      </label>
                      <select value={filters.dfc_status} onChange={(e) => setFilters({...filters, dfc_status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Tous</option>
                        <option value="pending">En attente</option>
                        <option value="approved">Approuvé</option>
                        <option value="rejected">Rejeté</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Champs spécifiques aux fournisseurs */}
                {activeTab === 'suppliers' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro de compte
                      </label>
                      <input
                        type="text"
                        value={filters.account_number}
                        onChange={(e) => setFilters({...filters, account_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: FR763000100794..."
                        maxLength={34}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="text"
                        value={filters.phone}
                        onChange={(e) => setFilters({...filters, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: +33 1 23 45 67 89"
                        maxLength={20}
                      />
                    </div>
                  </>
                )}

                {/* Champs pour la recherche relationnelle */}
                {activeTab === 'relational' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Année fiscale
                      </label>
                      <select value={filters.fiscal_year} onChange={(e) => setFilters({...filters, fiscal_year: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Toutes</option>
                        {fiscalYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de facture
                      </label>
                      <select value={filters.invoice_type} onChange={(e) => setFilters({...filters, invoice_type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Tous</option>
                        <option value="Ordinaire">Ordinaire</option>
                        <option value="Transporteur">Transporteur</option>
                        <option value="Transitaire">Transitaire</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Statut DFC
                      </label>
                      <select value={filters.dfc_status} onChange={(e) => setFilters({...filters, dfc_status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Tous</option>
                        <option value="pending">En attente</option>
                        <option value="approved">Approuvé</option>
                        <option value="rejected">Rejeté</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Options de tri et limites */}
              <div className="border-t pt-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center">
                    <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
                    Options de tri et affichage
                  </h3>
                  <button type="button" onClick={() => setShowRelationalOptions(!showRelationalOptions)} className="flex items-center text-sm text-gray-600 hover:text-gray-900">
                    {showRelationalOptions ? 'Masquer' : 'Afficher'} les options
                    {showRelationalOptions ? <ChevronUpIcon className="w-4 h-4 ml-1" /> : <ChevronDownIcon className="w-4 h-4 ml-1" />}
                  </button>
                </div>

                {showRelationalOptions && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
                      <select value={advancedOptions.order_by} onChange={(e) => setAdvancedOptions({...advancedOptions, order_by: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        {orderOptions[activeTab]?.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ordre</label>
                      <select value={advancedOptions.order_direction} onChange={(e) => setAdvancedOptions({...advancedOptions, order_direction: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="desc">Décroissant</option>
                        <option value="asc">Croissant</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Résultats par page</label>
                      <select value={advancedOptions.limit} onChange={(e) => setAdvancedOptions({...advancedOptions, limit: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="250">250</option>
                      </select>
                    </div>

                    {activeTab === 'relational' && (
                      <div className="col-span-2 space-y-2">
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center">
                            <input type="checkbox" checked={advancedOptions.group_by_supplier} onChange={(e) => setAdvancedOptions({...advancedOptions, group_by_supplier: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-700">Grouper par fournisseur</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" checked={advancedOptions.calculate_totals} onChange={(e) => setAdvancedOptions({...advancedOptions, calculate_totals: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-700">Calculer les totaux</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" checked={advancedOptions.include_supplier_details} onChange={(e) => setAdvancedOptions({...advancedOptions, include_supplier_details: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-700">Détails fournisseurs</span>
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="col-span-2 space-y-2">
                      <div className="flex flex-wrap gap-4">
                        {activeTab === 'invoices' && (
                          <>
                            <label className="flex items-center">
                              <input type="checkbox" checked={advancedOptions.include_attachments_count} onChange={(e) => setAdvancedOptions({...advancedOptions, include_attachments_count: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                              <span className="ml-2 text-sm text-gray-700">Compteur pièces jointes</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" checked={advancedOptions.include_dfc_history} onChange={(e) => setAdvancedOptions({...advancedOptions, include_dfc_history: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                              <span className="ml-2 text-sm text-gray-700">Historique DFC</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" checked={advancedOptions.include_supplier_details} onChange={(e) => setAdvancedOptions({...advancedOptions, include_supplier_details: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                              <span className="ml-2 text-sm text-gray-700">Détails fournisseurs</span>
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Filtres avancés */}
              <div className="border-t pt-6">
                <button type="button" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 mb-4">
                  <FunnelIcon className="w-4 h-4 mr-2" />
                  Filtres avancés
                  {showAdvancedFilters ? <ChevronUpIcon className="w-4 h-4 ml-1" /> : <ChevronDownIcon className="w-4 h-4 ml-1" />}
                </button>

                {showAdvancedFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    
                    {/* Filtres pour les FACTURES */}
                    {activeTab === 'invoices' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <CalendarDaysIcon className="w-4 h-4 mr-2 text-gray-500" />
                            Date d'arrivée (du)
                          </label>
                          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <CalendarDaysIcon className="w-4 h-4 mr-2 text-gray-500" />
                            Date d'arrivée (au)
                          </label>
                          <input type="date" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <BanknotesIcon className="w-4 h-4 mr-2 text-gray-500" />
                            Montant minimum
                          </label>
                          <input type="number" value={filters.amountMin} onChange={(e) => setFilters({...filters, amountMin: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <BanknotesIcon className="w-4 h-4 mr-2 text-gray-500" />
                            Montant maximum
                          </label>
                          <input type="number" value={filters.amountMax} onChange={(e) => setFilters({...filters, amountMax: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="50000" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <DocumentCheckIcon className="w-4 h-4 mr-2 text-gray-500" />
                            Nature
                          </label>
                          <select value={filters.invoice_nature} onChange={(e) => setFilters({...filters, invoice_nature: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Toutes</option>
                            <option value="Paiement">Paiement</option>
                            <option value="Acompte">Acompte</option>
                            <option value="Avoir">Avoir</option>
                          </select>
                        </div>

                        <div className="col-span-2 space-y-3">
                          <label className="flex items-center">
                            <input type="checkbox" checked={filters.invoice_with_attachments} onChange={(e) => setFilters({...filters, invoice_with_attachments: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <PaperClipIcon className="w-4 h-4 ml-2 mr-2 text-gray-500" />
                            <span className="text-sm text-gray-700">Avec pièces jointes uniquement</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" checked={filters.invoice_with_dfc_decision} onChange={(e) => setFilters({...filters, invoice_with_dfc_decision: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <DocumentCheckIcon className="w-4 h-4 ml-2 mr-2 text-gray-500" />
                            <span className="text-sm text-gray-700">Avec décision DFC uniquement</span>
                          </label>
                        </div>
                      </>
                    )}

                    {/* Filtres pour les FOURNISSEURS */}
                    {activeTab === 'suppliers' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <CalendarDaysIcon className="w-4 h-4 mr-2 text-gray-500" />
                            Date création (du)
                          </label>
                          <input type="date" value={filters.supplier_created_from} onChange={(e) => setFilters({...filters, supplier_created_from: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <CalendarDaysIcon className="w-4 h-4 mr-2 text-gray-500" />
                            Date création (au)
                          </label>
                          <input type="date" value={filters.supplier_created_to} onChange={(e) => setFilters({...filters, supplier_created_to: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>

                        <div className="col-span-2 space-y-3">
                          <label className="flex items-center">
                            <input type="checkbox" checked={filters.supplier_with_invoices} onChange={(e) => setFilters({...filters, supplier_with_invoices: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <DocumentTextIcon className="w-4 h-4 ml-2 mr-2 text-gray-500" />
                            <span className="text-sm text-gray-700">Avec factures uniquement</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" checked={filters.has_active_invoices} onChange={(e) => setFilters({...filters, has_active_invoices: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <CheckCircleIcon className="w-4 h-4 ml-2 mr-2 text-gray-500" />
                            <span className="text-sm text-gray-700">Avec factures actives</span>
                          </label>
                        </div>
                      </>
                    )}

                    {/* Filtres pour la RECHERCHE RELATIONNELLE */}
                    {activeTab === 'relational' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <CalendarDaysIcon className="w-4 h-4 mr-2 text-gray-500" />
                            Date d'arrivée (du)
                          </label>
                          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <CalendarDaysIcon className="w-4 h-4 mr-2 text-gray-500" />
                            Date d'arrivée (au)
                          </label>
                          <input type="date" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <BanknotesIcon className="w-4 h-4 mr-2 text-gray-500" />
                            Montant minimum
                          </label>
                          <input type="number" value={filters.amountMin} onChange={(e) => setFilters({...filters, amountMin: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <BanknotesIcon className="w-4 h-4 mr-2 text-gray-500" />
                            Montant maximum
                          </label>
                          <input type="number" value={filters.amountMax} onChange={(e) => setFilters({...filters, amountMax: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="50000" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <DocumentTextIcon className="w-4 h-4 mr-2 text-gray-500" />
                            Nb min factures
                          </label>
                          <input type="number" value={filters.supplier_invoice_count_min} onChange={(e) => setFilters({...filters, supplier_invoice_count_min: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" min="0" max="9999" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <DocumentTextIcon className="w-4 h-4 mr-2 text-gray-500" />
                            Nb max factures
                          </label>
                          <input type="number" value={filters.supplier_invoice_count_max} onChange={(e) => setFilters({...filters, supplier_invoice_count_max: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="100" min="0" max="9999" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <BanknotesIcon className="w-4 h-4 mr-2 text-gray-500" />
                            Montant total min
                          </label>
                          <input type="number" value={filters.supplier_total_amount_min} onChange={(e) => setFilters({...filters, supplier_total_amount_min: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <BanknotesIcon className="w-4 h-4 mr-2 text-gray-500" />
                            Montant total max
                          </label>
                          <input type="number" value={filters.supplier_total_amount_max} onChange={(e) => setFilters({...filters, supplier_total_amount_max: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="1000000" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <DocumentCheckIcon className="w-4 h-4 mr-2 text-gray-500" />
                            Nature
                          </label>
                          <select value={filters.invoice_nature} onChange={(e) => setFilters({...filters, invoice_nature: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Toutes</option>
                            <option value="Paiement">Paiement</option>
                            <option value="Acompte">Acompte</option>
                            <option value="Avoir">Avoir</option>
                          </select>
                        </div>

                        <div className="col-span-3 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <label className="flex items-center">
                              <input type="checkbox" checked={filters.supplier_with_invoices} onChange={(e) => setFilters({...filters, supplier_with_invoices: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                              <span className="ml-2 text-sm text-gray-700">Fournisseurs avec factures</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" checked={filters.invoice_with_attachments} onChange={(e) => setFilters({...filters, invoice_with_attachments: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                              <span className="ml-2 text-sm text-gray-700">Avec pièces jointes</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" checked={filters.invoice_with_dfc_decision} onChange={(e) => setFilters({...filters, invoice_with_dfc_decision: e.target.checked})} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                              <span className="ml-2 text-sm text-gray-700">Avec décision DFC</span>
                            </label>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-wrap gap-3 pt-6 border-t">
                <button type="submit" disabled={invoiceSearch.loading || supplierSearch.loading || relationalSearch.loading} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                  {invoiceSearch.loading || supplierSearch.loading || relationalSearch.loading ? 'Recherche...' : 'Rechercher'}
                </button>

                <button type="button" onClick={handleReset} className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Réinitialiser
                </button>

                <div className="flex-1"></div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => handleExport('pdf')} className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm">
                    <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                    PDF
                  </button>
                  <button type="button" onClick={() => handleExport('xlsx')} className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm">
                    <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                    Excel
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Section des résultats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Résultats de recherche
                  {activeTab === 'relational' && <span className="ml-2 text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Mode Relationnel</span>}
                </h2>
                <div className="text-sm text-gray-600">
                  {activeTab === 'invoices' ? `${invoiceSearch.meta?.total || 0} facture(s) trouvée(s)` : activeTab === 'suppliers' ? `${supplierSearch.meta?.total || 0} fournisseur(s) trouvé(s)` : `${relationalSearch.meta?.total || 0} résultat(s) relationnel(s)`}
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Affichage conditionnel des résultats */}
              {activeTab === 'invoices' && (
                <>
                  {invoiceSearch.loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Chargement des factures...</p>
                    </div>
                  ) : invoiceSearch.error ? (
                    <div className="text-center py-12 text-red-600">
                      <p>Erreur: {invoiceSearch.error}</p>
                    </div>
                  ) : invoiceSearch.data?.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucune facture trouvée</p>
                      <p className="text-sm">Utilisez le formulaire pour effectuer une recherche</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date arrivée</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut DFC</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {invoiceSearch.data.map((invoice) => (
                              <tr key={invoice.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{invoice.num_cmdt}</div>
                                    <div className="text-sm text-gray-500">{invoice.num_invoice}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{invoice.supplier_name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(invoice.invoice_arr_date)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatAmount(invoice.amount)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.invoice_type}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={getStatusBadge(invoice.dfc_status)}>{getStatusText(invoice.dfc_status)}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button onClick={() => {}} className="text-blue-600 hover:text-blue-900"><EyeIcon className="w-4 h-4" /></button>
                                    <button onClick={() => {}} className="text-gray-600 hover:text-gray-900"><PencilSquareIcon className="w-4 h-4" /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {(invoiceSearch.meta?.total || 0) > (invoiceSearch.meta?.limit || 10) && (
                        <div className="flex items-center justify-between mt-6">
                          <div className="text-sm text-gray-700">Page {invoiceSearch.meta?.page || 1} sur {Math.ceil((invoiceSearch.meta?.total || 0) / (invoiceSearch.meta?.limit || 10))}</div>
                          <div className="flex space-x-2">
                            <button onClick={() => handlePageChange('invoices', (invoiceSearch.meta?.page || 1) - 1)} disabled={(invoiceSearch.meta?.page || 1) === 1} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Précédent</button>
                            <button onClick={() => handlePageChange('invoices', (invoiceSearch.meta?.page || 1) + 1)} disabled={(invoiceSearch.meta?.page || 1) >= Math.ceil((invoiceSearch.meta?.total || 0) / (invoiceSearch.meta?.limit || 10))} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Suivant</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {activeTab === 'suppliers' && (
                <>
                  {supplierSearch.loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Chargement des fournisseurs...</p>
                    </div>
                  ) : supplierSearch.error ? (
                    <div className="text-center py-12 text-red-600">
                      <p>Erreur: {supplierSearch.error}</p>
                    </div>
                  ) : supplierSearch.data?.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <BuildingStorefrontIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucun fournisseur trouvé</p>
                      <p className="text-sm">Utilisez le formulaire pour effectuer une recherche</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro de compte</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date création</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {supplierSearch.data.map((supplier) => (
                              <tr key={supplier.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 font-mono">{supplier.account_number}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(supplier.create_at)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button onClick={() => {}} className="text-blue-600 hover:text-blue-900"><EyeIcon className="w-4 h-4" /></button>
                                    <button onClick={() => {}} className="text-gray-600 hover:text-gray-900"><PencilSquareIcon className="w-4 h-4" /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {(supplierSearch.meta?.total || 0) > (supplierSearch.meta?.limit || 10) && (
                        <div className="flex items-center justify-between mt-6">
                          <div className="text-sm text-gray-700">Page {supplierSearch.meta?.page || 1} sur {Math.ceil((supplierSearch.meta?.total || 0) / (supplierSearch.meta?.limit || 10))}</div>
                          <div className="flex space-x-2">
                            <button onClick={() => handlePageChange('suppliers', (supplierSearch.meta?.page || 1) - 1)} disabled={(supplierSearch.meta?.page || 1) === 1} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Précédent</button>
                            <button onClick={() => handlePageChange('suppliers', (supplierSearch.meta?.page || 1) + 1)} disabled={(supplierSearch.meta?.page || 1) >= Math.ceil((supplierSearch.meta?.total || 0) / (supplierSearch.meta?.limit || 10))} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Suivant</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {activeTab === 'relational' && (
                <>
                  {relationalSearch.loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Analyse relationnelle en cours...</p>
                    </div>
                  ) : relationalSearch.error ? (
                    <div className="text-center py-12 text-red-600">
                      <p>Erreur: {relationalSearch.error}</p>
                    </div>
                  ) : relationalSearch.data?.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <LinkIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucun résultat relationnel trouvé</p>
                      <p className="text-sm">Utilisez le formulaire pour effectuer une recherche avancée</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {advancedOptions.group_by_supplier ? (
                                <>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre de factures</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant total</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant moyen</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière facture</th>
                                </>
                              ) : (
                                <>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facture</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut DFC</th>
                                </>
                              )}
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {relationalSearch.data.map((result, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                {advancedOptions.group_by_supplier ? (
                                  <>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">{result.supplier_name}</div>
                                      <div className="text-sm text-gray-500">{result.supplier_account}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{result.invoice_count}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatAmount(result.total_amount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatAmount(result.avg_amount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.last_invoice_date ? formatDate(result.last_invoice_date) : 'N/A'}</td>
                                  </>
                                ) : (
                                  <>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">{result.supplier_name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">{result.num_cmdt}</div>
                                      <div className="text-sm text-gray-500">{result.num_invoice}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatAmount(result.amount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(result.invoice_date)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={getStatusBadge(result.dfc_status)}>{getStatusText(result.dfc_status)}</span>
                                    </td>
                                  </>
                                )}
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button onClick={() => {}} className="text-blue-600 hover:text-blue-900"><EyeIcon className="w-4 h-4" /></button>
                                    {!advancedOptions.group_by_supplier && (
                                      <button onClick={() => {}} className="text-gray-600 hover:text-gray-900"><PencilSquareIcon className="w-4 h-4" /></button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {(relationalSearch.meta?.total || 0) > (relationalSearch.meta?.limit || 10) && (
                        <div className="flex items-center justify-between mt-6">
                          <div className="text-sm text-gray-700">Page {relationalSearch.meta?.page || 1} sur {Math.ceil((relationalSearch.meta?.total || 0) / (relationalSearch.meta?.limit || 10))}</div>
                          <div className="flex space-x-2">
                            <button onClick={() => handlePageChange('relational', (relationalSearch.meta?.page || 1) - 1)} disabled={(relationalSearch.meta?.page || 1) === 1} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Précédent</button>
                            <button onClick={() => handlePageChange('relational', (relationalSearch.meta?.page || 1) + 1)} disabled={(relationalSearch.meta?.page || 1) >= Math.ceil((relationalSearch.meta?.total || 0) / (relationalSearch.meta?.limit || 10))} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Suivant</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Search;