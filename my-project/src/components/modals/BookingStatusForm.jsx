import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { PipelineContext } from '../../context/PipelineContext';
import { toast } from 'sonner';

// Helper function to generate a unique, timestamp-based booking number.
// It can be placed here or in a separate 'utils' file.
const generateBookingNumber = () => {
  // Get the current date and time
  const now = new Date();
  
  // Format the date and time into a single string: YYYYMMDDHHMMSS
  const timestampPart = 
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') + // Month is 0-indexed, so add 1
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');

  // Generate a short, random alphanumeric string to prevent rare collisions
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();

  // Combine the parts into a final booking number
  // Example output: BK-20250721110035-R4T8
  return `BK-${timestampPart}`;
};


const BookingStatusForm = ({ campaignId, onConfirm, onClose }) => {
  // State for the booking number is now initialized as an empty string.
  // It will be populated automatically when the component loads.
  const [bookingNumber, setBookingNumber] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [estimateDocument, setEstimateDocument] = useState(null);
  const { pipelineData, setPipelineData } = useContext(PipelineContext);

  const username = localStorage.getItem('userName');
  const useremail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');

  // This useEffect hook runs once when the component is first rendered.
  useEffect(() => {
    // Generate the unique booking number and set it in the state.
    setBookingNumber(generateBookingNumber());

    // Set today's date as the default value for the booking date input.
    const today = new Date().toISOString().split('T')[0];
    setBookingDate(today);
  }, []); // The empty dependency array `[]` ensures this effect runs only on mount.

  const handleFileChange = (e) => {
    setEstimateDocument(e.target.files[0]);
  };

  const handleSave = async () => {
    // Simple validation to ensure required fields are filled
    if (!bookingDate) {
      toast.error("Please select a booking date.");
      return;
    }
    if (!bookingNumber) {
      toast.error("Booking number could not be generated. Please try again.");
      return;
    }

    const previousBookingStatus = { ...pipelineData?.bookingStatus };

    const newBookingStatus = {
      confirmed: true,
      reference: bookingNumber, // Use the auto-generated number
      bookingDate,
    };

    const changeLogData = {
      campaignId,
      userId,
      changeType: 'Booking Form Status Update',
      userName: username,
      userEmail: useremail,
      previousValue: previousBookingStatus,
      newValue: newBookingStatus,
    };

    try {
      // Save Change Log
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log`, changeLogData);

      // Prepare form data
      const formData = new FormData();
      formData.append('confirmed', true);
      formData.append('reference', bookingNumber);
      formData.append('bookingDate', bookingDate);
      if (estimateDocument) {
        formData.append('file', estimateDocument);
      }

      // Upload and update booking status
      const res = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/bookingStatus`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
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
    <div className="w-full h-full flex items-center justify-center p-4">
      {pipelineData?.bookingStatus?.confirmed ? (
        // This part for displaying an already booked status remains the same
        <div className="text-center bg-white p-6 max-w-md w-full rounded-xl ">
          <h1 className="text-xl font-semibold text-green-700">
            Already Booked
          </h1>
          <p className="mt-2 text-gray-700">
            Booking Number:{' '}
            <span className="font-medium">{pipelineData.bookingStatus.reference}</span>
          </p>
          <p className="text-gray-700">
            Date: {pipelineData.bookingStatus.bookingDate}
          </p>

          <div className="mt-4">
            <h2 className="text-sm font-semibold mb-1">Booking confirmed Document</h2>
            {pipelineData.bookingStatus.estimateDocument ? (
              <a
                href={pipelineData.bookingStatus.estimateDocument}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline text-xs"
              >
                View Uploaded Document
              </a>
            ) : (
              <p className="text-xs text-gray-500 italic">No document uploaded</p>
            )}
          </div>

          <div className="flex mt-6">
            <button
              onClick={onClose}
              className="w-[40%] mx-auto text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400 transition duration-200"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        // This is the form for creating a new booking
        <div className="max-w-md w-full bg-white px-4 py-6 rounded-xl ">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Booking Status
          </h2>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Booking Number
              </label>
              {/* The input for the booking number is now read-only */}
              <input
                type="text"
                value={bookingNumber}
                readOnly 
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-xs bg-gray-100 text-gray-600 cursor-not-allowed focus:outline-none"
                // No onChange is needed since the user cannot edit this field
              />
            </div>

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

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Upload Confirmation Document
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>

            <div className="flex pt-2">
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