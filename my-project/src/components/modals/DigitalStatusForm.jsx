import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export default function DigitalStatusForm({ campaignId, spaceId, onConfirm, onClose }) {
  const [goLiveDate, setGoLiveDate] = useState('');
  const [note, setNote] = useState('');
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);
  const [assignedPerson, setAssignedPerson] = useState('');
  const [assignedAgency, setAssignedAgency] = useState('');
  const [previousStatus, setPreviousStatus] = useState();

  const username = localStorage.getItem('userName');
  const useremail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchSpaceStatus = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${spaceId}`);
        if (res.data?.digitalStatus?.confirmed) {
          setAlreadyConfirmed(true);
          setPreviousStatus(res.data.digitalStatus);
          setGoLiveDate(res.data.digitalStatus.goLiveDate || '');
          setAssignedAgency(res.data.digitalStatus.assignedAgency || '');
          setAssignedPerson(res.data.digitalStatus.assignedPerson || '');
          setNote(res.data.digitalStatus.note || '');
        }
      } catch (error) {
        console.error('Failed to fetch digital status:', error);
      }
    };

    if (spaceId) fetchSpaceStatus();
  }, [spaceId]);

  const handleSave = async () => {
    if (!goLiveDate || !assignedPerson || !assignedAgency) {
      toast.error('Please complete all required fields');
      return;
    }

    const newValue = {
      confirmed: true,
      isLive: true,
      goLiveDate,
      assignedPerson,
      assignedAgency,
      note
    };

    const changeLog = {
      campaignId,
      userId,
      userName: username,
      userEmail: useremail,
      changeType: 'Digital Status Update',
      previousValue: previousStatus,
      newValue
    };

    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${spaceId}/digitalStatus`, newValue);
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log`, changeLog);
      setAlreadyConfirmed(true);
      onConfirm();
    } catch (err) {
      console.error('Failed to confirm digital status:', err);
    }
  };

  return (
    <div className="max-w-2xl w-[100%] mx-auto mt-2 bg-white">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 text-center">Digital Status</h2>

      {alreadyConfirmed ? (
        <div className="space-y-4 text-sm text-gray-700 text-center">
          <p className="text-green-700 font-medium">✅ Digital status already confirmed for this space.</p>
          {goLiveDate && <p><span className="font-medium">Go Live Date:</span> {goLiveDate}</p>}
          {assignedPerson && <p><span className="font-medium">Assigned Person:</span> {assignedPerson}</p>}
          {assignedAgency && <p><span className="font-medium">Assigned Agency:</span> {assignedAgency}</p>}
          {note && <p><span className="font-medium">Note:</span> {note}</p>}
          <div className="flex mt-4">
            <button
              onClick={onClose}
              className="w-[40%] mx-auto text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400 transition duration-200"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Go Live Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={goLiveDate}
              onChange={(e) => setGoLiveDate(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Assigned Person <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={assignedPerson}
              onChange={(e) => setAssignedPerson(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Assigned Agency <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={assignedAgency}
              onChange={(e) => setAssignedAgency(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex">
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
      )}
    </div>
  );
}
