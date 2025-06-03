
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
//   <div className={`bg-white border shadow-sm rounded-xl w-full ${className}`} {...props}>
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

//   const fetchSpaces = async () => {
//     try {
//       const res = await fetch('http://localhost:3000/api/spaces');
//       const data = await res.json();
//       data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//       setSpaces(data);
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
//       const res = await fetch(`http://localhost:3000/api/spaces/active-spaces?from=${startDate}&to=${endDate}`);
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
//       const response = await fetch('http://localhost:3000/api/spaces/upload-excel', {
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

//   // const filteredData = spaces.filter((item) => {
//   //   const matchesSearch =
//   //     item.spaceName?.toLowerCase().includes(search.toLowerCase()) ||
//   //     item.city?.toLowerCase().includes(search.toLowerCase()) ||
//   //     item.state?.toLowerCase().includes(search.toLowerCase()) ||
//   //     item.zone?.toLowerCase().includes(search.toLowerCase()) ||
//   //     item.address?.toLowerCase().includes(search.toLowerCase());

//   //   const matchesRegion =
//   //     !selectedRegion ||
//   //     item.city?.toLowerCase().includes(selectedRegion.toLowerCase()) ||
//   //     item.state?.toLowerCase().includes(selectedRegion.toLowerCase()) ||
//   //     item.zone?.toLowerCase().includes(selectedRegion.toLowerCase());

//   //   const matchesAvailability =
//   //     availability === '' || item.availability === availability;

//   //   const isBooked = bookedSpaceIds.includes(item._id?.toString());


//   //   const matchesDateRange = (() => {
//   //     if (!startDate || !endDate) return true;

//   //     const start = new Date(startDate);
//   //     const end = new Date(endDate);
//   //     if (start > end) return false;

//   //     const requiredDates = [];
//   //     let current = new Date(start);
//   //     while (current <= end) {
//   //       requiredDates.push(current.toDateString());
//   //       current.setDate(current.getDate() + 1);
//   //     }

//   //     const availableDates = (item.dates || []).map(dateStr => {
//   //       const [day, month, year] = dateStr.split('-');
//   //       const fullYear = year.length === 2 ? `20${year}` : year;
//   //       return new Date(`${fullYear}-${month}-${day}`).toDateString();
//   //     });

//   //     return requiredDates.every(date => availableDates.includes(date));
//   //   })();

//   //   return matchesSearch && matchesRegion && matchesAvailability && matchesDateRange && !isBooked;
//   // });

//   const filteredData = spaces.filter((item) => {
//   const idStr = item._id?.toString();

//   const matchesSearch =
//     item.spaceName?.toLowerCase().includes(search.toLowerCase()) ||
//     item.city?.toLowerCase().includes(search.toLowerCase()) ||
//     item.state?.toLowerCase().includes(search.toLowerCase()) ||
//     item.zone?.toLowerCase().includes(search.toLowerCase()) ||
//     item.address?.toLowerCase().includes(search.toLowerCase());

//   const matchesRegion =
//     !selectedRegion ||
//     item.city?.toLowerCase().includes(selectedRegion.toLowerCase()) ||
//     item.state?.toLowerCase().includes(selectedRegion.toLowerCase()) ||
//     item.zone?.toLowerCase().includes(selectedRegion.toLowerCase());

//   const matchesAvailability =
//     availability === '' || item.availability === availability;

//   const isBooked = bookedSpaceIds.includes(idStr);

//   const matchesDateRange = (() => {
//     if (!startDate || !endDate) return true;

//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     if (start > end) return false;

//     const requiredDates = [];
//     let current = new Date(start);
//     while (current <= end) {
//       requiredDates.push(current.toDateString());
//       current.setDate(current.getDate() + 1);
//     }

//     const availableDates = (item.dates || []).map(dateStr => {
//       const parts = dateStr.split('-');
//       let date;
//       if (parts[0].length === 4) {
//         // YYYY-MM-DD
//         date = new Date(dateStr);
//       } else {
//         // DD-MM-YYYY
//         const [day, month, year] = parts;
//         const fullYear = year.length === 2 ? `20${year}` : year;
//         date = new Date(`${fullYear}-${month}-${day}`);
//       }
//       return date.toDateString();
//     });

//     const isValid = requiredDates.every(date => availableDates.includes(date));
//     if (!isValid) {
//       console.log('❌ Missing dates for range in:', idStr);
//       console.log('   Required:', requiredDates);
//       console.log('   Available:', availableDates);
//     }

//     return isValid;
//   })();

