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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Validation states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  console.log("existing data in booking status form is", existingData);
  const { pipelineData, setPipelineData } = useContext(PipelineContext);
  const username = localStorage.getItem('userName');
  const useremail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');

  // Validation functions
  const validateBookingDate = (value) => {
    // No validation - booking date is flexible
    return '';
  };

  const validateFile = (file) => {
    if (!file) return ''; // File is optional now
    
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const maxSizeInMB = 5;   
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    
    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported. Please upload PDF, Word document, or image files only';
    }
    
    if (file.size > maxSizeInBytes) {
      return `File size must be less than ${maxSizeInMB}MB`;
    }
    
    if (file.name.length > 100) {
      return 'File name is too long (max 100 characters)';
    }
    
    return '';
  };

  // Real-time validation
  const validateField = (fieldName, value, file = null) => {
    let error = '';
    
    switch (fieldName) {
      case 'bookingDate':
        error = validateBookingDate(value);
        break;
      case 'estimateDocument':
        error = validateFile(file);
        break;
      default:
        break;
    }
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
    
    return error === '';
  };

  // Handle field blur
  const handleBlur = (fieldName) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
  };

  useEffect(() => {
    if (existingData && existingData.confirmed) {
      setView('summary');
      setBookingNumber(existingData.reference || '');
      setBookingDate(existingData.bookingDate ? new Date(existingData.bookingDate).toISOString().split('T')[0] : '');
      setDocumentUrl(existingData.estimateDocument || '');
    } else {
      setView('form');
      const generatedNumber = generateBookingNumber();
      setBookingNumber(generatedNumber);
      setBookingDate(new Date().toISOString().split('T')[0]);
      
      // Validate initial values
      validateField('bookingDate', new Date().toISOString().split('T')[0]);
    }
  }, [existingData]);

  const handleBookingDateChange = (e) => {
    const value = e.target.value;
    setBookingDate(value);
    if (touched.bookingDate) {
      validateField('bookingDate', value);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setEstimateDocument(file);
    if (touched.estimateDocument || file) {
      validateField('estimateDocument', null, file);
    }
  };

  // Validate all fields before submission
  const validateAllFields = () => {
    const bookingDateValid = validateField('bookingDate', bookingDate);
    const documentValid = validateField('estimateDocument', null, estimateDocument);
    
    // Mark all fields as touched
    setTouched({
      bookingDate: true,
      estimateDocument: true
    });
    
    return bookingDateValid && documentValid;
  };

  const handleSave = async () => {
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    // Validate all fields
    if (!validateAllFields()) {
      toast.error("Please fix all validation errors before submitting.");
      return;
    }

    // Additional business logic validation
    if (!campaignId) {
      toast.error("Campaign ID is missing. Please refresh and try again.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('confirmed', true);
      formData.append('reference', bookingNumber.trim());
      formData.append('bookingDate', bookingDate);
      
      if (estimateDocument) {
        formData.append('file', estimateDocument);
      }

      const res = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/bookingStatus`,
        formData, 
        { 
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000 // 30 second timeout
        }
      );
      
      if (res.data) {
        setPipelineData(res.data);
        toast.success('Booking status saved successfully');
        onConfirm();
      } else {
        throw new Error('No data received from server');
      }
    } catch (err) {
      console.error('Failed to save booking status:', err);
      
      if (err.response?.status === 400) {
        toast.error(err.response.data?.message || 'Invalid data provided');
      } else if (err.response?.status === 413) {
        toast.error('File too large. Please upload a smaller file.');
      } else if (err.code === 'ECONNABORTED') {
        toast.error('Request timeout. Please check your connection and try again.');
      } else if (err.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to save booking status. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get error display
  const getErrorDisplay = (fieldName) => {
    return touched[fieldName] && errors[fieldName] ? errors[fieldName] : '';
  };

  // Helper function to get input class based on validation state
  const getInputClass = (fieldName, baseClass) => {
    if (!touched[fieldName]) return baseClass;
    if (errors[fieldName]) return `${baseClass} border-red-500 focus:border-red-500`;
    return `${baseClass} border-green-500 focus:border-green-500`;
  };

  if (view === 'summary') {
    return (
      <div className="text-center bg-white p-6 max-w-md w-full rounded-xl">
        <h1 className="text-xl font-semibold text-green-700">Already Booked</h1>
        <p className="mt-2 text-gray-700">Booking Number: <span className="font-medium">{bookingNumber}</span></p>
        <p className="text-gray-700">Date: {bookingDate}</p>
        <div className="mt-4">
          <h2 className="text-sm font-semibold mb-1">Booking Confirmation Document</h2>
          {documentUrl ? (
            <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">
              View Uploaded Document
            </a>
          ) : (<p className="text-xs text-gray-500 italic">No document uploaded</p>)}
        </div>
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
        {/* Booking Number Field */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Booking Number <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            value={bookingNumber} 
            readOnly
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-xs bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>

        {/* Booking Date Field */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Booking Date
          </label>
          <input 
            type="date" 
            value={bookingDate} 
            onChange={handleBookingDateChange}
            onBlur={() => handleBlur('bookingDate')}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>

        {/* Document Upload Field */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Upload Confirmation Document <span className="text-gray-500">(Optional)</span>
          </label>
          
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
            onBlur={() => handleBlur('estimateDocument')}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50" 
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            disabled={isSubmitting}
          />
          
          {getErrorDisplay('estimateDocument') && (
            <p className="text-red-500 text-xs mt-1">{getErrorDisplay('estimateDocument')}</p>
          )}
          
          <p className="text-xs mt-1 text-gray-500">
            Accepted formats: PDF, Word documents, Images (JPG, PNG) | Max size: 10MB
          </p>
          
          {documentUrl && (
            <p className="text-xs mt-1 text-gray-500">
              A file is already uploaded. Uploading a new one will replace it.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex pt-2">
          <button 
            onClick={onClose} 
            className="w-[40%] mr-auto text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400 disabled:opacity-50"
            disabled={isSubmitting}
          >
            Close
          </button>
          <button 
            onClick={handleSave} 
            className="w-[40%] text-xs bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || Object.values(errors).some(error => error !== '')}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingStatusForm;