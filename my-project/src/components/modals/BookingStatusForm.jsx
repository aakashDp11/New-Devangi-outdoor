import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { PipelineContext } from '../../context/PipelineContext';
import { toast } from 'sonner';

// Helper function to generate a unique, timestamp-based booking number.
const generateBookingNumber = () => {
  const now = new Date();
  const timestampPart = 
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  return `BK-${timestampPart}`;
};

const BookingStatusForm = ({ campaignId, onConfirm, onClose, existingData }) => {
  const [view, setView] = useState('form'); 
  const [bookingNumber, setBookingNumber] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [estimateDocument, setEstimateDocument] = useState(null);
  const [documentUrl, setDocumentUrl] = useState('');
  
  const { pipelineData, setPipelineData } = useContext(PipelineContext);
  const username = localStorage.getItem('userName');
  const useremail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (existingData && existingData.confirmed) {
      setView('summary');
      setBookingNumber(existingData.reference || '');
      setBookingDate(existingData.bookingDate ? new Date(existingData.bookingDate).toISOString().split('T')[0] : '');
      setDocumentUrl(existingData.estimateDocument || '');
    } else {
      setView('form');
      setBookingNumber(generateBookingNumber());
      setBookingDate(new Date().toISOString().split('T')[0]);
    }
  }, [existingData]);

  const handleFileChange = (e) => {
    setEstimateDocument(e.target.files[0]);
  };

  const handleSave = async () => {
    if (!bookingDate || !bookingNumber || (!estimateDocument && !documentUrl)) {
      toast.error("Please fill all mandatory fields, including the confirmation document.");
      return;
    }
    const formData = new FormData();
    formData.append('confirmed', true);
    formData.append('reference', bookingNumber);
    formData.append('bookingDate', bookingDate);
    if (estimateDocument) {
      formData.append('file', estimateDocument);
    }
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/bookingStatus`,
        formData, { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setPipelineData(res.data);
      toast.success('Booking status saved successfully');
      onConfirm();
    } catch (err) {
      console.error('Failed to save booking status:', err);
      toast.error('Failed to save booking status');
    }
  };

  if (view === 'summary') {
    return (
      <div className="text-center bg-white p-6 max-w-md w-full rounded-xl">
        <h1 className="text-xl font-semibold text-green-700">Already Booked</h1>
        <p className="mt-2 text-gray-700">Booking Number: <span className="font-medium">{bookingNumber}</span></p>
        <p className="text-gray-700">Date: {bookingDate}</p>
        <div className="mt-4">
          <h2 className="text-sm font-semibold mb-1">Booking confirmed Document</h2>
          {documentUrl ? (
            <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">
              View Uploaded Document
            </a>
          ) : (<p className="text-xs text-gray-500 italic">No document uploaded</p>)}
        </div>
        {/* ================================================================= */}
        {/* MODIFICATION: "Edit" button removed, "Close" button centered    */}
        {/* ================================================================= */}
        <div className="flex justify-center mt-6">
          <button onClick={onClose} className="w-1/2 text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full bg-white px-4 py-6 rounded-xl">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        {existingData?.confirmed ? 'Edit Booking Status' : 'Booking Status'}
      </h2>
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Booking Number <span className="text-red-500">*</span></label>
          <input type="text" value={bookingNumber} readOnly className="w-full border border-gray-300 rounded-lg px-4 py-2 text-xs bg-gray-100 text-gray-600 cursor-not-allowed"/>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Booking Date <span className="text-red-500">*</span></label>
          <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-xs" required/>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Upload Confirmation Document <span className="text-red-500">*</span></label>
          
          {documentUrl && (
            <div className="mb-2 text-xs">
              <a 
                href={documentUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 underline hover:text-blue-800"
              >
                View Current Document
              </a>
            </div>
          )}

          <input 
            type="file" 
            onChange={handleFileChange} 
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" 
            required={!documentUrl}
          />
          
          {documentUrl && 
            <p className="text-xs mt-1 text-gray-500">
              A file is already uploaded. Uploading a new one will replace it.
            </p>
          }
        </div>
        <div className="flex pt-2">
          <button onClick={onClose} className="w-[40%] mr-auto text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400">Close</button>
          <button onClick={handleSave} className="w-[40%] text-xs bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
};

export default BookingStatusForm;