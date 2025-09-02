import { useEffect } from 'react';

function SlideOutPanel({ 
  isOpen, 
  onClose, 
  children, 
  title = "Options", 
  position = "left",
  width = "w-80",
  topLevel = '0'
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const panelClasses = `
    fixed top-${topLevel} ${position === 'left' ? 'left-0' : 'right-0'} h-full 
    ${width} bg-white/95 backdrop-blur-md shadow-2xl 
    transform transition-transform duration-300 ease-in-out z-50
    ${isOpen ? 'translate-x-0' : position === 'left' ? '-translate-x-full' : 'translate-x-full'}
  `;

  const overlayClasses = `
    fixed inset-0 bg-black/20 backdrop-blur-sm z-40
    transition-opacity duration-300 ease-in-ou-t
    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
  `;

  return (
    <>
      {/* Overlay */}
      <div className={overlayClasses} onClick={handleClose} />
      
      {/* Panel */}
      <div className={panelClasses}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 group"
            aria-label="Fermer"
          >
            <svg 
              className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </>
  );
}

export default SlideOutPanel;
