

// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { toast } from 'sonner';
// import Navbar from './Navbar';

// export default function BookingDetails() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [booking, setBooking] = useState(null);
//   const [showDeletePopup, setShowDeletePopup] = useState(false);

//   useEffect(() => {
//     const fetchBooking = async () => {
//       try {
//         const res = await fetch(`http://localhost:3000/api/bookings/${id}`);
//         const data = await res.json();
//         setBooking(data);
//       } catch (err) {
//         console.error(err);
//         toast.error('Failed to load booking details');
//       }
//     };
//     fetchBooking();
//   }, [id]);

//   const handleDelete = async () => {
//     try {
//       const res = await fetch(`http://localhost:3000/api/bookings/${id}`, { method: 'DELETE' });
//       if (res.ok) {
//         toast.success('Booking deleted');
//         navigate('/booking-dashboard');
//       } else {
//         toast.error('Delete failed');
//       }
//     } catch (err) {
//       console.error(err);
//       toast.error('Error deleting booking');
//     }
//   };

//   if (!booking) return <div className="flex justify-center items-center h-screen">Loading...</div>;

//   return (
//     <div className="min-h-screen w-screen bg-base-100 text-base-content flex flex-col lg:flex-row">
//       <Navbar />

//       <main className="flex-1 h-full overflow-y-auto px-6 py-6 ml-0 lg:ml-64">
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-2xl font-bold">Booking Details</h1>
//           <button className="btn btn-error btn-sm" onClick={() => setShowDeletePopup(true)}>Delete Booking</button>
//         </div>

//         {/* Client Info */}
//         <div className="card bg-base-100 shadow-md p-4 mb-6">
//           <h2 className="text-lg font-semibold mb-4">Client Information</h2>
//           <div className="grid grid-cols-2 gap-4 text-sm">
//             <Info label="Company Name" value={booking.companyName} />
//             <Info label="Client Name" value={booking.clientName} />
//             <Info label="Client Email" value={booking.clientEmail} />
//             <Info label="Client Contact" value={booking.clientContactNumber} />
//             <Info label="Client PAN" value={booking.clientPanNumber} />
//             <Info label="Client GST" value={booking.clientGstNumber} />
//             <Info label="Brand Name" value={booking.brandDisplayName} />
//             <Info label="Client Type" value={booking.clientType} />
//             <Info label="Created At" value={new Date(booking.createdAt).toLocaleString()} />
//           </div>
//         </div>

//         {/* Campaigns */}
//         {booking.campaigns.map((campaign, idx) => (
//           <div key={idx} className="card bg-base-100 shadow-md p-4 mb-6">
//             <h2 className="text-lg font-semibold mb-4 text-blue-700">Campaign: {campaign.campaignName}</h2>
//             <div className="grid grid-cols-2 gap-4 text-sm mb-4">
//               <Info label="Description" value={campaign.description} />
//             </div>

//             {/* Campaign Images */}
//             {campaign.campaignImages?.length > 0 && (
//               <div className="mb-4">
//                 <h3 className="font-medium">Campaign Images:</h3>
//                 <div className="flex flex-wrap gap-3 mt-2">
//                   {campaign.campaignImages.map((img, index) => (
//                     <img key={index} src={`http://localhost:3000${img}`} alt="Campaign" className="w-28 h-28 object-cover rounded" />
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Selected Spaces */}
//             <div className="overflow-x-auto border rounded">
//               <table className="min-w-full text-xs">
//                 <thead className="bg-gray-100">
//                   <tr>
//                     <th>#</th>
//                     <th>Space Name</th>
//                     <th>Type</th>
//                     <th>Category</th>
//                     <th>City</th>
//                     <th>Occupied</th>
//                     <th>Total</th>
//                     <th>Selected</th>
//                     <th>Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {campaign.spaces.map((spaceEntry, sIdx) => (
//                     <tr key={sIdx} className="text-center border-t">
//                       <td>{sIdx + 1}</td>
//                       <td>{spaceEntry.id?.spaceName}</td>
//                       <td>{spaceEntry.id?.spaceType}</td>
//                       <td>{spaceEntry.id?.category}</td>
//                       <td>{spaceEntry.id?.city}</td>
//                       <td>{spaceEntry.id?.occupiedUnits}</td>
//                       <td>{spaceEntry.id?.unit}</td>
//                       <td>{spaceEntry.selectedUnits}</td>
//                       <td>{spaceEntry.id?.availability}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         ))}

//       </main>

//       {/* Delete Confirmation Modal */}
//       <input type="checkbox" id="delete-modal" className="modal-toggle" checked={showDeletePopup} readOnly />
//       <div className="modal">
//         <div className="modal-box">
//           <h3 className="font-bold text-lg">Confirm Deletion</h3>
//           <p className="py-4">Are you sure you want to delete this booking?</p>
//           <div className="modal-action">
//             <button className="btn" onClick={() => setShowDeletePopup(false)}>Cancel</button>
//             <button className="btn btn-error" onClick={handleDelete}>Delete</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// const Info = ({ label, value }) => (
//   <div>
//     <span className="font-medium">{label}:</span> {value || 'N/A'}
//   </div>
// );
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from './Navbar';

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editData, setEditData] = useState({});
  const [editCampaigns, setEditCampaigns] = useState([]);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/bookings/${id}`);
        const data = await res.json();
        setBooking(data);

        setEditData({
          companyName: data.companyName,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientContactNumber: data.clientContactNumber,
          clientPanNumber: data.clientPanNumber,
          clientGstNumber: data.clientGstNumber,
          brandDisplayName: data.brandDisplayName,
          clientType: data.clientType,
        });

        setEditCampaigns(data.campaigns.map(c => ({
          _id: c._id,
          campaignName: c.campaignName,
          description: c.description,
          selectedSpaces: c.spaces.map(s => ({
            id: s.id._id || s.id,
            selectedUnits: s.selectedUnits
          }))
        })));

      } catch (err) {
        console.error(err);
        toast.error('Failed to load booking details');
      }
    };
    fetchBooking();
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

  const handleUpdate = async () => {
    try {
      const payload = {
        ...editData,
        campaigns: editCampaigns
      };

      const res = await fetch(`http://localhost:3000/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Booking updated successfully');
        setShowEditPopup(false);
        const updated = await res.json();
        // Refresh the page to reflect updates
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

  const handleAddCampaign = () => {
    setEditCampaigns(prev => [
      ...prev,
      {
        _id: `new-${Date.now()}`, // temp ID for frontend only
        campaignName: '',
        description: '',
        selectedSpaces: []
      }
    ]);
  };

  const handleDeleteCampaign = (campaignId) => {
    setEditCampaigns(prev => prev.filter(c => c._id !== campaignId));
  };

  const handleCampaignChange = (index, field, value) => {
    setEditCampaigns(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  if (!booking) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen w-screen bg-base-100 text-base-content flex flex-col lg:flex-row">
      <Navbar />

      <main className="flex-1 h-full overflow-y-auto px-6 py-6 ml-0 lg:ml-64">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Booking Details</h1>
          <div className="space-x-2">
            <button className="btn btn-primary btn-sm" onClick={() => setShowEditPopup(true)}>Edit Booking</button>
            <button className="btn btn-error btn-sm" onClick={() => setShowDeletePopup(true)}>Delete Booking</button>
          </div>
        </div>

        {/* Client Info */}
        <div className="card bg-base-100 shadow-md p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Client Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {Object.entries(editData).map(([key, value]) => (
              <Info key={key} label={key} value={value} />
            ))}
            <Info label="Created At" value={new Date(booking.createdAt).toLocaleString()} />
          </div>
        </div>

        {/* Campaigns */}
        {booking.campaigns.map((campaign, idx) => (
          <div key={idx} className="card bg-base-100 shadow-md p-4 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-blue-700">Campaign: {campaign.campaignName}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <Info label="Description" value={campaign.description} />
            </div>
          </div>
        ))}
      </main>

      {/* Delete Modal */}
      <input type="checkbox" id="delete-modal" className="modal-toggle" checked={showDeletePopup} readOnly />
      <div className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Confirm Deletion</h3>
          <p className="py-4">Are you sure you want to delete this booking?</p>
          <div className="modal-action">
            <button className="btn" onClick={() => setShowDeletePopup(false)}>Cancel</button>
            <button className="btn btn-error" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <input type="checkbox" id="edit-modal" className="modal-toggle" checked={showEditPopup} readOnly />
      <div className="modal">
        <div className="modal-box max-h-screen overflow-y-auto">
          <h3 className="font-bold text-lg">Edit Booking Info</h3>
          <div className="py-4 space-y-2">
            {/* Client Info Edit */}
            {Object.entries(editData).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium">{key}</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={value || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ))}

            <hr className="my-4" />

            <h3 className="font-bold text-lg">Edit Campaigns</h3>
            {editCampaigns.map((campaign, index) => (
              <div key={campaign._id} className="border rounded p-3 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">Campaign {index + 1}</h4>
                  <button className="btn btn-xs btn-error" onClick={() => handleDeleteCampaign(campaign._id)}>Delete</button>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium">Campaign Name</label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={campaign.campaignName}
                      onChange={(e) => handleCampaignChange(index, 'campaignName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Description</label>
                    <textarea
                      className="textarea textarea-bordered w-full"
                      value={campaign.description}
                      onChange={(e) => handleCampaignChange(index, 'description', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button className="btn btn-sm btn-primary" onClick={handleAddCampaign}>Add Campaign</button>
          </div>

          <div className="modal-action">
            <button className="btn" onClick={() => setShowEditPopup(false)}>Cancel</button>
            <button className="btn btn-success" onClick={handleUpdate}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Info = ({ label, value }) => (
  <div>
    <span className="font-medium">{label}:</span> {value || 'N/A'}
  </div>
);
