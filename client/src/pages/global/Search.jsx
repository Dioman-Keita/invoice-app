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
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  DocumentCheckIcon,
  PaperClipIcon,
  LinkIcon,
  DocumentMagnifyingGlassIcon,
  BuildingStorefrontIcon as BuildingIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import Header from '../../components/global/Header.jsx';

function Search() {
  useTitle('CMDT - Recherche avancée');
  useBackground('bg-search');
  
  const [activeTab, setActiveTab] = useState('invoices');
  
  const [filters, setFilters] = useState({
    fiscal_year: '',
    dateFrom: '',
    dateTo: '',
    num_invoice: '',
    num_cmdt: '',
    supplier_name: '',
    invoice_type: '',
    invoice_nature: '',
    dfc_status: '',
    status: '',
    amountMin: '',
    amountMax: '',
    account_number: '',
    phone: '',
    supplier_created_from: '',
    supplier_created_to: '',
    supplier_invoice_count_min: '',
    supplier_invoice_count_max: '',
    supplier_total_amount_min: '',
    supplier_total_amount_max: '',
    supplier_avg_amount_min: '',  // AJOUT : Montant moyen min
    supplier_avg_amount_max: ''   // AJOUT : Montant moyen max
  });

  const [advancedOptions, setAdvancedOptions] = useState({
    order_by: '',
    order_direction: 'desc',
    group_by_supplier: true  // MODIFICATION : Activé par défaut pour la recherche relationnelle
  });

  const [fiscalYears, setFiscalYears] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showRelationalOptions, setShowRelationalOptions] = useState(false);
  
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedGroupedResult, setSelectedGroupedResult] = useState(null);  // AJOUT : Pour l'overview des résultats groupés
  const [showInvoiceOverview, setShowInvoiceOverview] = useState(false);
  const [showSupplierOverview, setShowSupplierOverview] = useState(false);
  const [showGroupedOverview, setShowGroupedOverview] = useState(false);  // AJOUT : Pour l'overview des résultats groupés
  
  const [filtersModified, setFiltersModified] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(10);
  
  const [invoiceAttachments, setInvoiceAttachments] = useState({});
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState({});
  
  const invoiceSearch = useSearch('/search/invoices', 'factures');
  const supplierSearch = useSearch('/search/suppliers', 'fournisseurs');
  const relationalSearch = useSearch('/search/relational', 'relationnel');

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

  useEffect(() => {
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
      status: '',
      amountMin: '',
      amountMax: '',
      account_number: '',
      phone: '',
      supplier_created_from: '',
      supplier_created_to: '',
      supplier_invoice_count_min: '',
      supplier_invoice_count_max: '',
      supplier_total_amount_min: '',
      supplier_total_amount_max: '',
      supplier_avg_amount_min: '',  // AJOUT
      supplier_avg_amount_max: ''   // AJOUT
    });
    // MODIFICATION : Réinitialiser avec group_by_supplier activé pour relational, désactivé pour les autres
    setAdvancedOptions({
      order_by: '',
      order_direction: 'desc',
      group_by_supplier: activeTab === 'relational'  // Activé uniquement pour relational
    });
    setFiltersModified(false);
    setCurrentPage(1);
    setCurrentLimit(10);
    invoiceSearch.reset();
    supplierSearch.reset();
    relationalSearch.reset();
  }, [activeTab]);

  useEffect(() => {
    const hasModifications = 
      Object.values(filters).some(value => 
        value !== '' && value !== null && value !== undefined
      ) ||
      (advancedOptions.order_by !== '' && advancedOptions.order_by !== null);
    
    setFiltersModified(hasModifications);
  }, [filters, advancedOptions]);

  const buildOptionsForTab = (tab) => {
    const base = {};
    
    if (advancedOptions.order_by) {
      base.order_by = advancedOptions.order_by;
      base.order_direction = advancedOptions.order_direction || 'desc';
    }
    
    if (tab === 'invoices') {
      base.include_supplier = true;
      base.include_attachments = true;
      base.include_dfc = true;
      base.include_supplier_details = true;
    } else if (tab === 'suppliers') {
      base.include_supplier_details = true;
    } else if (tab === 'relational') {
      // ✅ MODIFICATION : Toujours grouper par fournisseur pour la recherche relationnelle
      base.group_by = 'supplier';
      base.aggregate = 'true';
      base.include_supplier = true;
      base.include_supplier_details = true;
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
        supplier_invoice_count_min: _countMin,
        supplier_invoice_count_max: _countMax,
        supplier_total_amount_min: _totalMin,
        supplier_total_amount_max: _totalMax,
        ...rest
      } = filters;
      
      return {
        ...rest,
        invoice_with_attachments: true,
        invoice_with_dfc_decision: true
      };
    }
    if (tab === 'suppliers') {
      const {
        fiscal_year: _fy,
        dateFrom: _dF,
        dateTo: _dT,
        num_invoice: _numInv,
        num_cmdt: _numCmdt,
        invoice_type: _invType,
        invoice_nature: _invNat,
        dfc_status: _dfc,
        amountMin: _min,
        amountMax: _max,
        supplier_invoice_count_min: _countMin,
        supplier_invoice_count_max: _countMax,
        supplier_total_amount_min: _totalMin,
        supplier_total_amount_max: _totalMax,
        ...suppFilters
      } = filters;
      
      // ✅ CORRECTION : Ne pas forcer supplier_with_invoices et has_active_invoices
      // Ces filtres doivent être optionnels et seulement appliqués si l'utilisateur les spécifie
      return suppFilters;
    }
    if (tab === 'relational') {
      return {
        ...filters,
        supplier_with_invoices: true,
        invoice_with_attachments: true,
        invoice_with_dfc_decision: true,
        has_active_invoices: true
      };
    }
    return filters;
  };

  const validateForm = () => {
    if (!filtersModified) {
      alert('Veuillez spécifier au moins un critère de recherche');
      return false;
    }

    if (filters.dateFrom && filters.dateTo) {
      const fromDate = new Date(filters.dateFrom);
      const toDate = new Date(filters.dateTo);
      if (fromDate > toDate) {
        alert('La date "Du" ne peut pas être après la date "Au"');
        return false;
      }
    }

    if (filters.amountMin && filters.amountMax) {
      const min = parseFloat(filters.amountMin);
      const max = parseFloat(filters.amountMax);
      if (min > max) {
        alert('Le montant minimum ne peut pas être supérieur au montant maximum');
        return false;
      }
    }

    if (filters.supplier_invoice_count_min && filters.supplier_invoice_count_max) {
      const min = parseInt(filters.supplier_invoice_count_min);
      const max = parseInt(filters.supplier_invoice_count_max);
      if (min > max) {
        alert('Le nombre minimum de factures ne peut pas être supérieur au nombre maximum');
        return false;
      }
    }

    return true;
  };

  const handleSearch = async (page = currentPage, limit = currentLimit) => {
    if (!validateForm()) {
      return;
    }

    const options = buildOptionsForTab(activeTab);
    const filtersForTab = buildFiltersForTab(activeTab);

    const cleanFilters = Object.fromEntries(
      Object.entries(filtersForTab).filter(([_, value]) => 
        value !== '' && value !== null && value !== undefined && value !== false
      )
    );

    const cleanOptions = Object.fromEntries(
      Object.entries(options).filter(([_, value]) => 
        value !== '' && value !== null && value !== undefined
      )
    );

    try {
      if (activeTab === 'invoices') {
        await invoiceSearch.search('', cleanFilters, cleanOptions, page, limit);
      } else if (activeTab === 'suppliers') {
        await supplierSearch.search('', cleanFilters, cleanOptions, page, limit);
      } else if (activeTab === 'relational') {
        await relationalSearch.search('', cleanFilters, cleanOptions, page, limit);
      }
      
      setCurrentPage(page);
      setCurrentLimit(limit);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      alert('Une erreur est survenue lors de la recherche');
    }
  };

  const handleReset = () => {
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
      supplier_invoice_count_min: '',
      supplier_invoice_count_max: '',
      supplier_total_amount_min: '',
      supplier_total_amount_max: '',
      supplier_avg_amount_min: '',  // ✅ AJOUT
      supplier_avg_amount_max: ''   // ✅ AJOUT
    });
    // ✅ MODIFICATION : Réinitialiser avec group_by_supplier selon l'onglet actif
    setAdvancedOptions({
      order_by: '',
      order_direction: 'desc',
      group_by_supplier: activeTab === 'relational'  // Activé uniquement pour relational
    });
    
    invoiceSearch.reset();
    supplierSearch.reset();
    relationalSearch.reset();
    setFiltersModified(false);
    setCurrentPage(1);
    setCurrentLimit(10);
  };

  const handleShowSupplierOverview = (supplier) => {
    setSelectedSupplier(supplier);
    setShowSupplierOverview(true);
    setShowInvoiceOverview(false);
    setShowGroupedOverview(false);  // ✅ AJOUT
  };

  // ✅ AJOUT : Handler pour l'overview des résultats groupés
  const handleShowGroupedOverview = (groupedResult) => {
    setSelectedGroupedResult(groupedResult);
    setShowGroupedOverview(true);
    setShowInvoiceOverview(false);
    setShowSupplierOverview(false);
  };

  const handleCloseOverview = (e) => {
    // Prevent event propagation to avoid triggering other handlers
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setShowInvoiceOverview(false);
    setShowSupplierOverview(false);
    setShowGroupedOverview(false);
    setSelectedInvoice(null);
    setSelectedSupplier(null);
    setSelectedGroupedResult(null);
  };

  const handleExport = async (format, data = null) => {
    // Set the appropriate loading state based on format
    if (format === 'pdf') {
      setIsExportingPdf(true);
    } else if (format === 'xlsx') {
      setIsExportingExcel(true);
    }
    try {
      // Map active tab to API type
      const typeMap = { invoices: 'invoice', suppliers: 'supplier', relational: 'relational' };
      const type = typeMap[activeTab] || 'invoice';
      const isOverview = !!data && (showInvoiceOverview || showSupplierOverview || showGroupedOverview);
      const variant = isOverview ? 'overview' : 'list';

      // Build search payload exactly like QueryBuilder inputs
      const filtersForTab = buildFiltersForTab(activeTab);
      const options = buildOptionsForTab(activeTab);
      const cleanFilters = Object.fromEntries(
        Object.entries(filtersForTab).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );
      const cleanOptions = Object.fromEntries(
        Object.entries(options).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );
      const searchPayload = { ...cleanFilters, ...cleanOptions };

      // For overview, pass the specific identifier expected by the backend
      if (isOverview) {
        if (showInvoiceOverview && (selectedInvoice || data)) {
          searchPayload.invoice_id = data?.id || selectedInvoice?.id;
        } else if (showSupplierOverview && (selectedSupplier || data)) {
          searchPayload.supplier_id = data?.id || selectedSupplier?.id;
        } else if (showGroupedOverview && (selectedGroupedResult || data)) {
          searchPayload.supplier_id = data?.supplier_id || data?.id || selectedGroupedResult?.supplier_id || selectedGroupedResult?.id;
        }
      } else {
        // For list exports, keep a safe limit hint as before
        const limitForFormat = String(format).toLowerCase() === 'pdf' ? 200 : 1000;
        if (!searchPayload.limit) searchPayload.limit = limitForFormat;
      }

      const lowerFmt = String(format).toLowerCase();
      const acceptByFormat = {
        pdf: 'application/pdf',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        odt: 'application/vnd.oasis.opendocument.text'
      };
      const accept = acceptByFormat[lowerFmt] || '*/*';

      const response = await fetch('/api/export', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: accept,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, variant, format: lowerFmt, search: searchPayload })
      });

      if (!response.ok) throw new Error('Erreur lors de l\'export');

      // Forcer le type MIME pour éviter les mauvaises associations (WPS, etc.)
      const arrayBuf = await response.arrayBuffer();
      const blob = new Blob([arrayBuf], { type: accept });
      const urlObj = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObj;
      
      // Générer le nom de fichier selon le contexte
      if (data) {
        if (showInvoiceOverview && selectedInvoice) {
          a.download = `facture-${data.num_cmdt || data.id}-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
        } else if (showSupplierOverview && selectedSupplier) {
          a.download = `fournisseur-${data.id}-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
        } else if (showGroupedOverview && selectedGroupedResult) {
          a.download = `statistiques-fournisseur-${data.supplier_id || data.id}-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
        } else {
          const prefix = activeTab === 'invoices' ? 'facture' : 'fournisseur';
          a.download = `${prefix}-${data.id}-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
        }
      } else {
        a.download = `export-${activeTab}-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
      }
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(urlObj);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erreur export:', err);
      alert(err?.message || 'Erreur lors de l\'export des données');
    } finally {
      // Reset the appropriate loading state
      if (format === 'pdf') {
        setIsExportingPdf(false);
      } else if (format === 'xlsx') {
        setIsExportingExcel(false);
      }
    }
  };

  const handlePageChange = async (page) => {
    await handleSearch(page, currentLimit);
  };

  const handleLimitChange = async (limit) => {
    await handleSearch(1, limit);
  };

  const formatAmount = (amount) => {
    if (!amount) return '0 FCFA';
    try {
      const num = typeof amount === 'string' ? parseFloat(amount.replace(/\s/g, '')) : Number(amount);
      if (isNaN(num)) return 'Montant invalide';
      
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(num) + ' FCFA';
    } catch {
      return 'Montant invalide';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifié';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Non spécifié';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
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
      default: return status || 'Non traité';
    }
  };

  const Pagination = ({ meta, onPageChange, onLimitChange }) => {
    const totalPages = Math.ceil((meta?.total || 0) / (meta?.limit || 10));
    const currentPage = meta?.page || 1;
    const currentLimit = meta?.limit || 10;
    
    if (totalPages <= 1 && currentLimit === 10) return null;

    return (
      <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-700">
            Affichage de <span className="font-medium">{(currentPage - 1) * currentLimit + 1}</span> à{' '}
            <span className="font-medium">{Math.min(currentPage * currentLimit, meta?.total || 0)}</span> sur{' '}
            <span className="font-medium">{meta?.total || 0}</span> résultats
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">
              Résultats par page:
            </label>
            <select
              value={currentLimit}
              onChange={(e) => onLimitChange(parseInt(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => onPageChange(pageNumber)}
                    className={`min-w-[2rem] px-2 py-1 text-sm rounded border transition-colors ${
                      currentPage === pageNumber
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const fetchInvoiceAttachments = async (invoiceId) => {
    if (invoiceAttachments[invoiceId]) {
      return invoiceAttachments[invoiceId];
    }

    if (loadingAttachments[invoiceId]) {
      return null;
    }

    setLoadingAttachments(prev => ({ ...prev, [invoiceId]: true }));

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/attachments`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        const documents = data.data?.documents || [];
        setInvoiceAttachments(prev => ({ ...prev, [invoiceId]: documents }));
        return documents;
      }
      return [];
    } catch (error) {
      console.error('Erreur lors du chargement des attachments:', error);
      return [];
    } finally {
      setLoadingAttachments(prev => {
        const newState = { ...prev };
        delete newState[invoiceId];
        return newState;
      });
    }
  };

  const handleShowInvoiceOverview = async (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceOverview(true);
    setShowSupplierOverview(false);
    
    if (invoice.id) {
      await fetchInvoiceAttachments(invoice.id);
    }
  };

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
        <Header />
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <MagnifyingGlassIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Recherche avancée</h1>
            <p className="text-gray-900">Trouvez rapidement les informations dont vous avez besoin</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
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

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FunnelIcon className="w-5 h-5 mr-2 text-gray-600" />
                  Filtres avancés
                  {!filtersModified && (
                    <span className="ml-3 text-sm text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                      Aucun critère spécifié
                    </span>
                  )}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
                          placeholder="Ex: 0001, 0399348, 0399349, 0399350, etc."
                          maxLength={50}
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Facture annulée
                        </label>
                        <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option value="">Toutes</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                        </select>
                      </div>
                    </>
                  )}

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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date création (du)
                        </label>
                        <input
                          type="date"
                          value={filters.supplier_created_from}
                          onChange={(e) => setFilters({...filters, supplier_created_from: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date création (au)
                        </label>
                        <input
                          type="date"
                          value={filters.supplier_created_to}
                          onChange={(e) => setFilters({...filters, supplier_created_to: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}

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
                    </>
                  )}
                </div>

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
                        <select value={advancedOptions.order_by || ''} onChange={(e) => setAdvancedOptions({...advancedOptions, order_by: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option value="">Aucun tri</option>
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
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <button type="button" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 mb-4">
                    <FunnelIcon className="w-4 h-4 mr-2" />
                    Filtres supplémentaires
                    {showAdvancedFilters ? <ChevronUpIcon className="w-4 h-4 ml-1" /> : <ChevronDownIcon className="w-4 h-4 ml-1" />}
                  </button>

                  {showAdvancedFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                      {activeTab === 'suppliers' ? (
                        <div className="col-span-full text-center py-8 text-gray-500">
                          <p className="text-sm">Aucun filtre n'est disponible</p>
                        </div>
                      ) : (
                        <>
                      {(activeTab === 'invoices' || activeTab === 'relational') && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <CalendarDaysIcon className="w-4 h-4 mr-2 text-gray-500" />
                              Date d'arrivée (du)
                            </label>
                            <input 
                              type="date" 
                              value={filters.dateFrom} 
                              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} 
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <CalendarDaysIcon className="w-4 h-4 mr-2 text-gray-500" />
                              Date d'arrivée (au)
                            </label>
                            <input 
                              type="date" 
                              value={filters.dateTo} 
                              onChange={(e) => setFilters({...filters, dateTo: e.target.value})} 
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                            />
                          </div>
                        </>
                      )}

                      {activeTab === 'invoices' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <BanknotesIcon className="w-4 h-4 mr-2 text-gray-500" />
                              Montant minimum
                            </label>
                            <input type="number" value={filters.amountMin} onChange={(e) => setFilters({...filters, amountMin: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" min="0" />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <BanknotesIcon className="w-4 h-4 mr-2 text-gray-500" />
                              Montant maximum
                            </label>
                            <input type="number" value={filters.amountMax} onChange={(e) => setFilters({...filters, amountMax: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="50000" min="0" />
                          </div>
                        </>
                      )}

                      {(activeTab === 'invoices' || activeTab === 'relational') && (
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
                      )}

                      {activeTab === 'relational' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <BanknotesIcon className="w-4 h-4 mr-2 text-gray-500" />
                              Montant total min
                            </label>
                            <input type="number" value={filters.supplier_total_amount_min} onChange={(e) => setFilters({...filters, supplier_total_amount_min: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" min="0" />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <BanknotesIcon className="w-4 h-4 mr-2 text-gray-500" />
                              Montant total max
                            </label>
                            <input type="number" value={filters.supplier_total_amount_max} onChange={(e) => setFilters({...filters, supplier_total_amount_max: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="1000000" min="0" />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <BanknotesIcon className="w-4 h-4 mr-2 text-gray-500" />
                              Montant moyen min
                            </label>
                            <input type="number" value={filters.supplier_avg_amount_min} onChange={(e) => setFilters({...filters, supplier_avg_amount_min: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" min="0" />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <BanknotesIcon className="w-4 h-4 mr-2 text-gray-500" />
                              Montant moyen max
                            </label>
                            <input type="number" value={filters.supplier_avg_amount_max} onChange={(e) => setFilters({...filters, supplier_avg_amount_max: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="50000" min="0" />
                          </div>
                        </>
                      )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-6 border-t">
                <button 
                  type="submit" 
                  disabled={!filtersModified || invoiceSearch.loading || supplierSearch.loading || relationalSearch.loading} 
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                  {invoiceSearch.loading || supplierSearch.loading || relationalSearch.loading ? 'Recherche...' : 'Recherche Avancée'}
                </button>

                <button type="button" onClick={handleReset} className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Réinitialiser
                </button>

                <div className="flex-1"></div>

                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => handleExport('pdf')} 
                    disabled={isExportingPdf || isExportingExcel || (!invoiceSearch.data?.length && !supplierSearch.data?.length && !relationalSearch.data?.length)}
                    className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExportingPdf ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Export...
                      </>
                    ) : (
                      <>
                        <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                        PDF
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleExport('xlsx')} 
                    disabled={isExportingPdf || isExportingExcel || (!invoiceSearch.data?.length && !supplierSearch.data?.length && !relationalSearch.data?.length)}
                    className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExportingExcel ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Export...
                      </>
                    ) : (
                      <>
                        <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                        Excel
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

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
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facture annulée</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pièces jointes</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {invoiceSearch.data.map((invoice) => (
                              <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.status === 'Oui' ? 'Oui' : (invoice.status === 'Non' ? 'Non' : (invoice.status || 'Non spécifié'))}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {invoice.attachments_count !== undefined && invoice.attachments_count !== null ? (
                                    <div className="flex items-center space-x-1">
                                      <PaperClipIcon className="w-4 h-4 text-gray-400" />
                                      <span>{invoice.attachments_count}</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button 
                                      onClick={() => handleShowInvoiceOverview(invoice)} 
                                      className="text-blue-600 hover:text-blue-900 transition-colors"
                                      title="Voir les détails"
                                    >
                                      <EyeIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <Pagination 
                        meta={invoiceSearch.meta} 
                        onPageChange={(page) => handlePageChange(page)}
                        onLimitChange={(limit) => handleLimitChange(limit)}
                      />
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
                              <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
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
                                    <button 
                                      onClick={() => handleShowSupplierOverview(supplier)} 
                                      className="text-blue-600 hover:text-blue-900 transition-colors"
                                      title="Voir les détails"
                                    >
                                      <EyeIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <Pagination 
                        meta={supplierSearch.meta} 
                        onPageChange={(page) => handlePageChange(page)}
                        onLimitChange={(limit) => handleLimitChange(limit)}
                      />
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
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre de factures</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant total</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant moyen</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière facture</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {relationalSearch.data.map((result, index) => (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    {/* ✅ MODIFICATION : Toujours utiliser l'overview groupé pour la recherche relationnelle */}
                                      <button 
                                      onClick={() => handleShowGroupedOverview(result)} 
                                        className="text-blue-600 hover:text-blue-900 transition-colors"
                                      title="Voir les statistiques du fournisseur"
                                      >
                                        <EyeIcon className="w-4 h-4" />
                                      </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <Pagination 
                        meta={relationalSearch.meta} 
                        onPageChange={(page) => handlePageChange(page)}
                        onLimitChange={(limit) => handleLimitChange(limit)}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {showInvoiceOverview && selectedInvoice && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                      <DocumentMagnifyingGlassIcon className="w-6 h-6 mr-2 text-blue-600" />
                      Détails de la facture
                    </h2>
                    <button onClick={handleCloseOverview} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations principales</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Référence:</span>
                            <span className="font-medium">{selectedInvoice.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Numéro CMDT:</span>
                            <span className="font-medium">{selectedInvoice.num_cmdt}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Numéro facture:</span>
                            <span className="font-medium">{selectedInvoice.num_invoice}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Montant:</span>
                            <span className="font-bold text-gray-900">{formatAmount(selectedInvoice.amount)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Dates</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date de facture:</span>
                            <span className="font-medium">{formatDate(selectedInvoice.invoice_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date d'arrivée:</span>
                            <span className="font-medium">{formatDate(selectedInvoice.invoice_arr_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Créée le:</span>
                            <span className="font-medium">{formatDateTime(selectedInvoice.create_at)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Facture annulée:</span>
                            <span className="font-medium">{selectedInvoice.status === 'Oui' ? 'Oui' : (selectedInvoice.status === 'Non' ? 'Non' : (selectedInvoice.status || 'Non spécifié'))}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Fournisseur</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Nom:</span>
                            <span className="font-medium">{selectedInvoice.supplier_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Compte:</span>
                            <span className="font-medium font-mono">{selectedInvoice.supplier_account_number}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Téléphone:</span>
                            <span className="font-medium">{selectedInvoice.supplier_phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Catégorisation</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Type:</span>
                            <span className="font-medium">{selectedInvoice.invoice_type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Nature:</span>
                            <span className="font-medium">{selectedInvoice.invoice_nature}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Folio:</span>
                            <span className="font-medium">{selectedInvoice.folio || 'Non spécifié'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Statut DFC:</span>
                            <span className={getStatusBadge(selectedInvoice.dfc_status)}>{getStatusText(selectedInvoice.dfc_status)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedInvoice.invoice_object && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Objet de la facture</h3>
                      <p className="text-gray-700">{selectedInvoice.invoice_object}</p>
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <PaperClipIcon className="w-5 h-5 mr-2 text-gray-600" />
                      Pièces jointes
                    </h3>
                    {loadingAttachments[selectedInvoice.id] ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Chargement...</span>
                      </div>
                    ) : invoiceAttachments[selectedInvoice.id]?.length > 0 ? (
                      <div className="space-y-2">
                        {invoiceAttachments[selectedInvoice.id].map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-3">
                              <PaperClipIcon className="w-5 h-5 text-gray-400" />
                              <span className="text-sm text-gray-900">{doc}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Aucune pièce jointe disponible</p>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button 
                      onClick={() => handleExport('pdf', selectedInvoice)} 
                      disabled={isExportingPdf || isExportingExcel}
                      className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExportingPdf ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Export...
                        </>
                      ) : (
                        <>
                          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                          PDF
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => handleExport('xlsx', selectedInvoice)} 
                      disabled={isExportingPdf || isExportingExcel}
                      className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExportingExcel ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Export...
                        </>
                      ) : (
                        <>
                          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                          Excel
                        </>
                      )}
                    </button>
                    <button onClick={handleCloseOverview} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showSupplierOverview && selectedSupplier && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                      <BuildingIcon className="w-6 h-6 mr-2 text-blue-600" />
                      Détails du fournisseur
                    </h2>
                    <button onClick={handleCloseOverview} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations générales</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Nom</label>
                          <p className="text-gray-900 font-medium">{selectedSupplier.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Numéro de compte</label>
                          <p className="text-gray-900 font-medium font-mono">{selectedSupplier.account_number}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Téléphone</label>
                          <p className="text-gray-900 font-medium">{selectedSupplier.phone}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Année fiscale</label>
                          <p className="text-gray-900 font-medium">{selectedSupplier.fiscal_year}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations de création</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Créé par</label>
                          <p className="text-gray-900 font-medium">{selectedSupplier.created_by}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                          <p className="text-gray-900 font-medium">{selectedSupplier.created_by_email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Rôle</label>
                          <p className="text-gray-900 font-medium">{selectedSupplier.created_by_role}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Date de création</label>
                          <p className="text-gray-900 font-medium">{formatDateTime(selectedSupplier.create_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button 
                      onClick={() => handleExport('pdf', selectedSupplier)} 
                      disabled={isExportingPdf || isExportingExcel}
                      className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExportingPdf ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Export...
                        </>
                      ) : (
                        <>
                          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                          PDF
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => handleExport('xlsx', selectedSupplier)} 
                      disabled={isExportingPdf || isExportingExcel}
                      className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExportingExcel ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Export...
                        </>
                      ) : (
                        <>
                          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                          Excel
                        </>
                      )}
                    </button>
                    <button onClick={handleCloseOverview} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ✅ AJOUT : Overview pour les résultats groupés par fournisseur */}
          {showGroupedOverview && selectedGroupedResult && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                      <BuildingIcon className="w-6 h-6 mr-2 text-blue-600" />
                      Statistiques par fournisseur
                    </h2>
                    <button onClick={handleCloseOverview} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations du fournisseur</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Nom</label>
                          <p className="text-gray-900 font-medium">{selectedGroupedResult.supplier_name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Numéro de compte</label>
                          <p className="text-gray-900 font-medium font-mono">{selectedGroupedResult.supplier_account}</p>
                        </div>
                        {selectedGroupedResult.phone && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Téléphone</label>
                            <p className="text-gray-900 font-medium">{selectedGroupedResult.phone}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Statistiques des factures</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Nombre de factures</label>
                          <p className="text-2xl font-bold text-blue-600">{selectedGroupedResult.invoice_count || 0}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Montant total</label>
                          <p className="text-xl font-bold text-gray-900">{formatAmount(selectedGroupedResult.total_amount)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Montant moyen</label>
                          <p className="text-xl font-bold text-gray-900">{formatAmount(selectedGroupedResult.avg_amount)}</p>
                        </div>
                        {selectedGroupedResult.last_invoice_date && (
                          <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Dernière facture</label>
                            <p className="text-gray-900 font-medium">{formatDate(selectedGroupedResult.last_invoice_date)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button 
                      onClick={() => handleExport('pdf', selectedGroupedResult)} 
                      disabled={isExportingPdf || isExportingExcel}
                      className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExportingPdf ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Export...
                        </>
                      ) : (
                        <>
                          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                          PDF
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => handleExport('xlsx', selectedGroupedResult)} 
                      disabled={isExportingPdf || isExportingExcel}
                      className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExportingExcel ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Export...
                        </>
                      ) : (
                        <>
                          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                          Excel
                        </>
                      )}
                    </button>
                    <button onClick={handleCloseOverview} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Search;