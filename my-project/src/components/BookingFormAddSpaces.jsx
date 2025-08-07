import React, { useState } from 'react';

export default function InventorySelector({
  campaignIndex,
  campaign,
  spaces,
  globalAvailability,
  startDate,
  endDate,
  onToggleSpaceSelection,
  onUpdateSelectedUnits,
  onSearchChange
}) {
  const [selectedSpace, setSelectedSpace] = useState(null); // State to manage selected space for the modal

  const parseDDMMYY = (str) => {
    // Return early if the string is invalid to prevent errors
    if (!str || typeof str !== 'string') return null;
    const parts = str.split("-");
    if (parts.length !== 3) return null;

    const [dd, mm, yy] = parts;
    const fullYear = yy.length === 2 ? `20${yy}` : yy;
    // Create a new date object. Note: Month is 0-indexed in JavaScript's Date object.
    const date = new Date(fullYear, mm - 1, dd);
    // Basic validation to check if the constructed date is valid
    if (isNaN(date.getTime())) return null;
    return date;
  };


  const isSpaceAvailableInRange = (space) => {
    try {
      if (!startDate || !endDate) return false;
      const spaceStart = parseDDMMYY(space.availableFrom);
      const spaceEnd = parseDDMMYY(space.availableTo);

      // If date parsing fails, treat as unavailable
      if (!spaceStart || !spaceEnd) return false;

      const selectedStart = new Date(startDate);
      const selectedEnd = new Date(endDate);

      return selectedStart >= spaceStart && selectedEnd <= spaceEnd;
    } catch (err) {
      console.error("Error checking availability range:", err);
      return false;
    }
  };

  const filteredSpaces = (spaces || []).filter(space => {
    // Initial basic filtering
    if (!isSpaceAvailableInRange(space)) return false;
    if (space.overlappingBooking && space.status === 'Completely booked') return false;
    if ((space.status === 'Completely available' || space.status === 'Partialy available') && space.traded) return false;

    // Search query filtering
    if (campaign.searchQuery?.trim()) {
      const query = campaign.searchQuery.toLowerCase();
      // Check against multiple fields, ensuring they exist before calling toLowerCase
      return (
        (space.name || '').toLowerCase().includes(query) ||
        (space.city || '').toLowerCase().includes(query) ||
        (space.category || '').toLowerCase().includes(query) ||
        (space.specification || '').toLowerCase().includes(query) ||
        (space.facia || '').toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Function to handle space click for modal
  const handleSpaceClick = (space) => {
    setSelectedSpace(space);
  };

  // Close the modal
  const closeModal = () => {
    setSelectedSpace(null);
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium">
          Selected Places: {campaign.selectedSpaces?.length || 0}
        </div>
        <div className="w-full max-w-xs sm:max-w-sm md:w-1/3">
          <input
            type="text"
            placeholder="Search by space name, city, etc."
            className="w-full border px-3 py-1 rounded text-sm"
            value={campaign.searchQuery || ''}
            onChange={(e) => onSearchChange(campaignIndex, e.target.value)}
          />
        </div>
      </div>

      {/* This div enables horizontal scrolling on smaller screens */}
      <div className="overflow-x-auto border rounded">
        {/* The whitespace-nowrap class is the key change to prevent columns from collapsing */}
        <table className="min-w-full text-xs whitespace-nowrap">
          <thead className="bg-gray-100">
            <tr className="text-center">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Space Name</th>
              <th className="px-3 py-2">Space Type</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">TFT</th>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">Specification</th>
              <th className="px-3 py-2">Ownership</th>
              <th className="px-3 py-2">Occupied</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Select Units</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSpaces.map(space => {
              const globallySelectedUnits = globalAvailability[space.id] || 0;
              const currentCampaignUnits = campaign.selectedSpaces?.find(s => s.id === space.id)?.selectedUnits || 0;
              const remainingUnits = space.unit - (space.occupiedUnits || 0) - globallySelectedUnits + currentCampaignUnits;
              const updatedOccupiedUnits = (space.occupiedUnits || 0) + globallySelectedUnits - currentCampaignUnits;

              const updatedStatus =
                updatedOccupiedUnits >= space.unit
                  ? 'Completely booked'
                  : updatedOccupiedUnits === 0
                  ? 'Completely available'
                  : 'Partialy available';

              const canSelectUnits = remainingUnits > 0;
              const isDOOH = space.spaceType === 'DOOH';

              return (
                <tr key={space.id} className="text-center hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      className="cursor-pointer"
                      checked={campaign.selectedSpaces?.some(s => s.id === space.id)}
                      onChange={() => onToggleSpaceSelection(campaignIndex, space.id)}
                    />
                  </td>
                  <td
                    className="px-3 py-2 font-medium text-blue-600 hover:underline cursor-pointer"
                    onClick={() => handleSpaceClick(space)}
                  >
                    {space.name}
                  </td>
                  <td className="px-3 py-2">{space.spaceType}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      updatedStatus === "Completely available" ? "bg-green-100 text-green-700" :
                      updatedStatus === "Partialy available" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {updatedStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2">{space.facia}</td>
                  <td className="px-3 py-2">{space.city}</td>
                  <td className="px-3 py-2">{space.specification}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {space.ownershipType}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {!isDOOH ? (
                      <span className="text-gray-400 italic">N/A</span>
                    ) : (
                      updatedOccupiedUnits
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {!isDOOH ? (
                      <span className="text-gray-400 italic">N/A</span>
                    ) : (
                      space.unit
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {!isDOOH || updatedStatus === "Completely booked" || !canSelectUnits ? (
                      <span className="text-gray-400 italic">N/A</span>
                    ) : (
                      <input
                        type="number"
                        min={1}
                        max={remainingUnits}
                        value={currentCampaignUnits || 1}
                        onChange={(e) => onUpdateSelectedUnits(campaignIndex, space.id, parseInt(e.target.value))}
                        className="w-16 border rounded px-1 text-center"
                        disabled={!campaign.selectedSpaces?.some(s => s.id === space.id)}
                        onClick={(e) => e.stopPropagation()} // Prevent row click event when interacting with input
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Custom Modal to show the main photo */}
      {selectedSpace && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">{selectedSpace.name}</h2>
                <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            {selectedSpace.mainPhoto ? (
                <img src={selectedSpace.mainPhoto} alt={selectedSpace.name} className="modal-image" />
            ) : (
                <p className="text-gray-500">No image available.</p>
            )}
          </div>
        </div>
      )}

      {/* Modal Styling */}
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          width: auto;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          line-height: 1;
          color: #333;
          cursor: pointer;
        }

        .modal-image {
          width: 100%;
          height: auto;
          max-width: 80vw;
          max-height: 70vh;
          object-fit: contain; /* Ensures image aspect ratio is maintained */
          margin-top: 10px;
        }

        h2 {
          font-size: 1.5rem;
          margin: 0;
        }
      `}</style>
    </div>
  );
}