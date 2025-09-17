import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { PipelineContext } from '../../context/PipelineContext';
import { toast } from 'sonner';

export default function ArtworkForm({ campaignId, onConfirm, onClose, existingData }) {
  const [view, setView] = useState('form');
  const [artworkFile, setArtworkFile] = useState(null);
  const [receivedDate, setReceivedDate] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const { pipelineData, setPipelineData } = useContext(PipelineContext);
  const username = localStorage.getItem('userName');
  const useremail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');

  console.log("existing data in artwork form is", existingData);

  // Validation functions
  const validateReceivedDate = (value) => {
    if (!value) {
      return 'Received date is required';
    }
    
    const selectedDate = new Date(value);
    if (isNaN(selectedDate.getTime())) {
      return 'Invalid date format';
    }
    
    return '';
  };

  const validateFile = (file) => {
    if (!file) return ''; // File is optional now
    
    // More comprehensive file types for artwork files
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp',
      'image/svg+xml',
      'application/postscript', // .ai, .eps files
      'application/illustrator',
      'application/x-photoshop', // .psd files
      'application/vnd.adobe.photoshop',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip', // For packaged artwork files
      'application/x-zip-compressed'
    ];
    
    const maxSizeInMB = 5; // Larger size for artwork files
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    
    // Check file type by extension if MIME type check fails
    const fileName = file.name.toLowerCase();
    const allowedExtensions = [
      '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', 
      '.webp', '.svg', '.ai', '.eps', '.psd', '.doc', '.docx', '.zip'
    ];
    
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    const hasValidMimeType = allowedTypes.includes(file.type);
    
    if (!hasValidMimeType && !hasValidExtension) {
      return 'File type not supported. Please upload artwork files (PDF, images, AI, PSD, etc.)';
    }
    
    if (file.size > maxSizeInBytes) {
      return `File size must be less than ${maxSizeInMB}MB`;
    }
    
    if (file.name.length > 150) {
      return 'File name is too long (max 150 characters)';
    }
    
    // Check for potentially harmful file names
    if (/[<>:"/\\|?*]/.test(file.name)) {
      return 'File name contains invalid characters';
    }
    
    return '';
  };

  // Real-time validation
  const validateField = (fieldName, value, file = null) => {
    let error = '';
    
    switch (fieldName) {
      case 'receivedDate':
        error = validateReceivedDate(value);
        break;
      case 'artworkFile':
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
      setReceivedDate(existingData.receivedDate ? new Date(existingData.receivedDate).toISOString().split('T')[0] : '');
      setDocumentUrl(existingData.documentUrl || '');
    } else {
      setView('form');
      const today = new Date().toISOString().split('T')[0];
      setReceivedDate(today);
      // Validate initial date
      validateField('receivedDate', today);
    }
  }, [existingData]);

  const handleReceivedDateChange = (e) => {
    const value = e.target.value;
    setReceivedDate(value);
    if (touched.receivedDate) {
      validateField('receivedDate', value);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setArtworkFile(file);
    if (touched.artworkFile || file) {
      validateField('artworkFile', null, file);
    }
  };

  // Validate all fields before submission
  const validateAllFields = () => {
    const dateValid = validateField('receivedDate', receivedDate);
    const fileValid = validateField('artworkFile', null, artworkFile);
    
    // Mark all fields as touched
    setTouched({
      receivedDate: true,
      artworkFile: true
    });
    
    return dateValid && fileValid;
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

  const handleDownload = async () => {
    if (!documentUrl) {
      toast.error('No file to download');
      return;
    }

    try {
      const response = await fetch(documentUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentUrl.split('/').pop() || 'artwork-file';
      document.body.appendChild(a); // Append to body for better browser compatibility
      a.click();
      document.body.removeChild(a); // Clean up
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Download failed. Please try again.');
    }
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
      if (artworkFile) {
        const formData = new FormData();
        formData.append('file', artworkFile);
        const uploadRes = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/artwork/upload`,
          formData,
          { 
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000 // 60 second timeout for large artwork files
          }
        );
        
        if (!uploadRes.data?.documentUrl) {
          throw new Error('File upload failed - no URL returned');
        }
        
        finalDocumentUrl = uploadRes.data.documentUrl;
      }
      
      const previousArtworkStatus = { ...pipelineData?.artwork };
      const newArtworkStatus = {
        confirmed: true,
        receivedDate,
        documentUrl: finalDocumentUrl,
      };
      
      const changeLogData = {
        campaignId, 
        userId,
        changeType: 'Artwork Form Status Update',
        userName: username, 
        userEmail: useremail,
        previousValue: previousArtworkStatus,
        newValue: newArtworkStatus,
      };

      const res = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/artwork`,
        newArtworkStatus,
        { timeout: 30000 }
      );
      
      if (!res.data) {
        throw new Error('No data received from server');
      }
      
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log`, 
        changeLogData,
        { timeout: 30000 }
      ); 

      setPipelineData(res.data);
      toast.success('Artwork received and saved successfully');
      onConfirm();
    } catch (err) {
      console.error('Error saving artwork:', err);
      
      if (err.response?.status === 400) {
        toast.error(err.response.data?.message || 'Invalid data provided');
      } else if (err.response?.status === 413) {
        toast.error('File too large. Please upload a smaller file.');
      } else if (err.code === 'ECONNABORTED') {
        toast.error('Request timeout. Please check your connection and try again.');
      } else if (err.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to save artwork. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (view === 'summary') {
    return (
      <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-xl">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 text-center">Artwork Status</h2>
        <div className="space-y-4 w-full text-sm text-gray-700">
          <p className="text-green-700 font-medium text-center">✅ Artwork received and saved.</p>
          {receivedDate && (
            <div>
              <label className="block font-medium">Received Date:</label>
              <p>{receivedDate}</p>
            </div>
          )}
          {documentUrl && (
            <div className='w-full'>
              <label className="block font-medium">Artwork File:</label>
              <div className="flex items-center gap-8 w-full mt-2">
                <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  View Artwork
                </a>
                <button onClick={handleDownload} className="text-xs bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition">
                  Download
                </button>
              </div>
            </div>
          )}
          <div className='flex justify-center pt-8'>
            <button onClick={onClose} className="w-1/2 text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-xl">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 text-center">
        {existingData?.confirmed ? 'Edit Artwork Status' : 'Artwork Status'}
      </h2>
      
      <div className="space-y-4">
        {/* Received Date Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Received Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={receivedDate}
            onChange={handleReceivedDateChange}
            onBlur={() => handleBlur('receivedDate')}
            className={getInputClass('receivedDate', 'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500')}
            disabled={isSubmitting}
          />
          {getErrorDisplay('receivedDate') && (
            <p className="text-red-500 text-xs mt-1">{getErrorDisplay('receivedDate')}</p>
          )}
        </div>

        {/* Artwork File Upload Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Artwork File <span className="text-gray-500">(Optional)</span>
          </label>
          
          {documentUrl && (
            <div className="mb-2 text-xs">
              <a 
                href={documentUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 underline hover:text-blue-800"
              >
                View Current Artwork
              </a>
            </div>
          )}
          
          <input
            type="file"
            onChange={handleFileChange}
            onBlur={() => handleBlur('artworkFile')}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.tif,.webp,.svg,.ai,.eps,.psd,.doc,.docx,.zip"
            disabled={isSubmitting}
          />
          
          {getErrorDisplay('artworkFile') && (
            <p className="text-red-500 text-xs mt-1">{getErrorDisplay('artworkFile')}</p>
          )}
          
          <p className="text-xs mt-1 text-gray-500">
            Accepted formats: PDF, Images (JPG, PNG, GIF, etc.), AI, PSD, EPS, ZIP | Max size: 50MB
          </p>
          
          {documentUrl && (
            <p className="text-xs mt-1 text-gray-500">
              A file is already uploaded. Uploading a new one will replace it.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className='flex pt-4'>
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
}