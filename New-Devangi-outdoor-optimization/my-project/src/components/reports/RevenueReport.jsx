import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { LineChart, BarChart, PieChart } from "@mui/x-charts";
import { CircularProgress } from "@mui/material";
import { FaArrowLeft, FaArrowRight, FaTimes, FaExclamationTriangle } from "react-icons/fa"; // Import icons for new UI

// --- NEW UI HELPER COMPONENTS (Card Simplified, CardContent is the styled component) ---

// Card is now a neutral, optional wrapper (as requested by the previous step's intent)
const Card = ({ children, className = '', ...props }) => (
    <div
        className={`w-full flex flex-col relative overflow-hidden ${className}`}
        {...props}
    >
        <div className="relative z-10 h-full flex flex-col p-0">
            {children}
        </div>
    </div>
);

// CardContent now holds the visual styling (shadow, border, background)
const CardContent = ({ children, className = '' }) => (
    <div className={`
        flex-grow flex flex-col bg-white shadow-xl rounded-2xl border border-gray-200 p-6 md:p-8
        ${className}
    `}>
        {children}
    </div>
);

// Consistent Button from BookingsDashboard
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

// Consistent Input from BookingsDashboard
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

// Consistent Select Component
const Select = ({ children, className = '', ...props }) => (
    <select
        className={`
            px-4 py-2 rounded-xl w-full bg-white text-black 
            focus:outline-none focus:ring-2 focus:ring-black transition-all duration-200 shadow-sm 
            hover:shadow-md hover:ring-2 hover:ring-gray-200 text-xs
            ${className}
        `}
        {...props}
    >
        {children}
    </select>
);

// Consistent ShimmerCard (Updated styling for consistency)
const ShimmerCard = () => (
    <div className="h-80 bg-white rounded-2xl animate-pulse shadow-md border border-gray-200">
        <div className="p-6 h-full flex items-center justify-center text-gray-400">
            Loading Chart...
        </div>
    </div>
);

// New ValidationMessage from BookingsDashboard
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

// Unified SortableHeader from BookingsDashboard
const SortableHeader = ({ title, sortKey, sortConfig, onSort, disabled = false, className = '' }) => {
    const isSorting = sortConfig.key === sortKey;
    const direction = isSorting ? sortConfig.direction : null;

    const handleSort = () => {
        if (disabled) return;
        const newDirection = sortConfig.key === sortKey && sortConfig.direction === 'asc' ? 'desc' : 'asc';
        onSort(sortKey, newDirection);
    };

    return (
        <th scope="col" className={`px-6 py-4 text-left text-black uppercase tracking-wider ${className}`}>
            <div
                onClick={handleSort}
                className={`flex items-center gap-1.5 ${disabled ? 'cursor-default' : 'cursor-pointer select-none'} text-black hover:text-gray-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]`}
            >
                {title}
                {!disabled && (
                    <span className={`text-gray-400 transition-all duration-200 ${isSorting ? 'text-black scale-110' : ''}`}>
                        {direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '⇅'}
                    </span>
                )}
            </div>
        </th>
    );
};

