import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

import Navbar from './Navbar';
// Import the updated set of components
import RevenueReport from './reports/RevenueReport';
import BookingReport from './reports/BookingReport';
import InventoryReport from './reports/InventoryReport';
import ActivitiesReport from './reports/ActivitiesReport';
import OtherReport from './reports/OtherReport';

export default function Report() {
    const { isCollapsed } = useSidebar();
    const navigate = useNavigate();
    
    // Updated tab state, starting with 'revenue'
    const [activeTab, setActiveTab] = useState('revenue');
    
    // State for shared data
    const [allBookingsForPayments, setAllBookingsForPayments] = useState([]);
    const [bookingStats, setBookingStats] = useState([]);
    const [loadingCharts, setLoadingCharts] = useState(true);

    // State for the shared Date Picker Modal
    const [activeDateModal, setActiveDateModal] = useState(null);
    const [tempDateRange, setTempDateRange] = useState([{ startDate: new Date(), endDate: new Date(), key: 'selection' }]);
    const [currentFilterUpdater, setCurrentFilterUpdater] = useState(null);

    useEffect(() => {
        fetchDashboardData(); 
        fetchAllBookingsForPaymentReport();
    }, []);

    const fetchAllBookingsForPaymentReport = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            // Removed the `limit` param to fetch all records as the endpoint likely intends
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings`, {
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            if (res.status === 403) {
                localStorage.clear();
                navigate('/login');
                return;
            }
            const data = await res.json();
            setAllBookingsForPayments(Array.isArray(data.bookings) ? data.bookings : (data || []));
        } catch (err) { console.error('Failed to fetch all bookings for payment report:', err); }
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
            const data = await res.json();
            setBookingStats(data.bookingStats || []);
        } catch (err) {
            console.error('Failed to fetch dashboard stats:', err);
        } finally {
            setLoadingCharts(false);
        }
    };

    const formatDateForPicker = (date) => {
        if (!date) return '';
        const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        return adjustedDate.toISOString().split('T')[0];
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
    };

    const handleCancelDateModal = () => {
        setActiveDateModal(null);
        setCurrentFilterUpdater(null);
    };

    const renderActiveTab = () => {
        switch(activeTab) {
            case 'revenue':
                return <RevenueReport 
                            bookingStats={bookingStats} 
                            loadingCharts={loadingCharts} 
                            allBookingsForPayments={allBookingsForPayments} 
                            handleShowDateModal={handleShowDateModal} 
                        />;
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
    }

    return (
        <div className="bg-[#fafafb] w-screen h-screen text-black flex flex-col">
            <Navbar />
            <main className={`flex-1 h-full overflow-y-auto px-4 md:px-6 py-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
                <h2 className="text-2xl font-sans font-normal mb-4">Reports</h2>

                <div className="flex border-b border-gray-200 mb-6 gap-x-4">
                    {['Revenue', 'Bookings', 'Inventories', 'Activities', 'Other'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`py-2 px-4 text-sm font-medium ${activeTab === tab.toLowerCase() ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                
                <div>{renderActiveTab()}</div>

                {activeDateModal && (
                    <div className="fixed inset-0 text-xs flex items-center justify-center bg-black bg-opacity-50 z-50" onClick={handleCancelDateModal}>
                        <div className="bg-white rounded-xl shadow-lg p-2" onClick={(e) => e.stopPropagation()}>
                            <DateRange
                                editableDateInputs={true}
                                onChange={item => setTempDateRange([item.selection])}
                                moveRangeOnFirstSelection={false}
                                ranges={tempDateRange}
                                rangeColors={['#000000']}
                            />
                            <div className="flex justify-end gap-2 p-2 border-t">
                                <button onClick={handleCancelDateModal} className="px-4 py-1.5 rounded-md bg-gray-200 text-black hover:bg-gray-300 font-medium text-xs">Cancel</button>
                                <button onClick={handleApplyDateFilter} className="px-4 py-1.5 rounded-md bg-black text-white hover:bg-gray-800 font-medium text-xs">Apply</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}