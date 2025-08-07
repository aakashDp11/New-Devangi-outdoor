import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { BarChart } from "@mui/x-charts/BarChart";

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

const ITEMS_PER_PAGE = 10;

// const allInventoriesData = [
//   {
//     id: "INV-001",
//     name: "City Center Billboard",
//     type: "OOH",
//     agency: "Creative Solutions",
//     industry: "Retail",
//     bookings: 25,
//     revenue: 150000,
//     lastBookedDate: "2025-07-20",
//   },
//   {
//     id: "INV-002",
//     name: "Highway Banner",
//     type: "OOH",
//     agency: "Media Masters",
//     industry: "Automotive",
//     bookings: 40,
//     revenue: 250000,
//     lastBookedDate: "2025-07-18",
//   },
//   {
//     id: "INV-003",
//     name: "Airport Digital Screen",
//     type: "Digital",
//     agency: "AdVantage",
//     industry: "Technology",
//     bookings: 60,
//     revenue: 500000,
//     lastBookedDate: "2025-07-22",
//   },
//   {
//     id: "INV-004",
//     name: "Mall Kiosk",
//     type: "Activation",
//     agency: "Creative Solutions",
//     industry: "Retail",
//     bookings: 15,
//     revenue: 75000,
//     lastBookedDate: "2025-06-30",
//   },
//   {
//     id: "INV-005",
//     name: "Social Media Ads",
//     type: "Digital",
//     agency: "Digital Wave",
//     industry: "Technology",
//     bookings: 120,
//     revenue: 350000,
//     lastBookedDate: "2025-07-25",
//   },
//   {
//     id: "INV-006",
//     name: "Exhibition Stall",
//     type: "Activation",
//     agency: "AdVantage",
//     industry: "Technology",
//     bookings: 5,
//     revenue: 125000,
//     lastBookedDate: "2025-07-12",
//   },
//   {
//     id: "INV-007",
//     name: "Radio FM Slot",
//     type: "Radio",
//     agency: "SkyHigh Ads",
//     industry: "FMCG",
//     bookings: 80,
//     revenue: 90000,
//     lastBookedDate: "2025-07-19",
//   },
//   {
//     id: "INV-008",
//     name: "Newspaper Ad",
//     type: "Print",
//     agency: "Media Masters",
//     industry: "Electronics",
//     bookings: 30,
//     revenue: 60000,
//     lastBookedDate: "2025-07-01",
//   },
//   {
//     id: "INV-009",
//     name: "YouTube Pre-roll",
//     type: "Digital",
//     agency: "Digital Wave",
//     industry: "Entertainment",
//     bookings: 200,
//     revenue: 450000,
//     lastBookedDate: "2025-07-24",
//   },
//   {
//     id: "INV-010",
//     name: "Tech Park Digital Screen",
//     type: "Digital",
//     agency: "AdVantage",
//     industry: "Technology",
//     bookings: 55,
//     revenue: 480000,
//     lastBookedDate: "2025-07-15",
//   },
//   {
//     id: "INV-011",
//     name: "Downtown Bus Shelter",
//     type: "OOH",
//     agency: "Creative Solutions",
//     industry: "Healthcare",
//     bookings: 18,
//     revenue: 85000,
//     lastBookedDate: "2025-06-25",
//   },
//   {
//     id: "INV-012",
//     name: "Magazine Full Page",
//     type: "Print",
//     agency: "Media Masters",
//     industry: "Fashion",
//     bookings: 10,
//     revenue: 45000,
//     lastBookedDate: "2025-05-10",
//   },
//   {
//     id: "INV-013",
//     name: "Cinema Ad Spot",
//     type: "Activation",
//     agency: "SkyHigh Ads",
//     industry: "Entertainment",
//     bookings: 22,
//     revenue: 110000,
//     lastBookedDate: "2025-07-05",
//   },
//   {
//     id: "INV-014",
//     name: "Podcast Sponsorship",
//     type: "Digital",
//     agency: "Digital Wave",
//     industry: "Finance",
//     bookings: 50,
//     revenue: 180000,
//     lastBookedDate: "2025-07-21",
//   },
//   {
//     id: "INV-015",
//     name: "Subway Wall Wrap",
//     type: "OOH",
//     agency: "AdVantage",
//     industry: "Travel",
//     bookings: 12,
//     revenue: 220000,
//     lastBookedDate: "2025-06-15",
//   },
// ];

