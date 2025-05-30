

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export default function MountingStatus({ spaceId, onConfirm, onClose }) {
  const [mountingStatus, setMountingStatus] = useState(false);
  const [receivedDate, setReceivedDate] = useState('');
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);

  useEffect(() => {
    const fetchSpaceStatus = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/spaces/${spaceId}`);
        if (res.data?.mountingStatus?.confirmed) {
          setAlreadyConfirmed(true);
          setReceivedDate(res.data.mountingStatus.receivedDate || '');
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
    try {
      if (!mountingStatus) {
        toast.error('Please confirm mounting.');
        return;
      }
      if (!receivedDate) {
        toast.error('Please select a received date.');
        return;
      }

      await axios.put(`http://localhost:3000/api/spaces/${spaceId}/mountingStatus`, {
        confirmed: true,
        receivedDate,
      });

      toast.success('Mounting status saved.');
      setAlreadyConfirmed(true);
      onConfirm();
    } catch (err) {
      console.error('Failed to confirm mounting status:', err);
      toast.error('Failed to save mounting status.');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-2 ">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 text-center">Mounting Status</h2>

      {alreadyConfirmed ? (
        <div className="space-y-4 text-sm text-gray-700 text-center">
          <p className="text-green-700 font-medium">✅ Mounting already confirmed for this space.</p>
          {receivedDate && (
            <p>
              <span className="font-medium">Received Date:</span> {receivedDate}
            </p>
          )}
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
        <>
          <div className="flex items-center space-x-3 mb-4 text-sm">
            <input
              id="mountingCheckbox"
              type="checkbox"
              checked={mountingStatus}
              onChange={() => setMountingStatus(!mountingStatus)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="mountingCheckbox" className="text-gray-700 font-medium">
              Mounting Completed?
            </label>
          </div>

          {mountingStatus && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
                <input
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {!mountingStatus && (
            <div className="flex mt-4 w-full">
              <button
                onClick={onClose}
                className="mx-auto text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400 transition duration-200"
              >
                Close
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
