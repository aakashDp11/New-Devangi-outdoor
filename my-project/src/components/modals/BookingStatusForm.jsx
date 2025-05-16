

// import React, { useState, useContext } from 'react';
// import axios from 'axios';
// import { PipelineContext } from '../../context/PipelineContext';

// const BookingStatusForm = ({ bookingId, onConfirm }) => {
//   const [hasBooking, setHasBooking] = useState(false);
//   const [reference, setReference] = useState('');
//   const { pipelineData, setPipelineData } = useContext(PipelineContext);

//   const handleSave = async () => {
//     try {
//       // const res = await axios.put(`http://localhost:3000/api/pipeline/${bookingId}/bookingStatus`, {
//       //   confirmed: true,
//       //   reference,
//       // });
//       // setPipelineData(res.data);
//       onConfirm();
//     } catch (err) {
//         onConfirm();
//       console.error('Failed to save booking status:', err);
//     }
//   };

//   return (
//     <div className='w-full h-full'>
//       {pipelineData?.bookingStatus?.confirmed ? (
//         <h1>Already Booked with ID: {pipelineData.bookingStatus.reference}</h1>
//       ) : (
//         <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl ">
//           <h2 className="mx-auto font-bold mb-4 mt-0">Booking Status</h2>
//           <div className="flex items-center space-x-3 mb-4">
//             <input
//               type="checkbox"
//               id="hasBooking"
//               checked={hasBooking}
//               onChange={(e) => setHasBooking(e.target.checked)}
//               className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
//             />
//             <label htmlFor="hasBooking" className="text-sm text-gray-700 font-medium">
//               I have a booking
//             </label>
//           </div>

//           {hasBooking && (
//             <div className="space-y-4">
//               <div className='px-0'>
//                 <label className="block mr-4 text-xs font-medium text-gray-700 mb-1">
//                   Booking Reference Number:
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="Enter Booking Ref"
//                   value={reference}
//                   onChange={(e) => setReference(e.target.value)}
//                   className="w-2/3 text-xs px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
//                 />
//               </div>

//               <div className="flex gap-4">
//                 <button
//                   onClick={handleSave}
//                   className="px-4 mx-auto py-2 text-xs bg-green-600 text-white rounded-md hover:bg-green-700"
//                 >
//                   Save
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default BookingStatusForm;

import React, { useState, useContext } from 'react';
import axios from 'axios';
import { PipelineContext } from '../../context/PipelineContext';

const BookingStatusForm = ({ campaignId, onConfirm }) => {
  const [hasBooking, setHasBooking] = useState(false);
  const [reference, setReference] = useState('');
  const { pipelineData, setPipelineData } = useContext(PipelineContext);

  const handleSave = async () => {
    try {
      // ✅ Ensure booking status is updated on campaign pipeline
      const res = await axios.put(`http://localhost:3000/api/pipeline/campaign/${campaignId}/bookingStatus`, {
        confirmed: true,
        reference,
      });
      setPipelineData(res.data);
      onConfirm();
    } catch (err) {
      console.error('Failed to save booking status:', err);
      onConfirm();
    }
  };

  return (
    <div className='w-full h-full'>
      {pipelineData?.bookingStatus?.confirmed ? (
        <h1>Already Booked with ID: {pipelineData.bookingStatus.reference}</h1>
      ) : (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl ">
          <h2 className="mx-auto font-bold mb-4 mt-0">Booking Status</h2>
          <div className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              id="hasBooking"
              checked={hasBooking}
              onChange={(e) => setHasBooking(e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="hasBooking" className="text-sm text-gray-700 font-medium">
              I have a booking
            </label>
          </div>

          {hasBooking && (
            <div className="space-y-4">
              <div className='px-0'>
                <label className="block mr-4 text-xs font-medium text-gray-700 mb-1">
                  Booking Reference Number:
                </label>
                <input
                  type="text"
                  placeholder="Enter Booking Ref"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-2/3 text-xs px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  className="px-4 mx-auto py-2 text-xs bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingStatusForm;
