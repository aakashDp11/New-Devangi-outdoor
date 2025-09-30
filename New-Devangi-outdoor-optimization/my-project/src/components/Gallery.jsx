import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
// Assuming 'Navbar' and 'useSidebar' are correctly implemented in your project structure
import Navbar from './Navbar'; 
import { useSidebar } from '../context/SidebarContext'; 
// Import necessary icons
import { FaArrowLeft, FaArrowRight, FaDownload, FaExclamationTriangle, FaCheck } from 'react-icons/fa';

// --- UI COMPONENTS (Styled/Logic from Code 2) ---

// Define CSS variables for styling (as referenced in Code 2 styles)
// These should ideally be in a global CSS file, but are included here for context.
// Assuming: --color-text: black; --color-muted: gray-600; --color-primary-dark: #3730a3 (indigo-700)

// Button component with consistent styling and loading state
const Button = ({ children, className = '', disabled = false, loading = false, ...props }) => (
    <button
        className={`px-4 py-2 rounded-xl bg-[black] text-white text-xs font-medium transition-all duration-200 transform hover:scale-105 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg ${className}`}
        disabled={disabled || loading}
        {...props}
    >
        {loading ? (
            <div className='flex items-center gap-2'>
                <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                {children}
            </div>
        ) : (
            children
        )}
    </button>
);

