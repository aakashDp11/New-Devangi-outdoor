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

// --- UI Components ---
const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

const DeleteConfirmationDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[var(--color-surface)] rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-[var(--color-text)]">Confirm Deletion</h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Are you sure you want to delete this Notification? This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-[var(--color-text)] bg-[var(--color-muted-light)] rounded-md hover:bg-[var(--color-hover)]">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-danger)] rounded-md hover:bg-[var(--color-danger-hover)]">Delete</button>
        </div>
      </div>
    </div>
  );
};

const MarkAsReadConfirmationDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[var(--color-surface)] rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-[var(--color-text)]">Confirm Mark as Read</h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Are you sure you want to mark this notification as read? This action cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-[var(--color-text)] bg-[var(--color-muted-light)] rounded-md hover:bg-[var(--color-hover)]">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-md hover:opacity-90">Confirm</button>
        </div>
      </div>
    </div>
  );
};

const MarkAllReadConfirmationDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[var(--color-surface)] rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-[var(--color-text)]">Confirm Mark All as Read</h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Are you sure you want to mark all notifications as read? This action cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-[var(--color-text)] bg-[var(--color-muted-light)] rounded-md hover:bg-[var(--color-hover)]">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-md hover:opacity-90">Confirm</button>
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

  // State for filters
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

  // State for confirmation dialogs
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [markAsReadTarget, setMarkAsReadTarget] = useState(null);
  const [isMarkAllReadConfirming, setIsMarkAllReadConfirming] = useState(false);

  // State for date picker modal
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDateRange, setTempDateRange] = useState([{ startDate: new Date(), endDate: new Date(), key: 'selection' }]);

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
        toast.error('Failed to load notifications');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadNotifications();
    return () => { mounted = false; };
  }, []);

  // --- UPDATED: ROBUST AND RELIABLE DATE FORMATTING ---
  const formatDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Debounce search input (inline runtime validation: require >=2 chars or empty)
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

  // --- DATE FILTER LOGIC ---
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

  // --- NOTIFICATION ACTION HANDLERS ---
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

  // --- FILTERING AND SORTING LOGIC ---
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

  // animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] h-screen w-screen flex flex-col lg:flex-row overflow-hidden">
      <Navbar />
      <main className={`flex-1 h-full overflow-y-auto px-4 md:px-8 py-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 className="text-2xl font-sans font-normal">Notifications</h2>
          <div className="flex items-center gap-3">
            <button onClick={handleMarkAllRead} className="px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-md hover:opacity-90 transition-colors text-xs font-medium">
              Mark All as Read
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-[var(--color-surface)] rounded-lg shadow-sm border border-[var(--color-border)] mb-8">
          <div className="flex flex-col md:flex-row gap-2 items-center">
            <div className="flex-1 w-full">
              <input
                type="text"
                placeholder="Search by campaign, company, space or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                aria-label="Search notifications"
              />
              {searchError && <p className="mt-1 text-xs text-red-500">{searchError}</p>}
            </div>

            <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              >
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>

              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>

              <select
                id="quickDateFilter"
                value={quickDateFilter}
                onChange={handleQuickDateChange}
                className="w-full sm:w-auto px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              >
                <option value="all">All Time</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="last3Months">Last 3 Months</option>
              </select>

              <button
                onClick={handleShowDateModal}
                className="w-full sm:w-auto px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] rounded-md hover:bg-[var(--color-hover)] text-xs whitespace-nowrap"
              >
                {isCustomDate && startDate && endDate ? `${startDate} to ${endDate}` : 'Date Filter'}
              </button>

              <button
                onClick={handleResetFilters}
                className="w-full sm:w-auto px-4 py-2 bg-[var(--color-muted-light)] text-[var(--color-text)] rounded-md hover:bg-[var(--color-hover)] text-xs font-medium"
              >
                Reset
              </button>
            </div>
          </div>
          {dateError && <p className="mt-2 text-xs text-red-500">{dateError}</p>}
        </div>

        {/* Notification List */}
        <div className="space-y-8">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-6 w-1/4 bg-[var(--color-muted-light)] rounded" />
              <div className="h-32 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg" />
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
                          className={`border shadow-sm rounded-lg w-full group ${!notif.read ? 'bg-[var(--color-primary-light)] border-[var(--color-primary)]' : 'bg-[var(--color-surface)] border-[var(--color-border)]'}`}
                          layout
                        >
                          <CardContent className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              {!notif.read && (
                                <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] mt-1.5 flex-shrink-0 animate-pulse" />
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
          <motion.div onClick={(e) => e.stopPropagation()} initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className="bg-[var(--color-surface)] rounded-xl shadow-lg p-2">
            <DateRange
              editableDateInputs={true}
              onChange={(item) => setTempDateRange([item.selection])}
              moveRangeOnFirstSelection={false}
              ranges={tempDateRange}
              rangeColors={['#000000']}
              months={1}
              direction="horizontal"
            />
            <div className="flex justify-end gap-2 p-2 border-t border-[var(--color-border)]">
              <button onClick={handleCancelDateFilter} className="px-4 py-1.5 rounded-md bg-[var(--color-muted-light)] text-[var(--color-text)] hover:bg-[var(--color-hover)] font-medium text-sm">Cancel</button>
              <button onClick={handleApplyDateFilter} className="px-4 py-1.5 rounded-md bg-[var(--color-primary)] text-white hover:opacity-90 font-medium text-sm">Apply</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
