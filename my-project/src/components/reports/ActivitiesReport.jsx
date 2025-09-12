import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

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

// Helper to render object values safely
const renderObjectDetails = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value).map(([key, val]) => (
      <div key={key} className="mb-1">
        <strong className="text-gray-700">{key}:</strong> <span className="text-gray-900">{String(val)}</span>
      </div>
    ));
  }
  return null;
};

// Helper to format object details for Excel
const formatObjectForExcel = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return "N/A";
    }
    return Object.entries(value)
        .map(([key, val]) => `${key}: ${String(val)}`)
        .join("\n");
};

export default function ActivitiesReport({ handleShowDateModal = () => {} }) {
  const navigate = useNavigate();

  // --- ACTIVITIES REPORT STATE & LOGIC ---
  const [changelogs, setChangelogs] = useState([]);
  const [changelogFilters, setChangelogFilters] = useState({ 
    searchText: "", startDate: "", endDate: "" 
  });
  const [changelogCurrentPage, setChangelogCurrentPage] = useState(1);
  const [changelogTotalPages, setChangelogTotalPages] = useState(1);
  const [changelogTotalCount, setChangelogTotalCount] = useState(0);
  const [changelogSortConfig, setChangelogSortConfig] = useState({ 
    key: 'createdAt', direction: 'desc' 
  });
  const [changelogLoading, setChangelogLoading] = useState(false);
  const [changelogError, setChangelogError] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [changelogFilterErrors, setChangelogFilterErrors] = useState({});

  // Validation function for changelog filters
  const validateChangelogFilters = (filters) => {
    const errors = {};
    
    if (filters.searchText && filters.searchText.trim().length > 0 && filters.searchText.trim().length < 2) {
      errors.searchText = 'Search term must be at least 2 characters';
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

  const resetChangelogFilters = () => {
    setChangelogFilters({ searchText: "", startDate: "", endDate: "" });
    setChangelogCurrentPage(1);
    setChangelogFilterErrors({});
  };

  const handleChangelogSort = (key, direction) => {
    setChangelogSortConfig({ key, direction });
    setChangelogCurrentPage(1);
  };

  const handleChangelogFilterChange = (field, value) => {
    const newFilters = { ...changelogFilters, [field]: value };
    setChangelogFilters(newFilters);
    setChangelogCurrentPage(1);
    
    // Real-time validation
    const errors = validateChangelogFilters(newFilters);
    setChangelogFilterErrors(errors);
  };

  const fetchChangelogs = async () => {
    // Check for validation errors before fetching
    const errors = validateChangelogFilters(changelogFilters);
    if (Object.keys(errors).length > 0) {
      setChangelogFilterErrors(errors);
      return;
    }

    setChangelogLoading(true);
    setChangelogError('');
    
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) { 
        navigate("/login"); 
        return; 
      }

      const params = new URLSearchParams({
        page: changelogCurrentPage,
        limit: ITEMS_PER_PAGE,
        sortKey: changelogSortConfig.key,
        sortDirection: changelogSortConfig.direction,
      });
      
      if (changelogFilters.searchText?.trim()) params.append("search", changelogFilters.searchText.trim());
      if (changelogFilters.startDate) params.append("startDate", changelogFilters.startDate);
      if (changelogFilters.endDate) params.append("endDate", changelogFilters.endDate);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log?${params.toString()}`,
        {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 403) { 
        localStorage.clear(); 
        navigate("/login"); 
        return; 
      }
      
      if (!res.ok) throw new Error(`Failed to fetch changelogs: ${res.status}`);

      const data = await res.json();
      setChangelogs(data.changelogs || []);
      setChangelogTotalPages(data.pagination?.totalPages || 1);
      setChangelogTotalCount(data.pagination?.totalCount || 0);
      
    } catch (err) {
      console.error("Failed to fetch changelogs:", err);
      setChangelogError('Failed to load changelog data. Please try again.');
    } finally {
      setChangelogLoading(false);
    }
  };

  const downloadChangelogExcel = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setChangelogError("Authentication failed. Please log in again.");
      return;
    }

    // Check validation before download
    const errors = validateChangelogFilters(changelogFilters);
    if (Object.keys(errors).length > 0) {
      setChangelogFilterErrors(errors);
      return;
    }

    setDownloadLoading(true);

    try {
        let allChangelogs = [];
        let currentPage = 1;
        let totalPages = 1;

        do {
            const params = new URLSearchParams({
                page: currentPage,
                limit: API_MAX_LIMIT,
                sortKey: changelogSortConfig.key,
                sortDirection: changelogSortConfig.direction,
            });
            
            if (changelogFilters.searchText?.trim()) params.append("search", changelogFilters.searchText.trim());
            if (changelogFilters.startDate) params.append("startDate", changelogFilters.startDate);
            if (changelogFilters.endDate) params.append("endDate", changelogFilters.endDate);
            
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log?${params.toString()}`,
                {
                  headers: { "Authorization": `Bearer ${token}` },
                }
            );
            
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            
            const data = await res.json();
            allChangelogs = allChangelogs.concat(data.changelogs || []);
            totalPages = data.pagination?.totalPages || 1;
            currentPage++;
        } while (currentPage <= totalPages);

        if (allChangelogs.length === 0) {
            setChangelogError("No changelog data to download with current filters.");
            return;
        }

        const excelData = allChangelogs.map(log => ({
            'Campaign': log.campaignId?.campaignName || "N/A",
            'User': `${log.userName} (${log.userEmail})`,
            'Change Type': log.changeType,
            'Previous Info': formatObjectForExcel(log.previousValue),
            'New Info': formatObjectForExcel(log.newValue),
            'Date': dayjs(log.createdAt).format("DD/MM/YYYY HH:mm"),
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Change Log Report");
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([excelBuffer]), `changelog_report_${dayjs().format("YYYY-MM-DD")}.xlsx`);

    } catch (error) {
        console.error("Error downloading changelog report:", error);
        setChangelogError("Failed to download the report. Please try again.");
    } finally {
        setDownloadLoading(false);
    }
  };

  useEffect(() => {
    fetchChangelogs();
  }, [changelogCurrentPage, changelogFilters, changelogSortConfig]);

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
      <div className="animate-fade-in">
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 animate-slide-in-left">
              Change Logs ({changelogTotalCount})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-start">
              <Input
                placeholder="Search User, Campaign, etc..."
                value={changelogFilters.searchText}
                onChange={(e) => handleChangelogFilterChange('searchText', e.target.value)}
                error={changelogFilterErrors.searchText}
              />
              
              <div className="relative">
                <button
                  onClick={() => {
                    handleShowDateModal("changelogs", changelogFilters, (newFilters) => {
                        setChangelogFilters(newFilters);
                        setChangelogCurrentPage(1);
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {changelogFilters.startDate && changelogFilters.endDate
                    ? `${changelogFilters.startDate} to ${changelogFilters.endDate}`
                    : "Filter by Log Date"}
                </button>
                {(changelogFilterErrors.startDate || changelogFilterErrors.dateRange) && (
                  <div className="absolute top-full left-0 mt-1 text-xs text-red-600 animate-fade-in-down">
                    {changelogFilterErrors.startDate || changelogFilterErrors.dateRange}
                  </div>
                )}
              </div>
              
              <Button 
                onClick={downloadChangelogExcel} 
                disabled={changelogs.length === 0 || Object.keys(changelogFilterErrors).length > 0}
                loading={downloadLoading}
              >
                Download Full Report
              </Button>
              
              <Button onClick={resetChangelogFilters} variant="secondary">
                Reset Filters
              </Button>
            </div>

            {changelogError && <ErrorMessage message={changelogError} />}

            <div className="overflow-x-auto relative shadow-md sm:rounded-lg bg-white">
              <table className="w-full text-xs text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <SortableHeader title="Campaign" sortKey="campaignName" sortConfig={changelogSortConfig} onSort={handleChangelogSort} />
                    <SortableHeader title="User" sortKey="userName" sortConfig={changelogSortConfig} onSort={handleChangelogSort} />
                    <SortableHeader title="Change Type" sortKey="changeType" sortConfig={changelogSortConfig} onSort={handleChangelogSort} />
                    <SortableHeader title="Previous Info" disabled={true} />
                    <SortableHeader title="New Info" disabled={true} />
                    <SortableHeader title="Date" sortKey="createdAt" sortConfig={changelogSortConfig} onSort={handleChangelogSort} />
                  </tr>
                </thead>
                <tbody>
                  {changelogLoading ? (
                    <tr>
                      <td colSpan="6">
                        <LoadingSpinner />
                      </td>
                    </tr>
                  ) : changelogs.length > 0 ? (
                    changelogs.map((log, index) => (
                      <tr 
                        key={log._id} 
                        className="bg-white border-b hover:bg-gray-50 transition-all duration-200 hover-scale table-row-enter"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {log.campaignId?.campaignName || "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{log.userName}</span>
                            <span className="text-gray-500 text-[10px]">({log.userEmail})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {log.changeType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-pre-wrap text-[10px] max-w-xs">
                          <div className="max-h-20 overflow-y-auto">
                            {renderObjectDetails(log.previousValue) || <em className="text-gray-400">Creation Step</em>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-pre-wrap text-[10px] max-w-xs">
                          <div className="max-h-20 overflow-y-auto">
                            {renderObjectDetails(log.newValue) || <em className="text-gray-400">N/A</em>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span>{dayjs(log.createdAt).format("DD MMM YYYY")}</span>
                            <span className="text-gray-500 text-[10px]">{dayjs(log.createdAt).format("HH:mm")}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-gray-500">
                        No changelogs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <EnhancedPaginationControls
              currentPage={changelogCurrentPage}
              totalPages={changelogTotalPages}
              onPageChange={setChangelogCurrentPage}
              totalCount={changelogTotalCount}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}