import React, { useState, useMemo } from 'react';

export default function InventorySelector({
  campaignIndex,
  campaign,
  spaces,
  globalAvailability,
  startDate,
  endDate,
  onToggleSpaceSelection,
  onUpdateSelectedUnits,
  onSearchChange,
  onFilterChange // It's good practice to handle this from a parent component
}) {
  const [selectedSpace, setSelectedSpace] = useState(null);
  
  // State for the new filters
  const [statusFilter, setStatusFilter] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState('');
  const [spaceTypeFilter, setSpaceTypeFilter] = useState('');

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
      
      const withinRange = selectedStart >= spaceStart && selectedEnd <= spaceEnd;
      
      const hasIntersection = Array.isArray(space.campaignDates) &&
        space.campaignDates.some(camp => {
          const campStart = new Date(camp.startDate);
          const campEnd = new Date(camp.endDate);
          return doesDateRangeIntersect(selectedStart, selectedEnd, campStart, campEnd);
        });

      // This logic mutates the space object. Be mindful if this is not desired.
      if (withinRange && !hasIntersection && space.spaceType !== "DOOH") {
        space.status = "Completely available";
      } else if (withinRange && hasIntersection && space.spaceType !== "DOOH") {
        space.status = "Completely booked";
      } else if (space.spaceType === "DOOH" && withinRange && !hasIntersection) {
        const occupied = space.occupiedUnits || 0;
        space.status = occupied === 0 ? "Completely available" : "Partially available";
      }

      return withinRange;
    } catch (err) {
      console.error("Error checking availability range:", err);
      return false;
    }
  };
  
  const filteredSpaces = useMemo(() => {
    // A temporary array to hold spaces with their calculated status
    const spacesWithStatus = (spaces || []).map(space => {
        // Clone the space to avoid direct mutation of the prop
        const newSpace = { ...space };
        isSpaceAvailableInRange(newSpace); // This will add the 'status' property
        return newSpace;
    }).filter(space => isSpaceAvailableInRange(space)); // Initial filter by date range

    return spacesWithStatus.filter(space => {
      // Apply new filters
      if (statusFilter && space.status !== statusFilter) return false;
      if (ownershipFilter && space.ownershipType !== ownershipFilter) return false;
      if (spaceTypeFilter && space.spaceType !== spaceTypeFilter) return false;

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
  }, [spaces, startDate, endDate, statusFilter, ownershipFilter, spaceTypeFilter, campaign.searchQuery]);


  const selectedSpaceIds = campaign.selectedSpaces?.map(s => s.id) || [];
  const selectedTableSpaces = filteredSpaces.filter(space => selectedSpaceIds.includes(space.id));
  const unselectedTableSpaces = filteredSpaces.filter(space => !selectedSpaceIds.includes(space.id));
  
  // Create unique options for dropdowns dynamically
  const uniqueStatuses = useMemo(() => {
     const allSpacesWithStatus = (spaces || []).map(space => {
        const newSpace = { ...space };
        isSpaceAvailableInRange(newSpace);
        return newSpace;
     });
     return [...new Set(allSpacesWithStatus.map(s => s.status).filter(Boolean))]
  }, [spaces, startDate, endDate]);

  const uniqueOwnerships = useMemo(() => [...new Set(spaces.map(s => s.ownershipType).filter(Boolean))], [spaces]);
  
  const spaceTypeOptions = useMemo(() => {
    const types = new Set(spaces.map(s => s.spaceType).filter(Boolean));
    types.add("Gantry");
    return [...types];
  }, [spaces]);


  const handleSpaceClick = (space) => setSelectedSpace(space);
  const closeModal = () => setSelectedSpace(null);

  const renderTableRow = (space, isSelectedRow) => {
    const globallySelectedUnits = globalAvailability[space.id] || 0;
    const currentCampaignUnits = campaign.selectedSpaces?.find(s => s.id === space.id)?.selectedUnits || 0;
    const remainingUnits = space.unit - (space.occupiedUnits || 0) - globallySelectedUnits + currentCampaignUnits;
    const updatedOccupiedUnits = (space.occupiedUnits || 0) + globallySelectedUnits - currentCampaignUnits;

    const isActuallyBooked = updatedOccupiedUnits >= space.unit;
    const canSelectUnits = remainingUnits > 0;
    const isDOOH = space.spaceType === 'DOOH';

    const rowClass = isSelectedRow ? "text-center hover:bg-gray-50 bg-blue-50" : "text-center hover:bg-gray-50";

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
            space.status === "Partially available" ? "bg-yellow-100 text-yellow-700" :
            "bg-red-100 text-red-700"
          }`}>
            {space.status}
          </span>
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
          {!isDOOH ? <span className="text-gray-400 italic">N/A</span> : updatedOccupiedUnits}
        </td>
        <td className="px-3 py-2">
          {!isDOOH ? <span className="text-gray-400 italic">N/A</span> : space.unit}
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
        <div className="flex items-center space-x-2">
          {/* Status Filter - Now Fully Dynamic */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border px-3 py-1 rounded text-sm">
            <option value="">All Statuses</option>
            {uniqueStatuses.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          
          {/* Ownership Filter */}
          <select value={ownershipFilter} onChange={e => setOwnershipFilter(e.target.value)} className="border px-3 py-1 rounded text-sm">
            <option value="">All Ownerships</option>
            {uniqueOwnerships.map(type => <option key={type} value={type}>{type}</option>)}
          </select>

          {/* SpaceType Filter - Includes Gantry */}
          <select value={spaceTypeFilter} onChange={e => setSpaceTypeFilter(e.target.value)} className="border px-3 py-1 rounded text-sm">
            <option value="">All Space Types</option>
            {spaceTypeOptions.map(type => <option key={type} value={type}>{type}</option>)}
          </select>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search..."
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
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex; justify-content: center; align-items: center;
          z-index: 1000; padding: 1rem;
        }
        .modal-content {
          background-color: white; padding: 20px; border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          width: auto; max-width: 90vw; max-height: 90vh; overflow-y: auto;
        }
        .modal-close {
          background: none; border: none; font-size: 24px;
          line-height: 1; color: #333; cursor: pointer;
        }
        .modal-image {
          width: 100%; height: auto; max-width: 80vw;
          max-height: 70vh; object-fit: contain; margin-top: 10px;
        }
        h2 { font-size: 1.5rem; margin: 0; }
      `}</style>
    </div>
  );
}