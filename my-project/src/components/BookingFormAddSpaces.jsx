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
  const [selectedSpace, setSelectedSpace] = useState(null);

  const parseDDMMYY = (str) => {
    if (!str || typeof str !== 'string') return null;
    const parts = str.split("-");
    if (parts.length !== 3) return null;

    const [dd, mm, yy] = parts;
    const fullYear = yy.length === 2 ? `20${yy}` : yy;
    const date = new Date(fullYear, mm - 1, dd);
    if (isNaN(date.getTime())) return null;
    return date;
  };

  const doesDateRangeIntersect = (rangeStart, rangeEnd, targetStart, targetEnd) => {
  return rangeStart <= targetEnd && rangeEnd >= targetStart;
};

const isSpaceAvailableInRange = (space) => {
  try {
    if (!startDate || !endDate) return false;

    const spaceStart = parseDDMMYY(space.availableFrom);
    const spaceEnd = parseDDMMYY(space.availableTo);
    if (!spaceStart || !spaceEnd) return false;

    const selectedStart = new Date(startDate);
    const selectedEnd = new Date(endDate);

    // ✅ Check if selected range is within available range
    const withinRange = selectedStart >= spaceStart && selectedEnd <= spaceEnd;
console.log("Checking space:", space.name, "within range:", withinRange);
    // ✅ Check if selected range intersects with any campaign date
    const hasIntersection = Array.isArray(space.campaignDates) &&
      space.campaignDates.some(camp => {
        const campStart = new Date(camp.startDate);
        const campEnd = new Date(camp.endDate);
        console.log("Campaign dates for space:", space.name, "are from", campStart, "to", campEnd);
        return doesDateRangeIntersect(selectedStart, selectedEnd, campStart, campEnd);
      });
console.log("Space:", space.name, "has intersection with campaign dates:", hasIntersection);
    // ✅ Update status according to your rules
    if (withinRange && !hasIntersection && space.spaceType !== "DOOH") {
      space.status = "Completely available";
    }
    else if (withinRange && hasIntersection && space.spaceType !== "DOOH") {
      space.status = "Completely booked";
    }
    else if (space.spaceType === "DOOH" && withinRange && !hasIntersection) {
      const occupied = space.occupiedUnits || 0;
      space.status = occupied === 0 ? "Completely available" : "Partially available";
    }

    return withinRange;
  } catch (err) {
    console.error("Error checking availability range:", err);
    return false;
  }
};


