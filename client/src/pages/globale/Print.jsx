import { useState } from 'react';
import useTitle from '../../hooks/ui/useTitle.js';
import useBackground from '../../hooks/ui/useBackground.js';
import Navbar from '../../components/navbar/Navbar.jsx';
import Footer from '../../components/global/Footer.jsx';

import { 
  PrinterIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

function Print() {
  useTitle('CMDT - Impression');
  useBackground('bg-print');

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [printOptions, setPrintOptions] = useState({
    format: 'a4',
    copies: 1,
    includeDetails: true,
    includeLogo: true
  });

  const invoices = [
    { id: 'INV-2023-001', date: '2023-10-15', amount: '1,250.00 FCFA', status: 'Payée' },
    { id: 'INV-2023-002', date: '2023-10-18', amount: '3,450.00 FCFA', status: 'En attente' },
    { id: 'INV-2023-003', date: '2023-10-20', amount: '2,100.00 FCFA', status: 'Payée' }
  ];

  const handlePrint = () => {
    console.log('Printing form:', selectedInvoice, 'with options:', printOptions);
    // Logique d'impression ici
  };

  return (
    <>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Navbar */}
          <Navbar />
          {/* En-tête */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <PrinterIcon className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Impression de factures</h1>
            <p className="text-gray-950">Imprimez vos factures en différents formats</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Sélectionner une facture</h2>
            
            {/* Recherche de facture */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher une facture</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Numéro de facture..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Liste des factures récentes */}
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Factures récentes</h3>
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  onClick={() => setSelectedInvoice(invoice)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors duration-200 ${
                    selectedInvoice?.id === invoice.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{invoice.id}</p>
                        <p className="text-sm text-gray-500">{invoice.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{invoice.amount}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'Payée' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Options d'impression */}
            {selectedInvoice && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Options d'impression</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                    <select
                      value={printOptions.format}
                      onChange={(e) => setPrintOptions({...printOptions, format: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="a4">A4</option>
                      <option value="letter">Lettre</option>
                      <option value="receipt">Ticket</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de copies</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={printOptions.copies}
                      onChange={(e) => setPrintOptions({...printOptions, copies: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={printOptions.includeDetails}
                      onChange={(e) => setPrintOptions({...printOptions, includeDetails: e.target.checked})}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Inclure les détails complets</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={printOptions.includeLogo}
                      onChange={(e) => setPrintOptions({...printOptions, includeLogo: e.target.checked})}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Inclure le logo CMDT</span>
                  </label>
                </div>

                {/* Aperçu d'impression */}
                <div className="bg-gray-100 p-4 rounded-lg mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Aperçu</h4>
                  <div className="bg-white p-4 border border-gray-300 rounded">
                    <div className="text-center mb-4">
                      <h5 className="font-bold">FACTURE {selectedInvoice.id}</h5>
                      <p className="text-sm text-gray-600">Date: {selectedInvoice.date}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{selectedInvoice.amount}</p>
                      <p className="text-sm text-gray-600">Statut: {selectedInvoice.status}</p>
                    </div>
                  </div>
                </div>

                {/* Bouton d'impression */}
                <button
                  onClick={handlePrint}
                  disabled={!selectedInvoice}
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PrinterIcon className="w-5 h-5 mr-2" />
                  Imprimer la facture
                </button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Instructions d'impression</h3>
            <ul className="text-blue-800 space-y-2 text-sm">
              <li>• Vérifiez que votre imprimante est allumée et connectée</li>
              <li>• Assurez-vous d'avoir du papier dans le bac d'impression</li>
              <li>• Utilisez le format A4 pour une impression standard</li>
              <li>• Contactez le support en cas de problème d'impression</li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Print;