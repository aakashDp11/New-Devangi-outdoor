import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
// Assuming Navbar is available in the same directory or path
import Navbar from "./Navbar"; // Uncomment if you have a Navbar component
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { useSidebar } from "../context/SidebarContext";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

// Re-using the Input component from your original code
const Input = ({ className = "", ...props }) => (
  <input
    className={`border px-3 py-2 rounded w-full ${className}`}
    {...props}
  />
);

// Re-using the SortableHeader component from your original code
const SortableHeader = ({ title, sortKey, sortConfig, setSortConfig }) => {
  const isSorting = sortConfig.key === sortKey;
  const direction = isSorting ? sortConfig.direction : null;

  const handleSort = () => {
    setSortConfig((prev) => ({
      key: sortKey,
      direction:
        prev.key === sortKey && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <th scope="col" className="px-6 py-3">
      <div
        onClick={handleSort}
        className="flex items-center gap-1.5 cursor-pointer select-none"
      >
        {title}
        <span className="text-gray-400">
          {direction === "asc" ? "▲" : direction === "desc" ? "▼" : "⇅"}
        </span>
      </div>
    </th>
  );
};

export default function BookingsDashboard1() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: null,
      endDate: null,
      key: "selection",
    },
  ]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const limit = 10;

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (isNaN(date)) return "—";
    return format(date, "dd/MM/yyyy");
  };

  // Helper function to get the earliest/latest campaign date for local sorting/display
  const getUpcomingCampaignDate = (campaigns, type = "startDate") => {
    if (!campaigns?.length) return null;
    const sorted = campaigns
      .filter((c) => c[type])
      .sort((a, b) => new Date(a[type]) - new Date(b[type]));
    return sorted[0]?.[type] || null;
  };

  // Memoized function to fetch bookings from the backend API
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("accessToken");

    try {
      // Format dates for backend query parameters
      const startDateParam = dateRange[0].startDate
        ? format(dateRange[0].startDate, "yyyy-MM-dd")
        : "";
      const endDateParam = dateRange[0].endDate
        ? format(dateRange[0].endDate, "yyyy-MM-dd")
        : "";

      // Construct query parameters
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: limit,
        search: search, // Send search term to backend
      });

      if (startDateParam) {
        queryParams.append("startDate", startDateParam);
      }
      if (endDateParam) {
        queryParams.append("endDate", endDateParam);
      }

      // IMPORTANT: Ensure VITE_API_BASE_URL is correctly configured in your .env file
      // e.g., VITE_API_BASE_URL=http://localhost:5000
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/bookings/filter-by-date?${queryParams.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.message === "Invalid or expired token") {
          localStorage.clear();
          navigate("/login");
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch bookings");
      }

      const data = await response.json();
      setBookings(data.bookings);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(err.message);
      setBookings([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, search, dateRange, navigate]); // Dependencies for useCallback

  // Effect hook to fetch bookings whenever pagination or filter parameters change
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]); // Re-run effect when fetchBookings changes (due to its dependencies)

  // Handler for applying date filters from the modal
  const handleApplyDateFilters = () => {
    setCurrentPage(1); // Reset to first page when applying new filters
    setShowDateModal(false); // Close the modal
    // fetchBookings will be triggered by the `dateRange` state change in `useEffect`
  };

  // Handler for clearing all filters (search and date)
  const handleClearAllFilters = () => {
    setSearch("");
    setDateRange([{ startDate: null, endDate: null, key: "selection" }]);
    setCurrentPage(1); // Reset to first page
    // fetchBookings will be triggered by the state changes
  };

  // Local sorting of the currently displayed data (if backend sorting is not implemented)
  const sortedData = [...bookings].sort((a, b) => {
    const { key, direction } = sortConfig;
    if (!key) return 0;

    if (key === "upcomingStartDate" || key === "upcomingEndDate") {
      const aDate = getUpcomingCampaignDate(
        a.campaigns,
        key === "upcomingStartDate" ? "startDate" : "endDate"
      );
      const bDate = getUpcomingCampaignDate(
        b.campaigns,
        key === "upcomingStartDate" ? "startDate" : "endDate"
      );
      if (!aDate || !bDate) return 0;
      return direction === "asc"
        ? new Date(aDate) - new Date(bDate)
        : new Date(bDate) - new Date(aDate);
    }

    const aVal = a[key]?.toString().toLowerCase() || "";
    const bVal = b[key]?.toString().toLowerCase() || "";
    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 h-screen w-screen text-black flex flex-col lg:flex-row overflow-hidden">
      <Navbar />
      <main
        className={`flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 transition-all duration-300 ${
          isCollapsed ? "lg:ml-24" : "lg:ml-64"
        }`}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-2xl">Bookings</h2>
          <button
            onClick={() => navigate("/create-booking")}
            className="bg-black text-white text-xs px-3 py-2 rounded hover:scale-105 transition"
          >
            + Create Booking
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input
            className="h-[2rem] text-xs"
            placeholder="Search Bookings (Company, Client, Brand)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDateModal(true)}
              className="border px-4 py-1 rounded bg-gray-100 text-xs hover:bg-gray-200"
            >
              Date Filter
            </button>
            {(dateRange[0].startDate || dateRange[0].endDate) && (
              <span className="text-xs text-gray-500">
                {dateRange[0].startDate
                  ? formatDate(dateRange[0].startDate)
                  : "Any"}{" "}
                -
                {dateRange[0].endDate
                  ? formatDate(dateRange[0].endDate)
                  : "Any"}
              </span>
            )}
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleClearAllFilters}
              className="px-3 py-1 rounded bg-black text-white text-xs hover:bg-red-200 transition"
            >
              Clear 
            </button>
          </div>
        </div>

        <div className="overflow-x-auto relative shadow-md sm:rounded-lg bg-white">
          <table className="w-full text-xs text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">
                  #
                </th>
                <th scope="col" className="px-6 py-3">
                  Booking ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Company Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Client Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Booking Date
                </th>
                <SortableHeader
                  title="Upcoming Start Date"
                  sortKey="upcomingStartDate"
                  sortConfig={sortConfig}
                  setSortConfig={setSortConfig}
                />
                <SortableHeader
                  title="Upcoming End Date"
                  sortKey="upcomingEndDate"
                  sortConfig={sortConfig}
                  setSortConfig={setSortConfig}
                />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading bookings...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-red-600">
                    Error: {error}
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-600">
                    No bookings found matching your criteria.
                  </td>
                </tr>
              ) : (
                sortedData.map((item, index) => {
                  const upcomingStart = getUpcomingCampaignDate(
                    item.campaigns,
                    "startDate"
                  );
                  const upcomingEnd = getUpcomingCampaignDate(
                    item.campaigns,
                    "endDate"
                  );

                  return (
                    <tr
                      key={item._id}
                      className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/booking/${item._id}`)}
                    >
                      <td className="px-6 py-4 text-gray-500">
                        {(currentPage - 1) * limit + index + 1}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-500">
                        {item._id?.substring(0, 6).toUpperCase() || "N/A"}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        <div className="font-semibold text-gray-800">
                          {item.companyName || "No Company"}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-500">
                        <div className="text-gray-500 text-xs">
                          {item.clientName || "No Client"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {formatDate(item.createdAt) || (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {formatDate(upcomingStart) || (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {formatDate(upcomingEnd) || (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="mt-6 text-xs flex justify-center gap-2">
            <button
              className="px-3 py-1  bg-gray-200 hover:bg-gray-300"
              onClick={handlePrevPage}
              disabled={currentPage === 1 || loading}
            >
              <FaArrowLeft />
            </button>
            <button
              onClick={() => setCurrentPage(i + 1)}
              className="bg-black text-white"
              disabled={loading}
            >
              {currentPage}
            </button>
            <button
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || loading}
            >
              <FaArrowRight />
            </button>
          </div>
        )}

        {showDateModal && (
          <div className="fixed inset-0 text-xs flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-xl shadow-lg p-2 py-[1%]">
              <DateRange
                editableDateInputs={true}
                onChange={(item) => setDateRange([item.selection])}
                moveRangeOnFirstSelection={false}
                ranges={dateRange}
                className="text-xs"
              />
              <div className="flex justify-end gap-2 mt-4 mx-2">
                <button
                  onClick={() => {
                    setShowDateModal(false);
                    // Optionally reset dateRange if cancelled
                    // setDateRange([{ startDate: null, endDate: null, key: 'selection' }]);
                  }}
                  className="text-xs px-3 py-1 rounded bg-gray-200 mr-auto hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyDateFilters}
                  className="text-xs px-3 py-1 rounded bg-black text-white hover:bg-gray-900"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
