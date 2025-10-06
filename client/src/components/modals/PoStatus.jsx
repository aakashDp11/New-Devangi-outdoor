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

  const { pipelineData, setPipelineData } = useContext(PipelineContext);
  const username = localStorage.getItem('userName');
  const useremail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');

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

  const handleFileChange = (e) => {
    setPoFile(e.target.files[0]);
  };

  const handleSave = async () => {
    if (!poNumber || !poDate || !poValue || (!poFile && !documentUrl)) {
      toast.error('Please fill all fields and upload the PO document.');
      return;
    }
    
    try {
      let finalDocumentUrl = documentUrl;
      if (poFile) {
        const formData = new FormData();
        formData.append('file', poFile);
        const uploadRes = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/po/upload`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        finalDocumentUrl = uploadRes.data.documentUrl;
      }

      const previousPoDetails = { ...pipelineData?.po };
      const newPoDetails = {
        confirmed: true,
        poNumber,
        poDate,
        poValue,
        documentUrl: finalDocumentUrl,
      };
      
      const changeLogData = {
        campaignId, userId,
        changeType: 'PO Status Update',
        userName: username, userEmail: useremail,
        previousValue: previousPoDetails,
        newValue: newPoDetails,
      };

      const res = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/po`,
        newPoDetails
      );

      setPipelineData(res.data);
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log`, changeLogData); 
      toast.success('PO details saved!');
      onConfirm();
    } catch (err) {
      toast.error('Failed to save PO status.');
      console.error('Failed to save PO status:', err);
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
    <div className="max-w-md w-full bg-white p-4 py-0 rounded-xl">
      <h2 className="text-xl font-semibold text-gray-800 mb-5 text-center">
        {existingData?.confirmed ? 'Edit PO Status' : 'PO Status'}
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PO Number <span className="text-red-500">*</span></label>
          <input
            type="text"
            placeholder="Enter PO number"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PO Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={poDate}
            onChange={(e) => setPoDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PO Value (₹) <span className="text-red-500">*</span></label>
          <input
            type="number"
            placeholder="Enter PO amount"
            value={poValue}
            onChange={(e) => setPoValue(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload PO Document <span className="text-red-500">*</span></label>
          {documentUrl && (
            <div className="mb-2 text-xs">
              <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
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
          {documentUrl && <p className="text-xs mt-1 text-gray-500">A file is already uploaded. Uploading a new one will replace it.</p>}
        </div>
        <div className='flex pt-2'>
          <button onClick={onClose} className="w-[40%] mr-auto text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400">
            Close
          </button>
          <button onClick={handleSave} className="w-[40%] text-sm bg-blue-600 text-white py-2 rounded-xl">
            Save PO
          </button>
        </div>
      </div>
    </div>
  );
}