// Input component with a more polished look and error handling
const Input = ({ className = '', error = null, ...props }) => (
    <div className='relative'>
        <input
            // Used Tailwind classes to approximate Code 2's variable use and look
            className={`border ${
                error ? 'border-red-300' : 'border-gray-200'
            } px-4 py-2 rounded-xl w-full bg-white text-black focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
            {...props}
        />
        {error && (
            // Assuming .animate-slideDown is defined in the <style> block
            <p className='absolute -bottom-5 left-0 text-red-500 text-xs mt-1 animate-slideDown'>
                {error}
            </p>
        )}
    </div>
);

// Card component with a flowing gradient animation on the background
const Card = ({ children, className = '', ...props }) => (
    <div
        className={`
            bg-gray-100 bg-opacity-80 shadow-xl rounded-2xl w-full flex flex-col relative overflow-hidden
            ${className}
        `}
        {...props}
    >
        {/* Placeholder for Code 2's animation style. Requires custom CSS. */}
        <div className='absolute inset-0 bg-gradient-to-br from-white via-indigo-50 to-purple-50 opacity-20 animate-bg-gradient-flow-diagonal z-0'></div>
        <div className='relative z-10 h-full flex flex-col'>{children}</div>
    </div>
);

// CardContent component for consistent padding and layout
const CardContent = ({ children, className = '' }) => (
    <div className={`p-4 md:p-6 flex-grow flex flex-col ${className}`}>
        {children}
    </div>
);

// Notification system component (from Code 2, using toast. It's better to rely on 'sonner' as imported)
// For simplicity and best practice with 'sonner', we'll rely on the 'toast' utility directly
// and remove the local 'Notification' component which would conflict with 'sonner'.
// The 'addNotification' function will now use 'toast'.

// Reusable Pagination component with updated style and logic (from Code 1/2 merge)
const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    totalCount,
    itemsPerPage,
    loading,
}) => {
    const [pageInput, setPageInput] = useState(currentPage.toString());
    const [pageInputError, setPageInputError] = useState(null);

    useEffect(() => {
        setPageInput(currentPage.toString());
        setPageInputError(null);
    }, [currentPage]);

    const handlePageInputChange = (e) => {
        const value = e.target.value;
        setPageInput(value);
        if (value === '') {
            setPageInputError('Page cannot be empty');
        } else if (!/^\d+$/.test(value)) {
            setPageInputError('Must be a number');
        } else {
            const pageNum = parseInt(value, 10);
            if (pageNum <= 0) {
                setPageInputError('Page must be positive');
            } else if (pageNum > totalPages) {
                setPageInputError(`Max ${totalPages}`);
            } else {
                setPageInputError(null);
            }
        }
    };

    const handlePageSubmit = (e) => {
        e.preventDefault();
        if (pageInputError) return;

        const pageNum = parseInt(pageInput, 10);
        if (pageNum && pageNum > 0 && pageNum <= totalPages) {
            onPageChange(pageNum);
        } else {
            setPageInput(currentPage.toString());
            setPageInputError(null);
        }
    };

    if (totalCount === 0 && !loading) {
        return (
            <div className='text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm'>
                No items found.
            </div>
        );
    }

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalCount);

    return (
        <div className='flex flex-col sm:flex-row justify-between items-center mt-6 text-xs gap-4 animate-fadeIn'>
            {/* Using Tailwind for color approximation */}
            <span className='text-gray-600 transition-all duration-200 hover:text-black'>
                {totalCount > 0 ? `Showing ${startItem} - ${endItem} of ${totalCount} results` : ''}
            </span>
            {totalPages > 1 && (
                <div className='flex items-center gap-4'>
                    <button
                        className='p-3 rounded-full bg-white shadow-sm hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200'
                        onClick={() => onPageChange(currentPage > 1 ? currentPage - 1 : 1)}
                        disabled={currentPage === 1 || loading}
                    >
                        <FaArrowLeft className='inline' />
                    </button>
                    <div className='flex flex-col items-center'>
                        <form onSubmit={handlePageSubmit} className='flex items-center gap-2'>
                            <span className='text-black'>Page</span>
                            <Input
                                type='text'
                                value={pageInput}
                                onChange={handlePageInputChange}
                                className='w-12 h-8 text-center rounded-lg bg-white text-black focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md'
                                error={pageInputError}
                                onBlur={handlePageSubmit}
                            />
                            <span className='text-black'>of {totalPages}</span>
                        </form>
                    </div>
                    <button
                        className='p-3 rounded-full bg-white shadow-sm hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200'
                        onClick={() => onPageChange(currentPage < totalPages ? currentPage + 1 : totalPages)}
                        disabled={currentPage === totalPages || loading}
                    >
                        <FaArrowRight className='inline' />
                    </button>
                </div>
            )}
        </div>
    );
};


// --- MAIN GALLERY COMPONENT ---
export default function Gallery() {
    const navigate = useNavigate();
    const { isCollapsed } = useSidebar();
    const [bookings, setBookings] = useState([]);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    const [loading, setLoading] = useState(false);

    // Using toast (sonner) from Code 2 for notifications
    const addNotification = useCallback((message, type = 'success') => {
        if (type === 'error') {
            toast.error(message);
        } else if (type === 'info') {
            toast.info(message);
        } else {
            toast.success(message);
        }
    }, []);

    // Logic from Code 1, using the API structure and useCallback from Code 2
    const fetchBookings = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                // Only add search param if it has a value (logic correction from Code 1)
                ...(search && { search: search }), 
                sortKey: sortConfig.key,
                sortDirection: sortConfig.direction,
            });

            // Using the API endpoint structure from Code 2 for the correct query params handling
            const finalUrl = `${import.meta.env.VITE_API_BASE_URL}/api/bookings/artworks-by-booking?${params.toString()}`;
            // NOTE: Code 1 used a different endpoint in the useCallback block which seemed to be a mistake.
            // Using a corrected endpoint from the commented section in Code 1, or assuming
            // the Code 2 endpoint structure is correct if it was an "optimized" one:
            // const finalUrl = `${import.meta.env.VITE_API_BASE_URL}/api/bookings/optimized?${params.toString()}`;

            const response = await fetch(
                finalUrl,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 403) {
                localStorage.clear();
                navigate('/login');
                addNotification('Session expired. Please log in again.', 'error');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch bookings');
            }

            const data = await response.json();
            setBookings(data.bookings || []);
            setTotalPages(data.totalPages || 1);
            setTotalCount(data.totalCount || 0);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            addNotification('Failed to fetch bookings.', 'error');
        } finally {
            setLoading(false);
        }
    }, [currentPage, search, navigate, sortConfig, addNotification]); // Dependencies from Code 1 & 2

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // Handlers from Code 1
    const handleSortChange = (e) => {
        const [key, direction] = e.target.value.split(':');
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    };

    // Download logic from Code 1 (with toast from Code 2)
    const handleDownloadImages = async (item) => {
        const promises = (item.campaigns || []).flatMap((campaign) => {
            // Logic to handle both single object and array for pipeline from Code 1
            const pipelines = Array.isArray(campaign.pipeline) ? campaign.pipeline : [campaign.pipeline].filter(Boolean);
            return pipelines.map((pipe, pIdx) => {
                const url = pipe?.artwork?.documentUrl;
                if (!url) return null;
                return new Promise((resolve) => {
                    // Fallback to new tab to reliably trigger download for multiple files
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${campaign.campaignName || 'artwork'}_${url.substring(url.lastIndexOf('/') + 1)}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    resolve();
                });
            }).filter(Boolean);
        });

        if (promises.length > 0) {
            toast.info('Initiating bulk download...');
            // NOTE: Promise.all will wait for all links to be clicked, but actual download confirmation is OS dependent.
            await Promise.all(promises);
            toast.success('All available artworks are being downloaded. Check your downloads folder.');
        } else {
            toast.info('No artworks to download for this booking.');
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
            URL.revokeObjectURL(link.href);
            addNotification('Download successful!');
        } catch (error) {
            console.error('Download failed for single image:', url, error);
            addNotification('Failed to download image. Opening in a new tab.', 'error');
            window.open(url, '_blank');
        }
    };


    return (
        // UI Structure and Styling from Code 2
        <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-black flex flex-col lg:flex-row overflow-hidden'>
            <Navbar />

            {/* Sonner Toast (Assuming it's imported and set up globally, or use a local component) */}
            {/* If you are using 'sonner', you would typically have a <Toaster /> component in your root layout. */}

            <main
                className={`flex-1 h-full overflow-y-auto px-4 md:px-6 py-8 transition-all duration-300 ${
                    isCollapsed ? 'lg:ml-24' : 'lg:ml-64'
                }`}
            >
                <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6 animate-slideDown'>
                    <div className="flex items-center gap-4">
                        {/* Back button from Code 2 */}
                        <Button onClick={() => navigate(-1)} className="text-white bg-black">
                            <FaArrowLeft className="inline mr-2" />
                            Back
                        </Button>
                        <h2 className='text-2xl font-sans font-normal'>
                            Gallery ({totalCount})
                            {loading && <span className='ml-2 text-sm text-gray-600'>Loading...</span>}
                        </h2>
                    </div>
                </div>

                {/* Search and Sort Filter Bar (Styled from Code 2) */}
                <Card className='mt-6 shadow-xl animate-slideUp bg-gray-100 bg-opacity-80'>
                    <CardContent>
                        <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
                            <div className='w-full md:w-[50%]'>
                                <Input
                                    className='h-[2.2rem] text-xs'
                                    placeholder='Search by Company, Client, Booking...'
                                    value={search}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            <div className='flex items-center gap-2 flex-shrink-0 w-full md:w-auto'>
                                <div className='w-full'>
                                    <select
                                        onChange={handleSortChange}
                                        className='px-4 py-2 rounded-xl w-full bg-white text-xs text-black focus:outline-none focus:ring-2 focus:ring-[black] transition-all duration-200 shadow-sm hover:shadow-md'
                                        value={`${sortConfig.key}:${sortConfig.direction}`}
                                    >
                                        <option value='createdAt:desc'>Sort by: Newest</option>
                                        <option value='createdAt:asc'>Sort by: Oldest</option>
                                        <option value='companyName:asc'>Sort by: Company (A-Z)</option>
                                        <option value='companyName:desc'>Sort by: Company (Z-A)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className='mt-6 relative'>
                    {loading && (
                        <div className='absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center z-10'>
                            <div className='flex flex-col items-center gap-3'>
                                <div className='w-8 h-8 border-2 border-[black] border-t-transparent rounded-full animate-spin'></div>
                                <div className='text-gray-600 text-sm'>
                                    Loading bookings...
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Gallery Items Grid */}
                    <div className={`grid grid-cols-1 gap-4 w-full ${!loading ? 'animate-slideIn' : ''}`}>
                        {bookings.length > 0 ? (
                            bookings.map((item, index) => (
                                <Card
                                    key={item._id}
                                    className="animate-slideIn"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <CardContent className="flex flex-col gap-4">
                                        <div className="text-md font-semibold text-black">
                                            {item.companyName || 'No Campaign Name'}
                                        </div>
                                        
                                        {/* Artwork Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                            {(item.campaigns || []).flatMap((campaign, cIdx) => {
                                                const pipelines = Array.isArray(campaign.pipeline) ? campaign.pipeline : [campaign.pipeline].filter(Boolean);
                                                
                                                // Check for both nested pipeline artwork (Code 2 logic) AND top-level artworkDocumentUrl (Code 1 logic)
                                                // Prioritize nested structure for completeness, but also render top-level if present.
                                                
                                                const artworks = pipelines.map(pipe => ({ 
                                                    url: pipe?.artwork?.documentUrl, 
                                                    campaignId: campaign._id,
                                                    campaignName: campaign.campaignName || 'Campaign',
                                                    startDate: campaign.startDate || pipe?.artwork?.startDate,
                                                    endDate: campaign.endDate || pipe?.artwork?.endDate,
                                                })).filter(a => a.url);

                                                // Fallback check for the structure in Code 1's Card loop
                                                if (artworks.length === 0 && campaign.artworkDocumentUrl) {
                                                    artworks.push({
                                                        url: campaign.artworkDocumentUrl,
                                                        campaignId: campaign._id,
                                                        campaignName: campaign.campaignName || 'Campaign',
                                                        startDate: campaign.startDate,
                                                        endDate: campaign.endDate,
                                                    });
                                                }

                                                return artworks.map((artwork, aIdx) => (
                                                    <div
                                                        key={`${artwork.campaignId}-${aIdx}`}
                                                        className="relative group w-full h-32 rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all duration-200"
                                                        onClick={() => navigate(`/campaign-details/${artwork.campaignId}`)}
                                                    >
                                                        <img
                                                            src={artwork.url}
                                                            alt={`Artwork for ${artwork.campaignName}`}
                                                            className="w-full h-full object-cover"
                                                            loading="lazy"
                                                        />
                                                        <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2">
                                                            <p className="text-white text-center text-xs font-semibold">{artwork.campaignName}</p>
                                                            {artwork.startDate && (
                                                                <p className="text-white text-center text-xs mt-1">
                                                                    Start: {new Date(artwork.startDate).toLocaleDateString()}
                                                                </p>
                                                            )}
                                                            {artwork.endDate && (
                                                                <p className="text-white text-center text-xs">
                                                                    End: {new Date(artwork.endDate).toLocaleDateString()}
                                                                </p>
                                                            )}
                                                            <button
                                                                onClick={(e) => handleDownloadSingleImage(e, artwork.url, `${artwork.campaignName}_artwork`)}
                                                                className="text-white bg-[black] hover:bg-indigo-700 px-3 py-1 rounded-full text-xs flex items-center gap-1 mt-2"
                                                            >
                                                                <FaDownload /> Download
                                                            </button>
                                                        </div>
                                                    </div>
                                                ));
                                            }).flat()}
                                        </div>

                                        {/* Footer Details */}
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-2">
                                            <div className="flex-1 flex flex-col gap-1">
                                                <div className="text-xs text-gray-600">Client: {item.clientName || 'N/A'}</div>
                                                <div className="text-xs text-gray-600">Brand: {item.brandDisplayName || 'N/A'}</div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 items-center">
                                                <span className="text-xs px-2 py-1 rounded-full bg-blue-200 text-blue-800 font-medium">
                                                    {item.clientType || 'N/A'}
                                                </span>
                                                <span className="text-xs px-2 py-1 rounded-full bg-purple-200 text-purple-800 font-medium">
                                                    {item.campaigns?.[0]?.industry || 'N/A'}
                                                </span>
                                                <Button
                                                    onClick={() => handleDownloadImages(item)}
                                                    className="text-xs px-3 py-1.5"
                                                >
                                                    <FaDownload className="inline mr-1" /> Download All
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            !loading && (
                                <div className='text-center py-10 text-gray-500 bg-gray-100 rounded-lg shadow-sm'>
                                    No bookings with artwork found.
                                </div>
                            )
                        )}
                    </div>
                </div>
                
                {/* Pagination */}
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalCount={totalCount}
                        itemsPerPage={10}
                        loading={loading}
                    />
                </div>
            </main>

            {/* Custom CSS for animations from Code 2 */}
            <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                @keyframes bg-gradient-flow-diagonal { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
                .animate-bg-gradient-flow-diagonal { background-size: 200% 200%; animation: bg-gradient-flow-diagonal 10s linear infinite; }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
                .animate-slideUp { animation: slideUp 0.4s ease-out; }
                .animate-slideDown { animation: slideDown 0.4s ease-out; }
                .animate-slideIn { animation: slideIn 0.4s ease-out; }
                .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
            `}</style>
        </div>
    );
}