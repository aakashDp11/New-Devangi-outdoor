import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export default function PrintingStatus({ campaignId, spaceId, onConfirm, onClose, existingData }) {
  const [view, setView] = useState('form');
  const [printingDate, setPrintingDate] = useState('');
  const [note, setNote] = useState('');
  const [printingMaterial, setPrintingMaterial] = useState('');
  const [assignedPerson, setAssignedPerson] = useState('');
  const [assignedAgency, setAssignedAgency] = useState('');
  
  const username = localStorage.getItem('userName');
  const useremail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (existingData && existingData.confirmed) {
      setView('summary');
      setPrintingDate(existingData.printingDate ? new Date(existingData.printingDate).toISOString().split('T')[0] : '');
      setAssignedAgency(existingData.assignedAgency || '');
      setAssignedPerson(existingData.assignedPerson || '');
      setPrintingMaterial(existingData.printingMaterial || '');
      setNote(existingData.note || '');
    } else {
      setView('form');
    }
  }, [existingData]);

  const handleSave = async () => {
    if (!printingDate || !assignedPerson || !assignedAgency || !printingMaterial) {
      toast.error('Please fill all mandatory fields before saving.');
      return;
    }

    const newPrintingStatus = {
      confirmed: true,
      printingDate,
      assignedPerson,
      assignedAgency,
      printingMaterial,
      note,
    };

    const changeLogData = {
      campaignId,
      userId,
      changeType: 'Printing Status Update',
      userName: username,
      userEmail: useremail,
      previousValue: existingData,
      newValue: newPrintingStatus,
    };

    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${spaceId}/printingStatus`, newPrintingStatus);
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log`, changeLogData);
      
      toast.success('Printing status saved successfully!');
      onConfirm();
    } catch (err) {
      console.error('Failed to confirm printing status:', err);
      toast.error('Failed to save printing status.');
    }
  };

  const RedAsterisk = () => <span className="text-red-500 ml-1">*</span>;

  if (view === 'summary') {
    return (
      <div className="max-w-4xl w-full mx-auto p-6 bg-white rounded-lg">
        <h2 className="text-2xl font-semibold mb-6 text-green-700 text-center">Printing Confirmed</h2>
        <div className="space-y-4 text-center text-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-left bg-gray-50 p-4 rounded-lg">
            {printingDate && <p><span className="font-medium">Printing Date:</span> {printingDate}</p>}
            {assignedPerson && <p><span className="font-medium">Assigned Person:</span> {assignedPerson}</p>}
            {assignedAgency && <p><span className="font-medium">Assigned Agency:</span> {assignedAgency}</p>}
            {printingMaterial && <p><span className="font-medium">Material:</span> {printingMaterial}</p>}
            {note && <p className="md:col-span-2"><span className="font-medium">Note:</span> {note}</p>}
          </div>
          {/* ================================================================= */}
          {/* MODIFICATION: "Edit" button removed, "Close" button centered    */}
          {/* ================================================================= */}
          <div className="flex justify-center mt-6">
            <button
              onClick={onClose}
              className="w-1/2 text-sm bg-gray-300 text-black py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto p-6 bg-white rounded-lg">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
        {existingData?.confirmed ? 'Edit Printing Status' : 'Printing Status'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Printing Date<RedAsterisk /></label>
          <input
            type="date"
            value={printingDate}
            onChange={(e) => setPrintingDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Person<RedAsterisk /></label>
          <input
            type="text"
            placeholder="Enter name"
            value={assignedPerson}
            onChange={(e) => setAssignedPerson(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Agency<RedAsterisk /></label>
          <input
            type="text"
            placeholder="Enter agency name"
            value={assignedAgency}
            onChange={(e) => setAssignedAgency(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Material Type<RedAsterisk /></label>
          <select
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={printingMaterial}
            onChange={(e) => setPrintingMaterial(e.target.value)}
          >
            <option value="">Select...</option>
            <option>Normal Flex</option>
            <option>Black Back Flex</option>
            <option>Backlit Flex</option>
            <option>Normal SAV</option>
            <option>Black Back SAV</option>
            <option>Star Flex</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (if any)</label>
          <input
            type="text"
            placeholder="Add any relevant notes..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={onClose}
          className="w-1/3 text-sm bg-gray-300 text-black py-2 rounded-lg hover:bg-gray-400 transition"
        >
          Close
        </button>
        <button
          onClick={handleSave}
          className="w-1/3 text-sm bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Save
        </button>
      </div>
    </div>
  );
}