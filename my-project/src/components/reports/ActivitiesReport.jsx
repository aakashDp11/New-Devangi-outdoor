import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";

// --- UI HELPER COMPONENTS ---
const Card = ({ children, className }) => (
  <div className={`bg-white shadow-md rounded-lg overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children }) => <div className="p-6">{children}</div>;

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

const SortableHeader = ({ title, sortKey, sortConfig = {}, onSort, disabled = false }) => {
  const isSorting = sortConfig.key === sortKey;
  const direction = isSorting ? sortConfig.direction : null;

  const handleSort = () => {
    if (disabled || !onSort) return;
    const newDirection = isSorting && direction === 'asc' ? 'desc' : 'asc';
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

// Helper to render object values safely
const renderObjectDetails = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value).map(([key, val]) => (
      <div key={key}>
        <strong>{key}:</strong> {String(val)}
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
        .join("\n"); // Use newline for readability in Excel cell
};


export default function ActivitiesReport({ handleShowDateModal }) {
  const [changelogs, setChangelogs] = useState([]);
  const [changelogFilters, setChangelogFilters] = useState({ searchText: "", startDate: "", endDate: "" });
  const [changelogCurrentPage, setChangelogCurrentPage] = useState(1);
  const [changelogTotalPages, setChangelogTotalPages] = useState(1);
  const [changelogTotalCount, setChangelogTotalCount] = useState(0);
  const [changelogSortConfig, setChangelogSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  const fetchChangelogs = async () => {
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

  /**
   * FIXED: Implemented download logic for changelogs.
   */
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
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Change Logs ({changelogTotalCount})
        </h3>
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
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50"
          >
            {changelogFilters.startDate && changelogFilters.endDate
              ? `${changelogFilters.startDate} to ${changelogFilters.endDate}`
              : "Filter by Log Date"}
          </button>
          <Button onClick={downloadChangelogExcel} disabled={changelogs.length === 0}>
            Download Full Report
          </Button>
          <Button onClick={resetChangelogFilters}>
            Reset Filters
          </Button>
        </div>

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
              {changelogs.length > 0 ? (
                changelogs.map((log) => (
                  <tr key={log._id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {log.campaignId?.campaignName || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {log.userName} ({log.userEmail})
                    </td>
                    <td className="px-6 py-4">{log.changeType}</td>
                    <td className="px-6 py-4 whitespace-pre-wrap text-[10px]">
                      {renderObjectDetails(log.previousValue) || <em>Creation Step</em>}
                    </td>
                    <td className="px-6 py-4 whitespace-pre-wrap text-[10px]">
                      {renderObjectDetails(log.newValue)}
                    </td>
                    <td className="px-6 py-4">
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
        <EnhancedPaginationControls
          currentPage={changelogCurrentPage}
          totalPages={changelogTotalPages}
          onPageChange={setChangelogCurrentPage}
          totalCount={changelogTotalCount}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </CardContent>
    </Card>
  );
}