import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { PipelineContext } from '../../context/PipelineContext';
import { toast } from 'sonner';

export default function ArtworkForm({ campaignId, onConfirm, onClose, existingData }) {
  const [view, setView] = useState('form');
  const [artworkFile, setArtworkFile] = useState(null);
  const [receivedDate, setReceivedDate] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');

  const { pipelineData, setPipelineData } = useContext(PipelineContext);
  const username = localStorage.getItem('userName');
  const useremail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');
  console.log("existing data in artwork form is",existingData);
  useEffect(() => {
    if (existingData && existingData.confirmed) {
      setView('summary');
      setReceivedDate(existingData.receivedDate ? new Date(existingData.receivedDate).toISOString().split('T')[0] : '');
      setDocumentUrl(existingData.documentUrl || '');
    } else {
      setView('form');
      setReceivedDate(new Date().toISOString().split('T')[0]);
    }
  }, [existingData]);

  const handleFileChange = (e) => {
    setArtworkFile(e.target.files[0]);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentUrl.split('/').pop() || 'artwork-file';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Download failed');
    }
  };

  const handleSave = async () => {
    if (!receivedDate || (!artworkFile && !documentUrl)) {
      toast.error('Please select a received date and upload the artwork file.');
      return;
    }

    try {
      let finalDocumentUrl = documentUrl;
      if (artworkFile) {
        const formData = new FormData();
        formData.append('file', artworkFile);
        const uploadRes = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/artwork/upload`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        finalDocumentUrl = uploadRes.data.documentUrl;
      }
      
      const previousArtworkStatus = { ...pipelineData?.artwork };
      const newArtworkStatus = {
        confirmed: true,
        receivedDate,
        documentUrl: finalDocumentUrl,
      };
      
      const changeLogData = {
        campaignId, userId,
        changeType: 'Artwork Form Status Update',
        userName: username, userEmail: useremail,
        previousValue: previousArtworkStatus,
        newValue: newArtworkStatus,
      };

      const res = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/artwork`,
        newArtworkStatus
      );
      
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log`, changeLogData); 

      setPipelineData(res.data);
      toast.success('Artwork received and saved successfully');
      onConfirm();
    } catch (err) {
      console.error('Error saving artwork:', err);
      toast.error('Failed to save artwork ❌');
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
          {/* ================================================================= */}
          {/* MODIFICATION: "Edit" button removed, "Close" button centered    */}
          {/* ================================================================= */}
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Received Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={receivedDate}
            onChange={(e) => setReceivedDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Artwork File <span className="text-red-500">*</span>
          </label>
           {documentUrl && (
            <div className="mb-2 text-xs">
              <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                View Current Artwork
              </a>
            </div>
          )}
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            required={!documentUrl}
          />
          {documentUrl && <p className="text-xs mt-1 text-gray-500">A file is already uploaded. Uploading a new one will replace it.</p>}
        </div>
        <div className='flex pt-4'>
          <button onClick={onClose} className="w-[40%] mr-auto text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400">
            Close
          </button>
          <button onClick={handleSave} className="w-[40%] text-xs bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}