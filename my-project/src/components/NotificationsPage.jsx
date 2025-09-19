import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../services/notificationService';
import Navbar from './Navbar';
import { useSidebar } from '../context/SidebarContext';
import {
  FaCheckCircle,
  FaTrashAlt,
  FaBell,
  FaExclamationTriangle,
  FaBullhorn,
  FaStar,
  FaEnvelope,
  FaWrench,
  FaTags,
} from 'react-icons/fa';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

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

// Notification system component (for toasts)
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

// --- Helpers ---
const formatNotificationTitle = (type) => {
  if (!type) return 'Notification';
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getNotificationIcon = (type = '') => {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('alert') || lowerType.includes('expired'))
    return <FaExclamationTriangle className="text-red-500" size={20} />;
  if (lowerType.includes('campaign') || lowerType.includes('reminder'))
    return <FaBullhorn className="text-blue-500" size={20} />;
  if (lowerType.includes('approved') || lowerType.includes('update'))
    return <FaStar className="text-green-500" size={20} />;
  if (lowerType.includes('message'))
    return <FaEnvelope className="text-purple-500" size={20} />;
  if (lowerType.includes('maintenance'))
    return <FaWrench className="text-[var(--color-muted)]" size={20} />;
  if (lowerType.includes('promotion'))
    return <FaTags className="text-yellow-500" size={20} />;
  return <FaBell className="text-[var(--color-muted)]" size={20} />;
};

const groupNotificationsByDate = (notifications) => {
  const groups = { Today: [], Yesterday: [], Older: [] };
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  notifications.forEach((notif) => {
    const notifDate = new Date(notif.createdAt);
    if (notifDate.toDateString() === today.toDateString()) groups.Today.push(notif);
    else if (notifDate.toDateString() === yesterday.toDateString()) groups.Yesterday.push(notif);
    else groups.Older.push(notif);
  });

  return groups;
};

// --- Confirmation Dialogs (refactored with Button component) ---
const DeleteConfirmationDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadeIn">
      <div className="bg-gray-100 p-6 rounded-2xl shadow-lg w-80 text-[var(--color-text)] transform transition-all duration-300 scale-95 hover:scale-100 animate-scaleIn">
        <h2 className='text-lg font-semibold mb-4'>Confirm Deletion</h2>
        <p className="text-sm text-[var(--color-muted)] mb-6">
          Are you sure you want to delete this notification? This action cannot be undone.
        </p>
        <div className='flex justify-end gap-2 text-sm'>
          <Button
            className='bg-gray-700 text-white'
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className='bg-red-500 hover:bg-red-600'
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

const MarkAsReadConfirmationDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadeIn">
      <div className="bg-gray-100 p-6 rounded-2xl shadow-lg w-80 text-[var(--color-text)] transform transition-all duration-300 scale-95 hover:scale-100 animate-scaleIn">
        <h2 className='text-lg font-semibold mb-4'>Confirm Mark as Read</h2>
        <p className="text-sm text-[var(--color-muted)] mb-6">
          Are you sure you want to mark this notification as read?
        </p>
        <div className='flex justify-end gap-2 text-sm'>
          <Button
            className='bg-gray-700 text-white'
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className='bg-[black] hover:bg-[var(--color-primary-dark)]'
            onClick={onConfirm}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

const MarkAllReadConfirmationDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadeIn">
      <div className="bg-gray-100 p-6 rounded-2xl shadow-lg w-80 text-[var(--color-text)] transform transition-all duration-300 scale-95 hover:scale-100 animate-scaleIn">
        <h2 className='text-lg font-semibold mb-4'>Confirm Mark All as Read</h2>
        <p className="text-sm text-[var(--color-muted)] mb-6">
          Are you sure you want to mark all notifications as read?
        </p>
        <div className='flex justify-end gap-2 text-sm'>
          <Button
            className='bg-gray-700 text-white'
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className='bg-[black] hover:bg-[var(--color-primary-dark)]'
            onClick={onConfirm}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isCollapsed } = useSidebar();

  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchError, setSearchError] = useState('');

  const [quickDateFilter, setQuickDateFilter] = useState('all');
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [markAsReadTarget, setMarkAsReadTarget] = useState(null);
  const [isMarkAllReadConfirming, setIsMarkAllReadConfirming] = useState(false);

  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDateRange, setTempDateRange] = useState([{ startDate: new Date(), endDate: new Date(), key: 'selection' }]);

  const addNotification = useCallback((message, type = 'success') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications((prev) => [...prev, notification]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadNotifications = async () => {
      setLoading(true);
      try {
        const res = await getNotifications();
        if (!mounted) return;
        setNotifications(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        addNotification('Failed to load notifications', 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadNotifications();
    return () => { mounted = false; };
  }, [addNotification]);

  const formatDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    setSearchError('');
    const tid = setTimeout(() => {
      if (searchQuery && searchQuery.trim().length < 2) {
        setSearchError('Please enter at least 2 characters to search');
        setDebouncedQuery('');
      } else {
        setDebouncedQuery(searchQuery.trim());
      }
    }, 300);
    return () => clearTimeout(tid);
  }, [searchQuery]);

  const handleQuickDateChange = (e) => {
    const value = e.target.value;
    setQuickDateFilter(value);
    setIsCustomDate(false);
    setDateError('');

    const today = new Date();
    switch (value) {
      case 'thisWeek': {
        const first = today.getDate() - today.getDay();
        const firstDayOfWeek = new Date(today.setDate(first));
        setStartDate(formatDate(firstDayOfWeek));
        setEndDate(formatDate(new Date()));
        break;
      }
      case 'thisMonth': {
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(formatDate(firstDayOfMonth));
        setEndDate(formatDate(new Date()));
        break;
      }
      case 'last3Months': {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        setStartDate(formatDate(threeMonthsAgo));
        setEndDate(formatDate(new Date()));
        break;
      }
      default: // 'all'
        setStartDate('');
        setEndDate('');
        break;
    }
  };

  const handleShowDateModal = () => {
    const initialStartDate = isCustomDate && startDate ? new Date(startDate) : new Date();
    const initialEndDate = isCustomDate && endDate ? new Date(endDate) : new Date();
    setTempDateRange([{ startDate: initialStartDate, endDate: initialEndDate, key: 'selection' }]);
    setShowDateModal(true);
    setDateError('');
  };

  const handleApplyDateFilter = () => {
    const s = tempDateRange[0].startDate;
    const e = tempDateRange[0].endDate;
    if (s > e) {
      setDateError('Start date cannot be after end date');
      return;
    }
    setStartDate(formatDate(s));
    setEndDate(formatDate(e));
    setQuickDateFilter('all');
    setIsCustomDate(true);
    setShowDateModal(false);
    setDateError('');
  };

  const handleCancelDateFilter = useCallback(() => {
    setShowDateModal(false);
    setDateError('');
  }, []);

  const handleResetFilters = () => {
    setFilter('all');
    setSort('newest');
    setSearchQuery('');
    setDebouncedQuery('');
    setQuickDateFilter('all');
    setIsCustomDate(false);
    setStartDate('');
    setEndDate('');
    setTempDateRange([{ startDate: new Date(), endDate: new Date(), key: 'selection' }]);
    setSearchError('');
    setDateError('');
  };

  const requestMarkAsRead = (id) => setMarkAsReadTarget(id);
  const cancelMarkAsRead = () => setMarkAsReadTarget(null);
  const confirmMarkAsRead = async () => {
    if (!markAsReadTarget) return;
    setNotifications((prev) => prev.map((n) => (n._id === markAsReadTarget ? { ...n, read: true } : n)));
    try {
      await markAsRead(markAsReadTarget);
      toast.success('Marked as read');
    } catch (err) {
      setNotifications((prev) => prev.map((n) => (n._id === markAsReadTarget ? { ...n, read: false } : n)));
      toast.error('Failed to mark as read');
    } finally {
      setMarkAsReadTarget(null);
    }
  };

  const requestDelete = (id) => setDeleteTarget(id);
  const cancelDelete = () => setDeleteTarget(null);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const original = [...notifications];
    setNotifications((prev) => prev.filter((n) => n._id !== deleteTarget));
    try {
      await deleteNotification(deleteTarget);
      toast.success('Notification deleted');
    } catch (err) {
      setNotifications(original);
      toast.error('Failed to delete notification');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleMarkAllRead = () => setIsMarkAllReadConfirming(true);
  const cancelMarkAllRead = () => setIsMarkAllReadConfirming(false);
  const confirmMarkAllRead = async () => {
    const original = [...notifications];
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (err) {
      setNotifications(original);
      toast.error('Failed to mark all as read');
    } finally {
      setIsMarkAllReadConfirming(false);
    }
  };

  const processedNotifications = useMemo(() => {
    let filtered = [...notifications];

    if (filter === 'unread') filtered = filtered.filter((n) => !n.read);
    else if (filter === 'read') filtered = filtered.filter((n) => n.read);

    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      filtered = filtered.filter((n) =>
        (n.campaignName && n.campaignName.toLowerCase().includes(q)) ||
        (n.companyName && n.companyName.toLowerCase().includes(q)) ||
        (n.spaceName && n.spaceName.toLowerCase().includes(q)) ||
        (n.message && n.message.toLowerCase().includes(q))
      );
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filtered = filtered.filter((n) => {
        const notifDate = new Date(n.createdAt);
        return notifDate >= start && notifDate <= end;
      });
    }

    filtered.sort((a, b) => {
      const dA = new Date(a.createdAt);
      const dB = new Date(b.createdAt);
      return sort === 'newest' ? dB - dA : dA - dB;
    });

    return groupNotificationsByDate(filtered);
  }, [notifications, filter, sort, debouncedQuery, startDate, endDate]);

  const cardVariants = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-[var(--color-text)] flex flex-col lg:flex-row overflow-hidden">
      <Navbar />
      <main className={`flex-1 h-full overflow-y-auto px-4 md:px-6 py-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 animate-slideDown">
          <h2 className="text-2xl font-sans font-normal">Notifications</h2>
          <Button onClick={handleMarkAllRead}>
            Mark All as Read
          </Button>
        </div>

        {/* Filter Bar */}
        <Card className='mt-6 shadow-xl animate-slideUp bg-gray-100 bg-opacity-80'>
          <CardContent>
            <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
              <div className='w-full flex-1'>
                <Input
                  className='h-[2.2rem] text-xs'
                  placeholder="Search by campaign, company, space or message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  error={searchError}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <select
                  id="filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <option value="all">All Status</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>

                <select
                  id="sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>

                <select
                  id="quickDateFilter"
                  value={quickDateFilter}
                  onChange={handleQuickDateChange}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <option value="all">All Time</option>
                  <option value="thisWeek">This Week</option>
                  <option value="thisMonth">This Month</option>
                  <option value="last3Months">Last 3 Months</option>
                </select>

                <Button
                  onClick={handleShowDateModal}
                  className="w-full sm:w-auto text-xs whitespace-nowrap bg-gray-500 text-black hover:bg-black shadow-sm hover:shadow-md"
                >
                  {isCustomDate && startDate && endDate ? `${startDate} to ${endDate}` : 'Date Filter'}
                </Button>

                <Button
                  onClick={handleResetFilters}
                  className="w-full sm:w-auto text-xs bg-gray-700 hover:bg-gray-800 shadow-sm hover:shadow-md"
                >
                  Reset
                </Button>
              </div>
            </div>
            {dateError && <p className="mt-2 text-xs text-red-500">{dateError}</p>}
          </CardContent>
        </Card>

        {/* Notification List */}
        <div className="space-y-8 mt-6">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-6 w-1/4 bg-gray-200 rounded" />
              <div className="h-32 bg-gray-100 border border-gray-200 rounded-lg" />
            </div>
          ) : Object.values(processedNotifications).every((arr) => arr.length === 0) ? (
            <div className="text-center text-[var(--color-muted)] py-16">
              <div className="text-6xl inline-block">🔕</div>
              <p className="mt-4 text-xl">{notifications.length === 0 ? "You're all caught up!" : 'No notifications match your filters.'}</p>
              <p className="text-sm text-[var(--color-muted)] mt-2">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            Object.entries(processedNotifications).map(([group, notifs]) =>
              notifs.length > 0 && (
                <div key={group}>
                  <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3 ml-1">{group}</h2>
                  <div className="grid grid-cols-1 gap-3">
                    <AnimatePresence>
                      {notifs.map((notif) => (
                        <motion.div
                          key={notif._id}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={cardVariants}
                          transition={{ duration: 0.18 }}
                          className={`rounded-2xl border shadow-sm w-full group ${!notif.read ? 'bg-white border-[black]' : 'bg-gray-100 bg-opacity-80 border-gray-200'}`}
                          layout
                        >
                          <CardContent className="flex items-start justify-between gap-4 p-4 md:p-6">
                            <div className="flex items-start gap-4">
                              {!notif.read && (
                                <div className="w-2.5 h-2.5 rounded-full bg-[black] mt-1.5 flex-shrink-0 animate-pulse" />
                              )}
                              <div className="flex-shrink-0 mt-1">{getNotificationIcon(notif.type)}</div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className={`${!notif.read ? 'font-bold text-[var(--color-text)]' : 'font-semibold text-[var(--color-text)]'} text-base`}>{formatNotificationTitle(notif.type)}</h3>
                                </div>
                                <p className="text-sm text-[var(--color-muted)] break-words max-w-[60ch]">{notif.message}</p>
                                <p className="text-xs text-[var(--color-muted)] mt-1.5">{new Date(notif.createdAt).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {!notif.read && (
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => requestMarkAsRead(notif._id)} className="p-2 rounded-full text-green-600 hover:bg-green-100 transition-colors" title="Mark as read" aria-label="Mark as read">
                                  <FaCheckCircle size={18} />
                                </motion.button>
                              )}
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => requestDelete(notif._id)} className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors" title="Delete" aria-label="Delete notification">
                                <FaTrashAlt size={18} />
                              </motion.button>
                            </div>
                          </CardContent>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </main>

      {/* --- MODALS --- */}
      <DeleteConfirmationDialog isOpen={!!deleteTarget} onConfirm={confirmDelete} onCancel={cancelDelete} />
      <MarkAsReadConfirmationDialog isOpen={!!markAsReadTarget} onConfirm={confirmMarkAsRead} onCancel={cancelMarkAsRead} />
      <MarkAllReadConfirmationDialog isOpen={isMarkAllReadConfirming} onConfirm={confirmMarkAllRead} onCancel={cancelMarkAllRead} />

      {showDateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" onClick={handleCancelDateFilter}>
          <motion.div onClick={(e) => e.stopPropagation()} initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className="bg-white rounded-xl shadow-lg p-2">
            <DateRange
              editableDateInputs={true}
              onChange={(item) => setTempDateRange([item.selection])}
              moveRangeOnFirstSelection={false}
              ranges={tempDateRange}
              rangeColors={['#6366f1']}
              months={1}
              direction="horizontal"
            />
            <div className="flex justify-end gap-2 p-2 border-t border-gray-200">
              <Button onClick={handleCancelDateFilter} className="bg-gray-700 text-white hover:bg-gray-800">Cancel</Button>
              <Button onClick={handleApplyDateFilter} className="bg-[black] text-white hover:opacity-90">Apply</Button>
            </div>
          </motion.div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes bg-gradient-flow-diagonal { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
        .animate-bg-gradient-flow-diagonal { background-size: 200% 200%; animation: bg-gradient-flow-diagonal 10s linear infinite; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
        .animate-slideIn { animation: slideIn 0.4s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}