import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useSidebar } from '../context/SidebarContext';

// --- UI HELPER COMPONENTS ---

const Input = ({ className = '', ...props }) => (
  <input className={`border px-3 py-2 rounded w-full  ${className}`} {...props} />
);

const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white border shadow-sm rounded-xl w-full ${className}`} {...props}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

/**
 * NEW: Enhanced Pagination Component with "Showing X-Y of Z" results text.
 */
const Pagination = ({ currentPage, totalPages, onPageChange, totalCount, itemsPerPage }) => {
  const [pageInput, setPageInput] = useState(currentPage.toString());

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput, 10);
    if (pageNum && pageNum > 0 && pageNum <= totalPages) {
      onPageChange(pageNum);
    } else {
      setPageInput(currentPage.toString()); // Reset if invalid
    }
  };

  if (totalCount === 0) {
      return null; // Don't show pagination if there's no data
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-8 text-xs gap-4">
       <span className="text-gray-600">
           Showing {startItem} - {endItem} of {totalCount} results
       </span>
       {totalPages > 1 && (
           <div className="flex items-center gap-4">
                <button
                    onClick={() => onPageChange(currentPage > 1 ? currentPage - 1 : 1)}
                    className="px-3 py-1.5 rounded-md bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    disabled={currentPage === 1}
                >
                    <FaArrowLeft className='inline'/>
                </button>

                <form onSubmit={handlePageSubmit} className="flex items-center gap-2">
                    <span className="text-gray-700">Page</span>
                    <input
                    type="text"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    className="w-12 h-8 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">of {totalPages}</span>
                </form>

                <button
                    onClick={() => onPageChange(currentPage < totalPages ? currentPage + 1 : totalPages)}
                    className="px-3 py-1.5 rounded-md bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    disabled={currentPage === totalPages}
                >
                    <FaArrowRight className='inline'/>
                </button>
           </div>
       )}
    </div>
  );
};


// --- MAIN DASHBOARD COMPONENT ---

export default function ProposalsDashboard() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [proposals, setProposals] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [isAnimated, setIsAnimated] = useState(false);
  const perPage = 10;
  
  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/proposals`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 403) {
            localStorage.clear();
            navigate('/login');
            return;
        }

        const data = await response.json();
        setProposals(data); 
      } catch (error) {
        console.error('Error fetching proposals:', error);
      }
    };
    fetchProposals();
  }, [navigate]);

  const sortedData = useMemo(() => {
    let sortableItems = [...proposals];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aVal, bVal;
        
        if (sortConfig.key === 'createdAt') {
          aVal = new Date(a[sortConfig.key]);
          bVal = new Date(b[sortConfig.key]);
        } else {
          aVal = a[sortConfig.key]?.toString().toLowerCase() || "";
          bVal = b[sortConfig.key]?.toString().toLowerCase() || "";
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [proposals, sortConfig]);

  const filteredData = useMemo(() => 
    sortedData.filter((item) =>
        item.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        item.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        item.brandDisplayName?.toLowerCase().includes(search.toLowerCase()) ||
        item.campaignName?.toLowerCase().includes(search.toLowerCase())
    ), [sortedData, search]);


  const paginatedData = useMemo(() => 
    filteredData.slice((currentPage - 1) * perPage, currentPage * perPage), 
    [filteredData, currentPage, perPage]);

   useEffect(() => {
      setIsAnimated(false);
      const timeout = setTimeout(() => {
        setIsAnimated(true);
      }, 50);
      return () => clearTimeout(timeout);
    }, [paginatedData]);

  const totalPages = Math.ceil(filteredData.length / perPage);

  const handleSortChange = (e) => {
    const [key, direction] = e.target.value.split(':');
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 h-screen w-screen text-black flex flex-col lg:flex-row overflow-hidden">
      <Navbar />

      <main className={`flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
         <h2 className="text-2xl font-sans font-normal">Proposals ({filteredData.length})</h2>
        </div>

        <div className="mt-6 text-sm flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center">
          <Input
            className="md:w-[30%] h-[2.2rem] text-xs"
            placeholder="Search by Company, Client, Brand, or Campaign"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
          <select 
            onChange={handleSortChange} 
            className="px-3 py-2 border rounded-md w-full md:w-auto bg-white text-xs h-[2.2rem]"
            value={`${sortConfig.key}:${sortConfig.direction}`}
          >
            <option value="createdAt:desc">Sort by: Latest</option>
            <option value="createdAt:asc">Sort by: Oldest</option>
            <option value="companyName:asc">Sort by: Company Name (A-Z)</option>
            <option value="companyName:desc">Sort by: Company Name (Z-A)</option>
          </select>
        </div>

        <div className={`mt-6 grid grid-cols-1 gap-4 w-full transform transition-all duration-500 ease-out ${
          isAnimated ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
        }`}>
          {paginatedData.length > 0 ? paginatedData.map((item) => (
            <Card key={item._id} className="transition hover:shadow-md cursor-pointer" onClick={() => navigate(`/proposal/${item._id}`)}>
              <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-sm font-semibold break-words">{item.companyName}</div>
                  <div className="text-xs text-gray-600">Client: {item.clientName || 'N/A'}</div>
                  <div className="text-xs text-gray-600">Campaign: {item.campaignName || 'N/A'}</div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                    {item.clientType || 'N/A'}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">
                    {item.industry || 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className='text-center py-10 text-gray-500'>
              No proposals found.
            </div>
          )}
        </div>

        <div className="mt-6">
            {/* MODIFIED: Pagination call now includes totalCount and itemsPerPage */}
            <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={setCurrentPage}
                totalCount={filteredData.length}
                itemsPerPage={perPage}
            />
        </div>
      </main>
    </div>
  );
}