import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { DateRange } from 'react-date-range';
import dayjs from 'dayjs';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

import Navbar from './Navbar';
import RevenueReport from './reports/RevenueReport';
import BookingReport from './reports/BookingReport';
import InventoryReport from './reports/InventoryReport';
import ActivitiesReport from './reports/ActivitiesReport';
import OtherReport from './reports/OtherReport';

// --- REUSABLE UI COMPONENTS ---

// Button component with consistent styling
const Button = ({ children, className = '', ...props }) => (
  <button
    className={`px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-medium transition-all duration-200 transform hover:scale-105 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg ${className}`}
    {...props}
  >
    {children}
  </button>
);

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


// --- MAIN REPORT COMPONENT ---

export default function Report() {
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('revenue');
  const [allBookingsForPayments, setAllBookingsForPayments] = useState([]);
  const [bookingStats, setBookingStats] = useState([]);
  const [loadingCharts, setLoadingCharts] = useState(true);

  const [activeDateModal, setActiveDateModal] = useState(null);
  const [tempDateRange, setTempDateRange] = useState([{ startDate: new Date(), endDate: new Date(), key: 'selection' }]);
  const [currentFilterUpdater, setCurrentFilterUpdater] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Notification system
  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications((prev) => [...prev, notification]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const fetchAllBookingsForPaymentReport = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        localStorage.clear();
        navigate('/login');
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to fetch bookings for payment report');
      }
      const data = await res.json();
      setAllBookingsForPayments(Array.isArray(data.bookings) ? data.bookings : (data || []));
    } catch (err) {
      console.error('Failed to fetch all bookings for payment report:', err);
      addNotification('Failed to fetch payment report data.', 'error');
    }
  };

  const fetchDashboardData = async () => {
    setLoadingCharts(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings/dashboard-stats`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        localStorage.clear();
        navigate('/login');
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      const data = await res.json();
      setBookingStats(data.bookingStats || []);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      addNotification('Failed to fetch dashboard stats.', 'error');
    } finally {
      setLoadingCharts(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchAllBookingsForPaymentReport();
  }, []);

  const formatDateForPicker = (date) => {
    if (!date) return '';
    return dayjs(date).format('YYYY-MM-DD');
  };

  const handleShowDateModal = (filterType, currentFilters, setFilterFunc) => {
    const startDate = currentFilters.startDate ? new Date(currentFilters.startDate) : new Date();
    const endDate = currentFilters.endDate ? new Date(currentFilters.endDate) : new Date();
    setTempDateRange([{ startDate, endDate, key: 'selection' }]);
    setCurrentFilterUpdater(() => setFilterFunc);
    setActiveDateModal(filterType);
  };

  const handleApplyDateFilter = () => {
    if (!currentFilterUpdater) return;
    const newStartDate = formatDateForPicker(tempDateRange[0].startDate);
    const newEndDate = formatDateForPicker(tempDateRange[0].endDate);

    currentFilterUpdater(prev => ({ ...prev, startDate: newStartDate, endDate: newEndDate }));

    setActiveDateModal(null);
    setCurrentFilterUpdater(null);
    addNotification('Date filter applied successfully.');
  };

  const handleCancelDateModal = () => {
    setActiveDateModal(null);
    setCurrentFilterUpdater(null);
    addNotification('Date filter cancelled.', 'error');
  };

  const renderActiveTab = useCallback(() => {
    switch (activeTab) {
      case 'revenue':
        return (
          <RevenueReport
            bookingStats={bookingStats}
            loadingCharts={loadingCharts}
            allBookingsForPayments={allBookingsForPayments}
            handleShowDateModal={handleShowDateModal}
            navigate={navigate}
          />
        );
      case 'bookings':
        return <BookingReport handleShowDateModal={handleShowDateModal} />;
      case 'inventories':
        return <InventoryReport />;
      case 'activities':
        return <ActivitiesReport handleShowDateModal={handleShowDateModal} />;
      case 'other':
        return <OtherReport bookingStats={bookingStats} loadingCharts={loadingCharts} />;
      default:
        return null;
    }
  }, [activeTab, bookingStats, loadingCharts, allBookingsForPayments, navigate, handleShowDateModal]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen h-screen text-[var(--color-text)] flex flex-col lg:flex-row overflow-hidden'>
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

      <main className={`flex-1 h-full overflow-y-auto px-4 md:px-6 py-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <h2 className='text-2xl font-sans font-normal mb-4 animate-slideDown'>Reports</h2>

        <div className='flex border-b-2 border-gray-200 mb-6 gap-x-4 animate-slideIn'>
          {['Revenue', 'Bookings', 'Inventories', 'Activities', 'Other'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`py-2 px-4 text-sm font-medium transition-all duration-300 ease-in-out hover:text-orange-600 ${activeTab === tab.toLowerCase() ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="animate-fadeIn">{renderActiveTab()}</div>

        {activeDateModal && (
          <div
            className='fixed inset-0 text-xs flex items-center justify-center bg-black bg-opacity-50 z-50 animate-fadeIn'
            onClick={handleCancelDateModal}
          >
            <div
              className='bg-white rounded-xl shadow-lg p-2 transform scale-95 animate-scaleIn'
              onClick={(e) => e.stopPropagation()}
            >
              <DateRange
                editableDateInputs={true}
                onChange={(item) => setTempDateRange([item.selection])}
                moveRangeOnFirstSelection={false}
                ranges={tempDateRange}
                className='text-xs'
                rangeColors={['#000000']}
              />
              <div className='flex justify-end gap-2 p-2 pt-0'>
                <Button onClick={handleCancelDateModal} className="bg-gray-700 text-white hover:bg-gray-800">
                  Cancel
                </Button>
                <Button onClick={handleApplyDateFilter}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}
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