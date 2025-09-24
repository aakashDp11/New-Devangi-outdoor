import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { LineChart, BarChart, PieChart } from "@mui/x-charts";
import { CircularProgress } from "@mui/material";
import { FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { DateRange } from 'react-date-range';
import { format } from 'date-fns';

// --- ENHANCED UI HELPER COMPONENTS WITH ANIMATIONS ---
const Input = ({ error, ...props }) => (
  <div className="relative">
    <input
      className={`w-full px-3 py-2 text-xs border rounded-md focus:outline-none focus:ring-2 transition-all duration-300 transform hover:scale-[1.02] ${
        error 
          ? 'border-red-300 focus:ring-red-500 bg-red-50' 
          : 'border-gray-300 focus:ring-blue-500 hover:border-blue-400'
      }`}
      {...props}
    />
    {error && (
      <div className="absolute -bottom-5 left-0 text-xs text-red-500 animate-fade-in">
        {error}
      </div>
    )}
  </div>
);

const Button = ({ children, loading = false, disabled = false, variant = "primary", ...props }) => {
  const baseClasses = "px-4 py-2 text-xs font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-lg hover:shadow-xl",
    secondary: "text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-gray-500 shadow-md hover:shadow-lg",
    danger: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-lg hover:shadow-xl"
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

const Card = ({ children, className, animate = true }) => (
  <div className={`bg-white shadow-md rounded-lg overflow-hidden p-6 transition-all duration-500 ${
    animate ? 'hover:shadow-xl transform hover:-translate-y-1' : ''
  } ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children }) => (
  <div className="animate-fade-in">{children}</div>
);

const ShimmerCard = () => (
  <div className="h-80 bg-gray-200 rounded-lg animate-pulse">
    <div className="p-6 h-full flex items-center justify-center text-gray-400">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="animate-bounce">Loading Chart...</span>
      </div>
    </div>
  </div>
);

const Select = ({ error, ...props }) => (
  <div className="relative">
    <select
      className={`w-full px-3 py-2 text-xs border rounded-md focus:outline-none focus:ring-2 transition-all duration-300 transform hover:scale-[1.02] ${
        error 
          ? 'border-red-300 focus:ring-red-500 bg-red-50' 
          : 'border-gray-300 focus:ring-blue-500 hover:border-blue-400'
      }`}
      {...props}
    >
      {props.children}
    </select>
    {error && (
      <div className="absolute -bottom-5 left-0 text-xs text-red-500 animate-fade-in">
        {error}
      </div>
    )}
  </div>
);

const SortableHeader = ({ title, sortKey, sortConfig, onSort, disabled = false }) => {
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
          <span className={`text-gray-400 transition-all duration-200 ${
            isSorting ? 'text-blue-600 transform scale-125' : ''
          }`}>
            {direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '⇅'}
          </span>
        )}
      </div>
    </th>
  );
};

const EnhancedPaginationControls = ({ currentPage, totalPages, onPageChange, totalCount, itemsPerPage }) => {
    const [pageInput, setPageInput] = useState(currentPage.toString());
    const [inputError, setInputError] = useState("");

    useEffect(() => {
        setPageInput(currentPage.toString());
        setInputError("");
    }, [currentPage]);

    const validatePageInput = (value) => {
        const pageNum = parseInt(value, 10);
        if (!value.trim()) {
            return "Page number required";
        }
        if (isNaN(pageNum)) {
            return "Must be a number";
        }
        if (pageNum < 1) {
            return "Must be at least 1";
        }
        if (pageNum > totalPages) {
            return `Max page is ${totalPages}`;
        }
        return "";
    };

    const handlePageInputChange = (e) => {
        const value = e.target.value;
        setPageInput(value);
        setInputError(validatePageInput(value));
    };

    const handlePageSubmit = (e) => {
        e.preventDefault();
        const error = validatePageInput(pageInput);
        if (!error) {
            onPageChange(parseInt(pageInput, 10));
        } else {
            setInputError(error);
        }
    };

    if (totalCount === 0) return null;

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-xs gap-4 animate-slide-up">
            <span className="text-gray-600">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
            </span>
            {totalPages > 1 && (
                <div className="flex items-center gap-2">
                    <Button 
                        onClick={() => onPageChange(currentPage > 1 ? currentPage - 1 : 1)} 
                        disabled={currentPage === 1} 
                        variant="secondary"
                    >
                        Previous
                    </Button>
                    <form onSubmit={handlePageSubmit} className="flex items-center gap-2">
                        <span className="text-gray-700">Page</span>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={pageInput} 
                                onChange={handlePageInputChange}
                                className={`w-10 h-7 text-center border rounded-md focus:outline-none focus:ring-1 transition-all duration-300 ${
                                    inputError ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            />
                            {inputError && (
                                <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-red-500 whitespace-nowrap animate-fade-in">
                                    {inputError}
                                </div>
                            )}
                        </div>
                        <span className="text-gray-700">of {totalPages}</span>
                    </form>
                    <Button 
                        onClick={() => onPageChange(currentPage < totalPages ? currentPage + 1 : totalPages)} 
                        disabled={currentPage === totalPages}
                        variant="secondary"
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
};

// --- VALIDATION UTILITIES ---
const validateDateRange = (startDate, endDate) => {
    if (startDate && endDate && dayjs(startDate).isAfter(dayjs(endDate))) {
        return "Start date must be before end date";
    }
    return "";
};

const validateSearchInput = (value, minLength = 2) => {
    if (value && value.length < minLength) {
        return `Minimum ${minLength} characters required`;
    }
    return "";
};

// --- End of UI Helper Components ---

const ITEMS_PER_PAGE = 10;

export default function RevenueReport({
  bookingStats = [],
  loadingCharts,
  navigate,
}) {
  const [showDateModal, setShowDateModal] = useState(false);
  const [modalContext, setModalContext] = useState(null);

  const handleShowDateModal = (reportType, currentFilters, onApply) => {
    setModalContext({ reportType, currentFilters, onApply });
    setShowDateModal(true);
  };
  
  const handleApplyDateModal = (newDateRange) => {
    if (modalContext) {
      const startDate = newDateRange[0].startDate ? dayjs(newDateRange[0].startDate).format("YYYY-MM-DD") : "";
      const endDate = newDateRange[0].endDate ? dayjs(newDateRange[0].endDate).format("YYYY-MM-DD") : "";
      modalContext.onApply({ ...modalContext.currentFilters, startDate, endDate });
    }
    setShowDateModal(false);
  };
  
  const handleCancelDateModal = () => {
    setShowDateModal(false);
    setModalContext(null);
  };
  

  // --- STATE & LOGIC FOR REVENUE GRAPH ---
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

  // --- VALIDATION STATES ---
  const [agencyDateError, setAgencyDateError] = useState("");
  const [industryDateError, setIndustryDateError] = useState("");

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

  // --- STATE & LOGIC FOR PAYMENTS TABLE ---
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
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // --- PAYMENT VALIDATION STATES ---
  const [paymentErrors, setPaymentErrors] = useState({
    clientName: "",
    bookingName: "",
    dateRange: ""
  });

  const validatePaymentFilters = (filters) => {
    const errors = {};
    errors.clientName = validateSearchInput(filters.clientName);
    errors.bookingName = validateSearchInput(filters.bookingName);
    errors.dateRange = validateDateRange(filters.startDate, filters.endDate);
    return errors;
  };
  
  const resetPaymentFilters = () => {
    setPaymentFilters({
      clientName: "",
      bookingName: "",
      startDate: "",
      endDate: "",
    });
    setPaymentErrors({
      clientName: "",
      bookingName: "",
      dateRange: ""
    });
    setPaymentCurrentPage(1);
  };

  const handlePaymentFilterChange = (field, value) => {
    const newFilters = { ...paymentFilters, [field]: value };
    setPaymentFilters(newFilters);
    
    const errors = validatePaymentFilters(newFilters);
    setPaymentErrors(errors);
    
    if (!errors[field] && !errors.dateRange) {
      setPaymentCurrentPage(1);
    }
  };

  const handlePaymentSort = (key, direction) => {
    setPaymentSortConfig({ key, direction });
    setPaymentCurrentPage(1);
  };

  useEffect(() => {
    const errors = validatePaymentFilters(paymentFilters);
    const hasErrors = Object.values(errors).some(error => error);
    if (!hasErrors) {
      fetchPaymentReport();
    }
  }, [paymentFilters, paymentCurrentPage, paymentSortConfig]);

  const fetchPaymentReport = async () => {
    setPaymentLoading(true);
    try {
      const params = new URLSearchParams({
        page: paymentCurrentPage,
        limit: ITEMS_PER_PAGE,
        sortKey: paymentSortConfig.key,
        sortDirection: paymentSortConfig.direction,
      });

      if (paymentFilters.clientName && !paymentErrors.clientName)
        params.append("clientName", paymentFilters.clientName);
      if (paymentFilters.bookingName && !paymentErrors.bookingName)
        params.append("bookingName", paymentFilters.bookingName);
      if (paymentFilters.startDate && !paymentErrors.dateRange)
        params.append("startDate", paymentFilters.startDate);
      if (paymentFilters.endDate && !paymentErrors.dateRange)
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
      setPaymentLoading(false);
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

  // --- AGENCY DATA FETCHING WITH VALIDATION ---
  useEffect(() => {
    const error = validateDateRange(agencyFilters.startDate, agencyFilters.endDate);
    setAgencyDateError(error);
    if (!error) {
      fetchRevenueByAgency();
    }
  }, [agencyFilters]);

  useEffect(() => {
    const error = validateDateRange(industryFilters.startDate, industryFilters.endDate);
    setIndustryDateError(error);
    if (!error) {
      fetchRevenueByIndustry();
    }
  }, [industryFilters]);
  
  const resetAgencyFilters = () => {
    setagencyFilters({
      startDate: "",
      endDate: "",
    });
    setAgencyDateError("");
  };

  const resetIndustryFilters = () => {
    setIndustryFilters({
      startDate: "",
      endDate: "",
    });
    setIndustryDateError("");
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

  // --- STATE & LOGIC FOR TRADE MARGIN TABLE ---
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

  // --- TRADE MARGIN VALIDATION STATES ---
  const [tradeMarginErrors, setTradeMarginErrors] = useState({
    bookingSearch: "",
    inventorySearch: "",
    dateRange: ""
  });

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

  // --- TRADE MARGIN GRAPH VALIDATION STATES ---
  const [tradeMarginGraphErrors, setTradeMarginGraphErrors] = useState({
    bookingSearch: "",
    inventorySearch: "",
    dateRange: ""
  });

  const validateTradeMarginFilters = (filters) => {
    const errors = {};
    errors.bookingSearch = validateSearchInput(filters.bookingSearch);
    errors.inventorySearch = validateSearchInput(filters.inventorySearch);
    errors.dateRange = validateDateRange(filters.startDate, filters.endDate);
    return errors;
  };

  const resetTradeMarginFilters = () => {
    setTradeMarginFilters({
        bookingSearch: "",
        inventorySearch: "",
        inventoryType: "",
        startDate: "",
        endDate: "",
    });
    setTradeMarginErrors({
        bookingSearch: "",
        inventorySearch: "",
        dateRange: ""
    });
    setTradeMarginCurrentPage(1);
  };

  const handleTradeMarginFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...tradeMarginFilters, [name]: value };
    setTradeMarginFilters(newFilters);
    
    const errors = validateTradeMarginFilters(newFilters);
    setTradeMarginErrors(errors);
    
    if (!Object.values(errors).some(error => error)) {
      setTradeMarginCurrentPage(1);
    }
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
    setTradeMarginGraphErrors({
        bookingSearch: "",
        inventorySearch: "",
        dateRange: ""
    });
  };

  const handleTradeMarginGraphFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...tradeMarginGraphFilters, [name]: value };
    setTradeMarginGraphFilters(newFilters);
    
    const errors = validateTradeMarginFilters(newFilters);
    setTradeMarginGraphErrors(errors);
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
      if (tradeMarginFilters.bookingSearch && !tradeMarginErrors.bookingSearch) 
        params.append('booking', tradeMarginFilters.bookingSearch);
      if (tradeMarginFilters.inventorySearch && !tradeMarginErrors.inventorySearch) 
        params.append('inventory', tradeMarginFilters.inventorySearch);
      if (tradeMarginFilters.inventoryType) 
        params.append('inventoryType', tradeMarginFilters.inventoryType);
      if (tradeMarginFilters.startDate && !tradeMarginErrors.dateRange) 
        params.append('startDate', tradeMarginFilters.startDate);
      if (tradeMarginFilters.endDate && !tradeMarginErrors.dateRange) 
        params.append('endDate', tradeMarginFilters.endDate);

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
      if (tradeMarginGraphFilters.bookingSearch && !tradeMarginGraphErrors.bookingSearch) 
        params.append('booking', tradeMarginGraphFilters.bookingSearch);
      if (tradeMarginGraphFilters.inventorySearch && !tradeMarginGraphErrors.inventorySearch) 
        params.append('inventory', tradeMarginGraphFilters.inventorySearch);
      if (tradeMarginGraphFilters.inventoryType) 
        params.append('inventoryType', tradeMarginGraphFilters.inventoryType);
      if (tradeMarginGraphFilters.startDate && !tradeMarginGraphErrors.dateRange) 
        params.append('startDate', tradeMarginGraphFilters.startDate);
      if (tradeMarginGraphFilters.endDate && !tradeMarginGraphErrors.dateRange) 
        params.append('endDate', tradeMarginGraphFilters.endDate);
      
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
    const errors = validateTradeMarginFilters(tradeMarginFilters);
    const hasErrors = Object.values(errors).some(error => error);
    if (!hasErrors) {
      fetchTradeMarginTable();
    }
  }, [tradeMarginFilters, tradeMarginCurrentPage, tradeMarginSortConfig]);
  
  useEffect(() => {
    const errors = validateTradeMarginFilters(tradeMarginGraphFilters);
    const hasErrors = Object.values(errors).some(error => error);
    if (!hasErrors) {
      fetchTradeMarginGraph();
    }
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
      {/* Add custom CSS animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
           50% { opacity: 1; transform: scale(1.05); }
           70% { transform: scale(0.9); }
           100% { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }
        .animate-bounce-in {
          animation: bounce-in 0.8s ease-out;
        }
      `}</style>

      {/* Payments Report Table */}
      <Card animate={true}>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h3 className="text-lg font-semibold text-gray-800 animate-bounce-in">
              Payments Report ({paymentTotalCount})
            </h3>
            <Button 
              onClick={downloadPaymentsExcel} 
              disabled={paymentData.length === 0}
              loading={paymentLoading}
            >
              Download Full Report
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-start">
            <div className="relative">
              <Input
                placeholder="Client Name"
                value={paymentFilters.clientName}
                onChange={(e) => handlePaymentFilterChange('clientName', e.target.value)}
                error={paymentErrors.clientName}
              />
            </div>
            <div className="relative">
              <Input
                placeholder="Booking Name"
                value={paymentFilters.bookingName}
                onChange={(e) => handlePaymentFilterChange('bookingName', e.target.value)}
                error={paymentErrors.bookingName}
              />
            </div>
            <div className="relative">
              <button
                onClick={() => handleShowDateModal("payments", paymentFilters, (filters) => {
                  setPaymentFilters(filters);
                  const errors = validatePaymentFilters(filters);
                  setPaymentErrors(errors);
                })}
                className="w-full px-4 py-2 rounded-xl hover:bg-gray-100 hover:ring-2 ring-[black] w-full text-left bg-white text-xs text-[var(--color-text)] transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
              >
                {paymentFilters.startDate && paymentFilters.endDate 
                  ? `${format(new Date(paymentFilters.startDate), 'dd/MM/yyyy')} to ${format(new Date(paymentFilters.endDate), 'dd/MM/yyyy')}` 
                  : "Date Filter"
                }
              </button>
              {paymentErrors.dateRange && (
                <div className="absolute -bottom-5 left-0 text-xs text-red-500 animate-fade-in">
                  {paymentErrors.dateRange}
                </div>
              )}
            </div>
            <button
              onClick={resetPaymentFilters}
              className='px-4 py-2 rounded-xl bg-gray-700 text-white text-xs font-semibold transition-all duration-200 transform hover:scale-105 hover:bg-gray-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-black'
            >
              Reset Filters
            </button>
          </div>
          <div className="overflow-x-auto relative shadow-md sm:rounded-lg bg-white animate-slide-up">
            <table className="w-full text-xs text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
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
                {paymentLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span>Loading payments...</span>
                      </div>
                    </td>
                  </tr>
                ) : paymentData.length > 0 ? (
                  paymentData.map((p, index) => (
                    <tr 
                      key={p._id || p.bookingId} 
                      className={`bg-white border-b hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-md transform hover:scale-[1.01] ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`} 
                      onClick={() => handleRowClick(p)}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{p.bookingName}</td>
                      <td className="px-6 py-4">{p.clientName}</td>
                      <td className="px-6 py-4">₹{p.amount?.toLocaleString()}</td>
                      <td className="px-6 py-4">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 capitalize">{p.mode}</td>
                      <td className="px-6 py-4">{p.referenceNumber || "N/A"}</td>
                      <td className="px-6 py-4">
                        {p.documentUrl ? (
                          <a 
                            href={p.documentUrl} 
                            target="_blank" 
                            className="text-blue-500 underline hover:text-blue-700 transition-colors duration-200" 
                            rel="noreferrer" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            View
                          </a>
                        ) : "N/A"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-500">
                      No payments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <EnhancedPaginationControls 
            currentPage={paymentCurrentPage} 
            totalPages={paymentTotalPages} 
            onPageChange={setPaymentCurrentPage} 
            totalCount={paymentTotalCount} 
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </CardContent>
      </Card>

      {/* Revenue By Agency */}
      <Card className="rounded-2xl shadow-lg border border-gray-200 overflow-hidden" animate={true}>
        <CardContent className="bg-white px-6 py-8 space-y-10">
          <div className="animate-fade-in">
            <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
              <h3 className="text-lg font-semibold text-gray-800 border-l-4 border-indigo-500 pl-3">
                Agency vs Direct Revenue
              </h3>
              <div className="flex items-center gap-2">
                <div className="relative w-40">
                  <button 
                    onClick={() => handleShowDateModal("agency", agencyFilters, (filters) => {
                      setagencyFilters(filters);
                      setAgencyDateError(validateDateRange(filters.startDate, filters.endDate));
                    })} 
                    className="px-4 py-2 rounded-xl hover:bg-gray-100 hover:ring-2 ring-[black] w-full text-left bg-white text-xs text-[var(--color-text)] transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                  >
                    {agencyFilters.startDate && agencyFilters.endDate 
                      ? `${agencyFilters.startDate} to ${agencyFilters.endDate}` 
                      : "Date Filter"
                    }
                  </button>
                  {agencyDateError && (
                    <div className="absolute -bottom-5 left-0 text-xs text-red-500 animate-fade-in">
                      {agencyDateError}
                    </div>
                  )}
                </div>
                <button 
                  onClick={resetAgencyFilters}
                  className='px-4 py-2 rounded-xl bg-gray-700 text-white text-xs font-semibold transition-all duration-200 transform hover:scale-105 hover:bg-gray-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-black'
                >
                  Reset Filters
                </button>
              </div>
              <p className="font-semibold text-sm w-full sm:w-auto text-right animate-bounce-in">
                Total Revenue: ₹{totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="flex justify-center animate-bounce-in">
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
          <div className="animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-green-500 pl-3">
              Revenue by Agency Name
            </h3>
            <div className="rounded-lg border border-gray-100 shadow-sm p-4 bg-gray-50 hover:shadow-md transition-shadow duration-300">
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
      </Card>

      {/* Revenue by Industry */}
      <Card className="rounded-2xl shadow-lg border border-gray-200 overflow-hidden" animate={true}>
        <CardContent className="bg-white px-6 py-8 space-y-10">
          <div className="animate-fade-in">
            <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
              <h3 className="text-lg font-semibold text-gray-800 border-l-4 border-yellow-500 pl-3">
                Revenue by Industry
              </h3>
              <div className="flex items-center gap-2">
                <div className="relative w-40">
                  <button 
                    onClick={() => handleShowDateModal("industry", industryFilters, (filters) => {
                      setIndustryFilters(filters);
                      setIndustryDateError(validateDateRange(filters.startDate, filters.endDate));
                    })} 
                    className="px-4 py-2 rounded-xl hover:bg-gray-100 hover:ring-2 ring-[black] w-full text-left bg-white text-xs text-[var(--color-text)] transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                  >
                    {industryFilters.startDate && industryFilters.endDate 
                      ? `${industryFilters.startDate} to ${industryFilters.endDate}` 
                      : "Date Filter"
                    }
                  </button>
                  {industryDateError && (
                    <div className="absolute -bottom-5 left-0 text-xs text-red-500 animate-fade-in">
                      {industryDateError}
                    </div>
                  )}
                </div>
                <button 
                  onClick={resetIndustryFilters}
                  className='px-4 py-2 rounded-xl bg-gray-700 text-white text-xs font-semibold transition-all duration-200 transform hover:scale-105 hover:bg-gray-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-black'
                >
                  Reset Filters
                </button>
              </div>
            </div>
            <div className="rounded-md border border-gray-100 shadow-sm p-3 bg-gray-50 hover:shadow-md transition-shadow duration-300 animate-bounce-in">
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
            <p className="text-sm text-gray-600 mt-2 text-right animate-fade-in">
              Total Revenue: ₹{industryTotal.toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Graph */}
      {loadingCharts ? <ShimmerCard /> : (
        <Card animate={true}>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-semibold text-gray-800 animate-bounce-in">Revenue Graph</h3>
              <Button 
                onClick={() => setRevenueView((prev) => (prev === "yearly" ? "monthly" : "yearly"))} 
                variant="secondary"
              >
                View By: {revenueView === "yearly" ? "Yearly" : "Monthly"}
              </Button>
            </div>
            <div className="flex flex-grow h-80 -ml-4 -mr-2 animate-slide-up">
              <LineChart 
                xAxis={[{ data: revenueChartData.xLabels, scaleType: "point" }]} 
                yAxis={[{ 
                  label: "Amount in Lakhs", 
                  min: 0, 
                  max: yMax > 0 ? yMax * 1.2 : 100000, 
                  valueFormatter: yAxisFormatter 
                }]} 
                series={[{ 
                  data: revenueChartData.yData, 
                  label: "Revenue", 
                  color: "#8b5cf6", 
                  showMark: true, 
                  valueFormatter: tooltipFormatter, 
                  area: true 
                }]} 
                grid={{ vertical: true, horizontal: true }} 
                margin={{ top: 40, right: 20, bottom: 50, left: 60 }} 
                legend={{ 
                  direction: "row", 
                  position: { vertical: "top", horizontal: "middle" }, 
                  padding: 0 
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trade Margin Report Table */}
      <Card animate={true}>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h3 className="text-lg font-semibold text-gray-800 animate-bounce-in">
              Trade Margin Report ({tradeMarginTotalCount})
            </h3>
            <Button 
              onClick={downloadTradeMarginExcel} 
              disabled={tradeMarginData.length === 0}
              loading={tradeMarginTableLoading}
            >
              Download Full Report
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6 items-start">
            <div className="relative">
              <Input 
                name="bookingSearch" 
                placeholder="Filter by Booking" 
                value={tradeMarginFilters.bookingSearch} 
                onChange={handleTradeMarginFilterChange} 
                error={tradeMarginErrors.bookingSearch}
              />
            </div>
            <div className="relative">
              <Input 
                name="inventorySearch" 
                placeholder="Filter by Inventory" 
                value={tradeMarginFilters.inventorySearch} 
                onChange={handleTradeMarginFilterChange} 
                error={tradeMarginErrors.inventorySearch}
              />
            </div>
            <div className="relative">
              <Select 
                name="inventoryType" 
                value={tradeMarginFilters.inventoryType} 
                onChange={handleTradeMarginFilterChange}
              >
                  <option value="">Filter by Inventory Type</option>
                  <option value="Billboard">Billboard</option>
                  <option value="DOOh">DOOH</option>
                  <option value="Gantry">Gantry</option>
                  <option value="Pole kiosk">Pole kiosk</option>
                  <option value="BQS">BQS</option>
                  <option value="DigitalBQS">DigitalBQS</option>
                  <option value="Miscellaneous">Miscellaneous</option>
              </Select>
            </div>
            <div className="relative">
              <button
                onClick={() => {
                  handleShowDateModal("tradeMarginTable", tradeMarginFilters, (filters) => {
                    setTradeMarginFilters(filters);
                    const errors = validateTradeMarginFilters(filters);
                    setTradeMarginErrors(errors);
                  });
                }}
                className="px-4 py-2 rounded-xl hover:bg-gray-100 hover:ring-2 ring-[black] w-full text-left bg-white text-xs text-[var(--color-text)] transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
              >
                {tradeMarginFilters.startDate && tradeMarginFilters.endDate 
                  ? `${dayjs(tradeMarginFilters.startDate).format("DD MMM YYYY")} to ${dayjs(tradeMarginFilters.endDate).format("DD MMM YYYY")}` 
                  : "Date Filter"
                }
              </button>
              {tradeMarginErrors.dateRange && (
                <div className="absolute -bottom-5 left-0 text-xs text-red-500 animate-fade-in">
                  {tradeMarginErrors.dateRange}
                </div>
              )}
            </div>
            <button
              onClick={resetTradeMarginFilters}
              className='px-4 py-2 rounded-xl bg-gray-700 text-white text-xs font-semibold transition-all duration-200 transform hover:scale-105 hover:bg-gray-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-black'
            >
              Reset Filters
            </button>
          </div>
          <div className="overflow-x-auto relative shadow-md sm:rounded-lg bg-white animate-slide-up">
            <table className="w-full text-xs text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
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
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span>Loading trade margins...</span>
                      </div>
                    </td>
                  </tr>
                ) : tradeMarginTableError ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-red-500">
                      {tradeMarginTableError}
                    </td>
                  </tr>
                ) : tradeMarginData.length > 0 ? (
                  tradeMarginData.map((item, index) => (
                    <tr 
                      key={item.id || index} 
                      className={`bg-white border-b hover:bg-gray-50 transition-all duration-200 hover:shadow-md transform hover:scale-[1.01] ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td className="px-6 py-4">{item.inventory || "N/A"}</td>
                      <td className="px-6 py-4">{item.inventoryType || "N/A"}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{item.booking || "N/A"}</td>
                      <td className="px-6 py-4">{item.invoiceNo || "N/A"}</td>
                      <td className="px-6 py-4 font-medium">₹{item.tradeMargin?.toLocaleString() || "0"}</td>
                      <td className="px-6 py-4">{dayjs(item.date).format("DD MMM YYYY")}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-500">
                      No trade margin data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <EnhancedPaginationControls 
            currentPage={tradeMarginCurrentPage} 
            totalPages={tradeMarginTotalPages} 
            onPageChange={setTradeMarginCurrentPage} 
            totalCount={tradeMarginTotalCount} 
            itemsPerPage={ITEMS_PER_PAGE} 
          />
        </CardContent>
      </Card>

      {/* Trade Margin Graph */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
            <h3 className="text-base font-semibold text-gray-800">Trade Margin Graph</h3>
            <button 
              onClick={() => setTradeMarginChartView(prev => prev === "yearly" ? "monthly" : "yearly")} 
              className='px-4 py-2 rounded-xl bg-gray-200 text-gray-700 text-xs font-semibold transition-all duration-200 transform hover:scale-105 hover:bg-gray-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-black'
            >
              View By: {tradeMarginChartView === "yearly" ? "Yearly" : "Monthly"}
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6 items-start">
            <div className="relative">
              <Input name="bookingSearch" placeholder="Filter by Booking" value={tradeMarginGraphFilters.bookingSearch} onChange={handleTradeMarginGraphFilterChange} />
            </div>
            <div className="relative">
              <Input name="inventorySearch" placeholder="Filter by Inventory" value={tradeMarginGraphFilters.inventorySearch} onChange={handleTradeMarginGraphFilterChange} />
            </div>
            <div className="relative">
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
            </div>
            <div className="relative">
              <button
                onClick={() => {
                  handleShowDateModal("tradeMarginGraph", tradeMarginGraphFilters, setTradeMarginGraphFilters);
                }}
                className="px-4 py-2 rounded-xl hover:bg-gray-100 hover:ring-2 ring-[black] w-full text-left bg-white text-xs text-[var(--color-text)] transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
              >
                {tradeMarginGraphFilters.startDate && tradeMarginGraphFilters.endDate ? `${dayjs(tradeMarginGraphFilters.startDate).format("DD MMM YYYY")} to ${dayjs(tradeMarginGraphFilters.endDate).format("DD MMM YYYY")}` : "Date Filter"}
              </button>
              {tradeMarginGraphErrors.dateRange && (
                <div className="absolute -bottom-5 left-0 text-xs text-red-500 animate-fade-in">
                  {tradeMarginGraphErrors.dateRange}
                </div>
              )}
            </div>
            <button 
              onClick={resetTradeMarginGraphFilters}
              className='px-4 py-2 rounded-xl bg-gray-700 text-white text-xs font-semibold transition-all duration-200 transform hover:scale-105 hover:bg-gray-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-black'
            >
              Reset Filters
            </button>
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
      </Card>

      {showDateModal && modalContext && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 animate-fadeIn'>
          <div className='bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-scaleIn'>
            <div className='p-6'>
              <h3 className='text-lg font-semibold text-[var(--color-text)] mb-4'>Select Date Range</h3>
              <div className='flex justify-center'>
                <DateRange
                  editableDateInputs={true}
                  onChange={(item) => setModalContext(prev => ({ ...prev, tempDateRange: [item.selection] }))}
                  moveRangeOnFirstSelection={false}
                  ranges={modalContext.tempDateRange || [{ startDate: null, endDate: null, key: 'selection' }]}
                  className='text-xs w-full'
                  rangeColors={['#000000']}
                  showDateDisplay={false}
                />
              </div>
              <div className='flex justify-end gap-2 mt-4'>
                <button
                  onClick={handleCancelDateModal}
                  className='px-4 py-1.5 rounded-md bg-gray-100 text-[var(--color-text)] hover:bg-gray-200 transition-all duration-200 hover:scale-105'
                >
                  Cancel
                </button>
                <Button onClick={() => handleApplyDateModal(modalContext.tempDateRange)}>Apply</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}