// Unified Pagination from BookingsDashboard
const Pagination = ({ currentPage, totalPages, onPageChange, totalCount, itemsPerPage, loading = false }) => {
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

// --- End of NEW UI Helper Components ---

const ITEMS_PER_PAGE = 10;

export default function RevenueReport({
    bookingStats = [],
    loadingCharts,
    handleShowDateModal = () => {},
    navigate,
}) {
    // --- STATE & LOGIC FOR REVENUE GRAPH (Unchanged) ---
    const [revenueView, setRevenueView] = useState("monthly");
    const [revenueChartData, setRevenueChartData] = useState({
        xLabels: [],
        yData: [],
    });
    const [agencyVsDirect, setAgencyVsDirect] = useState([]);
    const [revenueByAgency, setRevenueByAgency] = useState([]);
    const [agencyFilters, setagencyFilters] = useState({
        startDate: "",
        endDate: "",
    });
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [industryRevenue, setIndustryRevenue] = useState([]);
    const [industryFilters, setIndustryFilters] = useState({
        startDate: "",
        endDate: "",
    });
    const [industryTotal, setIndustryTotal] = useState(0);

    useEffect(() => {
        if (bookingStats.length > 0) processRevenueData();
    }, [bookingStats, revenueView]);

    const processRevenueData = () => {
        const revenueMap = new Map();
        bookingStats.forEach(({ createdAt, totalPaid }) => {
            if (!createdAt || !totalPaid) return;
            const date = dayjs(createdAt);
            const key =
                revenueView === "monthly"
                    ? date.format("MMM YYYY")
                    : date.format("YYYY");
            revenueMap.set(key, (revenueMap.get(key) || 0) + totalPaid);
        });
        const sortedKeys = Array.from(revenueMap.keys()).sort((a, b) => {
            const format = revenueView === "monthly" ? "MMM YYYY" : "YYYY";
            return dayjs(a, format).unix() - dayjs(b, format).unix();
        });
        let xLabels = sortedKeys;
        let yData = sortedKeys.map((k) => revenueMap.get(k));
        if (xLabels.length === 1) {
            const singleDateLabel = xLabels[0];
            const format = revenueView === "monthly" ? "MMM YYYY" : "YYYY";
            const periodUnit = revenueView === "monthly" ? "month" : "year";
            const precedingDate = dayjs(singleDateLabel, format).subtract(
                1,
                periodUnit
            );
            const precedingLabel = precedingDate.format(format);
            xLabels = [precedingLabel, ...xLabels];
            yData = [0, ...yData];
        }
        setRevenueChartData({ xLabels, yData });
    };

    // --- STATE & LOGIC FOR PAYMENTS TABLE (Unchanged) ---
    const [paymentData, setPaymentData] = useState([]);
    const [paymentCurrentPage, setPaymentCurrentPage] = useState(1);
    const [paymentTotalPages, setPaymentTotalPages] = useState(1);
    const [paymentTotalCount, setPaymentTotalCount] = useState(0);
    const [paymentSortConfig, setPaymentSortConfig] = useState({ key: 'paymentDate', direction: 'desc' });
    const [paymentFilters, setPaymentFilters] = useState({
        clientName: "",
        bookingName: "",
        startDate: "",
        endDate: "",
    });
    const [paymentTableLoading, setPaymentTableLoading] = useState(false); // Added loading state

    const resetPaymentFilters = () => {
        setPaymentFilters({
            clientName: "",
            bookingName: "",
            startDate: "",
            endDate: "",
        });
        setPaymentCurrentPage(1);
    };

    const handlePaymentSort = (key, direction) => {
        setPaymentSortConfig({ key, direction });
        setPaymentCurrentPage(1);
    };

    useEffect(() => {
        fetchPaymentReport();
    }, [paymentFilters, paymentCurrentPage, paymentSortConfig]);

    const fetchPaymentReport = async () => {
        setPaymentTableLoading(true);
        try {
            const params = new URLSearchParams({
                page: paymentCurrentPage,
                limit: ITEMS_PER_PAGE,
                sortKey: paymentSortConfig.key,
                sortDirection: paymentSortConfig.direction,
            });

            if (paymentFilters.clientName)
                params.append("clientName", paymentFilters.clientName);
            if (paymentFilters.bookingName)
                params.append("bookingName", paymentFilters.bookingName);
            if (paymentFilters.startDate)
                params.append("startDate", paymentFilters.startDate);
            if (paymentFilters.endDate)
                params.append("endDate", paymentFilters.endDate);

            const res = await fetch(
                `${
                    import.meta.env.VITE_API_BASE_URL
                }/api/bookings/payment-report?${params.toString()}`
            );

            const data = await res.json();
            setPaymentData(data.payments || []);
            setPaymentTotalPages(data.pagination?.totalPages || 1);
            setPaymentTotalCount(data.pagination?.totalCount || 0);
        } catch (error) {
            console.error("Error fetching payment report", error);
        } finally {
            setPaymentTableLoading(false);
        }
    };

    const downloadPaymentsExcel = async () => {
        try {
            const fetchAllPayments = async () => {
                let allPayments = [];
                let currentPage = 1;
                let totalPages = 1;

                do {
                    const params = new URLSearchParams({
                        page: currentPage,
                        limit: 50,
                        sortKey: paymentSortConfig.key,
                        sortDirection: paymentSortConfig.direction,
                    });
                    if (paymentFilters.clientName) params.append("clientName", paymentFilters.clientName);
                    if (paymentFilters.bookingName) params.append("bookingName", paymentFilters.bookingName);
                    if (paymentFilters.startDate) params.append("startDate", paymentFilters.startDate);
                    if (paymentFilters.endDate) params.append("endDate", paymentFilters.endDate);

                    const res = await fetch(
                        `${import.meta.env.VITE_API_BASE_URL}/api/bookings/payment-report?${params.toString()}`
                    );

                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    const data = await res.json();
                    allPayments = allPayments.concat(data.payments || []);
                    totalPages = data.pagination?.totalPages || 1;
                    currentPage++;
                } while (currentPage <= totalPages);
                return allPayments;
            };

            const allPaymentsData = await fetchAllPayments();

            if (allPaymentsData.length === 0) {
                alert("No payment data to download.");
                return;
            }

            const rows = allPaymentsData.map((p) => ({
                'Booking': p.bookingName,
                'Client': p.clientName,
                'Amount': p.amount,
                'Date': dayjs(p.paymentDate).format("DD MMM YYYY"),
                'Mode': p.mode,
                'Reference': p.referenceNumber || 'N/A',
                'Document URL': p.documentUrl || 'N/A'
            }));

            const sheet = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, sheet, "Payments");
            const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            saveAs(
                new Blob([buf], { type: "application/octet-stream" }),
                `payments_report_${dayjs().format("YYYYMMDD")}.xlsx`
            );

        } catch (error) {
            console.error("Error downloading payments report:", error);
            alert("Failed to download payments report. Please try again.");
        }
    };

    useEffect(() => {
        fetchRevenueByAgency();
    }, [agencyFilters]);

    useEffect(() => {
        fetchRevenueByIndustry();
    }, [industryFilters]);

    const resetAgencyFilters = () => {
        setagencyFilters({
            startDate: "",
            endDate: "",
        });
    };

    const resetIndustryFilters = () => {
        setIndustryFilters({
            startDate: "",
            endDate: "",
        });
    };

    const fetchRevenueByAgency = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            if (navigate) navigate("/login");
            return;
        }

        try {
            const params = new URLSearchParams();
            if (agencyFilters.startDate)
                params.append("startDate", agencyFilters.startDate);
            if (agencyFilters.endDate)
                params.append("endDate", agencyFilters.endDate);

            const res = await fetch(
                `${
                    import.meta.env.VITE_API_BASE_URL
                }/api/revenue/by-agency?${params.toString()}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.status === 401 || res.status === 403) {
                localStorage.clear();
                if (navigate) navigate("/login");
                return;
            }

            const data = await res.json();
            setAgencyVsDirect(data.agencyVsDirectRevenue);
            setRevenueByAgency(data.revenueByAgencyName);
            setTotalRevenue(data.summary.totalRevenue);
        } catch (error) {
            console.error("Error fetching revenue by agency", error);
        }
    };

    const fetchRevenueByIndustry = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            if (navigate) navigate("/login");
            return;
        }

        try {
            const params = new URLSearchParams();
            if (industryFilters.startDate)
                params.append("startDate", industryFilters.startDate);
            if (industryFilters.endDate)
                params.append("endDate", industryFilters.endDate);

            const res = await fetch(
                `${
                    import.meta.env.VITE_API_BASE_URL
                }/api/revenue/by-industry?${params}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.status === 401 || res.status === 403) {
                localStorage.clear();
                if (navigate) navigate("/login");
                return;
            }

            const data = await res.json();
            setIndustryRevenue(data.revenueByIndustry);
            setIndustryTotal(data.summary.totalRevenue);
        } catch (error) {
            console.error("Error fetching revenue by industry", error);
        }
    };

    // --- STATE & LOGIC FOR TRADE MARGIN TABLE (Unchanged) ---
    const [tradeMarginData, setTradeMarginData] = useState([]);
    const [tradeMarginFilters, setTradeMarginFilters] = useState({
        bookingSearch: "",
        inventorySearch: "",
        inventoryType: "",
        startDate: "",
        endDate: "",
    });
    const [tradeMarginCurrentPage, setTradeMarginCurrentPage] = useState(1);
    const [tradeMarginTotalPages, setTradeMarginTotalPages] = useState(1);
    const [tradeMarginTotalCount, setTradeMarginTotalCount] = useState(0);
    const [tradeMarginSortConfig, setTradeMarginSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [tradeMarginTableLoading, setTradeMarginTableLoading] = useState(true);
    const [tradeMarginTableError, setTradeMarginTableError] = useState(null);

    // --- STATE & LOGIC FOR TRADE MARGIN GRAPH ---
    const [tradeMarginGraphFilters, setTradeMarginGraphFilters] = useState({
        bookingSearch: "",
        inventorySearch: "",
        inventoryType: "",
        startDate: "",
        endDate: "",
    });
    const [tradeMarginChartView, setTradeMarginChartView] = useState("monthly");
    const [tradeMarginChartData, setTradeMarginChartData] = useState({ xLabels: [], yData: [] });
    const [tradeMarginGraphLoading, setTradeMarginGraphLoading] = useState(true);
    const [tradeMarginGraphError, setTradeMarginGraphError] = useState(null);
    const [totalTradeMargin, setTotalTradeMargin] = useState(0);


    const resetTradeMarginFilters = () => {
        setTradeMarginFilters({
            bookingSearch: "",
            inventorySearch: "",
            inventoryType: "",
            startDate: "",
            endDate: "",
        });
        setTradeMarginCurrentPage(1);
    };

    const handleTradeMarginFilterChange = (e) => {
        const { name, value } = e.target;
        setTradeMarginFilters((prev) => ({ ...prev, [name]: value }));
        setTradeMarginCurrentPage(1);
    };

    const handleTradeMarginSort = (key, direction) => {
        setTradeMarginSortConfig({ key, direction });
        setTradeMarginCurrentPage(1);
    };

    const resetTradeMarginGraphFilters = () => {
        setTradeMarginGraphFilters({
            bookingSearch: "",
            inventorySearch: "",
            inventoryType: "",
            startDate: "",
            endDate: "",
        });
    };

    const handleTradeMarginGraphFilterChange = (e) => {
        const { name, value } = e.target;
        setTradeMarginGraphFilters((prev) => ({ ...prev, [name]: value }));
    };

    const fetchTradeMarginTable = async () => {
        setTradeMarginTableLoading(true);
        setTradeMarginTableError(null);
        const token = localStorage.getItem("accessToken");
        if (!token) {
            setTradeMarginTableError("Authentication failed. Please log in again.");
            setTradeMarginTableLoading(false);
            return;
        }

        try {
            const params = new URLSearchParams({
                page: tradeMarginCurrentPage,
                limit: ITEMS_PER_PAGE,
                sortKey: tradeMarginSortConfig.key,
                sortDirection: tradeMarginSortConfig.direction,
            });
            if (tradeMarginFilters.bookingSearch) params.append('booking', tradeMarginFilters.bookingSearch);
            if (tradeMarginFilters.inventorySearch) params.append('inventory', tradeMarginFilters.inventorySearch);
            if (tradeMarginFilters.inventoryType) params.append('inventoryType', tradeMarginFilters.inventoryType);
            if (tradeMarginFilters.startDate) params.append('startDate', tradeMarginFilters.startDate);
            if (tradeMarginFilters.endDate) params.append('endDate', tradeMarginFilters.endDate);

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/trade-margin?${params.toString()}`, { headers: { "Authorization": `Bearer ${token}` } });
            if (!res.ok) throw new Error(`Failed to fetch report: ${res.statusText}`);

            const data = await res.json();
            setTradeMarginData(data.tradeMargins || []);
            setTradeMarginTotalPages(data.pagination?.totalPages || 1);
            setTradeMarginTotalCount(data.pagination?.totalCount || 0);
        } catch (error) {
            setTradeMarginTableError(error.message);
        } finally {
            setTradeMarginTableLoading(false);
        }
    };

    const fetchTradeMarginGraph = async () => {
        setTradeMarginGraphLoading(true);
        setTradeMarginGraphError(null);
        const token = localStorage.getItem("accessToken");
        if (!token) {
            setTradeMarginGraphError("Authentication failed. Please log in again.");
            setTradeMarginGraphLoading(false);
            return;
        }

        try {
            const params = new URLSearchParams({ all: 'true' });
            if (tradeMarginGraphFilters.bookingSearch) params.append('booking', tradeMarginGraphFilters.bookingSearch);
            if (tradeMarginGraphFilters.inventorySearch) params.append('inventory', tradeMarginGraphFilters.inventorySearch);
            if (tradeMarginGraphFilters.inventoryType) params.append('inventoryType', tradeMarginGraphFilters.inventoryType);
            if (tradeMarginGraphFilters.startDate) params.append('startDate', tradeMarginGraphFilters.startDate);
            if (tradeMarginGraphFilters.endDate) params.append('endDate', tradeMarginGraphFilters.endDate);

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/trade-margin?${params.toString()}`, { headers: { "Authorization": `Bearer ${token}` } });
            if (!res.ok) throw new Error(`Failed to fetch graph data: ${res.statusText}`);

            const data = await res.json();
            processTradeMarginData(data.tradeMargins || []);
        } catch (error) {
            setTradeMarginGraphError(error.message);
        } finally {
            setTradeMarginGraphLoading(false);
        }
    };

    useEffect(() => {
        fetchTradeMarginTable();
    }, [tradeMarginFilters, tradeMarginCurrentPage, tradeMarginSortConfig]);

    useEffect(() => {
        fetchTradeMarginGraph();
    }, [tradeMarginGraphFilters, tradeMarginChartView]);

    const processTradeMarginData = (data) => {
        const marginMap = new Map();
        let calculatedTotal = 0;
        data.forEach(({ date, tradeMargin }) => {
            if (!date || typeof tradeMargin !== 'number') return;
            calculatedTotal += tradeMargin;
            const d = dayjs(date);
            const key = tradeMarginChartView === "monthly" ? d.format("MMM YYYY") : d.format("YYYY");
            marginMap.set(key, (marginMap.get(key) || 0) + tradeMargin);
        });

        setTotalTradeMargin(calculatedTotal);

        const sortedKeys = Array.from(marginMap.keys()).sort((a, b) => {
            const format = tradeMarginChartView === "monthly" ? "MMM YYYY" : "YYYY";
            return dayjs(a, format).unix() - dayjs(b, format).unix();
        });

        setTradeMarginChartData({
            xLabels: sortedKeys,
            yData: sortedKeys.map((k) => marginMap.get(k))
        });
    };

    const downloadTradeMarginExcel = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            alert("Authentication failed. Please log in again.");
            return;
        }

        try {
            let allMargins = [];
            let currentPage = 1;
            let totalPages = 1;

            do {
                const params = new URLSearchParams({
                    page: currentPage,
                    limit: 50,
                    sortKey: tradeMarginSortConfig.key,
                    sortDirection: tradeMarginSortConfig.direction,
                });
                if (tradeMarginFilters.bookingSearch) params.append('booking', tradeMarginFilters.bookingSearch);
                if (tradeMarginFilters.inventorySearch) params.append('inventory', tradeMarginFilters.inventorySearch);
                if (tradeMarginFilters.inventoryType) params.append('inventoryType', tradeMarginFilters.inventoryType);
                if (tradeMarginFilters.startDate) params.append('startDate', tradeMarginFilters.startDate);
                if (tradeMarginFilters.endDate) params.append('endDate', tradeMarginFilters.endDate);

                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/trade-margin?${params.toString()}`, { headers: { "Authorization": `Bearer ${token}` } });
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                allMargins = allMargins.concat(data.tradeMargins || []);
                totalPages = data.pagination?.totalPages || 1;
                currentPage++;
            } while (currentPage <= totalPages);

            if (allMargins.length === 0) {
                alert("No trade margin data to download for the selected filters.");
                return;
            }

            const rows = allMargins.map(item => ({
                'Inventory': item.inventory || "N/A",
                'Inventory Type': item.inventoryType || "N/A",
                'Booking': item.booking || "N/A",
                'Invoice NO': item.invoiceNo || "N/A",
                'Trade Margin': item.tradeMargin || 0,
                'Date': dayjs(item.date).format("DD MMM YYYY")
            }));

            const sheet = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, sheet, "TradeMargins");
            const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            saveAs(new Blob([buf]), `trade_margin_report_${dayjs().format("YYYYMMDD")}.xlsx`);
        } catch (error) {
            console.error("Error downloading trade margin report:", error);
            alert("Failed to download trade margin report. Please try again.");
        }
    };

    const yMax = revenueChartData.yData.length > 0 ? Math.max(...revenueChartData.yData) : 0;
    const yAxisFormatter = (value) => `${(value / 100000).toFixed(1)} L`;
    const tooltipFormatter = (value) => `₹${(value / 100000).toFixed(2)} L`;

    const handleRowClick = (payment) => {
        if (navigate && payment.bookingId) {
            navigate(`/campaign-details/${payment.bookingId}`);
        } else {
            console.error("Navigation failed: 'navigate' prop or 'bookingId' is missing.");
        }
    };

    return (
        <div className="space-y-10">
            {/* Payments Report Table - Single Card Layer */}
            <CardContent>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2 border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-sans font-normal text-black">Payments Report ({paymentTotalCount})</h3>
                    <Button onClick={downloadPaymentsExcel} disabled={paymentData.length === 0}>Download Full Report</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-center">
                    <Input
                        placeholder="Client Name"
                        value={paymentFilters.clientName}
                        onChange={(e) => {setPaymentFilters({ ...paymentFilters, clientName: e.target.value }); setPaymentCurrentPage(1);}}
                    />
                    <Input
                        placeholder="Booking Name"
                        value={paymentFilters.bookingName}
                        onChange={(e) => {setPaymentFilters({ ...paymentFilters, bookingName: e.target.value }); setPaymentCurrentPage(1);}}
                    />
                    <button
                        onClick={() => handleShowDateModal("payments", paymentFilters, setPaymentFilters)}
                        className='px-4 py-2 rounded-xl hover:bg-gray-100 hover:ring-2 ring-black w-full text-left bg-white text-black transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md text-xs'
                    >
                        {paymentFilters.startDate && paymentFilters.endDate ? `${paymentFilters.startDate} to ${paymentFilters.endDate}` : "Filter by Payment Date"}
                    </button>
                    <Button onClick={resetPaymentFilters} className='bg-gray-700 text-white hover:bg-gray-800 shadow-md hover:shadow-lg'>Reset Filters</Button>
                </div>
                {/* New Table Structure */}
                <div className="bg-white shadow-xl rounded-xl animate-slideUp w-full overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-xs text-left text-gray-600">
                            <thead className="text-xs text-black uppercase bg-gray-100 sticky top-0 z-10 border-b border-gray-300">
                                <tr className="border-b-2 border-gray-200">
                                    <SortableHeader title="Booking" sortKey="bookingName" sortConfig={paymentSortConfig} onSort={handlePaymentSort} />
                                    <SortableHeader title="Client" sortKey="clientName" sortConfig={paymentSortConfig} onSort={handlePaymentSort} />
                                    <SortableHeader title="Amount" sortKey="amount" sortConfig={paymentSortConfig} onSort={handlePaymentSort} />
                                    <SortableHeader title="Date" sortKey="paymentDate" sortConfig={paymentSortConfig} onSort={handlePaymentSort} />
                                    <SortableHeader title="Mode" sortKey="mode" sortConfig={paymentSortConfig} onSort={handlePaymentSort} />
                                    <SortableHeader title="Reference" sortKey="referenceNumber" sortConfig={paymentSortConfig} onSort={handlePaymentSort} />
                                    <SortableHeader title="Document" sortKey="documentUrl" sortConfig={paymentSortConfig} onSort={handlePaymentSort} disabled={true} />
                                </tr>
                            </thead>
                            <tbody>
                                {paymentTableLoading ? (
                                    <tr><td colSpan="7" className="text-center py-10 text-gray-500"><CircularProgress size={24} /></td></tr>
                                ) : paymentData.length > 0 ? (
                                    paymentData.map((p, index) => (
                                        <tr 
                                            key={p._id || p.bookingId} 
                                            className={`transition-all duration-200 border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50/50 hover:shadow-inner cursor-pointer`} 
                                            onClick={() => handleRowClick(p)}
                                        >
                                            <td className="px-6 py-4 font-medium text-black whitespace-nowrap">{p.bookingName}</td>
                                            <td className="px-6 py-4 text-black">{p.clientName}</td>
                                            <td className="px-6 py-4 font-medium text-black">₹{p.amount?.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-black">{new Date(p.paymentDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 capitalize text-black">{p.mode}</td>
                                            <td className="px-6 py-4 text-gray-700">{p.referenceNumber || "N/A"}</td>
                                            <td className="px-6 py-4">
                                                {p.documentUrl ? (<a href={p.documentUrl} target="_blank" className="text-blue-600 underline hover:text-blue-800" rel="noreferrer" onClick={(e) => e.stopPropagation()}>View</a>) : "N/A"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="7" className="text-center py-10 text-gray-500">No payments found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Updated Pagination Component */}
                <Pagination currentPage={paymentCurrentPage} totalPages={paymentTotalPages} onPageChange={setPaymentCurrentPage} totalCount={paymentTotalCount} itemsPerPage={ITEMS_PER_PAGE} loading={paymentTableLoading} />
            </CardContent>

            {/* Revenue By Agency - Single Card Layer */}
            <CardContent className="space-y-10">
                <div>
                    <div className="flex flex-wrap items-center justify-between mb-4 gap-4 border-b border-gray-200 pb-4">
                        <h3 className="text-xl font-sans font-normal text-black border-l-4 border-indigo-500 pl-3">Agency vs Direct Revenue</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleShowDateModal("agency", agencyFilters, setagencyFilters)} className='px-4 py-2 rounded-xl hover:bg-gray-100 hover:ring-2 ring-black w-full text-left bg-white text-black transition-all duration-200 shadow-sm hover:shadow-md text-xs'>
                                {agencyFilters.startDate && agencyFilters.endDate ? `${agencyFilters.startDate} to ${agencyFilters.endDate}` : "Filter by Date"}
                            </button>
                            <Button onClick={resetAgencyFilters} className='bg-gray-700 text-white hover:bg-gray-800 shadow-md hover:shadow-lg'>Reset</Button>
                        </div>
                        <p className="font-semibold text-sm w-full sm:w-auto text-right text-black">Total Revenue: ₹{totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-center">
                        <PieChart
                            series={[
                                {
                                    data: agencyVsDirect.map((item, i) => ({
                                        id: i,
                                        value: item.totalRevenue,
                                        label: item._id,
                                    })),
                                    innerRadius: 40,
                                    outerRadius: 80,
                                    arcLabel: (item) => `${(item.value / totalRevenue * 100).toFixed(1)}%`,
                                    valueFormatter: (item) => `₹${item.value.toLocaleString()} (${(item.value / totalRevenue * 100).toFixed(1)}%)`,
                                },
                            ]}
                            width={400}
                            height={200}
                            slotProps={{
                                legend: {
                                    labelStyle: { fontSize: 12 },
                                    direction: 'row',
                                    position: { vertical: 'bottom', horizontal: 'middle' },
                                    padding: 0,
                                }
                            }}
                        />
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-sans font-normal text-black mb-4 border-l-4 border-green-500 pl-3">Revenue by Agency Name</h3>
                    <div className="rounded-xl border border-gray-100 shadow-md p-4 bg-gray-50">
                        <BarChart
                            xAxis={[{ scaleType: "band", data: revenueByAgency.map((d) => d._id) }]}
                            series={[
                                {
                                    data: revenueByAgency.map((d) => d.totalRevenue),
                                    label: "Total Revenue",
                                    color: "#10B981",
                                    valueFormatter: (value) => `₹${value.toLocaleString()} (${totalRevenue > 0 ? ((value / totalRevenue) * 100).toFixed(1) : 0}%)`,
                                },
                            ]}
                            height={200}
                        />
                    </div>
                </div>
            </CardContent>

            {/* Revenue by Industry - Single Card Layer */}
            <CardContent className="space-y-10">
                <div>
                    <div className="flex flex-wrap items-center justify-between mb-4 gap-4 border-b border-gray-200 pb-4">
                        <h3 className="text-xl font-sans font-normal text-black border-l-4 border-yellow-500 pl-3">Revenue by Industry</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleShowDateModal("industry", industryFilters, setIndustryFilters)} className='px-4 py-2 rounded-xl hover:bg-gray-100 hover:ring-2 ring-black w-full text-left bg-white text-black transition-all duration-200 shadow-sm hover:shadow-md text-xs'>
                                {industryFilters.startDate && industryFilters.endDate ? `${industryFilters.startDate} to ${industryFilters.endDate}` : "Filter by Date"}
                            </button>
                            <Button onClick={resetIndustryFilters} className='bg-gray-700 text-white hover:bg-gray-800 shadow-md hover:shadow-lg'>Reset</Button>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-100 shadow-md p-3 bg-gray-50">
                        <BarChart
                            xAxis={[{ scaleType: "band", data: industryRevenue.map((item) => item._id || "Others") }]}
                            series={[
                                {
                                    data: industryRevenue.map((item) => item.totalRevenue),
                                    label: "Total Revenue",
                                    color: "#F59E0B",
                                    valueFormatter: (value) => `₹${value.toLocaleString()} (${industryTotal > 0 ? ((value / industryTotal) * 100).toFixed(1) : 0}%)`,
                                },
                            ]}
                            height={250}
                        />
                    </div>
                    <p className="text-sm text-gray-600 mt-4 text-right">Total Revenue: ₹{industryTotal.toLocaleString()}</p>
                </div>
            </CardContent>

            {/* Revenue Graph - Single Card Layer */}
            {loadingCharts ? <ShimmerCard /> : (
                <CardContent>
                    <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-4">
                        <h3 className="text-xl font-sans font-normal text-black">Revenue Graph</h3>
                        <button onClick={() => setRevenueView((prev) => (prev === "yearly" ? "monthly" : "yearly"))} className="px-4 py-2 rounded-xl bg-gray-700 text-white text-xs font-medium hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg">View By: {revenueView === "yearly" ? "Yearly" : "Monthly"}</button>
                    </div>
                    <div className="flex flex-grow h-80 -ml-4 -mr-2">
                        <LineChart xAxis={[{ data: revenueChartData.xLabels, scaleType: "point" }]} yAxis={[{ label: "Amount in Lakhs", min: 0, max: yMax > 0 ? yMax * 1.2 : 100000, valueFormatter: yAxisFormatter }]} series={[{ data: revenueChartData.yData, label: "Revenue", color: "#8b5cf6", showMark: true, valueFormatter: tooltipFormatter, area: true }]} grid={{ vertical: true, horizontal: true }} margin={{ top: 40, right: 20, bottom: 50, left: 60 }} legend={{ direction: "row", position: { vertical: "top", horizontal: "middle" }, padding: 0 }}/>
                    </div>
                </CardContent>
            )}

            {/* Trade Margin Report Table - Single Card Layer */}
            <CardContent>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2 border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-sans font-normal text-black">Trade Margin Report ({tradeMarginTotalCount})</h3>
                    <Button onClick={downloadTradeMarginExcel} disabled={tradeMarginData.length === 0}>Download Full Report</Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6 items-center">
                    <Input name="bookingSearch" placeholder="Filter by Booking" value={tradeMarginFilters.bookingSearch} onChange={handleTradeMarginFilterChange} />
                    <Input name="inventorySearch" placeholder="Filter by Inventory" value={tradeMarginFilters.inventorySearch} onChange={handleTradeMarginFilterChange} />
                    <Select name="inventoryType" value={tradeMarginFilters.inventoryType} onChange={handleTradeMarginFilterChange}>
                        <option value="">Filter by Inventory Type</option>
                        <option value="Billboard">Billboard</option>
                        <option value="DOOh">DOOH</option>
                        <option value="Gantry">Gantry</option>
                        <option value="Pole kiosk">Pole kiosk</option>
                        <option value="BQS">BQS</option>
                        <option value="DigitalBQS">DigitalBQS</option>
                        <option value="Miscellaneous">Miscellaneous</option>
                    </Select>
                    <button
                        onClick={() => {
                            handleShowDateModal("tradeMarginTable", tradeMarginFilters, setTradeMarginFilters);
                        }}
                        className='px-4 py-2 rounded-xl hover:bg-gray-100 hover:ring-2 ring-black w-full text-left bg-white text-black transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md text-xs'
                    >
                        {tradeMarginFilters.startDate && tradeMarginFilters.endDate ? `${dayjs(tradeMarginFilters.startDate).format("DD MMM YYYY")} to ${dayjs(tradeMarginFilters.endDate).format("DD MMM YYYY")}` : "Filter by Date Range"}
                    </button>
                    <Button onClick={resetTradeMarginFilters} className='bg-gray-700 text-white hover:bg-gray-800 shadow-md hover:shadow-lg'>Reset Filters</Button>
                </div>
                {/* New Table Structure */}
                <div className="bg-white shadow-xl rounded-xl animate-slideUp w-full overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-xs text-left text-gray-600">
                            <thead className="text-xs text-black uppercase bg-gray-100 sticky top-0 z-10 border-b border-gray-300">
                                <tr className="border-b-2 border-gray-200">
                                    <SortableHeader title="Inventory" sortKey="inventory" sortConfig={tradeMarginSortConfig} onSort={handleTradeMarginSort} />
                                    <SortableHeader title="Inventory Type" sortKey="inventoryType" sortConfig={tradeMarginSortConfig} onSort={handleTradeMarginSort} />
                                    <SortableHeader title="Booking" sortKey="booking" sortConfig={tradeMarginSortConfig} onSort={handleTradeMarginSort} />
                                    <SortableHeader title="Invoice NO" sortKey="invoiceNo" sortConfig={tradeMarginSortConfig} onSort={handleTradeMarginSort} />
                                    <SortableHeader title="Trade Margin" sortKey="tradeMargin" sortConfig={tradeMarginSortConfig} onSort={handleTradeMarginSort} />
                                    <SortableHeader title="Date" sortKey="date" sortConfig={tradeMarginSortConfig} onSort={handleTradeMarginSort} />
                                </tr>
                            </thead>
                            <tbody>
                                {tradeMarginTableLoading ? (
                                    <tr><td colSpan="6" className="text-center py-10 text-gray-500"><CircularProgress size={24} /></td></tr>
                                ) : tradeMarginTableError ? (
                                    <tr><td colSpan="6" className="text-center py-10 text-red-500">{tradeMarginTableError}</td></tr>
                                ) : tradeMarginData.length > 0 ? (
                                    tradeMarginData.map((item, index) => (
                                        <tr key={item.id || index} className={`transition-all duration-200 border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50/50 hover:shadow-inner`}>
                                            <td className="px-6 py-4 text-black">{item.inventory || "N/A"}</td>
                                            <td className="px-6 py-4 text-black">{item.inventoryType || "N/A"}</td>
                                            <td className="px-6 py-4 font-medium text-black whitespace-nowrap">{item.booking || "N/A"}</td>
                                            <td className="px-6 py-4 text-gray-700">{item.invoiceNo || "N/A"}</td>
                                            <td className="px-6 py-4 font-medium text-black">₹{item.tradeMargin?.toLocaleString() || "0"}</td>
                                            <td className="px-6 py-4 text-black">{dayjs(item.date).format("DD MMM YYYY")}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="6" className="text-center py-10 text-gray-500">No trade margin data found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Updated Pagination Component */}
                <Pagination currentPage={tradeMarginCurrentPage} totalPages={tradeMarginTotalPages} onPageChange={setTradeMarginCurrentPage} totalCount={tradeMarginTotalCount} itemsPerPage={ITEMS_PER_PAGE} loading={tradeMarginTableLoading} />
            </CardContent>

            {/* Trade Margin Graph - Single Card Layer */}
            <CardContent>
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-sans font-normal text-black">Trade Margin Graph</h3>
                    <button onClick={() => setTradeMarginChartView(prev => prev === "yearly" ? "monthly" : "yearly")} className="px-4 py-2 rounded-xl bg-gray-700 text-white text-xs font-medium hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg">
                        View By: {tradeMarginChartView === "yearly" ? "Yearly" : "Monthly"}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6 items-center">
                    <Input name="bookingSearch" placeholder="Filter by Booking" value={tradeMarginGraphFilters.bookingSearch} onChange={handleTradeMarginGraphFilterChange} />
                    <Input name="inventorySearch" placeholder="Filter by Inventory" value={tradeMarginGraphFilters.inventorySearch} onChange={handleTradeMarginGraphFilterChange} />
                    <Select name="inventoryType" value={tradeMarginGraphFilters.inventoryType} onChange={handleTradeMarginGraphFilterChange}>
                        <option value="">Filter by Inventory Type</option>
                        <option value="Billboard">Billboard</option>
                        <option value="DOOh">DOOH</option>
                        <option value="Gantry">Gantry</option>
                        <option value="Pole kiosk">Pole kiosk</option>
                        <option value="BQS">BQS</option>
                        <option value="DigitalBQS">DigitalBQS</option>
                        <option value="Miscellaneous">Miscellaneous</option>
                    </Select>
                    <button
                        onClick={() => {
                            handleShowDateModal("tradeMarginGraph", tradeMarginGraphFilters, setTradeMarginGraphFilters);
                        }}
                        className='px-4 py-2 rounded-xl hover:bg-gray-100 hover:ring-2 ring-black w-full text-left bg-white text-black transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md text-xs'
                    >
                        {tradeMarginGraphFilters.startDate && tradeMarginGraphFilters.endDate ? `${dayjs(tradeMarginGraphFilters.startDate).format("DD MMM YYYY")} to ${dayjs(tradeMarginGraphFilters.endDate).format("DD MMM YYYY")}` : "Filter by Date Range"}
                    </button>
                    <Button onClick={resetTradeMarginGraphFilters} className='bg-gray-700 text-white hover:bg-gray-800 shadow-md hover:shadow-lg'>Reset Filters</Button>
                </div>

                {tradeMarginGraphLoading ? <ShimmerCard /> : tradeMarginGraphError ? (
                    <div className="h-80 flex items-center justify-center text-red-500">{tradeMarginGraphError}</div>
                ) : (
                    <div className="flex flex-grow h-80">
                        <BarChart
                            xAxis={[{ scaleType: 'band', data: tradeMarginChartData.xLabels }]}
                            yAxis={[{ label: "Amount in Lakhs", valueFormatter: yAxisFormatter }]}
                            series={[
                                {
                                    data: tradeMarginChartData.yData,
                                    label: "Trade Margin",
                                    color: "#10B981",
                                    valueFormatter: (value) => `₹${value.toLocaleString()} (${totalTradeMargin > 0 ? ((value / totalTradeMargin) * 100).toFixed(1) : 0}%)`,
                                },
                            ]}
                        />
                    </div>
                )}
            </CardContent>

            {/* Tailwind Keyframes/Animation Styles (Copied from BookingsDashboard for animations) */}
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