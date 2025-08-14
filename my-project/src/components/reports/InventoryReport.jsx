import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { BarChart } from "@mui/x-charts/BarChart";

// --- UI HELPER COMPONENTS ---
const Input = ({ ...props }) => (
    <div className="flex flex-col text-sm w-full gap-1">
        <label className=" text-gray-700 font-medium">
            {props.label || "Input Field"}
        </label>
        <input
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...props}
        />
    </div>
);
const Select = ({ children, ...props }) => (
    <div className="flex flex-col text-sm w-full gap-1">
        <label className=" text-gray-700 font-medium">
            {props.label || "Select Option"}
        </label>
        <select
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...props}
        >
            {children}
        </select>
    </div>
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

const SortableHeader = ({ title, sortKey, sortConfig, onSort }) => {
  const isSorting = sortConfig.key === sortKey;
  const direction = isSorting ? sortConfig.direction : null;

  const handleSort = () => {
    const newDirection = sortConfig.key === sortKey && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    onSort(sortKey, newDirection);
  };

  return (
    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
      <div
        onClick={handleSort}
        className="flex items-center gap-1.5 cursor-pointer select-none"
      >
        {title}
        <span className="text-gray-400">
          {direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '⇅'}
        </span>
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
            setPageInput(currentPage.toString()); // Reset if invalid
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
const API_MAX_LIMIT = 50; // Use a larger limit for download fetching

const industryOptions = [
    { value: "Tourism", label: "Tourism" }, { value: "Retail", label: "Retail" }, { value: "Real Estate", label: "Real Estate" }, { value: "Other", label: "Other" }, { value: "Movie", label: "Movie" }, { value: "Media and Entertainment", label: "Media and Entertainment" }, { value: "FMCG", label: "FMCG" }, { value: "Finance", label: "Finance" }, { value: "Financial Services", label: "Financial Services" }, { value: "Healthcare", label: "Healthcare" }, { value: "Hospitality", label: "Hospitality" }, { value: "IT Industry", label: "IT Industry" }, { value: "Automobile", label: "Automobile" }, { value: "Clothing & Apparel", label: "Clothing & Apparel" }, { value: "Ecommerce", label: "Ecommerce" }, { value: "Edtech", label: "Edtech" }, { value: "Entertainment", label: "Entertainment" },
];

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

    // --- STATE FOR PERFORMANCE GRAPH (Unchanged) ---
    const [performanceType, setPerformanceType] = useState("top");
    const [performanceMetric, setPerformanceMetric] = useState("totalRevenue");
    const [performanceData, setPerformanceData] = useState([]);

    const resetInventoryFilters = () => {
        setInventoryFilters(defaultFilters);
        setCurrentPage(1);
    };

    const handleInventorySort = (key, direction) => {
        setInventorySortConfig({ key, direction });
        setCurrentPage(1);
    };

    const fetchInventoryReport = async () => {
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
        }
    };

    useEffect(() => {
        fetchInventoryReport();
    }, [currentPage, inventoryFilters, inventorySortConfig]);

    /**
     * FIXED: Implemented download logic for inventory report.
     */
    const downloadInventoryReport = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            alert("Authentication failed. Please log in again.");
            return;
        }

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
                    if (value) params.append(key, value);
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
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) { navigate("/login"); return; }

            const queryParams = new URLSearchParams({ type: performanceType, metric: performanceMetric, limit: 10 }).toString();
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/inventory-performance?${queryParams}`, {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) setPerformanceData(data.data);
        } catch (err) {
            console.error("Failed to fetch inventory performance:", err);
        }
    };

    useEffect(() => {
        fetchInventoryPerformance();
    }, [performanceType, performanceMetric]);

    return (
        <div className="space-y-10">
            {/* All Inventories Report Card */}
            <Card>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">
                        All Inventories Report ({inventoryTotalCount})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 items-end">
                        <Input
                            label="Filter by Name"
                            placeholder="Filter by Name"
                            value={inventoryFilters.name}
                            onChange={(e) => { setInventoryFilters({ ...inventoryFilters, name: e.target.value }); setCurrentPage(1); }}
                        />
                        <Select
                            label="Space Type"
                            name="Space Type"
                            value={inventoryFilters.type}
                            onChange={(e) => { setInventoryFilters({ ...inventoryFilters, type: e.target.value }); setCurrentPage(1); }}
                        >
                            <option value="">All Types</option>
                            <option value="DOOH">DOOH</option>
                            <option value="Billboard">Billboard</option>
                            <option value="Gantry">Gantry</option>
                            <option value="Pole Kiosk">Pole Kiosk</option>
                            <option value="BQS">BQS</option>
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
                        <Button onClick={resetInventoryFilters}>
                            Reset Filters
                        </Button>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-md font-semibold text-gray-700">Inventories Table</h3>
                        <Button onClick={downloadInventoryReport} disabled={inventories.length === 0}>
                            Download Full Report
                        </Button>
                    </div>
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
                                {inventories.length > 0 ? (
                                    inventories.map((inv) => (
                                        <tr key={inv.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{inv.name}</td>
                                            <td className="px-6 py-4">{inv.type}</td>
                                            <td className="px-6 py-4">{inv.agency || "-"}</td>
                                            <td className="px-6 py-4">{inv.industry || "-"}</td>
                                            <td className="px-6 py-4">{inv.bookings?.toLocaleString()}</td>
                                            <td className="px-6 py-4">₹{inv.revenue?.toLocaleString()}</td>
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

            {/* Top/Bottom Performance Card (Unchanged) */}
            <Card>
                <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Inventory Performance ({performanceType === "top" ? "Top" : "Bottom"} by {performanceMetric === "totalRevenue" ? "Revenue" : "Bookings"})
                        </h3>
                        <div className="flex items-end gap-3">
                            <Select label="Metric" value={performanceMetric} onChange={(e) => setPerformanceMetric(e.target.value)}>
                                <option value="totalRevenue">Revenue</option>
                                <option value="totalBookings">Bookings</option>
                            </Select>
                            <Select label="Type" value={performanceType} onChange={(e) => setPerformanceType(e.target.value)}>
                                <option value="top">Top</option>
                                <option value="bottom">Bottom</option>
                            </Select>
                            <Button onClick={() => { setPerformanceType("top"); setPerformanceMetric("totalRevenue"); }}>
                                Reset
                            </Button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <BarChart
                            height={400}
                            series={[{
                                data: performanceData.map((d) => performanceMetric === "totalRevenue" ? d.totalRevenue : d.totalBookings),
                                label: performanceMetric === "totalRevenue" ? "Revenue" : "Bookings",
                            }]}
                            xAxis={[{ scaleType: "band", data: performanceData.map((d) => d.spaceName) }]}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function CustomSelect({ label, name, value, onChange, options }) {
    return (
        <div className="flex flex-col text-sm w-full">
            {label && (<label htmlFor={name} className="mb-1 text-gray-700 font-medium">{label}</label>)}
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="">Select {label}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}