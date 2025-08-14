import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useBookingForm } from '../context/BookingFormContext';
import { toast } from 'sonner';
import { useSidebar } from '../context/SidebarContext';

const Button = ({ children, className = '', ...props }) => (
  <button className={`px-3 py-1.5 text-sm rounded-md font-semibold transition-all duration-300 ${className}`} {...props}>
    {children}
  </button>
);

const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white border border-gray-200 shadow-sm rounded-xl w-full ${className}`} {...props}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const DetailItem = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-xs font-medium text-gray-500">{label}</span>
    <span className="text-sm text-gray-800">{value || 'N/A'}</span>
  </div>
);

export default function ProposalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/proposals/${id}`);
        const data = await response.json();
        setProposal(data);
      } catch (error) {
        console.error('Error fetching proposal:', error);
        toast.error('Failed to fetch proposal details.');
      }
    };
    fetchProposal();
  }, [id]);

  const handleDelete = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/proposals/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        navigate('/proposal-dashboard');
        toast.success('Proposal deleted successfully.');
      } else {
        toast.error('Failed to delete proposal.');
      }
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast.error('An error occurred while deleting.');
    }
  };

  const handleEdit = () => {
    navigate(`/edit-proposal/${id}`);
  };

  if (!proposal) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500">Loading Proposal...</div>
      </div>
    );
  }
  
  // Safely access the first space's dates
  const firstSpace = proposal.spaces && proposal.spaces.length > 0 ? proposal.spaces[0] : null;
  const startDate = firstSpace && firstSpace.dates && firstSpace.dates.length > 0 ? firstSpace.dates[0] : 'N/A';
  const endDate = firstSpace && firstSpace.dates && firstSpace.dates.length > 1 ? firstSpace.dates[1] : 'N/A';


  return (
    <div className="min-h-screen h-screen w-screen bg-gray-50 text-black flex flex-col lg:flex-row overflow-hidden">
      <Navbar />
      <main className={`flex-1 h-full overflow-y-auto px-4 md:px-8 py-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Proposal Details</h1>
              <p className="text-sm text-gray-500">Review the complete information for this proposal.</p>
            </div>
            <Button onClick={handleEdit} className="bg-black text-white hover:bg-gray-800 px-4 py-2">Edit Proposal</Button>
          </div>

          {/* New Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column: Main Details */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <Card>
                <CardContent>
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
                    {/* ===== NEWLY ADDED FIELDS ===== */}
                    <DetailItem label="Start Date" value={startDate} />
                    <DetailItem label="End Date" value={endDate} />
                    {/* ============================== */}
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <DetailItem label="Description" value={proposal.description} />
                  </div>
                </CardContent>
                 {/* Action Buttons within the card footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center rounded-b-xl">
                    <span className="text-xs text-gray-400">
                        Created At: {new Date(proposal.createdAt).toLocaleString()}
                    </span>
                    <div className="flex gap-3">
                        <Button onClick={() => navigate(-1)} className="bg-white text-black border border-gray-300 hover:bg-gray-100">Back</Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setShowDeleteModal(true)}>
                        Delete
                        </Button>
                    </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Assigned Spaces (Sticky) */}
            <div className="lg:col-span-1 lg:sticky top-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Assigned Spaces</h2>
              {proposal.spaces && proposal.spaces.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {proposal.spaces.map((space, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col">
                        <span className="font-bold text-md text-gray-900">{space.spaceName || 'Unnamed Space'}</span>
                        <span className="text-sm text-gray-500">{space.address || 'No Address Provided'}</span>
                        <span className="text-xs text-gray-400 mb-3">{space.city || 'No City Provided'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white border border-dashed rounded-lg">
                  <p className="text-gray-500">No Spaces assigned.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col gap-4 w-96">
              <div className="text-xl font-bold text-gray-800">Confirm Deletion</div>
              <p className="text-sm text-gray-600">Are you absolutely sure you want to delete this proposal? This action cannot be undone.</p>
              <div className="flex gap-3 justify-end mt-4">
                <Button onClick={() => setShowDeleteModal(false)} className="bg-gray-200 text-black hover:bg-gray-300">Cancel</Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Delete Proposal</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}