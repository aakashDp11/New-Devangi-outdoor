


// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Navbar from './Navbar';

// const Input = ({ className = '', ...props }) => (
//   <input className={`border px-3 py-2 rounded w-full ${className}`} {...props} />
// );

// export default function BookingsDashboard1() {
//   const navigate = useNavigate();
//   const [bookings, setBookings] = useState([]);
//   const [search, setSearch] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
//   const perPage = 10;

//   useEffect(() => {
//     const fetchBookings = async () => {
//       const token = localStorage.getItem('accessToken');
//      console.log("Token sent is",token);
//       try {
    
//     const response = await fetch(
//   `${import.meta.env.VITE_API_BASE_URL}/api/bookings/optimized?page=${currentPage}&limit=10&search=${search}`,
//   { headers: { Authorization: `Bearer ${token}` } }
// );

//     if (response.status === 403) {
//       const errorData = await response.json();
//       if (errorData.message === 'Invalid or expired token') {
//         localStorage.removeItem('accessToken');
//         localStorage.removeItem('userId');
//         localStorage.removeItem('userRole');
//         localStorage.removeItem('userEmail');
//         navigate('/login'); // or use router.navigate('/login') if using React Router
//         return;
//       }
//     }

    
//         const data = await response.json();
//         data.bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//         setBookings(data.bookings);
//       } catch (error) {
//         console.error('Error fetching bookings:', error);
//       }
//     };

//     fetchBookings();
//   }, []);

//   const sortedData = [...bookings].sort((a, b) => {
//     const { key, direction } = sortConfig;
//     if (!key) return 0;

//     const aVal = a[key]?.toString().toLowerCase() || '';
//     const bVal = b[key]?.toString().toLowerCase() || '';

//     if (aVal < bVal) return direction === 'asc' ? -1 : 1;
//     if (aVal > bVal) return direction === 'asc' ? 1 : -1;
//     return 0;
//   });
//   const formatDate = (dateStr) => {
//     if (!dateStr) return '—';
//     const date = new Date(dateStr);
//     if (isNaN(date)) return '—';
//     const dd = String(date.getDate()).padStart(2, '0');
//     const mm = String(date.getMonth() + 1).padStart(2, '0');
//     const yy = String(date.getFullYear()).slice(-2);
//     return `${dd}/${mm}/${yy}`;
//   };
  
  

//   const filteredData = sortedData.filter((item) =>
//     item.companyName?.toLowerCase().includes(search.toLowerCase()) ||
//     item.clientName?.toLowerCase().includes(search.toLowerCase()) ||
//     item.brandDisplayName?.toLowerCase().includes(search.toLowerCase()) ||
//     item.campaignName?.toLowerCase().includes(search.toLowerCase())
//   );

//   const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);
//   const totalPages = Math.ceil(filteredData.length / perPage);

//   return (
//     // <div className="min-h-screen bg-[#fafafb] w-[168%] text-black flex flex-col lg:flex-row overflow-hidden">
//     <div className="min-h-screen bg-white h-screen w-screen text-black flex flex-col lg:flex-row overflow-hidden">
//       <Navbar />

//       <main className="flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 ml-0 lg:ml-64">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
//           <h2 className="text-2xl ">Bookings</h2>
//           <button
//             onClick={() => navigate('/create-booking')}
//             className="bg-black text-white text-xs px-3 py-2 rounded hover:scale-105 transition"
//           >
//             + Create Booking
//           </button>
//         </div>

//         <Input
//           className="md:w-[25%] h-[2rem] mb-4"
//           placeholder="Search Bookings"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />

//         <div className="overflow-x-auto mt-[3%]">
//            <table className="table-auto bg-white w-full rounded-md">
//     <thead className="bg-gray-100">
//       <tr className="text-xs">
//         <th className="px-4 py-2 text-left cursor-pointer">
//           <div
//             onClick={() =>
//               setSortConfig((prev) => ({
//                 key: '_id',
//                 direction:
//                   prev.key === '_id' && prev.direction === 'asc' ? 'desc' : 'asc',
//               }))
//             }
//             className="flex items-center gap-1 select-none"
//           >
//             Booking ID
//             <span className="text-xs">
//               {sortConfig.key === '_id'
//                 ? sortConfig.direction === 'asc'
//                   ? '▲'
//                   : '▼'
//                 : '⇅'}
//             </span>
//           </div>
//         </th>
//         <th className="px-4 py-2 text-left">Company Name</th>
//         <th className="px-4 py-2 text-left cursor-pointer">
//           <div
//             onClick={() =>
//               setSortConfig((prev) => ({
//                 key: 'clientName',
//                 direction:
//                   prev.key === 'clientName' && prev.direction === 'asc' ? 'desc' : 'asc',
//               }))
//             }
//             className="flex items-center gap-1 select-none"
//           >
//             Client Name
//             <span className="text-xs">
//               {sortConfig.key === 'clientName'
//                 ? sortConfig.direction === 'asc'
//                   ? '▲'
//                   : '▼'
//                 : '⇅'}
//             </span>
//           </div>
//         </th>

