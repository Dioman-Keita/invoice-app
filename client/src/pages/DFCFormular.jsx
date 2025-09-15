import { useState } from 'react';
import useTitle from '../hooks/useTitle';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import { 
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import useBackground from '../hooks/useBackground';

function DFCFormular() {
  useTitle('CMDT — Traitement des factures DFC');
  useBackground('bg-dfc-formular');
  
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [decision, setDecision] = useState('');
  const [comments, setComments] = useState('');
  const [processedInvoices, setProcessedInvoices] = useState([]);

  // Données factices pour la démonstration
  const pendingInvoices = [
    {
      id: 'INV-2023-001',
      supplier: 'SARL COTON-MALI',
      amount: '1,250.00 FCFA',
      date: '2023-10-15',
      dueDate: '2023-11-15',
      category: 'Fournitures agricoles',
      status: 'pending',
      items: [
        { description: 'Engrais NPK', quantity: 50, price: '25.00 FCFA' },
        { description: 'Pesticides', quantity: 20, price: '12.50 FCFA' }
      ]
    },
    {
      id: 'INV-2023-002',
      supplier: 'ENTREPRISE AGRO-TECH',
      amount: '3,450.00 FCFA',
      date: '2023-10-18',
      dueDate: '2023-11-18',
      category: 'Équipement',
      status: 'pending',
      items: [
        { description: 'Tracteur pièces', quantity: 1, price: '3,450.00 FCFA' }
      ]
    }
  ];

  const handleProcessInvoice = () => {
    if (!currentInvoice || !decision) return;

    const processedInvoice = {
      ...currentInvoice,
      decision,
      comments,
      processedDate: new Date().toISOString(),
      processor: 'Agent DFC'
    };

    setProcessedInvoices([...processedInvoices, processedInvoice]);
    setCurrentInvoice(null);
    setDecision('');
    setComments('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Navbar */}
      <Navbar />
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Traitement des factures DFC</h1>
              <p className="text-gray-600">Validation et traitement des factures fournisseurs</p>
            </div>
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
              <span className="font-medium">{pendingInvoices.length}</span> factures en attente
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonne de gauche : Factures en attente */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <ClockIcon className="w-6 h-6 text-amber-600 mr-2" />
                Factures en attente de traitement
              </h2>
              
              <div className="space-y-4">
                {pendingInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    onClick={() => setCurrentInvoice(invoice)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      currentInvoice?.id === invoice.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{invoice.id}</span>
                      <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
                        En attente
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {invoice.supplier} • {invoice.amount}
                    </div>
                    <div className="text-xs text-gray-500">
                      Échéance: {invoice.dueDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Historique des traitements */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Historique des traitements</h2>
              <div className="space-y-3">
                {processedInvoices.slice(-5).map((invoice, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{invoice.id}</span>
                      <span className={`bg-${getStatusColor(invoice.decision)}-100 text-${getStatusColor(invoice.decision)}-800 px-2 py-1 rounded-full text-xs font-medium`}>
                        {invoice.decision === 'approved' ? 'Approuvée' : 'Rejetée'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">{invoice.supplier}</div>
                    <div className="text-xs text-gray-500">
                      Traité le {new Date(invoice.processedDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {processedInvoices.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <DocumentMagnifyingGlassIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>Aucun traitement effectué</p>
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
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <DocumentMagnifyingGlassIcon className="w-6 h-6 text-blue-600 mr-2" />
                    Détails de la facture {currentInvoice.id}
                  </h2>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                      <p className="text-gray-900 font-medium">{currentInvoice.supplier}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                      <p className="text-gray-900 font-medium">{currentInvoice.amount}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <p className="text-gray-600">{currentInvoice.date}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Échéance</label>
                      <p className="text-gray-600">{currentInvoice.dueDate}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                      <p className="text-gray-600">{currentInvoice.category}</p>
                    </div>
                  </div>

                  {/* Articles de la facture */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Articles</label>
                    <div className="border border-gray-200 rounded-lg">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Description</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Quantité</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Prix</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentInvoice.items.map((item, index) => (
                            <tr key={index} className="border-t border-gray-200">
                              <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{item.price}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Formulaire de décision */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Décision de traitement</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <button
                        onClick={() => setDecision('approved')}
                        className={`p-4 border-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
                          decision === 'approved'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        Approuver
                      </button>
                      <button
                        onClick={() => setDecision('rejected')}
                        className={`p-4 border-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
                          decision === 'rejected'
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <XCircleIcon className="w-5 h-5 mr-2" />
                        Rejeter
                      </button>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Commentaires</label>
                      <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Ajoutez des commentaires sur votre décision..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <button
                      onClick={handleProcessInvoice}
                      disabled={!decision}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <DocumentCheckIcon className="w-5 h-5 mr-2" />
                      Traiter la facture
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-6 text-center">
                <DocumentMagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez une facture</h3>
                <p className="text-gray-600">Choisissez une facture dans la liste pour commencer le traitement</p>
              </div>
            )}

            {/* Statistiques de traitement */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Statistiques du jour</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {processedInvoices.filter(i => i.decision === 'approved').length}
                  </div>
                  <div className="text-sm text-green-800">Approuvées</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {processedInvoices.filter(i => i.decision === 'rejected').length}
                  </div>
                  <div className="text-sm text-red-800">Rejetées</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {processedInvoices.length}
                  </div>
                  <div className="text-sm text-blue-800">Traitées</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  <Footer />
</>
  );
}

export default DFCFormular;