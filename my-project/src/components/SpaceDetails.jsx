import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { toast } from 'sonner';
import { useSidebar } from '../context/SidebarContext';
import MapPreview from './MapPreview';
import EditCampaignModal from './modals/EditCampaignModel'; // --- PATH CORRECTED ---

// Reusable component for Key-Value display.
const DetailItem = ({ label, value, className = '' }) => (
  <div className={`mb-3 ${className}`}>
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
    <p className="text-sm text-gray-800 break-words">{value ?? 'N/A'}</p>
  </div>
);

// Reusable component for displaying a campaign card with an Edit button.
const CampaignCard = ({ campaign, navigate, onEdit }) => (
  <div
    key={campaign._id}
    className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 hover:shadow-sm transition-all"
  >
    <div className="flex justify-between items-start text-sm w-full mb-3">
      <div 
        onClick={() => navigate(`/campaign-details/${campaign._id}`)} 
        className="cursor-pointer flex-grow pr-2"
      >
        <p className="text-xs text-gray-500 uppercase tracking-wider">Campaign Name</p>
        <p className="font-medium text-gray-800 break-words">{campaign.campaignName}</p>
      </div>

    </div>
    <div 
      onClick={() => navigate(`/campaign-details/${campaign._id}`)} 
      className="flex justify-between items-center text-sm w-full cursor-pointer"
    >
      <div className="text-left">
        <p className="text-xs text-gray-500 uppercase tracking-wider">Start Date</p>
        <p className="font-medium text-gray-800">{campaign.startDate}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500 uppercase tracking-wider">End Date</p>
        <p className="font-medium text-gray-800">{campaign.endDate}</p>
      </div>
    </div>
  </div>
);


