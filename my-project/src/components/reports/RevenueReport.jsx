import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { LineChart, BarChart, PieChart } from "@mui/x-charts";
import { CircularProgress } from "@mui/material";

// --- UI HELPER COMPONENTS (Unchanged) ---
const Input = ({ ...props }) => (
  <input
    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    {...props}
  />
);
const Button = ({ children, ...props }) => (
  <button
    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
    {...props}
  >
    {children}
  </button>
);
const Card = ({ children, className }) => (
  <div className={`bg-white shadow-md rounded-lg overflow-hidden ${className}`}>
    {children}
  </div>
);
const CardContent = ({ children }) => <div className="p-6">{children}</div>;
const ShimmerCard = () => (
  <div className="h-80 bg-gray-200 rounded-lg animate-pulse">
    <div className="p-6 h-full flex items-center justify-center text-gray-400">
      Loading Chart...
    </div>
  </div>
);

const Select = ({ children, ...props }) => (
  <select
    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    {...props}
  >
    {children}
  </select>
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
        className={`flex items-center gap-1.5 ${disabled ? 'cursor-default' : 'cursor-pointer select-none'}`}
      >
        {title}
        {!disabled && (
          <span className="text-gray-400">
            {direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '⇅'}
          </span>
        )}
      </div>
    </th>
  );
};

const EnhancedPaginationControls = ({ currentPage, totalPages, onPageChange, totalCount, itemsPerPage }) => {
    const [pageInput, setPageInput] = useState(currentPage.toString());

    useEffect(() => {
        setPageInput(currentPage.toString());
    }, [currentPage]);

    const handlePageSubmit = (e) => {
        e.preventDefault();
        const pageNum = parseInt(pageInput, 10);
        if (pageNum && pageNum > 0 && pageNum <= totalPages) {
            onPageChange(pageNum);
        } else {
            setPageInput(currentPage.toString());
        }
    };

    if (totalCount === 0) return null;

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-xs gap-4">
            <span className="text-gray-600">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
            </span>
            {totalPages > 1 && (
                <div className="flex items-center gap-2">
                    <button onClick={() => onPageChange(currentPage > 1 ? currentPage - 1 : 1)} disabled={currentPage === 1} className="px-3 py-1.5 border rounded-md bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                    <form onSubmit={handlePageSubmit} className="flex items-center gap-2">
                        <span className="text-gray-700">Page</span>
                        <input type="text" value={pageInput} onChange={(e) => setPageInput(e.target.value)} className="w-10 h-7 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <span className="text-gray-700">of {totalPages}</span>
                    </form>
                    <button onClick={() => onPageChange(currentPage < totalPages ? currentPage + 1 : totalPages)} disabled={currentPage === totalPages} className="px-3 py-1.5 border rounded-md bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
                </div>
            )}
        </div>
    );
};