//   // Debug each condition
//   if (isBooked) console.log('🛑 Filtered (booked):', idStr);
//   if (!matchesDateRange) console.log('🛑 Filtered (date range):', idStr);
//   if (!matchesSearch) console.log('🛑 Filtered (search):', idStr);
//   if (!matchesRegion) console.log('🛑 Filtered (region):', idStr);
//   if (!matchesAvailability) console.log('🛑 Filtered (availability):', idStr);

//   const isIncluded = matchesSearch && matchesRegion && matchesAvailability && matchesDateRange && !isBooked;
//   if (isIncluded) console.log('✅ Included:', idStr);

//   return isIncluded;
// });

//   const paginatedData = filteredData.slice((currentPage - 1) * 10, currentPage * 10);
//   const totalPages = Math.ceil(filteredData.length / 10);

//   useEffect(() => {
//     const timeout = setTimeout(() => {
//       setIsAnimated(true);
//     }, 50);
//     return () => clearTimeout(timeout);
//   }, [paginatedData]);

//   return (
//     <div className="min-h-screen bg-[#fafafb] h-screen w-screen bg-white text-black flex flex-col lg:flex-row overflow-hidden">
//       <Navbar />
//       <main className="flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 ml-0 lg:ml-64">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
//           <h1 className="text-1xl md:text-2xl font-semibold">Inventories</h1>
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
//             <Input type="date" className="md:w-40" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
//             <Input type="date" className="md:w-40" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
//             <Input className="md:w-40" value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} placeholder="Enter City/State/Zone" />
//             <select className="border px-3 py-2 rounded w-full md:w-40" value={availability} onChange={(e) => setAvailability(e.target.value)}>
//               <option value="">All</option>
//               <option value="Completely available">Completely available</option>
//               <option value="Partialy available">Partialy available</option>
//               <option value="Completely booked">Completely booked</option>
//             </select>
//           </div>
//         </div>

//         <div className="mt-6 grid grid-cols-1 gap-4 w-full">
//           {paginatedData.map((item, index) => (
//             <Card
//               key={item._id}
//               className={`hover:shadow-md hover:border-2  hover:scale-100 cursor-pointer transform transition-all duration-700 ease-out ${isAnimated ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
//               style={{ transitionDelay: `${index * 100}ms` }}
//               onClick={() => navigate(`/space/${item._id}`)}
//             >
//               <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//                 <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
//                   {item.mainPhoto ? (
//                     <img src={`${item.mainPhoto}`} alt="Main Photo" className="w-full h-[130%] object-cover" />
//                   ) : (
//                     <img src={`${item.mainPhoto}`} alt="" className="w-full h-[130%] object-cover" />
//                   )}
//                 </div>
//                 <div className="flex-1 flex flex-col gap-1">
//                   <div className="text-sm font-semibold break-words">{item.spaceName}</div>
//                   <div className="text-xs text-gray-600">{item.address || 'No address provided'}</div>
//                 </div>
                
//                 <div className="flex gap-2 items-center">
//   <span className="text-xs px-2 py-1 rounded bg-green-200">{item.city || 'City'}</span>
//   <span className="text-xs px-2 py-1 bg-purple-100 rounded">{item.spaceType || 'Type'}</span>

//   {(() => {
//     const totalUnits = item.unit || 0;
//     const occupied = item.occupiedUnits || 0;
//     let status = 'Completely available';
//     let color = 'bg-green-100';

//     if (totalUnits === occupied && occupied !== 0) {
//       status = 'Completely booked';
//       color = 'bg-red-100';
//     } else if (occupied > 0 && occupied < totalUnits) {
//       status = 'Partially available';
//       color = 'bg-yellow-100';
//     }

//     return (
//       <span className={`text-xs px-2 py-1 rounded ${color}`}>{status}</span>
//     );
//   })()}
// </div>

//               </CardContent>
//             </Card>
//           ))}
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
//       </main>
//     </div>
//   );
// }


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

const Button = ({ children, className = '', ...props }) => (
  <button className={`px-4 py-2 rounded bg-black text-white hover: transition ${className}`} {...props}>
    {children}
  </button>
);

const Input = ({ className = '', ...props }) => (
  <input className={`border px-3 py-2 rounded w-full ${className}`} {...props} />
);

const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white border shadow-sm rounded-xl w-full ${className}`} {...props}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-3 py-2 ${className}`}>{children}</div>
);

