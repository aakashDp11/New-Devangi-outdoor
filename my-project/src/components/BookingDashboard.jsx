import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import Navbar from './Navbar';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { useSidebar } from '../context/SidebarContext';
import {
  FaArrowLeft,
  FaArrowRight,
  FaExclamationTriangle,
  FaCheck,
} from 'react-icons/fa';

// --- REUSABLE COMPONENTS WITH BORDERLESS DESIGN ---

// Card component with a flowing gradient animation on the background
// --- REUSABLE COMPONENTS WITH BORDERLESS DESIGN ---

// Card component with a flowing gradient animation on the background
const Card = ({ children, className = '', ...props }) => (
  <div
    className={`
      bg-gray-100 bg-opacity-80 shadow-xl rounded-2xl w-full flex flex-col relative overflow-hidden
      ${className}
    `}
    {...props}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white via-indigo-50 to-purple-50 opacity-10 animate-bg-gradient-flow-diagonal z-0"></div>
    <div className="relative z-10 h-full flex flex-col p-6 md:p-8">
      {children}
    </div>
  </div>
);

// CardContent component for consistent padding and layout
const CardContent = ({ children, className = '' }) => (
  <div className={`flex-grow flex flex-col ${className}`}>
    {children}
  </div>
);

// Button component with consistent styling and loading state
const Button = ({ children, className = '', disabled = false, loading = false, ...props }) => (
  <button
    className={`
      px-4 py-2 rounded-xl bg-[black] text-white text-xs font-medium 
      transition-all duration-200 transform 
      hover:scale-105 hover:opacity-90 active:scale-95 
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none 
      shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-black
      ${className}
    `}
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
// Input component with a more polished look and error handling
const Input = ({ className = '', error = null, ...props }) => (
  <div className='relative'>
    <input
      className={`
        border border-gray-200 
        ${error ? 'ring-red-300' : 'focus:ring-[black]'} 
        px-4 py-2 rounded-xl w-full bg-white text-[var(--color-text)] 
        focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm 
        hover:shadow-md hover:ring-2 hover:ring-gray-200
        ${className}
      `}
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
        <button onClick={onClose} className='ml-auto text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]'>
          &times;
        </button>
      </div>
    </div>
  );
};

