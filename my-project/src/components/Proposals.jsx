import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useSidebar } from '../context/SidebarContext';

// --- UI HELPER COMPONENTS ---

const Input = ({ className = '', ...props }) => (
  <input
    className={`border px-3 py-2 rounded w-full bg-background text-foreground border-border focus:ring-2 focus:ring-ring focus:outline-none transition-all duration-200 hover:border-primary ${className}`}
    {...props}
  />
);

const Card = ({ children, className = '', ...props }) => (
  <div
    className={`bg-card text-card-foreground border shadow-sm rounded-xl w-full transition-all duration-300 hover:shadow-lg hover:scale-[1.01] cursor-pointer ${className}`}
    {...props}
  >
    {children}
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

/**
 * Pagination with "Showing X-Y of Z" results text.
 */
const Pagination = ({ currentPage, totalPages, onPageChange, totalCount, itemsPerPage }) => {
  const [pageInput, setPageInput] = useState(currentPage.toString());
  const [error, setError] = useState('');

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput, 10);

    if (!pageNum || pageNum < 1 || pageNum > totalPages) {
      setError(`Please enter a number between 1 and ${totalPages}`);
      setPageInput(currentPage.toString());
      return;
    }
    setError('');
    onPageChange(pageNum);
  };

  if (totalCount === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-8 text-xs gap-4">
      <span className="text-muted-foreground">
        Showing {startItem} - {endItem} of {totalCount} results
      </span>
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onPageChange(currentPage > 1 ? currentPage - 1 : 1)}
              className="px-3 py-1.5 rounded-md bg-card border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              disabled={currentPage === 1}
            >
              <FaArrowLeft className="inline" />
            </button>

            <form onSubmit={handlePageSubmit} className="flex items-center gap-2">
              <span className="text-foreground">Page</span>
              <input
                type="text"
                value={pageInput}
                onChange={(e) => {
                  // ✅ runtime validation: allow only digits
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setPageInput(value);
                }}
                className="w-12 h-8 text-center border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground transition"
              />
              <span className="text-foreground">of {totalPages}</span>
            </form>

            <button
              onClick={() =>
                onPageChange(currentPage < totalPages ? currentPage + 1 : totalPages)
              }
              className="px-3 py-1.5 rounded-md bg-card border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              disabled={currentPage === totalPages}
            >
              <FaArrowRight className="inline" />
            </button>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
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
  const [searchError, setSearchError] = useState('');
  const perPage = 10;

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/proposals`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

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
          aVal = a[sortConfig.key]?.toString().toLowerCase() || '';
          bVal = b[sortConfig.key]?.toString().toLowerCase() || '';
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [proposals, sortConfig]);

  const filteredData = useMemo(() => {
    return sortedData.filter((item) => {
      const searchLower = search.toLowerCase();
      return (
        item.companyName?.toLowerCase().includes(searchLower) ||
        item.clientName?.toLowerCase().includes(searchLower) ||
        item.brandDisplayName?.toLowerCase().includes(searchLower) ||
        item.campaignName?.toLowerCase().includes(searchLower)
      );
    });
  }, [sortedData, search]);

  const paginatedData = useMemo(
    () => filteredData.slice((currentPage - 1) * perPage, currentPage * perPage),
    [filteredData, currentPage, perPage]
  );

  // Animate on data change
  useEffect(() => {
    setIsAnimated(false);
    const timeout = setTimeout(() => setIsAnimated(true), 50);
    return () => clearTimeout(timeout);
  }, [paginatedData]);

  const totalPages = Math.ceil(filteredData.length / perPage);

  const handleSortChange = (e) => {
    const [key, direction] = e.target.value.split(':');
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    // ✅ runtime validation: block symbols like <, >, {, }
    if (/[^a-zA-Z0-9\s]/.test(value)) {
      setSearchError('Only letters and numbers are allowed in search');
    } else {
      setSearchError('');
      setSearch(value);
      setCurrentPage(1);
    }
  };

  return (
    <div className="min-h-screen bg-background h-screen w-screen text-foreground flex flex-col lg:flex-row overflow-hidden">
      <Navbar />

      <main
        className={`flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 transition-all duration-300 ${
          isCollapsed ? 'lg:ml-24' : 'lg:ml-64'
        }`}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <h2 className="text-2xl font-sans font-normal">
            Proposals ({filteredData.length})
          </h2>
        </div>

        <div className="mt-6 text-sm flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center">
          <div className="w-full md:w-[30%]">
            <Input
              className="h-[2.2rem] text-xs"
              placeholder="Search by Company, Client, Brand, or Campaign"
              value={search}
              onChange={handleSearchChange}
            />
            {searchError && <p className="text-red-500 text-xs mt-1">{searchError}</p>}
          </div>
          <select
            onChange={handleSortChange}
            className="px-3 py-2 border rounded-md w-full md:w-auto bg-card text-foreground border-border text-xs h-[2.2rem] transition-all duration-200 hover:border-primary"
            value={`${sortConfig.key}:${sortConfig.direction}`}
          >
            <option value="createdAt:desc">Sort by: Latest</option>
            <option value="createdAt:asc">Sort by: Oldest</option>
            <option value="companyName:asc">Sort by: Company Name (A-Z)</option>
            <option value="companyName:desc">Sort by: Company Name (Z-A)</option>
          </select>
        </div>

        <div
          className={`mt-6 grid grid-cols-1 gap-4 w-full transform transition-all duration-500 ease-out ${
            isAnimated ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
          }`}
        >
          {paginatedData.length > 0 ? (
            paginatedData.map((item) => (
              <Card
                key={item._id}
                onClick={() => navigate(`/proposal/${item._id}`)}
              >
                <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="text-sm font-semibold break-words">
                      {item.companyName || 'Unknown Company'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Client: {item.clientName || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Campaign: {item.campaignName || 'N/A'}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs px-2 py-1 rounded bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-200">
                      {item.clientType || 'N/A'}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200">
                      {item.industry || 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No proposals found.
            </div>
          )}
        </div>

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
    </div>
  );
}
