import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { BarChart } from "@mui/x-charts/BarChart";

// --- UI HELPER COMPONENTS (Unchanged) ---
const Input = ({ ...props }) => (
  <input
    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    {...props}
  />
);
const Select = ({ children, ...props }) => (
  <select
    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
    {...props}
  >
    {children}
  </select>
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

const industryOptions = ["Tourism", "Retail", "Real Estate", "Other", "Movie", "Media and Entertainment", "FMCG", "Finance", "Financial Services", "Healthcare", "Hospitality", "IT Industry", "Automobile", "Clothing & Apparel", "Ecommerce", "Edtech", "Entertainment"];
const inventoryTypeOptions = ["Billboard", "DOOH", "Gantry", "Pole Kiosk", "BQS","DigitalBQS","Miscellaneous"];
const clientTypeOptions = ["Corporate", "Agency", "Direct", "Government"];

export default function BookingReport({ handleShowDateModal = () => {} }) {
  const navigate = useNavigate();

  // --- SECTION 1: BOOKING REPORT STATE & LOGIC (Unchanged) ---
  const [bookings, setBookings] = useState([]);
  const [bookingFilters, setBookingFilters] = useState({ client: "", paymentStatus: "", poStatus: "", startDate: "", endDate: "" });
  const [bookingCurrentPage, setBookingCurrentPage] = useState(1);
  const [bookingTotalPages, setBookingTotalPages] = useState(1);
  const [bookingTotalCount, setBookingTotalCount] = useState(0);
  const [bookingSortConfig, setBookingSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  const resetBookingFilters = () => {
    setBookingFilters({ client: "", paymentStatus: "", poStatus: "", startDate: "", endDate: "" });
    setBookingCurrentPage(1);
  };

  const handleBookingSort = (key, direction) => {
    setBookingSortConfig({ key, direction });
    setBookingCurrentPage(1);
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) { navigate("/login"); return; }

      const params = new URLSearchParams({
        page: bookingCurrentPage,
        limit: ITEMS_PER_PAGE,
        sortKey: bookingSortConfig.key,
        sortDirection: bookingSortConfig.direction,
      });
      if (bookingFilters.client) params.append("search", bookingFilters.client);
      if (bookingFilters.paymentStatus) params.append("paymentStatus", bookingFilters.paymentStatus);
      if (bookingFilters.poStatus) {
        params.append("poStatus", bookingFilters.poStatus);
      }
      if (bookingFilters.startDate) params.append("startDate", bookingFilters.startDate);
      if (bookingFilters.endDate) params.append("endDate", bookingFilters.endDate);

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings?${params.toString()}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) { localStorage.clear(); navigate("/login"); return; }
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      setBookings(data.bookings || []);
      setBookingTotalPages(data.pagination?.totalPages || 1);
      setBookingTotalCount(data.pagination?.totalCount || 0);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    }
  };

  const downloadBookingExcel = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        alert("Authentication failed. Please log in again.");
        return;
    }

    try {
        let allBookings = [];
        let currentPage = 1;
        let totalPages = 1;

        // Loop to fetch all pages of data
        do {
            const params = new URLSearchParams({
                page: currentPage,
                limit: API_MAX_LIMIT, // Fetch in larger chunks
                sortKey: bookingSortConfig.key,
                sortDirection: bookingSortConfig.direction,
            });
            // Apply the same filters as the table
            if (bookingFilters.client) params.append("search", bookingFilters.client);
            if (bookingFilters.paymentStatus) params.append("paymentStatus", bookingFilters.paymentStatus);
            if (bookingFilters.poStatus) {
              params.append("poStatus", bookingFilters.poStatus);
            }
            if (bookingFilters.startDate) params.append("startDate", bookingFilters.startDate);
            if (bookingFilters.endDate) params.append("endDate", bookingFilters.endDate);

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings?${params.toString()}`, {
                headers: { "Authorization": `Bearer ${token}` },
            });
            
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            
            const data = await res.json();
            allBookings = allBookings.concat(data.bookings || []);
            totalPages = data.pagination?.totalPages || 1;
            currentPage++;
        } while (currentPage <= totalPages);

        if (allBookings.length === 0) {
            alert("No booking data to download.");
            return;
        }

        // Format data for Excel sheet
        const excelData = allBookings.map(b => {
            let totalPaid = 0, totalDue = 0;
            b.campaigns?.forEach(c => {
                totalPaid += c.paymentSummary?.totalPaid || 0;
                totalDue += c.paymentSummary?.totalDue || 0;
            });
            let paymentStatus = "Completed";
            if (totalDue > 0 && totalPaid < totalDue) {
              paymentStatus = totalPaid > 0 ? "Partial" : "Pending";
            }
            const poStatuses = b.campaigns?.map(c => c.poConfirmed === true) || [];
            let poStatusText = "Pending"; // Default to Pending
            if (poStatuses.length > 0) {
                if (poStatuses.every(status => status === true)) {
                    poStatusText = "Completed";
                } else if (poStatuses.some(status => status === true)) {
                    poStatusText = "Partial";
                }
            }
            return {
                'Company Name': b.companyName,
                'Client Name': b.clientName,
                'Booking Date': dayjs(b.createdAt).format("DD/MM/YYYY"),
                'Payment Status': paymentStatus,
                'PO Status': poStatusText,
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings Report");
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([excelBuffer]), `bookings_report_${dayjs().format("YYYY-MM-DD")}.xlsx`);

    } catch (error) {
        console.error("Error downloading bookings report:", error);
        alert("Failed to download the report. Please try again.");
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [bookingFilters, bookingCurrentPage, bookingSortConfig]);
  // --- END OF SECTION 1 ---

  // --- SECTION 2: PROPOSAL REPORT TABLE STATE & LOGIC (Unchanged) ---
  const [proposals, setProposals] = useState([]);
  const [proposalTableFilters, setProposalTableFilters] = useState({ startDate: "", endDate: "", person: "", industry: "", inventoryType: "", clientType: "", bookingSource: "" });
  const [proposalCurrentPage, setProposalCurrentPage] = useState(1);
  const [proposalTotalPages, setProposalTotalPages] = useState(1);
  const [proposalTotalCount, setProposalTotalCount] = useState(0);
  const [proposalSortConfig, setProposalSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  const resetProposalTableFilters = () => {
    setProposalTableFilters({ startDate: "", endDate: "", person: "", industry: "", inventoryType: "", clientType: "", bookingSource: "" });
    setProposalCurrentPage(1);
  };

  const handleProposalSort = (key, direction) => {
    setProposalSortConfig({ key, direction });
    setProposalCurrentPage(1);
  };

  const fetchProposals = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) { navigate("/login"); return; }

      const params = new URLSearchParams({
        page: proposalCurrentPage,
        limit: ITEMS_PER_PAGE,
        sortKey: proposalSortConfig.key,
        sortDirection: proposalSortConfig.direction,
      });
      Object.entries(proposalTableFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/proposals/proposalreport?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setProposals(data.proposals || []);
      setProposalTotalPages(data.pagination?.totalPages || 1);
      setProposalTotalCount(data.pagination?.totalCount || 0);
    } catch (err) {
      console.error("Failed to fetch proposals:", err);
    }
  };

  const handleProposalTableFilterChange = (e) => {
    const { name, value } = e.target;
    setProposalTableFilters((prev) => ({ ...prev, [name]: value }));
    setProposalCurrentPage(1);
  };
  
  const downloadProposalExcel = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        alert("Authentication failed. Please log in again.");
        return;
    }

    try {
        let allProposals = [];
        let currentPage = 1;
        let totalPages = 1;

        do {
            const params = new URLSearchParams({
                page: currentPage,
                limit: API_MAX_LIMIT,
                sortKey: proposalSortConfig.key,
                sortDirection: proposalSortConfig.direction,
            });
            Object.entries(proposalTableFilters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/proposals/proposalreport?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            allProposals = allProposals.concat(data.proposals || []);
            totalPages = data.pagination?.totalPages || 1;
            currentPage++;
        } while (currentPage <= totalPages);

        if (allProposals.length === 0) {
            alert("No proposal data to download.");
            return;
        }

        const excelData = allProposals.map(p => ({
            'Company Name': p.companyName,
            'Client Name': p.clientName,
            'Industry': p.industry || "N/A",
            'Client Type': p.clientType || "N/A",
            'Booking Source': p.bookingSource || "N/A",
            'Proposal Date': dayjs(p.createdAt).format("DD/MM/YYYY"),
            'Inventories': p.spaceDetails?.map(s => s.spaceName).join(", ") || "N/A",
            'Inventory Types': p.spaceDetails?.map(s => s.spaceType).join(", ") || "N/A",
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Proposals Report");
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([excelBuffer]), `proposals_report_${dayjs().format("YYYY-MM-DD")}.xlsx`);
    } catch (error) {
        console.error("Error downloading proposals report:", error);
        alert("Failed to download the report. Please try again.");
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [proposalTableFilters, proposalCurrentPage, proposalSortConfig]);
  // --- END OF SECTION 2 ---

  // --- SECTION 3: PROPOSAL GRAPH STATE & LOGIC ---
  const [graphDimension, setGraphDimension] = useState("timeline");
  const [proposalChartData, setProposalChartData] = useState({ xLabels: [], yData: [] });
  // --- CHANGE 1: ADD STATE FOR THE GRAPH TOTAL ---
  const [totalProposalsForGraph, setTotalProposalsForGraph] = useState(0);
  const [proposalGraphFilters, setProposalGraphFilters] = useState({
    startDate: "", endDate: "", person: "", industry: "", inventoryType: "", clientType: "", bookingSource: "",
  });

  const resetProposalGraphFilters = () => {
    setProposalGraphFilters({
        startDate: "", endDate: "", person: "", industry: "", inventoryType: "", clientType: "", bookingSource: ""
    });
  };

  const handleProposalGraphFilterChange = (e) => {
    const { name, value } = e.target;
    setProposalGraphFilters((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const fetchAndProcessGraphData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) { navigate("/login"); return; }

        const params = new URLSearchParams({ limit: "2000" }); // Fetch all data for graph
        Object.entries(proposalGraphFilters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/proposals/proposalreport?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        const proposalsForGraph = data.proposals || [];

        let xLabels = [];
        let yData = [];
        const dataMap = new Map();

        if (graphDimension === "timeline") {
          proposalsForGraph.forEach(({ createdAt }) => {
            const key = dayjs(createdAt).format("MMM YYYY");
            dataMap.set(key, (dataMap.get(key) || 0) + 1);
          });
          const sortedKeys = Array.from(dataMap.keys()).sort((a, b) => dayjs(a, "MMM YYYY").unix() - dayjs(b, "MMM YYYY").unix());
          const start = proposalGraphFilters.startDate ? dayjs(proposalGraphFilters.startDate) : sortedKeys.length > 0 ? dayjs(sortedKeys[0], "MMM YYYY") : dayjs().subtract(5, "month");
          const end = proposalGraphFilters.endDate ? dayjs(proposalGraphFilters.endDate) : dayjs();
          let current = start.startOf("month");
          while (current.isBefore(end) || current.isSame(end, "month")) {
            xLabels.push(current.format("MMM YYYY"));
            current = current.add(1, "month");
          }
          yData = xLabels.map((key) => dataMap.get(key) || 0);
        } else {
          proposalsForGraph.forEach((proposal) => {
            let key = "N/A";
            if (graphDimension === "inventoryType") {
              proposal.spaceDetails?.forEach((detail) => {
                key = detail.spaceType || "N/A";
                dataMap.set(key, (dataMap.get(key) || 0) + 1);
              });
              return;
            } else if (graphDimension === 'clientType') {
              key = proposal.clientType || "N/A";
            } else {
              key = proposal[graphDimension] || "N/A";
            }
            dataMap.set(key, (dataMap.get(key) || 0) + 1);
          });
          const sortedEntries = Array.from(dataMap.entries()).sort((a, b) => b[1] - a[1]);
          xLabels = sortedEntries.map((entry) => entry[0]);
          yData = sortedEntries.map((entry) => entry[1]);
        }

        // --- CHANGE 2: CALCULATE AND SET THE TOTAL ---
        const total = yData.reduce((sum, val) => sum + val, 0);
        setTotalProposalsForGraph(total);
        setProposalChartData({ xLabels, yData });

      } catch (err) {
        console.error("Failed to fetch and process proposal graph data:", err);
        setProposalChartData({ xLabels: [], yData: [] });
      }
    };
    fetchAndProcessGraphData();
  }, [proposalGraphFilters, graphDimension, navigate]);
  // --- END OF SECTION 3 ---

  return (
    <div className="space-y-10">
      {/* CARD 1: BOOKING REPORT TABLE (Unchanged) */}
      <Card>
        <CardContent>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Booking Report ({bookingTotalCount})</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 items-center">
            <Input placeholder="Client Name" value={bookingFilters.client} onChange={(e) => {setBookingFilters({ ...bookingFilters, client: e.target.value }); setBookingCurrentPage(1);}} />
            <Select value={bookingFilters.paymentStatus} onChange={(e) => {setBookingFilters({ ...bookingFilters, paymentStatus: e.target.value }); setBookingCurrentPage(1);}}>
              <option value="">All Payment Status</option>
              <option value="Paid">Completed</option>
              <option value="Unpaid">Pending</option>
              <option value="Partial">Partial</option>
            </Select>
            <Select value={bookingFilters.poStatus} onChange={(e) => {setBookingFilters({ ...bookingFilters, poStatus: e.target.value }); setBookingCurrentPage(1);}}>
              <option value="">All PO Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
            </Select>
            <button onClick={() => handleShowDateModal("bookings", bookingFilters, setBookingFilters)} className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50">
              {bookingFilters.startDate && bookingFilters.endDate ? `${bookingFilters.startDate} to ${bookingFilters.endDate}` : "Filter by Booking Date"}
            </button>
            <Button onClick={resetBookingFilters}>Reset Filters</Button>
          </div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-semibold text-gray-700">Bookings Table</h3>
            <Button onClick={downloadBookingExcel} disabled={bookings.length === 0}>Download Full Report</Button>
          </div>
          <div className="overflow-x-auto relative shadow-md sm:rounded-lg bg-white">
            <table className="w-full text-xs text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <SortableHeader title="Company" sortKey="companyName" sortConfig={bookingSortConfig} onSort={handleBookingSort} />
                  <SortableHeader title="Client" sortKey="clientName" sortConfig={bookingSortConfig} onSort={handleBookingSort} />
                  <SortableHeader title="Created At" sortKey="createdAt" sortConfig={bookingSortConfig} onSort={handleBookingSort} />
                  <SortableHeader title="Payment Status" disabled={true} />
                  <SortableHeader title="PO Status" disabled={true} />
                </tr>
              </thead>
              <tbody>
                {bookings.length > 0 ? (
                  bookings.map((b) => {
                    let totalPaid = 0, totalDue = 0;
                    b.campaigns?.forEach((c) => {
                      const p = c.paymentSummary;
                      if (p) {
                        totalPaid += p.totalPaid || 0;
                        totalDue += p.totalDue || 0;
                      }
                    });
                    let paymentStatus = "Completed"; // Default status
                    if (totalDue > 0 && totalPaid < totalDue) {
                      paymentStatus = totalPaid > 0 ? "Partial" : "Pending";
                    }                    
                    const poStatuses = b.campaigns?.map(c => c.poConfirmed === true) || [];
                    let poStatus = "Pending"; // Default to Pending if no campaigns or no confirmed POs

                    if (poStatuses.length > 0) {
                        if (poStatuses.every(status => status === true)) {
                            poStatus = "Completed";
                        } else if (poStatuses.some(status => status === true)) {
                            poStatus = "Partial";
                        }
                    }                    
                    return (
                      <tr key={b._id} className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/booking-details/${b._id}`)}>
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{b.companyName}</td>
                        <td className="px-6 py-4">{b.clientName}</td>
                        <td className="px-6 py-4">{dayjs(b.createdAt).format("DD MMM YYYY")}</td>
                        <td className="px-6 py-4">{paymentStatus}</td>
                        <td className="px-6 py-4">{poStatus}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="5" className="text-center py-10 text-gray-500">No bookings found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <EnhancedPaginationControls currentPage={bookingCurrentPage} totalPages={bookingTotalPages} onPageChange={setBookingCurrentPage} totalCount={bookingTotalCount} itemsPerPage={ITEMS_PER_PAGE} />
        </CardContent>
      </Card>

      {/* CARD 2: PROPOSAL REPORT TABLE (Unchanged) */}
      <Card>
        <CardContent>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Proposal Report ({proposalTotalCount})</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6 items-center">
            <Input name="person" placeholder="By Client Name , By Company Name" value={proposalTableFilters.person} onChange={handleProposalTableFilterChange} />
            <Select name="industry" value={proposalTableFilters.industry} onChange={handleProposalTableFilterChange}>
              <option value="">By Industry</option>
              {industryOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
            </Select>
            <Select name="inventoryType" value={proposalTableFilters.inventoryType} onChange={handleProposalTableFilterChange}>
              <option value="">By Inventory Type</option>
              {inventoryTypeOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
            </Select>
            <Select name="clientType" value={proposalTableFilters.clientType} onChange={handleProposalTableFilterChange}>
              <option value="">By Client Type</option>
              {clientTypeOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
            </Select>
            <Select name="bookingSource" value={proposalTableFilters.bookingSource} onChange={handleProposalTableFilterChange}>
                <option value="">By Booking Source</option>
                <option value="Direct">Direct</option>
                <option value="Agency">Agency</option>
            </Select>
            <button onClick={() => handleShowDateModal("proposals", proposalTableFilters, setProposalTableFilters)} className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50">
              {proposalTableFilters.startDate && proposalTableFilters.endDate ? `${proposalTableFilters.startDate} to ${proposalTableFilters.endDate}` : "Filter by Proposal Date"}
            </button>
            <Button onClick={resetProposalTableFilters}>Reset Filters</Button>
          </div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-semibold text-gray-700">Proposals Table</h3>
            <Button onClick={downloadProposalExcel} disabled={proposals.length === 0}>Download Full Report</Button>
          </div>
          <div className="overflow-x-auto relative shadow-md sm:rounded-lg bg-white">
            <table className="w-full text-xs text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <SortableHeader title="Company" sortKey="companyName" sortConfig={proposalSortConfig} onSort={handleProposalSort} />
                  <SortableHeader title="Client" sortKey="clientName" sortConfig={proposalSortConfig} onSort={handleProposalSort} />
                  <SortableHeader title="Industry" sortKey="industry" sortConfig={proposalSortConfig} onSort={handleProposalSort} />
                  <SortableHeader title="Client Type" sortKey="clientType" sortConfig={proposalSortConfig} onSort={handleProposalSort} />
                  <SortableHeader title="Booking Source" sortKey="bookingSource" sortConfig={proposalSortConfig} onSort={handleProposalSort} />
                  <SortableHeader title="Date" sortKey="createdAt" sortConfig={proposalSortConfig} onSort={handleProposalSort} />
                  <SortableHeader title="Inventories" disabled={true} />
                  <SortableHeader title="Type of Inventories" disabled={true} />
                </tr>
              </thead>
              <tbody>
                {proposals.length > 0 ? (
                  proposals.map((p) => (
                    <tr key={p._id} className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/proposal-details/${p._id}`)}>
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{p.companyName}</td>
                      <td className="px-6 py-4">{p.clientName}</td>
                      <td className="px-6 py-4">{p.industry || "N/A"}</td>
                      <td className="px-6 py-4">{p.clientType || "N/A"}</td>
                      <td className="px-6 py-4">{p.bookingSource || "N/A"}</td>
                      <td className="px-6 py-4">{dayjs(p.createdAt).format("DD MMM YYYY")}</td>
                      <td className="px-6 py-4">{p.spaceDetails?.map((s) => s.spaceName).join(", ") || "N/A"}</td>
                      <td className="px-6 py-4">{p.spaceDetails?.map((s) => s.spaceType).join(", ") || "N/A"}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="8" className="text-center py-10 text-gray-500">No proposals found for the selected filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <EnhancedPaginationControls currentPage={proposalCurrentPage} totalPages={proposalTotalPages} onPageChange={setProposalCurrentPage} totalCount={proposalTotalCount} itemsPerPage={ITEMS_PER_PAGE} />
        </CardContent>
      </Card>

      {/* CARD 3: PROPOSAL GRAPH */}
      <Card>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Proposal Graph</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6 p-4 items-center">
            <Input name="person" placeholder="By Client Name , By Company Name" value={proposalGraphFilters.person} onChange={handleProposalGraphFilterChange} />
            <Select name="industry" value={proposalGraphFilters.industry} onChange={handleProposalGraphFilterChange}>
              <option value="">By Industry</option>
              {industryOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
            </Select>
            <Select name="inventoryType" value={proposalGraphFilters.inventoryType} onChange={handleProposalGraphFilterChange}>
              <option value="">By Inventory Type</option>
              {inventoryTypeOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
            </Select>
            <Select name="clientType" value={proposalGraphFilters.clientType} onChange={handleProposalGraphFilterChange}>
              <option value="">By Client Type</option>
              {clientTypeOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
            </Select>
            <Select name="bookingSource" value={proposalGraphFilters.bookingSource} onChange={handleProposalGraphFilterChange}>
                <option value="">By Booking Source</option>
                <option value="Direct">Direct</option>
                <option value="Agency">Agency</option>
            </Select>
            <button onClick={() => handleShowDateModal("graph", proposalGraphFilters, setProposalGraphFilters)} className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50 bg-white">
              {proposalGraphFilters.startDate && proposalGraphFilters.endDate ? `${proposalGraphFilters.startDate} to ${proposalGraphFilters.endDate}` : "Filter by Proposal Date"}
            </button>
            <Button onClick={resetProposalGraphFilters}>Reset Filters</Button>
          </div>
          <div className="flex flex-grow h-96 -ml-4 -mr-2">
            {/* --- CHANGE 3: UPDATE BAR CHART TO SHOW PERCENTAGES IN TOOLTIP --- */}
            <BarChart
              xAxis={[{ data: proposalChartData.xLabels, scaleType: "band", tickLabelStyle: { angle: -45, textAnchor: "end", fontSize: 10 } }]}
              yAxis={[{ label: "Number of Proposals" }]}
              series={[
                {
                  data: proposalChartData.yData,
                  label: "Proposals",
                  color: "#34d399",
                  valueFormatter: (value) => `${value} (${totalProposalsForGraph > 0 ? ((value / totalProposalsForGraph) * 100).toFixed(1) : 0}%)`,
                },
              ]}
              grid={{ vertical: false, horizontal: true }}
              margin={{ top: 40, right: 20, bottom: 70, left: 60 }}
              legend={{ direction: "row", position: { vertical: "top", horizontal: "middle" }, padding: 0 }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}