import { useState } from 'react';
import NavbarPanel from './NavbarPanel.jsx';
import { Bars3Icon } from '@heroicons/react/24/outline';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Button trigger */}
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
          {/* Text that appears on hover */}
          <span
            className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap ml-2"
          >
            Menu
          </span>

          {/* Burger icon always visible */}
          <div className="flex-shrink-0">
            <Bars3Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <NavbarPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

export default Navbar;