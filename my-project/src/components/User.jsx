import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { toast } from 'sonner';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useSidebar } from '../context/SidebarContext';

// --- UI HELPER COMPONENTS ---

const Card = ({ children, className = '', ...props }) => (
  <div
    className={`bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm rounded-xl w-full text-[var(--color-text)] ${className}`}
    {...props}
  >
    {children}
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

/**
 * Pagination component with page search functionality.
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
      setPageInput(currentPage.toString());
    }
  };

  if (totalCount === 0) {
    return null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-8 text-xs gap-4 text-[var(--color-muted)]">
      <span>
        Showing {startItem} - {endItem} of {totalCount} results
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-4">
          <button
            onClick={() => onPageChange(currentPage > 1 ? currentPage - 1 : 1)}
            className="px-3 py-1.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition"
            disabled={currentPage === 1}
          >
            <FaArrowLeft className="inline" />
          </button>

          <form onSubmit={handlePageSubmit} className="flex items-center gap-2">
            <span className="text-[var(--color-text)]">Page</span>
            <input
              type="text"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              className="w-12 h-8 text-center border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-text)]"
              aria-label="Go to page"
            />
            <span className="text-[var(--color-text)]">of {totalPages}</span>
          </form>

          <button
            onClick={() =>
              onPageChange(currentPage < totalPages ? currentPage + 1 : totalPages)
            }
            className="px-3 py-1.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition"
            disabled={currentPage === totalPages}
          >
            <FaArrowRight className="inline" />
          </button>
        </div>
      )}
    </div>
  );
};

// --- MAIN USER COMPONENT ---

export default function User() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [isAnimated, setIsAnimated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const perPage = 10;

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/${userToDelete}`,
        { method: 'DELETE' }
      );
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

  const sortedData = useMemo(() => {
    let sortableItems = [...users];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aVal, bVal;
        if (sortConfig.key === 'createdAt') {
          aVal = new Date(a[sortConfig.key]);
          bVal = new Date(b[sortConfig.key]);
        } else {
          aVal = a[sortConfig.key]?.toString().toLowerCase() || '';
          bVal = b[sortConfig.key]?.toString().toLowerCase() || '';
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [users, sortConfig]);

  const filteredData = useMemo(
    () =>
      sortedData.filter(
        (user) =>
          user.name?.toLowerCase().includes(search.toLowerCase()) ||
          user.email?.toLowerCase().includes(search.toLowerCase()) ||
          user.phone?.includes(search)
      ),
    [sortedData, search]
  );

  const paginatedData = useMemo(
    () =>
      filteredData.slice((currentPage - 1) * perPage, currentPage * perPage),
    [filteredData, currentPage, perPage]
  );

  const totalPages = Math.ceil(filteredData.length / perPage);

  useEffect(() => {
    setIsAnimated(false);
    const timeout = setTimeout(() => {
      setIsAnimated(true);
    }, 50);
    return () => clearTimeout(timeout);
  }, [currentPage, paginatedData]);

  const handleSortChange = (e) => {
    const [key, direction] = e.target.value.split(':');
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen h-screen w-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col lg:flex-row overflow-hidden">
      <Navbar />

      <main
        className={`flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 transition-all duration-300 ${
          isCollapsed ? 'lg:ml-24' : 'lg:ml-64'
        }`}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <h2 className="text-2xl font-sans font-normal">
            Users ({filteredData.length})
          </h2>
        </div>

        {/* Search + Controls */}
        <div className="mt-6 text-sm flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center">
          <input
            type="text"
            className="w-full md:w-1/3 px-4 py-2 text-xs border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] h-[2.2rem] bg-[var(--color-surface)] text-[var(--color-text)]"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <select
              onChange={handleSortChange}
              className="px-3 py-2 border border-[var(--color-border)] rounded-md w-full md:w-auto bg-[var(--color-surface)] text-xs h-[2.2rem] text-[var(--color-text)]"
              value={`${sortConfig.key}:${sortConfig.direction}`}
            >
              <option value="createdAt:desc">Sort by: Newest</option>
              <option value="createdAt:asc">Sort by: Oldest</option>
              <option value="name:asc">Sort by: Name (A-Z)</option>
              <option value="name:desc">Sort by: Name (Z-A)</option>
            </select>
            <button
              onClick={() => navigate('/create-user')}
              className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-white text-xs font-medium hover:opacity-90 transition w-full md:w-auto h-[2.2rem]"
            >
              + Create User
            </button>
          </div>
        </div>

        {/* User Cards */}
        <div
          className={`mt-6 grid grid-cols-1 gap-4 w-full transform transition-all duration-500 ease-out ${
            isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
          }`}
        >
          {paginatedData.length > 0 ? (
            paginatedData.map((user) => (
              <Card key={user._id} className="transition hover:shadow-md relative">
                <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="text-sm font-semibold break-words">
                      {user.name}
                    </div>
                    <div className="text-xs text-[var(--color-muted)]">
                      Email: {user.email}
                    </div>
                    <div className="text-xs text-[var(--color-muted)]">
                      Phone: {user.phone || 'Not Provided'}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-text)] font-medium">
                      {user.role || 'member'}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-success-light)] text-[var(--color-success-text)] font-medium">
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                    {user.role !== 'admin' && (
                      <button
                        className="text-xs px-2 py-1 rounded-full bg-[var(--color-danger-light)] hover:bg-[var(--color-danger-hover)] text-[var(--color-danger-text)] font-medium"
                        onClick={() => {
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
            <div className="text-center py-10 text-[var(--color-muted)] bg-[var(--color-surface)] rounded-lg shadow-sm">
              No users found.
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
          />
        </div>
      </main>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] p-6 rounded-xl shadow-lg w-80 text-[var(--color-text)]">
            <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              Are you sure you want to delete this user? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2 text-sm">
              <button
                className="px-4 py-2 bg-[var(--color-muted-light)] text-[var(--color-text)] rounded-md hover:opacity-80"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-[var(--color-danger)] text-white rounded-md hover:opacity-90"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
