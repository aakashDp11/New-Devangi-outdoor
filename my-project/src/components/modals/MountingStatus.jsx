import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export default function MountingStatus({ campaignId, unitId,spaceId, onConfirm, onClose, existingData }) {
  const [view, setView] = useState('form');
  const [mountingDate, setMountingDate] = useState('');
  const [assignedPerson, setAssignedPerson] = useState('');
  const [assignedAgency, setAssignedAgency] = useState('');
  const [note, setNote] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  
  const username = localStorage.getItem('userName');
  const useremail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');

  // Validation functions
  const validateAssignedPerson = (person) => {
    if (!person || person.trim() === '') return null; // Optional field
    if (person.trim().length < 2) return 'Name must be at least 2 characters';
    if (person.trim().length > 50) return 'Name must be less than 50 characters';
    // Check for valid name (letters, spaces, hyphens, apostrophes)
    if (!/^[A-Za-z\s\-'\.]+$/.test(person.trim())) {
      return 'Name can only contain letters, spaces, hyphens, apostrophes, and dots';
    }
    return null;
  };

  const validateAssignedAgency = (agency) => {
    if (!agency || agency.trim() === '') return null; // Optional field
    if (agency.trim().length < 2) return 'Agency name must be at least 2 characters';
    if (agency.trim().length > 100) return 'Agency name must be less than 100 characters';
    // Check for valid agency name (letters, numbers, spaces, common punctuation)
    if (!/^[A-Za-z0-9\s\-'&\.\,\(\)]+$/.test(agency.trim())) {
      return 'Agency name contains invalid characters';
    }
    return null;
  };

  const validateNote = (noteText) => {
    if (!noteText || noteText.trim() === '') return null; // Optional field
    if (noteText.trim().length > 500) return 'Note must be less than 500 characters';
    // Check for potentially harmful content (basic XSS prevention)
    if (/<script|javascript:|on\w+=/i.test(noteText)) {
      return 'Note contains invalid content';
    }
    return null;
  };

  const validateAllFields = () => {
    const errors = {};
    
    const personError = validateAssignedPerson(assignedPerson);
    if (personError) errors.assignedPerson = personError;

    const agencyError = validateAssignedAgency(assignedAgency);
    if (agencyError) errors.assignedAgency = agencyError;

    const noteError = validateNote(note);
    if (noteError) errors.note = noteError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (existingData && existingData.confirmed) {
      setView('summary');
      setMountingDate(existingData.mountingDate ? new Date(existingData.mountingDate).toISOString().split('T')[0] : '');
      setAssignedAgency(existingData.assignedAgency || '');
      setAssignedPerson(existingData.assignedPerson || '');
      setNote(existingData.note || '');
    } else {
      setView('form');
    }
  }, [existingData]);

  // Real-time validation
  useEffect(() => {
    const timer = setTimeout(() => {
      validateAllFields();
    }, 500); // Debounce validation
    
    return () => clearTimeout(timer);
  }, [assignedPerson, assignedAgency, note]);

  const handleAssignedPersonChange = (value) => {
    setAssignedPerson(value);
  };

  const handleAssignedAgencyChange = (value) => {
    setAssignedAgency(value);
  };

  const handleNoteChange = (value) => {
    setNote(value);
  };

  const handleSave = async () => {
    // Validate before saving
    if (!validateAllFields()) {
      toast.error('Please fix all validation errors before saving.');
      return;
    }

    const newMountingStatus = {
      confirmed: true,
      mountingDate,
      assignedPerson: assignedPerson.trim(),
      assignedAgency: assignedAgency.trim(),
      note: note.trim(),
    };

    const changeLogData = {
      campaignId,
      userId: userId,
      changeType: 'Mounting Status Update',
      userName: username,
      userEmail: useremail,
      previousValue: existingData,
      newValue: newMountingStatus,
    };

    try {
      // await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${spaceId}/mountingStatus`, newMountingStatus);
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/campaigns/update-mounting-status`, {updatedMountingStatus:newMountingStatus,unitId,campaignId,spaceId});
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log`, changeLogData);
      
      toast.success('Mounting status saved successfully.');
      onConfirm();
    } catch (err) {
      console.error('Failed to confirm mounting status:', err);
      toast.error('Failed to save mounting status.');
    }
  };

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
        {existingData?.confirmed ? 'Edit Mounting Status' : 'Mounting Status'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mounting Date</label>
          <input
            type="date"
            value={mountingDate}
            onChange={(e) => setMountingDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Person</label>
          <input
            type="text"
            placeholder="Enter name"
            value={assignedPerson}
            onChange={(e) => handleAssignedPersonChange(e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.assignedPerson ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.assignedPerson && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.assignedPerson}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Agency</label>
          <input
            type="text"
            placeholder="Enter agency name"
            value={assignedAgency}
            onChange={(e) => handleAssignedAgencyChange(e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.assignedAgency ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.assignedAgency && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.assignedAgency}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (if any)
            {note && (
              <span className="text-xs text-gray-500 ml-2">
                ({note.length}/500 characters)
              </span>
            )}
          </label>
          <input
            type="text"
            placeholder="Add any relevant notes..."
            value={note}
            onChange={(e) => handleNoteChange(e.target.value)}
            maxLength="500"
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.note ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.note && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.note}</p>
          )}
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
          disabled={Object.keys(validationErrors).length > 0}
          className={`w-1/3 text-sm py-2 rounded-lg transition ${
            Object.keys(validationErrors).length > 0 
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Save
        </button>
      </div>
    </div>
  );
}