function Modal({ isOpen, onClose, title, children, footer }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                {title && (
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">{title}</h4>
                )}
                <div>
                    {children}
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    {footer ? footer : (
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700">Fermer</button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Modal;


