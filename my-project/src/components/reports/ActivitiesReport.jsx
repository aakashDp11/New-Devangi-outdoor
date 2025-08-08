import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";

// --- UI Components (Defined locally for consistent styling) ---
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

export default function ActivitiesReport({ handleShowDateModal }) {
  const [changelogs, setChangelogs] = useState([]);
  const [changelogFilters, setChangelogFilters] = useState({
    searchText: "",
    startDate: "",
    endDate: "",
  });
  const [changelogCurrentPage, setChangelogCurrentPage] = useState(1);
  const [changelogTotalPages, setChangelogTotalPages] = useState(1);

  useEffect(() => {
    fetchChangelogs();
  }, [changelogCurrentPage, changelogFilters]);

  const resetChangelogFilters = () => {
    setChangelogFilters({
      searchText: "",
      startDate: "",
      endDate: "",
    });
    setChangelogCurrentPage(1);
  };

  const fetchChangelogs = async () => {
    try {
      const params = new URLSearchParams({
        page: changelogCurrentPage,
        limit: ITEMS_PER_PAGE,
      });
      if (changelogFilters.searchText)
        params.append("search", changelogFilters.searchText);
      if (changelogFilters.startDate)
        params.append("startDate", changelogFilters.startDate);
      if (changelogFilters.endDate)
        params.append("endDate", changelogFilters.endDate);

      const res = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/pipeline/change-Log?${params.toString()}`
      );
      const data = await res.json();
      setChangelogs(data.changelogs || []);
      setChangelogTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch changelogs:", err);
    }
  };

  // MODIFICATION: This function now fetches the complete report for download
  const downloadChangelogExcel = async () => {
    try {
        const fetchAllChangelogs = async () => {
            let allLogs = [];
            let currentPage = 1;
            let totalPages = 1;

            do {
                const params = new URLSearchParams({
                    page: currentPage,
                    limit: API_MAX_LIMIT, // Fetch more items per page for download
                });
                if (changelogFilters.searchText) params.append("search", changelogFilters.searchText);
                if (changelogFilters.startDate) params.append("startDate", changelogFilters.startDate);
                if (changelogFilters.endDate) params.append("endDate", changelogFilters.endDate);

                const res = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log?${params.toString()}`
                );

                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                allLogs = allLogs.concat(data.changelogs || []);
                totalPages = data.totalPages || 1;
                currentPage++;
            } while (currentPage <= totalPages);
            return allLogs;
        };

        const allData = await fetchAllChangelogs();

        if (allData.length === 0) {
            alert("No changelog data to download for the selected filters.");
            return;
        }

        const rows = allData.map((log) => ({
            Campaign: log.campaignId?.campaignName || "N/A",
            User: log.userName || log.userId?.name || "N/A",
            Email: log.userEmail || "N/A",
            ChangeType: log.changeType,
            Previous: JSON.stringify(log.previousValue),
            New: JSON.stringify(log.newValue),
            Date: dayjs(log.createdAt).format("DD MMM YYYY HH:mm"),
        }));

        const sheet = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheet, "Changelogs");
        const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(
            new Blob([buf], { type: "application/octet-stream" }),
            `changelogs_report_${dayjs().format("YYYYMMDD")}.xlsx`
        );
    } catch (error) {
        console.error("Error downloading changelog report:", error);
        alert("Failed to download full changelog report. Please try again.");
    }
  };

  return (
    <Card>
      <CardContent>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Change Logs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-center">
          <Input
            placeholder="Search..."
            value={changelogFilters.searchText}
            onChange={(e) => {
              setChangelogFilters({
                ...changelogFilters,
                searchText: e.target.value,
              });
              setChangelogCurrentPage(1);
            }}
          />
          <button
            onClick={() => {
              handleShowDateModal(
                "changelogs",
                changelogFilters,
                (newFilters) => {
                  setChangelogFilters(newFilters);
                  setChangelogCurrentPage(1);
                }
              );
            }}
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50"
          >
            {changelogFilters.startDate && changelogFilters.endDate
              ? `${changelogFilters.startDate} to ${changelogFilters.endDate}`
              : "Filter by Log Date"}
          </button>
          {/* MODIFICATION: Updated button text to 'Download Full Report' */}
          <Button onClick={downloadChangelogExcel} disabled={changelogs.length === 0}>
            Download Full Report
          </Button>
          <Button onClick={resetChangelogFilters}>
            Reset Filters
          </Button>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-xs text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Campaign
                </th>
                <th scope="col" className="px-6 py-3">
                  User
                </th>
                <th scope="col" className="px-6 py-3">
                  Change Type
                </th>
                <th scope="col" className="px-6 py-3">
                  Previous Info
                </th>
                <th scope="col" className="px-6 py-3">
                  New Info
                </th>
                <th scope="col" className="px-6 py-3">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {changelogs.length > 0 ? (
                changelogs.map((log) => (
                  <tr
                    key={log._id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {log.campaignId?.campaignName}
                    </td>
                    <td className="px-6 py-4">
                      {log.userName || log.userId?.name} ({log.userEmail})
                    </td>
                    <td className="px-6 py-4">{log.changeType}</td>
                    <td className="px-4 py-3 whitespace-pre-wrap text-[10px]">
                      {renderObjectDetails(log.previousValue) || (
                        <em>Creation Step</em>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-pre-wrap text-[10px]">
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
        <PaginationControls
          currentPage={changelogCurrentPage}
          totalPages={changelogTotalPages}
          onPageChange={setChangelogCurrentPage}
        />
      </CardContent>
    </Card>
  );
}