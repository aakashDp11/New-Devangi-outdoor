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

// Import the date range picker and its CSS
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file

// --- Helpers ---
const formatNotificationTitle = (type) => {
  if (!type) return 'Notification';
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getNotificationIcon = (type = '') => {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('alert') || lowerType.includes('expired')) return <FaExclamationTriangle className="text-red-500" size={20} />;
  if (lowerType.includes('campaign') || lowerType.includes('reminder')) return <FaBullhorn className="text-blue-500" size={20} />;
  if (lowerType.includes('approved') || lowerType.includes('update')) return <FaStar className="text-green-500" size={20} />;
  if (lowerType.includes('message')) return <FaEnvelope className="text-purple-500" size={20} />;
  if (lowerType.includes('maintenance')) return <FaWrench className="text-gray-600" size={20} />;
  if (lowerType.includes('promotion')) return <FaTags className="text-yellow-500" size={20} />;
  return <FaBell className="text-gray-400" size={20} />;
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
const Card = ({ children, className = '', ...props }) => (
  <div className={`border shadow-sm rounded-lg w-full group ${className}`} {...props}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

const DeleteConfirmationDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
        <p className="mt-2 text-sm text-gray-600">
          Are you sure you want to delete this Notification? This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
};

const MarkAsReadConfirmationDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-gray-900">Confirm Mark as Read</h3>
        <p className="mt-2 text-sm text-gray-600">Are you sure you want to mark this notification as read? This action cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Confirm</button>
        </div>
      </div>
    </div>
  );
};

const MarkAllReadConfirmationDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-gray-900">Confirm Mark All as Read</h3>
        <p className="mt-2 text-sm text-gray-600">Are you sure you want to mark all notifications as read? This action cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Confirm</button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---