//         <th className="px-4 py-2 text-left cursor-pointer">
//           <div
//             onClick={() =>
//               setSortConfig((prev) => ({
//                 key: 'createdAt',
//                 direction:
//                   prev.key === 'createdAt' && prev.direction === 'asc' ? 'desc' : 'asc',
//               }))
//             }
//             className="flex items-center gap-1 select-none"
//           >
//             Booking Date
//             <span className="text-xs">
//               {sortConfig.key === 'createdAt'
//                 ? sortConfig.direction === 'asc'
//                   ? '▲'
//                   : '▼'
//                 : '⇅'}
//             </span>
//           </div>
//         </th>
//         <th className="px-4 py-2 text-left">Upcoming Start Date</th>
// <th className="px-4 py-2 text-left">Upcoming End Date</th>

//       </tr>
//     </thead>

//     <tbody className="text-xs">
//       {paginatedData.map((item) => (
//         <tr
//           key={item._id}
//           onClick={() => navigate(`/booking/${item._id}`)}
//           className="cursor-pointer transition duration-200 ease-in-out hover:bg-gray-200 hover:shadow-sm"
//         >
//           <td className="px-4 py-2">{item._id?.substring(0, 6)}</td>
//           <td className="px-4 py-2">
//             {/* {item.companyLogo ? (
//               <div className="avatar">
//                 <div className="mask mask-squircle w-8 h-8 overflow-hidden">
//                   <img
//                     src={item.companyLogo}
//                     alt="Client logo"
//                     className="w-full h-full object-contain"
//                   />
//                 </div>
//               </div>
//             ) : (
//               <span>No Image</span>
//             )} */}
//             {item.companyName || 'No Client'}
//           </td>
//           <td className="px-4 py-2">{item.clientName || 'No Client'}</td>
//            <td className="px-4 py-2">
//            {(() => {
//   const date = new Date(item.createdAt);
//   const dd = String(date.getDate()).padStart(2, '0');
//   const mm = String(date.getMonth() + 1).padStart(2, '0');
//   const yyyy = date.getFullYear();
//   return `${dd}/${mm}/${yyyy}`;
// })()}

//           </td>
        
// <td className="px-4 py-2">
//   {
//     item.campaigns?.length
//       ? formatDate(
//           item.campaigns
//             .filter(c => c.startDate)
//             .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0]?.startDate
//         )
//       : '—'
//   }
// </td>
// <td className="px-4 py-2">
//   {
//     item.campaigns?.length
//       ? formatDate(
//           item.campaigns
//             .filter(c => c.startDate)
//             .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0]?.endDate
//         )
//       : '—'
//   }
// </td>

// {/* <td className="px-4 py-2">
//   {
//     item.campaigns?.length
//       ? new Date(
//           item.campaigns
//             .filter(c => c.startDate)
//             .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0]?.endDate
//         ).toLocaleDateString()
//       : '—'
//   }
// </td> */}

//         </tr>
//       ))}
//     </tbody>
//   </table>
//         </div>

//         <div className="mt-6 flex justify-center gap-2">
//           {Array.from({ length: totalPages }).map((_, i) => (
//             <button
//               key={i}
//               onClick={() => setCurrentPage(i + 1)}
//               className={`px-3 py-1 rounded ${
//                 i + 1 === currentPage ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
//               }`}
//             >
//               {i + 1}
//             </button>
//           ))}
//         </div>
//       </main>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parse } from 'date-fns';
import Navbar from './Navbar';

const Input = ({ className = '', ...props }) => (
  <input className={`border px-3 py-2 rounded w-full ${className}`} {...props} />
);

