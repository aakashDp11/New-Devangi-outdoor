


import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function PrintingStatus({ spaceId, onConfirm }) {
  const [printingStatus, setPrintingStatus] = useState(false);
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);

  // ✅ Fetch space status once when component mounts to ensure fresh status
  useEffect(() => {
    const fetchSpaceStatus = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/spaces/${spaceId}`);
        if (res.data?.printingStatus?.confirmed) {
          setAlreadyConfirmed(true);
        }
      } catch (error) {
        console.error('Failed to fetch space printing status:', error);
      }
    };

    if (spaceId) {
      fetchSpaceStatus();
    }
  }, [spaceId]);

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:3000/api/spaces/${spaceId}/printingStatus`);
      setAlreadyConfirmed(true);
      onConfirm();
    } catch (err) {
      console.error('Failed to confirm printing status:', err);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Printing done</h2>

      {alreadyConfirmed ? (
        <p className="text-green-700 font-semibold">✅ Printing already confirmed for this space.</p>
      ) : (
        <>
          <div className="flex text-xs items-center space-x-3 mb-4">
            <input
              id="printingCheckbox"
              type="checkbox"
              checked={printingStatus}
              onChange={() => setPrintingStatus(!printingStatus)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="printingCheckbox" className="text-gray-700 text-sm">Yes?</label>
          </div>

          <button
            onClick={handleSave}
            disabled={!printingStatus}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Save
          </button>
        </>
      )}
    </div>
  );
}

