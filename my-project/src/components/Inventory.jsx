


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

const Tabs = ({ children }) => <div className="text-xs">{children}</div>;
const TabsList = ({ children }) => (
  <div className="flex border rounded overflow-hidden w-[100%] shadow-sm bg-gray-100">{children}</div>
);
const TabsTrigger = ({ value, children }) => (
  <button className="px-4 py-2 text-xs font-medium hover:bg-gray-200 w-full">{children}</button>
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
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [availability, setAvailability] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeNav, setActiveNav] = useState('Inventories');
  const perPage = 10;
  
  const [isAnimated, setIsAnimated] = useState(false);




  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/spaces');
        const data = await response.json();
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setSpaces(data);
      } catch (error) {
        console.error('Error fetching spaces:', error);
      }
    };
    fetchSpaces();
  }, []);
  const handleDownloadExcel = () => {
    if (filteredData.length === 0) {
      // alert('No data to export!');
     
      return;
    }
  
    // Prepare data for Excel
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
  
    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventories');
  
    // Write to binary and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'filtered_inventories.xlsx');
  };
  

  const filteredData = spaces.filter((item) => {
    // const matchesSearch = item.spaceName?.toLowerCase().includes(search.toLowerCase());
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
      // availability === '' || String(item.available) === availability;
      availability === '' || item.availability === availability;

      const matchesDate = !selectedDate || (() => {
        if (!item.dates || item.dates.length === 0) return false;
      
        const parsedDates = item.dates.map(dateStr => {
          const [day, month, year] = dateStr.split('-');
          const fullYear = year.length === 2 ? `20${year}` : year;
          return new Date(`${fullYear}-${month}-${day}`); // Notice day after month
        });
      
        const minDate = new Date(Math.min(...parsedDates));
        const maxDate = new Date(Math.max(...parsedDates));
      
        const [selectedYear, selectedMonth] = selectedDate.split('-').map(Number);
        const selectedMonthDate = new Date(selectedYear, selectedMonth - 1); // Month is 0-indexed
      
        return selectedMonthDate >= new Date(minDate.getFullYear(), minDate.getMonth()) &&
               selectedMonthDate <= new Date(maxDate.getFullYear(), maxDate.getMonth());
      })();
      
      

    return matchesSearch && matchesRegion && matchesAvailability && matchesDate;
  });
  const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsAnimated(true);
    }, 50); // Small delay ensures animation is triggered
    return () => clearTimeout(timeout);
  }, [paginatedData]); // Re-animate on pagination change
  const totalPages = Math.ceil(filteredData.length / perPage);

  return (
    <div className="min-h-screen h-screen w-screen bg-white text-black flex flex-col lg:flex-row overflow-hidden">
      {/* Sidebar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 ml-0 lg:ml-64">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <h1 className="text-1xl md:text-2xl font-semibold">Inventories</h1>
          <div className="flex gap-2 w-full md:w-auto">
            {/* <Button className="bg-black text-xs text-white w-full md:w-auto">+ Filter</Button> */}
            <Button onClick={() => navigate('/add-space')} className="bg-black text-xs text-white w-full md:w-auto transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110">
              + Add Space
            </Button>
            <Button
  onClick={handleDownloadExcel}
  className="bg-black text-xs text-white w-full md:w-auto transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
>
  Download Excel
</Button>

          </div>
        </div>

        <div className="mt-6 text-sm flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center">
          <Input
            className="md:w-[28%] h-[1.8rem]"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Input
              type="month"
              className="md:w-40"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              placeholder="Select Month"
            />
            <Input
              className="md:w-40"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              placeholder="Enter City/State/Zone"
            />
            <select
              className="border px-3 py-2 rounded w-full md:w-40"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            >
              <option value="">All</option>
              <option value="Completely available">Completely available</option>
              <option value="Partialy available">Partialy available</option>
              <option value="Completely booked">Completely booked</option>
              {/* <option value="true">Available</option>
              <option value="false">Not Available</option> */}
            </select>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 w-full">
  {paginatedData.map((item, index) => (
    <Card
      key={item._id}
      className={`hover:shadow-md cursor-pointer transform transition-all duration-700 ease-out ${
        isAnimated ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
      onClick={() => navigate(`/space/${item._id}`)}
    >
      <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Image Thumbnail */}
        <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
          {item.mainPhoto ? (
            <img
              src={`http://localhost:3000/uploads/${item.mainPhoto}`}
              alt="Main Photo"
              className="w-full h-[130%] object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* Text Info */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="text-sm font-semibold break-words">{item.spaceName}</div>
          <div className="text-xs text-gray-600">{item.address || 'No address provided'}</div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs px-2 py-1 rounded bg-green-200">
            {item.city || 'City'}
          </span>
          <span className="text-xs px-2 py-1 bg-purple-100 rounded">
            {item.spaceType || 'Type'}
          </span>
        </div>
      </CardContent>
    </Card>
  ))}
</div>





        <div className="mt-6">
          <Pagination>
            <PaginationContent className="gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    isActive={i + 1 === currentPage}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
            </PaginationContent>
          </Pagination>
        </div>
      </main>
    </div>
  );
}