// SortableHeader component with matching icons and animations
const SortableHeader = ({ title, sortKey, sortConfig, setSortConfig }) => {
  const isSorting = sortConfig.key === sortKey;
  const direction = isSorting ? sortConfig.direction : null;

  const handleSort = () => {
    setSortConfig((prev) => ({
      key: sortKey,
      direction: prev.key === sortKey && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <th scope='col' className='px-6 py-3'>
      <div
        onClick={handleSort}
        className='flex items-center gap-1.5 cursor-pointer select-none text-[var(--color-text)] hover:text-[black] transition-all duration-200 hover:scale-105 active:scale-95'
      >
        {title}
        <span
          className={`text-[var(--color-muted)] transition-all duration-200 ${
            isSorting ? 'text-[black] scale-110' : ''
          }`}
        >
          {direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '⇅'}
        </span>
      </div>
    </th>
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
      setPageInputError(null); // Clear error if input reset
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
        <div className='text-[var(--color-muted)]'>No bookings found</div>
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
                onBlur={handlePageSubmit} // Apply validation on blur
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

// --- NEW MODAL COMPONENT ---
const Modal = ({ children, onClose }) => {
  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-scaleIn'
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function BookingsDashboard() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: null,
      endDate: null,
      key: 'selection',
    },
  ]);
  const [tempDateRange, setTempDateRange] = useState([
    {
      startDate: null,
      endDate: null,
      key: 'selection',
    },
  ]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const datePickerRef = useRef(null);

  const limit = 10;

  // Notification system
  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications((prev) => [...prev, notification]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date)) return '—';
    return format(date, 'dd/MM/yyyy');
  };

  const getUpcomingCampaignDate = (campaigns, type = 'startDate') => {
    if (!campaigns?.length) return null;
    const sorted = campaigns
      .filter((c) => c[type])
      .sort((a, b) => new Date(a[type]) - new Date(b[type]));
    return sorted[0]?.[type] || null;
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('accessToken');

    try {
      const startDateParam = dateRange[0].startDate
        ? format(dateRange[0].startDate, 'yyyy-MM-dd')
        : '';
      const endDateParam = dateRange[0].endDate
        ? format(dateRange[0].endDate, 'yyyy-MM-dd')
        : '';

      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: limit,
        search: search,
      });

      if (startDateParam) {
        queryParams.append('startDate', startDateParam);
      }
      if (endDateParam) {
        queryParams.append('endDate', endDateParam);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/bookings/filter-by-date?${queryParams.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 403) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.message);
      setBookings([]);
      setTotalPages(1);
      setTotalCount(0);
      addNotification('Failed to fetch bookings', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, search, dateRange, navigate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleApplyDateFilters = () => {
    const { startDate: start, endDate: end } = tempDateRange[0];

    if (start && end && start > end) {
      addNotification('Start date cannot be after end date', 'error');
      return;
    }
    setDateRange(tempDateRange);
    setCurrentPage(1);
    setShowDateModal(false);
    if (start && end) {
      addNotification('Date filter applied successfully');
    }
  };

  const handleCancelDateFilter = () => {
    setShowDateModal(false);
    setTempDateRange(dateRange);
  };

  const handleClearAllFilters = () => {
    setSearch('');
    setDateRange([{ startDate: null, endDate: null, key: 'selection' }]);
    setTempDateRange([{ startDate: null, endDate: null, key: 'selection' }]);
    setCurrentPage(1);
    setSortConfig({ key: '', direction: 'asc' });
    addNotification('Filters reset successfully');
  };

  const sortedData = useMemo(() => {
    const sortableItems = [...bookings];
    const { key, direction } = sortConfig;
    if (!key) return sortableItems;

    return sortableItems.sort((a, b) => {
      if (key === 'upcomingStartDate' || key === 'upcomingEndDate') {
        const aDate = getUpcomingCampaignDate(
          a.campaigns,
          key === 'upcomingStartDate' ? 'startDate' : 'endDate'
        );
        const bDate = getUpcomingCampaignDate(
          b.campaigns,
          key === 'upcomingStartDate' ? 'startDate' : 'endDate'
        );
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1; // Null dates go to the end
        if (!bDate) return -1; // Null dates go to the end
        return direction === 'asc' ? new Date(aDate) - new Date(bDate) : new Date(bDate) - new Date(aDate);
      }

      if (key === 'createdAt') {
        const aDate = a[key] ? new Date(a[key]) : null;
        const bDate = b[key] ? new Date(b[key]) : null;
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      const aVal = a[key]?.toString().toLowerCase() || '';
      const bVal = b[key]?.toString().toLowerCase() || '';
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [bookings, sortConfig]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 h-screen w-screen text-[var(--color-text)] flex flex-col lg:flex-row overflow-hidden'>
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
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate(-1)} className="text-white bg-black">
              <FaArrowLeft className="inline mr-2" /> Back
            </Button>
            <h2 className='text-2xl font-sans font-normal'>
              Bookings ({totalCount})
              {loading && <span className='ml-2 text-sm text-[var(--color-muted)]'>Loading...</span>}
            </h2>
          </div>
          <Button onClick={() => navigate('/create-booking')}>+ Create Booking</Button>
        </div>

        <Card className='mt-6 shadow-xl animate-slideUp'>
          <CardContent>
            <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
              <div className='w-full md:w-[50%]'>
                <Input
                  className='h-[2rem] text-xs'
                  placeholder='Search Bookings (Company, Client, Brand)'
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className='flex items-center gap-2 flex-shrink-0'>
                <div className='relative w-full md:w-auto'>
                  <button
                    onClick={() => {
                      setTempDateRange(dateRange);
                      setShowDateModal((prev) => !prev);
                    }}
                    className='px-4 py-2 rounded-xl hover:bg-gray-100 hover:ring-2 ring-[black] w-full text-left bg-white text-[var(--color-text)] transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md text-xs'
                  >
                    {dateRange[0].startDate && dateRange[0].endDate
                      ? `${formatDate(dateRange[0].startDate)} to ${formatDate(
                          dateRange[0].endDate
                        )}`
                      : 'Date Filter'}
                  </button>
                </div>
                <Button
                  onClick={handleClearAllFilters}
                  className='bg-gray-700 text-white hover:bg-gray-800 shadow-md hover:shadow-lg'
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='mt-6 relative'>
          {loading && (
            <div className='absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center z-10'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-8 h-8 border-2 border-[black] border-t-transparent rounded-full animate-spin'></div>
                <div className='text-[var(--color-muted)] text-sm'>
                  Loading bookings...
                </div>
              </div>
            </div>
          )}

          <Card className='shadow-lg rounded-xl animate-slideUp bg-gray-100 bg-opacity-90'>
            <div className='overflow-x-auto'>
              <table className='w-full text-xs text-left text-[var(--color-muted)]'>
                <thead className='text-xs text-[var(--color-text)] uppercase bg-gray-100'>
                  <tr>
                    <th scope='col' className='px-6 py-3 rounded-tl-xl'>
                      #
                    </th>
                    <SortableHeader
                      title='Booking ID'
                      sortKey='_id'
                      sortConfig={sortConfig}
                      setSortConfig={setSortConfig}
                    />
                    <SortableHeader
                      title='Company Name'
                      sortKey='companyName'
                      sortConfig={sortConfig}
                      setSortConfig={setSortConfig}
                    />
                    <SortableHeader
                      title='Client Name'
                      sortKey='clientName'
                      sortConfig={sortConfig}
                      setSortConfig={setSortConfig}
                    />
                    <SortableHeader
                      title='Booking Date'
                      sortKey='createdAt'
                      sortConfig={sortConfig}
                      setSortConfig={setSortConfig}
                    />
                    <SortableHeader
                      title='Upcoming Start Date'
                      sortKey='upcomingStartDate'
                      sortConfig={sortConfig}
                      setSortConfig={setSortConfig}
                    />
                    <SortableHeader
                      title='Upcoming End Date'
                      sortKey='upcomingEndDate'
                      sortConfig={sortConfig}
                      setSortConfig={setSortConfig}
                    />
                  </tr>
                </thead>
                <tbody>
                  {error ? (
                    <tr>
                      <td colSpan='7' className='text-center py-8 text-red-500'>
                        Error: {error}
                      </td>
                    </tr>
                  ) : sortedData.length === 0 && !loading ? (
                    <tr>
                      <td colSpan='7' className='text-center py-8 text-[var(--color-muted)]'>
                        No bookings found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    sortedData.map((item, index) => {
                      const upcomingStart = getUpcomingCampaignDate(item.campaigns, 'startDate');
                      const upcomingEnd = getUpcomingCampaignDate(item.campaigns, 'endDate');
                      return (
                        <tr
                          key={item._id}
                          className={`
                            border-b border-gray-200 hover:bg-gray-100 cursor-pointer 
                            transition-all duration-200 ease-in-out transform hover:scale-[1.005] 
                            animate-slideIn
                            ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                          `}
                          style={{ animationDelay: `${index * 50}ms` }}
                          onClick={() => navigate(`/booking/${item._id}`)}
                        >
                          <td className='px-6 py-4 text-[var(--color-muted)]'>
                            {(currentPage - 1) * limit + index + 1}
                          </td>
                          <td className='px-6 py-4 font-mono text-[var(--color-muted)]'>
                            {item._id?.substring(0, 6).toUpperCase() || 'N/A'}
                          </td>
                          <td className='px-6 py-4 font-medium text-[var(--color-text)] whitespace-nowrap'>
                            {item.companyName || 'No Company'}
                          </td>
                          <td className='px-6 py-4 text-[var(--color-text)]'>
                            {item.clientName || 'No Client'}
                          </td>
                          <td className='px-6 py-4 text-[var(--color-text)]'>
                            {formatDate(item.createdAt)}
                          </td>
                          <td className='px-6 py-4 text-[var(--color-text)]'>
                            {formatDate(upcomingStart)}
                          </td>
                          <td className='px-6 py-4 text-[var(--color-text)]'>
                            {formatDate(upcomingEnd)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalCount={totalCount}
          itemsPerPage={limit}
          loading={loading}
        />
      </main>
      
      {/* Date Picker Modal */}
      {showDateModal && (
        <Modal onClose={handleCancelDateFilter}>
          <div className='p-6'>
            <h3 className='text-lg font-semibold text-[var(--color-text)] mb-4'>Select Date Range</h3>
            <div className='flex justify-center'>
              <DateRange
                editableDateInputs={true}
                onChange={(item) => setTempDateRange([item.selection])}
                moveRangeOnFirstSelection={false}
                ranges={tempDateRange}
                className='text-xs w-full'
                rangeColors={['#000000']}
                showDateDisplay={false}
              />
            </div>
            <div className='flex justify-end gap-2 mt-4'>
              <button
                onClick={handleCancelDateFilter}
                className='px-4 py-1.5 rounded-md bg-gray-100 text-[var(--color-text)] hover:bg-gray-200 transition-all duration-200 hover:scale-105'
              >
                Cancel
              </button>
              <Button onClick={handleApplyDateFilters}>Apply</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}