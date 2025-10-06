import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
// import { useBookingForm } from '../context/BookingFormContext'; // Removed unused import from original code
import { toast } from 'sonner';
import { useSidebar } from '../context/SidebarContext';
import { FaArrowLeft, FaEdit, FaTrashAlt, FaDownload, FaExclamationTriangle } from 'react-icons/fa'; // Added icons

// --- REUSABLE UI COMPONENTS (from ProposalsDashboard.jsx for consistent styling) ---

// Card component with a flowing gradient animation on the background
const Card = ({ children, className = '', ...props }) => (
  <div
    className={`
      bg-white shadow-xl rounded-2xl w-full flex flex-col relative overflow-hidden transition hover:shadow-2xl hover:scale-[1.00] duration-300
      ${className}
    `}
    {...props}
  >
    {/* Background gradient animation for visual flair */}
    <div className='absolute inset-0 bg-gradient-to-br from-white via-indigo-50 to-purple-50 opacity-20 animate-bg-gradient-flow-diagonal z-0'></div>
    <div className='relative z-10 h-full flex flex-col'>{children}</div>
  </div>
);

// CardContent component for consistent padding and layout
const CardContent = ({ children, className = '' }) => (
  <div className='p-4 md:p-6 flex-grow flex flex-col'>
    {children}
  </div>
);

