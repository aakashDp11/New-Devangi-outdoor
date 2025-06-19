

// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { toast } from 'sonner';
// import Navbar from './Navbar';
// import InventorySelector from './BookingFormAddSpaces';
// import { PieChart } from '@mui/x-charts/PieChart';

// export default function BookingDetails() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [booking, setBooking] = useState(null);
// const [showDeletePopup, setShowDeletePopup] = useState(false);
//   useEffect(() => {
//     console.log("In booking details");
//     const fetchBooking = async () => {
//       try {
//         const res = await fetch(`http://localhost:3000/api/bookings/${id}`);
//         const data = await res.json();
//         setBooking(data);
//         console.log("Campaings are",data?.campaigns);
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
//   const formatLabel = (key) =>
//     key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

//   if (!booking) return <div className="flex justify-center items-center h-screen">Loading...</div>;

//   const totalPaid = booking.campaigns?.reduce(
//     (sum, c) => sum + (c.pipeline?.payment?.totalPaid || 0),
//     0
//   );

//   const totalDue = booking.campaigns?.reduce(
//     (sum, c) => sum + (c.pipeline?.payment?.paymentDue || 0),
//     0
//   );

//   return (
//     <div className="min-h-screen bg-[#fafafb] w-[100%] bg-base-100 text-base-content flex flex-col lg:flex-row">
//       <Navbar />

//       <main className="flex-1 h-full overflow-y-auto px-6 py-6 ml-0 lg:ml-64">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-lg">Booking Details</h2>
//           <div className="space-x-2">
//             <button
//               className="bg-red-600 text-white px-2 py-1 text-xs rounded hover:bg-red-700"
//               onClick={() => setShowDeletePopup(true)}
//             >
//               Delete Booking
//             </button>
//           </div>
//         </div>

//         {/* ✅ Flex Row with Booking Info and Payment Chart */}
//         <div className="flex w-[100%] flex-wrap gap-6 mb-6">
//           {/* Booking Info Card */}
//           <div className="card bg-base-100 shadow-md p-4 min-w-[300px] flex-1">
//             <h2 className="text-lg font-semibold mb-4">Client Information</h2>
//             <div className="grid grid-cols-2 gap-4 text-sm">
//               {Object.entries(booking).filter(([key]) =>
//                 [
//                   'companyName',
//                   'clientName',
//                   'clientEmail',
//                   'clientContactNumber',
//                   'clientPanNumber',
//                   'clientGstNumber',
//                   'brandDisplayName',
//                   'clientType',
//                 ].includes(key)
//               ).map(([key, value]) => (
//                 <Info key={key} label={formatLabel(key)} value={value} />
//               ))}
//               <Info label="Created At" value={new Date(booking.createdAt).toLocaleString()} />
//             </div>
//           </div>

//           {/* ✅ Payment Overview Pie Chart */}
//           <div className="card bg-base-100 shadow-md p-4 min-w-[200px] flex-1 max-w-[400px]">
//             <h2 className="text-lg font-semibold mb-1">Payment Overview</h2>
//             <div className='flex'>
//               <div className="text-xs ml-auto ">
//               <p><strong> Paid:</strong> ₹{totalPaid.toLocaleString()}</p>
//               <p><strong>Remaining:</strong> ₹{totalDue.toLocaleString()}</p>
//               <p><strong>Total Amount:</strong> ₹{(totalPaid + totalDue).toLocaleString()}</p>
//             </div>
//             </div>
//             <PieChart
//               series={[
//                 {
//                    innerRadius: 60,
//                   data: [
//                     { id: 0, value: totalPaid, label: 'Paid' },
//                     { id: 1, value: totalDue, label: 'Due' },
//                   ],
//                 },
//               ]}
//               width={300}
//               height={200}
//             />
           
//           </div>
//         </div>

//         {/* Campaign Cards */}
//         {booking.campaigns.map((campaign, idx) => (
//           <div
//             key={idx}
//             className="card w-[50%] bg-base-100 shadow-md p-4 mb-6 hover:shadow-lg cursor-pointer transition duration-200"
//             // onClick={() => navigate(`/pipeline/${campaign._id}`)}
//             onClick={() => navigate(`/campaign-details/${campaign._id}`)}

