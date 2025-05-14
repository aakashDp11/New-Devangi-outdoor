import React, { useState, useContext } from 'react';
import axios from 'axios';
import { PipelineContext } from '../../context/PipelineContext';

export default function POForm({ bookingId, onConfirm }) {
  const [poReceived, setPoReceived] = useState(false);
  const [poFile, setPoFile] = useState(null);
  const { pipelineData, setPipelineData } = useContext(PipelineContext);

  const handleFileChange = (e) => {
    setPoFile(e.target.files[0]);
  };

  const handleSave = async () => {
    try {
      if (poFile) {
        const formData = new FormData();
        formData.append('file', poFile);
        await axios.post(`http://localhost:3000/api/pipeline/${bookingId}/po/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      const res = await axios.put(`http://localhost:3000/api/pipeline/${bookingId}/po`, {
        confirmed: true
      });

      setPipelineData(res.data);
      onConfirm();
    } catch (err) {
      console.error('Failed to save PO status:', err);
    }
  };

  const poDocumentUrl = `http://localhost:3000${pipelineData?.po?.documentUrl}`;

  return (
    <>
      {pipelineData?.po?.confirmed ? (
        <div className="max-w-xl mx-auto mt-10  rounded-lg p-6 ">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">PO Status Confirmed</h2>

          {poDocumentUrl ? (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Existing PO Document:</p>
              <a
                href={poDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Download PO Document
              </a>
            </div>
          ) : (
            <p className="text-sm text-red-500 mb-6">No PO document uploaded yet.</p>
          )}

          <div className="mb-6">
            <label className="block text-xs text-gray-700 font-medium mb-2">
              Change/Upload PO Document:
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-xl mx-auto mt-10 bg-white shadow-lg rounded-lg p-6 border">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">PO Received</h2>

          <div className="flex text-xs items-center space-x-3 mb-4">
            <input
              id="poCheckbox"
              type="checkbox"
              checked={poReceived}
              onChange={() => setPoReceived(!poReceived)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="poCheckbox" className="text-gray-700 text-sm">
              Yes?
            </label>
          </div>

          {poReceived && (
            <>
              <div className="mb-6">
                <label className="block text-xs text-gray-700 font-medium mb-2">
                  Upload PO Document:
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Save
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}