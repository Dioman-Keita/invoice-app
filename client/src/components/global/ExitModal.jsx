import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ExitModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" aria-hidden="true" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Quitter l'application
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-600">
                                    Voulez-vous vraiment quitter <span className="font-medium">Invoice App</span> ?
                                    Toute modification non sauvegardée sera perdue.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Quitter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExitModal;
