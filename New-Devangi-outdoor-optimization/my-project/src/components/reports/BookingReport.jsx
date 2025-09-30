import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { BarChart } from "@mui/x-charts/BarChart";
import { CircularProgress } from "@mui/material";
import { FaArrowLeft, FaArrowRight, FaExclamationTriangle, FaCheck } from "react-icons/fa";

// --- NEW UI HELPER COMPONENTS (Copied from RevenueReport) ---

// Card is now a neutral, optional wrapper
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

// Consistent Button from RevenueReport
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

// Consistent Input from RevenueReport
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

// Consistent Select Component from RevenueReport
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

// Consistent ShimmerCard
const ShimmerCard = () => (
    <div className="h-80 bg-white rounded-2xl animate-pulse shadow-md border border-gray-200">
        <div className="p-6 h-full flex items-center justify-center text-gray-400">
            Loading Chart...
        </div>
    </div>
);

// New ValidationMessage from RevenueReport
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

// Unified SortableHeader from RevenueReport
const SortableHeader = ({ title, sortKey, sortConfig, onSort, disabled = false, className = '' }) => {
    // FIX: Add default sortConfig value {} to prevent 'reading key of undefined'
    const currentSortConfig = sortConfig || {};
    const isSorting = currentSortConfig.key === sortKey;
    const direction = isSorting ? currentSortConfig.direction : null;

    const handleSort = () => {
        if (disabled) return;
        const newDirection = currentSortConfig.key === sortKey && currentSortConfig.direction === 'asc' ? 'desc' : 'asc';
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

// Unified Pagination from RevenueReport (Replaces EnhancedPaginationControls)
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
const API_MAX_LIMIT = 50; // Use a larger limit for download fetching

const industryOptions = ["Tourism", "Retail", "Real Estate", "Other", "Movie", "Media and Entertainment", "FMCG", "Finance", "Financial Services", "Healthcare", "Hospitality", "IT Industry", "Automobile", "Clothing & Apparel", "Ecommerce", "Edtech", "Entertainment"];
const inventoryTypeOptions = ["Billboard", "DOOH", "Gantry", "Pole Kiosk", "BQS","DigitalBQS","Miscellaneous"];
const clientTypeOptions = ["Corporate", "Agency", "Direct", "Government"];

export default function BookingReport({ handleShowDateModal = () => {} }) {
    const navigate = useNavigate();

    // --- SECTION 1: BOOKING REPORT STATE & LOGIC ---
    const [bookings, setBookings] = useState([]);
    const [bookingFilters, setBookingFilters] = useState({ client: "", paymentStatus: "", poStatus: "", startDate: "", endDate: "" });
    const [bookingCurrentPage, setBookingCurrentPage] = useState(1);
    const [bookingTotalPages, setBookingTotalPages] = useState(1);
    const [bookingTotalCount, setBookingsTotalCount] = useState(0);
    const [bookingSortConfig, setBookingSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    const [bookingTableLoading, setBookingTableLoading] = useState(false); // Added loading state

    const resetBookingFilters = () => {
        setBookingFilters({ client: "", paymentStatus: "", poStatus: "", startDate: "", endDate: "" });
        setBookingCurrentPage(1);
    };

    const handleBookingSort = (key, direction) => {
        setBookingSortConfig({ key, direction });
        setBookingCurrentPage(1);
    };

    const fetchBookings = async () => {
        setBookingTableLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) { setBookingTableLoading(false); navigate("/login"); return; }

            const params = new URLSearchParams({
                page: bookingCurrentPage,
                limit: ITEMS_PER_PAGE,
                sortKey: bookingSortConfig.key,
                sortDirection: bookingSortConfig.direction,
            });
            if (bookingFilters.client) params.append("search", bookingFilters.client);
            if (bookingFilters.paymentStatus) params.append("paymentStatus", bookingFilters.paymentStatus);
            if (bookingFilters.poStatus) {
                params.append("poStatus", bookingFilters.poStatus);
            }
            if (bookingFilters.startDate) params.append("startDate", bookingFilters.startDate);
            if (bookingFilters.endDate) params.append("endDate", bookingFilters.endDate);

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings?${params.toString()}`, {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });

            if (res.status === 403) { localStorage.clear(); navigate("/login"); return; }
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const data = await res.json();
            setBookings(data.bookings || []);
            setBookingTotalPages(data.pagination?.totalPages || 1);
            setBookingsTotalCount(data.pagination?.totalCount || 0);
        } catch (err) {
            console.error("Failed to fetch bookings:", err);
        } finally {
            setBookingTableLoading(false);
        }
    };

    const downloadBookingExcel = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            alert("Authentication failed. Please log in again.");
            return;
        }

        try {
            let allBookings = [];
            let currentPage = 1;
            let totalPages = 1;

            do {
                const params = new URLSearchParams({
                    page: currentPage,
                    limit: API_MAX_LIMIT, 
                    sortKey: bookingSortConfig.key,
                    sortDirection: bookingSortConfig.direction,
                });
                if (bookingFilters.client) params.append("search", bookingFilters.client);
                if (bookingFilters.paymentStatus) params.append("paymentStatus", bookingFilters.paymentStatus);
                if (bookingFilters.poStatus) {
                    params.append("poStatus", bookingFilters.poStatus);
                }
                if (bookingFilters.startDate) params.append("startDate", bookingFilters.startDate);
                if (bookingFilters.endDate) params.append("endDate", bookingFilters.endDate);

                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings?${params.toString()}`, {
                    headers: { "Authorization": `Bearer ${token}` },
                });
                
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                
                const data = await res.json();
                allBookings = allBookings.concat(data.bookings || []);
                totalPages = data.pagination?.totalPages || 1;
                currentPage++;
            } while (currentPage <= totalPages);

            if (allBookings.length === 0) {
                alert("No booking data to download.");
                return;
            }

            // Format data for Excel sheet
            const excelData = allBookings.map(b => {
                let totalPaid = 0, totalDue = 0;
                b.campaigns?.forEach(c => {
                    totalPaid += c.paymentSummary?.totalPaid || 0;
                    totalDue += c.paymentSummary?.totalDue || 0;
                });
                let paymentStatus = "Completed";
                if (totalDue > 0 && totalPaid < totalDue) {
                    paymentStatus = totalPaid > 0 ? "Partial" : "Pending";
                }
                const poStatuses = b.campaigns?.map(c => c.poConfirmed === true) || [];
                let poStatusText = "Pending"; 
                if (poStatuses.length > 0) {
                    if (poStatuses.every(status => status === true)) {
                        poStatusText = "Completed";
                    } else if (poStatuses.some(status => status === true)) {
                        poStatusText = "Partial";
                    }
                }
                return {
                    'Company Name': b.companyName,
                    'Client Name': b.clientName,
                    'Booking Date': dayjs(b.createdAt).format("DD/MM/YYYY"),
                    'Payment Status': paymentStatus,
                    'PO Status': poStatusText,
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings Report");
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            saveAs(new Blob([excelBuffer]), `bookings_report_${dayjs().format("YYYY-MM-DD")}.xlsx`);

        } catch (error) {
            console.error("Error downloading bookings report:", error);
            alert("Failed to download the report. Please try again.");
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [bookingFilters, bookingCurrentPage, bookingSortConfig]);
    // --- END OF SECTION 1 ---

    // --- SECTION 2: PROPOSAL REPORT TABLE STATE & LOGIC ---
    const [proposals, setProposals] = useState([]);
    const [proposalTableFilters, setProposalTableFilters] = useState({ startDate: "", endDate: "", person: "", industry: "", inventoryType: "", clientType: "", bookingSource: "" });
    const [proposalCurrentPage, setProposalCurrentPage] = useState(1);
    const [proposalTotalPages, setProposalTotalPages] = useState(1);
    const [proposalTotalCount, setProposalTotalCount] = useState(0);
    const [proposalSortConfig, setProposalSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    const [proposalTableLoading, setProposalTableLoading] = useState(false); 


    const resetProposalTableFilters = () => {
        setProposalTableFilters({ startDate: "", endDate: "", person: "", industry: "", inventoryType: "", clientType: "", bookingSource: "" });
        setProposalCurrentPage(1);
    };

    const handleProposalSort = (key, direction) => {
        setProposalSortConfig({ key, direction });
        setProposalCurrentPage(1);
    };

    const fetchProposals = async () => {
        setProposalTableLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) { setProposalTableLoading(false); navigate("/login"); return; }

            const params = new URLSearchParams({
                page: proposalCurrentPage,
                limit: ITEMS_PER_PAGE,
                sortKey: proposalSortConfig.key,
                sortDirection: proposalSortConfig.direction,
            });
            Object.entries(proposalTableFilters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/proposals/proposalreport?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            setProposals(data.proposals || []);
            setProposalTotalPages(data.pagination?.totalPages || 1);
            setProposalTotalCount(data.pagination?.totalCount || 0);
        } catch (err) {
            console.error("Failed to fetch proposals:", err);
        } finally {
            setProposalTableLoading(false);
        }
    };

    const handleProposalTableFilterChange = (e) => {
        const { name, value } = e.target;
        setProposalTableFilters((prev) => ({ ...prev, [name]: value }));
        setProposalCurrentPage(1);
    };
    
    const downloadProposalExcel = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            alert("Authentication failed. Please log in again.");
            return;
        }

        try {
            let allProposals = [];
            let currentPage = 1;
            let totalPages = 1;

            do {
                const params = new URLSearchParams({
                    page: currentPage,
                    limit: API_MAX_LIMIT,
                    sortKey: proposalSortConfig.key,
                    sortDirection: proposalSortConfig.direction,
                });
                Object.entries(proposalTableFilters).forEach(([key, value]) => {
                    if (value) params.append(key, value);
                });

                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/proposals/proposalreport?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                allProposals = allProposals.concat(data.proposals || []);
                totalPages = data.pagination?.totalPages || 1;
                currentPage++;
            } while (currentPage <= totalPages);

            if (allProposals.length === 0) {
                alert("No proposal data to download.");
                return;
            }

            const excelData = allProposals.map(p => ({
                'Company Name': p.companyName,
                'Client Name': p.clientName,
                'Industry': p.industry || "N/A",
                'Client Type': p.clientType || "N/A",
                'Booking Source': p.bookingSource || "N/A",
                'Proposal Date': dayjs(p.createdAt).format("DD/MM/YYYY"),
                'Inventories': p.spaceDetails?.map(s => s.spaceName).join(", ") || "N/A",
                'Inventory Types': p.spaceDetails?.map(s => s.spaceType).join(", ") || "N/A",
            }));
            
            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Proposals Report");
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            saveAs(new Blob([excelBuffer]), `proposals_report_${dayjs().format("YYYY-MM-DD")}.xlsx`);
        } catch (error) {
            console.error("Error downloading proposals report:", error);
            alert("Failed to download the report. Please try again.");
        }
    };

    useEffect(() => {
        fetchProposals();
    }, [proposalTableFilters, proposalCurrentPage, proposalSortConfig]);
    // --- END OF SECTION 2 ---

    // --- SECTION 3: PROPOSAL GRAPH STATE & LOGIC ---
    const [graphDimension, setGraphDimension] = useState("timeline");
    const [proposalChartData, setProposalChartData] = useState({ xLabels: [], yData: [] });
    const [totalProposalsForGraph, setTotalProposalsForGraph] = useState(0);
    const [proposalGraphFilters, setProposalGraphFilters] = useState({
        startDate: "", endDate: "", person: "", industry: "", inventoryType: "", clientType: "", bookingSource: "",
    });
    const [proposalGraphLoading, setProposalGraphLoading] = useState(true); 


    const resetProposalGraphFilters = () => {
        setProposalGraphFilters({
            startDate: "", endDate: "", person: "", industry: "", inventoryType: "", clientType: "", bookingSource: ""
        });
    };

    const handleProposalGraphFilterChange = (e) => {
        const { name, value } = e.target;
        setProposalGraphFilters((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        const fetchAndProcessGraphData = async () => {
            setProposalGraphLoading(true);
            try {
                const token = localStorage.getItem("accessToken");
                if (!token) { setProposalGraphLoading(false); navigate("/login"); return; }

                const params = new URLSearchParams({ limit: "2000" }); // Fetch all data for graph
                Object.entries(proposalGraphFilters).forEach(([key, value]) => {
                    if (value) params.append(key, value);
                });

                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/proposals/proposalreport?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                const proposalsForGraph = data.proposals || [];

                let xLabels = [];
                let yData = [];
                const dataMap = new Map();

                if (graphDimension === "timeline") {
                    proposalsForGraph.forEach(({ createdAt }) => {
                        const key = dayjs(createdAt).format("MMM YYYY");
                        dataMap.set(key, (dataMap.get(key) || 0) + 1);
                    });
                    const sortedKeys = Array.from(dataMap.keys()).sort((a, b) => dayjs(a, "MMM YYYY").unix() - dayjs(b, "MMM YYYY").unix());
                    const start = proposalGraphFilters.startDate ? dayjs(proposalGraphFilters.startDate) : sortedKeys.length > 0 ? dayjs(sortedKeys[0], "MMM YYYY") : dayjs().subtract(5, "month");
                    const end = proposalGraphFilters.endDate ? dayjs(proposalGraphFilters.endDate) : dayjs();
                    let current = start.startOf("month");
                    while (current.isBefore(end) || current.isSame(end, "month")) {
                        xLabels.push(current.format("MMM YYYY"));
                        current = current.add(1, "month");
                    }
                    yData = xLabels.map((key) => dataMap.get(key) || 0);
                } else {
                    proposalsForGraph.forEach((proposal) => {
                        let key = "N/A";
                        if (graphDimension === "inventoryType") {
                            proposal.spaceDetails?.forEach((detail) => {
                                key = detail.spaceType || "N/A";
                                dataMap.set(key, (dataMap.get(key) || 0) + 1);
                            });
                            return;
                        } else if (graphDimension === 'clientType') {
                            key = proposal.clientType || "N/A";
                        } else if (graphDimension === 'industry') {
                            key = proposal.industry || "N/A";
                        } else if (graphDimension === 'bookingSource') {
                            key = proposal.bookingSource || "N/A";
                        } else {
                            key = proposal[graphDimension] || "N/A";
                        }
                        dataMap.set(key, (dataMap.get(key) || 0) + 1);
                    });
                    const sortedEntries = Array.from(dataMap.entries()).sort((a, b) => b[1] - a[1]);
                    xLabels = sortedEntries.map((entry) => entry[0]);
                    yData = sortedEntries.map((entry) => entry[1]);
                }

                const total = yData.reduce((sum, val) => sum + val, 0);
                setTotalProposalsForGraph(total);
                setProposalChartData({ xLabels, yData });

            } catch (err) {
                console.error("Failed to fetch and process proposal graph data:", err);
                setProposalChartData({ xLabels: [], yData: [] });
            } finally {
                setProposalGraphLoading(false);
            }
        };
        fetchAndProcessGraphData();
    }, [proposalGraphFilters, graphDimension, navigate]);
    // --- END OF SECTION 3 ---

    return (
        <div className="space-y-10">
            {/* CARD 1: BOOKING REPORT TABLE */}
            <CardContent>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2 border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-sans font-normal text-black">Booking Report ({bookingTotalCount})</h3>
                    <Button onClick={downloadBookingExcel} disabled={bookings.length === 0}>Download Full Report</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 items-center">
                    <Input placeholder="Client Name/Company Name" value={bookingFilters.client} onChange={(e) => {setBookingFilters({ ...bookingFilters, client: e.target.value }); setBookingCurrentPage(1);}} />
                    <Select value={bookingFilters.paymentStatus} onChange={(e) => {setBookingFilters({ ...bookingFilters, paymentStatus: e.target.value }); setBookingCurrentPage(1);}}>
                        <option value="">All Payment Status</option>
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
                        <option value="Partial">Partial</option>
                    </Select>
                    <Select value={bookingFilters.poStatus} onChange={(e) => {setBookingFilters({ ...bookingFilters, poStatus: e.target.value }); setBookingCurrentPage(1);}}>
                        <option value="">All PO Status</option>
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
                        <option value="Partial">Partial</option>
                    </Select>
                    <button
                        onClick={() => handleShowDateModal("bookings", bookingFilters, setBookingFilters)}
                        className='px-4 py-2 rounded-xl hover:bg-gray-100 hover:ring-2 ring-black w-full text-left bg-white text-black transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md text-xs'
                    >
                        {bookingFilters.startDate && bookingFilters.endDate ? `${bookingFilters.startDate} to ${bookingFilters.endDate}` : "Filter by Booking Date"}
                    </button>
                    <Button onClick={resetBookingFilters} className='bg-gray-700 text-white hover:bg-gray-800 shadow-md hover:shadow-lg'>Reset Filters</Button>
                </div>
                
                {/* New Table Structure */}
                <div className="bg-white shadow-xl rounded-xl animate-slideUp w-full overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-xs text-left text-gray-600">
                            <thead className="text-xs text-black uppercase bg-gray-100 sticky top-0 z-10 border-b border-gray-300">
                                <tr className="border-b-2 border-gray-200">
                                    {/* FIX: Passed required sortConfig and onSort props */}
                                    <SortableHeader title="Company" sortKey="companyName" sortConfig={bookingSortConfig} onSort={handleBookingSort} />
                                    <SortableHeader title="Client" sortKey="clientName" sortConfig={bookingSortConfig} onSort={handleBookingSort} />
                                    <SortableHeader title="Created At" sortKey="createdAt" sortConfig={bookingSortConfig} onSort={handleBookingSort} />
                                    <SortableHeader title="Payment Status" sortKey="paymentStatus" sortConfig={bookingSortConfig} onSort={handleBookingSort} disabled={true} />
                                    <SortableHeader title="PO Status" sortKey="poStatus" sortConfig={bookingSortConfig} onSort={handleBookingSort} disabled={true} />
                                </tr>
                            </thead>
                            <tbody>
                                {bookingTableLoading ? (
                                    <tr><td colSpan="5" className="text-center py-10 text-gray-500"><CircularProgress size={24} /></td></tr>
                                ) : bookings.length > 0 ? (
                                    bookings.map((b, index) => {
                                        let totalPaid = 0, totalDue = 0;
                                        b.campaigns?.forEach((c) => {
                                            const p = c.paymentSummary;
                                            if (p) {
                                                totalPaid += p.totalPaid || 0;
                                                totalDue += p.totalDue || 0;
                                            }
                                        });
                                        let paymentStatus = "Completed"; 
                                        if (totalDue > 0 && totalPaid < totalDue) {
                                            paymentStatus = totalPaid > 0 ? "Partial" : "Pending";
                                        }                    
                                        const poStatuses = b.campaigns?.map(c => c.poConfirmed === true) || [];
                                        let poStatus = "Pending"; 

                                        if (poStatuses.length > 0) {
                                            if (poStatuses.every(status => status === true)) {
                                                poStatus = "Completed";
                                            } else if (poStatuses.some(status => status === true)) {
                                                poStatus = "Partial";
                                            }
                                        }
                                        return (
                                            <tr 
                                                key={b._id} // Added key prop to fix warning
                                                className={`transition-all duration-200 border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50/50 hover:shadow-inner cursor-pointer`}
                                                onClick={() => navigate(`/booking-details/${b._id}`)}
                                            >
                                                <td className="px-6 py-4 font-medium text-black whitespace-nowrap">{b.companyName}</td>
                                                <td className="px-6 py-4 text-black">{b.clientName}</td>
                                                <td className="px-6 py-4 text-black">{dayjs(b.createdAt).format("DD MMM YYYY")}</td>
                                                <td className="px-6 py-4 text-black">{paymentStatus}</td>
                                                <td className="px-6 py-4 text-black">{poStatus}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan="5" className="text-center py-10 text-gray-500">No bookings found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Updated Pagination Component */}
                <Pagination 
                    currentPage={bookingCurrentPage} 
                    totalPages={bookingTotalPages} 
                    onPageChange={setBookingCurrentPage} 
                    totalCount={bookingTotalCount} 
                    itemsPerPage={ITEMS_PER_PAGE} 
                    loading={bookingTableLoading} 
                />
            </CardContent>

            {/* CARD 2: PROPOSAL REPORT TABLE */}
            <CardContent>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2 border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-sans font-normal text-black">Proposal Report ({proposalTotalCount})</h3>
                    <Button onClick={downloadProposalExcel} disabled={proposals.length === 0}>Download Full Report</Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6 items-center">
                    <Input name="person" placeholder="Client/Company Name" value={proposalTableFilters.person} onChange={handleProposalTableFilterChange} className="col-span-2 lg:col-span-1"/>
                    <Select name="industry" value={proposalTableFilters.industry} onChange={handleProposalTableFilterChange}>
                        <option value="">By Industry</option>
                        {industryOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                    </Select>
                    <Select name="inventoryType" value={proposalTableFilters.inventoryType} onChange={handleProposalTableFilterChange}>
                        <option value="">By Inventory Type</option>
                        {inventoryTypeOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                    </Select>
                    <Select name="clientType" value={proposalTableFilters.clientType} onChange={handleProposalTableFilterChange}>
                        <option value="">By Client Type</option>
                        {clientTypeOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                    </Select>
                    <Select name="bookingSource" value={proposalTableFilters.bookingSource} onChange={handleProposalTableFilterChange}>
                        <option value="">By Booking Source</option>
                        <option value="Direct">Direct</option>
                        <option value="Agency">Agency</option>
                    </Select>
                    <button 
                        onClick={() => handleShowDateModal("proposals", proposalTableFilters, setProposalTableFilters)}
                        className='px-4 py-2 rounded-xl hover:bg-gray-100 hover:ring-2 ring-black w-full text-left bg-white text-black transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md text-xs'
                    >
                        {proposalTableFilters.startDate && proposalTableFilters.endDate ? `${proposalTableFilters.startDate} to ${proposalTableFilters.endDate}` : "Filter by Proposal Date"}
                    </button>
                    <Button onClick={resetProposalTableFilters} className='bg-gray-700 text-white hover:bg-gray-800 shadow-md hover:shadow-lg'>Reset Filters</Button>
                </div>
                
                {/* New Table Structure */}
                <div className="bg-white shadow-xl rounded-xl animate-slideUp w-full overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-xs text-left text-gray-600">
                            <thead className="text-xs text-black uppercase bg-gray-100 sticky top-0 z-10 border-b border-gray-300">
                                <tr className="border-b-2 border-gray-200">
                                    {/* FIX: Passed required sortConfig and onSort props */}
                                    <SortableHeader title="Company" sortKey="companyName" sortConfig={proposalSortConfig} onSort={handleProposalSort} />
                                    <SortableHeader title="Client" sortKey="clientName" sortConfig={proposalSortConfig} onSort={handleProposalSort} />
                                    <SortableHeader title="Industry" sortKey="industry" sortConfig={proposalSortConfig} onSort={handleProposalSort} />
                                    <SortableHeader title="Client Type" sortKey="clientType" sortConfig={proposalSortConfig} onSort={handleProposalSort} />
                                    <SortableHeader title="Booking Source" sortKey="bookingSource" sortConfig={proposalSortConfig} onSort={handleProposalSort} />
                                    <SortableHeader title="Date" sortKey="createdAt" sortConfig={proposalSortConfig} onSort={handleProposalSort} />
                                    <SortableHeader title="Inventories" disabled={true} />
                                    <SortableHeader title="Type of Inventories" disabled={true} />
                                </tr>
                            </thead>
                            <tbody>
                                {proposalTableLoading ? (
                                    <tr><td colSpan="8" className="text-center py-10 text-gray-500"><CircularProgress size={24} /></td></tr>
                                ) : proposals.length > 0 ? (
                                    proposals.map((p, index) => (
                                        <tr 
                                            key={p._id} // Added key prop to fix warning
                                            className={`transition-all duration-200 border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50/50 hover:shadow-inner cursor-pointer`}
                                            onClick={() => navigate(`/proposal-details/${p._id}`)}
                                        >
                                            <td className="px-6 py-4 font-medium text-black whitespace-nowrap">{p.companyName}</td>
                                            <td className="px-6 py-4 text-black">{p.clientName}</td>
                                            <td className="px-6 py-4 text-black">{p.industry || "N/A"}</td>
                                            <td className="px-6 py-4 text-black">{p.clientType || "N/A"}</td>
                                            <td className="px-6 py-4 text-black">{p.bookingSource || "N/A"}</td>
                                            <td className="px-6 py-4 text-black">{dayjs(p.createdAt).format("DD MMM YYYY")}</td>
                                            <td className="px-6 py-4 text-gray-700">{p.spaceDetails?.map((s) => s.spaceName).join(", ") || "N/A"}</td>
                                            <td className="px-6 py-4 text-gray-700">{p.spaceDetails?.map((s) => s.spaceType).join(", ") || "N/A"}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="8" className="text-center py-10 text-gray-500">No proposals found for the selected filters.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Updated Pagination Component */}
                <Pagination 
                    currentPage={proposalCurrentPage} 
                    totalPages={proposalTotalPages} 
                    onPageChange={setProposalCurrentPage} 
                    totalCount={proposalTotalCount} 
                    itemsPerPage={ITEMS_PER_PAGE} 
                    loading={proposalTableLoading}
                />
            </CardContent>

            {/* CARD 3: PROPOSAL GRAPH */}
            <CardContent>
                <div className="flex flex-wrap items-center justify-between mb-4 gap-4 border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-sans font-normal text-black">Proposal Graph</h3>
                    <div className="flex items-center gap-2">
                        <Select value={graphDimension} onChange={(e) => setGraphDimension(e.target.value)} className="w-auto">
                            <option value="timeline">Group by Month</option>
                            <option value="industry">Group by Industry</option>
                            <option value="inventoryType">Group by Inventory Type</option>
                            <option value="clientType">Group by Client Type</option>
                            <option value="bookingSource">Group by Booking Source</option>
                        </Select>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6 items-center">
                    <Input name="person" placeholder="Client/Company Name" value={proposalGraphFilters.person} onChange={handleProposalGraphFilterChange} className="col-span-2 lg:col-span-1" />
                    <Select name="industry" value={proposalGraphFilters.industry} onChange={handleProposalGraphFilterChange}>
                        <option value="">By Industry</option>
                        {industryOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                    </Select>
                    <Select name="inventoryType" value={proposalGraphFilters.inventoryType} onChange={handleProposalGraphFilterChange}>
                        <option value="">By Inventory Type</option>
                        {inventoryTypeOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                    </Select>
                    <Select name="clientType" value={proposalGraphFilters.clientType} onChange={handleProposalGraphFilterChange}>
                        <option value="">By Client Type</option>
                        {clientTypeOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                    </Select>
                    <Select name="bookingSource" value={proposalGraphFilters.bookingSource} onChange={handleProposalGraphFilterChange}>
                        <option value="">By Booking Source</option>
                        <option value="Direct">Direct</option>
                        <option value="Agency">Agency</option>
                    </Select>
                    <button 
                        onClick={() => handleShowDateModal("graph", proposalGraphFilters, setProposalGraphFilters)}
                        className='px-4 py-2 rounded-xl hover:bg-gray-100 hover:ring-2 ring-black w-full text-left bg-white text-black transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md text-xs'
                    >
                        {proposalGraphFilters.startDate && proposalGraphFilters.endDate ? `${proposalGraphFilters.startDate} to ${proposalGraphFilters.endDate}` : "Filter by Proposal Date"}
                    </button>
                    <Button onClick={resetProposalGraphFilters} className='bg-gray-700 text-white hover:bg-gray-800 shadow-md hover:shadow-lg'>Reset Filters</Button>
                </div>

                {proposalGraphLoading ? <ShimmerCard /> : (
                    <div className="flex flex-col gap-4">
                        <p className="font-semibold text-sm w-full text-right text-black">Total Proposals: {totalProposalsForGraph.toLocaleString()}</p>
                        <div className="flex flex-grow h-96 -ml-4 -mr-2">
                            <BarChart
                                xAxis={[{ 
                                    data: proposalChartData.xLabels, 
                                    scaleType: "band", 
                                    tickLabelStyle: { angle: -45, textAnchor: "end", fontSize: 10 } 
                                }]}
                                yAxis={[{ label: "Number of Proposals" }]}
                                series={[
                                    {
                                        data: proposalChartData.yData,
                                        label: "Proposals",
                                        color: "#8b5cf6", 
                                        valueFormatter: (value) => `${value} (${totalProposalsForGraph > 0 ? ((value / totalProposalsForGraph) * 100).toFixed(1) : 0}%)`,
                                    },
                                ]}
                                grid={{ vertical: false, horizontal: true }}
                                margin={{ top: 40, right: 20, bottom: 70, left: 60 }}
                                legend={{ direction: "row", position: { vertical: "top", horizontal: "middle" }, padding: 0 }}
                            />
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Tailwind Keyframes/Animation Styles (Copied from RevenueReport for animations) */}
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