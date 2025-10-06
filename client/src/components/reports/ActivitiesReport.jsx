import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
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
const SortableHeader = ({ title, sortKey, sortConfig = {}, onSort, disabled = false, className = '' }) => {
    const isSorting = sortConfig.key === sortKey;
    const direction = isSorting ? sortConfig.direction : null;

    const handleSort = () => {
        if (disabled || !onSort) return;
        const newDirection = isSorting && direction === 'asc' ? 'desc' : 'asc';
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


// Helper to render object values safely
const renderObjectDetails = (value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return Object.entries(value).map(([key, val]) => (
            <div key={key}>
                <strong className="font-semibold">{key}:</strong> {String(val)}
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
    // Using comma and space separation for better compatibility with CSV/Excel cell width, then wrapping
    return Object.entries(value)
        .map(([key, val]) => `${key}: ${String(val)}`)
        .join("; "); 
};


export default function ActivitiesReport({ handleShowDateModal }) {
    const [changelogs, setChangelogs] = useState([]);
    const [changelogFilters, setChangelogFilters] = useState({ searchText: "", startDate: "", endDate: "" });
    const [changelogCurrentPage, setChangelogCurrentPage] = useState(1);
    const [changelogTotalPages, setChangelogTotalPages] = useState(1);
    const [changelogTotalCount, setChangelogTotalCount] = useState(0);
    const [changelogSortConfig, setChangelogSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    const [changelogTableLoading, setChangelogTableLoading] = useState(false);

    const fetchChangelogs = async () => {
        setChangelogTableLoading(true);
        try {
            const params = new URLSearchParams({
                page: changelogCurrentPage,
                limit: ITEMS_PER_PAGE,
                sortKey: changelogSortConfig.key,
                sortDirection: changelogSortConfig.direction,
            });
            if (changelogFilters.searchText) params.append("search", changelogFilters.searchText);
            if (changelogFilters.startDate) params.append("startDate", changelogFilters.startDate);
            if (changelogFilters.endDate) params.append("endDate", changelogFilters.endDate);

            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log?${params.toString()}`
            );
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const data = await res.json();
            setChangelogs(data.changelogs || []);
            setChangelogTotalPages(data.pagination?.totalPages || 1);
            setChangelogTotalCount(data.pagination?.totalCount || 0);
        } catch (err) {
            console.error("Failed to fetch changelogs:", err);
        } finally {
            setChangelogTableLoading(false);
        }
    };

    useEffect(() => {
        fetchChangelogs();
    }, [changelogCurrentPage, changelogFilters, changelogSortConfig]);

    const resetChangelogFilters = () => {
        setChangelogFilters({ searchText: "", startDate: "", endDate: "" });
        setChangelogCurrentPage(1);
    };

    const handleChangelogSort = (key, direction) => {
        setChangelogSortConfig({ key, direction });
        setChangelogCurrentPage(1);
    };

    const downloadChangelogExcel = async () => {
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
                if (changelogFilters.searchText) params.append("search", changelogFilters.searchText);
                if (changelogFilters.startDate) params.append("startDate", changelogFilters.startDate);
                if (changelogFilters.endDate) params.append("endDate", changelogFilters.endDate);
                
                const res = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log?${params.toString()}`
                );
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                
                const data = await res.json();
                allChangelogs = allChangelogs.concat(data.changelogs || []);
                totalPages = data.pagination?.totalPages || 1;
                currentPage++;
            } while (currentPage <= totalPages);
            
            if (allChangelogs.length === 0) {
                alert("No changelog data to download.");
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
            alert("Failed to download the report. Please try again.");
        }
    };

    return (
        <Card>
            <CardContent>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2 border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-sans font-normal text-black">
                        Change Logs ({changelogTotalCount})
                    </h3>
                    <Button onClick={downloadChangelogExcel} disabled={changelogs.length === 0} className='bg-black text-white hover:bg-gray-800 shadow-md hover:shadow-lg'>
                        Download Full Report
                    </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-center">
                    <Input
                        placeholder="Search User, Campaign, etc..."
                        value={changelogFilters.searchText}
                        onChange={(e) => {
                            setChangelogFilters({ ...changelogFilters, searchText: e.target.value });
                            setChangelogCurrentPage(1);
                        }}
                    />
                    <button
                        onClick={() => {
                            handleShowDateModal("changelogs", changelogFilters, (newFilters) => {
                                setChangelogFilters(newFilters);
                                setChangelogCurrentPage(1);
                            });
                        }}
                        className='px-4 py-2 rounded-xl hover:bg-gray-100 hover:ring-2 ring-black w-full text-left bg-white text-black transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md text-xs'
                    >
                        {changelogFilters.startDate && changelogFilters.endDate
                            ? `${changelogFilters.startDate} to ${changelogFilters.endDate}`
                            : "Filter by Log Date"}
                    </button>
                    <div className="lg:col-span-2 flex gap-4">
                        <Button onClick={resetChangelogFilters} className='bg-gray-700 text-white hover:bg-gray-800 shadow-md hover:shadow-lg w-full'>
                            Reset Filters
                        </Button>
                    </div>
                </div>

                {/* Table Structure */}
                <div className="bg-white shadow-xl rounded-xl animate-slideUp w-full overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-xs text-left text-gray-600">
                            <thead className="text-xs text-black uppercase bg-gray-100 sticky top-0 z-10 border-b border-gray-300">
                                <tr className="border-b-2 border-gray-200">
                                    <SortableHeader title="Campaign" sortKey="campaignName" sortConfig={changelogSortConfig} onSort={handleChangelogSort} />
                                    <SortableHeader title="User" sortKey="userName" sortConfig={changelogSortConfig} onSort={handleChangelogSort} />
                                    <SortableHeader title="Change Type" sortKey="changeType" sortConfig={changelogSortConfig} onSort={handleChangelogSort} />
                                    <SortableHeader title="Previous Info" disabled={true} />
                                    <SortableHeader title="New Info" disabled={true} />
                                    <SortableHeader title="Date" sortKey="createdAt" sortConfig={changelogSortConfig} onSort={handleChangelogSort} />
                                </tr>
                            </thead>
                            <tbody>
                                {changelogTableLoading ? (
                                    <tr><td colSpan="6" className="text-center py-10 text-gray-500"><CircularProgress size={24} /></td></tr>
                                ) : changelogs.length > 0 ? (
                                    changelogs.map((log, index) => (
                                        <tr 
                                            key={log._id} 
                                            className={`transition-all duration-200 border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50/50 hover:shadow-inner`}
                                        >
                                            <td className="px-6 py-4 font-medium text-black whitespace-nowrap">
                                                {log.campaignId?.campaignName || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-black">
                                                {log.userName} (<span className="text-gray-600">{log.userEmail}</span>)
                                            </td>
                                            <td className="px-6 py-4 text-black font-medium">{log.changeType}</td>
                                            <td className="px-6 py-4 text-gray-700 whitespace-pre-wrap text-[10px]">
                                                {renderObjectDetails(log.previousValue) || <em className="text-green-600">Creation Step</em>}
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 whitespace-pre-wrap text-[10px]">
                                                {renderObjectDetails(log.newValue)}
                                            </td>
                                            <td className="px-6 py-4 text-black">
                                                {dayjs(log.createdAt).format("DD MMM YYYY HH:mm")}
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
                </div>

                <Pagination
                    currentPage={changelogCurrentPage}
                    totalPages={changelogTotalPages}
                    onPageChange={setChangelogCurrentPage}
                    totalCount={changelogTotalCount}
                    itemsPerPage={ITEMS_PER_PAGE}
                    loading={changelogTableLoading}
                />
            </CardContent>

            {/* Tailwind Keyframes/Animation Styles (Copied for consistency) */}
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
        </Card>
    );
}