const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isCollapsed } = useSidebar();

  // State for filters
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickDateFilter, setQuickDateFilter] = useState('all');
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // State for confirmation dialogs
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [markAsReadTarget, setMarkAsReadTarget] = useState(null);
  const [isMarkAllReadConfirming, setIsMarkAllReadConfirming] = useState(false);
  
  // State for date picker modal
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDateRange, setTempDateRange] = useState([{ startDate: new Date(), endDate: new Date(), key: 'selection' }]);

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      try {
        const res = await getNotifications();
        setNotifications(res.data);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();
  }, []);
  
  // --- UPDATED: ROBUST AND RELIABLE DATE FORMATTING ---
  const formatDate = (date) => {
    if (!date) return '';
    // These methods get the date parts from the user's local timezone.
    const year = date.getFullYear();
    // getMonth() is 0-indexed, so we add 1. padStart ensures '09' instead of '9'.
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // --- DATE FILTER LOGIC ---
  const handleQuickDateChange = (e) => {
    const value = e.target.value;
    setQuickDateFilter(value);
    setIsCustomDate(false); // A quick filter is not a custom date

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
  };
  
  const handleApplyDateFilter = () => {
    setStartDate(formatDate(tempDateRange[0].startDate));
    setEndDate(formatDate(tempDateRange[0].endDate));
    setQuickDateFilter('all'); // Reset quick filter dropdown
    setIsCustomDate(true); // Mark that a custom date is active
    setShowDateModal(false);
  };

  const handleCancelDateFilter = useCallback(() => {
    setShowDateModal(false);
  }, []);

  const handleResetFilters = () => {
    setFilter('all');
    setSort('newest');
    setSearchQuery('');
    setQuickDateFilter('all');
    setIsCustomDate(false);
    setStartDate('');
    setEndDate('');
    setTempDateRange([{ startDate: new Date(), endDate: new Date(), key: 'selection' }]);
  };

  // --- NOTIFICATION ACTION HANDLERS ---
  const requestMarkAsRead = (id) => setMarkAsReadTarget(id);
  const cancelMarkAsRead = () => setMarkAsReadTarget(null);
  const confirmMarkAsRead = async () => {
    if (!markAsReadTarget) return;
    setNotifications((prev) => prev.map((n) => (n._id === markAsReadTarget ? { ...n, read: true } : n)));
    try {
      await markAsRead(markAsReadTarget);
    } catch {
      setNotifications((prev) => prev.map((n) => (n._id === markAsReadTarget ? { ...n, read: false } : n)));
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
    } catch {
      setNotifications(original);
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
    } catch {
      setNotifications(original);
    } finally {
      setIsMarkAllReadConfirming(false);
    }
  };

  // --- FILTERING AND SORTING LOGIC ---
  const processedNotifications = useMemo(() => {
    let filtered = [...notifications];

    if (filter === 'unread') filtered = filtered.filter((n) => !n.read);
    else if (filter === 'read') filtered = filtered.filter((n) => n.read);
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((n) => 
        n.campaignName?.toLowerCase().includes(q) ||
        n.companyName?.toLowerCase().includes(q) ||
        n.spaceName?.toLowerCase().includes(q)
      );
    }
    
    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        filtered = filtered.filter(n => {
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
  }, [notifications, filter, sort, searchQuery, startDate, endDate]);

  return (
    <div className="min-h-screen bg-gray-50 h-screen w-screen flex flex-col lg:flex-row overflow-hidden">
      <Navbar />
      <main className={`flex-1 h-full overflow-y-auto px-4 md:px-8 py-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
           <h2 className="text-2xl font-sans font-normal">Notifications</h2>
          <button onClick={handleMarkAllRead} className="px-3 py-1.5 mt-4 md:mt-0 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-xs font-medium">
            Mark All as Read
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-white rounded-lg shadow-sm border mb-8">
            <div className="flex flex-col md:flex-row gap-2 items-center">
                <input
                    type="text"
                    placeholder="Search by campaign, company, or space..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <select 
                        id="filter" 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value)} 
                        className="w-full sm:w-auto px-3 py-2 border border-gray-300 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="all">All Status</option>
                        <option value="unread">Unread</option>
                        <option value="read">Read</option>
                    </select>

                    <select 
                        id="sort" 
                        value={sort} 
                        onChange={(e) => setSort(e.target.value)} 
                        className="w-full sm:w-auto px-3 py-2 border border-gray-300 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>

                    <select
                        id="quickDateFilter"
                        value={quickDateFilter}
                        onChange={handleQuickDateChange}
                        className="w-full sm:w-auto px-3 py-2 border border-gray-300 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="all">All Time</option>
                        <option value="thisWeek">This Week</option>
                        <option value="thisMonth">This Month</option>
                        <option value="last3Months">Last 3 Months</option>
                    </select>

                    <button 
                        onClick={handleShowDateModal} 
                        className="w-full sm:w-auto px-3 py-2 border border-gray-300 bg-white rounded-md hover:bg-gray-50 text-xs whitespace-nowrap"
                    >
                        {isCustomDate && startDate && endDate ? `${startDate} to ${endDate}` : "Date Filter"}
                    </button>
                    
                    <button
                        onClick={handleResetFilters}
                        className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-xs font-medium"
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>

        {/* Notification List */}
        <div className="space-y-8">
          {loading ? (
            <p className="text-center text-gray-500">Loading notifications...</p>
          ) : Object.values(processedNotifications).every((arr) => arr.length === 0) ? (
            <div className="text-center text-gray-500 py-16">
              <div className="text-6xl inline-block">🔕</div>
              <p className="mt-4 text-xl">{notifications.length === 0 ? "You're all caught up!" : "No notifications match your filters."}</p>
              <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            Object.entries(processedNotifications).map(([group, notifs]) =>
              notifs.length > 0 && (
                <div key={group}>
                  <h2 className="text-lg font-semibold text-gray-700 mb-3 ml-1">{group}</h2>
                  <div className="grid grid-cols-1 gap-3">
                    {notifs.map((notif) => (
                      <Card
                        key={notif._id}
                        className={`transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                          !notif.read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                        }`}
                      >
                        <CardContent className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            {!notif.read && (
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0 animate-pulse"></div>
                            )}
                            <div className="flex-shrink-0 mt-1">{getNotificationIcon(notif.type)}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className={`text-base ${!notif.read ? 'font-bold text-gray-800' : 'font-semibold text-gray-700'}`}>
                                  {formatNotificationTitle(notif.type)}
                                </h3>
                              </div>
                              <p className="text-sm text-gray-600">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-1.5">{new Date(notif.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {!notif.read && (
                              <button onClick={() => requestMarkAsRead(notif._id)} className="p-2 rounded-full text-green-600 hover:bg-green-100 transition-colors" title="Mark as read">
                                <FaCheckCircle size={18} />
                              </button>
                            )}
                            <button onClick={() => requestDelete(notif._id)} className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors" title="Delete">
                              <FaTrashAlt size={18} />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
            <div className="bg-white rounded-xl shadow-lg p-2" onClick={(e) => e.stopPropagation()}>
              <DateRange
                editableDateInputs={true}
                onChange={item => setTempDateRange([item.selection])}
                moveRangeOnFirstSelection={false}
                ranges={tempDateRange}
                rangeColors={['#000000']}
                months={1}
                direction="horizontal"
              />
              <div className="flex justify-end gap-2 p-2 border-t">
                <button onClick={handleCancelDateFilter} className="px-4 py-1.5 rounded-md bg-gray-200 text-black hover:bg-gray-300 font-medium text-sm">Cancel</button>
                <button onClick={handleApplyDateFilter} className="px-4 py-1.5 rounded-md bg-black text-white hover:bg-gray-800 font-medium text-sm">Apply</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default NotificationsPage;