import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { BarChart } from "@mui/x-charts/BarChart";

// --- UI Components (Unchanged) ---
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

// --- Filter Options (Unchanged) ---
const industryOptions = [
  "Tourism",
  "Retail",
  "Real Estate",
  "Other",
  "Movie",
  "Media and Entertainment",
  "FMCG",
  "Finance",
  "Financial Services",
  "Healthcare",
  "Hospitality",
  "IT Industry",
  "Automobile",
  "Clothing & Apparel",
  "Ecommerce",
  "Edtech",
  "Entertainment",
];
const inventoryTypeOptions = ["Billboard", "DOOH", "Gantry", "Pole Kiosk"];

export default function BookingReport({ handleShowDateModal = () => {} }) {
  const navigate = useNavigate();

  // --- SECTION 1: BOOKING REPORT STATE & LOGIC (Unchanged) ---
  const [bookings, setBookings] = useState([]);
  const [bookingFilters, setBookingFilters] = useState({
    client: "",
    paymentStatus: "",
    poStatus: "",
    startDate: "",
    endDate: "",
  });
  const [bookingCurrentPage, setBookingCurrentPage] = useState(1);
  const [bookingTotalPages, setBookingTotalPages] = useState(1);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/login");
        return;
      }
      const params = new URLSearchParams({
        page: bookingCurrentPage,
        limit: ITEMS_PER_PAGE,
      });
      if (bookingFilters.client) params.append("search", bookingFilters.client);
      if (bookingFilters.paymentStatus)
        params.append("paymentStatus", bookingFilters.paymentStatus);
      if (bookingFilters.poStatus) {
        const poVal = bookingFilters.poStatus.toLowerCase();
        if (poVal === "pending") params.append("poStatus", "false");
        if (poVal === "completed") params.append("poStatus", "true");
      }
      if (bookingFilters.startDate)
        params.append("startDate", bookingFilters.startDate);
      if (bookingFilters.endDate)
        params.append("endDate", bookingFilters.endDate);
      const res = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/bookings?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.status === 403) {
        localStorage.clear();
        navigate("/login");
        return;
      }
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setBookings(data.bookings || []);
      setBookingTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    }
  };

  const downloadBookingExcel = () => {
    const rows = bookings.map((b) => {
      let totalPaid = 0,
        totalAmount = 0;
      b.campaigns?.forEach((c) => {
        const p = c.pipeline?.payment;
        if (p) {
          totalPaid += p.totalPaid || 0;
          totalAmount += p.totalAmount || 0;
        }
      });
      return {
        Company: b.companyName,
        Client: b.clientName,
        CreatedAt: dayjs(b.createdAt).format("DD MMM YYYY"),
        PaymentStatus:
          totalPaid < totalAmount && totalAmount > 0 ? "Pending" : "Completed",
        POStatus: b.campaigns?.some((c) => !c.pipeline?.po?.confirmed)
          ? "Pending"
          : "Completed",
      };
    });
    const sheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Bookings");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buf], { type: "application/octet-stream" }),
      `bookings_page_${bookingCurrentPage}.xlsx`
    );
  };

  useEffect(() => {
    if (bookingCurrentPage !== 1) setBookingCurrentPage(1);
    else fetchBookings();
  }, [bookingFilters]);

  useEffect(() => {
    fetchBookings();
  }, [bookingCurrentPage]);
  // --- END OF SECTION 1 ---

  // --- SECTION 2: PROPOSAL REPORT TABLE STATE & LOGIC (MODIFIED) ---
  const [proposals, setProposals] = useState([]);
  // MODIFICATION: Renamed to be specific to the table
  const [proposalTableFilters, setProposalTableFilters] = useState({
    startDate: "",
    endDate: "",
    person: "",
    industry: "",
    inventoryType: "",
    agency: "",
  });
  const [proposalCurrentPage, setProposalCurrentPage] = useState(1);
  const [proposalTotalPages, setProposalTotalPages] = useState(1);

  const fetchProposals = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/login");
        return;
      }
      const params = new URLSearchParams({
        page: proposalCurrentPage,
        limit: ITEMS_PER_PAGE,
      });
      // MODIFICATION: Use proposalTableFilters
      Object.entries(proposalTableFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const res = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/proposals/proposalreport?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setProposals(data.proposals || []);
      setProposalTotalPages(data.pagination.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch proposals:", err);
    }
  };

  // MODIFICATION: Renamed to be specific to the table
  const handleProposalTableFilterChange = (e) => {
    const { name, value } = e.target;
    setProposalTableFilters((prev) => ({ ...prev, [name]: value }));
  };

  const downloadProposalExcel = () => {
    const rows = proposals.map((p) => ({
      COMPANY: p.companyName,
      CLIENT: p.clientName,
      INDUSTRY: p.industry,
      "CLIENT TYPE": p.clientType,
      DATE: dayjs(p.createdAt).format("DD MMM YYYY"),
      INVENTORIES: p.spaceDetails?.map((s) => s.spaceName).join(", ") || "N/A",
      "TYPE OF INVENTORIES":
        p.spaceDetails?.map((s) => s.spaceType).join(", ") || "N/A",
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Proposals");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buf], { type: "application/octet-stream" }),
      `proposals_report_${dayjs().format("YYYYMMDD")}.xlsx`
    );
  };

  useEffect(() => {
    if (proposalCurrentPage !== 1) setProposalCurrentPage(1);
    else fetchProposals();
    // MODIFICATION: Use proposalTableFilters
  }, [proposalTableFilters]);

  useEffect(() => {
    fetchProposals();
  }, [proposalCurrentPage]);
  // --- END OF SECTION 2 ---

  // --- SECTION 3: PROPOSAL GRAPH STATE & LOGIC (MODIFIED) ---
  const [graphDimension, setGraphDimension] = useState("timeline");
  const [proposalChartData, setProposalChartData] = useState({
    xLabels: [],
    yData: [],
  });
  // MODIFICATION: Added separate state for graph filters
  const [proposalGraphFilters, setProposalGraphFilters] = useState({
    startDate: "",
    endDate: "",
    person: "",
    industry: "",
    inventoryType: "",
    agency: "",
  });

  // MODIFICATION: Added handler for graph filters
  const handleProposalGraphFilterChange = (e) => {
    const { name, value } = e.target;
    setProposalGraphFilters((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const fetchAndProcessGraphData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/login");
          return;
        }

        const params = new URLSearchParams({ limit: "2000" });
        // MODIFICATION: Use proposalGraphFilters
        Object.entries(proposalGraphFilters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });

        const res = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/proposals/proposalreport?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

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

          const sortedKeys = Array.from(dataMap.keys()).sort(
            (a, b) => dayjs(a, "MMM YYYY").unix() - dayjs(b, "MMM YYYY").unix()
          );

          // MODIFICATION: Use proposalGraphFilters for dates
          const start = proposalGraphFilters.startDate
            ? dayjs(proposalGraphFilters.startDate)
            : sortedKeys.length > 0
            ? dayjs(sortedKeys[0], "MMM YYYY")
            : dayjs().subtract(5, "month");
          const end = proposalGraphFilters.endDate
            ? dayjs(proposalGraphFilters.endDate)
            : dayjs();

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
            } else {
              key = proposal[graphDimension] || "N/A";
            }
            dataMap.set(key, (dataMap.get(key) || 0) + 1);
          });

          const sortedEntries = Array.from(dataMap.entries()).sort(
            (a, b) => b[1] - a[1]
          );
          xLabels = sortedEntries.map((entry) => entry[0]);
          yData = sortedEntries.map((entry) => entry[1]);
        }

        setProposalChartData({ xLabels, yData });
      } catch (err) {
        console.error("Failed to fetch and process proposal graph data:", err);
        setProposalChartData({ xLabels: [], yData: [] });
      }
    };

    fetchAndProcessGraphData();
    // MODIFICATION: Use proposalGraphFilters in dependency array
  }, [proposalGraphFilters, graphDimension, navigate]);
  // --- END OF SECTION 3 ---

  return (
    <div className="space-y-10">
      {/* CARD 1: BOOKING REPORT TABLE (Unchanged) */}
      <Card>
        <CardContent>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Booking Report
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder="Client Name"
              value={bookingFilters.client}
              onChange={(e) =>
                setBookingFilters({ ...bookingFilters, client: e.target.value })
              }
            />
            <Select
              value={bookingFilters.paymentStatus}
              onChange={(e) =>
                setBookingFilters({
                  ...bookingFilters,
                  paymentStatus: e.target.value,
                })
              }
            >
              <option value="">All Payment Status</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid"> Unpaid</option>
              <option value="Partial">Partial</option>
              <option value="Not Applicable">N/A</option>
            </Select>
            <Select
              value={bookingFilters.poStatus}
              onChange={(e) =>
                setBookingFilters({
                  ...bookingFilters,
                  poStatus: e.target.value,
                })
              }
            >
              <option value="">All PO Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </Select>
            <button
              onClick={() =>
                handleShowDateModal(
                  "bookings",
                  bookingFilters,
                  setBookingFilters
                )
              }
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50"
            >
              {bookingFilters.startDate && bookingFilters.endDate
                ? `${bookingFilters.startDate} to ${bookingFilters.endDate}`
                : "Filter by Booking Date"}
            </button>
          </div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-semibold text-gray-700">
              Bookings Table
            </h3>
            <Button
              onClick={downloadBookingExcel}
              disabled={bookings.length === 0}
            >
              Download Excel (Current Page)
            </Button>
          </div>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-xs text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Payment Status
                  </th>
                  <th scope="col" className="px-6 py-3">
                    PO Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookings.length > 0 ? (
                  bookings.map((b) => {
                    console.log("Booking is",b);
                    let totalPaid = 0,
                      totalDue = 0;
                    b.campaigns?.forEach((c) => {
                      const p = c.paymentSummary;
                      if (p) {
                        totalPaid += p.totalPaid || 0;
                        totalDue += p.Due || 0;
                        console.log("total paid",totalPaid);
                        console.log("total due",totalDue);
                      }
                    });
                    const paymentStatus =
                      totalPaid < totalDue && totalDue > 0
                        ? "Pending"
                        : "Completed";
                    const poStatus = b.campaigns?.some(
                      (c) => !c.pipeline?.po?.confirmed
                    )
                      ? "Pending"
                      : "Completed";
                    return (
                      <tr
                        key={b._id}
                        className="bg-white border-b hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {b.companyName}
                        </td>
                        <td className="px-6 py-4">{b.clientName}</td>
                        <td className="px-6 py-4">
                          {dayjs(b.createdAt).format("DD MMM YYYY")}
                        </td>
                        <td className="px-6 py-4">{paymentStatus}</td>
                        <td className="px-6 py-4">{poStatus}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-gray-500">
                      No bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            currentPage={bookingCurrentPage}
            totalPages={bookingTotalPages}
            onPageChange={setBookingCurrentPage}
          />
        </CardContent>
      </Card>

      {/* CARD 2: PROPOSAL REPORT TABLE (MODIFIED) */}
      <Card>
        <CardContent>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Proposal Report
          </h3>
          {/* MODIFICATION: Using proposalTableFilters and its handler */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <Input
              name="person"
              placeholder="By Client Name , By Company Name"
              value={proposalTableFilters.person}
              onChange={handleProposalTableFilterChange}
            />
            <Select
              name="industry"
              value={proposalTableFilters.industry}
              onChange={handleProposalTableFilterChange}
            >
              <option value="">By Industry</option>
              {industryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
            <Select
              name="inventoryType"
              value={proposalTableFilters.inventoryType}
              onChange={handleProposalTableFilterChange}
            >
              <option value="">By Inventory Type</option>
              {inventoryTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
            <Select
              name="agency"
              value={proposalTableFilters.agency}
              onChange={handleProposalTableFilterChange}
            >
              <option value="">By Agency Status</option>
              <option value="true">Is Agency</option>
            </Select>
            {/* MODIFICATION: The date modal now updates the table's filter state */}
            <button
              onClick={() =>
                handleShowDateModal(
                  "proposals",
                  proposalTableFilters,
                  setProposalTableFilters
                )
              }
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50"
            >
              {proposalTableFilters.startDate && proposalTableFilters.endDate
                ? `${proposalTableFilters.startDate} to ${proposalTableFilters.endDate}`
                : "Filter by Proposal Date"}
            </button>
          </div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-semibold text-gray-700">
              Proposals Table
            </h3>
            <Button
              onClick={downloadProposalExcel}
              disabled={proposals.length === 0}
            >
              Download Excel
            </Button>
          </div>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-xs text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Industry
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Client Type
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Inventories
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Type of Inventories
                  </th>
                </tr>
              </thead>
              <tbody>
                {proposals.length > 0 ? (
                  proposals.map((p) => (
                    <tr
                      key={p._id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        {p.companyName}
                      </td>
                      <td className="px-6 py-4">{p.clientName}</td>
                      <td className="px-6 py-4">{p.industry || "N/A"}</td>
                      <td className="px-6 py-4">{p.clientType}</td>
                      <td className="px-6 py-4">
                        {dayjs(p.createdAt).format("DD MMM YYYY")}
                      </td>
                      <td className="px-6 py-4">
                        {p.spaceDetails?.map((s) => s.spaceName).join(", ") ||
                          "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        {p.spaceDetails?.map((s) => s.spaceType).join(", ") ||
                          "N/A"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-500">
                      No proposals found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            currentPage={proposalCurrentPage}
            totalPages={proposalTotalPages}
            onPageChange={setProposalCurrentPage}
          />
        </CardContent>
      </Card>

      {/* CARD 3: PROPOSAL GRAPH (MODIFIED) */}
      <Card>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Proposal Graph
            </h3>
          </div>
          {/* MODIFICATION: Added a new, independent set of filters for the graph */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 p-4">
            <Input
              name="person"
              placeholder="By Client Name , By Company Name"
              value={proposalGraphFilters.person}
              onChange={handleProposalGraphFilterChange}
            />
            <Select
              name="industry"
              value={proposalGraphFilters.industry}
              onChange={handleProposalGraphFilterChange}
            >
              <option value="">By Industry</option>
              {industryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
            <Select
              name="inventoryType"
              value={proposalGraphFilters.inventoryType}
              onChange={handleProposalGraphFilterChange}
            >
              <option value="">By Inventory Type</option>
              {inventoryTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
            <Select
              name="agency"
              value={proposalGraphFilters.agency}
              onChange={handleProposalGraphFilterChange}
            >
              <option value="">By Agency Status</option>
              <option value="true">Is Agency</option>
            </Select>
            <button
              onClick={() =>
                handleShowDateModal(
                  "graph",
                  proposalGraphFilters,
                  setProposalGraphFilters
                )
              }
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50 bg-white"
            >
              {proposalGraphFilters.startDate && proposalGraphFilters.endDate
                ? `${proposalGraphFilters.startDate} to ${proposalGraphFilters.endDate}`
                : "Filter by Proposal Date"}
            </button>
          </div>
          <div className="flex flex-grow h-96 -ml-4 -mr-2">
            <BarChart
              xAxis={[
                {
                  data: proposalChartData.xLabels,
                  scaleType: "band",
                  tickLabelStyle: {
                    angle: -45,
                    textAnchor: "end",
                    fontSize: 10,
                  },
                },
              ]}
              yAxis={[{ label: "Number of Proposals" }]}
              series={[
                {
                  data: proposalChartData.yData,
                  label: "Proposals",
                  color: "#34d399",
                },
              ]}
              grid={{ vertical: false, horizontal: true }}
              margin={{ top: 40, right: 20, bottom: 70, left: 60 }}
              legend={{
                direction: "row",
                position: { vertical: "top", horizontal: "middle" },
                padding: 0,
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