const Pagination = ({ children }) => <div className="flex justify-center">{children}</div>;
const PaginationContent = ({ children, className = '' }) => (
  <div className={`flex gap-2 mt-4 flex-wrap ${className}`}>{children}</div>
);
const PaginationItem = ({ children }) => <div>{children}</div>;
const PaginationLink = ({ children, isActive = false, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded ${isActive ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'} transition`}
  >
    {children}
  </button>
);

export default function InventoryDashboard() {
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [availability, setAvailability] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAnimated, setIsAnimated] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [bookedSpaceIds, setBookedSpaceIds] = useState([]);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  const fetchSpaces = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/spaces');
      const data = await res.json();
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSpaces(data);
    } catch (error) {
      console.error('Error fetching spaces:', error);
    }
  };

  const fetchBookedSpaces = async () => {
    if (!startDate || !endDate) {
      setBookedSpaceIds([]);
      return;
    }
    try {
      const res = await fetch(`http://localhost:3000/api/spaces/active-spaces?from=${startDate}&to=${endDate}`);
      const data = await res.json();
      setBookedSpaceIds(data.bookedSpaceIds || []);
    } catch (error) {
      console.error('Failed to fetch booked space IDs:', error);
      setBookedSpaceIds([]);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  useEffect(() => {
    fetchBookedSpaces();
  }, [startDate, endDate]);

  const handleDownloadExcel = () => {
    if (filteredData.length === 0) return;
    const excelData = filteredData.map(item => ({
      'Space Name': item.spaceName,
      'Address': item.address,
      'City': item.city,
      'State': item.state,
      'Zone': item.zone,
      'Space Type': item.spaceType,
      'Availability': item.availability,
      'Units': item.unit,
      'Occupied Units': item.occupiedUnits,
      'Price': item.price,
      'Footfall': item.footfall,
      'Audience': item.audience,
      'Demographics': item.demographics,
      'Dates': item.dates?.join(', ')
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventories');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'filtered_inventories.xlsx');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowUploadModal(true);
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:3000/api/spaces/upload-excel', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        toast.success(`Successfully uploaded ${result.count} inventories`);
        setShowUploadModal(false);
        setSelectedFile(null);
        await fetchSpaces();
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Something went wrong while uploading');
    }
  };

  const filteredData = spaces.filter((item) => {
    const idStr = item._id?.toString();

    const matchesSearch =
      item.spaceName?.toLowerCase().includes(search.toLowerCase()) ||
      item.city?.toLowerCase().includes(search.toLowerCase()) ||
      item.state?.toLowerCase().includes(search.toLowerCase()) ||
      item.zone?.toLowerCase().includes(search.toLowerCase()) ||
      item.address?.toLowerCase().includes(search.toLowerCase());

    const matchesRegion =
      !selectedRegion ||
      item.city?.toLowerCase().includes(selectedRegion.toLowerCase()) ||
      item.state?.toLowerCase().includes(selectedRegion.toLowerCase()) ||
      item.zone?.toLowerCase().includes(selectedRegion.toLowerCase());

    const matchesAvailability =
      availability === '' || item.availability === availability;

    const isBooked = bookedSpaceIds.includes(idStr);

    const matchesDateRange = (() => {
      if (!startDate || !endDate) return true;
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) return false;

      const requiredDates = [];
      let current = new Date(start);
      while (current <= end) {
        requiredDates.push(current.toDateString());
        current.setDate(current.getDate() + 1);
      }

      const availableDates = (item.dates || []).map(dateStr => {
        const parts = dateStr.split('-');
        let date;
        if (parts[0].length === 4) {
          date = new Date(dateStr);
        } else {
          const [day, month, year] = parts;
          const fullYear = year.length === 2 ? `20${year}` : year;
          date = new Date(`${fullYear}-${month}-${day}`);
        }
        return date.toDateString();
      });

      return requiredDates.every(date => availableDates.includes(date));
    })();

    return matchesSearch && matchesRegion && matchesAvailability && matchesDateRange && !isBooked;
  });

  const paginatedData = filteredData.slice((currentPage - 1) * 10, currentPage * 10);
  const totalPages = Math.ceil(filteredData.length / 10);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsAnimated(true);
    }, 50);
    return () => clearTimeout(timeout);
  }, [paginatedData]);

  return (
    <div className="min-h-screen bg-[#fafafb] h-screen w-screen bg-white text-black flex flex-col lg:flex-row overflow-hidden">
      <Navbar />
      <main className="flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 ml-0 lg:ml-64">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <h2 className="text-1xl md:text-2xl ">Inventories</h2>
          <div className="flex gap-2 w-full md:w-auto">
            <Button onClick={() => navigate('/add-space')} className="text-xs w-full md:w-auto hover:-translate-y-1 hover:scale-110 transition">
              + Add Space
            </Button>
            {/* <Button
              onClick={() => {
                setTempStartDate(startDate);
                setTempEndDate(endDate);
                setShowDateModal(true);
              }}
              className="text-xs w-full md:w-auto hover:-translate-y-1 hover:scale-110 transition"
            >
              Date Filter
            </Button> */}
            <input type="file" accept=".xlsx, .csv" id="excel-upload" onChange={handleFileChange} className="hidden" />
            <label
              htmlFor="excel-upload"
              className="cursor-pointer px-4 py-2 rounded bg-black text-white text-xs w-full md:w-auto hover:-translate-y-1 hover:scale-110 transition"
            >
              Upload Excel
            </label>
            <Button onClick={handleDownloadExcel} className="text-xs w-full md:w-auto hover:-translate-y-1 hover:scale-110 transition">
              Download Excel
            </Button>
          </div>
        </div>

        <div className="mt-6 text-sm flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center">
          <Input className="md:w-[28%] h-[1.8rem]" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* <button
              onClick={() => {
                setTempStartDate(startDate);
                setTempEndDate(endDate);
                setShowDateModal(true);
              }}
              className="text-xs w-full bg-white text-black md:w-auto hover:border-black hover:-translate-y-1 hover:scale-110 transition"
            >
              Date Filter
            </button> */}
            {/* <Input type="date" className="md:w-40" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input type="date" className="md:w-40" value={endDate} onChange={(e) => setEndDate(e.target.value)} /> */}
            <Input className="md:w-40" value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} placeholder="Enter City/State/Zone" />
            <select className="border px-3 py-2 rounded w-full md:w-40" value={availability} onChange={(e) => setAvailability(e.target.value)}>
              <option value="">All</option>
              <option value="Completely available">Completely available</option>
              <option value="Partialy available">Partialy available</option>
              <option value="Completely booked">Completely booked</option>
            </select>
            <button
              onClick={() => {
                setTempStartDate(startDate);
                setTempEndDate(endDate);
                setShowDateModal(true);
              }}
              className="text-xs w-full bg-white text-black md:w-auto hover:border-black hover:-translate-y-1 hover:scale-110 transition"
            >
              Date Filter
            </button>
            <button
  onClick={() => {
    setStartDate('');
    setEndDate('');
    setSelectedRegion('');
    setAvailability('');
  }}
  className="text-xs w-full bg-white text-black md:w-auto hover:border-black hover:-translate-y-1 hover:scale-110 transition"
