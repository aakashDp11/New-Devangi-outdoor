import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import {toast} from 'sonner';
import { useSidebar } from '../context/SidebarContext'; // 1. ADDED: Import the hook

// Reusable component for Key-Value display
const DetailItem = ({ label, value, className = '' }) => (
  <div className={`mb-3 ${className}`}>
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
    <p className="text-sm text-gray-800 break-words">{value || 'N/A'}</p>
  </div>
);

export default function SpaceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar(); // 2. ADDED: Get the sidebar state
  const [space, setSpace] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleDelete = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Space deleted successfully!');
        navigate('/');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete space' }));
        console.error('Failed to delete space:', errorData.message);
        toast.error(errorData.message || 'Failed to delete space.');
      }
    } catch (error) {
      console.error('An error occurred while deleting the space:', error);
      toast.error(error.message || 'An error occurred while deleting the space.');
    } finally {
      setShowModal(false);
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
        console.error('Error fetching space details:', error);
        toast.error(error.message || 'Could not load space details.');
      }
    };
    fetchSpace();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const day = parts[0]; const month = parts[1]; let year = parts[2];
        if (year.length === 2) year = `20${year}`;
        const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'});
      }
      return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'});
    } catch (e) { return dateString; }
  };

  if (!space) {
    return (
      <div className="min-h-screen h-full w-full  text-black flex flex-col lg:flex-row overflow-x-hidden">
        <Navbar />
        {/* 3a. ADDED: Dynamic class for main content area (loading state) */}
        <main className={`flex-1 flex items-center justify-center p-6 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
            <div className="text-xl text-gray-600">Loading space details...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen w-screen text-black flex flex-col ">
      <Navbar />
      {/* 3b. ADDED: Dynamic class for main content area */}
      <main className={`flex-1 overflow-y-auto px-4 md:px-10 py-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <div className="flex justify-between items-center mb-6">
            <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-700 hover:text-black hover:underline flex items-center"
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <button
  onClick={async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${id}/toggle-inventory`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle inventory status.');
      }

      const updated = await response.json();
      setSpace(prev => ({ ...prev, isInventoryEnabled: updated.isInventoryEnabled }));

      toast.success(
        updated.isInventoryEnabled ? 'Inventory enabled successfully.' : 'Inventory disabled successfully.'
      );
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to toggle inventory status.');
    }
  }}
  className="text-xs text-white bg-gray-600 px-4 py-2 rounded-md hover:bg-gray-700"
>
  {space.isInventoryEnabled ? 'Disable Inventory' : 'Enable Inventory'}
</button>
</div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
            <div className="mb-6 pb-4 border-b border-gray-200">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{space.spaceName || 'Unnamed Space'}</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {space.address || 'N/A Address'}, {space.city || 'N/A City'}, {space.state || 'N/A State'}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2 mb-6">
              <DetailItem label="Category" value={space.category} />
              <DetailItem label="Space Type" value={space.spaceType} />
              <DetailItem label="Price" value={`₹${space.price?.toLocaleString() || 'N/A'}`} />
              <DetailItem label="Footfall" value={space.footfall?.toLocaleString() || 'N/A'} />
              <DetailItem label="Audience" value={space.audience} />
              <DetailItem label="Demographics" value={space.demographics} />
              <DetailItem label="Zone" value={space.zone} />
              <DetailItem label="Facing" value={space.facing} />
              <DetailItem label="Facia Towards" value={space.faciaTowards} />
              <DetailItem label="Tier" value={space.tier} />
              <DetailItem label="Latitude" value={space.latitude} />
              <DetailItem label="Longitude" value={space.longitude} />
              <DetailItem label="Available From" value={formatDate(space.dates?.[0])} />
              <DetailItem label="Available To" value={formatDate(space.dates?.[1])} />
              <DetailItem label="Total Units" value={space.unit} />
              <DetailItem label="Occupied Units" value={space.occupiedUnits || 0} />
            </div>

            {space.description && (
                <div className="mt-2 mb-6">
                  <h2 className="text-base font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</h2>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{space.description}</p>
                </div>
            )}

            <hr className="my-6 border-gray-200" />

            <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-6">Space Images</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {space.mainPhoto && (
                    <div className="aspect-square h-32 sm:h-36 md:h-32 lg:h-36 overflow-hidden rounded-lg bg-gray-100 border">
                    <img src={space.mainPhoto} alt="Main" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"/>
                    </div>
                )}
                {space.longShot && (
                    <div className="aspect-square h-32 sm:h-36 md:h-32 lg:h-36 overflow-hidden rounded-lg bg-gray-100 border">
                    <img src={space.longShot} alt="Long Shot" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"/>
                    </div>
                )}
                {space.closeShot && (
                    <div className="aspect-square h-32 sm:h-36 md:h-32 lg:h-36 overflow-hidden rounded-lg bg-gray-100 border">
                    <img src={space.closeShot} alt="Close Shot" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"/>
                    </div>
                )}
                {space.otherPhotos && space.otherPhotos.length > 0 &&
                    space.otherPhotos.map((photo, index) => (
                    <div key={index} className="aspect-square h-32 sm:h-36 md:h-32 lg:h-36 overflow-hidden rounded-lg bg-gray-100 border">
                        <img src={photo} alt={`Other ${index + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"/>
                    </div>
                    ))
                }
                {!space.mainPhoto && !space.longShot && !space.closeShot && (!space.otherPhotos || space.otherPhotos.length === 0) && (
                    <div className="col-span-full aspect-video flex items-center justify-center text-gray-500 text-sm bg-gray-50 rounded-lg border border-dashed p-8">
                        No images have been uploaded for this space.
                    </div>
                )}
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
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150"
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