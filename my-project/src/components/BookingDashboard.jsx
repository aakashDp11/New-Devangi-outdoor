// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Navbar from './Navbar';

// const Button = ({ children, className = '', ...props }) => (
//   <button className={`px-4 py-2 rounded bg-black text-white hover: transition ${className}`} {...props}>
//     {children}
//   </button>
// );

// const Input = ({ className = '', ...props }) => (
//   <input className={`border px-3 py-2 rounded w-full ${className}`} {...props} />
// );

// const Card = ({ children, className = '', ...props }) => (
//   <div className={`bg-white border shadow-sm rounded-xl w-full ${className}`} {...props}>
//     {children}
//   </div>
// );

// const CardContent = ({ children, className = '' }) => (
//   <div className={`p-4 ${className}`}>{children}</div>
// );

// const Pagination = ({ children }) => <div className="flex justify-center">{children}</div>;
// const PaginationContent = ({ children, className = '' }) => (
//   <div className={`flex gap-2 mt-4 flex-wrap ${className}`}>{children}</div>
// );
// const PaginationItem = ({ children }) => <div>{children}</div>;
// const PaginationLink = ({ children, isActive = false, onClick }) => (
//   <button
//     onClick={onClick}
//     className={`px-3 py-1 rounded ${isActive ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'} transition`}
//   >
//     {children}
//   </button>
// );

// export default function BookingsDashboard1() {
//   const navigate = useNavigate();
//   const [bookings, setBookings] = useState([]);
//   const [search, setSearch] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const perPage = 10;
//  const [isAnimated, setIsAnimated] = useState(false);
//   useEffect(() => {
//     const fetchBookings = async () => {
//       try {
//         const response = await fetch('http://localhost:3000/api/bookings');
//         const data = await response.json();
//         data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//         setBookings(data);
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
//    useEffect(() => {
//       const timeout = setTimeout(() => {
//         setIsAnimated(true);
//       }, 50); // Small delay ensures animation is triggered
//       return () => clearTimeout(timeout);
//     }, [paginatedData]); // Re-animate on pagination change

//   return (
//     <div className="min-h-screen h-screen w-screen bg-white text-black flex flex-col lg:flex-row overflow-hidden">
//       {/* Sidebar */}
//       <Navbar />

//       {/* Main Content */}
//       <main className="flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 ml-0 lg:ml-64">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
//           <h1 className="text-1xl md:text-2xl font-semibold">Bookings</h1>
//         </div>

//         <div className="mt-6 text-sm flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center">
//           <Input
//             className="md:w-[25%] h-[2rem]"
//             placeholder="Search Bookings"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>
//         <div className="flex justify-between mt-[2%] items-center mb-4">
//         <div className='text-xs'>
    
//           <button className="border border-gray-300 px-3 py-1 rounded mr-2">Filter</button>
//         </div>
//         <button onClick={()=>navigate('/create-booking')} className="bg-black text-xs text-white px-3 py-2 rounded transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110">+ Create Order</button>
//       </div>

//         <div className={`mt-6 grid grid-cols-1 gap-4 w-full transform transition-all duration-700 ease-out ${
//   isAnimated ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
// }`}>
       
//           {paginatedData.map((item) => (
//   <Card key={item._id} className="transition hover:shadow-md cursor-pointer" onClick={() => navigate(`/booking/${item._id}`)}>
//     <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      
//       {/* Booking Info */}
//       <div className="flex-1 flex flex-col gap-1">
//         <div className="text-sm font-semibold break-words">{item.companyName}</div>
//         <div className="text-xs text-gray-600">Client: {item.clientName || 'No Client'}</div>
//         <div className="text-xs text-gray-600">Campaign: {item.campaignName || 'No Campaign'}</div>
//       </div>

//       {/* Latest Pipeline Status Tag */}
//       <div className="flex items-center">
//         <span className="text-xs px-2 py-1 rounded bg-blue-200">
//           {getLatestPipelineStatus(item.pipeline)}
//         </span>
//       </div>

//       {/* Tags */}
//       <div className="flex flex-wrap gap-2 items-center">
//         <span className="text-xs px-2 py-1 rounded bg-green-200">
//           {item.clientType || 'Client Type'}
//         </span>
//         <span className="text-xs px-2 py-1 rounded bg-purple-100">
//           {item.industry || 'Industry'}
//         </span>
//       </div>
//     </CardContent>
//   </Card>
// ))}

//         </div>

//         <div className="mt-6">
//           <Pagination>
//             <PaginationContent className="gap-2">
//               {Array.from({ length: totalPages }).map((_, i) => (
//                 <PaginationItem key={i}>
//                   <PaginationLink
//                     isActive={i + 1 === currentPage}
//                     onClick={() => setCurrentPage(i + 1)}
//                   >
//                     {i + 1}
//                   </PaginationLink>
//                 </PaginationItem>
//               ))}
//             </PaginationContent>
//           </Pagination>
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
  const perPage = 10;

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/bookings');
        const data = await response.json();
        console.log(data.bookings);
        data.bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setBookings(data.bookings);
        console.log("Bookings data is",data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchBookings();
  }, []);

  const filteredData = bookings.filter((item) =>
    item.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    item.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    item.brandDisplayName?.toLowerCase().includes(search.toLowerCase()) ||
    item.campaignName?.toLowerCase().includes(search.toLowerCase())
  );

  const getLatestPipelineStatus = (pipeline) => {
    if (!pipeline) return 'Yet to be started';
    if (pipeline.advertisingLive?.started) return 'Advertising Live';
    if (pipeline.mountingStatus?.confirmed) return 'Mounting Done';
    if (pipeline.printingStatus?.confirmed) return 'Printing Done';
    if (pipeline.payment?.paymentDue === 0 && pipeline.payment?.totalPaid > 0) return 'Payment Done';
    if (pipeline.invoice?.invoiceNumber) return 'Invoice Received';
    if (pipeline.artwork?.confirmed) return 'Artwork Received';
    if (pipeline.po?.confirmed) return 'PO Received';
    if (pipeline.bookingStatus?.confirmed) return 'Booking Confirmed';
    return 'Yet to be started';
  };

  const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);
  const totalPages = Math.ceil(filteredData.length / perPage);

  return (
    <div className="min-h-screen w-screen bg-white text-black flex flex-col lg:flex-row overflow-hidden">
      <Navbar />

      <main className="flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 ml-0 lg:ml-64">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-semibold">Bookings</h1>
          <button
            onClick={() => navigate('/create-booking')}
            className="bg-black text-white text-sm px-3 py-2 rounded hover:scale-105 transition"
          >
            + Create Order
          </button>
        </div>

        <Input
          className="md:w-[25%] h-[2rem] mb-4"
          placeholder="Search Bookings"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Client logo</th>
                <th>Booking ID</th>
                <th>Client Name</th>
                {/* <th>Category</th> */}
                {/* <th>Status</th> */}
                <th>Booking Date</th>
                {/* <th>Start Date</th>
                <th>End Date</th> */}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => (
                <tr
                  key={item._id}
                  className="hover cursor-pointer"
                  onClick={() => navigate(`/booking/${item._id}`)}
                >
                  <td>
                    {item.campaignImages?.length > 0 ? (
                      <div className="avatar">
                        <div className="mask mask-squircle w-12 h-12">
                          <img src={`http://localhost:3000${item.campaignImages[0]}`} alt="Campaign" />
                        </div>
                      </div>
                    ) : (
                      <span>No Image</span>
                    )}
                  </td>
                  <td>{item._id}</td>
                  <td>{item.clientName || 'No Client'}</td>
                  {/* <td>{item.industry || 'No Category'}</td> */}
                  {/* <td>
                    <span className="badge badge-ghost badge-sm">
                      {getLatestPipelineStatus(item.pipeline)}
                    </span>
                  </td> */}
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  {/* <td>{item.spaces?.[0]?.id?.dates[0] || 'N/A'}</td>
<td>{item.spaces?.[0]?.id?.dates[1] || 'N/A'}</td> */}
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
