


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from './Navbar';
import InventorySelector from './BookingFormAddSpaces';

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editData, setEditData] = useState({});
  const [existingCampaigns, setExistingCampaigns] = useState([]);
  const [deletedCampaignIds, setDeletedCampaignIds] = useState([]);
  const [newCampaigns, setNewCampaigns] = useState([]);
  const [spaces, setSpaces] = useState([]);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/bookings/${id}`);
        const data = await res.json();
        console.log(data);
        setBooking(data);
        setExistingCampaigns(data.campaigns);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load booking details');
      }
    };

    const fetchSpaces = async () => {
      const res = await fetch('http://localhost:3000/api/spaces');
      const data = await res.json();
      setSpaces(data.map(space => ({
        id: space._id,
        name: space.spaceName,
        facia: space.faciaTowards,
        city: space.city,
        category: space.category,
        spaceType: space.spaceType,
        unit: space.unit,
        occupiedUnits: space.occupiedUnits,
        price: space.price,
        traded: space.traded,
        overlappingBooking: space.overlappingBooking,
        availableFrom: space.dates?.[0],
        availableTo: space.dates?.[space.dates.length - 1],
        status: space.occupiedUnits === 0 ? 'Completely available' :
                space.occupiedUnits < space.unit ? 'Partialy available' : 'Completely booked'
      })));
    };

    fetchBooking();
    fetchSpaces();
  }, [id]);

  const handleDelete = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/bookings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Booking deleted');
        navigate('/booking-dashboard');
      } else {
        toast.error('Delete failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting booking');
    }
  };

  const handleOpenEdit = () => {
    setEditData({
      companyName: booking?.companyName || '',
      clientName: booking?.clientName || '',
      clientEmail: booking?.clientEmail || '',
      clientContactNumber: booking?.clientContactNumber ?? null,
      clientPanNumber: booking?.clientPanNumber ?? null,
      clientGstNumber: booking?.clientGstNumber ?? null,
      brandDisplayName: booking?.brandDisplayName || '',
      clientType: booking?.clientType || '',
    });
    setShowEditPopup(true);
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        ...editData,
        clientContactNumber: editData.clientContactNumber || null,
        clientPanNumber: editData.clientPanNumber || null,
        clientGstNumber: editData.clientGstNumber || null,
        deletedCampaignIds,
        newCampaigns
      };

      const res = await fetch(`http://localhost:3000/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Booking updated successfully');
        setShowEditPopup(false);
        window.location.reload();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Update failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating booking');
    }
  };

  const handleDeleteExistingCampaign = (campaignId) => {
    setDeletedCampaignIds(prev => [...prev, campaignId]);
  };

  const handleAddNewCampaign = () => {
    setNewCampaigns(prev => [
      ...prev,
      {
        _id: `new-${Date.now()}`,
        campaignName: '',
        industry: '',
        description: '',
        startDate: '',
        endDate: '',
        selectedSpaces: [],
        searchQuery: ''
      }
    ]);
  };

  const handleNewCampaignChange = (index, field, value) => {
    setNewCampaigns(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const toggleSpaceSelection = (campaignIndex, spaceId) => {
    const campaign = newCampaigns[campaignIndex];
    const exists = campaign.selectedSpaces?.find(s => s.id === spaceId);
    const updatedSelectedSpaces = exists
      ? campaign.selectedSpaces.filter(s => s.id !== spaceId)
      : [...(campaign.selectedSpaces || []), { ...spaces.find(s => s.id === spaceId), selectedUnits: 1 }];
    handleNewCampaignChange(campaignIndex, 'selectedSpaces', updatedSelectedSpaces);
  };

  const updateSelectedUnits = (campaignIndex, spaceId, units) => {
    const campaign = newCampaigns[campaignIndex];
    const updatedSpaces = campaign.selectedSpaces.map(s =>
      s.id === spaceId ? { ...s, selectedUnits: units } : s
    );
    handleNewCampaignChange(campaignIndex, 'selectedSpaces', updatedSpaces);
  };

  const handleDeleteNewCampaign = (campaignId) => {
    setNewCampaigns(prev => prev.filter(c => c._id !== campaignId));
  };

  if (!booking) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen w-screen bg-base-100 text-base-content flex flex-col lg:flex-row">
      <Navbar />

      <main className="flex-1 h-full overflow-y-auto px-6 py-6 ml-0 lg:ml-64">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Booking Details</h1>
          <div className="space-x-2">
            <button className="btn btn-primary btn-sm" onClick={handleOpenEdit}>Edit Booking</button>
            <button className="btn btn-error btn-sm" onClick={() => setShowDeletePopup(true)}>Delete Booking</button>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Client Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {Object.entries(booking).filter(([key]) =>
              ['companyName', 'clientName', 'clientEmail', 'clientContactNumber', 'clientPanNumber', 'clientGstNumber', 'brandDisplayName', 'clientType'].includes(key)
            ).map(([key, value]) => (
              <Info key={key} label={key} value={value} />
            ))}
            <Info label="Created At" value={new Date(booking.createdAt).toLocaleString()} />
          </div>
        </div>

        {booking.campaigns.map((campaign, idx) => (
          <div key={idx} className="card bg-base-100 shadow-md p-4 mb-6 hover:pointer" onClick={()=>navigate(`/pipeline/${campaign._id}`)} >
            <h2 className="text-lg font-semibold mb-4 text-blue-700">Campaign: {campaign.campaignName}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <Info label="Description" value={campaign.description} />
            </div>
          </div>
        ))}
      </main>

      {showEditPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-h-screen overflow-y-auto w-full max-w-5xl">
            <h2 className="text-xl font-bold mb-4">Edit Booking</h2>

            {/* Client Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {Object.entries(editData).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium">{key}</label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={value}
                    onChange={(e) => setEditData(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">New Campaigns</h3>
              <button className="btn btn-primary btn-sm" onClick={handleAddNewCampaign}>+ Add Campaign</button>
            </div>

            {newCampaigns.map((campaign, index) => (
              <div key={campaign._id} className="border rounded p-3 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">Campaign {index + 1}</h4>
                  <button className="btn btn-xs btn-error" onClick={() => handleDeleteNewCampaign(campaign._id)}>Delete</button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <input
                    placeholder="Campaign Name"
                    className="input input-bordered w-full"
                    value={campaign.campaignName}
                    onChange={(e) => handleNewCampaignChange(index, 'campaignName', e.target.value)}
                  />
                  <input
                    placeholder="Industry"
                    className="input input-bordered w-full"
                    value={campaign.industry}
                    onChange={(e) => handleNewCampaignChange(index, 'industry', e.target.value)}
                  />
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={campaign.startDate}
                    onChange={(e) => handleNewCampaignChange(index, 'startDate', e.target.value)}
                  />
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={campaign.endDate}
                    onChange={(e) => handleNewCampaignChange(index, 'endDate', e.target.value)}
                  />
                </div>
                <textarea
                  placeholder="Description"
                  className="textarea textarea-bordered w-full mb-2"
                  value={campaign.description}
                  onChange={(e) => handleNewCampaignChange(index, 'description', e.target.value)}
                />

                {campaign.startDate && campaign.endDate && (
                  <InventorySelector
                    campaignIndex={index}
                    campaign={campaign}
                    spaces={spaces}
                    globalAvailability={{}}
                    startDate={campaign.startDate}
                    endDate={campaign.endDate}
                    onToggleSpaceSelection={toggleSpaceSelection}
                    onUpdateSelectedUnits={updateSelectedUnits}
                    onSearchChange={() => {}}
                  />
                )}
              </div>
            ))}

            <h3 className="font-bold text-lg mb-2">Existing Campaigns</h3>
            {existingCampaigns.filter(c => !deletedCampaignIds.includes(c._id)).map((campaign) => (
              <div key={campaign._id} className="border rounded p-3 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{campaign.campaignName}</h4>
                    <p className="text-sm">{campaign.description}</p>
                  </div>
                  <button className="btn btn-xs btn-error" onClick={() => handleDeleteExistingCampaign(campaign._id)}>Delete</button>
                </div>
              </div>
            ))}

            <div className="flex justify-between mt-6">
              <button className="btn" onClick={() => setShowEditPopup(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handleUpdate}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
      {showDeletePopup && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded shadow-lg w-96">
      <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
      <p className="mb-4 text-sm text-gray-700">Are you sure you want to delete this booking? This action cannot be undone.</p>
      <div className="flex justify-end gap-4">
        <button className="btn btn-outline" onClick={() => setShowDeletePopup(false)}>Cancel</button>
        <button className="btn btn-error" onClick={handleDelete}>Yes, Delete</button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

const Info = ({ label, value }) => (
  <div>
    <span className="font-medium">{label}:</span> {value || 'N/A'}
  </div>
);