>
  Reset Filters
</button>

          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 w-full">
          {paginatedData.map((item, index) => (
            <Card
              key={item._id}
              className={`hover:shadow-md hover:border-2  hover:scale-100 cursor-pointer transform transition-all duration-700 ease-out ${isAnimated ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
              onClick={() => navigate(`/space/${item._id}`)}
            >
              <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                  <img src={`${item.mainPhoto}`} alt="Main Photo" className="w-full h-[130%] object-cover" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-sm font-semibold break-words">{item.spaceName}</div>
                  <div className="text-xs text-gray-600">{item.address || 'No address provided'}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs px-2 py-1 rounded bg-green-200">{item.city || 'City'}</span>
                  <span className="text-xs px-2 py-1 bg-purple-100 rounded">{item.spaceType || 'Type'}</span>
                  {(() => {
                    const totalUnits = item.unit || 0;
                    const occupied = item.occupiedUnits || 0;
                    let status = 'Completely available';
                    let color = 'bg-green-100';

                    if (totalUnits === occupied && occupied !== 0) {
                      status = 'Completely booked';
                      color = 'bg-red-100';
                    } else if (occupied > 0 && occupied < totalUnits) {
                      status = 'Partially available';
                      color = 'bg-yellow-100';
                    }

                    return (
                      <span className={`text-xs px-2 py-1 rounded ${color}`}>{status}</span>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink isActive={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
            </PaginationContent>
          </Pagination>
        </div>

        {showUploadModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-96">
              <h2 className="text-lg font-semibold mb-4">Upload Inventory Excel</h2>
              <div className="mb-4 text-sm">
                Selected File:
                <div className="font-medium mt-1">{selectedFile?.name}</div>
              </div>
              <label className="block mb-4">
                <span className="text-sm text-gray-700">Change File:</span>
                <input
                  type="file"
                  accept=".xlsx, .csv"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="mt-1 block w-full text-sm"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 rounded bg-gray-300 text-black hover:bg-gray-400">
                  Cancel
                </button>
                <button onClick={handleConfirmUpload} className="px-4 py-2 rounded bg-black text-white hover:bg-gray-900">
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {showDateModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-96">
              <h2 className="text-lg font-semibold mb-4">Select Date Range</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2 mt-[5%]">
                <button onClick={() => setShowDateModal(false)} className="px-4 py-2 text-xs rounded bg-gray-300 text-black hover:bg-gray-400">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setStartDate(tempStartDate);
                    setEndDate(tempEndDate);
                    setShowDateModal(false);
                  }}
                  className="px-4 ml-auto py-2 text-xs rounded bg-black text-white hover:bg-gray-900"
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


