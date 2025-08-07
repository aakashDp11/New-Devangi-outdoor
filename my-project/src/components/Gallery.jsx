import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useSidebar } from '../context/SidebarContext'; // 1. ADDED: Import the hook
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

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
  <div className={`p-4 ${className}`}>{children}</div>
);

const Pagination = ({ children }) => <div className="flex justify-center">{children}</div>;
const PaginationContent = ({ children, className = '' }) => (
  <div className={`flex gap-2 mt-4 text-xs flex-wrap ${className}`}>{children}</div>
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

export default function Gallery() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const perPage = 10;
  const [isAnimated, setIsAnimated] = useState(false);

  // useEffect(() => {
  //   const fetchBookings = async () => {
  //     const token = localStorage.getItem('accessToken');
  //     try {
  //       const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings`,{ headers: { Authorization: `Bearer ${token}` }});
  //       if (response.status === 403) {
  //     const errorData = await response.json();
  //     if (errorData.message === 'Invalid or expired token') {
  //       localStorage.removeItem('accessToken');
  //       localStorage.removeItem('userId');
  //       localStorage.removeItem('userRole');
  //       localStorage.removeItem('userEmail');
  //       navigate('/login'); // or use router.navigate('/login') if using React Router
  //       return;
  //     }
  //   }
  //       const data = await response.json();
  //       console.log(data)
  //       const sorted = data.bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  //       setBookings(sorted);
  //     } catch (error) {
  //       console.error('Error fetching bookings:', error);
  //     }
  //   };

  //   fetchBookings();
  // }, []);

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
          console.log(data)
          data.bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setBookings(data.bookings);
          setTotalPages(data.totalPages || 1);
        } catch (error) {
          console.error('Error fetching bookings:', error);
        }
      };
  
      fetchBookings();
    }, [currentPage, search, navigate]);

  

  const filteredData = bookings.filter((item) =>
    item.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    item.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    item.brandDisplayName?.toLowerCase().includes(search.toLowerCase()) ||
    item.campaigns?.some(c => c.campaignName?.toLowerCase().includes(search.toLowerCase()))
  );
  

  useEffect(() => {
    setIsAnimated(false);
    const timeout = setTimeout(() => {
      setIsAnimated(true);
    }, 50);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 h-screen w-screen text-black flex flex-col lg:flex-row overflow-hidden">
      <Navbar />
      <main className={`flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <h2 className="text-2xl font-sans font-normal">Gallery</h2>
        </div>
        
        {/* --- 2. CLEANED UP THE FILTER BAR --- */}
        <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <input
                type="text"
                className="w-full md:w-1/3 px-4 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by Company, Client, Campaign..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>

        <div className={`mt-6 grid grid-cols-1 gap-4 w-full transform transition-all duration-500 ease-out ${
          isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
        }`}>
          {filteredData.length ? filteredData.map((item) => (
            <Card key={item._id} className="transition hover:shadow-md cursor-pointer">
              <CardContent className="flex flex-col gap-4">
                <div className="text-md font-semibold text-black">
                  {item.campaigns?.[0]?.campaignName || 'No Campaign Name'}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {(item.campaigns || []).flatMap((campaign, cIdx) =>
                    (Array.isArray(campaign.pipeline) ? campaign.pipeline : [campaign.pipeline]).map((pipe, pIdx) => {
                      const url = pipe?.artwork?.documentUrl;
                      return url ? (
                        <img
                          key={`${cIdx}-${pIdx}`}
                          src={url}
                          alt={`Artwork for ${campaign.campaignName || 'Campaign'}`}
                          className="rounded w-full h-32 object-cover bg-gray-100"
                          loading="lazy"
                        />
                      ) : null;
                    }).filter(Boolean) // Remove null entries
                  )}
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-2">
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="text-sm font-semibold break-words">{item.companyName}</div>
                    <div className="text-xs text-gray-600">Client: {item.clientName || 'N/A'}</div>
                    <div className="text-xs text-gray-600">Brand: {item.brandDisplayName || 'N/A'}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                      {item.clientType || 'N/A'}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                      {item.industry || 'N/A'}
                    </span>
                    <button
                        onClick={() => handleDownloadImages(item)}
                        className="text-xs px-3 py-1.5 rounded-md bg-black text-white hover:bg-gray-800 transition"
                    >
                        Download
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm">No bookings with artwork found.</div>
          )}
        </div>

        <div className="mt-6">
          <Pagination>
            <PaginationContent className="gap-2">
              <PaginationItem>
                <PaginationLink
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1}
                >
                  <FaArrowLeft className='inline'/>
                </PaginationLink>
              </PaginationItem>
              <PaginationLink
                isActive
                onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : 1)}
              >
                Page {currentPage} of {totalPages}
              </PaginationLink>
              <PaginationItem>
                <PaginationLink
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                >
                  <FaArrowRight className='inline'/>
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </main>
    </div>
  );
}