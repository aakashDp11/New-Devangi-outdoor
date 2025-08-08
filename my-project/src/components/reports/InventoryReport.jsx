import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { BarChart } from "@mui/x-charts/BarChart";

// --- UI Components ---
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
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => (
    <div className="flex justify-end items-center mt-4 text-xs">
        <span className="mr-4 text-gray-600">
            Page {currentPage} of {totalPages}
        </span>
        <div className="flex">
            <button
                onClick={() => onPageChange((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-l-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Previous
            </button>
            <button
                onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border-t border-b border-r rounded-r-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Next
            </button>
        </div>
    </div>
);
// --- End of UI Components ---

const ITEMS_PER_PAGE = 10;
const API_MAX_LIMIT = 50; // Use a larger limit for download fetches

const industryOptions = [
    { value: "Tourism", label: "Tourism" },
    { value: "Retail", label: "Retail" },
    { value: "Real Estate", label: "Real Estate" },
    { value: "Other", label: "Other" },
    { value: "Movie", label: "Movie" },
    { value: "Media and Entertainment", label: "Media and Entertainment" },
    { value: "FMCG", label: "FMCG" },
    { value: "Finance", label: "Finance" },
    { value: "Financial Services", label: "Financial Services" },
    { value: "Healthcare", label: "Healthcare" },
    { value: "Hospitality", label: "Hospitality" },
    { value: "IT Industry", label: "IT Industry" },
    { value: "Automobile", label: "Automobile" },
    { value: "Clothing & Apparel", label: "Clothing & Apparel" },
    { value: "Ecommerce", label: "Ecommerce" },
    { value: "Edtech", label: "Edtech" },
    { value: "Entertainment", label: "Entertainment" },
];

export default function InventoryReport({ handleShowDateModal = () => { } }) {
    const navigate = useNavigate();
    const [inventories, setInventories] = useState([]);
    const defaultFilters = { name: "", type: "", agency: "", industry: "" };
    const [inventoryFilters, setInventoryFilters] = useState(defaultFilters);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [performanceType, setPerformanceType] = useState("top");
    const [performanceMetric, setPerformanceMetric] = useState("totalRevenue");
    const [performanceData, setPerformanceData] = useState([]);

    const resetInventoryFilters = () => {
        setInventoryFilters(defaultFilters);
        setCurrentPage(1);
    };

    const fetchInventoryReport = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) { navigate("/login"); return; }

            const params = new URLSearchParams({ page: currentPage, limit: ITEMS_PER_PAGE });
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
            setTotalPages(data.pagination.totalPages || 1);
            setCurrentPage(data.pagination.currentPage || 1);
        } catch (err) {
            console.error("Failed to fetch inventory analytics:", err);
        }
    };

    useEffect(() => {
        fetchInventoryReport();
    }, [currentPage, inventoryFilters]);

    // MODIFICATION: This function now fetches the complete report for download
    const downloadInventoryReport = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            alert("Authentication failed. Please log in.");
            return;
        }

        try {
            const fetchAllInventories = async () => {
                let allInventories = [];
                let currentPage = 1;
                let totalPages = 1;

                do {
                    const params = new URLSearchParams({ page: currentPage, limit: API_MAX_LIMIT });
                    Object.entries(inventoryFilters).forEach(([key, value]) => {
                        if (value) params.append(key, value);
                    });
                    
                    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/inventory-report?${params.toString()}`, {
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    });

                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    const data = await res.json();
                    allInventories = allInventories.concat(data.data || []);
                    totalPages = data.pagination?.totalPages || 1;
                    currentPage++;
                } while (currentPage <= totalPages);
                return allInventories;
            };

            const allData = await fetchAllInventories();

            if (allData.length === 0) {
                alert("No inventory data to download for the selected filters.");
                return;
            }

            const rows = allData.map(inv => ({
                'Name': inv.name,
                'Type': inv.type,
                'Agency': inv.agency || 'N/A',
                'Industry': inv.industry || 'N/A',
                'Bookings': inv.bookings || 0,
                'Revenue': inv.revenue || 0,
            }));

            const sheet = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, sheet, "Inventories");
            const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            saveAs(new Blob([buf], { type: "application/octet-stream" }), `inventories_report_${dayjs().format("YYYYMMDD")}.xlsx`);

        } catch (error) {
            console.error("Error downloading inventory report:", error);
            alert("Failed to download full inventory report. Please try again.");
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
            {/* All Inventories Report */}
            <Card>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">
                        All Inventories Report
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 items-end">
                        <Input
                            label="Filter by Name"
                            placeholder="Filter by Name"
                            value={inventoryFilters.name}
                            onChange={(e) => setInventoryFilters({ ...inventoryFilters, name: e.target.value })}
                        />
                        <Select
                            label="Space Type"
                            name="Space Type"
                            value={inventoryFilters.type}
                            onChange={(e) => setInventoryFilters({ ...inventoryFilters, type: e.target.value })}
                        >
                            <option value="">All Types</option>
                            <option value="DOOH">DOOH</option>
                            <option value="Billboard">Billboard</option>
                            <option value="Gantry">Gantry</option>
                            <option value="Pole Kiosk">Pole Kiosk</option>
                        </Select>
                        <Input
                            label="Filter by Agency"
                            placeholder="Filter by Agency"
                            value={inventoryFilters.agency}
                            onChange={(e) => setInventoryFilters({ ...inventoryFilters, agency: e.target.value })}
                        />
                        <CustomSelect
                            label="Industry"
                            name="industry"
                            value={inventoryFilters.industry}
                            onChange={(e) => setInventoryFilters({ ...inventoryFilters, industry: e.target.value })}
                            options={industryOptions}
                        />
                        <Button onClick={resetInventoryFilters}>
                            Reset Filters
                        </Button>
                    </div>
                    {/* MODIFICATION: Added download button for the full report */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-md font-semibold text-gray-700">Inventories Table</h3>
                        <Button onClick={downloadInventoryReport} disabled={inventories.length === 0}>
                            Download Full Report
                        </Button>
                    </div>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-xs text-left text-gray-600">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Agency</th>
                                    <th className="px-6 py-3">Industry</th>
                                    <th className="px-6 py-3">Bookings</th>
                                    <th className="px-6 py-3">Revenue</th>
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
                                    <tr><td colSpan="6" className="text-center py-10">No inventories found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </CardContent>
            </Card>

            {/* Top/Bottom Performance Card */}
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