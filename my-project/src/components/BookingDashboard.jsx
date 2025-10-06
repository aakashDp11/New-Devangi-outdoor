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
    FaTimes,
} from 'react-icons/fa';

// --- UI HELPER COMPONENTS (Pulled/Copied from InventoryDashboard for consistency) ---

const ValidationMessage = ({ message, type = 'error' }) => {
    if (!message) return null;
    return (
        <div className={`flex items-center gap-2 mt-1 text-xs animate-slideDown ${
            type === 'error' ? 'text-red-500' : 'text-green-500'
        }`}>
            {type === 'error' ? <FaExclamationTriangle /> : <FaCheck />}
            {message}
        </div>
    );
};

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

const CardContent = ({ children, className = '' }) => (
    <div className={`flex-grow flex flex-col ${className}`}>
        {children}
    </div>
);

const Button = ({ children, className = '', disabled = false, loading = false, ...props }) => (
    <button
        className={`
            px-4 py-2 rounded-xl bg-black text-white text-xs font-medium 
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

const Input = ({ className = '', ...props }) => (
    <input
        className={`
            px-4 py-2 rounded-xl w-full bg-white text-black 
            focus:outline-none focus:ring-2 focus:ring-black transition-all duration-200 shadow-sm 
            hover:shadow-md hover:ring-2 hover:ring-gray-200 text-xs
            ${className}
        `}
        {...props}
    />
);

const Notification = ({ message, type = 'success', onClose }) => {
    return (
        <div
            className={`px-4 py-3 rounded-lg shadow-lg animate-fadeIn border ${
                type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'
            }`}
        >
            <div className='flex items-center gap-2'>
                {type === 'error' ? <FaExclamationTriangle /> : <FaCheck />}
                <span className='text-sm font-medium'>{message}</span>
                <button onClick={onClose} className='ml-auto text-sm text-gray-500 hover:text-black'>
                    <FaTimes className="w-3 h-3"/>
                </button>
            </div>
        </div>
    );
};

// Updated Pagination to be consistent with InventoryDashboard
const Pagination = ({ currentPage, totalPages, onPageChange, totalCount, itemsPerPage, loading }) => {
    const [pageInput, setPageInput] = useState(currentPage.toString());
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        setPageInput(currentPage.toString());
        setValidationError('');
    }, [currentPage]);

    const validatePageInput = (value) => {
        const pageNum = parseInt(value, 10);
        if (!value) return "Page number required";
        if (isNaN(pageNum)) return "Must be a number";
        if (pageNum < 1) return "Must be at least 1";
        if (pageNum > totalPages) return `Must be at most ${totalPages}`;
        return null;
    };

    const handlePageSubmit = (e) => {
        e.preventDefault();
        const error = validatePageInput(pageInput);
        if (error) {
            setValidationError(error);
            return;
        }
        const pageNum = parseInt(pageInput, 10);
        onPageChange(pageNum);
        setValidationError('');
    };

    const handleInputChange = (e) => {
        setPageInput(e.target.value);
        const error = validatePageInput(e.target.value);
        setValidationError(error);
    };

    if (totalCount === 0 || totalPages <= 1) return null; 

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalCount);

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 text-xs gap-4 animate-slideUp">
            <span className="text-gray-600 transition-all duration-200 hover:text-black">
                Showing {startItem} - {endItem} of {totalCount} results
            </span>
            {totalPages > 1 && (
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onPageChange(currentPage > 1 ? currentPage - 1 : 1)}
                        className="p-3 rounded-full bg-white shadow-sm hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200 text-black"
                        disabled={currentPage === 1 || loading}
                    >
                        <FaArrowLeft className='inline' />
                    </button>
                    <div className="flex flex-col items-center">
                        <form onSubmit={handlePageSubmit} className="flex items-center gap-2">
                            <span className="text-black">Page</span>
                            <input
                                type="text"
                                value={pageInput}
                                onChange={handleInputChange}
                                onBlur={handlePageSubmit} // Apply on blur as well
                                className={`w-12 h-8 text-center rounded-lg bg-white text-black focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                                    validationError ? 'ring-red-300' : 'ring-black'
                                }`}
                            />
                            <span className="text-black">of {totalPages}</span>
                        </form>
                        {/* Using ValidationMessage for consistent error display */}
                        <ValidationMessage message={validationError} />
                    </div>
                    <button
                        onClick={() => onPageChange(currentPage < totalPages ? currentPage + 1 : totalPages)}
                        className="p-3 rounded-full bg-white shadow-sm hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200 text-black"
                        disabled={currentPage === totalPages || loading}
                    >
                        <FaArrowRight className='inline' />
                    </button>
                </div>
            )}
        </div>
    );
};

const Modal = ({ children, onClose }) => {
    return (
        <div
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn'
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

const SortableHeader = ({ title, sortKey, sortConfig, setSortConfig, className = '' }) => {
    const isSorting = sortConfig.key === sortKey;
    const direction = isSorting ? sortConfig.direction : null;
    const handleSort = () => setSortConfig(prev => ({
        key: sortKey,
        direction: prev.key === sortKey && prev.direction === 'asc' ? 'desc' : 'asc'
    }));

    return (
        <th scope="col" className={`px-6 py-4 ${className}`}>
            <div
                onClick={handleSort}
                className="flex items-center gap-1.5 cursor-pointer select-none text-black hover:text-gray-700 transition-all duration-200 hover:scale-105 active:scale-95"
            >
                {title}
                <span className={`text-gray-400 transition-all duration-200 ${isSorting ? 'text-black scale-110' : ''}`}>
                    {direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '⇅'}
                </span>
            </div>
        </th>
    );
};

// --- NEW BookingsTableView Component (Styled like InventoryTableView) ---
const BookingsTableView = ({ data, currentPage, limit, navigate, sortConfig, setSortConfig, formatDate, getUpcomingCampaignDate }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="bg-white shadow-xl rounded-xl animate-slideUp w-full overflow-hidden border border-gray-200">
            <div className="overflow-x-auto w-full">
                <table className="w-full text-xs text-left text-gray-600">
                    <thead className="text-xs text-black uppercase bg-gray-100 sticky top-0 z-10 border-b border-gray-300">
                        <tr className="border-b-2 border-gray-200">
                            {/* Table Headers with InventoryDashboard styling */}
                            <th scope='col' className='px-6 py-4 rounded-tl-xl'>#</th>
                            <SortableHeader title='Booking ID' sortKey='_id' sortConfig={sortConfig} setSortConfig={setSortConfig} />
                            <SortableHeader title='Company Name' sortKey='companyName' sortConfig={sortConfig} setSortConfig={setSortConfig} />
                            <SortableHeader title='Client Name' sortKey='clientName' sortConfig={sortConfig} setSortConfig={setSortConfig} />
                            <SortableHeader title='Booking Date' sortKey='createdAt' sortConfig={sortConfig} setSortConfig={setSortConfig} />
                            <SortableHeader title='Upcoming Start Date' sortKey='upcomingStartDate' sortConfig={sortConfig} setSortConfig={setSortConfig} />
                            <SortableHeader title='Upcoming End Date' sortKey='upcomingEndDate' sortConfig={sortConfig} setSortConfig={setSortConfig} className="rounded-tr-xl" />
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => {
                            const upcomingStart = getUpcomingCampaignDate(item.campaigns, 'startDate');
                            const upcomingEnd = getUpcomingCampaignDate(item.campaigns, 'endDate');
                            return (
                                <tr
                                    key={item._id}
                                    className={`
                                        transition-all duration-200 animate-slideIn border-b border-gray-100 last:border-b-0
                                        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} 
                                        hover:bg-indigo-50/50 hover:shadow-inner cursor-pointer
                                    `}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    onClick={() => navigate(`/booking/${item._id}`)}
                                >
                                    <td className='px-6 py-4 text-gray-500 transition-all duration-200 hover:text-black'>
                                        {(currentPage - 1) * limit + index + 1}
                                    </td>
                                    <td className='px-6 py-4 font-mono text-xs text-gray-500 hover:text-black transition-all duration-200'>
                                        {item._id?.slice(-8).toUpperCase() || 'N/A'}
                                    </td>
                                    <td className='px-6 py-4 font-medium text-black whitespace-nowrap'>
                                        {item.companyName || 'No Company'}
                                    </td>
                                    <td className='px-6 py-4 text-black'>
                                        {item.clientName || 'No Client'}
                                    </td>
                                    <td className='px-6 py-4 text-black'>
                                        {formatDate(item.createdAt)}
                                    </td>
                                    <td className='px-6 py-4 text-black'>
                                        {formatDate(upcomingStart)}
                                    </td>
                                    <td className='px-6 py-4 text-black'>
                                        {formatDate(upcomingEnd)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- CORE LOGIC COMPONENT (BOOKINGSDASHBOARD) ---

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
    const [tempDateRange, setTempDateRange] = useState([ // State for date range while in modal
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
    const [notifications, setNotifications] = useState([]); // Notification state

    const limit = 10;
    // const datePickerRef = useRef(null); // Ref for date picker is no longer needed/used

    // Notification system logic
    const addNotification = useCallback((message, type = 'success') => {
        const id = Date.now();
        const notification = { id, message, type };
        setNotifications((prev) => [...prev, notification]);
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000);
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        if (isNaN(date)) return '—';
        // Using format from date-fns
        return format(date, 'dd/MM/yyyy');
    };

    const formatRangeDate = (date) => {
        if (!date) return '';
        // Use standard ISO format for consistency in the UI display
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    };

    // Logic for finding the next upcoming campaign date (from Code 1)
    const getUpcomingCampaignDate = (campaigns, type = 'startDate') => {
        if (!campaigns?.length) return null;
        const now = new Date();
        const sorted = campaigns
            .filter((c) => c[type] && new Date(c[type]) >= now) // Only upcoming dates
            .sort((a, b) => new Date(a[type]) - new Date(b[type]));
        
        // Fallback: If no upcoming, show the closest date from all dates (for the sake of sorting consistency)
        if (sorted.length === 0) {
            const allSorted = campaigns
                .filter((c) => c[type])
                .sort((a, b) => new Date(a[type]) - new Date(b[type]));
            return allSorted[0]?.[type] || null;
        }

        return sorted[0]?.[type] || null;
    };

    // Data Fetching logic
    const fetchBookings = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('accessToken');

        try {
            const startDateParam = dateRange[0].startDate
                ? formatRangeDate(dateRange[0].startDate)
                : '';
            const endDateParam = dateRange[0].endDate
                ? formatRangeDate(dateRange[0].endDate)
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
    }, [currentPage, limit, search, dateRange, navigate, addNotification]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);
    
    // 💥 FIX: Removed the problematic click-outside useEffect.
    // The Modal component's backdrop click handler now solely manages closing.
    /*
    useEffect(() => {
        function handleClickOutside(event) {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setShowDateModal(false);
            }
        }
        if (showDateModal) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDateModal]);
    */

    // Filter Handlers
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
        } else if (!start && !end) {
             addNotification('Date filter cleared');
        }
    };

    const handleCancelDateFilter = () => {
        setShowDateModal(false);
        setTempDateRange(dateRange); // Reset temp to current range
    };

    const handleClearAllFilters = () => {
        setSearch('');
        const initialRange = [{ startDate: null, endDate: null, key: 'selection' }];
        setDateRange(initialRange);
        setTempDateRange(initialRange);
        setCurrentPage(1);
        setSortConfig({ key: '', direction: 'asc' });
        addNotification('Filters reset successfully');
    };

    // Sorting Logic using useMemo
    const sortedData = useMemo(() => {
        const sortableItems = [...bookings];
        const { key, direction } = sortConfig;
        if (!key) return sortableItems;

        return sortableItems.sort((a, b) => {
            // Handle upcoming date sorting logic
            if (key === 'upcomingStartDate' || key === 'upcomingEndDate') {
                const aDate = getUpcomingCampaignDate(
                    a.campaigns,
                    key === 'upcomingStartDate' ? 'startDate' : 'endDate'
                );
                const bDate = getUpcomingCampaignDate(
                    b.campaigns,
                    key === 'upcomingStartDate' ? 'startDate' : 'endDate'
                );

                const aTime = aDate ? new Date(aDate).getTime() : (direction === 'asc' ? Infinity : -Infinity);
                const bTime = bDate ? new Date(bDate).getTime() : (direction === 'asc' ? Infinity : -Infinity);

                if (aTime === bTime) return 0;
                return direction === 'asc' ? aTime - bTime : bTime - aTime;
            }

            // Handle created at date sorting logic
            if (key === 'createdAt') {
                const aDate = a[key] ? new Date(a[key]) : null;
                const bDate = b[key] ? new Date(b[key]) : null;

                const aTime = aDate ? aDate.getTime() : (direction === 'asc' ? Infinity : -Infinity);
                const bTime = bDate ? bDate.getTime() : (direction === 'asc' ? Infinity : -Infinity);

                if (aTime === bTime) return 0;
                return direction === 'asc' ? aTime - bTime : bTime - aTime;
            }

            // Default string/value sorting
            const aVal = a[key]?.toString().toLowerCase() || '';
            const bVal = b[key]?.toString().toLowerCase() || '';
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [bookings, sortConfig]);

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 h-screen w-screen text-black flex flex-col lg:flex-row overflow-hidden'>
            <Navbar />

            {/* Notification System */}
            <div className='fixed top-4 right-4 z-[99999] space-y-2'>
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
                            {loading && <span className='ml-2 text-sm text-gray-600'>Loading...</span>}
                        </h2>
                    </div>
                    <Button onClick={() => navigate('/create-booking')}>+ Create Booking</Button>
                </div>

                <Card className='mt-6 shadow-xl animate-slideUp'>
                    <CardContent className="p-0">
                        <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
                            <div className='w-full md:w-[50%]'>
                                <Input
                                    placeholder='Search Bookings (Company, Client, Brand)'
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                                {/* Note: We don't have search validation logic here, so ValidationMessage is not used for search input */}
                            </div>
                            <div className='flex items-center gap-3 flex-shrink-0'>
                                {/* Removed ref={datePickerRef} */}
                                <div className='relative w-full md:w-auto'> 
                                    <button
                                        onClick={() => {
                                            setTempDateRange(dateRange); // Sync temp state before opening
                                            setShowDateModal((prev) => !prev);
                                        }}
                                        className='px-4 py-2 rounded-xl hover:bg-gray-100 hover:ring-2 ring-black w-full text-left bg-white text-black transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md text-xs'
                                    >
                                        {dateRange[0].startDate && dateRange[0].endDate
                                            ? `${formatRangeDate(dateRange[0].startDate)} to ${formatRangeDate(
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
                        <div className='absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center z-10'>
                            <div className='flex flex-col items-center gap-3'>
                                <div className='w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin'></div>
                                <div className='text-gray-600 text-sm'>
                                    Loading bookings...
                                </div>
                            </div>
                        </div>
                    )}

                    {error ? (
                        <div className='text-center py-8 text-red-500 bg-white rounded-xl shadow-xl'>
                            Error: {error}
                        </div>
                    ) : (
                        totalCount > 0 && (
                            <BookingsTableView
                                data={sortedData}
                                currentPage={currentPage}
                                limit={limit}
                                navigate={navigate}
                                sortConfig={sortConfig}
                                setSortConfig={setSortConfig}
                                formatDate={formatDate}
                                getUpcomingCampaignDate={getUpcomingCampaignDate}
                            />
                        )
                    )}

                    {!loading && totalCount === 0 && !error && (
                        <div className="text-center py-20 animate-fadeIn bg-white rounded-xl shadow-xl">
                            <div className="text-gray-500 text-lg mb-2">📅</div>
                            <div className="text-gray-500">No bookings found matching your criteria.</div>
                        </div>
                    )}
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
                        <h3 className='text-lg font-semibold text-black mb-4'>Select Date Range</h3>
                        <div className='flex justify-center'>
                            <DateRange
                                editableDateInputs={true}
                                // This onChange now works without being interrupted
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
                                className='px-4 py-1.5 rounded-md bg-gray-100 text-black hover:bg-gray-200 transition-all duration-200 hover:scale-105'
                            >
                                Cancel
                            </button>
                            <Button onClick={handleApplyDateFilters}>Apply</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Tailwind Keyframes/Animation Styles (Copied from InventoryDashboard) */}
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