
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { PipelineContext } from '../../context/PipelineContext';

export default function ArtworkForm({ campaignId, onConfirm }) {
  const [artworkReceived, setArtworkReceived] = useState(false);
  const [artworkFile, setArtworkFile] = useState(null);
  const [isArtworkSaved, setIsArtworkSaved] = useState(false);
  const [artworkUrl, setArtworkUrl] = useState('');
  const { pipelineData, setPipelineData } = useContext(PipelineContext);

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/pipeline/campaign/${campaignId}`);
        const artwork = res.data?.artwork || {};
        if (artwork.confirmed && artwork.documentUrl) {
          setIsArtworkSaved(true);
          setArtworkUrl(`${artwork.documentUrl}`);
        }
      } catch (err) {
        console.error('Failed to fetch artwork data:', err);
      }
    };

    fetchArtwork();
  }, [campaignId]);

  const handleFileChange = (e) => {
    setArtworkFile(e.target.files[0]);
  };
const handleDownload = async () => {
  const response = await fetch(artworkUrl);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = artworkUrl.split('/').pop(); // get filename from URL
  a.click();
  window.URL.revokeObjectURL(url);
};

  const handleSave = async () => {
    try {
      if (artworkReceived && artworkFile) {
        const formData = new FormData();
        formData.append('file', artworkFile);

        // ✅ Upload artwork document on campaign pipeline
        await axios.post(`http://localhost:3000/api/pipeline/campaign/${campaignId}/artwork/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // ✅ Confirm artwork on campaign pipeline
        const res = await axios.put(`http://localhost:3000/api/pipeline/campaign/${campaignId}/artwork`, {
          confirmed: true
        });

        setPipelineData(res.data);
        setIsArtworkSaved(true);
        setArtworkUrl(res.data.artwork?.documentUrl ? `http://localhost:3000${res.data.artwork.documentUrl}` : '');

        onConfirm();
      } else {
        alert('Please upload artwork if received.');
      }
    } catch (err) {
      console.error('Error saving artwork:', err);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10  rounded-lg p-6 ">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Artwork Received</h2>

      {isArtworkSaved ? (
        <div className="space-y-4">
          <p className="text-sm text-green-700 font-semibold">✅ Artwork received and saved.</p>
          {artworkUrl && (
            <div className="flex gap-4 items-center">
              <a
                href={artworkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline text-sm"
              >
                View Artwork
              </a>
           
              <button
      onClick={handleDownload}
      className="text-sm text-green-700 underline hover:text-green-800"
    >
      ⬇ Download
    </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex text-xs items-center space-x-3 mb-4">
            <input
              id="artworkCheckbox"
              type="checkbox"
              checked={artworkReceived}
              onChange={() => setArtworkReceived(!artworkReceived)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="artworkCheckbox" className="text-gray-700 text-sm">
              Yes?
            </label>
          </div>

          {artworkReceived && (
            <div className="mb-6">
              <label className="block text-xs text-gray-700 font-medium mb-2">
                Upload artwork Document:
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>
          )}

          {artworkReceived && (
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Save
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
