import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export default function MountingStatus({ campaignId, spaceId, onConfirm, onClose }) {
  const [mountingStatus, setMountingStatus] = useState(false); // This state isn't directly used to control confirmed status
  const [receivedDate, setReceivedDate] = useState('');
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);
  const [assignedPerson, setAssignedPerson] = useState('');
  const [assignedAgency, setAssignedAgency] = useState('');
  const username = localStorage.getItem('userName');
  const useremail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');
  const [note, setNote] = useState('');
  const [previousMountingDetails, setPreviousMountingDetails] = useState();

  useEffect(() => {
    const fetchSpaceStatus = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${spaceId}`);
        const mountingStatusData = res.data?.mountingStatus;
        if (mountingStatusData?.confirmed) {
          setAlreadyConfirmed(true);
          setReceivedDate(mountingStatusData.mountingDate || ''); // Assuming 'mountingDate' for consistency
          setAssignedAgency(mountingStatusData.assignedAgency || '');
          setAssignedPerson(mountingStatusData.assignedPerson || '');
          setNote(mountingStatusData.note || '');
          setPreviousMountingDetails(mountingStatusData);
        }
      } catch (error) {
        console.error('Failed to fetch mounting status:', error);
      }
    };

    if (spaceId) {
      fetchSpaceStatus();
    }
  }, [spaceId]);

  const handleSave = async () => {
    // Validate mandatory fields
    if (!receivedDate || !assignedPerson || !assignedAgency) {
      toast.error('Please fill all mandatory fields before saving.');
      return;
    }

    const newMountingStatus = {
      confirmed: true,
      mountingDate: receivedDate, // Use 'mountingDate' for consistency
      assignedPerson,
      assignedAgency,
      note,
    };

    const changeLogData = {
      campaignId,
      userId: userId,
      changeType: 'Mounting Status Update', // Corrected change type from 'Printing Status Update'
      userName: username,
      userEmail: useremail,
      previousValue: previousMountingDetails,
      newValue: newMountingStatus,
    };

    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${spaceId}/mountingStatus`, newMountingStatus);
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log`, changeLogData);
      
      setAlreadyConfirmed(true);
      toast.success('Mounting status saved successfully.');
      onConfirm();
    } catch (err) {
      console.error('Failed to confirm mounting status:', err);
      toast.error('Failed to save mounting status.');
    }
  };

  const RedAsterisk = () => <span className="text-red-500 ml-1">*</span>;

  return (
    // --- MODIFICATION: Wider container and consistent padding ---
    <div className="max-w-4xl w-full mx-auto p-6 bg-white rounded-lg">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">Mounting Status</h2>

      {alreadyConfirmed ? (
        <div className="space-y-4 text-center text-gray-700">
          <p className="text-green-700 font-medium text-lg">✅ Mounting already confirmed for this space.</p>
          {/* --- MODIFICATION: Display in a 2-column grid for confirmed state --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-left bg-gray-50 p-4 rounded-lg">
            {receivedDate && (
              <p>
                <span className="font-medium">Mounting Date:</span> {receivedDate}
              </p>
            )}
            {assignedPerson && (
              <p>
                <span className="font-medium">Assigned Person:</span> {assignedPerson}
              </p>
            )}
            {assignedAgency && (
              <p>
                <span className="font-medium">Assigned Agency:</span> {assignedAgency}
              </p>
            )}
            {note && (
              <p className="md:col-span-2">
                <span className="font-medium">Note:</span> {note}
              </p>
            )}
          </div>
          <div className="flex justify-center mt-6">
            <button
              onClick={onClose}
              className="w-1/3 text-sm bg-gray-300 text-black py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* --- MODIFICATION: Changed layout to a 2-column grid --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mounting Date <RedAsterisk /></label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
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
            {/* Notes field takes full width in the 2-column grid */}
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
        </>
      )}
    </div>
  );
}