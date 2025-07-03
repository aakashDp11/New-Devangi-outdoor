


// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Navbar from './Navbar';
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';
// import toast from 'react-hot-toast';

// const Button = ({ children, className = '', ...props }) => (
//   <button className={`px-4 py-2 rounded bg-black text-white hover: transition ${className}`} {...props}>
//     {children}
//   </button>
// );

// const Input = ({ className = '', ...props }) => (
//   <input className={`border px-3 py-2 rounded w-full ${className}`} {...props} />
// );

// const Card = ({ children, className = '', ...props }) => (
//   <div className={`bg-white border shadow-sm rounded-xl w-full h-[100%] ${className}`} {...props}>
//     {children}
//   </div>
// );

// const CardContent = ({ children, className = '' }) => (
//   <div className={`p-3 py-2 ${className}`}>{children}</div>
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

// export default function InventoryDashboard() {
//   const navigate = useNavigate();
//   const [spaces, setSpaces] = useState([]);
//   const [search, setSearch] = useState('');
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [selectedRegion, setSelectedRegion] = useState('');
//   const [availability, setAvailability] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [isAnimated, setIsAnimated] = useState(false);
//   const [showUploadModal, setShowUploadModal] = useState(false);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [bookedSpaceIds, setBookedSpaceIds] = useState([]);
//   const [showDateModal, setShowDateModal] = useState(false);
//   const [tempStartDate, setTempStartDate] = useState('');
//   const [tempEndDate, setTempEndDate] = useState('');
// const [spaceTypeFilter, setSpaceTypeFilter] = useState('');
// const [totalCount, setTotalCount] = useState(0);

// const fetchSpaces = async () => {
//     try {
//       const token = localStorage.getItem('accessToken');
//       const params = new URLSearchParams({
//         page: currentPage,
//         limit: 10,
//         search,
//         region: selectedRegion,
//         availability,
//         spaceType: spaceTypeFilter,
//         ...(startDate && endDate && { startDate, endDate }),
//       });

