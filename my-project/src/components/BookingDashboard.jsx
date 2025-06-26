

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
//   const perPage = 10;

//   useEffect(() => {
//     const fetchBookings = async () => {
//       try {
//         const response = await fetch('http://localhost:3000/api/bookings');
//         const data = await response.json();
//         console.log(data.bookings);
//         data.bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//         setBookings(data.bookings);
//         console.log("Bookings data is",data);
//       } catch (error) {
//         console.error('Error fetching bookings:', error);
//       }
//     };

//     fetchBookings();
//   }, []);

//   const filteredData = bookings.filter((item) =>
//     item.companyName?.toLowerCase().includes(search.toLowerCase()) ||
//     item.clientName?.toLowerCase().includes(search.toLowerCase()) ||
//     item.brandDisplayName?.toLowerCase().includes(search.toLowerCase()) ||
//     item.campaignName?.toLowerCase().includes(search.toLowerCase())
//   );

//   const getLatestPipelineStatus = (pipeline) => {
//     if (!pipeline) return 'Yet to be started';
//     if (pipeline.advertisingLive?.started) return 'Advertising Live';
//     if (pipeline.mountingStatus?.confirmed) return 'Mounting Done';
//     if (pipeline.printingStatus?.confirmed) return 'Printing Done';
//     if (pipeline.payment?.paymentDue === 0 && pipeline.payment?.totalPaid > 0) return 'Payment Done';
//     if (pipeline.invoice?.invoiceNumber) return 'Invoice Received';
//     if (pipeline.artwork?.confirmed) return 'Artwork Received';
//     if (pipeline.po?.confirmed) return 'PO Received';
//     if (pipeline.bookingStatus?.confirmed) return 'Booking Confirmed';
//     return 'Yet to be started';
//   };

//   const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);
//   const totalPages = Math.ceil(filteredData.length / perPage);

//   return (
//     <div className="min-h-screen bg-[#fafafb] w-screen bg-white text-black flex flex-col lg:flex-row overflow-hidden">
//       <Navbar />

//       <main className="flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 ml-0 lg:ml-64">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
//           <h1 className="text-2xl font-semibold">Bookings</h1>
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

//         {/* <div className="overflow-x-auto">
//           <table className="table">
//             <thead>
//               <tr>
//                 <th>Client logo</th>
//                 <th>Booking ID</th>
//                 <th>Client Name</th>
//                 <th>Booking Date</th>
//               </tr>
//             </thead>
//             <tbody>
//               {paginatedData.map((item) => (
//                 <tr
//                   key={item._id}
//                   className="hover cursor-pointer"
//                   onClick={() => navigate(`/booking/${item._id}`)}
//                 >
//                   <td>
  
//   {item.companyLogo ? (
//   <div className="avatar">
//     <div className="mask mask-squircle w-8 h-8 overflow-hidden">
//       <img
//         src={item.companyLogo}
//         alt="Client logo"
//         className="w-full h-full object-contain"
//       />
//     </div>
//   </div>
// ) : (
//   <span>No Image</span>
// )}

// </td>

//                   <td>{item._id}</td>
//                   <td>{item.clientName || 'No Client'}</td>

//                   <td>{new Date(item.createdAt).toLocaleDateString()}</td>
 
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div> */}

//         <div className="overflow-x-auto mt-[3%]">
//   <table className="table-auto w-full border border-gray-300 rounded-md">
//     <thead className="bg-gray-100">
//       <tr>
//         <th className="border border-gray-300 px-4 py-2 text-left">Booking ID</th>
//         <th className="border border-gray-300 px-4 py-2 text-left">Client Logo</th>
//         <th className="border border-gray-300 px-4 py-2 text-left">Client Name</th>
//         <th className="border border-gray-300 px-4 py-2 text-left">Booking Date</th>
//       </tr>
//     </thead>
//     <tbody>
//       {paginatedData.map((item) => (
//        <tr
//   key={item._id}
//   onClick={() => navigate(`/booking/${item._id}`)}
//   className="cursor-pointer transition duration-200 ease-in-out hover:bg-white hover:shadow-sm"
// >

//            <td className="border border-gray-300 px-4 py-2">{item._id.substring(0, 6)}</td>
//           <td className="border border-gray-300 px-4 py-2">
//             {item.companyLogo ? (
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
//               <span></span>
//             )}
//           </td>
         