const filterOptions = {
  revenue: "By Revenue",
  bookings: "By Bookings",
};

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

// Helper to check if a filter type requires a value input
const isValueFilter = (type) => !["revenue", "bookings"].includes(type);

export default function InventoryReport({ handleShowDateModal = () => {} }) {
  // const navigate = useNavigate();
  const [inventories, setInventories] = useState([]);
  const defaultFilters = {
    name: "",
    type: "",
    agency: "",
    industry: "",
    page: 1,
    limit: 10,
  };
  const [inventoryFilters, setInventoryFilters] = useState({
    name: "",
    type: "",
    agency: "", // Add this
    industry: "", // Add this
    page: 1, // Assuming you also manage page and limit here or separately
    limit: 10,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totatPages, setTotalPages] = useState(1);

  // For Graphs
  const [performanceType, setPerformanceType] = useState("top");
  const [performanceMetric, setPerformanceMetric] = useState("totalRevenue");
  const [performanceData, setPerformanceData] = useState([]);

  const fetchInventoryReport = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/login");
        return;
      }
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        ...inventoryFilters,
      }).toString();

      const res = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/inventory/inventory-report?${queryParams}`,
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
      console.log("Inventory analytics data:", data);
      setInventories(data.data);
      setTotalPages(data.pagination.totalPages);
      setCurrentPage(data.pagination.currentPage);
    } catch (err) {
      console.error("Failed to fetch inventory analytics:", err);
    }
  };

  useEffect(() => {
    fetchInventoryReport();
  }, [currentPage, inventoryFilters]);

  const fetchInventoryPerformance = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const queryParams = new URLSearchParams({
        type: performanceType,
        metric: performanceMetric,
        limit: 10,
      }).toString();

      const res = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/inventory/inventory-performance?${queryParams}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              label="Filter by Name"
              placeholder="Filter by Name"
              value={inventoryFilters.name}
              onChange={(e) =>
                setInventoryFilters({
                  ...inventoryFilters,
                  name: e.target.value,
                })
              }
            />
            <Select
              label="Space Type"
              name="Space Type"
              value={inventoryFilters.type}
              onChange={(e) =>
                setInventoryFilters({
                  ...inventoryFilters,
                  type: e.target.value,
                })
              }
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
              onChange={(e) =>
                setInventoryFilters({
                  ...inventoryFilters,
                  agency: e.target.value,
                })
              }
            />
            {/* New: Filter by Industry */}
            <CustomSelect
              label="Industry"
              name="industry"
              value={inventoryFilters.industry}
              onChange={(e) => {
                setInventoryFilters({
                  ...inventoryFilters,
                  industry: e.target.value,
                });
              }}
              options={industryOptions}
            />

            <button
              onClick={() => setInventoryFilters(defaultFilters)}
              className="px-4 py-2 text-sm text-white bg-red-500 rounded hover:bg-red-600"
            >
              Reset Filters
            </button>
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
                    <tr
                      key={inv.id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        {inv.name}
                      </td>
                      <td className="px-6 py-4">{inv.type}</td>
                      <td className="px-6 py-4">{inv.agency || "-"}</td>
                      <td className="px-6 py-4">{inv.industry || "-"}</td>
                      <td className="px-6 py-4">
                        {inv.bookings?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        ₹{inv.revenue?.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-10">
                      No inventories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totatPages}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Top/Bottom Performance Card */}
      <Card>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Inventory Performance (
              {performanceType === "top" ? "Top" : "Bottom"} by{" "}
              {performanceMetric === "totalRevenue" ? "Revenue" : "Bookings"})
            </h3>

            <div className="flex gap-3">
              <Select
                label="Metric"
                value={performanceMetric}
                onChange={(e) => setPerformanceMetric(e.target.value)}
              >
                <option value="totalRevenue">Revenue</option>
                <option value="totalBookings">Bookings</option>
              </Select>

              <Select
                label="Type"
                value={performanceType}
                onChange={(e) => setPerformanceType(e.target.value)}
              >
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
              </Select>
            </div>
          </div>

          {/* Chart */}
          <div className="overflow-x-auto">
            <BarChart
              height={400}
              series={[
                {
                  data: performanceData.map((d) =>
                    performanceMetric === "totalRevenue"
                      ? d.totalRevenue
                      : d.totalBookings
                  ),
                  label:
                    performanceMetric === "totalRevenue"
                      ? "Revenue"
                      : "Bookings",
                },
              ]}
              xAxis={[
                {
                  scaleType: "band",
                  data: performanceData.map((d) => d.spaceName),
                },
              ]}
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
      {label && (
        <label htmlFor={name} className="mb-1 text-gray-700 font-medium">
          {label}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
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

// // --- STATE FOR TOP 10 INVENTORIES ---
// const [top10Filters, setTop10Filters] = useState({
//   type: "revenue",
//   value: "",
//   startDate: "",
//   endDate: "",
// });
// const [top10ChartData, setTop10ChartData] = useState({
//   y: [],
//   x: [],
//   metric: "revenue",
// });

// // --- STATE FOR BOTTOM 10 INVENTORIES ---
// const [bottom10Filters, setBottom10Filters] = useState({
//   type: "revenue",
//   value: "",
//   startDate: "",
//   endDate: "",
// });
// const [bottom10ChartData, setBottom10ChartData] = useState({
//   y: [],
//   x: [],
//   metric: "revenue",
// });

// // --- LOGIC FOR TOP & BOTTOM 10 CHARTS ---
// const processChartData = (filters, sortOrder) => {
//   const { type, value, startDate, endDate } = filters;
//   const metric = isValueFilter(type) ? "revenue" : type;

//   const data = allInventoriesData
//     .filter((item) => {
//       const itemDate = dayjs(item.lastBookedDate);
//       if (startDate && itemDate.isBefore(dayjs(startDate))) return false;
//       if (endDate && itemDate.isAfter(dayjs(endDate))) return false;
//       if (
//         isValueFilter(type) &&
//         value &&
//         !item[type]?.toLowerCase().includes(value.toLowerCase())
//       )
//         return false;
//       return true;
//     })
//     .sort((a, b) =>
//       sortOrder === "desc" ? b[metric] - a[metric] : a[metric] - b[metric]
//     )
//     .slice(0, 10);

//   return {
//     y: data.map((d) => d.name),
//     x: data.map((d) => d[metric]),
//     metric: metric,
//   };
// };

// useEffect(() => {
//   setTop10ChartData(processChartData(top10Filters, "desc"));
// }, [top10Filters]);

// useEffect(() => {
//   setBottom10ChartData(processChartData(bottom10Filters, "asc"));
// }, [bottom10Filters]);

// const handleFilterChange = (setter) => (e) => {
//   const { name, value } = e.target;
//   setter((prev) => ({
//     ...prev,
//     [name]: value,
//     ...(name === "type" && { value: "" }),
//   }));
// };

// const chartValueFormatter = (metric) => (value) => {
//   if (metric === "revenue") return `₹${(value / 1_00_000).toFixed(1)}L`;
//   return value.toLocaleString();
// };

// // Function to calculate dynamic chart height
// const getChartHeight = (data) => Math.max(300, data.length * 40 + 80);

// Top 10 Inventories
// <Card>
//   <CardContent>
//     <h3 className="text-lg font-semibold mb-4 text-gray-800">
//       Top 10 Inventories
//     </h3>
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
//       <Select
//         name="type"
//         value={top10Filters.type}
//         onChange={handleFilterChange(setTop10Filters)}
//       >
//         {Object.entries(filterOptions).map(([val, label]) => (
//           <option key={val} value={val}>
//             {label}
//           </option>
//         ))}
//       </Select>
//       {isValueFilter(top10Filters.type) && (
//         <Input
//           name="value"
//           placeholder={`Filter by ${filterOptions[top10Filters.type]}`}
//           value={top10Filters.value}
//           onChange={handleFilterChange(setTop10Filters)}
//         />
//       )}
//       <button
//         onClick={() =>
//           handleShowDateModal("top10", top10Filters, setTop10Filters)
//         }
//         className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50"
//       >
//         {top10Filters.startDate && top10Filters.endDate
//           ? `${top10Filters.startDate} to ${top10Filters.endDate}`
//           : "Filter by Date"}
//       </button>
//     </div>
//     <div className="w-full">
//       <BarChart
//         height={getChartHeight(top10ChartData.y)}
//         layout="horizontal"
//         yAxis={[
//           {
//             data: top10ChartData.y,
//             scaleType: "band",
//             tickLabelStyle: { fontSize: 10 },
//           },
//         ]}
//         xAxis={[
//           { label: `Total ${filterOptions[top10ChartData.metric]}` },
//         ]}
//         series={[
//           {
//             data: top10ChartData.x,
//             label: filterOptions[top10ChartData.metric],
//             valueFormatter: chartValueFormatter(top10ChartData.metric),
//             color: "#3b82f6",
//           },
//         ]}
//         margin={{ left: 150, right: 20, top: 40, bottom: 40 }}
//         grid={{ x: true }}
//       />
//     </div>
//   </CardContent>
// </Card>

// // Bottom 10 Inventories Graph
// <Card>
//   <CardContent>
//     <h3 className="text-lg font-semibold mb-4 text-gray-800">
//       Bottom 10 Inventories
//     </h3>
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
//       <Select
//         name="type"
//         value={bottom10Filters.type}
//         onChange={handleFilterChange(setBottom10Filters)}
//       >
//         {Object.entries(filterOptions).map(([val, label]) => (
//           <option key={val} value={val}>
//             {label}
//           </option>
//         ))}
//       </Select>
//       {isValueFilter(bottom10Filters.type) && (
//         <Input
//           name="value"
//           placeholder={`Filter by ${filterOptions[bottom10Filters.type]}`}
//           value={bottom10Filters.value}
//           onChange={handleFilterChange(setBottom10Filters)}
//         />
//       )}
//       <button
//         onClick={() =>
//           handleShowDateModal(
//             "bottom10",
//             bottom10Filters,
//             setBottom10Filters
//           )
//         }
//         className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md text-left hover:bg-gray-50"
//       >
//         {bottom10Filters.startDate && bottom10Filters.endDate
//           ? `${bottom10Filters.startDate} to ${bottom10Filters.endDate}`
//           : "Filter by Date"}
//       </button>
//     </div>
//     <div className="w-full">
//       <BarChart
//         height={getChartHeight(bottom10ChartData.y)}
//         layout="horizontal"
//         yAxis={[
//           {
//             data: bottom10ChartData.y,
//             scaleType: "band",
//             tickLabelStyle: { fontSize: 10 },
//           },
//         ]}
//         xAxis={[
//           { label: `Total ${filterOptions[bottom10ChartData.metric]}` },
//         ]}
//         series={[
//           {
//             data: bottom10ChartData.x,
//             label: filterOptions[bottom10ChartData.metric],
//             valueFormatter: chartValueFormatter(bottom10ChartData.metric),
//             color: "#ef4444",
//           },
//         ]}
//         margin={{ left: 150, right: 20, top: 40, bottom: 40 }}
//         grid={{ x: true }}
//       />
//     </div>
//   </CardContent>
// </Card>
