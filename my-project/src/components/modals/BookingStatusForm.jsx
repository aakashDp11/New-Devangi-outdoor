

import React, { useState, useContext } from 'react';
import axios from 'axios';
import { PipelineContext } from '../../context/PipelineContext';
import { toast } from 'sonner';
const BookingStatusForm = ({ campaignId, onConfirm, onClose }) => {
  const [hasBooking, setHasBooking] = useState(false);
  const [bookingNumber, setBookingNumber] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [memberName, setMemberName] = useState('');
  const { pipelineData, setPipelineData } = useContext(PipelineContext);

  const handleSave = async () => {
    try {
      const res = await axios.put(
        `http://localhost:3000/api/pipeline/campaign/${campaignId}/bookingStatus`,
        {
          confirmed: true,
          reference: bookingNumber,
          bookingDate,
          memberName,
        }
      );
      setPipelineData(res.data);
       toast.success('Booking status saved successfully');
      onConfirm();
    } catch (err) {
      console.error('Failed to save booking status:', err);
      toast.error('Failed to save booking status ❌');
      onConfirm();
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4 ">
      {pipelineData?.bookingStatus?.confirmed ? (
        <div className="text-center bg-white p-6 max-w-md w-full">
          <h1 className="text-xl font-semibold text-green-700">
            Already Booked
          </h1>
          <p className="mt-2 text-gray-700">
            Booking Number: <span className="font-medium">{pipelineData.bookingStatus.reference}</span>
          </p>
          <p className="text-gray-700">Date: {pipelineData.bookingStatus.bookingDate}</p>
          <p className="text-gray-700">Member: {pipelineData.bookingStatus.memberName}</p>
          <div className='flex mt-4'>
          <button
  onClick={onClose}
  className="w-[40%] mx-auto text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400 transition duration-200"
>
  Close
</button>
          </div>
        </div>
      ) : (
        <div className="max-w-md w-full bg-white px-4 ">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Booking Status
          </h2>

          

          
            <div className="space-y-5">
              {/* Booking Number */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Booking Number
                </label>
                <input
                  type="text"
                  placeholder="Enter booking number"
                  value={bookingNumber}
                  onChange={(e) => setBookingNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Booking Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Booking Date
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Member Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Booking Member Name
                </label>
                <input
                  type="text"
                  placeholder="Enter member name"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
<div className='flex'>
 <button
  onClick={onClose}
  className="w-[40%] mr-auto text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400 transition duration-200"
>
  Close
</button>
<button
                onClick={handleSave}
                className="w-[40%] text-xs bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition duration-200"
              >
                Save 
              </button>
</div>
              
            </div>
          
        </div>
      )}
    </div>
  );
};

export default BookingStatusForm;
