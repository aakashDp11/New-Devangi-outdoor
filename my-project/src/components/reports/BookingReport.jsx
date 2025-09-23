import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { BarChart } from "@mui/x-charts/BarChart";

// --- ENHANCED UI HELPER COMPONENTS WITH ANIMATIONS ---
const Input = ({ error, ...props }) => (
  <div className="relative">
    <input
      className={`w-full px-3 py-2 text-xs border rounded-md focus:outline-none focus:ring-2 transition-all duration-200 ease-in-out transform hover:scale-[1.02] ${
        error 
          ? 'border-red-300 focus:ring-red-500 bg-red-50' 
          : 'border-gray-300 focus:ring-blue-500 hover:border-blue-300'
      }`}
      {...props}
    />
    {error && (
      <div className="absolute top-full left-0 mt-1 text-xs text-red-600 animate-fade-in-down">
        {error}
      </div>
    )}
  </div>
);

const Select = ({ children, error, ...props }) => (
  <div className="relative">
    <select
      className={`w-full px-3 py-2 text-xs border rounded-md focus:outline-none focus:ring-2 bg-white transition-all duration-200 ease-in-out transform hover:scale-[1.02] ${
        error 
          ? 'border-red-300 focus:ring-red-500 bg-red-50' 
          : 'border-gray-300 focus:ring-blue-500 hover:border-blue-300'
      }`}
      {...props}
    >
      {children}
    </select>
    {error && (
      <div className="absolute top-full left-0 mt-1 text-xs text-red-600 animate-fade-in-down">
        {error}
      </div>
    )}
  </div>
);

const Button = ({ children, loading, disabled, variant = 'primary', ...props }) => {
  const baseClasses = "px-4 py-2 text-xs font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";
  
  const variants = {
    primary: "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 hover:shadow-lg",
    secondary: "text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-gray-500",
    danger: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 hover:shadow-lg"
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${loading ? 'animate-pulse' : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
          Loading...
        </div>
      ) : children}
    </button>
  );
};