export default function SpaceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [space, setSpace] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [ongoingCampaigns, setOngoingCampaigns] = useState([]);
  const [upcomingCampaigns, setUpcomingCampaigns] = useState([]);
  const [previouslyEndedCampaigns, setPreviouslyEndedCampaigns] = useState([]);

  // State for the edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Handlers for the modal
  const handleEditCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setIsEditModalOpen(true);
  };

  const handleCampaignUpdate = (updatedCampaign) => {
    const updateList = (list) => 
      list.map(c => c._id === updatedCampaign._id ? updatedCampaign : c);
    
    setOngoingCampaigns(updateList);
    setUpcomingCampaigns(updateList);
    setPreviouslyEndedCampaigns(updateList);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Space deleted successfully!');
        navigate('/');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete space' }));
        toast.error(errorData.message || 'Failed to delete space.');
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred while deleting the space.');
    } finally {
      setShowModal(false);
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${id}/toggle-maintenance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to update maintenance status.');

      const updatedSpace = await response.json();
      setSpace(prev => ({ ...prev, isUnderMaintenance: updatedSpace.isUnderMaintenance }));
      toast.success('Inventory updated successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to update maintenance status.');
    }
  };

  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        setSpace(data);
      } catch (error) {
        toast.error(error.message || 'Could not load space details.');
      }
    };

    const fetchAssociatedCampaigns = async () => {
      if (!id) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/campaigns/by-space/${id}`);
        if (!response.ok) throw new Error('Failed to fetch associated campaigns');
        
        const campaigns = await response.json();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
console.log("today's date",today);
const formattedDate = today.toLocaleDateString('en-US', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});
        const ongoing = [];
        const upcoming = [];
        const ended = [];

        campaigns.forEach(campaign => {
          const startDate = new Date(campaign.startDate);
          const endDate = new Date(campaign.endDate);
          const formattedStartDate = startDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
          const formattedEndDate = endDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
          console.log("Campaign name: ",campaign.campaignName,startDate,endDate);
          if (formattedEndDate < formattedDate) {
            ended.push(campaign);
          } else if (formattedStartDate <= formattedDate && formattedEndDate >= formattedDate) {
            ongoing.push(campaign);
          } else if (formattedStartDate > formattedDate) {
            upcoming.push(campaign);
          }
        });

        setOngoingCampaigns(ongoing);
        setUpcomingCampaigns(upcoming);
        setPreviouslyEndedCampaigns(ended);
      } catch (error) {
        toast.error('Could not load associated campaigns.');
      }
    };

    fetchSpace();
    fetchAssociatedCampaigns();
  }, [id]);

  if (!space) {
    return (
      <div className="min-h-screen h-full w-full  text-black flex flex-col lg:flex-row overflow-x-hidden">
        <Navbar />
        <main className={`flex-1 flex items-center justify-center p-6 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
            <div className="text-xl text-gray-600">Loading space details...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen w-screen text-black flex flex-col ">
      <Navbar />
      <main className={`flex-1 overflow-y-auto px-4 md:px-10 py-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <div className="flex justify-between items-center mb-6">
            <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-700 hover:text-black hover:underline flex items-center"
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0-0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
            </button>
            <div className='flex gap-4'>
                <button
                    onClick={() => navigate(`/space/${id}/edit`)}
                    className="text-xs text-white bg-black px-4 py-2 rounded-md hover:bg-gray-800"
                >
                Edit Space
                </button>
            </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
            <div className="mb-6 pb-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{space.spaceName ?? 'Unnamed Space'}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {space.address ?? 'N/A Address'}, {space.city ?? 'N/A City'}, {space.state ?? 'N/A State'}, {space.zip ?? ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">
                            Under Maintenance
                        </span>
                        <button
                            onClick={handleToggleMaintenance}
                            className={`relative p-0.5 inline-flex items-center h-6 rounded-full w-12 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                space.isUnderMaintenance ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform bg-white rounded-full transition-transform duration-200 ${
                                    space.isUnderMaintenance ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                </div>
                {space.isUnderMaintenance && (
                    <div className="mt-4 inline-block">
                        <span className="px-3 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">
                            Inventory Under Maintenance
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2 mb-6">
              <DetailItem label="Landlord" value={space.landlord} />
              <DetailItem label="Inventory Owner (Organization)" value={space.organization} />
              <DetailItem label="Peer Media Owner" value={space.peerMediaOwner} />
              <DetailItem label="Ownership Type" value={space.ownershipType} />
              <DetailItem label="Start Date" value={space.dates?.[0]} />
              <DetailItem label="End Date" value={space.dates?.[1]} />
              <DetailItem label="Category" value={space.category} />
              <DetailItem label="Specification" value={space.specification} />
              
              {space.spaceType === 'BQS' ||space.spaceType === 'DigitalBQS'|| space.spaceType === 'Transit' ? (
                <>
                  <DetailItem label="Buying Price" value={space.buyingPrice ? `₹${space.buyingPrice.toLocaleString()}`: 'N/A'} />
                </>
              ) : (
                <DetailItem label="Price" value={space.price ? `₹${space.price.toLocaleString()}`: 'N/A'} />
              )}

              {space.spaceType === 'Transit' && (
                  <>
                    <DetailItem label="Transit Type" value={space.transitType} />
                    <DetailItem label="Transit Line" value={space.transitLine} />
                  </>
              )}

              <DetailItem label="Footfall" value={space.footfall ? space.footfall.toLocaleString() : null} />
              <DetailItem label="Audience" value={Array.isArray(space.audience) ? space.audience.join(', ') : space.audience} />
              <DetailItem label="Demographics" value={space.demographics} />
              <DetailItem label="Illumination" value={space.illumination} />
              <DetailItem label="Space Type" value={space.spaceType} />
              {space.spaceType === 'DOOH' && (
                <>
                  {/* <DetailItem label="Unit" value={space.unit} /> */}
                  <DetailItem label="Resolution" value={space.resolution} />
                </>
              )}
              <DetailItem label="Width (ft)" value={space.width} />
              <DetailItem label="Height (ft)" value={space.height} />
              <DetailItem label="Additional Tags" value={space.additionalTags} />
              <DetailItem label="Previous Brands" value={space.previousBrands} />
              <DetailItem label="Tags" value={space.tags} />
              <DetailItem label="Landmark" value={space.landmark} />
              <DetailItem label="Zone" value={space.zone} />
              <DetailItem label="Tier" value={space.tier} />
              <DetailItem label="Facing" value={space.facing} />
              <DetailItem label="Facia Towards" value={space.faciaTowards} />
              <DetailItem label="Latitude" value={space.latitude} />
              <DetailItem label="Longitude" value={space.longitude} />
              <DetailItem label="Total Units" value={space.unit} />
              <DetailItem label="Currently occupied units" value={ongoingCampaigns.length} />
            </div>

            {space.description && (
                <div className="mt-2 mb-6">
                  <h2 className="text-base font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</h2>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{space.description}</p>
                </div>
            )}
            
            {space.latitude && space.longitude && !isNaN(parseFloat(space.latitude)) && !isNaN(parseFloat(space.longitude)) && (
              <div className="mt-2 mb-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Map Location</h2>
                <div className="h-64 md:h-80 w-full rounded-lg overflow-hidden border">
                  <MapPreview 
                    latitude={parseFloat(space.latitude)} 
                    longitude={parseFloat(space.longitude)} 
                    spaceName={space.spaceName}
                  />
                </div>
              </div>
            )}

            <hr className="my-6 border-gray-200" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold text-gray-700 mb-6">Space Images</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {space.mainPhoto && ( <div className="aspect-square h-32 sm:h-36 md:h-32 lg:h-36 overflow-hidden rounded-lg bg-gray-100 border"> <img src={space.mainPhoto} alt="Main" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"/> </div> )}
                  {space.longShot && ( <div className="aspect-square h-32 sm:h-36 md:h-32 lg:h-36 overflow-hidden rounded-lg bg-gray-100 border"> <img src={space.longShot} alt="Long Shot" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"/> </div> )}
                  {space.closeShot && ( <div className="aspect-square h-32 sm:h-36 md:h-32 lg:h-36 overflow-hidden rounded-lg bg-gray-100 border"> <img src={space.closeShot} alt="Close Shot" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"/> </div> )}
                  {space.otherPhotos && space.otherPhotos.length > 0 && space.otherPhotos.map((photo, index) => ( <div key={index} className="aspect-square h-32 sm:h-36 md:h-32 lg:h-36 overflow-hidden rounded-lg bg-gray-100 border"> <img src={photo} alt={`Other ${index + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"/> </div> ))}
                  {!space.mainPhoto && !space.longShot && !space.closeShot && (!space.otherPhotos || space.otherPhotos.length === 0) && ( <div className="col-span-full aspect-video flex items-center justify-center text-gray-500 text-sm bg-gray-50 rounded-lg border border-dashed p-8"> No images have been uploaded for this space. </div> )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <div>
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">Ongoing Campaigns</h2>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {ongoingCampaigns.length > 0 ? ( ongoingCampaigns.map((campaign) => ( <CampaignCard key={campaign._id} campaign={campaign} navigate={navigate} onEdit={handleEditCampaign} /> )) ) : ( <div className="flex items-center justify-center text-center h-24 bg-gray-50 rounded-lg border border-dashed p-4"> <p className="text-sm text-gray-500">No ongoing campaigns for this space.</p> </div> )}
                  </div>
                </div>
                <hr className="my-6 border-gray-200" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">Upcoming Campaigns</h2>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {upcomingCampaigns.length > 0 ? ( upcomingCampaigns.map((campaign) => ( <CampaignCard key={campaign._id} campaign={campaign} navigate={navigate} onEdit={handleEditCampaign} /> )) ) : ( <div className="flex items-center justify-center text-center h-24 bg-gray-50 rounded-lg border border-dashed p-4"> <p className="text-sm text-gray-500">No upcoming campaigns for this space.</p> </div> )}
                  </div>
                </div>
                <hr className="my-6 border-gray-200" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">Previously Ended Campaigns</h2>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {previouslyEndedCampaigns.length > 0 ? ( 
                        previouslyEndedCampaigns.map((campaign) => ( 
                            <CampaignCard key={campaign._id} campaign={campaign} navigate={navigate} onEdit={handleEditCampaign} /> 
                        )) 
                    ) : ( 
                        <div className="flex items-center justify-center text-center h-24 bg-gray-50 rounded-lg border border-dashed p-4"> 
                            <p className="text-sm text-gray-500">No previously ended campaigns for this space.</p> 
                        </div> 
                    )}
                  </div>
                </div>
              </div>
            </div>
        </div>

        <div className="flex text-xs gap-4 mt-8 pt-6 border-t border-gray-300">
          <button
            onClick={() => setShowModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-150"
          >
            Delete Space
          </button>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-50 rounded-lg shadow-xl p-6 w-full max-w-md flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Confirm Deletion</h2>
            <p className="text-sm text-gray-600">Are you sure you want to delete "{space.spaceName || 'this space'}"? This action cannot be undone.</p>
            <div className="flex justify-end gap-3 mt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-150"> Cancel </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150"> Delete </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <EditCampaignModal
          campaignData={selectedCampaign}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleCampaignUpdate}
          spaceId={id}
        />
      )}
    </div>
  );
}