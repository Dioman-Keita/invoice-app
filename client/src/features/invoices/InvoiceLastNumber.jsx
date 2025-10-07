import { DocumentTextIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import useInvoice from '../../hooks/useInvoice';

// 🔥 Version avec props (utilisée dans InvoiceForm)
export default function InvoiceLastNumber({ lastInvoiceNumber, isLoading = false }) {
    const [showTooltip, setShowTooltip] = useState(false);
    
    console.log('🎯 InvoiceLastNumber avec props:', lastInvoiceNumber, isLoading);
    
    return (
        <div className="relative inline-flex">
            <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-gray-700 text-sm font-medium shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group ${
                isLoading ? 'opacity-50' : ''
            }`}>
                <DocumentTextIcon className={`w-4 h-4 ${
                    isLoading ? 'text-gray-400 animate-pulse' : 'text-blue-500'
                }`} />
                
                <span>
                    {isLoading ? (
                        <span className="flex items-center gap-1">
                            <span className="animate-pulse">Mise à jour...</span>
                        </span>
                    ) : (
                        `Facture #${lastInvoiceNumber || '0000'}`
                    )}
                </span>
                
                <button 
                    type='button'
                    onMouseEnter={() => setShowTooltip(true)} 
                    onMouseLeave={() => setShowTooltip(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                >
                    <InformationCircleIcon className="w-4 h-4" />
                </button>
            </span>
            
            {showTooltip && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md shadow-lg z-10 w-48">
                    {isLoading 
                        ? 'Mise à jour du numéro en cours...' 
                        : 'Numéro de la dernière facture enregistrée dans le système'
                    }
                </div>
            )}
        </div>
    )
}

// 🔥 Version autonome (utilisée ailleurs)
export function InvoiceLastNumberAuto() {
    const { lastInvoiceNumber } = useInvoice();
    return <InvoiceLastNumber lastInvoiceNumber={lastInvoiceNumber} />;
}