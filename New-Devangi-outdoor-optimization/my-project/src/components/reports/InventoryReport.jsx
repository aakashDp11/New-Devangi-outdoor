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
const Input = ({ className = '', label, ...props }) => (
    <div className="flex flex-col w-full gap-1">
        {label && <label className="text-xs font-medium text-gray-700">{label}</label>}
        <input
            className={`
                px-4 py-2 rounded-xl w-full bg-white text-black 
                focus:outline-none focus:ring-2 focus:ring-black transition-all duration-200 shadow-sm 
                hover:shadow-md hover:ring-2 hover:ring-gray-200 text-xs
                ${className}
            `}
            {...props}
        />
    </div>
);

// Consistent Select Component from RevenueReport
const Select = ({ children, className = '', label, ...props }) => (
    <div className="flex flex-col w-full gap-1">
        {label && <label className="text-xs font-medium text-gray-700">{label}</label>}
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
    </div>
);

// Consistent ShimmerCard
const ShimmerCard = () => (
    <div className="h-80 bg-white rounded-2xl animate-pulse shadow-md border border-gray-200">
        <div className="p-6 h-full flex items-center justify-center text-gray-400">
            Loading Chart...
        </div>
    </div>
);

// New ValidationMessage
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

const industryOptions = [
    { value: "Tourism", label: "Tourism" }, { value: "Retail", label: "Retail" }, { value: "Real Estate", label: "Real Estate" }, { value: "Other", label: "Other" }, { value: "Movie", label: "Movie" }, { value: "Media and Entertainment", label: "Media and Entertainment" }, { value: "FMCG", label: "FMCG" }, { value: "Finance", label: "Finance" }, { value: "Financial Services", label: "Financial Services" }, { value: "Healthcare", label: "Healthcare" }, { value: "Hospitality", label: "Hospitality" }, { value: "IT Industry", label: "IT Industry" }, { value: "Automobile", label: "Automobile" }, { value: "Clothing & Apparel", label: "Clothing & Apparel" }, { value: "Ecommerce", label: "Ecommerce" }, { value: "Edtech", label: "Edtech" }, { value: "Entertainment", label: "Entertainment" },
];

function CustomSelect({ label, name, value, onChange, options }) {
    // Re-implemented CustomSelect using the new styled Select component
    return (
        <Select label={label} name={name} value={value} onChange={onChange}>
            <option value="">Select {label}</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </Select>
    );
}