// Button component with consistent styling and loading state
const Button = ({ children, className = '', disabled = false, loading = false, ...props }) => (
  <button
    className={`px-4 py-2 rounded-xl bg-black text-white text-xs font-medium transition-all duration-200 transform hover:scale-105 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg ${className}`}
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

// DetailItem component (styled for the new theme)
const DetailItem = ({ label, value, className = '' }) => (
  <div className={`flex flex-col ${className}`}>
    <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1">{label}</span>
    <span className="text-sm font-medium text-gray-800 break-words">{value || 'N/A'}</span>
  </div>
);

// --- MAIN COMPONENT ---

export default function ProposalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { isCollapsed } = useSidebar();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Data Fetching
  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/proposals/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch proposal');
        }
        const data = await response.json();
        setProposal(data);
      } catch (error) {
        console.error('Error fetching proposal:', error);
        toast.error('Failed to fetch proposal details.');
      }
    };
    fetchProposal();
  }, [id]);

  // Handler Functions
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/proposals/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Proposal deleted successfully.');
        navigate('/proposal-dashboard');
      } else {
        toast.error('Failed to delete proposal.');
      }
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast.error('An error occurred while deleting.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDownloadPPT = useCallback(async () => {
    setIsDownloading(true);
    try {
      if (!proposal || !proposal.spaces || proposal.spaces.length === 0) {
        toast.error("No spaces found to generate PPT.");
        setIsDownloading(false);
        return;
      }
      
      const inventories = proposal.spaces.map(space => space.spaceName || 'Unnamed Inventory');
      
      // NOTE: Using VITE_API_BASE_URL and replacing the /api part, assuming the PPT endpoint is at the root or a different path
      // If the PPT endpoint is always on localhost:5000, keep the hardcoded URL.
      // I will keep the hardcoded URL as per the original code's intention, but note this is not ideal for deployment.
      const response = await fetch(`http://localhost:5000/generate-ppt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inventories }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PPT");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${proposal.campaignName || 'custom_proposal'}_${proposal.clientName || 'client'}.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PPT downloaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download PPT. Please check the backend service.");
    } finally {
      setIsDownloading(false);
    }
  }, [proposal]);

  const handleEdit = () => {
    navigate(`/edit-proposal/${id}`);
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date)) return '—';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-gray-900 flex flex-col lg:flex-row overflow-hidden">
        <Navbar />
        <main 
            className={`flex-1 flex items-center justify-center p-6 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}
        >
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <div className="w-8 h-8 border-2 border-[black] border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-500 text-sm">
              Loading proposal details...
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  // Safely access the first space's dates
  const firstSpace = proposal.spaces && proposal.spaces.length > 0 ? proposal.spaces[0] : null;
  const startDate = firstSpace && firstSpace.dates && firstSpace.dates.length > 0 ? formatDate(firstSpace.dates[0]) : 'N/A';
  const endDate = firstSpace && firstSpace.dates && firstSpace.dates.length > 1 ? formatDate(firstSpace.dates[1]) : 'N/A';


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-gray-900 flex flex-col lg:flex-row overflow-hidden">
      <Navbar />
      <main className={`flex-1 h-full overflow-y-auto px-4 md:px-8 py-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <div className="max-w-6xl mx-auto animate-slideDown">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <Button onClick={() => navigate(-1)} className="text-white bg-black">
                    <FaArrowLeft className="inline mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Proposal: {proposal.companyName}</h1>
                    <p className="text-sm text-gray-500">Review the complete information for this proposal.</p>
                </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleDownloadPPT} 
                className="bg-indigo-600 text-white hover:bg-indigo-700"
                loading={isDownloading}
              >
                <FaDownload className="inline mr-2" />
                {isDownloading ? 'Downloading...' : 'Download PPT'}
              </Button>
              <Button 
                onClick={handleEdit} 
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <FaEdit className="inline mr-2" />
                Edit
              </Button>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column: Main Details */}
            <div className="lg:col-span-2 flex flex-col gap-6 animate-slideUp">
              <Card>
                <CardContent>
                  <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Client & Campaign Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <DetailItem label="Company Name" value={proposal.companyName} />
                    <DetailItem label="Client Name" value={proposal.clientName} />
                    <DetailItem label="Client Email" value={proposal.clientEmail} />
                    <DetailItem label="Client Contact Number" value={proposal.clientContactNumber} />
                    <DetailItem label="Client PAN Number" value={proposal.clientPanNumber} />
                    <DetailItem label="Client GST Number" value={proposal.clientGstNumber} />
                    <DetailItem label="Client Type" value={proposal.clientType} />
                    <DetailItem label="Industry" value={proposal.industry} />
                    <DetailItem label="Campaign Name" value={proposal.campaignName} />
                    <DetailItem label="Start Date" value={startDate} />
                    <DetailItem label="End Date" value={endDate} />
                  </div>
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <DetailItem label="Description" value={proposal.description} />
                  </div>
                </CardContent>
                
                {/* Action Buttons within the card footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end items-center rounded-b-xl">
                  <span className="text-xs text-gray-500 mr-auto">
                    Created At: {new Date(proposal.createdAt).toLocaleString()}
                  </span>
                  <Button 
                    className="bg-red-600 text-white hover:bg-red-700" 
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <FaTrashAlt className="inline mr-2" />
                    Delete Proposal
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Column: Assigned Spaces (Sticky) */}
            <div className="lg:col-span-1 lg:sticky lg:top-8 animate-slideIn">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Assigned Spaces ({proposal.spaces?.length || 0})</h2>
              {proposal.spaces && proposal.spaces.length > 0 ? (
                <div className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
                  {proposal.spaces.map((space, index) => (
                    <Card key={index} className="p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-indigo-700">{space.spaceName || 'Unnamed Space'}</span>
                        <span className="text-xs text-gray-600 mt-1">{space.address || 'No Address Provided'}</span>
                        <span className="text-xs text-gray-500">{space.city || 'No City Provided'}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl">
                  <FaExclamationTriangle className="text-gray-400 mx-auto text-2xl mb-2" />
                  <p className="text-gray-500 text-sm">No Spaces assigned to this proposal.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
            <Card className="p-6 flex flex-col gap-4 w-96 animate-slideUp">
              <div className="text-xl font-bold text-gray-800">Confirm Deletion</div>
              <p className="text-sm text-gray-600">Are you absolutely sure you want to delete this proposal? This action cannot be undone.</p>
              <div className="flex gap-3 justify-end mt-4">
                <Button 
                  onClick={() => setShowDeleteModal(false)} 
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white" 
                  onClick={handleDelete}
                  loading={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Proposal'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
      
      {/* Global CSS for Animations */}
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes bg-gradient-flow-diagonal { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
        .animate-bg-gradient-flow-diagonal {
          background-size: 200% 200%;
          animation: bg-gradient-flow-diagonal 10s linear infinite;
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
        .animate-slideIn { animation: slideIn 0.4s ease-out; }
        .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
}