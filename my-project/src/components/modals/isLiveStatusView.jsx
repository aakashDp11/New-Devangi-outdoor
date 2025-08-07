import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function IsLiveStatusView({ spaceId, onClose }) {
  const [liveInfo, setLiveInfo] = useState(null);

  useEffect(() => {
    const fetchLiveStatus = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${spaceId}`);
        if (res.data?.digitalStatus?.isLive) {
          setLiveInfo(res.data.digitalStatus);
        }
      } catch (error) {
        console.error('Failed to fetch live status:', error);
      }
    };

    if (spaceId) fetchLiveStatus();
  }, [spaceId]);

  if (!liveInfo) {
    return (
      <div className="text-sm text-gray-600 text-center py-6">
        Live status not confirmed yet.
        <div className="mt-4">
          <button
            onClick={onClose}
            className="text-xs bg-gray-300 text-black py-2 px-6 rounded-xl hover:bg-gray-400 transition duration-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full mx-auto mt-2 bg-white">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 text-center">Is Live</h2>
      <div className="space-y-4 text-sm text-gray-700 text-center">
        <p className="text-green-700 font-medium">✅ This space is live.</p>
        {liveInfo.goLiveDate && (
          <p>
            <span className="font-medium">Go Live Date:</span> {liveInfo.goLiveDate}
          </p>
        )}
        {liveInfo.assignedPerson && (
          <p>
            <span className="font-medium">Assigned Person:</span> {liveInfo.assignedPerson}
          </p>
        )}
        {liveInfo.assignedAgency && (
          <p>
            <span className="font-medium">Assigned Agency:</span> {liveInfo.assignedAgency}
          </p>
        )}
        {liveInfo.note && (
          <p>
            <span className="font-medium">Note:</span> {liveInfo.note}
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
    </div>
  );
}
