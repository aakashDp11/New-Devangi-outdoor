import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import {
  Card,
  CardContent,
  Input,
  Button,
  PaginationControls,
} from "./UIComponents";

const ITEMS_PER_PAGE = 10;

// Helper to render object values safely
const renderObjectDetails = (value) => {
  // Check if the value is a non-null object
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value).map(([key, val]) => (
      <div key={key}>
        <strong>{key}:</strong> {String(val)}
      </div>
    ));
  }
  // Handle other types if necessary, or return null/empty
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

  // Combined useEffect to handle fetching data
  useEffect(() => {
    fetchChangelogs();
  }, [changelogCurrentPage, changelogFilters]);

  const fetchChangelogs = async (pageOverride = null) => {
    try {
      const pageToFetch = pageOverride || changelogCurrentPage;

      const params = new URLSearchParams({
        page: pageToFetch,
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
      setChangelogCurrentPage(data.currentPage || 1); // update in case backend overrides
    } catch (err) {
      console.error("Failed to fetch changelogs:", err);
    }
  };

  const getChangelogRowsForExcel = () =>
    changelogs.map((log) => ({
      Campaign: log.campaignId?.campaignName || "",
      User: log.userName || log.userId?.name || "",
      Email: log.userEmail,
      ChangeType: log.changeType,
      Previous: JSON.stringify(log.previousValue),
      New: JSON.stringify(log.newValue),
      Date: dayjs(log.createdAt).format("DD MMM YYYY HH:mm"),
    }));

  const downloadChangelogExcel = () => {
    const rows = getChangelogRowsForExcel();
    const sheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Changelogs");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buf], { type: "application/octet-stream" }),
      `changelogs_page_${changelogCurrentPage}.xlsx`
    );
  };

  return (
    <Card>
      <CardContent>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Change Logs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Input
            placeholder="Search..."
            value={changelogFilters.searchText}
            onChange={(e) => {
              setChangelogFilters({
                ...changelogFilters,
                searchText: e.target.value,
              });
              fetchChangelogs(1); // force page 1 when filters are applied
            }}
          />
          <button
            onClick={() => {
              handleShowDateModal(
                "changelogs",
                changelogFilters,
                (newFilters) => {
                  setChangelogFilters(newFilters);
                  fetchChangelogs(1);
                }
              );
            }}
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50"
          >
            {changelogFilters.startDate && changelogFilters.endDate
              ? `${changelogFilters.startDate} to ${changelogFilters.endDate}`
              : "Filter by Log Date"}
          </button>
          <Button onClick={downloadChangelogExcel} className="h-full">
            Download Excel (Current Page)
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
