import { DocumentTextIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

function InvoiceLastNumber() {
    const [showTooltip, setShowTooltip] = useState(false);
    
    return (
        <div className="relative inline-flex">
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-gray-700 text-sm font-medium shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group">
                <DocumentTextIcon className="w-4 h-4 text-blue-500" />
                <span>Facture #0000</span>
                <button 
                    onMouseEnter={() => setShowTooltip(true)} 
                    onMouseLeave={() => setShowTooltip(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <InformationCircleIcon className="w-4 h-4" />
                </button>
            </span>
            
            {showTooltip && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md shadow-lg z-10 w-48">
                    Numéro de la dernière facture enregistrée dans le système
                </div>
            )}
        </div>
    )
}

export default InvoiceLastNumber;