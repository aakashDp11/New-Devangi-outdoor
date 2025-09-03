


import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import { useSidebar } from '../context/SidebarContext';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41],
    popupAnchor: [1, -34], tooltipAnchor: [16, -28], shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;


// --- UI HELPER COMPONENTS ---
const Button = ({ children, className = '', ...props }) => ( <button className={`px-4 py-2 rounded-md bg-black text-white text-xs font-medium hover:bg-gray-800 transition ${className}`} {...props}>{children}</button> );
const Pagination = ({ currentPage, totalPages, onPageChange, totalCount, itemsPerPage }) => {
  const [pageInput, setPageInput] = useState(currentPage.toString());
  useEffect(() => { setPageInput(currentPage.toString()); }, [currentPage]);
  const handlePageSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput, 10);
    if (pageNum && pageNum > 0 && pageNum <= totalPages) onPageChange(pageNum);
    else setPageInput(currentPage.toString());
  };
  if (totalCount === 0) return <div className="text-center py-10 text-gray-500">No inventories found.</div>;
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-8 text-xs gap-4">
       <span className="text-gray-600">Showing {startItem} - {endItem} of {totalCount} results</span>
       {totalPages > 1 && (
         <div className="flex items-center gap-4">
             <button onClick={() => onPageChange(currentPage > 1 ? currentPage - 1 : 1)} className="px-3 py-1.5 rounded-md bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50" disabled={currentPage === 1}><FaArrowLeft className='inline'/></button>
             <form onSubmit={handlePageSubmit} className="flex items-center gap-2">
               <span>Page</span>
               <input type="text" value={pageInput} onChange={(e) => setPageInput(e.target.value)} className="w-12 h-8 text-center border border-gray-300 rounded-md"/>
               <span>of {totalPages}</span>
             </form>
             <button onClick={() => onPageChange(currentPage < totalPages ? currentPage + 1 : totalPages)} className="px-3 py-1.5 rounded-md bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50" disabled={currentPage === totalPages}><FaArrowRight className='inline'/></button>
         </div>
       )}
    </div>
  );
};
const AvailabilityBadge = ({ availabilityStatus }) => {
  let colorClasses, text;
  switch (availabilityStatus) {
    case 'Completely booked': case 'Booked': colorClasses = 'bg-red-100 text-red-700'; text = 'Booked'; break;
    case 'Partially available': case 'Partialy available': colorClasses = 'bg-yellow-100 text-yellow-700'; text = 'Partially Available'; break;
    case 'Overlapping booking': colorClasses = 'bg-orange-100 text-orange-700'; text = 'Overlapping'; break;
    default: colorClasses = 'bg-green-100 text-green-700'; text = 'Available'; break;
  }
  return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${colorClasses}`}>{text}</span>;
};
const SortableHeader = ({ title, sortKey, sortConfig, setSortConfig }) => {
  const isSorting = sortConfig.key === sortKey;
  const direction = isSorting ? sortConfig.direction : null;
  const handleSort = () => setSortConfig(prev => ({ key: sortKey, direction: prev.key === sortKey && prev.direction === 'asc' ? 'desc' : 'asc' }));
  return (
    <th scope="col" className="px-6 py-3"><div onClick={handleSort} className="flex items-center gap-1.5 cursor-pointer select-none">{title}<span className="text-gray-400">{direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '⇅'}</span></div></th>
  );
};

// --- VIEW COMPONENTS ---
const InventoryGridView = ({ data, onTagUpdate, navigate }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 text-xs gap-5">
      {data.map((item) => {
        const tags = Array.isArray(item.tags) ? item.tags : String(item.tags || '').split(',').filter(tag => tag.trim() !== '');
        return (
          <div key={item._id} className="bg-white border border-gray-200 shadow-sm rounded-lg text-xs hover:shadow-md cursor-pointer transition-shadow flex flex-col" onClick={() => navigate(`/space/${item._id}`)}>
            <img src={item.mainPhoto || 'https://via.placeholder.com/300x200'} alt="Space" className="w-full h-40 object-cover rounded-t-lg bg-gray-100" />
            <div className="p-4 flex flex-col flex-grow">
              <div className="flex-grow">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-gray-800 leading-tight">{item.spaceName}</h3>
                  <div className="flex-shrink-0"><AvailabilityBadge availabilityStatus={item.availability} /></div>
                </div>
                <p className="text-sm text-gray-500 mt-1 mb-3">{item.address || 'No address'}</p>
                <div className="flex gap-2 text-xs flex-wrap mb-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">{item.city || 'N/A'}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">{item.spaceType || 'N/A'}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {tags.map((tag, idx) => (
                    <div key={idx} className="relative group text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700 flex items-center">{tag}<span onClick={(e) => { e.stopPropagation(); onTagUpdate('remove', item._id, tag); }} className="ml-1.5 text-red-500 hidden group-hover:inline cursor-pointer font-bold">×</span></div>
                  ))}
                </div>
              </div>
              <div className="mt-4 text-xs"><input placeholder="+ Add Tag" className="px-2 py-1 w-full border rounded-md bg-white" onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter' && e.target.value.trim()) { onTagUpdate('add', item._id, e.target.value.trim()); e.target.value = ''; } }} onClick={(e) => e.stopPropagation()} /></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
const InventoryTableView = ({ data, currentPage, limit, navigate, sortConfig, setSortConfig }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
      <table className="w-full text-xs text-left text-gray-600">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">#</th>
            <SortableHeader title="Space Name" sortKey="spaceName" sortConfig={sortConfig} setSortConfig={setSortConfig} />
            <SortableHeader title="City" sortKey="city" sortConfig={sortConfig} setSortConfig={setSortConfig} />
            <SortableHeader title="Category" sortKey="spaceType" sortConfig={sortConfig} setSortConfig={setSortConfig} />
            <SortableHeader title="Availability" sortKey="availability" sortConfig={sortConfig} setSortConfig={setSortConfig} />
            <SortableHeader title="Ownership" sortKey="ownershipType" sortConfig={sortConfig} setSortConfig={setSortConfig} />
            <SortableHeader title="Inventory ID" sortKey="inventoryId" sortConfig={sortConfig} setSortConfig={setSortConfig} />
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item._id} className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/space/${item._id}`)}>
              <td className="px-6 py-4 text-gray-500">{(currentPage - 1) * limit + index + 1}</td>
              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"><div className="flex items-center gap-3"><img src={item.mainPhoto || 'https://via.placeholder.com/40'} alt={item.spaceName} className="w-10 h-10 object-cover rounded-md bg-gray-100" /><div><div className="font-semibold text-gray-800">{item.spaceName}</div><div className="text-gray-500 text-xs">{item.address}</div></div></div></td>
              <td className="px-6 py-4">{item.city}</td>
              <td className="px-6 py-4">{item.spaceType}</td>
              <td className="px-6 py-4"><AvailabilityBadge availabilityStatus={item.availability} /></td>
              <td className="px-6 py-4">{item.ownershipType}</td>
              <td className="px-6 py-4 font-mono text-xs text-gray-500">{item.inventoryId || item._id.slice(-8).toUpperCase()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
const InventoryMapView = ({ spaces, navigate }) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);

    useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, { center: [20.5937, 78.9629], zoom: 5 });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
            mapInstanceRef.current = map;
        }
        const map = mapInstanceRef.current;
        if (map) {
            map.eachLayer(layer => { if (layer instanceof L.Marker) map.removeLayer(layer); });
            const markerBounds = [];
            // Ensure spaces is an array before calling forEach
            if (Array.isArray(spaces)) {
                spaces.forEach(space => {
                    const lat = parseFloat(space.latitude);
                    const lng = parseFloat(space.longitude);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        const tooltipContent = `<strong>${space.spaceName}</strong><br/>Lat: ${lat}, Lng: ${lng}`;
                        const marker = L.marker([lat, lng]).addTo(map).bindTooltip(tooltipContent).on('click', () => navigate(`/space/${space._id}`));
                        markerBounds.push([lat, lng]);
                    }
                });
            }
            if (markerBounds.length > 0) {
                map.fitBounds(markerBounds, { padding: [50, 50] });
            }
        }
    }, [spaces, navigate]);

    return <div ref={mapContainerRef} className="w-full h-[65vh] rounded-lg border shadow-sm" />;
};


