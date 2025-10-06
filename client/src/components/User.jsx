import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar'; // Assuming this is imported correctly
import { toast } from 'sonner'; // From Code 1
import { FaArrowLeft, FaArrowRight, FaExclamationTriangle, FaCheck } from 'react-icons/fa'; // Used for Code 2 UI
import { useSidebar } from '../context/SidebarContext'; // Assuming this is imported correctly

// --- REUSABLE UI COMPONENTS (FROM CODE 2) ---

// Card component with a flowing gradient animation on the background
const Card = ({ children, className = '', ...props }) => (
  <div
    className={`
      bg-gray-100 bg-opacity-80 shadow-xl rounded-2xl w-full flex flex-col relative overflow-hidden
      ${className}
    `}
    {...props}
  >
    {/* Removed background animation for simplicity in a merged file, but kept the style classes for modern look */}
    <div className='relative z-10 h-full flex flex-col'>{children}</div>
  </div>
);

// CardContent component for consistent padding and layout
const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 md:p-6 flex-grow flex flex-col ${className}`}>
    {children}
  </div>
);

// Button component with consistent styling and loading state (modified from Code 2 to remove loading logic not needed by Code 1's main component)
const Button = ({ children, className = '', disabled = false, ...props }) => (
  <button
    className={`px-4 py-2 rounded-xl bg-black text-white text-xs font-medium transition-all duration-200 transform hover:scale-105 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg ${className}`}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);

// Input component with a more polished look and error handling (from Code 2)
const Input = ({ className = '', error = null, ...props }) => (
  <div className='relative'>
    <input
      className={`border ${
        error ? 'border-red-300' : 'border-gray-200'
      } px-4 py-2 rounded-xl w-full bg-white text-gray-800 focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
      {...props}
    />
    {error && (
      <p className='absolute -bottom-5 left-0 text-red-500 text-xs mt-1'>
        {error}
      </p>
    )}
  </div>
);

