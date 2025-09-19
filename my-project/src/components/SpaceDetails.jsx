import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { toast } from 'sonner';
import { FaArrowLeft, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import { useSidebar } from '../context/SidebarContext';
import MapPreview from './MapPreview';
import EditCampaignModal from './modals/EditCampaignModel';

// --- REUSABLE UI COMPONENTS (SHARED) ---

// Card component with a flowing gradient animation on the background
const Card = ({ children, className = '', ...props }) => (
  <div
    className={`
      bg-gray-100 bg-opacity-80 shadow-xl rounded-2xl w-full flex flex-col relative overflow-hidden
      ${className}
    `}
    {...props}
  >
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
      className={`border ${
        error ? 'border-red-300' : 'border-gray-200'
      } px-4 py-2 rounded-xl w-full bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
      {...props}
    />
    {error && (
      <p className='absolute -bottom-5 left-0 text-red-500 text-xs mt-1 animate-slideDown'>
        {error}
      </p>
    )}
  </div>
);

// Notification system component
const Notification = ({ message, type = 'success', onClose }) => {
  return (
    <div
      className={`px-4 py-3 rounded-lg shadow-lg animate-fadeIn ${
        type === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
      }`}
    >
      <div className='flex items-center gap-2'>
        {type === 'error' ? <FaExclamationTriangle /> : <FaCheck />}
        <span className='text-sm font-medium'>{message}</span>
        <button
          onClick={onClose}
          className='ml-auto text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]'
        >
          &times;
        </button>
      </div>
    </div>
  );
};

// Reusable component for Key-Value display.
const DetailItem = ({ label, value, className = '' }) => (
  <div className={`mb-3 ${className}`}>
    <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">{label}</p>
    <p className="text-sm text-[var(--color-text)] break-words">{value ?? 'N/A'}</p>
  </div>
);

// Reusable component for displaying a campaign card with an Edit button.
const CampaignCard = ({ campaign, navigate, onEdit }) => (
  <Card
    key={campaign._id}
    className="hover:shadow-lg transition-all"
    onClick={() => navigate(`/campaign-details/${campaign._id}`)}
  >
    <CardContent className="flex flex-col gap-2 p-4">
      <div className="flex justify-between items-start text-sm w-full">
        <div className="cursor-pointer flex-grow pr-2">
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Campaign Name</p>
          <p className="font-medium text-[var(--color-text)] break-words">{campaign.campaignName}</p>
        </div>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(campaign);
          }}
          className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-xl hover:bg-gray-300 flex-shrink-0"
        >
          Edit
        </Button>
      </div>
      <div className="flex justify-between items-center text-sm w-full cursor-pointer">
        <div className="text-left">
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Start Date</p>
          <p className="font-medium text-[var(--color-text)]">{campaign.startDate}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">End Date</p>
          <p className="font-medium text-[var(--color-text)]">{campaign.endDate}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// New Image Preview Modal Component
const ImagePreviewModal = ({ isOpen, imageUrl, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-gray-100 rounded-2xl shadow-xl overflow-hidden max-w-4xl max-h-[90vh] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 text-lg hover:bg-opacity-75 z-10"
          onClick={onClose}
        >
          &times;
        </button>
        <img src={imageUrl} alt="Preview" className="max-w-full max-h-[85vh] object-contain" />
      </div>
    </div>
  );
};

export default function SpaceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [space, setSpace] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [ongoingCampaigns, setOngoingCampaigns] = useState([]);
  const [upcomingCampaigns, setUpcomingCampaigns] = useState([]);
  const [previouslyEndedCampaigns, setPreviouslyEndedCampaigns] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState('');
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'success') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications((prev) => [...prev, notification]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

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
        addNotification('Space deleted successfully!');
        toast.success('Space deleted successfully!');
        navigate('/');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete space' }));
        addNotification(errorData.message || 'Failed to delete space.', 'error');
        toast.error(errorData.message || 'Failed to delete space.');
      }
    } catch (error) {
      addNotification(error.message || 'An error occurred while deleting the space.', 'error');
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
      addNotification('Inventory updated successfully.');
      toast.success('Inventory updated successfully.');
    } catch (err) {
      addNotification(err.message || 'Failed to update maintenance status.', 'error');
      toast.error(err.message || 'Failed to update maintenance status.');
    }
  };

  const openImagePreview = (imageUrl) => {
    setCurrentImage(imageUrl);
    setIsPreviewOpen(true);
  };

  const fetchSpace = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      setSpace(data);
    } catch (error) {
      addNotification(error.message || 'Could not load space details.', 'error');
      toast.error(error.message || 'Could not load space details.');
    }
  }, [id, addNotification]);

  const fetchAssociatedCampaigns = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/campaigns/by-space/${id}`);
      if (!response.ok) throw new Error('Failed to fetch associated campaigns');

      const campaigns = await response.json();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const ongoing = [];
      const upcoming = [];
      const ended = [];

      campaigns.forEach(campaign => {
        const startDate = new Date(campaign.startDate);
        const endDate = new Date(campaign.endDate);

        if (endDate < today) {
          ended.push(campaign);
        } else if (startDate <= today && endDate >= today) {
          ongoing.push(campaign);
        } else if (startDate > today) {
          upcoming.push(campaign);
        }
      });

      setOngoingCampaigns(ongoing);
      setUpcomingCampaigns(upcoming);
      setPreviouslyEndedCampaigns(ended);
    } catch (error) {
      addNotification('Could not load associated campaigns.', 'error');
      toast.error('Could not load associated campaigns.');
    }
  }, [id, addNotification]);

  useEffect(() => {
    fetchSpace();
    fetchAssociatedCampaigns();
  }, [fetchSpace, fetchAssociatedCampaigns]);

  if (!space) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-[var(--color-text)] flex flex-col lg:flex-row overflow-hidden">
        <Navbar />
        <main className={`flex-1 flex items-center justify-center p-6 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
          <div className='flex flex-col items-center gap-3 animate-pulse'>
            <div className='w-8 h-8 border-2 border-[black] border-t-transparent rounded-full animate-spin'></div>
            <div className='text-[var(--color-muted)] text-sm'>
              Loading space details...
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-[var(--color-text)] flex flex-col lg:flex-row overflow-hidden'>
      <Navbar />

      {/* Notification System */}
      <div className='fixed top-4 right-4 z-50 space-y-2'>
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => setNotifications((prev) => prev.filter((n) => n.id !== notification.id))}
          />
        ))}
      </div>

      <main className={`flex-1 overflow-y-auto px-4 md:px-6 py-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <div className="flex justify-between items-center mb-6 animate-slideDown">
          <Button onClick={() => navigate(-1)} className="text-white">
            <FaArrowLeft className="inline mr-2" /> Back
          </Button>
          <div className='flex gap-4'>
            <Button
              onClick={() => navigate(`/space/${id}/edit`)}
              className="bg-black text-[var(--color-text)] hover:bg-gray-50 shadow-sm hover:shadow-md"
            >
              Edit Space
            </Button>
          </div>
        </div>

        {/* Change Card to a regular div with consistent background */}
        <div className='p-6 md:p-8 rounded-2xl shadow-xl animate-slideUp bg-white border border-gray-200'>
          {/* Main Content Details */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">{space.spaceName ?? 'Unnamed Space'}</h1>
                <p className="text-sm text-[var(--color-muted)] mt-1">
                  {space.address ?? 'N/A Address'}, {space.city ?? 'N/A City'}, {space.state ?? 'N/A State'}, {space.zip ?? ''}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm font-medium text-[var(--color-text)]">
                  Under Maintenance
                </span>
                <button
                  onClick={handleToggleMaintenance}
                  className={`relative p-0.5 inline-flex items-center h-6 rounded-full w-12 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[black] ${
                    space.isUnderMaintenance ? 'bg-[black]' : 'bg-gray-300'
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
              <div className="mt-4">
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

            {space.spaceType === 'BQS' || space.spaceType === 'DigitalBQS' || space.spaceType === 'Transit' ? (
              <DetailItem label="Buying Price" value={space.buyingPrice ? `₹${space.buyingPrice.toLocaleString()}` : 'N/A'} />
            ) : (
              <DetailItem label="Price" value={space.price ? `₹${space.price.toLocaleString()}` : 'N/A'} />
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
                <DetailItem label="Unit" value={space.unit} />
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
            <DetailItem label="Occupied Units" value={space.occupiedUnits} />
          </div>

          {space.description && (
            <div className="mt-2 mb-6">
              <h2 className="text-base font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Description</h2>
              <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap">{space.description}</p>
            </div>
          )}

          {space.latitude && space.longitude && !isNaN(parseFloat(space.latitude)) && !isNaN(parseFloat(space.longitude)) && (
            <div className="mt-2 mb-6">
              <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">Map Location</h2>
              <div className="h-64 md:h-80 w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
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
              <h2 className="text-xl font-semibold text-[var(--color-text)] mb-6">Space Images</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {space.mainPhoto && (
                  <div className="aspect-square h-32 sm:h-36 md:h-32 lg:h-36 overflow-hidden rounded-2xl bg-gray-100 border border-gray-200 shadow-sm">
                    <img
                      src={space.mainPhoto}
                      alt="Main"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => openImagePreview(space.mainPhoto)}
                    />
                  </div>
                )}
                {space.longShot && (
                  <div className="aspect-square h-32 sm:h-36 md:h-32 lg:h-36 overflow-hidden rounded-2xl bg-gray-100 border border-gray-200 shadow-sm">
                    <img
                      src={space.longShot}
                      alt="Long Shot"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => openImagePreview(space.longShot)}
                    />
                  </div>
                )}
                {space.closeShot && (
                  <div className="aspect-square h-32 sm:h-36 md:h-32 lg:h-36 overflow-hidden rounded-2xl bg-gray-100 border border-gray-200 shadow-sm">
                    <img
                      src={space.closeShot}
                      alt="Close Shot"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => openImagePreview(space.closeShot)}
                    />
                  </div>
                )}
                {space.otherPhotos && space.otherPhotos.length > 0 && space.otherPhotos.map((photo, index) => (
                  <div key={index} className="aspect-square h-32 sm:h-36 md:h-32 lg:h-36 overflow-hidden rounded-2xl bg-gray-100 border border-gray-200 shadow-sm">
                    <img
                      src={photo}
                      alt={`Other ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => openImagePreview(photo)}
                    />
                  </div>
                ))}
                {!space.mainPhoto && !space.longShot && !space.closeShot && (!space.otherPhotos || space.otherPhotos.length === 0) && (
                  <div className="col-span-full aspect-video flex items-center justify-center text-[var(--color-muted)] text-sm bg-gray-100 rounded-2xl border border-dashed p-8 shadow-sm">
                    No images have been uploaded for this space.
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">Ongoing Campaigns</h2>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {ongoingCampaigns.length > 0 ? (
                    ongoingCampaigns.map((campaign) => (
                      <CampaignCard key={campaign._id} campaign={campaign} navigate={navigate} onEdit={handleEditCampaign} />
                    ))
                  ) : (
                    <div className="flex items-center justify-center text-center h-24 bg-gray-100 rounded-2xl border border-dashed p-4 shadow-sm">
                      <p className="text-sm text-[var(--color-muted)]">No ongoing campaigns for this space.</p>
                    </div>
                  )}
                </div>
              </div>
              <hr className="my-6 border-gray-200" />
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">Upcoming Campaigns</h2>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {upcomingCampaigns.length > 0 ? (
                    upcomingCampaigns.map((campaign) => (
                      <CampaignCard key={campaign._id} campaign={campaign} navigate={navigate} onEdit={handleEditCampaign} />
                    ))
                  ) : (
                    <div className="flex items-center justify-center text-center h-24 bg-gray-100 rounded-2xl border border-dashed p-4 shadow-sm">
                      <p className="text-sm text-[var(--color-muted)]">No upcoming campaigns for this space.</p>
                    </div>
                  )}
                </div>
              </div>
              <hr className="my-6 border-gray-200" />
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">Previously Ended Campaigns</h2>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {previouslyEndedCampaigns.length > 0 ? (
                    previouslyEndedCampaigns.map((campaign) => (
                      <CampaignCard key={campaign._id} campaign={campaign} navigate={navigate} onEdit={handleEditCampaign} />
                    ))
                  ) : (
                    <div className="flex items-center justify-center text-center h-24 bg-gray-100 rounded-2xl border border-dashed p-4 shadow-sm">
                      <p className="text-sm text-[var(--color-muted)]">No previously ended campaigns for this space.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex text-xs gap-4 mt-8 pt-6 border-t border-gray-200">
          <Button
            onClick={() => setShowModal(true)}
            className="bg-red-500 hover:bg-red-600"
          >
            Delete Space
          </Button>
        </div>
      </main>

      {showModal && (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fadeIn'>
          <div className='bg-gray-100 p-6 rounded-2xl shadow-lg w-80 text-[var(--color-text)] transform transition-all duration-300 scale-95 hover:scale-100 animate-scaleIn'>
            <h2 className='text-lg font-semibold mb-4'>Confirm Deletion</h2>
            <p className='text-sm text-[var(--color-muted)] mb-6'>
              Are you sure you want to delete "{space.spaceName || 'this space'}"? This action cannot be undone.
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

      {isEditModalOpen && (
        <EditCampaignModal
          campaignData={selectedCampaign}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleCampaignUpdate}
          spaceId={id}
        />
      )}

      <ImagePreviewModal
        isOpen={isPreviewOpen}
        imageUrl={currentImage}
        onClose={() => setIsPreviewOpen(false)}
      />

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