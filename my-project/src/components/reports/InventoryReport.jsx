import React, { useEffect, useState, useCallback } from "react";
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

const Card = ({ children, className }) => (
  <div className={`bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children }) => (
  <div className="p-6 animate-fade-in">
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

const industryOptions = [
  "Tourism", "Retail", "Real Estate", "Other", "Movie", "Media and Entertainment", 
  "FMCG", "Finance", "Financial Services", "Healthcare", "Hospitality", "IT Industry", 
  "Automobile", "Clothing & Apparel", "Ecommerce", "Edtech", "Entertainment"
];

const inventoryTypeOptions = [
  "Billboard", "DOOH", "Gantry", "Pole Kiosk", "BQS", "DigitalBQS", "Miscellaneous"
];

export default function InventoryReport({ handleShowDateModal = () => {} }) {
  const navigate = useNavigate();

  // --- INVENTORY REPORT STATE & LOGIC ---
  const [inventories, setInventories] = useState([]);
  const [inventoryFilters, setInventoryFilters] = useState({ 
    name: "", type: "", agency: "", industry: "" 
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [inventoryTotalCount, setInventoryTotalCount] = useState(0);
  const [inventorySortConfig, setInventorySortConfig] = useState({ 
    key: 'revenue', direction: 'desc' 
  });
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [inventoryFilterErrors, setInventoryFilterErrors] = useState({});

  // --- PERFORMANCE GRAPH STATE & LOGIC ---
  const [performanceType, setPerformanceType] = useState("top");
  const [performanceMetric, setPerformanceMetric] = useState("totalRevenue");
  const [performanceData, setPerformanceData] = useState([]);
  const [performanceTotal, setPerformanceTotal] = useState(0);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState('');

  // Validation function for inventory filters
  const validateInventoryFilters = (filters) => {
    const errors = {};
    
    if (filters.name && filters.name.trim().length > 0 && filters.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (filters.agency && filters.agency.trim().length > 0 && filters.agency.trim().length < 2) {
      errors.agency = 'Agency name must be at least 2 characters';
    }
    
    if (filters.name && filters.name.length > 100) {
      errors.name = 'Name must be less than 100 characters';
    }
    
    if (filters.agency && filters.agency.length > 50) {
      errors.agency = 'Agency name must be less than 50 characters';
    }
    
    return errors;
  };

  const resetInventoryFilters = () => {
    setInventoryFilters({ name: "", type: "", agency: "", industry: "" });
    setCurrentPage(1);
    setInventoryFilterErrors({});
  };

  const handleInventorySort = (key, direction) => {
    setInventorySortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handleInventoryFilterChange = (field, value) => {
    const newFilters = { ...inventoryFilters, [field]: value };
    setInventoryFilters(newFilters);
    setCurrentPage(1);
    
    // Real-time validation
    const errors = validateInventoryFilters(newFilters);
    setInventoryFilterErrors(errors);
  };

  const fetchInventoryReport = async () => {
    // Check for validation errors before fetching
    const errors = validateInventoryFilters(inventoryFilters);
    if (Object.keys(errors).length > 0) {
      setInventoryFilterErrors(errors);
      return;
    }

    setInventoryLoading(true);
    setInventoryError('');
    
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) { 
        navigate("/login"); 
        return; 
      }

      const params = new URLSearchParams({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        sortKey: inventorySortConfig.key,
        sortDirection: inventorySortConfig.direction,
      });
      
      Object.entries(inventoryFilters).forEach(([key, value]) => {
        if (value?.trim()) params.append(key, value.trim());
      });

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/inventory-report?${params.toString()}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) { 
        localStorage.clear(); 
        navigate("/login"); 
        return; 
      }
      
      if (!res.ok) throw new Error(`Failed to fetch inventory report: ${res.status}`);

      const data = await res.json();
      setInventories(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setInventoryTotalCount(data.pagination?.totalCount || 0);
      
    } catch (err) {
      console.error("Failed to fetch inventory report:", err);
      setInventoryError('Failed to load inventory data. Please try again.');
    } finally {
      setInventoryLoading(false);
    }
  };

  const downloadInventoryReport = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setInventoryError("Authentication failed. Please log in again.");
      return;
    }

    // Check validation before download
    const errors = validateInventoryFilters(inventoryFilters);
    if (Object.keys(errors).length > 0) {
      setInventoryFilterErrors(errors);
      return;
    }

    setDownloadLoading(true);

    try {
        let allInventories = [];
        let currentPage = 1;
        let totalPages = 1;

        do {
            const params = new URLSearchParams({
                page: currentPage,
                limit: API_MAX_LIMIT,
                sortKey: inventorySortConfig.key,
                sortDirection: inventorySortConfig.direction,
            });
            
            Object.entries(inventoryFilters).forEach(([key, value]) => {
                if (value?.trim()) params.append(key, value.trim());
            });

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/inventory-report?${params.toString()}`, {
                headers: { "Authorization": `Bearer ${token}` },
            });
            
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            
            const data = await res.json();
            allInventories = allInventories.concat(data.data || []);
            totalPages = data.pagination?.totalPages || 1;
            currentPage++;
        } while (currentPage <= totalPages);

        if (allInventories.length === 0) {
            setInventoryError("No inventory data to download with current filters.");
            return;
        }

        const excelData = allInventories.map(inv => ({
            'Name': inv.name,
            'Type': inv.type,
            'Agency': inv.agency || "N/A",
            'Industry': inv.industry || "N/A",
            'Bookings': inv.bookings || 0,
            'Revenue': inv.revenue || 0,
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Report");
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([excelBuffer]), `inventory_report_${dayjs().format("YYYY-MM-DD")}.xlsx`);

    } catch (error) {
        console.error("Error downloading inventory report:", error);
        setInventoryError("Failed to download the report. Please try again.");
    } finally {
        setDownloadLoading(false);
    }
  };

  const fetchInventoryPerformance = async () => {
    setPerformanceLoading(true);
    setPerformanceError('');
    
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) { 
        navigate("/login"); 
        return; 
      }

      const queryParams = new URLSearchParams({ 
        type: performanceType, 
        metric: performanceMetric, 
        limit: 10 
      }).toString();
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/inventory-performance?${queryParams}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to fetch performance data: ${res.status}`);
      
      const data = await res.json();
      if (data.success) {
        const performanceItems = data.data || [];
        setPerformanceData(performanceItems);
        
        const total = performanceItems.reduce((sum, item) => sum + (item[performanceMetric] || 0), 0);
        setPerformanceTotal(total);
      }
    } catch (err) {
      console.error("Failed to fetch inventory performance:", err);
      setPerformanceError('Failed to load performance data. Please try again.');
    } finally {
      setPerformanceLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryReport();
  }, [inventoryFilters, currentPage, inventorySortConfig]);

  useEffect(() => {
    fetchInventoryPerformance();
  }, [performanceType, performanceMetric]);

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
        {/* CARD 1: INVENTORY REPORT TABLE */}
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 animate-slide-in-left">
              All Inventories Report ({inventoryTotalCount})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 items-start">
              <Input 
                placeholder="Filter by Name" 
                value={inventoryFilters.name} 
                onChange={(e) => handleInventoryFilterChange('name', e.target.value)}
                error={inventoryFilterErrors.name}
              />
              
              <Select 
                value={inventoryFilters.type} 
                onChange={(e) => handleInventoryFilterChange('type', e.target.value)}
              >
                <option value="">All Types</option>
                {inventoryTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Select>
              
              <Input 
                placeholder="Filter by Agency" 
                value={inventoryFilters.agency} 
                onChange={(e) => handleInventoryFilterChange('agency', e.target.value)}
                error={inventoryFilterErrors.agency}
              />
              
              <Select 
                value={inventoryFilters.industry} 
                onChange={(e) => handleInventoryFilterChange('industry', e.target.value)}
              >
                <option value="">All Industries</option>
                {industryOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Select>
              
              <Button onClick={resetInventoryFilters} variant="secondary">
                Reset Filters
              </Button>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold text-gray-700">Inventories Table</h3>
              <Button 
                onClick={downloadInventoryReport} 
                disabled={inventories.length === 0 || Object.keys(inventoryFilterErrors).length > 0}
                loading={downloadLoading}
              >
                Download Full Report
              </Button>
            </div>

            {inventoryError && <ErrorMessage message={inventoryError} />}
            
            <div className="overflow-x-auto relative shadow-md sm:rounded-lg bg-white">
              <table className="w-full text-xs text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <SortableHeader title="Name" sortKey="name" sortConfig={inventorySortConfig} onSort={handleInventorySort} />
                    <SortableHeader title="Type" sortKey="type" sortConfig={inventorySortConfig} onSort={handleInventorySort} />
                    <SortableHeader title="Agency" sortKey="agency" sortConfig={inventorySortConfig} onSort={handleInventorySort} />
                    <SortableHeader title="Industry" sortKey="industry" sortConfig={inventorySortConfig} onSort={handleInventorySort} />
                    <SortableHeader title="Bookings" sortKey="bookings" sortConfig={inventorySortConfig} onSort={handleInventorySort} />
                    <SortableHeader title="Revenue" sortKey="revenue" sortConfig={inventorySortConfig} onSort={handleInventorySort} />
                  </tr>
                </thead>
                <tbody>
                  {inventoryLoading ? (
                    <tr>
                      <td colSpan="6">
                        <LoadingSpinner />
                      </td>
                    </tr>
                  ) : inventories.length > 0 ? (
                    inventories.map((inv, index) => (
                      <tr 
                        key={inv.id} 
                        className="bg-white border-b hover:bg-gray-50 transition-all duration-200 hover-scale table-row-enter"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{inv.name}</td>
                        <td className="px-6 py-4">{inv.type}</td>
                        <td className="px-6 py-4">{inv.agency || "N/A"}</td>
                        <td className="px-6 py-4">{inv.industry || "N/A"}</td>
                        <td className="px-6 py-4">{inv.bookings?.toLocaleString() || 0}</td>
                        <td className="px-6 py-4">₹{inv.revenue?.toLocaleString() || 0}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6" className="text-center py-10 text-gray-500">No inventories found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <EnhancedPaginationControls 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
              totalCount={inventoryTotalCount} 
              itemsPerPage={ITEMS_PER_PAGE} 
            />
          </CardContent>
        </Card>

        {/* CARD 2: INVENTORY PERFORMANCE GRAPH */}
        <Card>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
              <h3 className="text-lg font-semibold text-gray-800 animate-slide-in-left">
                Inventory Performance ({performanceType === "top" ? "Top" : "Bottom"} by {performanceMetric === "totalRevenue" ? "Revenue" : "Bookings"})
              </h3>
              <div className="flex items-center gap-3">
                <Select 
                  value={performanceMetric} 
                  onChange={(e) => setPerformanceMetric(e.target.value)}
                  className="w-auto"
                >
                  <option value="totalRevenue">Revenue</option>
                  <option value="totalBookings">Bookings</option>
                </Select>
                <Select 
                  value={performanceType} 
                  onChange={(e) => setPerformanceType(e.target.value)}
                  className="w-auto"
                >
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                </Select>
                <Button 
                  onClick={() => { 
                    setPerformanceType("top"); 
                    setPerformanceMetric("totalRevenue"); 
                  }} 
                  variant="secondary"
                >
                  Reset
                </Button>
              </div>
            </div>

            {performanceError && <ErrorMessage message={performanceError} />}
            
            <div className="flex flex-grow h-96 -ml-4 -mr-2 relative">
              {performanceLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                  <LoadingSpinner size="lg" />
                </div>
              ) : performanceData.length > 0 ? (
                <div className="w-full animate-fade-in">
                  <BarChart
                    xAxis={[{ 
                      data: performanceData.map((d) => d.spaceName), 
                      scaleType: "band", 
                      tickLabelStyle: { angle: -45, textAnchor: "end", fontSize: 10 } 
                    }]}
                    yAxis={[{ label: performanceMetric === "totalRevenue" ? "Revenue (₹)" : "Number of Bookings" }]}
                    series={[
                      {
                        data: performanceData.map((d) => performanceMetric === "totalRevenue" ? d.totalRevenue : d.totalBookings),
                        label: performanceMetric === "totalRevenue" ? "Revenue" : "Bookings",
                        color: "#34d399",
                        valueFormatter: (value) => {
                          const percentage = performanceTotal > 0 ? ((value / performanceTotal) * 100).toFixed(1) : 0;
                          const formattedValue = performanceMetric === "totalRevenue" ? `₹${value.toLocaleString()}` : value.toLocaleString();
                          return `${formattedValue} (${percentage}%)`;
                        },
                      },
                    ]}
                    grid={{ vertical: false, horizontal: true }}
                    margin={{ top: 40, right: 20, bottom: 70, left: 60 }}
                    legend={{ direction: "row", position: { vertical: "top", horizontal: "middle" }, padding: 0 }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500 animate-fade-in">
                  No performance data available.
                </div>
              )}
            </div>
            
            {performanceTotal > 0 && (
              <div className="mt-4 text-center text-sm text-gray-600 animate-fade-in">
                Total {performanceMetric === "totalRevenue" ? "Revenue" : "Bookings"}: <span className="font-semibold text-blue-600">
                  {performanceMetric === "totalRevenue" ? `₹${performanceTotal.toLocaleString()}` : performanceTotal.toLocaleString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}