export default function BookingsDashboard1() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);
  const perPage = 10;

  useEffect(() => {
    const fetchBookings = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/bookings/optimized?page=${currentPage}&limit=10&search=${search}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 403) {
          const errorData = await response.json();
          if (errorData.message === 'Invalid or expired token') {
            localStorage.clear();
            navigate('/login');
            return;
          }
        }

        const data = await response.json();
        data.bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setBookings(data.bookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchBookings();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date)) return '—';
    return format(date, 'dd/MM/yyyy');
  };

  const getUpcomingCampaignDate = (campaigns, type = 'startDate') => {
    if (!campaigns?.length) return null;
    const sorted = campaigns.filter(c => c.startDate).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    return sorted[0]?.[type] || null;
  };

  const sortedData = [...bookings].sort((a, b) => {
    const { key, direction } = sortConfig;
    if (!key) return 0;

    if (key === 'upcomingStartDate' || key === 'upcomingEndDate') {
      const aDate = getUpcomingCampaignDate(a.campaigns, key === 'upcomingStartDate' ? 'startDate' : 'endDate');
      const bDate = getUpcomingCampaignDate(b.campaigns, key === 'upcomingStartDate' ? 'startDate' : 'endDate');
      if (!aDate || !bDate) return 0;
      return direction === 'asc'
        ? new Date(aDate) - new Date(bDate)
        : new Date(bDate) - new Date(aDate);
    }

    const aVal = a[key]?.toString().toLowerCase() || '';
    const bVal = b[key]?.toString().toLowerCase() || '';
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredData = sortedData.filter((item) => {
    const startDate = getUpcomingCampaignDate(item.campaigns, 'startDate');
    const endDate = getUpcomingCampaignDate(item.campaigns, 'endDate');

    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;

    const matchesSearch =
      item.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      item.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      item.brandDisplayName?.toLowerCase().includes(search.toLowerCase()) ||
      item.campaignName?.toLowerCase().includes(search.toLowerCase());

    const matchesDateFilter =
      (!filterStartDate || (startDateObj && startDateObj >= filterStartDate)) &&
      (!filterEndDate || (endDateObj && endDateObj <= filterEndDate));

    return matchesSearch && matchesDateFilter;
  });

  const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);
  const totalPages = Math.ceil(filteredData.length / perPage);

  return (
    <div className="min-h-screen bg-white h-screen w-screen text-black flex flex-col lg:flex-row overflow-hidden">
      <Navbar />

      <main className="flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 ml-0 lg:ml-64">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-2xl">Bookings</h2>
          <button
            onClick={() => navigate('/create-booking')}
            className="bg-black text-white text-xs px-3 py-2 rounded hover:scale-105 transition"
          >
            + Create Booking
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input
            className="h-[2rem]"
            placeholder="Search Bookings"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className='flex ml-auto gap-4'>
          <DatePicker
            selected={filterStartDate}
            onChange={(date) => setFilterStartDate(date)}
            dateFormat="dd/MM/yyyy"
            placeholderText="Filter Start Date"
            className="border px-3 py-2 text-sm rounded w-full h-[2rem]"
            isClearable
          />
          <DatePicker
            selected={filterEndDate}
            onChange={(date) => setFilterEndDate(date)}
            dateFormat="dd/MM/yyyy"
            placeholderText="Filter End Date"
            className="border px-3 py-2 text-sm rounded w-full h-[2rem]"
            isClearable
          />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-auto bg-white w-full rounded-md">
            <thead className="bg-gray-100">
              <tr className="text-xs">
                <th className="px-4 py-2 text-left">Booking ID</th>
                <th className="px-4 py-2 text-left">Company Name</th>
                <th className="px-4 py-2 text-left">Client Name</th>
                <th className="px-4 py-2 text-left">Booking Date</th>
                <th className="px-4 py-2 text-left cursor-pointer">
                  <div
                    onClick={() =>
                      setSortConfig((prev) => ({
                        key: 'upcomingStartDate',
                        direction:
                          prev.key === 'upcomingStartDate' && prev.direction === 'asc'
                            ? 'desc'
                            : 'asc',
                      }))
                    }
                    className="flex items-center gap-1 select-none"
                  >
                    Upcoming Start Date
                    <span className="text-xs">
                      {sortConfig.key === 'upcomingStartDate'
                        ? sortConfig.direction === 'asc'
                          ? '▲'
                          : '▼'
                        : '⇅'}
                    </span>
                  </div>
                </th>
                <th className="px-4 py-2 text-left cursor-pointer">
                  <div
                    onClick={() =>
                      setSortConfig((prev) => ({
                        key: 'upcomingEndDate',
                        direction:
                          prev.key === 'upcomingEndDate' && prev.direction === 'asc'
                            ? 'desc'
                            : 'asc',
                      }))
                    }
                    className="flex items-center gap-1 select-none"
                  >
                    Upcoming End Date
                    <span className="text-xs">
                      {sortConfig.key === 'upcomingEndDate'
                        ? sortConfig.direction === 'asc'
                          ? '▲'
                          : '▼'
                        : '⇅'}
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {paginatedData.map((item) => {
                const upcomingStart = getUpcomingCampaignDate(item.campaigns, 'startDate');
                const upcomingEnd = getUpcomingCampaignDate(item.campaigns, 'endDate');
                return (
                  <tr
                    key={item._id}
                    onClick={() => navigate(`/booking/${item._id}`)}
                    className="cursor-pointer transition duration-200 ease-in-out hover:bg-gray-200"
                  >
                    <td className="px-4 py-2">{item._id?.substring(0, 6)}</td>
                    <td className="px-4 py-2">{item.companyName || '—'}</td>
                    <td className="px-4 py-2">{item.clientName || '—'}</td>
                    <td className="px-4 py-2">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-2">{formatDate(upcomingStart)}</td>
                    <td className="px-4 py-2">{formatDate(upcomingEnd)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                i + 1 === currentPage ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}



