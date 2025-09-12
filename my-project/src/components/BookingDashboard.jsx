import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import Navbar from "./Navbar";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { useSidebar } from "../context/SidebarContext";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

// --- UI HELPER COMPONENTS ---

const Input = ({ className = "", ...props }) => (
  <input
    className={`border border-[var(--color-border)] px-3 py-2 rounded w-full bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${className}`}
    {...props}
  />
);

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
        className="flex items-center gap-1.5 cursor-pointer select-none text-[var(--color-text)] hover:text-[var(--color-primary)]"
      >
        {title}
        <span className="text-[var(--color-muted)]">
          {direction === "asc" ? "▲" : direction === "desc" ? "▼" : "⇅"}
        </span>
      </div>
    </th>
  );
};

/**
 * Reusable Pagination component with results count.
 */
const Pagination = ({ currentPage, totalPages, onPageChange, totalCount, itemsPerPage, loading }) => {
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
            setPageInput(currentPage.toString());
        }
    };

    if (totalCount === 0 && !loading) {
        return null;
    }

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalCount);

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-xs gap-4">
            <span className="text-[var(--color-muted)]">
                {totalCount > 0 ? `Showing ${startItem} - ${endItem} of ${totalCount} results` : ''}
            </span>
            {totalPages > 1 && (
                <div className="flex items-center gap-4">
                    <button
                        className="px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded hover:bg-[var(--color-hover)] disabled:opacity-50 transition"
                        onClick={() => onPageChange(currentPage > 1 ? currentPage - 1 : 1)}
                        disabled={currentPage === 1 || loading}
                    >
                        <FaArrowLeft />
                    </button>
                    <form onSubmit={handlePageSubmit} className="flex items-center gap-2">
                        <span className="text-[var(--color-text)]">Page</span>
                        <input
                            type="text"
                            value={pageInput}
                            onChange={(e) => setPageInput(e.target.value)}
                            className="w-12 h-8 text-center border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-text)]"
                        />
                        <span className="text-[var(--color-text)]">of {totalPages}</span>
                    </form>
                    <button
                        className="px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded hover:bg-[var(--color-hover)] disabled:opacity-50 transition"
                        onClick={() => onPageChange(currentPage < totalPages ? currentPage + 1 : totalPages)}
                        disabled={currentPage === totalPages || loading}
                    >
                        <FaArrowRight />
                    </button>
                </div>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---

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

  const getUpcomingCampaignDate = (campaigns, type = "startDate") => {
    if (!campaigns?.length) return null;
    const sorted = campaigns
      .filter((c) => c[type])
      .sort((a, b) => new Date(a[type]) - new Date(b[type]));
    return sorted[0]?.[type] || null;
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("accessToken");

    try {
      const startDateParam = dateRange[0].startDate
        ? format(dateRange[0].startDate, "yyyy-MM-dd")
        : "";
      const endDateParam = dateRange[0].endDate
        ? format(dateRange[0].endDate, "yyyy-MM-dd")
        : "";

      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: limit,
        search: search,
      });

      if (startDateParam) {
        queryParams.append("startDate", startDateParam);
      }
      if (endDateParam) {
        queryParams.append("endDate", endDateParam);
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/bookings/filter-by-date?${queryParams.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 403) {
        localStorage.clear();
        navigate("/login");
        return;
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
  }, [currentPage, limit, search, dateRange, navigate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleApplyDateFilters = () => {
    setCurrentPage(1);
    setShowDateModal(false);
  };

  const handleClearAllFilters = () => {
    setSearch("");
    setDateRange([{ startDate: null, endDate: null, key: "selection" }]);
    setCurrentPage(1);
  };

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
      if (!aDate) return 1;
      if (!bDate) return -1;
      return direction === "asc"
        ? new Date(aDate) - new Date(bDate)
        : new Date(bDate) - new Date(aDate);
    }

    if (key === "createdAt") {
        const aDate = a[key] ? new Date(a[key]) : null;
        const bDate = b[key] ? new Date(b[key]) : null;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return direction === 'asc' ? aDate - bDate : bDate - aDate;
    }

    const aVal = a[key]?.toString().toLowerCase() || "";
    const bVal = b[key]?.toString().toLowerCase() || "";
    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-[var(--color-background)] h-screen w-screen text-[var(--color-text)] flex flex-col lg:flex-row overflow-hidden">
      <Navbar />
      <main
        className={`flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 transition-all duration-300 ${
          isCollapsed ? "lg:ml-24" : "lg:ml-64"
        }`}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-2xl">Bookings ({totalCount})</h2>
          <button
            onClick={() => navigate("/create-booking")}
            className="bg-[var(--color-primary)] text-white text-xs px-3 py-2 rounded hover:opacity-90 transition"
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
              setCurrentPage(1);
            }}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDateModal(true)}
              className="border border-[var(--color-border)] px-4 py-1 rounded bg-[var(--color-surface)] text-xs hover:bg-[var(--color-hover)] text-[var(--color-text)] transition"
            >
              Date Filter
            </button>
            {(dateRange[0].startDate || dateRange[0].endDate) && (
              <span className="text-xs text-[var(--color-muted)]">
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
              className="px-3 py-1 rounded bg-[var(--color-danger)] text-white text-xs hover:opacity-90 transition"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="overflow-x-auto relative shadow-md sm:rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
          <table className="w-full text-xs text-left text-[var(--color-muted)]">
            <thead className="text-xs text-[var(--color-text)] uppercase bg-[var(--color-muted-light)]">
              <tr>
                <th scope="col" className="px-6 py-3">
                  #
                </th>
                <SortableHeader title="Booking ID" sortKey="_id" sortConfig={sortConfig} setSortConfig={setSortConfig}/>
                <SortableHeader title="Company Name" sortKey="companyName" sortConfig={sortConfig} setSortConfig={setSortConfig}/>
                <SortableHeader title="Client Name" sortKey="clientName" sortConfig={sortConfig} setSortConfig={setSortConfig}/>
                <SortableHeader title="Booking Date" sortKey="createdAt" sortConfig={sortConfig} setSortConfig={setSortConfig}/>
                <SortableHeader title="Upcoming Start Date" sortKey="upcomingStartDate" sortConfig={sortConfig} setSortConfig={setSortConfig}/>
                <SortableHeader title="Upcoming End Date" sortKey="upcomingEndDate" sortConfig={sortConfig} setSortConfig={setSortConfig}/>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mx-auto"></div>
                    <p className="mt-2 text-[var(--color-muted)]">Loading bookings...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-[var(--color-danger)]">
                    Error: {error}
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-[var(--color-muted)]">
                    No bookings found matching your criteria.
                  </td>
                </tr>
              ) : (
                sortedData.map((item, index) => {
                  const upcomingStart = getUpcomingCampaignDate(item.campaigns, "startDate");
                  const upcomingEnd = getUpcomingCampaignDate(item.campaigns, "endDate");
                  return (
                    <tr key={item._id} className="bg-[var(--color-surface)] border-b border-[var(--color-border)] hover:bg-[var(--color-hover)] cursor-pointer transition" onClick={() => navigate(`/booking/${item._id}`)}>
                      <td className="px-6 py-4 text-[var(--color-muted)]">{(currentPage - 1) * limit + index + 1}</td>
                      <td className="px-6 py-4 font-mono text-[var(--color-muted)]">{item._id?.substring(0, 6).toUpperCase() || "N/A"}</td>
                      <td className="px-6 py-4 font-medium text-[var(--color-text)] whitespace-nowrap">{item.companyName || "No Company"}</td>
                      <td className="px-6 py-4 text-[var(--color-text)]">{item.clientName || "No Client"}</td>
                      <td className="px-6 py-4 text-[var(--color-text)]">{formatDate(item.createdAt)}</td>
                      <td className="px-6 py-4 text-[var(--color-text)]">{formatDate(upcomingStart)}</td>
                      <td className="px-6 py-4 text-[var(--color-text)]">{formatDate(upcomingEnd)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalCount={totalCount}
          itemsPerPage={limit}
          loading={loading}
        />

        {showDateModal && (
          <div className="fixed inset-0 text-xs flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-[var(--color-surface)] rounded-xl shadow-lg p-2 py-[1%] border border-[var(--color-border)]">
              <DateRange editableDateInputs={true} onChange={(item) => setDateRange([item.selection])} moveRangeOnFirstSelection={false} ranges={dateRange} className="text-xs"/>
              <div className="flex justify-end gap-2 mt-4 mx-2">
                <button 
                  onClick={() => setShowDateModal(false)} 
                  className="text-xs px-3 py-1 rounded bg-[var(--color-muted-light)] mr-auto hover:bg-[var(--color-hover)] text-[var(--color-text)] transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleApplyDateFilters} 
                  className="text-xs px-3 py-1 rounded bg-[var(--color-primary)] text-white hover:opacity-90 transition"
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