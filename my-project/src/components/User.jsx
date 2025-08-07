import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { toast } from 'sonner';
import { Dialog } from '@headlessui/react';
import { Navigate } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useSidebar } from '../context/SidebarContext'; // 1. ADDED: Import the hook

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
  <div className={`flex gap-2 mt-4 flex-wrap ${className}`}>{children}</div>
);
const PaginationItem = ({ children }) => <div>{children}</div>;
const PaginationLink = ({ children, isActive = false, onClick, disabled,className ='',}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1 rounded text-xs transition 
      ${isActive ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'}
      ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
      ${className}
    `}
  >
    {children}
  </button> 
);

export default function User() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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
      toast.error('Error deleting user');
    } finally {
      setShowModal(false);
      setUserToDelete(null);
    }
  };
  
  // NOTE: This client-side filtering works for small datasets.
  // For larger datasets, you would move filtering and pagination to the backend API.
  const filteredData = users.filter((user) =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.phone?.includes(search)
  );

  const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);
  const totalPages = Math.ceil(filteredData.length / perPage);

  useEffect(() => {
    setIsAnimated(false); // Reset animation state on data change
    const timeout = setTimeout(() => {
      setIsAnimated(true);
    }, 50);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen h-screen w-screen bg-gray-50 text-black flex flex-col lg:flex-row overflow-hidden">
      <Navbar />

      <main className={`flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h2 className="text-2xl font-sans font-normal">Users</h2>

        </div>

        {/* --- 2. CLEANED UP THE FILTER/ACTION BAR --- */}
        
        <div className="flex flex-col mt-[2%] md:flex-row justify-between items-center gap-4">
                <input
                    type="text"
                    className="w-full md:w-1/3 px-4 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search by name, email, or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button 
                    onClick={()=>navigate('/create-user')} 
                    className="px-4 py-2 rounded-md bg-black text-white text-xs font-medium hover:bg-gray-800 transition w-full md:w-auto"
                >
                    + Create User
                </button>
            </div>
        <div className={`mt-6 grid grid-cols-1 gap-4 w-full transform transition-all duration-500 ease-out ${
          isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
        }`}>
          {paginatedData.length > 0 ? paginatedData.map((user) => (
            <Card key={user._id} className="transition hover:shadow-md relative">
              <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-sm font-semibold break-words">{user.name}</div>
                  <div className="text-xs text-gray-600">Email: {user.email}</div>
                  <div className="text-xs text-gray-600">Phone: {user.phone || 'Not Provided'}</div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                    {user.role || 'member'}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                  {user.role !== 'admin' && (
                    <button
                      className="text-xs px-2 py-1 rounded-full bg-red-100 hover:bg-red-200 text-red-700 font-medium"
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
          )) : (
            <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm">No users found.</div>
          )}
        </div>

        <div className="mt-6">
          <Pagination>
            <PaginationContent className="gap-2">
              <PaginationLink
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="disabled:opacity-50"
              >
                <FaArrowLeft/>
              </PaginationLink>
              {/* {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    isActive={i + 1 === currentPage}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))} */}
              <PaginationItem>
                <PaginationLink
                  isActive
                  onClick={() =>
                    setCurrentPage(currentPage < totalPages ? currentPage + 1 : 1)
                  }
                >
                  Page {currentPage} of {totalPages}
                </PaginationLink>
              </PaginationItem>

              <PaginationLink
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="disabled:opacity-50"
              >
                <FaArrowRight/>
              </PaginationLink>
            </PaginationContent>
          </Pagination>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-80">
            <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex justify-end gap-2 text-sm">
              <button
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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