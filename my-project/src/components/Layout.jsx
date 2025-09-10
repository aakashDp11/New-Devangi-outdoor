import React from 'react';
import Navbar from './Navbar';
import { useSidebar } from '../context/SidebarContext';
import { FaBars } from 'react-icons/fa';

const Layout = ({ children }) => {
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const handleToggle = () => setIsCollapsed(prev => !prev);

  return (
    <div
      className="flex min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-text)',
      }}
    >
      <Navbar />

      {/* Main Content Area */}
      <main
        className={`
          flex-grow p-4 md:p-6 w-full
          transition-all duration-300 ease-in-out
          ml-0
          ${isCollapsed ? 'md:ml-24' : 'md:ml-64'}
        `}
        style={{
          backgroundColor: 'var(--color-background)',
          color: 'var(--color-text)',
        }}
      >
        {/* Mobile Header with Hamburger Menu */}
        <div
          className="md:hidden flex items-center mb-4 p-2 rounded-lg shadow transition-colors duration-300"
          style={{
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          }}
        >
          <button
            onClick={handleToggle}
            className="p-2 rounded-md"
            aria-label="Open sidebar"
            style={{ color: 'var(--color-text)' }}
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
