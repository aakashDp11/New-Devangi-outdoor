import React from 'react';
import Navbar from './Navbar';
import { useSidebar } from '../context/SidebarContext';
import { FaBars } from 'react-icons/fa';

const Layout = ({ children }) => {
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const handleToggle = () => setIsCollapsed(prev => !prev);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content Area */}
      <main
        className={`
          flex-grow p-4 md:p-6 w-full
          transition-all duration-300 ease-in-out
          ml-0
          ${isCollapsed ? 'md:ml-24' : 'md:ml-64'}
        `}
      >
        {/* Mobile Header with Hamburger Menu */}
        <div className="md:hidden flex items-center mb-4 p-2 bg-white rounded-lg shadow">
          <button
            onClick={handleToggle}
            className="p-2 rounded-md text-gray-700"
            aria-label="Open sidebar"
          >
            <FaBars size={20} />
          </button>
          <h1 className="text-xl font-bold ml-4">Dashboard</h1>
        </div>

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
};

export default Layout;