const isDateOverlap = (start1, end1, start2, end2) => {
  return start1 <= end2 && end1 >= start2; // overlap condition
};
const getInventoryStatus = (space) => {
  if (!startDate || !endDate) return "Unknown";

  const spaceStart = parseDDMMYY(space.availableFrom);
  const spaceEnd = parseDDMMYY(space.availableTo);
  const selectedStart = new Date(startDate);
  const selectedEnd = new Date(endDate);

  // Check if selected dates lie within available range
  const withinAvailability = selectedStart >= spaceStart && selectedEnd <= spaceEnd;
  if (!withinAvailability) return "Unknown";

  // Check if selected range overlaps with any campaign date
  const hasOverlap = space.campaignDates?.some(cd => {
    const campStart = new Date(cd.startDate);
    const campEnd = new Date(cd.endDate);
    return isDateOverlap(selectedStart, selectedEnd, campStart, campEnd);
  });

  if (hasOverlap) {
    return "Completely booked";
  } else {
    return space.occupiedUnits === 0 ? "Completely available" : "Partialy available";
  }
};




  // const filteredSpaces = (updatedSpaces || []).filter(space => {
  //   if (!isSpaceAvailableInRange(space)) return false;
  //   if (space.overlappingBooking ) return false;


  //   if (campaign.searchQuery?.trim()) {
  //     const query = campaign.searchQuery.toLowerCase();
  //     return (
  //       (space.name || '').toLowerCase().includes(query) ||
  //       (space.city || '').toLowerCase().includes(query) ||
  //       (space.category || '').toLowerCase().includes(query) ||
  //       (space.specification || '').toLowerCase().includes(query) ||
  //       (space.facia || '').toLowerCase().includes(query)
  //     );
  //   }
  //   return true;
  // });
  const filteredSpaces = (spaces || []).filter(space => {
  if (!isSpaceAvailableInRange(space)) return false;
  // if (space.overlappingBooking) return false;
 console.log("Checking space:", space.name, "with status:", space.status);
  if (campaign.searchQuery?.trim()) {
    const query = campaign.searchQuery.toLowerCase();
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


  const selectedSpaceIds = campaign.selectedSpaces?.map(s => s.id) || [];
  const selectedTableSpaces = filteredSpaces.filter(space => selectedSpaceIds.includes(space.id));
  const unselectedTableSpaces = filteredSpaces.filter(space => !selectedSpaceIds.includes(space.id));

  const handleSpaceClick = (space) => {
    setSelectedSpace(space);
  };

  const closeModal = () => {
    setSelectedSpace(null);
  };

  const renderTableRow = (space, isSelectedRow) => {
    const globallySelectedUnits = globalAvailability[space.id] || 0;
    const currentCampaignUnits = campaign.selectedSpaces?.find(s => s.id === space.id)?.selectedUnits || 0;
    const remainingUnits = space.unit - (space.occupiedUnits || 0) - globallySelectedUnits + currentCampaignUnits;
    const updatedOccupiedUnits = (space.occupiedUnits || 0) + globallySelectedUnits - currentCampaignUnits;

    const isActuallyBooked = updatedOccupiedUnits >= space.unit;
    const canSelectUnits = remainingUnits > 0;
    const isDOOH = space.spaceType === 'DOOH';

    const rowClass = isSelectedRow
      ? "text-center hover:bg-gray-50 bg-blue-50"
      : "text-center hover:bg-gray-50";

    return (
      <tr key={space.id} className={rowClass}>
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
            space.status === "Completely available" ? "bg-green-100 text-green-700" :
            space.status === "Partialy available" ? "bg-yellow-100 text-yellow-700" :
            "bg-red-100 text-red-700"
          }`}>
            {space.status}
          </span>
          {/* {(() => {
  const status = getInventoryStatus(space);
  console.log("Inventory status for space:", space.name, "is", status);
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      status === "Completely available" ? "bg-green-100 text-green-700" :
      status === "Partialy available" ? "bg-yellow-100 text-yellow-700" :
      status === "Completely booked" ? "bg-red-100 text-red-700" :
      "bg-gray-100 text-gray-700"
    }`}>
      {status}
    </span>
  );
})()} */}

        </td>
        <td className="px-3 py-2">{space.facia}</td>
        <td className="px-3 py-2">{space.city}</td>
        <td className="px-3 py-2">{space.width || 'N/A'}</td>
        <td className="px-3 py-2">{space.height || 'N/A'}</td>
        <td className="px-3 py-2">
          {(space.width && space.height) ? (space.width * space.height) : 'N/A'}
        </td>
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
          {!isDOOH || isActuallyBooked || !canSelectUnits ? (
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
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </td>
      </tr>
    );
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

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-xs whitespace-nowrap">
          <thead className="bg-gray-100">
            <tr className="text-center">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Space Name</th>
              <th className="px-3 py-2">Space Type</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">TFT</th>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">Width (in ft)</th>
              <th className="px-3 py-2">Height (in ft)</th>
              <th className="px-3 py-2">Size (in sq ft)</th>
              <th className="px-3 py-2">Specification</th>
              <th className="px-3 py-2">Ownership</th>
              <th className="px-3 py-2">Occupied</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Select Units</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {selectedTableSpaces.map(space => renderTableRow(space, true))}

            {selectedTableSpaces.length > 0 && unselectedTableSpaces.length > 0 && (
                <tr className="bg-gray-200 font-semibold">
                    <td colSpan="14" className="py-2 text-center text-gray-600">
                        Not Selected
                    </td>
                </tr>
            )}

            {unselectedTableSpaces.map(space => renderTableRow(space, false))}
          </tbody>
        </table>
      </div>

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
          object-fit: contain;
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