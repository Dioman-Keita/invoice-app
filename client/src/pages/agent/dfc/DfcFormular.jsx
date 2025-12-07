import { useState, useEffect } from 'react';
import useTitle from '../../../hooks/ui/useTitle.js';
import Navbar from '../../../components/navbar/Navbar.jsx';
import Footer from '../../../components/global/Footer.jsx';
import Header from '../../../components/global/Header.jsx';

import {
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  HashtagIcon,
  BuildingStorefrontIcon,
  CreditCardIcon,
  TagIcon,
  UserCircleIcon,
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import useBackground from '../../../hooks/ui/useBackground.js';

function DfcFormular() {
  useTitle('CMDT - Traitement des factures DFC');
  useBackground('bg-dfc-formular');

  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [decision, setDecision] = useState('');
  const [comments, setComments] = useState('');
  const [processedInvoices, setProcessedInvoices] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear().toString());
  const [showStats, setShowStats] = useState(true);
  const [commentError, setCommentError] = useState('');

  // Configuration de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage, setInvoicesPerPage] = useState(3); // Nombre de factures par page

  // Configuration du textarea
  const MAX_COMMENT_LENGTH = 500;
  const COMMENT_WARNING_THRESHOLD = 450;

  // Calcul des données de pagination
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = pendingInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(pendingInvoices.length / invoicesPerPage);

  // Réinitialiser la page quand les données changent
  useEffect(() => {
    setCurrentPage(1);
  }, [pendingInvoices.length]);

  // Fonctions de pagination
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Formater les montants de manière professionnelle
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

  // Formater les dates
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

  // Formater la date avec heure
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

  // Tronquer les textes longs
  const truncateText = (text, maxLength = 30) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Gestion des commentaires avec limite
  const handleCommentsChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_COMMENT_LENGTH) {
      setComments(value);
      setCommentError('');
    } else {
      setCommentError(`Limite de ${MAX_COMMENT_LENGTH} caractères dépassée`);
    }
  };

  // Réinitialiser l'affichage des stats quand une facture est sélectionnée
  const handleInvoiceSelect = (invoice) => {
    setCurrentInvoice(invoice);
    setShowStats(false);
  };

  // Fonction pour déterminer l'état de la facture
  const getInvoiceStatusInfo = (invoice) => {
    const isCancelled = invoice.status === 'Oui';
    return {
      isCancelled,
      label: isCancelled ? 'Facture annulée' : 'Facture valide',
      color: isCancelled ? 'red' : 'green',
      icon: isCancelled ? ExclamationCircleIcon : CheckCircleIcon
    };
  };

  useEffect(() => {
    let mounted = true;
    const loadPending = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('http://localhost:3000/api/invoices/dfc/pending', {
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        });

        const payload = await res.json();

        if (!res.ok) {
          throw new Error(payload?.message || 'Erreur lors du chargement des factures');
        }

        const rows = payload?.data || [];
        setFiscalYear(payload?.meta?.fiscalYear || new Date().getFullYear().toString());

        if (rows.length === 0) {
          if (mounted) {
            setPendingInvoices([]);
            setError(`Aucune facture DFC en attente pour l'année fiscale ${fiscalYear}`);
          }
          return;
        }

        const normalized = rows.map((inv) => ({
          id: inv.id,
          num_cmdt: inv.num_cmdt,
          num_invoice: inv.num_invoice,
          invoice_object: inv.invoice_object,
          supplier: inv.supplier_name || `Fournisseur #${inv.supplier_id}`,
          supplier_id: inv.supplier_id,
          supplier_account: inv.supplier_account_number,
          supplier_phone: inv.supplier_phone,
          amount: inv.amount,
          invoice_date: inv.invoice_date,
          invoice_arr_date: inv.invoice_arr_date,
          invoice_type: inv.invoice_type,
          invoice_nature: inv.invoice_nature,
          folio: inv.folio,
          status: inv.status, // Propriété status pour l'état de la facture
          dfc_status: inv.dfc_status || 'pending',
          created_by: inv.created_by,
          created_by_email: inv.created_by_email,
          created_by_role: inv.created_by_role,
          fiscal_year: inv.fiscal_year,
          create_at: inv.create_at,
          update_at: inv.update_at,
          items: Array.isArray(inv.items) ? inv.items : []
        }));

        if (mounted) {
          setPendingInvoices(normalized);
          setError('');
        }
      } catch (e) {
        if (mounted) {
          setError(e.message || 'Échec de chargement des factures DFC en attente');
          setPendingInvoices([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPending();
    return () => { mounted = false; };
  }, [fiscalYear]);

  const approveInvoice = async (invoiceId) => {
    const res = await fetch(`http://localhost:3000/api/invoices/${invoiceId}/dfc/approve`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comments })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.message || 'Erreur lors de l\'approbation');
    }
  };

  const rejectInvoice = async (invoiceId) => {
    const res = await fetch(`http://localhost:3000/api/invoices/${invoiceId}/dfc/reject`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comments })
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.message || 'Erreur lors du rejet');
    }
  };

  const handleProcessInvoice = async () => {
    if (!currentInvoice || !decision) return;
    try {
      setLoading(true);
      if (decision === 'approved') {
        await approveInvoice(currentInvoice.id);
      } else if (decision === 'rejected') {
        await rejectInvoice(currentInvoice.id);
      }

      const processedInvoice = {
        ...currentInvoice,
        decision,
        comments,
        processedDate: new Date().toISOString(),
        processor: 'Agent DFC'
      };

      setProcessedInvoices((prev) => [...prev, processedInvoice]);
      setPendingInvoices((prev) => prev.filter(inv => inv.id !== currentInvoice.id));
      setCurrentInvoice(null);
      setDecision('');
      setComments('');
      setShowStats(true); // Afficher les stats après traitement
    } catch (e) {
      alert(e.message || 'Une erreur est survenue lors du traitement');
    } finally {
      setLoading(false);
    }
  };


  // Loading Overlay Component
  const LoadingOverlay = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200">
        <div className="relative mb-4">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <ClockIcon className="w-6 h-6 text-blue-600 animate-pulse" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Traitement en cours</h3>
        <p className="text-gray-500 text-sm">Veuillez patienter quelques instants...</p>
      </div>
    </div>
  );

  return (
    <>
      {loading && <LoadingOverlay />}
      <div className="min-h-screen">
        <Header />
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* En-tête avec informations contextuelles */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Traitement des factures DFC
                </h1>
                <p className="text-gray-900 text-xl font-semibold">
                  Validation et traitement des factures fournisseurs
                  <span className="inline-flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold ml-3">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Année fiscale {fiscalYear}
                  </span>
                </p>
              </div>
              <div className={`px-3 py-2 rounded border ${pendingInvoices.length > 0
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                <span className="font-semibold">{pendingInvoices.length}</span> facture(s) en attente
              </div>
            </div>
          </div>

          {/* Message d'information si aucune facture */}
          {error && !loading && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-amber-800">Information</h3>
                  <p className="text-amber-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne de gauche : Factures en attente */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <ClockIcon className="w-5 h-5 text-amber-500 mr-2" />
                    Factures en attente de traitement
                  </h2>

                  {/* Sélecteur d'éléments par page */}
                  {pendingInvoices.length > 3 && (
                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-gray-600 whitespace-nowrap">
                        Afficher:
                      </label>
                      <select
                        value={invoicesPerPage}
                        onChange={(e) => setInvoicesPerPage(Number(e.target.value))}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={3}>3</option>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                  )}
                </div>

                {pendingInvoices.length > 0 ? (
                  <div className="space-y-3">
                    {currentInvoices.map((invoice) => {
                      const statusInfo = getInvoiceStatusInfo(invoice);
                      const StatusIcon = statusInfo.icon;

                      return (
                        <div
                          key={invoice.id}
                          onClick={() => handleInvoiceSelect(invoice)}
                          className={`p-4 border rounded-lg cursor-pointer transition-all duration-150 ${currentInvoice?.id === invoice.id
                              ? 'border-green-500 bg-green-25 ring-1 ring-green-500'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-25'
                            }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-semibold text-gray-900 text-sm truncate">
                                  {invoice.id}
                                </span>
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap`}>
                                  {invoice.invoice_nature}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {invoice.supplier}
                              </p>
                            </div>
                            <div className="flex flex-col items-end space-y-1 ml-2">
                              <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                                En attente
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${statusInfo.color === 'red'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-green-50 text-green-700 border border-green-200'
                                }`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center whitespace-nowrap">
                                <CalendarIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                                {formatDate(invoice.invoice_date)}
                              </span>
                              <span className="flex items-center whitespace-nowrap">
                                <HashtagIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                                CMD: {invoice.num_cmdt}
                              </span>
                            </div>
                            <span className="font-bold text-gray-900 text-sm whitespace-nowrap ml-2">
                              {formatAmount(invoice.amount)}
                            </span>
                          </div>

                          {invoice.invoice_object && (
                            <div className="mt-2 text-xs text-gray-600">
                              <DocumentTextIcon className="w-3 h-3 inline mr-1 flex-shrink-0" />
                              <span className="break-words">{truncateText(invoice.invoice_object, 50)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-600">
                          Affichage de {indexOfFirstInvoice + 1} à {Math.min(indexOfLastInvoice, pendingInvoices.length)} sur {pendingInvoices.length} factures
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={prevPage}
                            disabled={currentPage === 1}
                            className="p-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                          >
                            <ChevronLeftIcon className="w-4 h-4" />
                          </button>

                          {/* Affichage des numéros de page */}
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
                                onClick={() => goToPage(pageNumber)}
                                className={`min-w-[2rem] px-2 py-1 text-xs rounded border transition-colors ${currentPage === pageNumber
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          })}

                          <button
                            onClick={nextPage}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                          >
                            <ChevronRightIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <DocumentMagnifyingGlassIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-medium">Aucune facture en attente</p>
                    <p className="text-xs mt-1">Toutes les factures ont été traitées</p>
                  </div>
                )}
              </div>

              {/* Historique des traitements */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique des traitements</h2>
                <div className="space-y-2">
                  {processedInvoices.slice(-5).map((invoice, index) => {
                    const statusInfo = getInvoiceStatusInfo(invoice);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <div key={index} className="p-3 border border-gray-150 rounded hover:bg-gray-25">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 text-sm">{invoice.id}</span>
                          <div className="flex items-center space-x-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${invoice.decision === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                              } whitespace-nowrap`}>
                              {invoice.decision === 'approved' ? 'Approuvée' : 'Rejetée'}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${statusInfo.color === 'red'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-green-50 text-green-700 border border-green-200'
                              }`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                          <span className="truncate flex-1 mr-2">{invoice.supplier}</span>
                          <span className="font-medium whitespace-nowrap">{formatAmount(invoice.amount)}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          <div className="whitespace-nowrap">Traitée le {formatDateTime(invoice.processedDate)}</div>
                          {invoice.comments && (
                            <div className="mt-1 text-gray-400 truncate">"{invoice.comments}"</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {processedInvoices.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <DocumentCheckIcon className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Aucun traitement effectué</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Colonne de droite : Détails et traitement */}
            <div className="space-y-6">
              {currentInvoice ? (
                <>
                  {/* Détails de la facture */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <DocumentMagnifyingGlassIcon className="w-5 h-5 text-gray-600 mr-2" />
                      Détails de la facture
                    </h2>

                    {/* Informations principales */}
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between p-3 bg-gray-25 rounded border border-gray-200">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">Référence</p>
                          <p className="text-gray-900 font-mono text-sm truncate">{currentInvoice.id}</p>
                        </div>
                        <div className="text-right min-w-0 ml-4">
                          <p className="font-semibold text-gray-900 text-sm">Montant total</p>
                          <p className="text-xl font-bold text-gray-900 whitespace-nowrap">
                            {formatAmount(currentInvoice.amount)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                              <BuildingStorefrontIcon className="w-3 h-3 mr-1" />
                              Fournisseur
                            </p>
                            <p className="text-sm font-medium text-gray-900 truncate">{currentInvoice.supplier}</p>
                            <div className="text-xs text-gray-600 mt-1 space-y-1">
                              <div className="truncate flex items-center">
                                <CreditCardIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                                Compte: {currentInvoice.supplier_account}
                              </div>
                              <div className="truncate flex items-center">
                                <UserIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                                Tél: {currentInvoice.supplier_phone}
                              </div>
                            </div>
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                              <HashtagIcon className="w-3 h-3 mr-1" />
                              Numéro de commande
                            </p>
                            <p className="text-sm font-medium text-gray-900">{currentInvoice.num_cmdt}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                              <CalendarIcon className="w-3 h-3 mr-1" />
                              Dates
                            </p>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div className="whitespace-nowrap flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                                Émission: {formatDate(currentInvoice.invoice_date)}
                              </div>
                              <div className="whitespace-nowrap flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
                                Enregistrement: {formatDate(currentInvoice.invoice_arr_date)}
                              </div>
                            </div>
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-500 mb-1 flex items-center">
                              <TagIcon className="w-3 h-3 mr-1" />
                              Numéro de facture
                            </p>
                            <p className="text-sm font-medium text-gray-900 font-mono truncate">{currentInvoice.num_invoice}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Objet de la facture */}
                    {currentInvoice.invoice_object && (
                      <div className="mb-6 p-3 bg-gray-25 rounded border border-gray-200">
                        <p className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                          <ClipboardDocumentListIcon className="w-3 h-3 mr-1" />
                          Objet de la facture
                        </p>
                        <p className="text-sm text-gray-900 break-words">{currentInvoice.invoice_object}</p>
                      </div>
                    )}

                    {/* SECTION ÉTAT FACTURE - Créée séparément */}
                    <div className="mb-6">
                      <p className="text-xs font-medium text-gray-500 mb-3 flex items-center">
                        <ExclamationCircleIcon className="w-3 h-3 mr-1" />
                        ÉTAT FACTURE
                      </p>
                      <div className="grid grid-cols-1 gap-3">
                        <div className={`p-4 rounded border ${currentInvoice.status === 'Oui'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-green-50 border-green-200'
                          }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {currentInvoice.status === 'Oui' ? (
                                <ExclamationCircleIcon className="w-5 h-5 text-red-600 mr-3" />
                              ) : (
                                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {currentInvoice.status === 'Oui' ? 'Facture annulée' : 'Facture valide'}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {currentInvoice.status === 'Oui'
                                    ? 'Cette facture a été annulée et ne peut être utilisée pour le traitement.'
                                    : 'Cette facture est valide et peut être traitée normalement.'
                                  }
                                </p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${currentInvoice.status === 'Oui'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                              }`}>
                              {currentInvoice.status === 'Oui' ? 'Annulée' : 'Valide'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Catégories - Version améliorée avec meilleure gestion du débordement */}
                    <div className="mb-6">
                      <p className="text-xs font-medium text-gray-500 mb-3 flex items-center">
                        <DocumentTextIcon className="w-3 h-3 mr-1" />
                        INFORMATIONS DE CATÉGORISATION
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        <div className="p-3 bg-blue-50 rounded border border-blue-200 min-w-0 group relative">
                          <p className="text-xs text-blue-600 font-medium mb-1 whitespace-nowrap flex items-center">
                            <TagIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                            Type
                          </p>
                          <p
                            className="text-sm font-medium text-gray-900 truncate"
                            title={currentInvoice.invoice_type}
                          >
                            {currentInvoice.invoice_type}
                          </p>
                          {/* Tooltip pour texte complet */}
                          {currentInvoice.invoice_type && currentInvoice.invoice_type.length > 20 && (
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                              <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                {currentInvoice.invoice_type}
                              </div>
                              <div className="w-3 h-3 bg-gray-800 transform rotate-45 absolute -bottom-1 left-3"></div>
                            </div>
                          )}
                        </div>
                        <div className="p-3 bg-green-50 rounded border border-green-200 min-w-0 group relative">
                          <p className="text-xs text-green-600 font-medium mb-1 whitespace-nowrap flex items-center">
                            <DocumentCheckIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                            Nature
                          </p>
                          <p
                            className="text-sm font-medium text-gray-900 truncate"
                            title={currentInvoice.invoice_nature}
                          >
                            {currentInvoice.invoice_nature}
                          </p>
                          {/* Tooltip pour texte complet */}
                          {currentInvoice.invoice_nature && currentInvoice.invoice_nature.length > 20 && (
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                              <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                {currentInvoice.invoice_nature}
                              </div>
                              <div className="w-3 h-3 bg-gray-800 transform rotate-45 absolute -bottom-1 left-3"></div>
                            </div>
                          )}
                        </div>
                        <div className="p-3 bg-purple-50 rounded border border-purple-200 min-w-0 group relative">
                          <p className="text-xs text-purple-600 font-medium mb-1 whitespace-nowrap flex items-center">
                            <HashtagIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                            Folio
                          </p>
                          <p
                            className="text-sm font-medium text-gray-900 truncate"
                            title={currentInvoice.folio}
                          >
                            {currentInvoice.folio}
                          </p>
                          {/* Tooltip pour texte complet */}
                          {currentInvoice.folio && currentInvoice.folio.length > 20 && (
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                              <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                {currentInvoice.folio}
                              </div>
                              <div className="w-3 h-3 bg-gray-800 transform rotate-45 absolute -bottom-1 left-3"></div>
                            </div>
                          )}
                        </div>
                        <div className="p-3 bg-gray-50 rounded border border-gray-200 min-w-0 group relative">
                          <p className="text-xs text-gray-600 font-medium mb-1 whitespace-nowrap flex items-center">
                            <UserCircleIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                            Créée par
                          </p>
                          <p
                            className="text-sm font-medium text-gray-900 truncate"
                            title={currentInvoice.created_by}
                          >
                            {currentInvoice.created_by}
                          </p>
                          {/* Tooltip pour texte complet */}
                          {currentInvoice.created_by && currentInvoice.created_by.length > 20 && (
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                              <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                {currentInvoice.created_by}
                              </div>
                              <div className="w-3 h-3 bg-gray-800 transform rotate-45 absolute -bottom-1 left-3"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Formulaire de décision */}
                    <div className="border-t pt-6">
                      <h3 className="text-md font-semibold text-gray-900 mb-4">Décision de traitement</h3>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <button
                          onClick={() => setDecision('approved')}
                          disabled={currentInvoice.status === 'Oui'}
                          className={`p-3 border rounded-lg transition-all duration-150 flex items-center justify-center space-x-2 ${decision === 'approved'
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500'
                              : currentInvoice.status === 'Oui'
                                ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-25'
                            }`}
                        >
                          <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-medium whitespace-nowrap">Approuver</span>
                        </button>
                        <button
                          onClick={() => setDecision('rejected')}
                          disabled={currentInvoice.status === 'Oui'}
                          className={`p-3 border rounded-lg transition-all duration-150 flex items-center justify-center space-x-2 ${decision === 'rejected'
                              ? 'border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500'
                              : currentInvoice.status === 'Oui'
                                ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-red-300 hover:bg-red-25'
                            }`}
                        >
                          <XCircleIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-medium whitespace-nowrap">Rejeter</span>
                        </button>
                      </div>

                      {currentInvoice.status === 'Oui' && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start">
                            <ExclamationCircleIcon className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-red-700">
                              <strong>Facture annulée :</strong> Cette facture a été annulée et ne peut pas être traitée. Veuillez sélectionner une autre facture valide.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Commentaires (optionnel)
                        </label>
                        <div className="relative">
                          <textarea
                            value={comments}
                            onChange={handleCommentsChange}
                            placeholder="Justification de la décision..."
                            rows={3}
                            disabled={currentInvoice.status === 'Oui'}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-150 resize-none ${currentInvoice.status === 'Oui'
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : commentError
                                  ? 'border-red-500 bg-red-50'
                                  : comments.length > COMMENT_WARNING_THRESHOLD
                                    ? 'border-amber-500 bg-amber-50'
                                    : 'border-gray-300'
                              }`}
                          />
                          <div className={`absolute bottom-2 right-2 text-xs ${comments.length > MAX_COMMENT_LENGTH
                              ? 'text-red-600 font-bold'
                              : comments.length > COMMENT_WARNING_THRESHOLD
                                ? 'text-amber-600'
                                : 'text-gray-500'
                            } ${currentInvoice.status === 'Oui' ? 'text-gray-400' : ''}`}>
                            {comments.length}/{MAX_COMMENT_LENGTH}
                          </div>
                        </div>
                        {commentError && (
                          <div className="mt-1 text-xs text-red-600 flex items-center">
                            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                            {commentError}
                          </div>
                        )}
                        {comments.length > COMMENT_WARNING_THRESHOLD && comments.length <= MAX_COMMENT_LENGTH && (
                          <div className="mt-1 text-xs text-amber-600 flex items-center">
                            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                            Vous approchez de la limite de caractères
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleProcessInvoice}
                        disabled={!decision || loading || comments.length > MAX_COMMENT_LENGTH || currentInvoice.status === 'Oui'}
                        className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors duration-150 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        <DocumentCheckIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">
                          {loading ? 'Traitement en cours...' :
                            currentInvoice.status === 'Oui' ? 'Facture annulée - Traitement impossible' : 'Traiter la facture'}
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <DocumentMagnifyingGlassIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Sélectionnez une facture</h3>
                  <p className="text-xs text-gray-600">
                    {pendingInvoices.length > 0
                      ? "Choisissez une facture dans la liste pour commencer le traitement"
                      : "Aucune facture disponible pour le moment"}
                  </p>
                </div>
              )}

              {/* Statistiques de traitement - Affichage conditionnel */}
              {showStats && (
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ChartBarIcon className="w-5 h-5 text-gray-600 mr-2" />
                    Statistiques du jour
                  </h2>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-emerald-50 rounded border border-emerald-200">
                      <div className="text-lg font-bold text-emerald-700">
                        {processedInvoices.filter(i => i.decision === 'approved').length}
                      </div>
                      <div className="text-xs text-emerald-800 font-medium whitespace-nowrap">Approuvées</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded border border-red-200">
                      <div className="text-lg font-bold text-red-700">
                        {processedInvoices.filter(i => i.decision === 'rejected').length}
                      </div>
                      <div className="text-xs text-red-800 font-medium whitespace-nowrap">Rejetées</div>
                    </div>
                    <div className="text-center p-3 bg-gray-100 rounded border border-gray-300">
                      <div className="text-lg font-bold text-gray-700">
                        {processedInvoices.length}
                      </div>
                      <div className="text-xs text-gray-800 font-medium whitespace-nowrap">Traitées</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>En attente:</span>
                      <span className="font-medium">{pendingInvoices.length}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Total aujourd'hui:</span>
                      <span className="font-medium">{pendingInvoices.length + processedInvoices.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

// Composant d'icône manquant pour les statistiques
function ChartBarIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
      />
    </svg>
  );
}

export default DfcFormular;