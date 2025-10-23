import { DocumentTextIcon, InformationCircleIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import useInvoice from '../../hooks/features/useInvoice.js';

export default function InvoiceLastNumber({ lastInvoiceNumber, isLoading = false, fiscalYear }) {
    const [showTooltip, setShowTooltip] = useState(false);
    
    console.log('🎯 InvoiceLastNumber avec props:', lastInvoiceNumber, isLoading, fiscalYear);
    
    return (
        <div className="relative inline-flex">
            <div className={`inline-flex items-center gap-3 px-3 py-2 rounded-lg bg-white text-gray-700 text-sm font-medium shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group ${
                isLoading ? 'opacity-50' : ''
            } ${fiscalYear ? 'border-green-200 bg-green-50' : ''}`}>
                
                {/* Année fiscale intégrée */}
                {fiscalYear && (
                    <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                        <ChartBarIcon className="w-3 h-3" />
                        <span>{fiscalYear}</span>
                    </div>
                )}
                
                {/* Section Numéro de Facture avec "Facture" au-dessus */}
                <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-800 font-medium">Facture</span>
                        <DocumentTextIcon className={`w-4 h-4 ${
                            isLoading ? 'text-gray-400 animate-pulse' : fiscalYear ? 'text-green-500' : 'text-blue-500'
                        }`} />
                        
                        <span className="font-mono font-bold text-gray-800 text-base">
                            {isLoading ? (
                                <span className="animate-pulse">...</span>
                            ) : (
                                `#${lastInvoiceNumber || '0000'}`
                            )}
                        </span>
                    </div>
                </div>
                
                {/* Bouton d'information */}
                <button 
                    type='button'
                    onMouseEnter={() => setShowTooltip(true)} 
                    onMouseLeave={() => setShowTooltip(false)}
                    className={`transition-colors ${
                        isLoading ? 'text-gray-400' : fiscalYear ? 'text-green-500 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'
                    }`}
                    disabled={isLoading}
                >
                    <InformationCircleIcon className="w-4 h-4" />
                </button>
            </div>
            
            {/* Tooltip avec information sur l'année fiscale */}
            {showTooltip && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md shadow-lg z-10 w-64 text-center">
                    {isLoading 
                        ? 'Mise à jour du numéro en cours...' 
                        : fiscalYear
                            ? `Dernier numéro de facture pour l'exercice ${fiscalYear}`
                            : 'Numéro de la dernière facture enregistrée dans le système'
                    }
                </div>
            )}
        </div>
    )
}

export function InvoiceLastNumberAuto() {
    const { lastInvoiceNumber, fiscalYear } = useInvoice();
    return <InvoiceLastNumber lastInvoiceNumber={lastInvoiceNumber} fiscalYear={fiscalYear} />;
}