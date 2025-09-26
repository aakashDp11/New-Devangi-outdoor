import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useSidebar } from '../context/SidebarContext';
// NEW: Import necessary icons
import { FaArrowLeft, FaArrowRight, FaDownload } from 'react-icons/fa';

// --- UI HELPER COMPONENTS ---
const Button = ({ children, className = '', ...props }) => (
    <button className={`px-4 py-2 rounded bg-black text-white hover:transition ${className}`} {...props}>
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

/**
 * NEW: Enhanced Pagination Component with page search input.
 */
const EnhancedPaginationControls = ({ currentPage, totalPages, onPageChange, totalCount, itemsPerPage }) => {
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

    if (totalCount === 0) return null;

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-xs gap-4">
            <span className="text-gray-600">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
            </span>
            {totalPages > 1 && (
                <div className="flex items-center gap-2">
                    <button onClick={() => onPageChange(currentPage > 1 ? currentPage - 1 : 1)} disabled={currentPage === 1} className="px-3 py-1.5 border rounded-md bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                    <form onSubmit={handlePageSubmit} className="flex items-center gap-2">
                        <span className="text-gray-700">Page</span>
                        <input type="text" value={pageInput} onChange={(e) => setPageInput(e.target.value)} className="w-10 h-7 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <span className="text-gray-700">of {totalPages}</span>
                    </form>
                    <button onClick={() => onPageChange(currentPage < totalPages ? currentPage + 1 : totalPages)} disabled={currentPage === totalPages} className="px-3 py-1.5 border rounded-md bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
                </div>
            )}
        </div>
    );
};
// --- End of UI Helper Components ---