const Card = ({ children, className, animate = true }) => (
  <div className={`bg-white shadow-md rounded-lg overflow-hidden p-6 transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children }) => (
  <div className="animate-fade-in">
    {children}
  </div>
);

const SortableHeader = ({ title, sortKey, sortConfig = {}, onSort, disabled = false }) => {
  const isSorting = sortConfig.key === sortKey;
  const direction = isSorting ? sortConfig.direction : null;

  const handleSort = () => {
    if (disabled) return;
    const newDirection = sortConfig.key === sortKey && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    onSort(sortKey, newDirection);
  };

  return (
    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
      <div
        onClick={handleSort}
        className={`flex items-center gap-1.5 transition-all duration-200 ${
          disabled 
            ? 'cursor-default' 
            : 'cursor-pointer select-none hover:text-blue-600 transform hover:scale-105'
        }`}
      >
        {title}
        {!disabled && (
          <span className={`text-gray-400 transition-all duration-200 ${isSorting ? 'text-blue-600' : ''}`}>
            {direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '⇅'}
          </span>
        )}
      </div>
    </th>
  );
};

const EnhancedPaginationControls = ({ currentPage, totalPages, onPageChange, totalCount, itemsPerPage }) => {
    const [pageInput, setPageInput] = useState(currentPage.toString());
    const [pageError, setPageError] = useState('');

    useEffect(() => {
        setPageInput(currentPage.toString());
        setPageError('');
    }, [currentPage]);

    const handlePageSubmit = (e) => {
        e.preventDefault();
        const pageNum = parseInt(pageInput, 10);
        
        if (!pageInput.trim()) {
            setPageError('Page number is required');
            return;
        }
        
        if (isNaN(pageNum) || pageNum < 1) {
            setPageError('Please enter a valid page number');
            return;
        }
        
        if (pageNum > totalPages) {
            setPageError(`Page cannot exceed ${totalPages}`);
            return;
        }
        
        setPageError('');
        onPageChange(pageNum);
    };

    const handlePageInputChange = (e) => {
        setPageInput(e.target.value);
        if (pageError) setPageError('');
    };

    if (totalCount === 0) return null;

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-xs gap-4 animate-fade-in">
            <span className="text-gray-600 animate-slide-in-left">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
            </span>
            {totalPages > 1 && (
                <div className="flex items-center gap-2 animate-slide-in-right">
                    <button 
                        onClick={() => onPageChange(currentPage > 1 ? currentPage - 1 : 1)} 
                        disabled={currentPage === 1} 
                        className="px-3 py-1.5 border rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                    >
                        Previous
                    </button>
                    <form onSubmit={handlePageSubmit} className="flex items-center gap-2 relative">
                        <span className="text-gray-700">Page</span>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={pageInput} 
                                onChange={handlePageInputChange}
                                className={`w-10 h-7 text-center border rounded-md focus:outline-none focus:ring-1 transition-all duration-200 ${
                                    pageError ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            />
                            {pageError && (
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-xs text-red-600 whitespace-nowrap animate-fade-in-down">
                                    {pageError}
                                </div>
                            )}
                        </div>
                        <span className="text-gray-700">of {totalPages}</span>
                    </form>
                    <button 
                        onClick={() => onPageChange(currentPage < totalPages ? currentPage + 1 : totalPages)} 
                        disabled={currentPage === totalPages} 
                        className="px-3 py-1.5 border rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

// Loading Spinner Component
const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex justify-center items-center py-8">
      <div className={`${sizeClasses[size]} border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
    </div>
  );
};

// Error Message Component
const ErrorMessage = ({ message }) => (
  <div className="text-center py-8 animate-fade-in">
    <div className="inline-flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-md">
      <span>⚠️</span>
      <span className="text-sm">{message}</span>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
const ITEMS_PER_PAGE = 10;
const API_MAX_LIMIT = 50;

const industryOptions = ["Tourism", "Retail", "Real Estate", "Other", "Movie", "Media and Entertainment", "FMCG", "Finance", "Financial Services", "Healthcare", "Hospitality", "IT Industry", "Automobile", "Clothing & Apparel", "Ecommerce", "Edtech", "Entertainment"];
const inventoryTypeOptions = ["Billboard", "DOOH", "Gantry", "Pole Kiosk", "BQS","DigitalBQS","Miscellaneous"];
const clientTypeOptions = ["Corporate", "Agency", "Direct", "Government"];

export default function BookingReport({ handleShowDateModal = () => {} }) {
  const navigate = useNavigate();

  // --- BOOKING REPORT STATE & LOGIC ---
  const [bookings, setBookings] = useState([]);
  const [bookingFilters, setBookingFilters] = useState({ client: "", paymentStatus: "", poStatus: "", startDate: "", endDate: "" });
  const [bookingCurrentPage, setBookingCurrentPage] = useState(1);
  const [bookingTotalPages, setBookingTotalPages] = useState(1);
  const [bookingTotalCount, setBookingTotalCount] = useState(0);
  const [bookingSortConfig, setBookingSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingDownloadLoading, setBookingDownloadLoading] = useState(false);
  const [bookingFilterErrors, setBookingFilterErrors] = useState({});

  // Validation function for booking filters
  const validateBookingFilters = (filters) => {
    const errors = {};
    
    if (filters.client && filters.client.trim().length < 2) {
      errors.client = 'Client name must be at least 2 characters';
    }
    
    if (filters.startDate && filters.endDate) {
      if (dayjs(filters.startDate).isAfter(dayjs(filters.endDate))) {
        errors.dateRange = 'Start date cannot be after end date';
      }
      if (dayjs(filters.startDate).isAfter(dayjs())) {
        errors.startDate = 'Start date cannot be in the future';
      }
    }
    
    return errors;
  };

  const resetBookingFilters = () => {
    setBookingFilters({ client: "", paymentStatus: "", poStatus: "", startDate: "", endDate: "" });
    setBookingCurrentPage(1);
    setBookingFilterErrors({});
  };

  const handleBookingSort = (key, direction) => {
    setBookingSortConfig({ key, direction });
    setBookingCurrentPage(1);
  };

  const handleBookingFilterChange = (field, value) => {
    const newFilters = { ...bookingFilters, [field]: value };
    setBookingFilters(newFilters);
    setBookingCurrentPage(1);
    
    // Real-time validation
    const errors = validateBookingFilters(newFilters);
    setBookingFilterErrors(errors);
  };

  const fetchBookings = async () => {
    // Check for validation errors before fetching
    const errors = validateBookingFilters(bookingFilters);
    if (Object.keys(errors).length > 0) {
      setBookingFilterErrors(errors);
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) { 
        navigate("/login"); 
        return; 
      }

      const params = new URLSearchParams({
        page: bookingCurrentPage,
        limit: ITEMS_PER_PAGE,
        sortKey: bookingSortConfig.key,
        sortDirection: bookingSortConfig.direction,
      });
      
      if (bookingFilters.client?.trim()) params.append("search", bookingFilters.client.trim());
      if (bookingFilters.paymentStatus) params.append("paymentStatus", bookingFilters.paymentStatus);
      if (bookingFilters.poStatus) params.append("poStatus", bookingFilters.poStatus);
      if (bookingFilters.startDate) params.append("startDate", bookingFilters.startDate);
      if (bookingFilters.endDate) params.append("endDate", bookingFilters.endDate);

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings?${params.toString()}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) { 
        localStorage.clear(); 
        navigate("/login"); 
        return; 
      }
      
      if (!res.ok) throw new Error(`Failed to fetch bookings: ${res.status}`);

      const data = await res.json();
      setBookings(data.bookings || []);
      setBookingTotalPages(data.pagination?.totalPages || 1);
      setBookingTotalCount(data.pagination?.totalCount || 0);
      
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      setBookingError('Failed to load bookings. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const downloadBookingExcel = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setBookingError("Authentication failed. Please log in again.");
      return;
    }

    // Check validation before download
    const errors = validateBookingFilters(bookingFilters);
    if (Object.keys(errors).length > 0) {
      setBookingFilterErrors(errors);
      return;
    }

    setBookingDownloadLoading(true);

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
            
            if (bookingFilters.client?.trim()) params.append("search", bookingFilters.client.trim());
            if (bookingFilters.paymentStatus) params.append("paymentStatus", bookingFilters.paymentStatus);
            if (bookingFilters.poStatus) params.append("poStatus", bookingFilters.poStatus);
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
            setBookingError("No booking data to download with current filters.");
            return;
        }

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
        setBookingError("Failed to download the report. Please try again.");
    } finally {
        setBookingDownloadLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [bookingFilters, bookingCurrentPage, bookingSortConfig]);

  // --- PROPOSAL REPORT TABLE STATE & LOGIC ---
  const [proposals, setProposals] = useState([]);
  const [proposalTableFilters, setProposalTableFilters] = useState({ startDate: "", endDate: "", person: "", industry: "", inventoryType: "", clientType: "", bookingSource: "" });
  const [proposalCurrentPage, setProposalCurrentPage] = useState(1);
  const [proposalTotalPages, setProposalTotalPages] = useState(1);
  const [proposalTotalCount, setProposalTotalCount] = useState(0);
  const [proposalSortConfig, setProposalSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposalError, setProposalError] = useState('');
  const [proposalDownloadLoading, setProposalDownloadLoading] = useState(false);
  const [proposalFilterErrors, setProposalFilterErrors] = useState({});

  // Validation function for proposal filters
  const validateProposalFilters = (filters) => {
    const errors = {};
    
    if (filters.person && filters.person.trim().length < 2) {
      errors.person = 'Search term must be at least 2 characters';
    }
    
    if (filters.startDate && filters.endDate) {
      if (dayjs(filters.startDate).isAfter(dayjs(filters.endDate))) {
        errors.dateRange = 'Start date cannot be after end date';
      }
      if (dayjs(filters.startDate).isAfter(dayjs())) {
        errors.startDate = 'Start date cannot be in the future';
      }
    }
    
    return errors;
  };

  const resetProposalTableFilters = () => {
    setProposalTableFilters({ startDate: "", endDate: "", person: "", industry: "", inventoryType: "", clientType: "", bookingSource: "" });
    setProposalCurrentPage(1);
    setProposalFilterErrors({});
  };

  const handleProposalSort = (key, direction) => {
    setProposalSortConfig({ key, direction });
    setProposalCurrentPage(1);
  };

  const handleProposalTableFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...proposalTableFilters, [name]: value };
    setProposalTableFilters(newFilters);
    setProposalCurrentPage(1);
    
    // Real-time validation
    const errors = validateProposalFilters(newFilters);
    setProposalFilterErrors(errors);
  };

  const fetchProposals = async () => {
    // Check for validation errors before fetching
    const errors = validateProposalFilters(proposalTableFilters);
    if (Object.keys(errors).length > 0) {
      setProposalFilterErrors(errors);
      return;
    }

    setProposalLoading(true);
    setProposalError('');
    
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) { 
        navigate("/login"); 
        return; 
      }

      const params = new URLSearchParams({
        page: proposalCurrentPage,
        limit: ITEMS_PER_PAGE,
        sortKey: proposalSortConfig.key,
        sortDirection: proposalSortConfig.direction,
      });
      
      Object.entries(proposalTableFilters).forEach(([key, value]) => {
        if (value?.trim()) params.append(key, value.trim());
      });

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/proposals/proposalreport?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to fetch proposals: ${res.status}`);
      
      const data = await res.json();
      setProposals(data.proposals || []);
      setProposalTotalPages(data.pagination?.totalPages || 1);
      setProposalTotalCount(data.pagination?.totalCount || 0);
      
    } catch (err) {
      console.error("Failed to fetch proposals:", err);
      setProposalError('Failed to load proposals. Please try again.');
    } finally {
      setProposalLoading(false);
    }
  };
  
  const downloadProposalExcel = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setProposalError("Authentication failed. Please log in again.");
      return;
    }

    // Check validation before download
    const errors = validateProposalFilters(proposalTableFilters);
    if (Object.keys(errors).length > 0) {
      setProposalFilterErrors(errors);
      return;
    }

    setProposalDownloadLoading(true);

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
                if (value?.trim()) params.append(key, value.trim());
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
            setProposalError("No proposal data to download with current filters.");
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
        setProposalError("Failed to download the report. Please try again.");
    } finally {
        setProposalDownloadLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [proposalTableFilters, proposalCurrentPage, proposalSortConfig]);

  // --- PROPOSAL GRAPH STATE & LOGIC ---
  const [graphDimension, setGraphDimension] = useState("timeline");
  const [proposalChartData, setProposalChartData] = useState({ xLabels: [], yData: [] });
  const [totalProposalsForGraph, setTotalProposalsForGraph] = useState(0);
  const [proposalGraphFilters, setProposalGraphFilters] = useState({
    startDate: "", endDate: "", person: "", industry: "", inventoryType: "", clientType: "", bookingSource: "",
  });
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState('');
  const [graphFilterErrors, setGraphFilterErrors] = useState({});

  // Validation function for graph filters
  const validateGraphFilters = (filters) => {
    const errors = {};
    
    if (filters.person && filters.person.trim().length < 2) {
      errors.person = 'Search term must be at least 2 characters';
    }
    
    if (filters.startDate && filters.endDate) {
      if (dayjs(filters.startDate).isAfter(dayjs(filters.endDate))) {
        errors.dateRange = 'Start date cannot be after end date';
      }
      if (dayjs(filters.startDate).isAfter(dayjs())) {
        errors.startDate = 'Start date cannot be in the future';
      }
    }
    
    return errors;
  };

  const resetProposalGraphFilters = () => {
    setProposalGraphFilters({
        startDate: "", endDate: "", person: "", industry: "", inventoryType: "", clientType: "", bookingSource: ""
    });
    setGraphFilterErrors({});
  };

  const handleProposalGraphFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...proposalGraphFilters, [name]: value };
    setProposalGraphFilters(newFilters);
    
    // Real-time validation
    const errors = validateGraphFilters(newFilters);
    setGraphFilterErrors(errors);
  };

  useEffect(() => {
    const fetchAndProcessGraphData = async () => {
      // Check for validation errors before fetching
      const errors = validateGraphFilters(proposalGraphFilters);
      if (Object.keys(errors).length > 0) {
        setGraphFilterErrors(errors);
        return;
      }

      setGraphLoading(true);
      setGraphError('');
      
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) { 
          navigate("/login"); 
          return; 
        }

        const params = new URLSearchParams({ limit: "2000" });
        Object.entries(proposalGraphFilters).forEach(([key, value]) => {
          if (value?.trim()) params.append(key, value.trim());
        });

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/proposals/proposalreport?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`Failed to fetch graph data: ${res.status}`);
        
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
        setGraphError('Failed to load graph data. Please try again.');
        setProposalChartData({ xLabels: [], yData: [] });
      } finally {
        setGraphLoading(false);
      }
    };
    
    fetchAndProcessGraphData();
  }, [proposalGraphFilters, graphDimension, navigate]);

  // Add CSS for custom animations
  const customStyles = `
    <style>
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes fade-in-down {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes slide-in-left {
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      
      @keyframes slide-in-right {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      
      .animate-fade-in {
        animation: fade-in 0.3s ease-in-out;
      }
      
      .animate-fade-in-down {
        animation: fade-in-down 0.3s ease-in-out;
      }
      
      .animate-slide-in-left {
        animation: slide-in-left 0.5s ease-in-out;
      }
      
      .animate-slide-in-right {
        animation: slide-in-right 0.5s ease-in-out;
      }
      
      .table-row-enter {
        animation: fade-in-down 0.3s ease-in-out;
      }
      
      .hover-scale:hover {
        transform: scale(1.02);
        transition: transform 0.2s ease-in-out;
      }
    </style>
  `;

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="space-y-10 animate-fade-in">
        {/* CARD 1: BOOKING REPORT TABLE */}
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 animate-slide-in-left">
              Booking Report ({bookingTotalCount})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 items-start">
              <Input 
                placeholder="Client Name" 
                value={bookingFilters.client} 
                onChange={(e) => handleBookingFilterChange('client', e.target.value)}
                error={bookingFilterErrors.client}
              />
              
              <Select 
                value={bookingFilters.paymentStatus} 
                onChange={(e) => handleBookingFilterChange('paymentStatus', e.target.value)}
              >
                <option value="">All Payment Status</option>
                <option value="Paid">Completed</option>
                <option value="Unpaid">Pending</option>
                <option value="Partial">Partial</option>
              </Select>
              
              <Select 
                value={bookingFilters.poStatus} 
                onChange={(e) => handleBookingFilterChange('poStatus', e.target.value)}
              >
                <option value="">All PO Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
              </Select>
              
              <div className="relative">
                <button 
                  onClick={() => handleShowDateModal("bookings", bookingFilters, setBookingFilters)} 
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {bookingFilters.startDate && bookingFilters.endDate 
                    ? `${bookingFilters.startDate} to ${bookingFilters.endDate}` 
                    : "Filter by Booking Date"
                  }
                </button>
                {(bookingFilterErrors.startDate || bookingFilterErrors.dateRange) && (
                  <div className="absolute top-full left-0 mt-1 text-xs text-red-600 animate-fade-in-down">
                    {bookingFilterErrors.startDate || bookingFilterErrors.dateRange}
                  </div>
                )}
              </div>
              
              <Button onClick={resetBookingFilters} variant="secondary">
                Reset Filters
              </Button>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold text-gray-700">Bookings Table</h3>
              <Button 
                onClick={downloadBookingExcel} 
                disabled={bookings.length === 0 || Object.keys(bookingFilterErrors).length > 0}
                loading={bookingDownloadLoading}
              >
                Download Full Report
              </Button>
            </div>

            {bookingError && <ErrorMessage message={bookingError} />}
            
            <div className="overflow-x-auto relative shadow-md sm:rounded-lg bg-white">
              <table className="w-full text-xs text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <SortableHeader title="Company" sortKey="companyName" sortConfig={bookingSortConfig} onSort={handleBookingSort} />
                    <SortableHeader title="Client" sortKey="clientName" sortConfig={bookingSortConfig} onSort={handleBookingSort} />
                    <SortableHeader title="Created At" sortKey="createdAt" sortConfig={bookingSortConfig} onSort={handleBookingSort} />
                    <SortableHeader title="Payment Status" disabled={true} />
                    <SortableHeader title="PO Status" disabled={true} />
                  </tr>
                </thead>
                <tbody>
  {bookingLoading ? (
    <tr>
      <td colSpan="5">
        <LoadingSpinner />
      </td>
    </tr>
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
          key={b._id} 
          className={`bg-white border-b hover:bg-gray-50 cursor-pointer transition-all duration-200 hover-scale table-row-enter ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`} 
          onClick={() => navigate(`/booking-details/${b._id}`)}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{b.companyName}</td>
          <td className="px-6 py-4">{b.clientName}</td>
          <td className="px-6 py-4">{dayjs(b.createdAt).format("DD MMM YYYY")}</td>
          <td className="px-6 py-4">
            <span className={`px-2 py-1 text-xs rounded-full ${
              paymentStatus === 'Completed' ? 'bg-green-100 text-green-800' :
              paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {paymentStatus}
            </span>
          </td>
          <td className="px-6 py-4">
            <span className={`px-2 py-1 text-xs rounded-full ${
              poStatus === 'Completed' ? 'bg-green-100 text-green-800' :
              poStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {poStatus}
            </span>
          </td>
        </tr>
      );
    })
  ) : (
    <tr><td colSpan="5" className="text-center py-10 text-gray-500">No bookings found.</td></tr>
  )}
