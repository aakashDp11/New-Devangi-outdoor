import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { PipelineContext } from '../../context/PipelineContext';
import { toast } from 'sonner';

export default function POForm({ campaignId, onConfirm, onClose, existingData }) {
  const [view, setView] = useState('form');
  const [poFile, setPoFile] = useState(null);
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState('');
  const [poValue, setPoValue] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const { pipelineData, setPipelineData } = useContext(PipelineContext);
  const username = localStorage.getItem('userName');
  const useremail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');

  // Validation functions
  const validatePoNumber = (value) => {
    if (!value || value.trim() === '') {
      return 'PO number is required';
    }
    if (value.trim().length < 3) {
      return 'PO number must be at least 3 characters';
    }
    if (value.trim().length > 50) {
      return 'PO number cannot exceed 50 characters';
    }
    if (!/^[A-Z0-9\-_/]+$/i.test(value.trim())) {
      return 'PO number can only contain letters, numbers, hyphens, underscores, and forward slashes';
    }
    return '';
  };

  const validatePoDate = (value) => {
    if (!value) {
      return 'PO date is required';
    }
    
    const selectedDate = new Date(value);
    if (isNaN(selectedDate.getTime())) {
      return 'Invalid date format';
    }
    
    return '';
  };

  const validatePoValue = (value) => {
    if (!value || value.trim() === '') {
      return 'PO value is required';
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return 'PO value must be a valid number';
    }
    
    if (numValue <= 0) {
      return 'PO value must be greater than 0';
    }
    
    if (numValue > 99999999999) {
      return 'PO value is too large (max: 99,999,999,999)';
    }
    
    // Check for more than 2 decimal places
    if (value.includes('.') && value.split('.')[1].length > 2) {
      return 'PO value can have maximum 2 decimal places';
    }
    
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
    
    const maxSizeInMB = 5 ;
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
      case 'poNumber':
        error = validatePoNumber(value);
        break;
      case 'poDate':
        error = validatePoDate(value);
        break;
      case 'poValue':
        error = validatePoValue(value);
        break;
      case 'poFile':
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
      setPoNumber(existingData.poNumber || '');
      setPoDate(existingData.poDate ? new Date(existingData.poDate).toISOString().split('T')[0] : '');
      setPoValue(existingData.poValue || '');
      setDocumentUrl(existingData.documentUrl || '');
    } else {
      setView('form');
    }
  }, [existingData]);

  const handlePoNumberChange = (e) => {
    const value = e.target.value.toUpperCase(); // Convert to uppercase for consistency
    setPoNumber(value);
    if (touched.poNumber) {
      validateField('poNumber', value);
    }
  };

  const handlePoDateChange = (e) => {
    const value = e.target.value;
    setPoDate(value);
    if (touched.poDate) {
      validateField('poDate', value);
    }
  };

  const handlePoValueChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPoValue(value);
      if (touched.poValue) {
        validateField('poValue', value);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setPoFile(file);
    if (touched.poFile || file) {
      validateField('poFile', null, file);
    }
  };

  // Validate all fields before submission
  const validateAllFields = () => {
    const poNumberValid = validateField('poNumber', poNumber);
    const poDateValid = validateField('poDate', poDate);
    const poValueValid = validateField('poValue', poValue);
    const fileValid = validateField('poFile', null, poFile);
    
    // Mark all fields as touched
    setTouched({
      poNumber: true,
      poDate: true,
      poValue: true,
      poFile: true
    });
    
    return poNumberValid && poDateValid && poValueValid && fileValid;
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
      let finalDocumentUrl = documentUrl;
      if (poFile) {
        const formData = new FormData();
        formData.append('file', poFile);
        const uploadRes = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/po/upload`,
          formData,
          { 
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000 // 30 second timeout
          }
        );
        finalDocumentUrl = uploadRes.data.documentUrl;
      }

      const previousPoDetails = { ...pipelineData?.po };
      const newPoDetails = {
        confirmed: true,
        poNumber: poNumber.trim(),
        poDate,
        poValue: parseFloat(poValue).toFixed(2), // Ensure consistent decimal formatting
        documentUrl: finalDocumentUrl,
      };
      
      const changeLogData = {
        campaignId, 
        userId,
        changeType: 'PO Status Update',
        userName: username, 
        userEmail: useremail,
        previousValue: previousPoDetails,
        newValue: newPoDetails,
      };

      const res = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/po`,
        newPoDetails,
        { timeout: 30000 }
      );

      if (res.data) {
        setPipelineData(res.data);
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log`, 
          changeLogData,
          { timeout: 30000 }
        ); 
        toast.success('PO details saved successfully!');
        onConfirm();
      } else {
        throw new Error('No data received from server');
      }
    } catch (err) {
      console.error('Failed to save PO status:', err);
      
      if (err.response?.status === 400) {
        toast.error(err.response.data?.message || 'Invalid data provided');
      } else if (err.response?.status === 413) {
        toast.error('File too large. Please upload a smaller file.');
      } else if (err.code === 'ECONNABORTED') {
        toast.error('Request timeout. Please check your connection and try again.');
      } else if (err.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to save PO status. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (view === 'summary') {
    return (
      <div className="text-center bg-white p-6 max-w-md w-full rounded-xl">
        <h2 className="text-xl font-semibold text-green-700 mb-4">PO Status Confirmed</h2>
        <p className="text-sm text-gray-700">PO Number: <span className="font-medium">{poNumber}</span></p>
        <p className="text-sm text-gray-700">PO Date: {poDate}</p>
        <p className="text-sm text-gray-700">PO Value: ₹{poValue}</p>

        {documentUrl ? (
          <div className="mt-4">
            <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
              View Uploaded PO
            </a>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500 italic">No PO document uploaded.</p>
        )}
        
        <div className="flex justify-center mt-6">
          <button onClick={onClose} className="w-1/2 text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full bg-white p-4 py-0 rounded-xl">
      <h2 className="text-xl font-semibold text-gray-800 mb-5 text-center">
        {existingData?.confirmed ? 'Edit PO Status' : 'PO Status'}
      </h2>
      
      <div className="space-y-4">
        {/* PO Number Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PO Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter PO number"
            value={poNumber}
            onChange={handlePoNumberChange}
            onBlur={() => handleBlur('poNumber')}
            className={getInputClass('poNumber', 'w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500')}
            maxLength={50}
            disabled={isSubmitting}
          />
          {getErrorDisplay('poNumber') && (
            <p className="text-red-500 text-xs mt-1">{getErrorDisplay('poNumber')}</p>
          )}
        </div>

        {/* PO Date Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PO Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={poDate}
            onChange={handlePoDateChange}
            onBlur={() => handleBlur('poDate')}
            className={getInputClass('poDate', 'w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500')}
            disabled={isSubmitting}
          />
          {getErrorDisplay('poDate') && (
            <p className="text-red-500 text-xs mt-1">{getErrorDisplay('poDate')}</p>
          )}
        </div>

        {/* PO Value Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PO Value (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter PO amount"
            value={poValue}
            onChange={handlePoValueChange}
            onBlur={() => handleBlur('poValue')}
            className={getInputClass('poValue', 'w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500')}
            disabled={isSubmitting}
          />
          {getErrorDisplay('poValue') && (
            <p className="text-red-500 text-xs mt-1">{getErrorDisplay('poValue')}</p>
          )}
          <p className="text-xs mt-1 text-gray-500">
            Enter amount in rupees (maximum 2 decimal places)
          </p>
        </div>

        {/* Document Upload Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload PO Document <span className="text-gray-500">(Optional)</span>
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
            onBlur={() => handleBlur('poFile')}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            disabled={isSubmitting}
          />
          
          {getErrorDisplay('poFile') && (
            <p className="text-red-500 text-xs mt-1">{getErrorDisplay('poFile')}</p>
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
        <div className='flex pt-2'>
          <button 
            onClick={onClose} 
            className="w-[40%] mr-auto text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400 disabled:opacity-50"
            disabled={isSubmitting}
          >
            Close
          </button>
          <button 
            onClick={handleSave} 
            className="w-[40%] text-sm bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || Object.values(errors).some(error => error !== '')}
          >
            {isSubmitting ? 'Saving...' : 'Save PO'}
          </button>
        </div>
      </div>
    </div>
  );
}