import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import {
  FaArrowLeft,
  FaArrowRight,
  FaExclamationTriangle,
  FaCheck,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaSort,
} from 'react-icons/fa';
import { useSidebar } from '../context/SidebarContext';

// --- REUSABLE UI COMPONENTS (SHARED) ---

// Card component with a flowing gradient animation on the background
const Card = ({ children, className = '', ...props }) => (
  <div
    className={`
        bg-gray-100 bg-opacity-80 shadow-xl rounded-2xl w-full flex flex-col relative overflow-hidden
        ${className}
    `}
    {...props}
  >
    <div className='absolute inset-0 bg-gradient-to-br from-white via-indigo-50 to-purple-50 opacity-20 animate-bg-gradient-flow-diagonal z-0'></div>
    <div className='relative z-10 h-full flex flex-col'>{children}</div>
  </div>
);

// CardContent component for consistent padding and layout
const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 md:p-6 flex-grow flex flex-col ${className}`}>
    {children}
  </div>
);

// Button component with consistent styling and loading state
const Button = ({ children, className = '', disabled = false, loading = false, ...props }) => (
  <button
    className={`px-4 py-2 rounded-xl bg-[black] text-white text-xs font-medium transition-all duration-200 transform hover:scale-105 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? (
      <div className='flex items-center gap-2'>
        <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
        {children}
      </div>
    ) : (
      children
    )}
  </button>
);

