import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

// MODIFICATION 1: The component now accepts the `existingData` prop
export default function MountingStatus({ campaignId, spaceId, onConfirm, onClose, existingData }) {
  // MODIFICATION 2: A 'view' state is added to control what is shown
  const [view, setView] = useState('form');

  const [mountingDate, setMountingDate] = useState('');
  const [assignedPerson, setAssignedPerson] = useState('');
  const [assignedAgency, setAssignedAgency] = useState('');
  const [note, setNote] = useState('');
  
  const username = localStorage.getItem('userName');
  const useremail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');

  // MODIFICATION 3: This useEffect now uses the prop to decide the initial view
  useEffect(() => {
    // If data already exists and is confirmed, show the summary view first.
    if (existingData && existingData.confirmed) {
      setView('summary');
      // Pre-fill the state with existing data for both the summary and the edit form
      setMountingDate(existingData.mountingDate ? new Date(existingData.mountingDate).toISOString().split('T')[0] : '');
      setAssignedAgency(existingData.assignedAgency || '');
      setAssignedPerson(existingData.assignedPerson || '');
      setNote(existingData.note || '');
    } else {
      // Otherwise, show the form for a new entry.
      setView('form');
    }
  }, [existingData]);

  const handleSave = async () => {
    if (!mountingDate || !assignedPerson || !assignedAgency) {
      toast.error('Please fill all mandatory fields before saving.');
      return;
    }

    const newMountingStatus = {
      confirmed: true,
      mountingDate,
      assignedPerson,
      assignedAgency,
      note,
    };

    const changeLogData = {
      campaignId,
      userId: userId,
      changeType: 'Mounting Status Update',
      userName: username,
      userEmail: useremail,
      previousValue: existingData, // Use the prop for previous value
      newValue: newMountingStatus,
    };

    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${spaceId}/mountingStatus`, newMountingStatus);
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log`, changeLogData);
      
      toast.success('Mounting status saved successfully.');
      onConfirm();
    } catch (err) {
      console.error('Failed to confirm mounting status:', err);
      toast.error('Failed to save mounting status.');
    }
  };

  const RedAsterisk = () => <span className="text-red-500 ml-1">*</span>;

  // MODIFICATION 4: Conditional Rendering based on the 'view' state
  if (view === 'summary') {
    return (
      <div className="max-w-4xl w-full mx-auto p-6 bg-white rounded-lg">
        <h2 className="text-2xl font-semibold mb-6 text-green-700 text-center">Mounting Confirmed</h2>
        <div className="space-y-4 text-center text-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-left bg-gray-50 p-4 rounded-lg">
            {mountingDate && <p><span className="font-medium">Mounting Date:</span> {mountingDate}</p>}
            {assignedPerson && <p><span className="font-medium">Assigned Person:</span> {assignedPerson}</p>}
            {assignedAgency && <p><span className="font-medium">Assigned Agency:</span> {assignedAgency}</p>}
            {note && <p className="md:col-span-2"><span className="font-medium">Note:</span> {note}</p>}
          </div>
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={onClose}
              className="w-1/3 text-sm bg-gray-300 text-black py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Close
            </button>
            <button
              onClick={() => setView('form')}
              className="w-1/3 text-sm bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto p-6 bg-white rounded-lg">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
        {existingData?.confirmed ? 'Edit Mounting Status' : 'Mounting Status'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mounting Date <RedAsterisk /></label>
          <input
            type="date"
            value={mountingDate}
            onChange={(e) => setMountingDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Person <RedAsterisk /></label>
          <input
            type="text"
            placeholder="Enter name"
            value={assignedPerson}
            onChange={(e) => setAssignedPerson(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Agency <RedAsterisk /></label>
          <input
            type="text"
            placeholder="Enter agency name"
            value={assignedAgency}
            onChange={(e) => setAssignedAgency(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
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