//           <td className="border border-gray-300 px-4 py-2">{item.clientName || 'No Client'}</td>
//           <td className="border border-gray-300 px-4 py-2">
//             {new Date(item.createdAt).toLocaleDateString()}
//           </td>
//         </tr>
//       ))}
//     </tbody>
//   </table>
// </div>


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
  const perPage = 10;

  useEffect(() => {
    const fetchBookings = async () => {
      const token = localStorage.getItem('accessToken');
     console.log("Token sent is",token);
      try {
    //     const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings`,{
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${token}`,
    //   },
    // });
    const response = await fetch(
  `${import.meta.env.VITE_API_BASE_URL}/api/bookings/optimized?page=${currentPage}&limit=10&search=${search}`,
  { headers: { Authorization: `Bearer ${token}` } }
);

    if (response.status === 403) {
      const errorData = await response.json();
      if (errorData.message === 'Invalid or expired token') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        navigate('/login'); // or use router.navigate('/login') if using React Router
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

  const sortedData = [...bookings].sort((a, b) => {
    const { key, direction } = sortConfig;
    if (!key) return 0;

    const aVal = a[key]?.toString().toLowerCase() || '';
    const bVal = b[key]?.toString().toLowerCase() || '';

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredData = sortedData.filter((item) =>
    item.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    item.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    item.brandDisplayName?.toLowerCase().includes(search.toLowerCase()) ||
    item.campaignName?.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);
  const totalPages = Math.ceil(filteredData.length / perPage);

  return (
    // <div className="min-h-screen bg-[#fafafb] w-[168%] text-black flex flex-col lg:flex-row overflow-hidden">
    <div className="min-h-screen bg-white h-screen w-screen text-black flex flex-col lg:flex-row overflow-hidden">
      <Navbar />

      <main className="flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 ml-0 lg:ml-64">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-2xl ">Bookings</h2>
          <button
            onClick={() => navigate('/create-booking')}
            className="bg-black text-white text-xs px-3 py-2 rounded hover:scale-105 transition"
          >
            + Create Booking
          </button>
        </div>

        <Input
          className="md:w-[25%] h-[2rem] mb-4"
          placeholder="Search Bookings"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="overflow-x-auto mt-[3%]">
           <table className="table-auto bg-white w-full rounded-md">
    <thead className="bg-gray-100">
      <tr className="text-xs">
        <th className="px-4 py-2 text-left cursor-pointer">
          <div
            onClick={() =>
              setSortConfig((prev) => ({
                key: '_id',
                direction:
                  prev.key === '_id' && prev.direction === 'asc' ? 'desc' : 'asc',
              }))
            }
            className="flex items-center gap-1 select-none"
          >
            Booking ID
            <span className="text-xs">
              {sortConfig.key === '_id'
                ? sortConfig.direction === 'asc'
                  ? '▲'
                  : '▼'
                : '⇅'}
            </span>
          </div>
        </th>
        <th className="px-4 py-2 text-left">Company Name</th>
        <th className="px-4 py-2 text-left cursor-pointer">
          <div
            onClick={() =>
              setSortConfig((prev) => ({
                key: 'clientName',
                direction:
                  prev.key === 'clientName' && prev.direction === 'asc' ? 'desc' : 'asc',
              }))
            }
            className="flex items-center gap-1 select-none"
          >
            Client Name
            <span className="text-xs">
              {sortConfig.key === 'clientName'
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
                key: 'createdAt',
                direction:
                  prev.key === 'createdAt' && prev.direction === 'asc' ? 'desc' : 'asc',
              }))
            }
            className="flex items-center gap-1 select-none"
          >
            Booking Date
            <span className="text-xs">
              {sortConfig.key === 'createdAt'
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
      {paginatedData.map((item) => (
        <tr
          key={item._id}
          onClick={() => navigate(`/booking/${item._id}`)}
          className="cursor-pointer transition duration-200 ease-in-out hover:bg-gray-200 hover:shadow-sm"
        >
          <td className="px-4 py-2">{item._id?.substring(0, 6)}</td>
          <td className="px-4 py-2">
            {/* {item.companyLogo ? (
              <div className="avatar">
                <div className="mask mask-squircle w-8 h-8 overflow-hidden">
                  <img
                    src={item.companyLogo}
                    alt="Client logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            ) : (
              <span>No Image</span>
            )} */}
            {item.companyName || 'No Client'}
          </td>
          <td className="px-4 py-2">{item.clientName || 'No Client'}</td>
          <td className="px-4 py-2">
            {new Date(item.createdAt).toLocaleDateString()}
          </td>
        </tr>
      ))}
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