export default function Gallery() {
    const navigate = useNavigate();
    const { isCollapsed } = useSidebar();
    const [bookings, setBookings] = useState([]);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0); // NEW: State for total count
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' }); // NEW: State for sorting
    const [isAnimated, setIsAnimated] = useState(false);

    useEffect(() => {
        const fetchBookings = async () => {
            const token = localStorage.getItem('accessToken');
            try {
                // MODIFIED: Added sortKey and sortDirection to the API call
                // const params = new URLSearchParams({
                //     page: currentPage,
                //     limit: 10,
                //     search: search,
                //     sortKey: sortConfig.key,
                //     sortDirection: sortConfig.direction,
                // });

                // const response = await fetch(
                //     `${import.meta.env.VITE_API_BASE_URL}/api/bookings/artworks-by-booking`,
                //     { headers: { Authorization: `Bearer ${token}` } }
                // );
                const baseUrl = `${import.meta.env.VITE_API_BASE_URL}/api/bookings/artworks-by-booking`;

                // 2. Create URLSearchParams for all query parameters
                const params = new URLSearchParams({
                    page: currentPage,
                    limit: 10, // Assuming a fixed limit for now, or make it a state variable
                    // Only add search param if it has a value
                    ...(search && { search: search }),
                    sortKey: sortConfig.key,
                    sortDirection: sortConfig.direction,
                });

                // 3. Combine base URL and params to form the final API endpoint URL
                const finalUrl = `${baseUrl}?${params.toString()}`;

                console.log("Fetching from URL:", finalUrl); // Good for debugging

                const response = await fetch(
                    finalUrl, // *** CORRECTED: Use the URL with query parameters ***
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json', // Good practice for APIs
                        }
                    }
                );

                if (response.status === 403) {
                    localStorage.clear();
                    navigate('/login');
                    return;
                }

                const data = await response.json();
                setBookings(data.bookings || []);
                setTotalPages(data.totalPages || 1);
                setTotalCount(data.totalCount || 0); // NEW: Set the total count from the API response
            } catch (error) {
                console.error('Error fetching bookings:', error);
            }
        };

        fetchBookings();
    }, [currentPage, search, navigate, sortConfig]); // MODIFIED: Added sortConfig to dependency array

    useEffect(() => {
        setIsAnimated(false);
        const timeout = setTimeout(() => {
            setIsAnimated(true);
        }, 50);
        return () => clearTimeout(timeout);
    }, [currentPage, bookings]);

    const handleSortChange = (e) => { // NEW: Handler for the sort dropdown
        const [key, direction] = e.target.value.split(':');
        setSortConfig({ key, direction });
        setCurrentPage(1); // Reset to first page on sort change
    };

    // --- Download handlers remain unchanged ---
    const handleDownloadImages = async (item) => {
        for (const campaign of item.campaigns || []) {
            const pipelines = Array.isArray(campaign.pipeline) ? campaign.pipeline : [campaign.pipeline].filter(Boolean);
            
            for (const pipe of pipelines) {
                const url = pipe?.artwork?.documentUrl;
                if (url) {
                    try {
                        const response = await fetch(url);
                        if (!response.ok) throw new Error(`Network response was not ok`);
                        const blob = await response.blob();
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        const fileName = `${campaign.campaignName || 'artwork'}_${url.substring(url.lastIndexOf('/') + 1)}`;
                        link.download = fileName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        setTimeout(() => URL.revokeObjectURL(link.href), 100);
                    } catch (error) {
                        console.error('Download failed, falling back to new tab:', url, error);
                        window.open(url, '_blank');
                    }
                }
            }
        }
    };

    const handleDownloadSingleImage = async (event, url, fileName) => {
        event.stopPropagation();
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(link.href), 100);
        } catch (error) {
            console.error('Download failed for single image:', url, error);
            window.open(url, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 h-screen w-screen text-black flex flex-col lg:flex-row overflow-hidden">
            <Navbar />
            <main className={`flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    {/* MODIFIED: Title now shows total count */}
                    <h2 className="text-2xl font-sans font-normal">Gallery ({totalCount})</h2>
                </div>
                
                {/* MODIFIED: Filter bar now includes a sort dropdown */}
                <div className="flex flex-col md:flex-row gap-4 my-4">
                    <input
                        type="text"
                        className="w-full md:w-1/3 px-4 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Search by Company, Client, Booking..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                    <select 
                        onChange={handleSortChange} 
                        className="px-3 py-2 border rounded-md w-full md:w-auto bg-white text-xs h-[2.2rem]"
                        value={`${sortConfig.key}:${sortConfig.direction}`}
                    >
                        <option value="createdAt:desc">Sort by: Newest</option>
                        <option value="createdAt:asc">Sort by: Oldest</option>
                        <option value="companyName:asc">Sort by: Company (A-Z)</option>
                        <option value="companyName:desc">Sort by: Company (Z-A)</option>
                    </select>
                </div>

                <div className={`mt-6 grid grid-cols-1 gap-4 w-full transform transition-all duration-500 ease-out ${
                isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
                }`}>
                    {bookings.length > 0 ? bookings.map((item) => (
                        <Card key={item._id} className="transition hover:shadow-md">
                            <CardContent className="flex flex-col gap-4">
                                <div className="text-md font-semibold text-black">
                                    {item.companyName || 'No Company Name'}
                                </div>

                                {/* <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                    {(item.campaigns || []).flatMap((campaign, cIdx) => {
                                       
                                        
                                       
                                            const url = campaign?.artworkDocumentUrl;
                                            const campaignName = campaign.campaignName || 'Campaign';
                                            const campaignId = campaign._id;
                                            console.log("Url is",url);
                                        

                                            
                                                <div
                                                    key={`${cIdx}`}
                                                    className="relative group w-full h-32 cursor-pointer"
                                                    onClick={() => navigate(`/campaign-details/${campaignId}`)}
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`Artwork for ${campaignName}`}
                                                        className="rounded w-full h-full object-cover bg-gray-100"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2">
                                                        <p className="text-white text-center text-xs font-semibold">{campaignName}</p>
                                                       
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const fileName = `${campaignName || 'artwork'}_${url.substring(url.lastIndexOf('/') + 1)}`;
                                                                handleDownloadSingleImage(e, url, fileName);
                                                            }}
                                                            className="text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-full text-xs flex items-center gap-1 mt-2"
                                                        >
                                                            <FaDownload /> Download
                                                        </button>
                                                    </div>
                                                </div>
                                           
                                       
                                    })}
                                </div> */}
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
    {(item.campaigns || []).flatMap((campaign, cIdx) => {
        const url = campaign?.artworkDocumentUrl;
        const campaignName = campaign.campaignName || 'Campaign';
        const campaignId = campaign.campaignId;
        console.log("Url is", url);
        if (!url) {
            // If there's no URL, return a blank placeholder div
            return (
                <div
                    key={`${cIdx}-blank`} // Use a distinct key for blank items
                    className="relative group w-full h-32 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-sm"
                >
                  
                </div>
            );
        }
        // You need to explicitly return the JSX element here
        return (
            <div
                key={`${cIdx}`} // Consider using a more unique key if possible, like campaignId
                className="relative group w-full h-32 cursor-pointer"
                onClick={() => navigate(`/campaign-details/${campaignId}`)}
            >
                <img
                    src={url}
                    // alt={`Artwork for ${campaignName}`}
                    className="rounded w-full h-full object-cover bg-gray-100"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2">
                    <p className="text-white text-center text-xs font-semibold">{campaignName}</p>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const fileName = `${campaignName || 'artwork'}_${url.substring(url.lastIndexOf('/') + 1)}`;
                            handleDownloadSingleImage(e, url, fileName);
                        }}
                        className="text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-full text-xs flex items-center gap-1 mt-2"
                    >
                        <FaDownload /> Download
                    </button>
                </div>
            </div>
        );
    })}
</div>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-2">
                                    <div className="flex-1 flex flex-col gap-1">
                                        <div className="text-xs text-gray-600">Client: {item.clientName || 'N/A'}</div>
                                        <div className="text-xs text-gray-600">Brand: {item.brandDisplayName || 'N/A'}</div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                                            {item.clientType || 'N/A'}
                                        </span>
                                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                                            {item.campaigns?.[0]?.industry || 'N/A'}
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
                
                {/* MODIFIED: Using the new enhanced pagination component */}
                <EnhancedPaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalCount={totalCount}
                    itemsPerPage={10}
                />
            </main>
        </div>
    );
}