export default function InventoryReport({ handleShowDateModal = () => { } }) {
    const navigate = useNavigate();

    // --- STATE FOR INVENTORY REPORT TABLE ---
    const [inventories, setInventories] = useState([]);
    const defaultFilters = { name: "", type: "", agency: "", industry: "" };
    const [inventoryFilters, setInventoryFilters] = useState(defaultFilters);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [inventoryTotalCount, setInventoryTotalCount] = useState(0);
    const [inventorySortConfig, setInventorySortConfig] = useState({ key: 'revenue', direction: 'desc' });
    const [inventoryTableLoading, setInventoryTableLoading] = useState(false); // Added loading state

    // --- STATE FOR PERFORMANCE GRAPH ---
    const [performanceType, setPerformanceType] = useState("top");
    const [performanceMetric, setPerformanceMetric] = useState("totalRevenue");
    const [performanceData, setPerformanceData] = useState([]);
    const [performanceTotal, setPerformanceTotal] = useState(0);
    const [performanceGraphLoading, setPerformanceGraphLoading] = useState(true); // Added loading state


    const resetInventoryFilters = () => {
        setInventoryFilters(defaultFilters);
        setCurrentPage(1);
    };

    const handleInventorySort = (key, direction) => {
        setInventorySortConfig({ key, direction });
        setCurrentPage(1);
    };

    const fetchInventoryReport = async () => {
        setInventoryTableLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) { navigate("/login"); return; }

            const params = new URLSearchParams({
                page: currentPage,
                limit: ITEMS_PER_PAGE,
                sortKey: inventorySortConfig.key,
                sortDirection: inventorySortConfig.direction,
            });
            Object.entries(inventoryFilters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/inventory-report?${params.toString()}`, {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });

            if (res.status === 403) { localStorage.clear(); navigate("/login"); return; }
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const data = await res.json();
            setInventories(data.data || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setCurrentPage(data.pagination?.currentPage || 1);
            setInventoryTotalCount(data.pagination?.totalCount || 0);
        } catch (err) {
            console.error("Failed to fetch inventory analytics:", err);
        } finally {
            setInventoryTableLoading(false);
        }
    };

    const downloadInventoryReport = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            alert("Authentication failed. Please log in again.");
            return;
        }

        try {
            let allInventories = [];
            let current = 1;
            let total = 1;

            do {
                const params = new URLSearchParams({
                    page: current,
                    limit: API_MAX_LIMIT,
                    sortKey: inventorySortConfig.key,
                    sortDirection: inventorySortConfig.direction,
                });
                Object.entries(inventoryFilters).forEach(([key, value]) => {
                    if (value) params.append(key, value);
                });

                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/inventory-report?${params.toString()}`, {
                    headers: { "Authorization": `Bearer ${token}` },
                });

                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                
                const data = await res.json();
                allInventories = allInventories.concat(data.data || []);
                total = data.pagination?.totalPages || 1;
                current++;
            } while (current <= total);

            if (allInventories.length === 0) {
                alert("No inventory data to download for the selected filters.");
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
            alert("Failed to download the report. Please try again.");
        }
    };

    const fetchInventoryPerformance = async () => {
        setPerformanceGraphLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) { navigate("/login"); return; }

            // Fetch top 10/bottom 10 for the graph
            const queryParams = new URLSearchParams({ type: performanceType, metric: performanceMetric, limit: 10 }).toString();
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/inventory-performance?${queryParams}`, {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                const performanceItems = data.data || [];
                setPerformanceData(performanceItems);
                
                // Fetch the total metric value for all items (not just the top 10)
                const totalParams = new URLSearchParams({ type: 'total', metric: performanceMetric }).toString();
                const totalRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/inventory-performance?${totalParams}`, {
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                });
                const totalData = await totalRes.json();
                
                const total = totalData.summary?.totalValue || 0;
                setPerformanceTotal(total);
            }
        } catch (err) {
            console.error("Failed to fetch inventory performance:", err);
        } finally {
            setPerformanceGraphLoading(false);
        }
    };

    useEffect(() => {
        fetchInventoryPerformance();
    }, [performanceType, performanceMetric]);

    useEffect(() => {
        fetchInventoryReport();
    }, [currentPage, inventoryFilters, inventorySortConfig]);

    return (
        <div className="space-y-10">
            {/* All Inventories Report Card */}
            <CardContent>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2 border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-sans font-normal text-black">
                        All Inventories Report ({inventoryTotalCount})
                    </h3>
                    <Button onClick={downloadInventoryReport} disabled={inventories.length === 0}>
                        Download Full Report
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 items-end">
                    <Input
                        label="Filter by Name"
                        placeholder="Filter by Name"
                        value={inventoryFilters.name}
                        onChange={(e) => { setInventoryFilters({ ...inventoryFilters, name: e.target.value }); setCurrentPage(1); }}
                    />
                    <Select
                        label="Space Type"
                        value={inventoryFilters.type}
                        onChange={(e) => { setInventoryFilters({ ...inventoryFilters, type: e.target.value }); setCurrentPage(1); }}
                    >
                        <option value="">All Types</option>
                        <option value="DOOH">DOOH</option>
                        <option value="Billboard">Billboard</option>
                        <option value="Gantry">Gantry</option>
                        <option value="Pole Kiosk">Pole Kiosk</option>
                        <option value="BQS">BQS</option>
                        <option value="DigitalBQS">Digital BQS</option>
                        <option value="Miscellaneous">Miscellaneous</option>
                    </Select>
                    <Input
                        label="Filter by Agency"
                        placeholder="Filter by Agency"
                        value={inventoryFilters.agency}
                        onChange={(e) => { setInventoryFilters({ ...inventoryFilters, agency: e.target.value }); setCurrentPage(1); }}
                    />
                    <CustomSelect
                        label="Industry"
                        name="industry"
                        value={inventoryFilters.industry}
                        onChange={(e) => { setInventoryFilters({ ...inventoryFilters, industry: e.target.value }); setCurrentPage(1); }}
                        options={industryOptions}
                    />
                    <Button onClick={resetInventoryFilters} className='bg-gray-700 text-white hover:bg-gray-800 shadow-md hover:shadow-lg'>
                        Reset Filters
                    </Button>
                </div>
                
                {/* Table Structure */}
                <div className="bg-white shadow-xl rounded-xl animate-slideUp w-full overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-xs text-left text-gray-600">
                            <thead className="text-xs text-black uppercase bg-gray-100 sticky top-0 z-10 border-b border-gray-300">
                                <tr className="border-b-2 border-gray-200">
                                    <SortableHeader title="Name" sortKey="name" sortConfig={inventorySortConfig} onSort={handleInventorySort} />
                                    <SortableHeader title="Type" sortKey="type" sortConfig={inventorySortConfig} onSort={handleInventorySort} />
                                    <SortableHeader title="Agency" sortKey="agency" sortConfig={inventorySortConfig} onSort={handleInventorySort} />
                                    <SortableHeader title="Industry" sortKey="industry" sortConfig={inventorySortConfig} onSort={handleInventorySort} />
                                    <SortableHeader title="Bookings" sortKey="bookings" sortConfig={inventorySortConfig} onSort={handleInventorySort} />
                                    <SortableHeader title="Revenue" sortKey="revenue" sortConfig={inventorySortConfig} onSort={handleInventorySort} />
                                </tr>
                            </thead>
                            <tbody>
                                {inventoryTableLoading ? (
                                    <tr><td colSpan="6" className="text-center py-10 text-gray-500"><CircularProgress size={24} /></td></tr>
                                ) : inventories.length > 0 ? (
                                    inventories.map((inv, index) => (
                                        <tr 
                                            key={inv.id} 
                                            className={`transition-all duration-200 border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50/50 hover:shadow-inner`}
                                        >
                                            <td className="px-6 py-4 font-medium text-black whitespace-nowrap">{inv.name}</td>
                                            <td className="px-6 py-4 text-black">{inv.type}</td>
                                            <td className="px-6 py-4 text-black">{inv.agency || "-"}</td>
                                            <td className="px-6 py-4 text-black">{inv.industry || "-"}</td>
                                            <td className="px-6 py-4 text-black">{inv.bookings?.toLocaleString()}</td>
                                            <td className="px-6 py-4 font-medium text-black">₹{inv.revenue?.toLocaleString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="6" className="text-center py-10 text-gray-500">No inventories found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalCount={inventoryTotalCount}
                    itemsPerPage={ITEMS_PER_PAGE}
                    loading={inventoryTableLoading}
                />
            </CardContent>

            {/* Top/Bottom Performance Card */}
            <CardContent>
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4 border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-sans font-normal text-black">
                        Inventory Performance ({performanceType === "top" ? "Top" : "Bottom"} 10 by {performanceMetric === "totalRevenue" ? "Revenue" : "Bookings"})
                    </h3>
                    <div className="flex items-end gap-3">
                        <Select label="Metric" value={performanceMetric} onChange={(e) => setPerformanceMetric(e.target.value)} className="w-32">
                            <option value="totalRevenue">Revenue</option>
                            <option value="totalBookings">Bookings</option>
                        </Select>
                        <Select label="Type" value={performanceType} onChange={(e) => setPerformanceType(e.target.value)} className="w-24">
                            <option value="top">Top</option>
                            <option value="bottom">Bottom</option>
                        </Select>
                        <Button onClick={() => { setPerformanceType("top"); setPerformanceMetric("totalRevenue"); }} className='bg-gray-700 text-white hover:bg-gray-800 shadow-md hover:shadow-lg'>
                            Reset
                        </Button>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <p className="font-semibold text-sm w-full text-right text-black">
                        Total {performanceMetric === "totalRevenue" ? "Revenue" : "Bookings"}: {performanceMetric === "totalRevenue" ? `₹${performanceTotal.toLocaleString()}` : performanceTotal.toLocaleString()}
                    </p>
                    {performanceGraphLoading ? <ShimmerCard /> : (
                        <div className="overflow-x-auto flex-grow h-96 -ml-4 -mr-2">
                            <BarChart
                                height={400}
                                series={[{
                                    data: performanceData.map((d) => performanceMetric === "totalRevenue" ? d.totalRevenue : d.totalBookings),
                                    label: performanceMetric === "totalRevenue" ? "Revenue" : "Bookings",
                                    color: performanceMetric === "totalRevenue" ? "#8b5cf6" : "#10B981", // Use the purple/green colors
                                    valueFormatter: (value) => {
                                        const percentage = performanceTotal > 0 ? ((value / performanceTotal) * 100).toFixed(1) : 0;
                                        const formattedValue = performanceMetric === "totalRevenue" ? `₹${value.toLocaleString()}` : value.toLocaleString();
                                        return `${formattedValue} (${percentage}%)`;
                                    },
                                }]}
                                xAxis={[{ 
                                    scaleType: "band", 
                                    data: performanceData.map((d) => d.spaceName),
                                    tickLabelStyle: { angle: -45, textAnchor: "end", fontSize: 10 }
                                }]}
                                yAxis={[{ 
                                    label: performanceMetric === "totalRevenue" ? "Revenue Amount" : "Number of Bookings",
                                }]}
                                margin={{ top: 40, right: 20, bottom: 90, left: 60 }} // Increased bottom margin for rotated labels
                                grid={{ vertical: false, horizontal: true }}
                            />
                        </div>
                    )}
                </div>
            </CardContent>

            {/* Tailwind Keyframes/Animation Styles */}
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