// Reusable Pagination component with updated style and validation (from Code 2)
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  itemsPerPage,
  loading = false, // Added for completeness, but not strictly used as per Code 1's logic
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
    // Basic validation from Code 2
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

  // Handler from Code 1/Code 2 for submitting the page search input
  const handlePageSubmit = (e) => {
    e.preventDefault();
    if (pageInputError) return;

    const pageNum = parseInt(pageInput, 10);
    if (pageNum && pageNum > 0 && pageNum <= totalPages) {
      onPageChange(pageNum);
    } else {
      // Reset input to current page if entry is invalid/out of range
      setPageInput(currentPage.toString());
      setPageInputError(null);
    }
  };

  if (totalCount === 0 && !loading) {
    return null; // Return null as in Code 1, or the no-results message from Code 2
  }
  
  // Show no results message if filteredData.length is 0
  if (totalCount === 0) {
      return (
        <div className='text-center py-20 animate-fadeIn'>
          <div className='text-gray-500 text-lg mb-2'>
            <span role='img' aria-label='box'>📦</span>
          </div>
          <div className='text-gray-500'>No users found</div>
        </div>
      );
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className='flex flex-col sm:flex-row justify-between items-center mt-6 text-xs gap-4'>
      <span className='text-gray-600 transition-all duration-200 hover:text-gray-800'>
        {`Showing ${startItem} - ${endItem} of ${totalCount} results`}
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
              <span className='text-gray-800'>Page</span>
              <Input
                type='text'
                value={pageInput}
                onChange={handlePageInputChange}
                className='w-12 h-8 text-center rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md'
                error={pageInputError}
                onBlur={handlePageSubmit}
              />
              <span className='text-gray-800'>of {totalPages}</span>
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


// --- MAIN USER COMPONENT (Logic from Code 1, Styling from Code 2) ---

export default function User() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [isAnimated, setIsAnimated] = useState(false); // From Code 1 for card entry animation
  const [showModal, setShowModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [loading, setLoading] = useState(false); // From Code 2 for a better UX
  const perPage = 10;

  // Data Fetching (Logic from Code 1, wrapped in useCallback for dependency array in useEffect)
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users.'); // Using toast from Code 1
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Delete (Logic from Code 1, using 'sonner' toast)
  const handleDelete = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/${userToDelete}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || 'User deleted successfully');
        fetchUsers();
      } else {
        toast.error(result.message || 'Error deleting user');
      }
    } catch (err) {
      toast.error('An error occurred while deleting the user.');
    } finally {
      setShowModal(false);
      setUserToDelete(null);
    }
  };

  // Sorting Logic (from Code 1)
  const sortedData = useMemo(() => {
    let sortableItems = [...users];
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
  }, [users, sortConfig]);

  // Filtering Logic (from Code 1)
  const filteredData = useMemo(() =>
    sortedData.filter((user) => {
        const s = search.toLowerCase();
        return (
          user.name?.toLowerCase().includes(s) ||
          user.email?.toLowerCase().includes(s) ||
          user.phone?.includes(s)
        );
      }), [sortedData, search]);

  // Pagination Logic (from Code 1)
  const paginatedData = useMemo(() =>
    filteredData.slice((currentPage - 1) * perPage, currentPage * perPage),
    [filteredData, currentPage, perPage]);

  const totalPages = Math.ceil(filteredData.length / perPage);

  // Animation effect for cards on page change (from Code 1)
  useEffect(() => {
    setIsAnimated(false);
    const timeout = setTimeout(() => {
      setIsAnimated(true);
    }, 50);
    return () => clearTimeout(timeout);
  }, [currentPage, paginatedData, search, sortConfig]);

  // Handle Sort Change (from Code 1)
  const handleSortChange = (e) => {
    const [key, direction] = e.target.value.split(':');
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // Handle Search Change (from Code 1, updated to match Input component style from Code 2)
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // Role Badge Color Utility (from Code 2)
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-200 text-red-800';
      case 'editor':
        return 'bg-purple-200 text-purple-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-gray-800 flex flex-col lg:flex-row overflow-hidden'>
      <Navbar />

      <main
        className={`flex-1 h-full overflow-y-auto px-4 md:px-6 py-8 transition-all duration-300 ${
          isCollapsed ? 'lg:ml-24' : 'lg:ml-64'
        }`}
      >
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6 animate-slideDown'>
          <div className="flex items-center gap-4">
            {/* Added Back Button for Code 2 aesthetic */}
            <Button onClick={() => navigate(-1)} className="text-white bg-black hidden sm:inline-flex">
              <FaArrowLeft className="inline mr-2" />
              Back
            </Button>
            <h2 className='text-2xl font-sans font-normal'>
              Users ({filteredData.length})
              {loading && <span className='ml-2 text-sm text-gray-500'>Loading...</span>}
            </h2>
          </div>
          <Button onClick={() => navigate('/create-user')}>+ Create User</Button>
        </div>

        {/* Search and Sort Section (Styling from Code 2) */}
        <Card className='mt-6 shadow-xl animate-slideUp bg-gray-100 bg-opacity-80'>
          <CardContent>
            <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
              <div className='w-full md:w-[50%]'>
                <Input
                  className='h-[2.2rem] text-xs'
                  placeholder='Search by name, email, or phone...'
                  value={search}
                  onChange={handleSearchChange}
                  // No specific error handling for search, so passing null
                />
              </div>
              <div className='flex items-center gap-2 flex-shrink-0'>
                <div className='w-full md:w-auto'>
                  <select
                    onChange={handleSortChange}
                    className='px-4 py-2 rounded-xl w-full bg-white text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-black transition-all duration-200 shadow-sm hover:shadow-md h-[2.2rem]'
                    value={`${sortConfig.key}:${sortConfig.direction}`}
                  >
                    <option value='createdAt:desc'>Sort by: Newest</option>
                    <option value='createdAt:asc'>Sort by: Oldest</option>
                    <option value='name:asc'>Sort by: Name (A-Z)</option>
                    <option value='name:desc'>Sort by: Name (Z-A)</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Cards (Logic from Code 1, Styling from Code 2) */}
        <div className='mt-6 relative'>
          {loading ? (
            <div className='absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center z-10'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-8 h-8 border-2 border-[black] border-t-transparent rounded-full animate-spin'></div>
                <div className='text-gray-500 text-sm'>
                  Loading users...
                </div>
              </div>
            </div>
          ) : (
            <div className={`grid grid-cols-1 gap-4 w-full transform transition-all duration-500 ease-out ${
              isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0' // Code 1 animation logic
            }`}>
              {paginatedData.length > 0 ? (
                paginatedData.map((user, index) => (
                  <Card
                    key={user._id}
                    className='transition hover:shadow-lg' // Combined style
                    // style={{ animationDelay: `${index * 50}ms` }} // Removed Code 2 staggered animation for simplicity/Clarity
                  >
                    <CardContent className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
                      <div className='flex-1 flex flex-col gap-1'>
                        <div className='text-sm font-semibold break-words text-gray-800'>
                          {user.name || 'Unnamed User'}
                        </div>
                        <div className='text-xs text-gray-600'>
                          Email: {user.email || 'Not Provided'}
                        </div>
                        <div className='text-xs text-gray-600'>
                          Phone: {user.phone || 'Not Provided'}
                        </div>
                      </div>
                      <div className='flex flex-wrap gap-2 items-center'>
                        <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(user.role)} font-medium`}>
                          {user.role || 'member'}
                        </span>
                        <span className='text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-800 font-medium'>
                          Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                        {user.role !== 'admin' && (
                          <button
                            className='text-xs px-2 py-1 rounded-full bg-red-200 hover:bg-red-300 text-red-800 font-medium transition-all duration-200'
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserToDelete(user._id);
                              setShowModal(true);
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm">No users found matching your criteria.</div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalCount={filteredData.length}
            itemsPerPage={perPage}
            loading={loading}
          />
        </div>
      </main>

      {/* Confirmation Modal (Styling from Code 2) */}
      {showModal && (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fadeIn'>
          <div className='bg-gray-100 p-6 rounded-2xl shadow-lg w-80 text-gray-800 transform transition-all duration-300 scale-95 hover:scale-100'>
            <h2 className='text-lg font-semibold mb-4'>Confirm Deletion</h2>
            <p className='text-sm text-gray-600 mb-6'>
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className='flex justify-end gap-2 text-sm'>
              <Button
                className='bg-gray-700 text-white'
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button
                className='bg-red-500 hover:bg-red-600'
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tailwind CSS keyframes for animations used in both codes */}
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
      `}</style>
    </div>
  );
}