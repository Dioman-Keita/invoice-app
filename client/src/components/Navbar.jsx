import { useState } from 'react';
import NavbarPanel from './NavbarPanel';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

function Navbar({ isConnected, userType, userName, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Bouton de déclenchement du menu */}
      <div
        className="fixed left-0 top-1/2 transform -translate-y-1/2 z-40 group cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <div
          className="bg-green-700 text-white px-3 py-4 rounded-r-xl shadow-lg 
          translate-x-[-70%] group-hover:translate-x-0 transition-all duration-300 
          flex items-center justify-between w-[50px] sm:w-[130px] md:w-[110px] lg:w-[120px]
          hover:bg-green-800 hover:shadow-xl"
        >
          {/* Texte qui apparaît au hover */}
          <span
            className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap ml-2"
          >
            Menu
          </span>
          
          {/* Icône burger toujours visible */}
          <div className="flex-shrink-0">
            <Bars3Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Indicateur de notification (optionnel) */}
      {isConnected && (
        <div className="fixed left-3 top-1/2 transform -translate-y-16 z-30">
          <div className="w-3 h-3 bg-amber-400 rounded-full ring-2 ring-white animate-pulse"></div>
        </div>
      )}

      <NavbarPanel 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        isConnected={isConnected}
        userType={userType}
        userName={userName}
        onLogout={onLogout}
      />
    </>
  );
}

export default Navbar;