// --- MAIN DASHBOARD COMPONENT ---
export default function InventoryDashboard() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const datePickerRef = useRef(null); // Ref for the date picker popover
  const [spaces, setSpaces] = useState([]);
  const [mapSpaces, setMapSpaces] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState('table');
  const limit = 10;

  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [availability, setAvailability] = useState('');
  const [spaceType, setSpaceType] = useState('');
  const [ownershipType, setOwnershipType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateRange, setDateRange] = useState([{ startDate: null, endDate: null, key: 'selection' }]);
  const [tempDateRange, setTempDateRange] = useState([{ startDate: null, endDate: null, key: 'selection' }]);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

  // Fetch paginated data for table and grid
  const fetchSpaces = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({ page: currentPage, limit, search, region: selectedRegion, availability, spaceType, ownershipType, ...(startDate && endDate && { startDate, endDate }), });
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/listInventory?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 403) { localStorage.clear(); navigate('/login'); return; }
      const data = await res.json();
      setSpaces(data.spaces);
      setTotalCount(data.totalCount);
    } catch (error) { toast.error("Failed to fetch inventories."); }
  }, [currentPage, search, selectedRegion, availability, startDate, endDate, spaceType, ownershipType, navigate]);

  // Fetch all location data for the map view
  const fetchMapLocations = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({ search, region: selectedRegion, availability, spaceType, ownershipType, ...(startDate && endDate && { startDate, endDate }), });
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/map-locations?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 403) { localStorage.clear(); navigate('/login'); return; }
      const data = await res.json();
      setMapSpaces(data);
      // For map view, totalCount reflects the number of *visible* map markers after all filters
      setTotalCount(data.length); 
    } catch (error) { toast.error("Failed to fetch map locations."); }
  }, [search, selectedRegion, availability, startDate, endDate, spaceType, ownershipType, navigate]);


  // Effect to call the correct fetch function based on viewMode and when filters change
  useEffect(() => { 
    if (viewMode === 'map') {
      fetchMapLocations();
    } else {
      fetchSpaces();
    }
  }, [viewMode, fetchSpaces, fetchMapLocations, startDate, endDate]);
  
  // Effect to handle clicks outside the date picker popover to close it
  useEffect(() => {
    function handleClickOutside(event) {
        if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
            setShowDateModal(false);
        }
    }
    if (showDateModal) {
        document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDateModal]);

  const sortedSpaces = useMemo(() => {
    let sortableItems = [...spaces];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key]?.toString().toLowerCase() || "";
        const bVal = b[sortConfig.key]?.toString().toLowerCase() || "";
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [spaces, sortConfig]);

 const handleTagUpdate = async (action, spaceId, tag) => {
    try {
      const token = localStorage.getItem('accessToken'); // Ensure token is sent
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${spaceId}/${action}-tag`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ tag }) });
      if (res.ok) { toast.success(`Tag ${action === 'add' ? 'added' : 'removed'}`); fetchSpaces(); }
      else { toast.error(`Failed to ${action} tag`); }
    } catch (err) { toast.error(`Error while trying to ${action} tag`); }
  };

 const handleDownloadExcel = () => {
    if (spaces.length === 0) { toast.error("No data to download."); return; }
    const excelData = spaces.map(item => ({
      'Space Name': item.spaceName,
      'Address': item.address,
      'City': item.city,
      'State': item.state,
      'Zone': item.zone,
      'Space Type': item.spaceType,
      'Availability': item.availability, // This will be the computed status
      'Units': item.unit,
      // 'Occupied Units': item.occupiedUnits, // Removed as it's no longer directly returned
      'Price': item.price,
      'Inventory ID': item.inventoryId || item._id,
      'Tags': (Array.isArray(item.tags) ? item.tags : String(item.tags || '').split(',')).join(', ')
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/upload-excel`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData, });
      const result = await response.json();
      if (response.ok) {
        toast.success(`Successfully uploaded ${result.count} inventories`); setShowUploadModal(false); setSelectedFile(null); fetchSpaces();
      } else { toast.error(result.error || 'Upload failed'); }
    } catch (error) { toast.error('Something went wrong while uploading'); }
  };

 const resetFilters = () => {
    setSearch(''); setSelectedRegion(''); setAvailability(''); setStartDate(''); setEndDate(''); setCurrentPage(1); setSpaceType(''); setOwnershipType(''); setSortConfig({ key: '', direction: 'asc' });
    const initialRange = [{ startDate: null, endDate: null, key: 'selection' }];
    setDateRange(initialRange);
    setTempDateRange(initialRange);
  };

 const formatDate = (date) => date ? new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : '';

 const handleApplyDateFilter = () => {
    const { startDate: start, endDate: end } = tempDateRange[0];
    setDateRange(tempDateRange); setStartDate(formatDate(start)); setEndDate(formatDate(end)); setShowDateModal(false); setCurrentPage(1);
  };  
  const handleCancelDateFilter = () => { 
    setShowDateModal(false); 
    setTempDateRange(dateRange); // Reset temp range to the last applied range
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="min-h-screen bg-gray-50 w-screen text-black flex flex-col lg:flex-row">
      <Navbar />
      <main className={`flex-1 h-screen overflow-y-auto px-4 md:px-6 py-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-sans font-normal">Inventories ({totalCount})</h2>
          <div className="flex items-center gap-2 text-xs">
            <Button onClick={() => navigate('/add-space')}>+ Add Space</Button>
            <input type="file" accept=".xlsx, .csv" id="excel-upload" onChange={(e) => { if(e.target.files[0]) { setSelectedFile(e.target.files[0]); setShowUploadModal(true); } }} className="hidden" />
            <label htmlFor="excel-upload" className="cursor-pointer px-4 py-2 rounded-md bg-black text-white text-xs font-medium hover:bg-gray-800 transition">Upload Excel</label>
            <Button onClick={handleDownloadExcel}>Download Excel</Button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <input type="text" placeholder="Search by name, address, city, tags..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full md:w-[50%] px-4 py-2 text-xs border border-gray-300 rounded-md" />
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center p-1 bg-gray-100 rounded-lg border">
                {[
                  { mode: 'table', icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg> },
                  { mode: 'grid', icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
                  { mode: 'map', icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> }
                ].map(v => (
                  <button key={v.mode} onClick={() => setViewMode(v.mode)} className={`p-1.5 rounded-md ${viewMode === v.mode ? 'bg-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}>
                    {v.icon}
                  </button>
                ))}
              </div>
              <button onClick={resetFilters} className="px-4 py-2 border border-gray-300 rounded-md text-xs">Reset Filters</button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs items-center">
            <input className="px-3 py-2 border rounded-md w-full md:w-auto" value={selectedRegion} onChange={(e) => { setSelectedRegion(e.target.value); setCurrentPage(1); }} placeholder="City/State/Zone" />
            <select className="px-3 py-2 border rounded-md w-full md:w-auto bg-white" value={spaceType} onChange={(e) => { setSpaceType(e.target.value); setCurrentPage(1); }}>
              <option value="">All Space Types</option><option value="Billboard">Billboard</option><option value="DOOH">DOOH</option><option value="Pole Kiosk">Pole Kiosk</option><option value="Gantry">Gantry</option><option value="BQS">BQS</option><option value="Transit">Transit</option><option value="Miscellaneous">Miscellaneous</option>
            </select>
            <select className="px-3 py-2 border rounded-md w-full md:w-auto bg-white" value={ownershipType} onChange={(e) => { setOwnershipType(e.target.value); setCurrentPage(1); }}>
              <option value="">All Ownerships</option><option value="Owned">Owned</option><option value="Leased">Leased</option><option value="Traded">Traded</option>
            </select>
            <select className="px-3 py-2 border rounded-md w-full md:w-auto bg-white" value={availability} onChange={(e) => { setAvailability(e.target.value); setCurrentPage(1); }}>
              <option value="">All Availabilities</option><option value="Completely available">Completely Available</option><option value="Partially available">Partially Available</option><option value="Completely booked">Completely Booked</option><option value="Overlapping booking">Overlapping Booking</option>
            </select>
            <div ref={datePickerRef} className="relative w-full md:w-auto">
                <button onClick={() => { setTempDateRange(dateRange); setShowDateModal(prev => !prev); }} className="px-4 py-2 border rounded-md hover:bg-gray-100 w-full text-left">
                    {dateRange[0].startDate && dateRange[0].endDate ? `${formatDate(dateRange[0].startDate)} to ${formatDate(dateRange[0].endDate)}` : "Date Filter"}
                </button>
                {showDateModal && (
                    <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-lg p-2 border z-50 text-xs" onClick={(e) => e.stopPropagation()}>
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
                            <button onClick={handleCancelDateFilter} className="px-4 py-1.5 rounded-md bg-gray-200 text-black hover:bg-gray-300">Cancel</button>
                            <button onClick={handleApplyDateFilter} className="px-4 py-1.5 rounded-md bg-black text-white hover:bg-gray-800">Apply</button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          {viewMode === 'table' && <InventoryTableView data={sortedSpaces} currentPage={currentPage} limit={limit} navigate={navigate} sortConfig={sortConfig} setSortConfig={setSortConfig} />}
          {viewMode === 'grid' && <InventoryGridView data={spaces} onTagUpdate={handleTagUpdate} navigate={navigate} />}
          {viewMode === 'map' && <InventoryMapView spaces={mapSpaces} navigate={navigate} />}
        </div>
        
        {viewMode !== 'map' && (
            <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={setCurrentPage} 
                totalCount={totalCount}
                itemsPerPage={limit}
            />
        )}

        {showUploadModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-96">
              <h2 className="text-lg font-semibold mb-4">Upload Inventory Excel</h2>
              <p className="mb-4 text-sm">Selected File: <span className="font-medium">{selectedFile?.name}</span></p>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowUploadModal(false); setSelectedFile(null); }} className="px-4 py-2 rounded-md bg-gray-200 text-black hover:bg-gray-300">Cancel</button>
                <button onClick={handleConfirmUpload} className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900">Save & Upload</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}