//       const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/listInventory?${params.toString()}`, {
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (res.status === 403) {
//         const errorData = await res.json();
//         if (errorData.message === 'Invalid or expired token') {
//           localStorage.clear();
//           navigate('/login');
//           return;
//         }
//       }

//       const data = await res.json();
//       setSpaces(data.spaces);
//       setTotalCount(data.totalCount);
//     } catch (error) {
//       console.error('Error fetching spaces:', error);
//     }
//   };
//   const fetchBookedSpaces = async () => {
//     if (!startDate || !endDate) {
//       setBookedSpaceIds([]);
//       return;
//     }
//     try {
//       const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/active-spaces?from=${startDate}&to=${endDate}`);
//       const data = await res.json();
//       setBookedSpaceIds(data.bookedSpaceIds || []);
//     } catch (error) {
//       console.error('Failed to fetch booked space IDs:', error);
//       setBookedSpaceIds([]);
//     }
//   };

//   useEffect(() => {
//     fetchSpaces();
//   }, []);

//   useEffect(() => {
//     fetchBookedSpaces();
//   }, [startDate, endDate]);

//   const handleDownloadExcel = () => {
//     if (filteredData.length === 0) return;
//     const excelData = filteredData.map(item => ({
//       'Space Name': item.spaceName,
//       'Address': item.address,
//       'City': item.city,
//       'State': item.state,
//       'Zone': item.zone,
//       'Space Type': item.spaceType,
//       'Availability': item.availability,
//       'Units': item.unit,
//       'Occupied Units': item.occupiedUnits,
//       'Price': item.price,
//       'Footfall': item.footfall,
//       'Audience': item.audience,
//       'Demographics': item.demographics,
//       'Dates': item.dates?.join(', ')
//     }));
//     const worksheet = XLSX.utils.json_to_sheet(excelData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventories');
//     const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
//     const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
//     saveAs(data, 'filtered_inventories.xlsx');
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setSelectedFile(file);
//       setShowUploadModal(true);
//     }
//   };

//   const handleConfirmUpload = async () => {
//     if (!selectedFile) return;
//     const formData = new FormData();
//     formData.append('file', selectedFile);

//     try {
//       const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/upload-excel`, {
//         method: 'POST',
//         body: formData,
//       });

//       const result = await response.json();
//       if (response.ok) {
//         toast.success(`Successfully uploaded ${result.count} inventories`);
//         setShowUploadModal(false);
//         setSelectedFile(null);
//         await fetchSpaces();
//       } else {
//         toast.error(result.error || 'Upload failed');
//       }
//     } catch (error) {
//       console.error('Upload error:', error);
//       toast.error('Something went wrong while uploading');
//     }
//   };
// const getComputedAvailability = (item) => {
//   const totalUnits = item.unit || 0;
//   const occupied = item.occupiedUnits || 0;

//   if (item.overlappingBooking) return 'Overlapping booking';
//   if (item.availability === 'Booked') return 'Completely booked'; // explicit mapping
//   if (totalUnits === occupied && occupied !== 0) return 'Completely booked';
//   if (occupied > 0 && occupied < totalUnits) return 'Partially available';
//   return 'Completely available';
// };

//   const filteredData = spaces.filter((item) => {
//     const idStr = item._id?.toString();
// const matchesSpaceType = !spaceTypeFilter || item.spaceType === spaceTypeFilter;

 
//     const matchesSearch = [
//   item.spaceName,
//   item.city,
//   item.state,
//   item.zone,
//   item.address,
//   item.tags  // ✅ includes tag string for searching
// ]
//   .filter(Boolean)
//   .some(field => field.toLowerCase().includes(search.toLowerCase()));


//     const matchesRegion =
//       !selectedRegion ||
//       item.city?.toLowerCase().includes(selectedRegion.toLowerCase()) ||
//       item.state?.toLowerCase().includes(selectedRegion.toLowerCase()) ||
//       item.zone?.toLowerCase().includes(selectedRegion.toLowerCase());

//     // const matchesAvailability =
//     //   availability === '' || item.availability === availability;
//     const matchesAvailability =
//       availability === '' || getComputedAvailability(item) === availability;

//     const isBooked = bookedSpaceIds.includes(idStr);


//     const matchesDateRange = (() => {
//   if (!startDate || !endDate || !item.dates || item.dates.length < 2) return true;

//   const selectedStart = new Date(startDate);
//   const selectedEnd = new Date(endDate);

//   const [rawStart, rawEnd] = item.dates;
//   const [day1, month1, year1] = rawStart.split('-');
//   const [day2, month2, year2] = rawEnd.split('-');
//   const inventoryStart = new Date(`${year1}-${month1}-${day1}`);
//   const inventoryEnd = new Date(`${year2}-${month2}-${day2}`);

//   // ✅ Check if selected range is inside inventory range
//   const isInsideInventoryRange =
//     selectedStart >= inventoryStart && selectedEnd <= inventoryEnd;

//   // ❌ Check if selected range overlaps with any campaignDates
//   const overlapsWithCampaign = (item.campaignDates || []).some(c => {
//     const campaignStart = new Date(c.startDate);
//     const campaignEnd = new Date(c.endDate);
//     return (
//       selectedStart <= campaignEnd &&
//       selectedEnd >= campaignStart
//     );
//   });

//   return isInsideInventoryRange && !overlapsWithCampaign;
// })();

//     return matchesSearch && matchesRegion && matchesSpaceType && matchesAvailability && matchesDateRange && !isBooked;
//   });

//   const paginatedData = filteredData.slice((currentPage - 1) * 10, currentPage * 10);
//   const totalPages = Math.ceil(totalCount / 10);

//   useEffect(() => {
//     const timeout = setTimeout(() => {
//       setIsAnimated(true);
//     }, 50);
//     return () => clearTimeout(timeout);
//   }, [paginatedData]);

//   return (
//     <div className="min-h-screen bg-gray-100 h-screen w-screen bg-white text-black flex flex-col lg:flex-row overflow-hidden">
//       <Navbar />
//       <main className="flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 ml-0 lg:ml-64">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
//           <h2 className="text-1xl md:text-2xl ">Inventories</h2>
//           <div className="flex gap-2 w-full md:w-auto">
//             <Button onClick={() => navigate('/add-space')} className="text-xs w-full md:w-auto hover:-translate-y-1 hover:scale-110 transition">
//               + Add Space
//             </Button>
           
//             <input type="file" accept=".xlsx, .csv" id="excel-upload" onChange={handleFileChange} className="hidden" />
//             <label
//               htmlFor="excel-upload"
//               className="cursor-pointer px-4 py-2 rounded bg-black text-white text-xs w-full md:w-auto hover:-translate-y-1 hover:scale-110 transition"
//             >
//               Upload Excel
//             </label>
//             <Button onClick={handleDownloadExcel} className="text-xs w-full md:w-auto hover:-translate-y-1 hover:scale-110 transition">
//               Download Excel
//             </Button>
//           </div>
//         </div>

//         <div className="mt-6 text-sm flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center">
//           <Input className="md:w-[28%] h-[1.8rem]" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
//           <div className="flex flex-wrap gap-2 w-full md:w-auto">
    
//             <Input className="md:w-40" value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} placeholder="Enter City/State/Zone" />
//             <select className="border px-3 py-2 rounded w-full md:w-40" value={availability} onChange={(e) => setAvailability(e.target.value)}>
//               <option value="">All</option>
//               <option value="Completely available">Completely available</option>
//               <option value="Partialy available">Partialy available</option>
//               <option value="Completely booked">Completely booked</option>
//               <option value="Overlapping booking">Overlapping booking</option>
             
//             </select>
           

//             <button
//               onClick={() => {
//                 setTempStartDate(startDate);
//                 setTempEndDate(endDate);
//                 setShowDateModal(true);
//               }}
//               className="text-xs w-full bg-white text-black md:w-auto hover:border-black hover:-translate-y-1 hover:scale-110 transition"
//             >
//               Date Filter
//             </button>
//             <button
//   onClick={() => {
//     setStartDate('');
//     setEndDate('');
//     setSelectedRegion('');
//     setAvailability('');
//   }}
//   className="text-xs w-full bg-white text-black md:w-auto hover:border-black hover:-translate-y-1 hover:scale-110 transition"
// >
//   Reset Filters
// </button>

//           </div>
//         </div>

//         <div className="mt-6 grid grid-cols-1 gap-4 w-full">
//          {paginatedData.map((item, index) => (
//   <Card
//     key={item._id}
//     className={`hover:shadow-md hover:border-2 hover:scale-100 cursor-pointer transform transition-all duration-700 ease-out ${
//       isAnimated ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
//     }`}
//     style={{ transitionDelay: `${index * 100}ms` }}
//     onClick={() => navigate(`/space/${item._id}`)} // ✅ Navigate on card click
//   >
//     <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//       <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
//         <img src={`${item.mainPhoto}`} alt="Main Photo" className="w-full h-[130%] object-cover" />
//       </div>

//       <div className="flex-1 flex flex-col gap-1 w-full">
//         <div className="text-sm font-semibold break-words">{item.spaceName}</div>
//         <div className="text-xs text-gray-600">{item.address || 'No address provided'}</div>

//         {/* Tag input box */}
//         <div className="mt-2 text-xs">
//           <input
//             placeholder="+ Tag"
//             className="text-xs px-2 py-[3px] w-24 border rounded bg-white focus:outline-none"
//             onKeyDown={async (e) => {
//               e.stopPropagation(); // ✅ Prevent card click
//               if (e.key === 'Enter' && e.target.value.trim()) {
//                 const newTag = e.target.value.trim();
//                 try {
//                   const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${item._id}/add-tag`, {
//                     method: 'PUT',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({ tag: newTag }),
//                   });
//                   if (res.ok) {
//                     toast.success('Tag added');
//                     fetchSpaces();
//                     e.target.value = '';
//                   } else {
//                     toast.error('Failed to add tag');
//                   }
//                 } catch (err) {
//                   console.error(err);
//                   toast.error('Error while adding tag');
//                 }
//               }
//             }}
//             onFocus={(e) => e.stopPropagation()} // ✅ Also block click on focus
//             onClick={(e) => e.stopPropagation()} // ✅ Block click on click
//           />
//         </div>
//       </div>

//       {/* Right side tags */}
//       <div className="flex gap-2 flex-wrap justify-end">
//         <span className="text-xs px-2 py-1 rounded bg-green-200">{item.city || 'City'}</span>
//         <span className="text-xs px-2 py-1 bg-purple-100 rounded">{item.spaceType || 'Type'}</span>

//         {/* Availability Badge */}
//         {(() => {
//           const totalUnits = item.unit || 0;
//           const occupied = item.occupiedUnits || 0;
//           const overlappingBooking=item.overlappingBooking;
//           let status = 'Completely available';
//           let color = 'bg-green-100';

//           if (totalUnits === occupied && occupied !== 0) {
//             status = 'Completely booked';
//             color = 'bg-red-100';
//           } else if (occupied > 0 && occupied < totalUnits) {
//             status = 'Partially available';
//             color = 'bg-yellow-100';
//           } else if(overlappingBooking){
//              status = 'Overlapping Booking';
//             color = 'bg-red-400';
//           }
         

//           return <span className={`text-xs px-2 py-1 rounded ${color}`}>{status}</span>;
//         })()}

//         {/* Tags with remove option */}
//         {(item.tags || '')
//           .split(',')
//           .map((t) => t.trim())
//           .filter((t) => t)
//           .map((tag, idx) => (
//             <div
//               key={`${tag}-${idx}`}
//               className="relative group text-xs px-2 py-1 rounded bg-gray-200 flex items-center"
//             >
//               {tag}
//               <span
//                 onClick={async (e) => {
//                   e.stopPropagation(); // ✅ Prevent card click on tag remove
//                   try {
//                     const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${item._id}/remove-tag`, {
//                       method: 'PUT',
//                       headers: { 'Content-Type': 'application/json' },
//                       body: JSON.stringify({ tag }),
//                     });
//                     if (res.ok) {
//                       toast.success('Tag removed');
//                       fetchSpaces();
//                     } else {
//                       toast.error('Failed to remove tag');
//                     }
//                   } catch (err) {
//                     console.error(err);
//                     toast.error('Error while removing tag');
//                   }
//                 }}
//                 className="ml-2 text-sm text-red-500 hidden group-hover:inline cursor-pointer"
//               >
//                 ×
//               </span>
//             </div>
//           ))}
//       </div>
//     </CardContent>
//   </Card>
// ))}

//         </div>

//         <div className="mt-6">
//           <Pagination>
//             <PaginationContent>
//               {Array.from({ length: totalPages }).map((_, i) => (
//                 <PaginationItem key={i}>
//                   <PaginationLink isActive={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>
//                     {i + 1}
//                   </PaginationLink>
//                 </PaginationItem>
//               ))}
//             </PaginationContent>
//           </Pagination>
//         </div>

//         {showUploadModal && (
//           <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//             <div className="bg-white rounded-xl shadow-lg p-6 w-96">
//               <h2 className="text-lg font-semibold mb-4">Upload Inventory Excel</h2>
//               <div className="mb-4 text-sm">
//                 Selected File:
//                 <div className="font-medium mt-1">{selectedFile?.name}</div>
//               </div>
//               <label className="block mb-4">
//                 <span className="text-sm text-gray-700">Change File:</span>
//                 <input
//                   type="file"
//                   accept=".xlsx, .csv"
//                   onChange={(e) => setSelectedFile(e.target.files[0])}
//                   className="mt-1 block w-full text-sm"
//                 />
//               </label>
//               <div className="flex justify-end gap-2">
//                 <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 rounded bg-gray-300 text-black hover:bg-gray-400">
//                   Cancel
//                 </button>
//                 <button onClick={handleConfirmUpload} className="px-4 py-2 rounded bg-black text-white hover:bg-gray-900">
//                   Save
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {showDateModal && (
//           <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//             <div className="bg-white rounded-xl shadow-lg p-6 w-96">
//               <h2 className="text-lg font-semibold mb-4">Select Date Range</h2>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">Start Date</label>
//                 <input
//                   type="date"
//                   className="mt-1 block w-full border rounded px-3 py-2"
//                   value={tempStartDate}
//                   onChange={(e) => setTempStartDate(e.target.value)}
//                 />
//               </div>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">End Date</label>
//                 <input
//                   type="date"
//                   className="mt-1 block w-full border rounded px-3 py-2"
//                   value={tempEndDate}
//                   onChange={(e) => setTempEndDate(e.target.value)}
//                 />
//               </div>
//               <div className="flex gap-2 mt-[5%]">
//                 <button onClick={() => setShowDateModal(false)} className="px-4 py-2 text-xs rounded bg-gray-300 text-black hover:bg-gray-400">
//                   Cancel
//                 </button>
//                 <button
//                   onClick={() => {
//                     setStartDate(tempStartDate);
//                     setEndDate(tempEndDate);
//                     setShowDateModal(false);
//                   }}
//                   className="px-4 ml-auto py-2 text-xs rounded bg-black text-white hover:bg-gray-900"
//                 >
//                   Apply
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }



// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Navbar from './Navbar';
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';
// import toast from 'react-hot-toast';

// // Import Leaflet for Map View
// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';

// // Import the date range picker and its CSS
// import { DateRange } from 'react-date-range';
// import 'react-date-range/dist/styles.css'; // main style file
// import 'react-date-range/dist/theme/default.css'; // theme css file

// // Fix for default Leaflet marker icon issue which can occur with bundlers like Vite/Webpack
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
//   iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
// });


// // --- UI HELPER COMPONENTS (No changes) ---
// const Button = ({ children, className = '', ...props }) => (
//   <button className={`px-4 py-2 rounded-md bg-black text-white text-xs font-medium hover:bg-gray-800 transition ${className}`} {...props}>
//     {children}
//   </button>
// );

// const Pagination = ({ currentPage, totalPages, onPageChange }) => (
//   <div className="flex justify-center mt-8">
//     <div className="flex gap-2 flex-wrap">
//       {Array.from({ length: totalPages }).map((_, i) => (
//         <button
//           key={i}
//           onClick={() => onPageChange(i + 1)}
//           className={`px-3 py-1 rounded-md text-sm ${i + 1 === currentPage ? 'bg-black text-white' : 'bg-white border border-gray-300 hover:bg-gray-100'} transition`}
//         >
//           {i + 1}
//         </button>
//       ))}
//     </div>
//   </div>
// );

// const AvailabilityBadge = ({ availabilityStatus }) => {
//   let colorClasses, text;

//   switch (availabilityStatus) {
//     case 'Completely booked':
//     case 'Booked':
//       colorClasses = 'bg-red-100 text-red-700';
//       text = 'Booked';
//       break;
//     case 'Partially available':
//       colorClasses = 'bg-yellow-100 text-yellow-700';
//       text = 'Partially Available';
//       break;
//     case 'Overlapping booking':
//       colorClasses = 'bg-orange-100 text-orange-700';
//       text = 'Overlapping Booking';
//       break;
//     case 'Completely available':
//     default:
//       colorClasses = 'bg-green-100 text-green-700';
//       text = 'Completely Available';
//       break;
//   }

//   return (
//     <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${colorClasses}`}>
//       {text}
//     </span>
//   );
// };


// // --- VIEW COMPONENTS (No changes) ---
// const InventoryGridView = ({ data, onTagUpdate, navigate }) => {
//   if (!data || data.length === 0) {
//     return <div className="text-center py-10 text-gray-500">No inventories found.</div>;
//   }

//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
//       {data.map((item) => {
//         const tags = Array.isArray(item.tags)
//           ? item.tags
//           : String(item.tags || '').split(',').filter(tag => tag.trim() !== '');

//         return (
//           <div
//             key={item._id}
//             className="bg-white border border-gray-200 shadow-sm rounded-lg hover:shadow-md cursor-pointer transition-shadow flex flex-col"
//             onClick={() => navigate(`/space/${item._id}`)}
//           >
//             <img src={item.mainPhoto || 'https://via.placeholder.com/300x200'} alt="Space" className="w-full h-40 object-cover rounded-t-lg bg-gray-100" />
//             <div className="p-4 flex flex-col flex-grow">
//               <div className="flex-grow">
//                 <div className="flex justify-between items-start gap-2">
//                   <h3 className="font-semibold text-gray-800 leading-tight">{item.spaceName}</h3>
//                   <div className="flex-shrink-0">
//                     <AvailabilityBadge availabilityStatus={item.availability} />
//                   </div>
//                 </div>
//                 <p className="text-sm text-gray-500 mt-1 mb-3">{item.address || 'No address provided'}</p>

//                 <div className="flex gap-2 flex-wrap mb-2">
//                   <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">{item.city || 'N/A'}</span>
//                   <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">{item.spaceType || 'N/A'}</span>
//                 </div>
//                 <div className="flex gap-1.5 flex-wrap">
//                   {tags.map((tag, idx) => (
//                     <div key={idx} className="relative group text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700 flex items-center">
//                       {tag}
//                       <span
//                         onClick={(e) => { e.stopPropagation(); onTagUpdate('remove', item._id, tag); }}
//                         className="ml-1.5 text-red-500 hidden group-hover:inline cursor-pointer font-bold"
//                       >×</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div className="mt-4 text-xs">
//                 <input
//                   placeholder="+ Add Tag"
//                   className="px-2 py-1 w-full border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   onKeyDown={(e) => {
//                     e.stopPropagation();
//                     if (e.key === 'Enter' && e.target.value.trim()) {
//                       onTagUpdate('add', item._id, e.target.value.trim());
//                       e.target.value = '';
//                     }
//                   }}
//                   onClick={(e) => e.stopPropagation()}
//                 />
//               </div>
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// const InventoryTableView = ({ data, currentPage, limit, navigate }) => {
//   if (!data || data.length === 0) {
//     return <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm">No inventories found.</div>;
//   }

//   return (
//     <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
//       <table className="w-full text-xs text-left text-gray-600">
//         <thead className="text-xs text-gray-700 uppercase bg-gray-50">
//           <tr>
//             <th scope="col" className="px-6 py-3">#</th>
//             <th scope="col" className="px-6 py-3">Space Name</th>
//             <th scope="col" className="px-6 py-3">City</th>
//             <th scope="col" className="px-6 py-3">Category</th>
//             <th scope="col" className="px-6 py-3">Availability</th>
//             <th scope="col" className="px-6 py-3">Ownership </th>
//             <th scope="col" className="px-6 py-3">Inventory ID</th>
//           </tr>
//         </thead>
//         <tbody>
//           {data.map((item, index) => (
//             <tr key={item._id} className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/space/${item._id}`)}>
//               <td className="px-6 py-4 text-gray-500">{(currentPage - 1) * limit + index + 1}</td>
//               <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
//                 <div className="flex items-center gap-3">
//                   <img src={item.mainPhoto || 'https://via.placeholder.com/40'} alt={item.spaceName} className="w-10 h-10 object-cover rounded-md bg-gray-100" />
//                   <div>
//                     <div className="font-semibold text-gray-800">{item.spaceName}</div>
//                     <div className="text-gray-500 text-xs">{item.address}</div>
//                   </div>
//                 </div>
//               </td>
//               <td className="px-6 py-4">{item.city}</td>
//               <td className="px-6 py-4">{item.spaceType}</td>
//               <td className="px-6 py-4">
//                 <AvailabilityBadge availabilityStatus={item.availability} />
//               </td>
//               <td className="px-6 py-4">
//                {item.ownershipType}
//               </td>
//               <td className="px-6 py-4 font-mono text-xs text-gray-500">{item.inventoryId || item._id.slice(-8).toUpperCase()}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// const InventoryMapView = ({ data }) => {
//   const spacesWithCords = data
//     .map(space => {
//       const lat = parseFloat(space.latitude);
//       const lon = parseFloat(space.longitude);
//       if (!isNaN(lat) && !isNaN(lon)) {
//         return { ...space, latitude: lat, longitude: lon };
//       }
//       return null;
//     })
//     .filter(space => space !== null);

//   const DEFAULT_CENTER = [19.0760, 72.8777]; // Mumbai

//   const mapCenter = spacesWithCords.length > 0
//     ? [spacesWithCords[0].latitude, spacesWithCords[0].longitude]
//     : DEFAULT_CENTER;
  
//   return (
//     <div className="h-[60vh] w-full rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//       <MapContainer center={mapCenter} zoom={10} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
//         <TileLayer
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//         />
        
//         {spacesWithCords.map(item => (
//           <Marker key={item._id} position={[item.latitude, item.longitude]}>
//             <Popup><b>{item.spaceName}</b><br/>{item.address || 'No address available'}</Popup>
//           </Marker>
//         ))}
//       </MapContainer>
//     </div>
//   );
// }

// // --- MAIN DASHBOARD COMPONENT ---
// export default function InventoryDashboard() {
//   const navigate = useNavigate();

//   // State for data and pagination
//   const [spaces, setSpaces] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalCount, setTotalCount] = useState(0);
//   const [viewMode, setViewMode] = useState('table');
//   const limit = 10;

//   // State for filters
//   const [search, setSearch] = useState('');
//   const [selectedRegion, setSelectedRegion] = useState('');
//   const [availability, setAvailability] = useState('');
//   const [spaceType, setSpaceType] = useState('');
//   const [ownershipType, setOwnershipType] = useState('');
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');

//   // State for modals and popovers
//   const [showUploadModal, setShowUploadModal] = useState(false);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [showDateModal, setShowDateModal] = useState(false);
  
//   // State for the date range picker
//   const [dateRange, setDateRange] = useState([{ startDate: null, endDate: null, key: 'selection' }]);
//   // const [tempDateRange, setTempDateRange] = useState(dateRange);
//   const [tempDateRange, setTempDateRange] = useState([{ startDate: null, endDate: null, key: 'selection' }]);


//   // --- DATA FETCHING ---
//   const fetchSpaces = async () => {
//     try {
//       const token = localStorage.getItem('accessToken');
//       const params = new URLSearchParams({ 
//         page: currentPage, 
//         limit, 
//         search, 
//         region: selectedRegion, 
//         availability, 
//         spaceType, 
//         ownershipType,
//         ...(startDate && endDate && { startDate, endDate }), 
//       });
//       const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/listInventory?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
//       if (res.status === 403) { localStorage.clear(); navigate('/login'); return; }
//       const data = await res.json();
//       setSpaces(data.spaces);
//       setTotalCount(data.totalCount);
//     } catch (error) { toast.error("Failed to fetch inventories."); }
//   };

//   // Re-fetch data when any filter changes
//   useEffect(() => { fetchSpaces(); }, [search, selectedRegion, availability, startDate, endDate, currentPage, spaceType, ownershipType]);
  
//   // const handleCancelDateFilter = useCallback(() => {
//   //   setTempDateRange(dateRange);
//   //   setShowDateModal(false);
//   // }, [dateRange]);
//   const handleCancelDateFilter = useCallback(() => {
//     setTempDateRange([{ startDate: null, endDate: null, key: 'selection' }]);
//     setShowDateModal(false);
//   }, []);

//   // --- HANDLER FUNCTIONS ---
//   const handleTagUpdate = async (action, spaceId, tag) => {
//     try {
//       const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${spaceId}/${action}-tag`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tag }) });
//       if (res.ok) { toast.success(`Tag ${action === 'add' ? 'added' : 'removed'}`); fetchSpaces(); }
//       else { toast.error(`Failed to ${action} tag`); }
//     } catch (err) { toast.error(`Error while trying to ${action} tag`); }
//   };

//   const handleDownloadExcel = () => {
//     if (spaces.length === 0) { toast.error("No data to download."); return; }
//     const excelData = spaces.map(item => ({
//       'Space Name': item.spaceName, 'Address': item.address, 'City': item.city,
//       'State': item.state, 'Zone': item.zone, 'Space Type': item.spaceType,
//       'Availability': item.availability, 'Units': item.unit,
//       'Occupied Units': item.occupiedUnits, 'Price': item.price,
//       'Inventory ID': item.inventoryId || item._id, 'Tags': (Array.isArray(item.tags) ? item.tags : String(item.tags || '').split(',')).join(', ')
//     }));
//     const worksheet = XLSX.utils.json_to_sheet(excelData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventories');
//     const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
//     const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
//     saveAs(dataBlob, 'inventories.xlsx');
//   };

//   const handleConfirmUpload = async () => {
//     if (!selectedFile) return;
//     const formData = new FormData();
//     formData.append('file', selectedFile);

//     try {
//       const token = localStorage.getItem('accessToken');
//       const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/upload-excel`, {
//         method: 'POST',
//         headers: { 'Authorization': `Bearer ${token}` },
//         body: formData,
//       });
//       const result = await response.json();
//       if (response.ok) {
//         toast.success(`Successfully uploaded ${result.count} inventories`);
//         setShowUploadModal(false);
//         setSelectedFile(null);
//         fetchSpaces();
//       } else { toast.error(result.error || 'Upload failed'); }
//     } catch (error) { toast.error('Something went wrong while uploading'); }
//   };

//   const resetFilters = () => {
//     setSearch(''); setSelectedRegion(''); setAvailability(''); setStartDate(''); setEndDate(''); setCurrentPage(1); setSpaceType(''); setOwnershipType('');
//     const initialRange = [{ startDate: null, endDate: null, key: 'selection' }];
//     setDateRange(initialRange);
//     setTempDateRange(initialRange);
//   };
  
//   // const formatDate = (date) => {
//   //   if (!date) return '';
//   //   const adjustedDate = new Date(date.getTime() + Math.abs(date.getTimezoneOffset() * 60000))
//   //   return adjustedDate.toISOString().split('T')[0];
//   // }
//   const formatDate = (date) => {
//     if (!date) return '';
//     const adjustedDate = new Date(date.getTime() + Math.abs(date.getTimezoneOffset() * 60000));
//     return adjustedDate.toISOString().split('T')[0];
//   };

//   // const handleApplyDateFilter = () => {
//   //   setDateRange(tempDateRange);
//   //   setStartDate(formatDate(tempDateRange[0].startDate));
//   //   setEndDate(formatDate(tempDateRange[0].endDate));
//   //   setShowDateModal(false);
//   // }
//   const handleApplyDateFilter = () => {
//     setDateRange(tempDateRange);
//     setStartDate(formatDate(tempDateRange[0].startDate));
//     setEndDate(formatDate(tempDateRange[0].endDate));
//     setShowDateModal(false);
//   };
//   const handleShowDateModal = () => {
//     // This will open the modal with an empty date range
//     setShowDateModal(true);
//     setTempDateRange([{ startDate: null, endDate: null, key: 'selection' }]);
//   };
  
//   const totalPages = Math.ceil(totalCount / limit);

//   return (
//     <div className="min-h-screen bg-gray-50 w-screen text-black flex flex-col lg:flex-row">
//       <Navbar />
//       <main className="flex-1 h-screen overflow-y-auto px-4 md:px-6 py-8 ml-0 lg:ml-64">
//         <div className="flex flex-col md:flex-row justify-between items-center gap-4">
//           <h2 className="text-2xl md:text-3xl font-sans font-normal">List of Spaces</h2>
//           <div className="flex items-center gap-2 text-xs">
//             <Button onClick={() => navigate('/add-space')}>+ Add Space</Button>
//             <input type="file" accept=".xlsx, .csv" id="excel-upload" onChange={(e) => {
//               if(e.target.files[0]) { setSelectedFile(e.target.files[0]); setShowUploadModal(true); }
//             }} className="hidden" />
//             <label htmlFor="excel-upload" className="cursor-pointer px-4 py-2 rounded-md bg-black text-white text-xs font-medium hover:bg-gray-800 transition">Upload Excel</label>
//             <Button onClick={handleDownloadExcel}>Download Excel</Button>
//           </div>
//         </div>

//         <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
//           <div className="flex flex-col md:flex-row items-center justify-between gap-4">
//             <input
//               type="text"
//               placeholder="Search by name, address, city, tags..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="w-[50%] px-4 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//             <div className="flex items-center gap-2 flex-shrink-0">
//               <div className="flex items-center p-1 bg-gray-100 rounded-lg border">
//                 {[
//                   { mode: 'table', icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg> },
//                   { mode: 'grid', icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
//                 ].map(v => (
//                   <button key={v.mode} onClick={() => setViewMode(v.mode)} className={`p-1.5 rounded-md ${viewMode === v.mode ? 'bg-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}>
//                     {v.icon}
//                   </button>
//                 ))}
//               </div>
//               <button onClick={resetFilters} className="px-4 py-2 border border-gray-300 rounded-md text-xs font-medium hover:bg-gray-100">Reset Filters</button>
//             </div>
//           </div>
//           <div className="mt-4 flex flex-wrap gap-3 text-xs items-center">
//             <input className="px-3 py-2 border rounded-md w-full md:w-auto" value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} placeholder="City/State/Zone" />
//             <select className="px-3 py-2 border rounded-md w-full md:w-auto bg-white" value={spaceType} onChange={(e) => setSpaceType(e.target.value)}>
//               <option value="">All Space Types</option>
//               <option value="Billboard">Billboard</option>
//               <option value="DOOH">DOOH</option>
//               <option value="Pole kiosk">Pole kiosk</option>
//               <option value="Gantry">Gantry</option>
//             </select>

//             <select className="px-3 py-2 border rounded-md w-full md:w-auto bg-white" value={ownershipType} onChange={(e) => setOwnershipType(e.target.value)}>
//               <option value="">All Ownerships</option>
//               <option value="Owned">Owned</option>
//               <option value="Leased">Leased</option>
//               <option value="Traded">Traded</option>
//             </select>

//             <select className="px-3 py-2 border rounded-md w-full md:w-auto bg-white" value={availability} onChange={(e) => setAvailability(e.target.value)}>
//               <option value="">All Availabilities</option>
//               <option value="Completely available">Completely Available</option>
//               <option value="Partially available">Partially Available</option>
//               <option value="Completely booked">Completely Booked</option>
//               <option value="Overlapping booking">Overlapping Booking</option>
//             </select>
            
//             <div className="w-full md:w-auto">
//               <button onClick={handleShowDateModal} className="px-4 py-2 border rounded-md hover:bg-gray-100 w-full text-left">
//                 {startDate && endDate ? `${startDate} to ${endDate}` : "Date Filter"}
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="mt-6">
//           {viewMode === 'table' && <InventoryTableView data={spaces} currentPage={currentPage} limit={limit} navigate={navigate} />}
//           {viewMode === 'grid' && <InventoryGridView data={spaces} onTagUpdate={handleTagUpdate} navigate={navigate} />}
//           {viewMode === 'map' && <InventoryMapView data={spaces} />}
//         </div>

//         {totalPages > 1 && viewMode !== 'map' && (
//           <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
//         )}
        
//         {/* --- MODALS --- */}

//         {/* Date Picker Modal */}
//         {showDateModal && (
//           <div
//             className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
//             onClick={handleCancelDateFilter}
//           >
//             <div
//               className="bg-white rounded-xl shadow-lg p-2"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <DateRange
//                 editableDateInputs={true}
//                 onChange={item => setTempDateRange([item.selection])}
//                 moveRangeOnFirstSelection={false}
//                 ranges={tempDateRange}
//                 rangeColors={['#000000']}
//                 months={1}
//                 direction="horizontal"
//               />
             

//               <div className="flex justify-end gap-2 p-2 border-t">
//                 <button onClick={handleCancelDateFilter} className="px-4 py-1.5 rounded-md bg-gray-200 text-black hover:bg-gray-300 font-medium text-sm">Cancel</button>
//                 <button onClick={handleApplyDateFilter} className="px-4 py-1.5 rounded-md bg-black text-white hover:bg-gray-800 font-medium text-sm">Apply</button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Upload Excel Modal */}
//         {showUploadModal && (
//           <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//             <div className="bg-white rounded-xl shadow-lg p-6 w-96">
//               <h2 className="text-lg font-semibold mb-4">Upload Inventory Excel</h2>
//               <p className="mb-4 text-sm">Selected File: <span className="font-medium">{selectedFile?.name}</span></p>
//               <div className="flex justify-end gap-2">
//                 <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 rounded-md bg-gray-200 text-black hover:bg-gray-300">Cancel</button>
//                 <button onClick={handleConfirmUpload} className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900">Save & Upload</button>
//               </div>
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }


import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

// Import Leaflet for Map View
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Import the date range picker and its CSS
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file

// Fix for default Leaflet marker icon issue which can occur with bundlers like Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


// --- UI HELPER COMPONENTS (No changes) ---
const Button = ({ children, className = '', ...props }) => (
  <button className={`px-4 py-2 rounded-md bg-black text-white text-xs font-medium hover:bg-gray-800 transition ${className}`} {...props}>
    {children}
  </button>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex justify-center mt-8">
    <div className="flex gap-2 flex-wrap">
      {Array.from({ length: totalPages }).map((_, i) => (
        <button
          key={i}
          onClick={() => onPageChange(i + 1)}
          className={`px-3 py-1 rounded-md text-sm ${i + 1 === currentPage ? 'bg-black text-white' : 'bg-white border border-gray-300 hover:bg-gray-100'} transition`}
        >
          {i + 1}
        </button>
      ))}
    </div>
  </div>
);

const AvailabilityBadge = ({ availabilityStatus }) => {
  let colorClasses, text;

  switch (availabilityStatus) {
    case 'Completely booked':
    case 'Booked':
      colorClasses = 'bg-red-100 text-red-700';
      text = 'Booked';
      break;
    case 'Partially available':
      colorClasses = 'bg-yellow-100 text-yellow-700';
      text = 'Partially Available';
      break;
    case 'Overlapping booking':
      colorClasses = 'bg-orange-100 text-orange-700';
      text = 'Overlapping Booking';
      break;
    case 'Completely available':
    default:
      colorClasses = 'bg-green-100 text-green-700';
      text = 'Completely Available';
      break;
  }

  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${colorClasses}`}>
      {text}
    </span>
  );
};


// --- VIEW COMPONENTS (No changes) ---
const InventoryGridView = ({ data, onTagUpdate, navigate }) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-10 text-gray-500">No inventories found.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 text-xs gap-5">
      {data.map((item) => {
        const tags = Array.isArray(item.tags)
          ? item.tags
          : String(item.tags || '').split(',').filter(tag => tag.trim() !== '');

        return (
          <div
            key={item._id}
            className="bg-white border border-gray-200 shadow-sm rounded-lg text-xs hover:shadow-md cursor-pointer transition-shadow flex flex-col"
            onClick={() => navigate(`/space/${item._id}`)}
          >
            <img src={item.mainPhoto || 'https://via.placeholder.com/300x200'} alt="Space" className="w-full h-40 object-cover rounded-t-lg bg-gray-100" />
            <div className="p-4 flex flex-col flex-grow">
              <div className="flex-grow">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-gray-800 leading-tight">{item.spaceName}</h3>
                  <div className="flex-shrink-0">
                    <AvailabilityBadge availabilityStatus={item.availability} />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1 mb-3">{item.address || 'No address provided'}</p>

                <div className="flex gap-2 text-xs flex-wrap mb-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">{item.city || 'N/A'}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">{item.spaceType || 'N/A'}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {tags.map((tag, idx) => (
                    <div key={idx} className="relative group text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700 flex items-center">
                      {tag}
                      <span
                        onClick={(e) => { e.stopPropagation(); onTagUpdate('remove', item._id, tag); }}
                        className="ml-1.5 text-red-500 hidden group-hover:inline cursor-pointer font-bold"
                      >×</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 text-xs">
                <input
                  placeholder="+ Add Tag"
                  className="px-2 py-1 w-full border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      onTagUpdate('add', item._id, e.target.value.trim());
                      e.target.value = '';
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const InventoryTableView = ({ data, currentPage, limit, navigate }) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm">No inventories found.</div>;
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
      <table className="w-full text-xs text-left text-gray-600">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">#</th>
            <th scope="col" className="px-6 py-3">Space Name</th>
            <th scope="col" className="px-6 py-3">City</th>
            <th scope="col" className="px-6 py-3">Category</th>
            <th scope="col" className="px-6 py-3">Availability</th>
            <th scope="col" className="px-6 py-3">Ownership </th>
            <th scope="col" className="px-6 py-3">Inventory ID</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item._id} className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/space/${item._id}`)}>
              <td className="px-6 py-4 text-gray-500">{(currentPage - 1) * limit + index + 1}</td>
              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <img src={item.mainPhoto || 'https://via.placeholder.com/40'} alt={item.spaceName} className="w-10 h-10 object-cover rounded-md bg-gray-100" />
                  <div>
                    <div className="font-semibold text-gray-800">{item.spaceName}</div>
                    <div className="text-gray-500 text-xs">{item.address}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">{item.city}</td>
              <td className="px-6 py-4">{item.spaceType}</td>
              <td className="px-6 py-4">
                <AvailabilityBadge availabilityStatus={item.availability} />
              </td>
              <td className="px-6 py-4">
               {item.ownershipType}
              </td>
              <td className="px-6 py-4 font-mono text-xs text-gray-500">{item.inventoryId || item._id.slice(-8).toUpperCase()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const InventoryMapView = ({ data }) => {
  const spacesWithCords = data
    .map(space => {
      const lat = parseFloat(space.latitude);
      const lon = parseFloat(space.longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { ...space, latitude: lat, longitude: lon };
      }
      return null;
    })
    .filter(space => space !== null);

  const DEFAULT_CENTER = [19.0760, 72.8777]; // Mumbai

  const mapCenter = spacesWithCords.length > 0
    ? [spacesWithCords[0].latitude, spacesWithCords[0].longitude]
    : DEFAULT_CENTER;
  
  return (
    <div className="h-[60vh] w-full rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <MapContainer center={mapCenter} zoom={10} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {spacesWithCords.map(item => (
          <Marker key={item._id} position={[item.latitude, item.longitude]}>
            <Popup><b>{item.spaceName}</b><br/>{item.address || 'No address available'}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// --- MAIN DASHBOARD COMPONENT ---
export default function InventoryDashboard() {
  const navigate = useNavigate();

  // State for data and pagination
  const [spaces, setSpaces] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState('table');
  const limit = 10;

  // State for filters
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [availability, setAvailability] = useState('');
  const [spaceType, setSpaceType] = useState('');
  const [ownershipType, setOwnershipType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // State for modals and popovers
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  
  // State for the date range picker
  const [dateRange, setDateRange] = useState([{ startDate: new Date(), endDate: '', key: 'selection' }]);
  const [tempDateRange, setTempDateRange] = useState([{ startDate: new Date(), endDate: '', key: 'selection' }]);


  // --- DATA FETCHING ---
  const fetchSpaces = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({ 
        page: currentPage, 
        limit, 
        search, 
        region: selectedRegion, 
        availability, 
        spaceType, 
        ownershipType,
        ...(startDate && endDate && { startDate, endDate }), 
      });
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/listInventory?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 403) { localStorage.clear(); navigate('/login'); return; }
      const data = await res.json();
      setSpaces(data.spaces);
      setTotalCount(data.totalCount);
    } catch (error) { toast.error("Failed to fetch inventories."); }
  };

  // Re-fetch data when any filter changes
  useEffect(() => { fetchSpaces(); }, [search, selectedRegion, availability, startDate, endDate, currentPage, spaceType, ownershipType]);
  
  const handleCancelDateFilter = useCallback(() => {
    setTempDateRange([{ startDate: null, endDate: null, key: 'selection' }]);
    setShowDateModal(false);
  }, []);

  // --- HANDLER FUNCTIONS ---
  const handleTagUpdate = async (action, spaceId, tag) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${spaceId}/${action}-tag`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tag }) });
      if (res.ok) { toast.success(`Tag ${action === 'add' ? 'added' : 'removed'}`); fetchSpaces(); }
      else { toast.error(`Failed to ${action} tag`); }
    } catch (err) { toast.error(`Error while trying to ${action} tag`); }
  };

  const handleDownloadExcel = () => {
    if (spaces.length === 0) { toast.error("No data to download."); return; }
    const excelData = spaces.map(item => ({
      'Space Name': item.spaceName, 'Address': item.address, 'City': item.city,
      'State': item.state, 'Zone': item.zone, 'Space Type': item.spaceType,
      'Availability': item.availability, 'Units': item.unit,
      'Occupied Units': item.occupiedUnits, 'Price': item.price,
      'Inventory ID': item.inventoryId || item._id, 'Tags': (Array.isArray(item.tags) ? item.tags : String(item.tags || '').split(',')).join(', ')
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventories');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(dataBlob, 'inventories.xlsx');
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/upload-excel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();
      if (response.ok) {
        toast.success(`Successfully uploaded ${result.count} inventories`);
        setShowUploadModal(false);
        setSelectedFile(null);
        fetchSpaces();
      } else { toast.error(result.error || 'Upload failed'); }
    } catch (error) { toast.error('Something went wrong while uploading'); }
  };

  const resetFilters = () => {
    setSearch(''); setSelectedRegion(''); setAvailability(''); setStartDate(''); setEndDate(''); setCurrentPage(1); setSpaceType(''); setOwnershipType('');
    const initialRange = [{ startDate: null, endDate: null, key: 'selection' }];
    setDateRange(initialRange);
    setTempDateRange(initialRange);
  };
  
  // const formatDate = (date) => {
  //   if (!date) return '';
  //   const adjustedDate = new Date(date.getTime() + Math.abs(date.getTimezoneOffset() * 60000));
  //   return adjustedDate.toISOString().split('T')[0];
  // };
  const formatDate = (date) => {
    if (!date) return '';
    const adjustedDate = new Date(date.getTime() + Math.abs(date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
  };

  

  const handleApplyDateFilter = () => {
    setDateRange(tempDateRange);
    setStartDate(formatDate(tempDateRange[0].startDate));
    setEndDate(formatDate(tempDateRange[0].endDate));
    setShowDateModal(false);
  };
  const handleShowDateModal = () => {
    setShowDateModal(true);
    setTempDateRange([{ startDate: new Date(), endDate: new Date(), key: 'selection' }]);
  };

 
  
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="min-h-screen bg-gray-50 w-screen text-black flex flex-col lg:flex-row">
      <Navbar />
      <main className="flex-1 h-screen overflow-y-auto px-4 md:px-6 py-8 ml-0 lg:ml-64">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-sans font-normal">Inventories </h2>
          <div className="flex items-center gap-2 text-xs">
            <Button onClick={() => navigate('/add-space')}>+ Add Space</Button>
            <input type="file" accept=".xlsx, .csv" id="excel-upload" onChange={(e) => {
              if(e.target.files[0]) { setSelectedFile(e.target.files[0]); setShowUploadModal(true); }
            }} className="hidden" />
            <label htmlFor="excel-upload" className="cursor-pointer px-4 py-2 rounded-md bg-black text-white text-xs font-medium hover:bg-gray-800 transition">Upload Excel</label>
            <Button onClick={handleDownloadExcel}>Download Excel</Button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <input
              type="text"
              placeholder="Search by name, address, city, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[50%] px-4 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center p-1 bg-gray-100 rounded-lg border">
                {[
                  { mode: 'table', icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg> },
                  { mode: 'grid', icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
                ].map(v => (
                  <button key={v.mode} onClick={() => setViewMode(v.mode)} className={`p-1.5 rounded-md ${viewMode === v.mode ? 'bg-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}>
                    {v.icon}
                  </button>
                ))}
              </div>
              <button onClick={resetFilters} className="px-4 py-2 border border-gray-300 rounded-md text-xs font-medium hover:bg-gray-100">Reset Filters</button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs items-center">
            <input className="px-3 py-2 border rounded-md w-full md:w-auto" value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} placeholder="City/State/Zone" />
            <select className="px-3 py-2 border rounded-md w-full md:w-auto bg-white" value={spaceType} onChange={(e) => setSpaceType(e.target.value)}>
              <option value="">All Space Types</option>
              <option value="Billboard">Billboard</option>
              <option value="DOOH">DOOH</option>
              <option value="Pole kiosk">Pole kiosk</option>
              <option value="Gantry">Gantry</option>
            </select>

            <select className="px-3 py-2 border rounded-md w-full md:w-auto bg-white" value={ownershipType} onChange={(e) => setOwnershipType(e.target.value)}>
              <option value="">All Ownerships</option>
              <option value="Owned">Owned</option>
              <option value="Leased">Leased</option>
              <option value="Traded">Traded</option>
            </select>

            <select className="px-3 py-2 border rounded-md w-full md:w-auto bg-white" value={availability} onChange={(e) => setAvailability(e.target.value)}>
              <option value="">All Availabilities</option>
              <option value="Completely available">Completely Available</option>
              <option value="Partially available">Partially Available</option>
              <option value="Completely booked">Completely Booked</option>
              <option value="Overlapping booking">Overlapping Booking</option>
            </select>
            
            <div className="w-full md:w-auto">
              <button onClick={handleShowDateModal} className="px-4 py-2 border rounded-md hover:bg-gray-100 w-full text-left">
                {startDate && endDate ? `${startDate} to ${endDate}` : "Date Filter"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {viewMode === 'table' && <InventoryTableView data={spaces} currentPage={currentPage} limit={limit} navigate={navigate} />}
          {viewMode === 'grid' && <InventoryGridView data={spaces} onTagUpdate={handleTagUpdate} navigate={navigate} />}
          {viewMode === 'map' && <InventoryMapView data={spaces} />}
        </div>

        {totalPages > 1 && viewMode !== 'map' && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        )}
        
        {/* --- MODALS --- */}

        {/* Date Picker Modal */}
        {showDateModal && (
          <div
            className="fixed inset-0 text-xs flex items-center justify-center bg-black bg-opacity-50 z-50"
            onClick={handleCancelDateFilter}
          >
            <div
              className="bg-white rounded-xl shadow-lg p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <DateRange
                editableDateInputs={true}
                onChange={item => setTempDateRange([item.selection])}
                moveRangeOnFirstSelection={false}
                ranges={tempDateRange}
                rangeColors={['#000000']}
                months={1}
                direction="horizontal"
              />
             

              <div className="flex justify-end gap-2 p-2 border-t">
                <button onClick={handleCancelDateFilter} className="px-4 py-1.5 rounded-md bg-gray-200 text-black hover:bg-gray-300 font-medium text-xs">Cancel</button>
                <button onClick={handleApplyDateFilter} className="px-4 py-1.5 rounded-md bg-black text-white hover:bg-gray-800 font-medium text-xs">Apply</button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Excel Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-96">
              <h2 className="text-lg font-semibold mb-4">Upload Inventory Excel</h2>
              <p className="mb-4 text-sm">Selected File: <span className="font-medium">{selectedFile?.name}</span></p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 rounded-md bg-gray-200 text-black hover:bg-gray-300">Cancel</button>
                <button onClick={handleConfirmUpload} className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900">Save & Upload</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}