// Input component with a more polished look and error handling
const Input = ({ className = '', error = null, ...props }) => (
  <div className='relative'>
    <input
      className={`border ${
        error ? 'border-red-300' : 'border-gray-200'
      } px-4 py-2 rounded-xl w-full bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
      {...props}
    />
    {error && (
      <p className='absolute -bottom-5 left-0 text-red-500 text-xs mt-1 animate-slideDown'>
        {error}
      </p>
    )}
  </div>
);

// Notification system component
const Notification = ({ message, type = 'success', onClose }) => {
  return (
    <div
      className={`px-4 py-3 rounded-lg shadow-lg animate-fadeIn ${
        type === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
      }`}
    >
      <div className='flex items-center gap-2'>
        {type === 'error' ? <FaExclamationTriangle /> : <FaCheck />}
        <span className='text-sm font-medium'>{message}</span>
        <button
          onClick={onClose}
          className='ml-auto text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]'
        >
          &times;
        </button>
      </div>
    </div>
  );
};

// Reusable Pagination component with updated style
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  itemsPerPage,
  loading,
}) => {
  const [pageInput, setPageInput] = useState(currentPage.toString());
  const [pageInputError, setPageInputError] = useState(null);

  useEffect(() => {
    setPageInput(currentPage.toString());
    setPageInputError(null);
  }, [currentPage]);

  const handlePageInputChange = (e) => {
    const value = e.target.value;
    setPageInput(value);
    if (value === '') {
      setPageInputError('Page cannot be empty');
    } else if (!/^\d+$/.test(value)) {
      setPageInputError('Must be a number');
    } else {
      const pageNum = parseInt(value, 10);
      if (pageNum <= 0) {
        setPageInputError('Page must be positive');
      } else if (pageNum > totalPages) {
        setPageInputError(`Max ${totalPages}`);
      } else {
        setPageInputError(null);
      }
    }
  };

  const handlePageSubmit = (e) => {
    e.preventDefault();
    if (pageInputError) return;

    const pageNum = parseInt(pageInput, 10);
    if (pageNum && pageNum > 0 && pageNum <= totalPages) {
      onPageChange(pageNum);
    } else {
      setPageInput(currentPage.toString());
      setPageInputError(null);
    }
  };

  if (totalCount === 0 && !loading) {
    return (
      <div className='text-center py-20 animate-fadeIn'>
        <div className='text-[var(--color-muted)] text-lg mb-2'>
          <span role='img' aria-label='box'>
            📦
          </span>
        </div>
        <div className='text-[var(--color-muted)]'>No proposals found</div>
      </div>
    );
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className='flex flex-col sm:flex-row justify-between items-center mt-6 text-xs gap-4 animate-fadeIn'>
      <span className='text-[var(--color-muted)] transition-all duration-200 hover:text-[var(--color-text)]'>
        {totalCount > 0 ? `Showing ${startItem} - ${endItem} of ${totalCount} results` : ''}
      </span>
      {totalPages > 1 && (
        <div className='flex items-center gap-4'>
          <button
            className='p-3 rounded-full bg-white shadow-sm hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200'
            onClick={() => onPageChange(currentPage > 1 ? currentPage - 1 : 1)}
            disabled={currentPage === 1 || loading}
          >
            <FaArrowLeft className='inline' />
          </button>
          <div className='flex flex-col items-center'>
            <form onSubmit={handlePageSubmit} className='flex items-center gap-2'>
              <span className='text-[var(--color-text)]'>Page</span>
              <Input
                type='text'
                value={pageInput}
                onChange={handlePageInputChange}
                className='w-12 h-8 text-center rounded-lg bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md'
                error={pageInputError}
                onBlur={handlePageSubmit}
              />
              <span className='text-[var(--color-text)]'>of {totalPages}</span>
            </form>
          </div>
          <button
            className='p-3 rounded-full bg-white shadow-sm hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200'
            onClick={() => onPageChange(currentPage < totalPages ? currentPage + 1 : totalPages)}
            disabled={currentPage === totalPages || loading}
          >
            <FaArrowRight className='inline' />
          </button>
        </div>
      )}
    </div>
  );
};

// --- MAIN DASHBOARD COMPONENT ---

export default function ProposalsDashboard() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [proposals, setProposals] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [searchError, setSearchError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const perPage = 10;

  // Notification system
  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications((prev) => [...prev, notification]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const queryParams = new URLSearchParams({ search });

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/proposals?${queryParams.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 403) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch proposals');
      }

      const data = await response.json();
      setProposals(data);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      addNotification('Failed to fetch proposals.', 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate, search]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const sortedData = useMemo(() => {
    const sortableItems = [...proposals];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aVal, bVal;
        if (sortConfig.key === 'createdAt') {
          aVal = new Date(a[sortConfig.key]);
          bVal = new Date(b[sortConfig.key]);
        } else {
          aVal = a[sortConfig.key]?.toString().toLowerCase() || '';
          bVal = b[sortConfig.key]?.toString().toLowerCase() || '';
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [proposals, sortConfig]);

  const filteredData = useMemo(() => {
    const searchLower = search.toLowerCase();
    return sortedData.filter((item) =>
      item.companyName?.toLowerCase().includes(searchLower) ||
      item.clientName?.toLowerCase().includes(searchLower) ||
      item.brandDisplayName?.toLowerCase().includes(searchLower) ||
      item.campaignName?.toLowerCase().includes(searchLower)
    );
  }, [sortedData, search]);

  const paginatedData = useMemo(
    () => filteredData.slice((currentPage - 1) * perPage, currentPage * perPage),
    [filteredData, currentPage, perPage]
  );

  const totalPages = Math.ceil(filteredData.length / perPage);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setSearchError('');
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSortConfig({ key: 'createdAt', direction: 'desc' });
    setCurrentPage(1);
    setSearchError('');
    addNotification('Filters reset successfully');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date)) return '—';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };
  
  // Dynamic badge colors based on label content
  const getBadgeColors = (label) => {
    const lowerLabel = label.toLowerCase();
    switch (lowerLabel) {
      case 'corporate':
        return 'bg-indigo-200 text-indigo-800';
      case 'movie':
        return 'bg-purple-200 text-purple-800';
      case 'other':
        return 'bg-gray-200 text-gray-800';
      case 'pepsico india':
        return 'bg-red-200 text-red-800';
      default:
        // A generic color for unknown or new tags
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-[var(--color-text)] flex flex-col lg:flex-row overflow-hidden'>
      <Navbar />

      {/* Notification System */}
      <div className='fixed top-4 right-4 z-50 space-y-2'>
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => setNotifications((prev) => prev.filter((n) => n.id !== notification.id))}
          />
        ))}
      </div>

      <main
        className={`flex-1 h-full overflow-y-auto px-4 md:px-6 py-8 transition-all duration-300 ${
          isCollapsed ? 'lg:ml-24' : 'lg:ml-64'
        }`}
      >
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6 animate-slideDown'>
          <h2 className='text-2xl font-sans font-normal'>
            Proposals ({filteredData.length})
            {loading && <span className='ml-2 text-sm text-[var(--color-muted)]'>Loading...</span>}
          </h2>
       </div>

        <Card className='mt-6 shadow-xl animate-slideUp bg-gray-100 bg-opacity-80'>
          <CardContent>
            <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
              <div className='w-full md:w-[50%]'>
                <Input
                  className='h-[2.2rem] text-xs'
                  placeholder='Search by Company, Client, Brand, or Campaign'
                  value={search}
                  onChange={handleSearchChange}
                  error={searchError}
                />
              </div>
              <div className='flex items-center gap-2 flex-shrink-0'>
                <div className='w-full md:w-auto'>
                  <select
                    onChange={(e) => {
                      const [key, direction] = e.target.value.split(':');
                      setSortConfig({ key, direction });
                      setCurrentPage(1);
                    }}
                    className='px-4 py-2 rounded-xl w-full bg-white text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[black] transition-all duration-200 shadow-sm hover:shadow-md'
                    value={`${sortConfig.key}:${sortConfig.direction}`}
                  >
                    <option value='createdAt:desc'>Sort by: Latest</option>
                    <option value='createdAt:asc'>Sort by: Oldest</option>
                    <option value='companyName:asc'>Sort by: Company Name (A-Z)</option>
                    <option value='companyName:desc'>Sort by: Company Name (Z-A)</option>
                  </select>
                </div>
                <Button
                  onClick={handleResetFilters}
                  className='bg-gray-700 text-white hover:bg-gray-800 shadow-md hover:shadow-lg'
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='mt-6 relative'>
          {loading ? (
            <div className='absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center z-10'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-8 h-8 border-2 border-[black] border-t-transparent rounded-full animate-spin'></div>
                <div className='text-[var(--color-muted)] text-sm'>
                  Loading proposals...
                </div>
              </div>
            </div>
          ) : (
            <div
              className='grid grid-cols-1 gap-4 w-full animate-slideIn'
            >
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <Card
                    key={item._id}
                    onClick={() => navigate(`/proposal/${item._id}`)}
                    className='animate-slideIn'
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
                      <div className='flex-1 flex flex-col gap-1'>
                        <div className='text-sm font-semibold break-words text-[var(--color-text)]'>
                          {item.companyName || 'Unknown Company'}
                        </div>
                        <div className='text-xs text-[var(--color-muted)]'>
                          Client: {item.clientName || 'N/A'}
                        </div>
                        <div className='text-xs text-[var(--color-muted)]'>
                          Campaign: {item.campaignName || 'N/A'}
                        </div>
                      </div>
                      <div className='flex flex-wrap gap-2 items-center'>
                        {item.clientType && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getBadgeColors(item.clientType)}`}
                          >
                            {item.clientType}
                          </span>
                        )}
                        {item.industry && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getBadgeColors(item.industry)}`}
                          >
                            {item.industry}
                          </span>
                        )}
                         <span className='text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-800'>
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className='text-center py-10 text-[var(--color-muted)]'>
                  No proposals found matching your criteria.
                </div>
              )}
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalCount={filteredData.length}
          itemsPerPage={perPage}
          loading={loading}
        />
      </main>

      {/* Global CSS for Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes bg-gradient-flow-diagonal {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
        .animate-bg-gradient-flow-diagonal {
          background-size: 200% 200%;
          animation: bg-gradient-flow-diagonal 10s linear infinite;
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
        .animate-slideIn { animation: slideIn 0.4s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}