</tbody>
              </table>
            </div>
            
            <EnhancedPaginationControls 
              currentPage={bookingCurrentPage} 
              totalPages={bookingTotalPages} 
              onPageChange={setBookingCurrentPage} 
              totalCount={bookingTotalCount} 
              itemsPerPage={ITEMS_PER_PAGE} 
            />
          </CardContent>
        </Card>

        {/* CARD 2: PROPOSAL REPORT TABLE */}
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 animate-slide-in-left">
              Proposal Report ({proposalTotalCount})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6 items-start">
              <Input 
                name="person" 
                placeholder="By Client Name , By Company Name" 
                value={proposalTableFilters.person} 
                onChange={handleProposalTableFilterChange}
                error={proposalFilterErrors.person}
              />
              
              <Select 
                name="industry" 
                value={proposalTableFilters.industry} 
                onChange={handleProposalTableFilterChange}
              >
                <option value="">By Industry</option>
                {industryOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </Select>
              
              <Select 
                name="inventoryType" 
                value={proposalTableFilters.inventoryType} 
                onChange={handleProposalTableFilterChange}
              >
                <option value="">By Inventory Type</option>
                {inventoryTypeOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </Select>
              
              <Select 
                name="clientType" 
                value={proposalTableFilters.clientType} 
                onChange={handleProposalTableFilterChange}
              >
                <option value="">By Client Type</option>
                {clientTypeOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </Select>
              
              <Select 
                name="bookingSource" 
                value={proposalTableFilters.bookingSource} 
                onChange={handleProposalTableFilterChange}
              >
                  <option value="">By Booking Source</option>
                  <option value="Direct">Direct</option>
                  <option value="Agency">Agency</option>
              </Select>
              
              <div className="relative">
                <button 
                  onClick={() => handleShowDateModal("proposals", proposalTableFilters, setProposalTableFilters)} 
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {proposalTableFilters.startDate && proposalTableFilters.endDate 
                    ? `${proposalTableFilters.startDate} to ${proposalTableFilters.endDate}` 
                    : "Filter by Proposal Date"
                  }
                </button>
                {(proposalFilterErrors.startDate || proposalFilterErrors.dateRange) && (
                  <div className="absolute top-full left-0 mt-1 text-xs text-red-600 animate-fade-in-down">
                    {proposalFilterErrors.startDate || proposalFilterErrors.dateRange}
                  </div>
                )}
              </div>
              
              <Button onClick={resetProposalTableFilters} variant="secondary">
                Reset Filters
              </Button>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold text-gray-700">Proposals Table</h3>
              <Button 
                onClick={downloadProposalExcel} 
                disabled={proposals.length === 0 || Object.keys(proposalFilterErrors).length > 0}
                loading={proposalDownloadLoading}
              >
                Download Full Report
              </Button>
            </div>

            {proposalError && <ErrorMessage message={proposalError} />}
            
            <div className="overflow-x-auto relative shadow-md sm:rounded-lg bg-white">
              <table className="w-full text-xs text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
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
  {proposalLoading ? (
    <tr>
      <td colSpan="8">
        <LoadingSpinner />
      </td>
    </tr>
  ) : proposals.length > 0 ? (
    proposals.map((p, index) => (
      <tr 
        key={p._id} 
        className={`bg-white border-b hover:bg-gray-50 cursor-pointer transition-all duration-200 hover-scale table-row-enter ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`} 
        onClick={() => navigate(`/proposal-details/${p._id}`)}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{p.companyName}</td>
        <td className="px-6 py-4">{p.clientName}</td>
        <td className="px-6 py-4">{p.industry || "N/A"}</td>
        <td className="px-6 py-4">{p.clientType || "N/A"}</td>
        <td className="px-6 py-4">{p.bookingSource || "N/A"}</td>
        <td className="px-6 py-4">{dayjs(p.createdAt).format("DD MMM YYYY")}</td>
        <td className="px-6 py-4">{p.spaceDetails?.map((s) => s.spaceName).join(", ") || "N/A"}</td>
        <td className="px-6 py-4">{p.spaceDetails?.map((s) => s.spaceType).join(", ") || "N/A"}</td>
      </tr>
    ))
  ) : (
    <tr><td colSpan="8" className="text-center py-10 text-gray-500">No proposals found for the selected filters.</td></tr>
  )}
</tbody>
              </table>
            </div>
            
            <EnhancedPaginationControls 
              currentPage={proposalCurrentPage} 
              totalPages={proposalTotalPages} 
              onPageChange={setProposalCurrentPage} 
              totalCount={proposalTotalCount} 
              itemsPerPage={ITEMS_PER_PAGE} 
            />
          </CardContent>
        </Card>

        {/* CARD 3: PROPOSAL GRAPH */}
        <Card>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 animate-slide-in-left">Proposal Graph</h3>
              <div className="flex gap-2">
                <Select 
                  value={graphDimension} 
                  onChange={(e) => setGraphDimension(e.target.value)}
                  className="w-auto"
                >
                  <option value="timeline">Timeline</option>
                  <option value="industry">Industry</option>
                  <option value="clientType">Client Type</option>
                  <option value="inventoryType">Inventory Type</option>
                  <option value="bookingSource">Booking Source</option>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6 p-4 items-start">
              <Input 
                name="person" 
                placeholder="By Client Name , By Company Name" 
                value={proposalGraphFilters.person} 
                onChange={handleProposalGraphFilterChange}
                error={graphFilterErrors.person}
              />
              
              <Select 
                name="industry" 
                value={proposalGraphFilters.industry} 
                onChange={handleProposalGraphFilterChange}
              >
                <option value="">By Industry</option>
                {industryOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </Select>
              
              <Select 
                name="inventoryType" 
                value={proposalGraphFilters.inventoryType} 
                onChange={handleProposalGraphFilterChange}
              >
                <option value="">By Inventory Type</option>
                {inventoryTypeOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </Select>
              
              <Select 
                name="clientType" 
                value={proposalGraphFilters.clientType} 
                onChange={handleProposalGraphFilterChange}
              >
                <option value="">By Client Type</option>
                {clientTypeOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </Select>
              
              <Select 
                name="bookingSource" 
                value={proposalGraphFilters.bookingSource} 
                onChange={handleProposalGraphFilterChange}
              >
                  <option value="">By Booking Source</option>
                  <option value="Direct">Direct</option>
                  <option value="Agency">Agency</option>
              </Select>
              
              <div className="relative">
                <button 
                  onClick={() => handleShowDateModal("graph", proposalGraphFilters, setProposalGraphFilters)} 
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50 bg-white transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {proposalGraphFilters.startDate && proposalGraphFilters.endDate 
                    ? `${proposalGraphFilters.startDate} to ${proposalGraphFilters.endDate}` 
                    : "Filter by Proposal Date"
                  }
                </button>
                {(graphFilterErrors.startDate || graphFilterErrors.dateRange) && (
                  <div className="absolute top-full left-0 mt-1 text-xs text-red-600 animate-fade-in-down">
                    {graphFilterErrors.startDate || graphFilterErrors.dateRange}
                  </div>
                )}
              </div>
              
              <Button onClick={resetProposalGraphFilters} variant="secondary">
                Reset Filters
              </Button>
            </div>

            {graphError && <ErrorMessage message={graphError} />}
            
            <div className="flex flex-grow h-96 -ml-4 -mr-2 relative">
              {graphLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <div className="w-full animate-fade-in">
                  <BarChart
                    xAxis={[{ data: proposalChartData.xLabels, scaleType: "band", tickLabelStyle: { angle: -45, textAnchor: "end", fontSize: 10 } }]}
                    yAxis={[{ label: "Number of Proposals" }]}
                    series={[
                      {
                        data: proposalChartData.yData,
                        label: "Proposals",
                        color: "#34d399",
                        valueFormatter: (value) => `${value} (${totalProposalsForGraph > 0 ? ((value / totalProposalsForGraph) * 100).toFixed(1) : 0}%)`,
                      },
                    ]}
                    grid={{ vertical: false, horizontal: true }}
                    margin={{ top: 40, right: 20, bottom: 70, left: 60 }}
                    legend={{ direction: "row", position: { vertical: "top", horizontal: "middle" }, padding: 0 }}
                  />
                </div>
              )}
            </div>
            
            {totalProposalsForGraph > 0 && (
              <div className="mt-4 text-center text-sm text-gray-600 animate-fade-in">
                Total Proposals: <span className="font-semibold text-blue-600">{totalProposalsForGraph}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}