// --- End of UI Helper Components ---

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
  // --- CHANGE 1: ADD STATE FOR TOTAL TRADE MARGIN ---
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

  // --- CHANGE 2: UPDATE TRADE MARGIN DATA PROCESSING TO CALCULATE A TOTAL ---
  const processTradeMarginData = (data) => {
    const marginMap = new Map();
    let calculatedTotal = 0; // Create a temporary total
    data.forEach(({ date, tradeMargin }) => {
      if (!date || typeof tradeMargin !== 'number') return;
      calculatedTotal += tradeMargin; // Sum up the total margin
      const d = dayjs(date);
      const key = tradeMarginChartView === "monthly" ? d.format("MMM YYYY") : d.format("YYYY");
      marginMap.set(key, (marginMap.get(key) || 0) + tradeMargin);
    });

    setTotalTradeMargin(calculatedTotal); // Set the total to state

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
        'Invoice NO': item.invoiceNo || "N/A", // <-- ADD THIS LINE
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
      {/* Payments Report Table (Unchanged) */}
      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h3 className="text-lg font-semibold text-gray-800">Payments Report ({paymentTotalCount})</h3>
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
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50"
            >
              {paymentFilters.startDate && paymentFilters.endDate ? `${paymentFilters.startDate} to ${paymentFilters.endDate}` : "Filter by Payment Date"}
            </button>
            <Button onClick={resetPaymentFilters}>Reset Filters</Button>
          </div>
          <div className="overflow-x-auto relative shadow-md sm:rounded-lg bg-white">
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
                {paymentData.length > 0 ? (
                  paymentData.map((p) => (
                    <tr key={p._id || p.bookingId} className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(p)}>
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{p.bookingName}</td>
                      <td className="px-6 py-4">{p.clientName}</td>
                      <td className="px-6 py-4">₹{p.amount?.toLocaleString()}</td>
                      <td className="px-6 py-4">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 capitalize">{p.mode}</td>
                      <td className="px-6 py-4">{p.referenceNumber || "N/A"}</td>
                      <td className="px-6 py-4">
                        {p.documentUrl ? (<a href={p.documentUrl} target="_blank" className="text-blue-500 underline" rel="noreferrer" onClick={(e) => e.stopPropagation()}>View</a>) : "N/A"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" className="text-center py-10 text-gray-500">No payments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <EnhancedPaginationControls currentPage={paymentCurrentPage} totalPages={paymentTotalPages} onPageChange={setPaymentCurrentPage} totalCount={paymentTotalCount} itemsPerPage={ITEMS_PER_PAGE}/>
        </CardContent>
      </Card>

      {/* Revenue By Agency */}
      <Card className="rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <CardContent className="bg-white px-6 py-8 space-y-10">
          <div>
            <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
              <h3 className="text-lg font-semibold text-gray-800 border-l-4 border-indigo-500 pl-3">Agency vs Direct Revenue</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => handleShowDateModal("agency", agencyFilters, setagencyFilters)} className="px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50">
                    {agencyFilters.startDate && agencyFilters.endDate ? `${agencyFilters.startDate} to ${agencyFilters.endDate}` : "Filter by Date"}
                </button>
                <Button onClick={resetAgencyFilters}>Reset</Button>
              </div>
              <p className="font-semibold text-sm w-full sm:w-auto text-right">Total Revenue: ₹{totalRevenue.toLocaleString()}</p>
            </div>
            {/* --- CHANGE 3: UPDATE PIE CHART TO SHOW PERCENTAGES --- */}
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
                    // This formatter adds the percentage to the pie slice label
                    arcLabel: (item) => `${(item.value / totalRevenue * 100).toFixed(1)}%`,
                    // This formatter adds more detail to the tooltip on hover
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-green-500 pl-3">Revenue by Agency Name</h3>
            <div className="rounded-lg border border-gray-100 shadow-sm p-4 bg-gray-50">
              {/* --- CHANGE 4: UPDATE AGENCY BAR CHART TO SHOW PERCENTAGES IN TOOLTIP --- */}
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
      <Card className="rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <CardContent className="bg-white px-6 py-8 space-y-10">
          <div>
            <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
              <h3 className="text-lg font-semibold text-gray-800 border-l-4 border-yellow-500 pl-3">Revenue by Industry</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => handleShowDateModal("industry", industryFilters, setIndustryFilters)} className="px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50">
                    {industryFilters.startDate && industryFilters.endDate ? `${industryFilters.startDate} to ${industryFilters.endDate}` : "Filter by Date"}
                </button>
                <Button onClick={resetIndustryFilters}>Reset</Button>
              </div>
            </div>
            <div className="rounded-md border border-gray-100 shadow-sm p-3 bg-gray-50">
              {/* --- CHANGE 5: UPDATE INDUSTRY BAR CHART TO SHOW PERCENTAGES IN TOOLTIP --- */}
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
            <p className="text-sm text-gray-600 mt-2 text-right">Total Revenue: ₹{industryTotal.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Graph (Unchanged) */}
      {loadingCharts ? <ShimmerCard /> : (
        <Card>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-semibold text-gray-800">Revenue Graph</h3>
              <button onClick={() => setRevenueView((prev) => (prev === "yearly" ? "monthly" : "yearly"))} className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-md">View By: {revenueView === "yearly" ? "Yearly" : "Monthly"}</button>
            </div>
            <div className="flex flex-grow h-80 -ml-4 -mr-2">
              <LineChart xAxis={[{ data: revenueChartData.xLabels, scaleType: "point" }]} yAxis={[{ label: "Amount in Lakhs", min: 0, max: yMax > 0 ? yMax * 1.2 : 100000, valueFormatter: yAxisFormatter }]} series={[{ data: revenueChartData.yData, label: "Revenue", color: "#8b5cf6", showMark: true, valueFormatter: tooltipFormatter, area: true }]} grid={{ vertical: true, horizontal: true }} margin={{ top: 40, right: 20, bottom: 50, left: 60 }} legend={{ direction: "row", position: { vertical: "top", horizontal: "middle" }, padding: 0 }}/>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trade Margin Report Table (Unchanged) */}
      <Card>
        <CardContent>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <h3 className="text-lg font-semibold text-gray-800">Trade Margin Report ({tradeMarginTotalCount})</h3>
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
                <option value="Miscellaneous">Miscellaneous</option>
            </Select>
            <button
              onClick={() => {
                handleShowDateModal("tradeMarginTable", tradeMarginFilters, setTradeMarginFilters);
              }}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50"
            >
              {tradeMarginFilters.startDate && tradeMarginFilters.endDate ? `${dayjs(tradeMarginFilters.startDate).format("DD MMM YYYY")} to ${dayjs(tradeMarginFilters.endDate).format("DD MMM YYYY")}` : "Filter by Date Range"}
            </button>
            <Button onClick={resetTradeMarginFilters}>Reset Filters</Button>
          </div>
          <div className="overflow-x-auto relative shadow-md sm:rounded-lg bg-white">
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
                  <tr><td colSpan="5" className="text-center py-10 text-gray-500"><CircularProgress size={24} /></td></tr>
                ) : tradeMarginTableError ? (
                  <tr><td colSpan="5" className="text-center py-10 text-red-500">{tradeMarginTableError}</td></tr>
                ) : tradeMarginData.length > 0 ? (
                  tradeMarginData.map((item, index) => (
                    <tr key={item.id || index} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{item.inventory || "N/A"}</td>
                      <td className="px-6 py-4">{item.inventoryType || "N/A"}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{item.booking || "N/A"}</td>
                      <td className="px-6 py-4">{item.invoiceNo || "N/A"}</td>
                      <td className="px-6 py-4 font-medium">₹{item.tradeMargin?.toLocaleString() || "0"}</td>
                      <td className="px-6 py-4">{dayjs(item.date).format("DD MMM YYYY")}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="text-center py-10 text-gray-500">No trade margin data found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <EnhancedPaginationControls currentPage={tradeMarginCurrentPage} totalPages={tradeMarginTotalPages} onPageChange={setTradeMarginCurrentPage} totalCount={tradeMarginTotalCount} itemsPerPage={ITEMS_PER_PAGE} />
        </CardContent>
      </Card>

      {/* Trade Margin Graph */}
      <Card>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-gray-800">Trade Margin Graph</h3>
            <button onClick={() => setTradeMarginChartView(prev => prev === "yearly" ? "monthly" : "yearly")} className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-md">
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
                <option value="Miscellaneous">Miscellaneous</option>
            </Select>
            <button
              onClick={() => {
                handleShowDateModal("tradeMarginGraph", tradeMarginGraphFilters, setTradeMarginGraphFilters);
              }}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50"
            >
              {tradeMarginGraphFilters.startDate && tradeMarginGraphFilters.endDate ? `${dayjs(tradeMarginGraphFilters.startDate).format("DD MMM YYYY")} to ${dayjs(tradeMarginGraphFilters.endDate).format("DD MMM YYYY")}` : "Filter by Date Range"}
            </button>
            <Button onClick={resetTradeMarginGraphFilters}>Reset Filters</Button>
          </div>
          
          {tradeMarginGraphLoading ? <ShimmerCard /> : tradeMarginGraphError ? (
             <div className="h-80 flex items-center justify-center text-red-500">{tradeMarginGraphError}</div>
          ) : (
            <div className="flex flex-grow h-80">
              {/* --- CHANGE 6: UPDATE TRADE MARGIN BAR CHART TO SHOW PERCENTAGES IN TOOLTIP --- */}
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
    </div>
  );
}