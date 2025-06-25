


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
  <div className={`bg-white border shadow-sm rounded-xl w-full h-[100%] ${className}`} {...props}>
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
const [spaceTypeFilter, setSpaceTypeFilter] = useState('');
const [totalCount, setTotalCount] = useState(0);

  // const fetchSpaces = async () => {
  //   try {
  //    const token = localStorage.getItem('accessToken');
  //    console.log("Token sent is",token);
  //     const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces`, {
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': `Bearer ${token}`,
  //     },
  //   });
  //   if (res.status === 403) {
  //     const errorData = await res.json();
  //     if (errorData.message === 'Invalid or expired token') {
  //       localStorage.removeItem('accessToken');
  //       localStorage.removeItem('userId');
  //       localStorage.removeItem('userRole');
  //       localStorage.removeItem('userEmail');
  //       navigate('/login'); // or use router.navigate('/login') if using React Router
  //       return;
  //     }
  //   }
  //     const data = await res.json();
  //     data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
  //     setSpaces(data);
  //     console.log("Spaces are",data);
  //   } catch (error) {
  //     console.error('Error fetching spaces:', error);
  //   }
  // };
const fetchSpaces = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search,
        region: selectedRegion,
        availability,
        spaceType: spaceTypeFilter,
        ...(startDate && endDate && { startDate, endDate }),
      });

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/listInventory?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 403) {
        const errorData = await res.json();
        if (errorData.message === 'Invalid or expired token') {
          localStorage.clear();
          navigate('/login');
          return;
        }
      }

      const data = await res.json();
      setSpaces(data.spaces);
      setTotalCount(data.totalCount);
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
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/active-spaces?from=${startDate}&to=${endDate}`);
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/upload-excel`, {
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
const getComputedAvailability = (item) => {
  const totalUnits = item.unit || 0;
  const occupied = item.occupiedUnits || 0;

  if (item.overlappingBooking) return 'Overlapping booking';
  if (item.availability === 'Booked') return 'Completely booked'; // explicit mapping
  if (totalUnits === occupied && occupied !== 0) return 'Completely booked';
  if (occupied > 0 && occupied < totalUnits) return 'Partially available';
  return 'Completely available';
};

  const filteredData = spaces.filter((item) => {
    const idStr = item._id?.toString();
const matchesSpaceType = !spaceTypeFilter || item.spaceType === spaceTypeFilter;

 
    const matchesSearch = [
  item.spaceName,
  item.city,
  item.state,
  item.zone,
  item.address,
  item.tags  // ✅ includes tag string for searching
]
  .filter(Boolean)
  .some(field => field.toLowerCase().includes(search.toLowerCase()));


    const matchesRegion =
      !selectedRegion ||
      item.city?.toLowerCase().includes(selectedRegion.toLowerCase()) ||
      item.state?.toLowerCase().includes(selectedRegion.toLowerCase()) ||
      item.zone?.toLowerCase().includes(selectedRegion.toLowerCase());

    // const matchesAvailability =
    //   availability === '' || item.availability === availability;
    const matchesAvailability =
      availability === '' || getComputedAvailability(item) === availability;

    const isBooked = bookedSpaceIds.includes(idStr);


    const matchesDateRange = (() => {
  if (!startDate || !endDate || !item.dates || item.dates.length < 2) return true;

  const selectedStart = new Date(startDate);
  const selectedEnd = new Date(endDate);

  const [rawStart, rawEnd] = item.dates;
  const [day1, month1, year1] = rawStart.split('-');
  const [day2, month2, year2] = rawEnd.split('-');
  const inventoryStart = new Date(`${year1}-${month1}-${day1}`);
  const inventoryEnd = new Date(`${year2}-${month2}-${day2}`);

  // ✅ Check if selected range is inside inventory range
  const isInsideInventoryRange =
    selectedStart >= inventoryStart && selectedEnd <= inventoryEnd;

  // ❌ Check if selected range overlaps with any campaignDates
  const overlapsWithCampaign = (item.campaignDates || []).some(c => {
    const campaignStart = new Date(c.startDate);
    const campaignEnd = new Date(c.endDate);
    return (
      selectedStart <= campaignEnd &&
      selectedEnd >= campaignStart
    );
  });

  return isInsideInventoryRange && !overlapsWithCampaign;
})();

    return matchesSearch && matchesRegion && matchesSpaceType && matchesAvailability && matchesDateRange && !isBooked;
  });

  const paginatedData = filteredData.slice((currentPage - 1) * 10, currentPage * 10);
  const totalPages = Math.ceil(totalCount / 10);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsAnimated(true);
    }, 50);
    return () => clearTimeout(timeout);
  }, [paginatedData]);

  return (
    <div className="min-h-screen bg-gray-100 h-screen w-screen bg-white text-black flex flex-col lg:flex-row overflow-hidden">
      <Navbar />
      <main className="flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 ml-0 lg:ml-64">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <h2 className="text-1xl md:text-2xl ">Inventories</h2>
          <div className="flex gap-2 w-full md:w-auto">
            <Button onClick={() => navigate('/add-space')} className="text-xs w-full md:w-auto hover:-translate-y-1 hover:scale-110 transition">
              + Add Space
            </Button>
           
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
    
            <Input className="md:w-40" value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} placeholder="Enter City/State/Zone" />
            <select className="border px-3 py-2 rounded w-full md:w-40" value={availability} onChange={(e) => setAvailability(e.target.value)}>
              <option value="">All</option>
              <option value="Completely available">Completely available</option>
              <option value="Partialy available">Partialy available</option>
              <option value="Completely booked">Completely booked</option>
              <option value="Overlapping booking">Overlapping booking</option>
             
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
    className={`hover:shadow-md hover:border-2 hover:scale-100 cursor-pointer transform transition-all duration-700 ease-out ${
      isAnimated ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}
    style={{ transitionDelay: `${index * 100}ms` }}
    onClick={() => navigate(`/space/${item._id}`)} // ✅ Navigate on card click
  >
    <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
        <img src={`${item.mainPhoto}`} alt="Main Photo" className="w-full h-[130%] object-cover" />
      </div>

      <div className="flex-1 flex flex-col gap-1 w-full">
        <div className="text-sm font-semibold break-words">{item.spaceName}</div>
        <div className="text-xs text-gray-600">{item.address || 'No address provided'}</div>

        {/* Tag input box */}
        <div className="mt-2 text-xs">
          <input
            placeholder="+ Tag"
            className="text-xs px-2 py-[3px] w-24 border rounded bg-white focus:outline-none"
            onKeyDown={async (e) => {
              e.stopPropagation(); // ✅ Prevent card click
              if (e.key === 'Enter' && e.target.value.trim()) {
                const newTag = e.target.value.trim();
                try {
                  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${item._id}/add-tag`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tag: newTag }),
                  });
                  if (res.ok) {
                    toast.success('Tag added');
                    fetchSpaces();
                    e.target.value = '';
                  } else {
                    toast.error('Failed to add tag');
                  }
                } catch (err) {
                  console.error(err);
                  toast.error('Error while adding tag');
                }
              }
            }}
            onFocus={(e) => e.stopPropagation()} // ✅ Also block click on focus
            onClick={(e) => e.stopPropagation()} // ✅ Block click on click
          />
        </div>
      </div>

      {/* Right side tags */}
      <div className="flex gap-2 flex-wrap justify-end">
        <span className="text-xs px-2 py-1 rounded bg-green-200">{item.city || 'City'}</span>
        <span className="text-xs px-2 py-1 bg-purple-100 rounded">{item.spaceType || 'Type'}</span>

        {/* Availability Badge */}
        {(() => {
          const totalUnits = item.unit || 0;
          const occupied = item.occupiedUnits || 0;
          const overlappingBooking=item.overlappingBooking;
          let status = 'Completely available';
          let color = 'bg-green-100';

          if (totalUnits === occupied && occupied !== 0) {
            status = 'Completely booked';
            color = 'bg-red-100';
          } else if (occupied > 0 && occupied < totalUnits) {
            status = 'Partially available';
            color = 'bg-yellow-100';
          } else if(overlappingBooking){
             status = 'Overlapping Booking';
            color = 'bg-red-400';
          }
         

          return <span className={`text-xs px-2 py-1 rounded ${color}`}>{status}</span>;
        })()}

        {/* Tags with remove option */}
        {(item.tags || '')
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t)
          .map((tag, idx) => (
            <div
              key={`${tag}-${idx}`}
              className="relative group text-xs px-2 py-1 rounded bg-gray-200 flex items-center"
            >
              {tag}
              <span
                onClick={async (e) => {
                  e.stopPropagation(); // ✅ Prevent card click on tag remove
                  try {
                    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${item._id}/remove-tag`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ tag }),
                    });
                    if (res.ok) {
                      toast.success('Tag removed');
                      fetchSpaces();
                    } else {
                      toast.error('Failed to remove tag');
                    }
                  } catch (err) {
                    console.error(err);
                    toast.error('Error while removing tag');
                  }
                }}
                className="ml-2 text-sm text-red-500 hidden group-hover:inline cursor-pointer"
              >
                ×
              </span>
            </div>
          ))}
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


// ✅ Updated InventoryDashboard.jsx with backend filters and pagination

// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Navbar from './Navbar';
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';
// import toast from 'react-hot-toast';

// // --- UI Components ---
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

// // --- Main Component ---
// export default function InventoryDashboard() {
//   const navigate = useNavigate();
//   const [spaces, setSpaces] = useState([]);
//   const [search, setSearch] = useState('');
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [selectedRegion, setSelectedRegion] = useState('');
//   const [availability, setAvailability] = useState('');
//   const [spaceTypeFilter, setSpaceTypeFilter] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalCount, setTotalCount] = useState(0);
//   const [isAnimated, setIsAnimated] = useState(false);
//   const [showUploadModal, setShowUploadModal] = useState(false);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [showDateModal, setShowDateModal] = useState(false);
//   const [tempStartDate, setTempStartDate] = useState('');
//   const [tempEndDate, setTempEndDate] = useState('');

//   const fetchSpaces = async () => {
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

//   useEffect(() => {
//     fetchSpaces();
//   }, [search, selectedRegion, availability, spaceTypeFilter, startDate, endDate, currentPage]);

//   const handleDownloadExcel = () => {
//     if (spaces.length === 0) return;
//     const excelData = spaces.map(item => ({
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

//   const handleFileUpload = async () => {
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
//         fetchSpaces();
//       } else {
//         toast.error(result.error || 'Upload failed');
//       }
//     } catch (error) {
//       console.error('Upload error:', error);
//       toast.error('Something went wrong while uploading');
//     }
//   };

//   const totalPages = Math.ceil(totalCount / 10);

//   useEffect(() => {
//     const timeout = setTimeout(() => setIsAnimated(true), 50);
//     return () => clearTimeout(timeout);
//   }, [spaces]);

//   return (
//     <div className="min-h-screen bg-gray-100 h-screen w-screen bg-white text-black flex flex-col lg:flex-row overflow-hidden">
//       <Navbar />
//       <main className="flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 ml-0 lg:ml-64">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
//           <h2 className="text-1xl md:text-2xl">Inventories</h2>
//           <div className="flex gap-2 w-full md:w-auto">
//             <Button onClick={() => navigate('/add-space')} className="text-xs hover:scale-110">+ Add Space</Button>
//             <input type="file" accept=".xlsx, .csv" id="excel-upload" onChange={(e) => {
//               setSelectedFile(e.target.files[0]);
//               setShowUploadModal(true);
//             }} className="hidden" />
//             <label htmlFor="excel-upload" className="cursor-pointer px-4 py-2 rounded bg-black text-white text-xs hover:scale-110">
//               Upload Excel
//             </label>
//             <Button onClick={handleDownloadExcel} className="text-xs hover:scale-110">Download Excel</Button>
//           </div>
//         </div>

//         <div className="mt-6 text-sm flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center">
//           <Input className="md:w-[28%]" placeholder="Search" value={search} onChange={(e) => {
//             setCurrentPage(1);
//             setSearch(e.target.value);
//           }} />
//           <div className="flex flex-wrap gap-2 w-full md:w-auto">
//             <Input className="md:w-40" value={selectedRegion} onChange={(e) => {
//               setCurrentPage(1);
//               setSelectedRegion(e.target.value);
//             }} placeholder="City/State/Zone" />
//             <select className="border px-3 py-2 rounded w-full md:w-40" value={availability} onChange={(e) => {
//               setCurrentPage(1);
//               setAvailability(e.target.value);
//             }}>
//               <option value="">All</option>
//               <option value="Completely available">Completely available</option>
//               <option value="Partially available">Partially available</option>
//               <option value="Completely booked">Completely booked</option>
//               <option value="Overlapping booking">Overlapping booking</option>
//             </select>
//             <button onClick={() => {
//               setTempStartDate(startDate);
//               setTempEndDate(endDate);
//               setShowDateModal(true);
//             }} className="text-xs bg-white text-black hover:border-black hover:scale-110">Date Filter</button>
//             <button onClick={() => {
//               setSearch('');
//               setSelectedRegion('');
//               setAvailability('');
//               setSpaceTypeFilter('');
//               setStartDate('');
//               setEndDate('');
//               setCurrentPage(1);
//             }} className="text-xs bg-white text-black hover:border-black hover:scale-110">Reset Filters</button>
//           </div>
//         </div>

//         <div className="mt-6 grid grid-cols-1 gap-4 w-full">
//           {spaces.map((item, index) => (
//             <Card
//               key={item._id}
//               className={`hover:shadow-md hover:border-2 cursor-pointer transform transition-all duration-700 ease-out ${
//                 isAnimated ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
//               }`}
//               style={{ transitionDelay: `${index * 100}ms` }}
//               onClick={() => navigate(`/space/${item._id}`)}
//             >
//               <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//                 <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
//                   <img src={item.mainPhoto} alt="Main" className="w-full h-[130%] object-cover" />
//                 </div>
//                 <div className="flex-1 flex flex-col gap-1 w-full">
//                   <div className="text-sm font-semibold">{item.spaceName}</div>
//                   <div className="text-xs text-gray-600">{item.address || 'No address provided'}</div>
//                 </div>
//                 <div className="flex gap-2 flex-wrap justify-end">
//                   <span className="text-xs px-2 py-1 rounded bg-green-200">{item.city}</span>
//                   <span className="text-xs px-2 py-1 bg-purple-100 rounded">{item.spaceType}</span>
//                   <span className={`text-xs px-2 py-1 rounded ${
//                     item.availability === 'Completely booked' ? 'bg-red-100' :
//                     item.availability === 'Partially available' ? 'bg-yellow-100' :
//                     item.availability === 'Overlapping booking' ? 'bg-red-400' :
//                     'bg-green-100'
//                   }`}>
//                     {item.availability}
//                   </span>
//                 </div>
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

//         {/* Upload Modal */}
//         {showUploadModal && (
//           <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//             <div className="bg-white rounded-xl shadow-lg p-6 w-96">
//               <h2 className="text-lg font-semibold mb-4">Upload Inventory Excel</h2>
//               <div className="mb-4 text-sm">Selected File: <span className="font-medium">{selectedFile?.name}</span></div>
//               <label className="block mb-4">
//                 <span className="text-sm text-gray-700">Change File:</span>
//                 <input type="file" accept=".xlsx, .csv" onChange={(e) => setSelectedFile(e.target.files[0])} className="mt-1 block w-full" />
//               </label>
//               <div className="flex justify-end gap-2">
//                 <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 bg-gray-300 text-black rounded">Cancel</button>
//                 <button onClick={handleFileUpload} className="px-4 py-2 bg-black text-white rounded">Save</button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Date Modal */}
//         {showDateModal && (
//           <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//             <div className="bg-white rounded-xl shadow-lg p-6 w-96">
//               <h2 className="text-lg font-semibold mb-4">Select Date Range</h2>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">Start Date</label>
//                 <input type="date" value={tempStartDate} onChange={(e) => setTempStartDate(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
//               </div>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700">End Date</label>
//                 <input type="date" value={tempEndDate} onChange={(e) => setTempEndDate(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
//               </div>
//               <div className="flex justify-end gap-2">
//                 <button onClick={() => setShowDateModal(false)} className="px-4 py-2 bg-gray-300 text-black rounded">Cancel</button>
//                 <button onClick={() => {
//                   setStartDate(tempStartDate);
//                   setEndDate(tempEndDate);
//                   setCurrentPage(1);
//                   setShowDateModal(false);
//                 }} className="px-4 py-2 bg-black text-white rounded">Apply</button>
//               </div>
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }

