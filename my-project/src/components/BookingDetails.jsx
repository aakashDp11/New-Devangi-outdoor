

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from './Navbar';
import InventorySelector from './BookingFormAddSpaces';
import { PieChart } from '@mui/x-charts/PieChart';

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
const [showDeletePopup, setShowDeletePopup] = useState(false);
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/bookings/${id}`);
        const data = await res.json();
        setBooking(data);
        console.log("Campaings are",data?.campaigns);
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
  const formatLabel = (key) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

  if (!booking) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  const totalPaid = booking.campaigns?.reduce(
    (sum, c) => sum + (c.pipeline?.payment?.totalPaid || 0),
    0
  );

  const totalDue = booking.campaigns?.reduce(
    (sum, c) => sum + (c.pipeline?.payment?.paymentDue || 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#fafafb] w-[100%] bg-base-100 text-base-content flex flex-col lg:flex-row">
      <Navbar />

      <main className="flex-1 h-full overflow-y-auto px-6 py-6 ml-0 lg:ml-64">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg">Booking Details</h2>
          <div className="space-x-2">
            <button
              className="bg-red-600 text-white px-2 py-1 text-xs rounded hover:bg-red-700"
              onClick={() => setShowDeletePopup(true)}
            >
              Delete Booking
            </button>
          </div>
        </div>

        {/* ✅ Flex Row with Booking Info and Payment Chart */}
        <div className="flex w-[100%] flex-wrap gap-6 mb-6">
          {/* Booking Info Card */}
          <div className="card bg-base-100 shadow-md p-4 min-w-[300px] flex-1">
            <h2 className="text-lg font-semibold mb-4">Client Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {Object.entries(booking).filter(([key]) =>
                [
                  'companyName',
                  'clientName',
                  'clientEmail',
                  'clientContactNumber',
                  'clientPanNumber',
                  'clientGstNumber',
                  'brandDisplayName',
                  'clientType',
                ].includes(key)
              ).map(([key, value]) => (
                <Info key={key} label={formatLabel(key)} value={value} />
              ))}
              <Info label="Created At" value={new Date(booking.createdAt).toLocaleString()} />
            </div>
          </div>

          {/* ✅ Payment Overview Pie Chart */}
          <div className="card bg-base-100 shadow-md p-4 min-w-[200px] flex-1 max-w-[400px]">
            <h2 className="text-lg font-semibold mb-1">Payment Overview</h2>
            <div className='flex'>
              <div className="text-xs ml-auto ">
              <p><strong> Paid:</strong> ₹{totalPaid.toLocaleString()}</p>
              <p><strong>Remaining:</strong> ₹{totalDue.toLocaleString()}</p>
              <p><strong>Total Amount:</strong> ₹{(totalPaid + totalDue).toLocaleString()}</p>
            </div>
            </div>
            <PieChart
              series={[
                {
                   innerRadius: 60,
                  data: [
                    { id: 0, value: totalPaid, label: 'Paid' },
                    { id: 1, value: totalDue, label: 'Due' },
                  ],
                },
              ]}
              width={300}
              height={200}
            />
           
          </div>
        </div>

        {/* Campaign Cards */}
        {booking.campaigns.map((campaign, idx) => (
          <div
            key={idx}
            className="card w-[50%] bg-base-100 shadow-md p-4 mb-6 hover:shadow-lg cursor-pointer transition duration-200"
            // onClick={() => navigate(`/pipeline/${campaign._id}`)}
            onClick={() => navigate(`/campaign-details/${campaign._id}`)}

          >
            <h2 className="text-lg font-semibold mb-4 text-blue-700">
              Campaign: {campaign.campaignName}
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <Info label="Description" value={campaign.description} />
              <Info label="Start Date" value={campaign.startDate} />
              <Info label="End Date" value={campaign.endDate} />
            </div>
          </div>
        ))}
      </main>
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
    <span className="">{label}:</span> {value || 'N/A'}
  </div>
);