//           >
//             <h2 className="text-lg font-semibold mb-4 text-blue-700">
//               Campaign: {campaign.campaignName}
//             </h2>
//             <div className="grid grid-cols-2 gap-4 text-sm mb-4">
//               <Info label="Description" value={campaign.description} />
//               <Info label="Start Date" value={campaign.startDate} />
//               <Info label="End Date" value={campaign.endDate} />
//             </div>
//           </div>
//         ))}
//       </main>
//       {showDeletePopup && (
//   <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
//     <div className="bg-white p-6 rounded shadow-lg w-96">
//       <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
//       <p className="mb-4 text-sm text-gray-700">Are you sure you want to delete this booking? This action cannot be undone.</p>
//       <div className="flex justify-end gap-4">
//         <button className="btn btn-outline" onClick={() => setShowDeletePopup(false)}>Cancel</button>
//         <button className="btn btn-error" onClick={handleDelete}>Yes, Delete</button>
//       </div>
//     </div>
//   </div>
// )}
//     </div>
//   );
// }

// const Info = ({ label, value }) => (
//   <div>
//     <span className="">{label}:</span> {value || 'N/A'}
//   </div>
// );


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from './Navbar';
import { PieChart } from '@mui/x-charts/PieChart';

// MODIFIED InfoDetail component for Key-Above-Value display
const InfoDetail = ({ label, value }) => (
  <div className="mb-3"> {/* Added margin-bottom for spacing between items */}
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
    <p className="text-sm text-gray-800 break-words">{value || 'N/A'}</p>
  </div>
);

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings/${id}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: `Failed to fetch booking (status: ${res.status})` }));
          throw new Error(errorData.message || `Failed to fetch booking (status: ${res.status})`);
        }
        const data = await res.json();
        setBooking(data);
      } catch (err) {
        console.error(err);
        toast.error(err.message || 'Failed to load booking details');
      }
    };

    fetchBooking();
  }, [id]);

  const handleDelete = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Booking deleted successfully');
        navigate('/booking-dashboard');
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Delete failed' }));
        toast.error(errorData.message || 'Delete failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while deleting booking');
    } finally {
      setShowDeletePopup(false);
    }
  };

  const formatLabel = (key) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

  if (!booking) return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#fafafb]">
      <Navbar />
      <main className="flex-1 flex justify-center items-center ml-0 lg:ml-64 p-6">
        <div className="text-xl text-gray-700">Loading booking details...</div>
        {/* Optionally add a spinner here */}
      </main>
    </div>
  );

  const totalPaid = booking.campaigns?.reduce((sum, c) => sum + (c.pipeline?.payment?.totalPaid || 0), 0) || 0;
  const totalDue = booking.campaigns?.reduce((sum, c) => sum + (c.pipeline?.payment?.paymentDue || 0), 0) || 0;
  const grandTotal = totalPaid + totalDue;

  // Prepare client information data once
  const clientInfoData = [
    { key: 'companyName', label: 'Company Name', value: booking.companyName },
    { key: 'clientName', label: 'Client Name', value: booking.clientName },
    { key: 'clientEmail', label: 'Client Email', value: booking.clientEmail },
    { key: 'clientContactNumber', label: 'Client Contact Number', value: booking.clientContactNumber },
    { key: 'clientPanNumber', label: 'Client Pan Number', value: booking.clientPanNumber },
    { key: 'clientGstNumber', label: 'Client Gst Number', value: booking.clientGstNumber },
    { key: 'brandDisplayName', label: 'Brand Display Name', value: booking.brandDisplayName },
    { key: 'clientType', label: 'Client Type', value: booking.clientType },
    { key: 'createdAt', label: 'Created At', value: new Date(booking.createdAt).toLocaleString() },
  ];


  return (
    // MODIFICATION: Added overflow-x-hidden and w-full to the root div
    <div className="min-h-screen bg-[#fafafb] bg-white w-full text-base-content flex flex-col lg:flex-row overflow-x-hidden">
      <Navbar />

      <main className="flex-1 h-full overflow-y-auto px-4 sm:px-6 py-6 ml-0 lg:ml-64">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-semibold text-gray-800">Booking Details</h1>
          <button
            className="bg-red-600 text-white px-4 py-2 text-xs rounded-md hover:bg-red-700 transition-colors duration-150 shadow-sm"
            onClick={() => setShowDeletePopup(true)}
          >
            Delete Booking
          </button>
        </div>

        <div className="flex flex-col lg:flex-row w-full gap-6 mb-6">
          {/* Client Information Card */}
          <div className="card bg-white shadow-xl p-6 rounded-lg flex-grow lg:w-2/3"> {/* Use lg:w-2/3 for more control */}
            <h2 className="text-xl font-semibold text-gray-700 mb-6 border-b pb-3">Client Information</h2>
            {/* MODIFICATION: Grid layout for key-above-value items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6"> {/* Adjusted gap-y */}
              {clientInfoData.map(({ key, label, value }) => (
                <InfoDetail key={key} label={label} value={value} />
              ))}
            </div>
          </div>

          {/* Payment Overview Card */}
          <div className="card bg-white shadow-xl p-6 rounded-lg flex-grow lg:w-1/3 lg:max-w-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-3">Payment Overview</h2>
            {(totalPaid === 0 && totalDue === 0 && grandTotal === 0) ? (
              <div className="flex items-center justify-center h-48">
                <p className="text-gray-500 text-md text-center"> Please enter the payment details </p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-xs text-gray-700 space-y-1 text-right">
                  <p><strong>Paid:</strong> ₹{totalPaid.toLocaleString()}</p>
                  <p><strong>Remaining:</strong> ₹{totalDue.toLocaleString()}</p>
                  <p><strong>Total Amount:</strong> ₹{grandTotal.toLocaleString()}</p>
                </div>
                <div className="flex text-xs justify-center mt-2"> {/* Added mt-2 for spacing */}
                  <PieChart
                    series={[
                      {
                        innerRadius: 45, // Adjusted for potentially smaller card
                        outerRadius: 70, // Adjusted
                        paddingAngle: 2,
                        cornerRadius: 5,
                        data: [
                          { id: 0, value: totalPaid, label: 'Paid', color: '#4CAF50' },
                          { id: 1, value: totalDue, label: 'Due', color: '#FF9800' },
                        ],
                        highlightScope: { faded: 'global', highlighted: 'item' },
                        faded: { innerRadius: 30, additionalRadius: -5, color: 'gray' },
                      },
                    ]}
                    width={250} // Adjusted width to better fit potentially smaller card
                    height={160} // Adjusted height
                    slotProps={{
                      legend: { hidden: false, position: { vertical: 'bottom', horizontal: 'middle' }, labelStyle: { fontSize: 12 } } // made legend text smaller
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Campaign Cards Section */}
        {booking.campaigns && booking.campaigns.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-8 border-b pb-3">Campaigns ({booking.campaigns.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {booking.campaigns.map((campaign, idx) => (
                <div
                  key={campaign._id || idx}
                  className="card bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-200 cursor-pointer"
                  onClick={() => navigate(`/campaign-details/${campaign._id}`)}
                >
                  <h3 className="text-lg font-semibold text-blue-600 mb-3 truncate" title={campaign.campaignName}>
                    {campaign.campaignName || 'Unnamed Campaign'}
                  </h3>
                  {/* Using InfoDetail for campaign details as well, for consistency */}
                  <InfoDetail label="Description" value={campaign.description} />
                  <InfoDetail label="Start Date" value={campaign.startDate ? new Date(campaign.startDate).toLocaleDateString('en-GB') : 'N/A'} />
                  <InfoDetail label="End Date" value={campaign.endDate ? new Date(campaign.endDate).toLocaleDateString('en-GB') : 'N/A'} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showDeletePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Confirm Deletion</h2>
            <p className="mb-6 text-sm text-gray-600">Are you sure you want to delete this booking and all its associated campaigns? This action cannot be undone.</p>
            <div className="flex justify-end gap-3 sm:gap-4">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                onClick={() => setShowDeletePopup(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                onClick={handleDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}