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
  onFilterChange
}) {
  const [selectedSpace, setSelectedSpace] = useState(null);
  
  // State for existing and new filters
  const [statusFilter, setStatusFilter] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState('');
  const [spaceTypeFilter, setSpaceTypeFilter] = useState('');
  const [transitTypeFilter, setTransitTypeFilter] = useState('');
  const [transitLineFilter, setTransitLineFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Helper functions
  const parseDDMMYY = (str) => {
    if (!str || typeof str !== 'string') return null;
    const parts = str.split("-");
    if (parts.length !== 3) return null;
    const [dd, mm, yy] = parts;
    const fullYear = yy.length === 2 ? `20${yy}` : yy;
    const date = new Date(fullYear, mm - 1, dd);
    return isNaN(date.getTime()) ? null : date;
  };

  const doesDateRangeIntersect = (rangeStart, rangeEnd, targetStart, targetEnd) => {
    return rangeStart <= targetEnd && rangeEnd >= targetStart;
  };

  // UPDATED: Enhanced date validation helper - now allows past dates
  const validateDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) {
      return { isValid: false, error: 'Both start and end dates are required' };
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { isValid: false, error: 'Invalid date format' };
    }
    
    // UPDATED: Only requirement: end date >= start date (ALLOWS PAST DATES)
    // Removed any restriction on past dates
    if (end < start) {
      return { isValid: false, error: 'End date must be on or after start date' };
    }
    
    return { isValid: true, error: null };
  };

  const isSpaceAvailableInRange = (space) => {
    try {
      if (!startDate || !endDate) {
        // If no dates selected, show all spaces with default status
        space.status = "Available";
        return true;
      }

      // Validate the date range first
      const validation = validateDateRange(startDate, endDate);
      if (!validation.isValid) {
        space.status = "Date range invalid";
        return false;
      }
      
      const spaceStart = parseDDMMYY(space.availableFrom);
      const spaceEnd = parseDDMMYY(space.availableTo);
      if (!spaceStart || !spaceEnd) {
        space.status = "Space dates unavailable";
        return false;
      }
      
      const selectedStart = new Date(startDate);
      const selectedEnd = new Date(endDate);
      const withinRange = selectedStart >= spaceStart && selectedEnd <= spaceEnd;
      
      const hasIntersection = Array.isArray(space.campaignDates) &&
        space.campaignDates.some(camp => {
          const campStart = new Date(camp.startDate);
          const campEnd = new Date(camp.endDate);
          return doesDateRangeIntersect(selectedStart, selectedEnd, campStart, campEnd);
        });
      
      if (withinRange && !hasIntersection && space.spaceType !== "DOOH") {
        space.status = "Completely available";
      } else if (withinRange && hasIntersection && space.spaceType !== "DOOH") {
        space.status = "Completely booked";
      } else if (space.spaceType === "DOOH" && withinRange) {
        const occupied = space.occupiedUnits || 0;
        space.status = occupied === 0 ? "Completely available" : occupied < space.unit ? "Partially available" : "Completely booked";
      } else if (!withinRange) {
        // UPDATED: More descriptive status for dates outside space availability
        if (selectedStart < spaceStart) {
          space.status = "Not available (too early)";
        } else if (selectedEnd > spaceEnd) {
          space.status = "Not available (too late)";
        } else {
          space.status = "Not available";
        }
      }
      
      return withinRange;
    } catch (err) {
      console.error("Error checking availability range:", err);
      space.status = "Error checking availability";
      return false;
    }
  };
  
  // UPDATED: Enhanced filtering logic with better past date support
  const filteredSpaces = useMemo(() => {
    // Only process spaces if both dates are selected and valid
    if (!startDate || !endDate) {
      return [];
    }

    // Validate date range
    const validation = validateDateRange(startDate, endDate);
    if (!validation.isValid) {
      console.warn("Invalid date range:", validation.error);
      return [];
    }

    const spacesWithStatus = (spaces || []).map(space => {
        const newSpace = { ...space };
        isSpaceAvailableInRange(newSpace);
        return newSpace;
    });

    // UPDATED: Show all spaces with their availability status, not just available ones
    // This allows users to see why certain spaces aren't available
    const allSpacesWithStatus = spacesWithStatus;

    return allSpacesWithStatus.filter(space => {
      // Apply other filters
      if (statusFilter && space.status !== statusFilter) return false;
      if (ownershipFilter && space.ownershipType !== ownershipFilter) return false;
      if (spaceTypeFilter && space.spaceType !== spaceTypeFilter) return false;
      if (spaceTypeFilter === 'Transit') {
        if (transitTypeFilter && space.transitType !== transitTypeFilter) return false;
        if (transitLineFilter && space.transitLine !== transitLineFilter) return false;
      }
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
  }, [spaces, startDate, endDate, statusFilter, ownershipFilter, spaceTypeFilter, transitTypeFilter, transitLineFilter, campaign.searchQuery]);

  const selectedSpaceIds = campaign.selectedSpaces?.map(s => s.id) || [];
  const selectedTableSpaces = filteredSpaces.filter(space => selectedSpaceIds.includes(space.id));
  const unselectedTableSpaces = filteredSpaces.filter(space => !selectedSpaceIds.includes(space.id));
  
  // Pagination logic
  const totalUnselectedSpaces = unselectedTableSpaces.length;
  const totalPages = Math.ceil(totalUnselectedSpaces / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUnselectedSpaces = unselectedTableSpaces.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, ownershipFilter, spaceTypeFilter, transitTypeFilter, transitLineFilter, campaign.searchQuery]);

  // Define static data structure for Transit options.
  const transitOptionsData = [
    {
      value: "Normal Local",
      lines: ["Central Line", "Western Line", "Harbour line"],
    },
    {
      value: "AC Local",
      lines: ["Central Line", "Western Line", "Harbour line"],
    },
  ];

  const uniqueStatuses = useMemo(() => {
     const allSpacesWithStatus = (spaces || []).map(space => {
        const newSpace = { ...space };
        isSpaceAvailableInRange(newSpace);
        return newSpace;
     });
     return [...new Set(allSpacesWithStatus.map(s => s.status).filter(Boolean))]
  }, [spaces, startDate, endDate]);

  const uniqueOwnerships = useMemo(() => [...new Set(spaces.map(s => s.ownershipType).filter(Boolean))], [spaces]);
  const spaceTypeOptions = useMemo(() => [...new Set(spaces.map(s => s.spaceType).filter(Boolean))], [spaces]);
  
  // Derive the Transit Type options from the static data.
  const uniqueTransitTypes = useMemo(() => {
    return transitOptionsData.map(opt => opt.value);
  }, []);

  // Derive the Transit Line options based on the selected type from the static data.
  const uniqueTransitLines = useMemo(() => {
    if (!transitTypeFilter) return [];
    const selectedType = transitOptionsData.find(opt => opt.value === transitTypeFilter);
    return selectedType ? selectedType.lines : [];
  }, [transitTypeFilter]);

  // Check if current date range is valid
  const isDateRangeValid = useMemo(() => {
    if (!startDate || !endDate) return false;
    return validateDateRange(startDate, endDate).isValid;
  }, [startDate, endDate]);

  // UPDATED: Get date range validation message - now more user-friendly for past dates
  const getDateValidationMessage = () => {
    if (!startDate && !endDate) {
      return "Select both start and end dates to view available spaces";
    }
    if (!startDate) {
      return "Please select a start date";
    }
    if (!endDate) {
      return "Please select an end date";
    }
    const validation = validateDateRange(startDate, endDate);
    if (!validation.isValid) {
      return validation.error;
    }
    return null;
  };

  // Calculate date range duration
  const getDateRangeDuration = () => {
    if (!isDateRangeValid) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // UPDATED: Add helper to check if dates are in the past
  const isDateRangeInPast = () => {
    if (!isDateRangeValid) return false;
    const today = new Date();
    const endDateObj = new Date(endDate);
    return endDateObj < today;
  };

  // Event handlers
  const handleSpaceTypeFilterChange = (e) => {
    const newType = e.target.value;
    setSpaceTypeFilter(newType);
    if (newType !== 'Transit') {
        setTransitTypeFilter('');
        setTransitLineFilter('');
    }
  };

  const handleTransitTypeFilterChange = (e) => {
    const newTransitType = e.target.value;
    setTransitTypeFilter(newTransitType);
    setTransitLineFilter('');
  };

  const handleSpaceClick = (space) => setSelectedSpace(space);
  const closeModal = () => setSelectedSpace(null);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const renderTableRow = (space, isSelectedRow) => {
    const globallySelectedUnits = globalAvailability[space.id] || 0;
    const currentCampaignUnits = campaign.selectedSpaces?.find(s => s.id === space.id)?.selectedUnits || 0;
    const remainingUnits = space.unit - (space.occupiedUnits || 0) - globallySelectedUnits + currentCampaignUnits;
    const updatedOccupiedUnits = (space.occupiedUnits || 0) + globallySelectedUnits - currentCampaignUnits;
    const isActuallyBooked = updatedOccupiedUnits >= space.unit;
    const canSelectUnits = remainingUnits > 0;
    const isDOOH = space.spaceType === 'DOOH';
    const isSelected = campaign.selectedSpaces?.some(s => s.id === space.id);
    const isAvailable = space.status?.includes("available") || space.status === "Available";
    const rowClass = isSelectedRow 
      ? "text-center hover:bg-blue-100 bg-blue-50 transition-colors duration-200" 
      : "text-center hover:bg-gray-50 transition-colors duration-200";

    return (
      <tr key={space.id} className={rowClass}>
        <td className="px-3 py-2">
          <div className="flex items-center justify-center">
            <input 
              type="checkbox" 
              className="cursor-pointer w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors" 
              checked={isSelected} 
              onChange={() => onToggleSpaceSelection(campaignIndex, space.id)}
              disabled={!isAvailable}
            />
            {isSelected && (
              <button
                onClick={() => onToggleSpaceSelection(campaignIndex, space.id)}
                className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors duration-200"
                title="Remove from selection"
              >
                DISCARD
              </button>
            )}
          </div>
        </td>
        <td className="px-3 py-2 font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors" onClick={() => handleSpaceClick(space)}>
          {space.name}
        </td>
        <td className="px-3 py-2">{space.spaceType}</td>
        {spaceTypeFilter === 'Transit' && (
          <>
            <td className="px-3 py-2">{space.transitType || 'N/A'}</td>
            <td className="px-3 py-2">{space.transitLine || 'N/A'}</td>
          </>
        )}
        <td className="px-3 py-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
            space.status === "Completely available" || space.status === "Available" 
              ? "bg-green-100 text-green-700" 
              : space.status === "Partially available" 
                ? "bg-yellow-100 text-yellow-700" 
                : space.status === "Date range invalid"
                  ? "bg-red-100 text-red-700"
                  : space.status?.includes("Not available")
                    ? "bg-gray-100 text-gray-700"
                    : "bg-red-100 text-red-700"
          }`}>
            {space.status}
          </span>
        </td>
        <td className="px-3 py-2">{space.facia}</td>
        <td className="px-3 py-2">{space.city}</td>
        <td className="px-3 py-2">{space.width || 'N/A'}</td>
        <td className="px-3 py-2">{space.height || 'N/A'}</td>
        <td className="px-3 py-2">{(space.width && space.height) ? (space.width * space.height) : 'N/A'}</td>
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
          {!isDOOH || isActuallyBooked || !canSelectUnits || !isAvailable ? (
            <span className="text-gray-400 italic">N/A</span>
          ) : (
            <input 
              type="number" 
              min={1} 
              max={remainingUnits} 
              value={currentCampaignUnits || 1} 
              onChange={(e) => onUpdateSelectedUnits(campaignIndex, space.id, parseInt(e.target.value))} 
              className="w-16 border rounded px-1 text-center hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
              disabled={!isSelected} 
              onClick={(e) => e.stopPropagation()} 
            />
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-medium text-gray-700">
          Selected Places: <span className="text-blue-600 font-semibold">{campaign.selectedSpaces?.length || 0}</span>
          {!isDateRangeValid ? (
            <span className="ml-3 text-orange-600 text-xs">
              ({getDateValidationMessage()})
            </span>
          ) : (
            <span className="ml-3 text-green-600 text-xs">
              (Campaign duration: {getDateRangeDuration()} days{isDateRangeInPast() ? ' - Historical Campaign' : ''})
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)} 
            className="border px-3 py-1 rounded text-sm hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            disabled={!isDateRangeValid}
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          
          <select 
            value={ownershipFilter} 
            onChange={e => setOwnershipFilter(e.target.value)} 
            className="border px-3 py-1 rounded text-sm hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            disabled={!isDateRangeValid}
          >
            <option value="">All Ownerships</option>
            {uniqueOwnerships.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          
          <select 
            value={spaceTypeFilter} 
            onChange={handleSpaceTypeFilterChange} 
            className="border px-3 py-1 rounded text-sm hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            disabled={!isDateRangeValid}
          >
            <option value="">All Space Types</option>
            {spaceTypeOptions.map(type => <option key={type} value={type}>{type}</option>)}
          </select>

          {spaceTypeFilter === 'Transit' && (
            <>
              <select 
                value={transitTypeFilter} 
                onChange={handleTransitTypeFilterChange} 
                className="border px-3 py-1 rounded text-sm hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                disabled={!isDateRangeValid}
              >
                <option value="">All Transit Types</option>
                {uniqueTransitTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              {transitTypeFilter && (
                <select 
                  value={transitLineFilter} 
                  onChange={e => setTransitLineFilter(e.target.value)} 
                  className="border px-3 py-1 rounded text-sm hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  disabled={!isDateRangeValid}
                >
                  <option value="">All Lines</option>
                  {uniqueTransitLines.map(line => <option key={line} value={line}>{line}</option>)}
                </select>
              )}
            </>
          )}
          
          <input
            type="text"
            placeholder="Search spaces..."
            className="w-64 border px-3 py-1 rounded text-sm hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            value={campaign.searchQuery || ''}
            onChange={(e) => onSearchChange(campaignIndex, e.target.value)}
            disabled={!isDateRangeValid}
          />
        </div>
      </div>

      {/* Show table only when both dates are selected and valid */}
      {isDateRangeValid ? (
        <>
          {/* UPDATED: Show notification for historical campaigns */}
          {isDateRangeInPast() && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-blue-600 mr-2">ℹ️</div>
                <div className="text-sm text-blue-800">
                  <strong>Historical Campaign:</strong> You're viewing availability for past dates. 
                  Some spaces may show as "Not available" if they weren't active during this period.
                </div>
              </div>
            </div>
          )}

          {/* Pagination controls and items per page */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select 
                value={itemsPerPage} 
                onChange={handleItemsPerPageChange}
                className="border px-2 py-1 rounded text-sm hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">
                Showing {Math.min(startIndex + 1, totalUnselectedSpaces)}-{Math.min(endIndex, totalUnselectedSpaces)} of {totalUnselectedSpaces} spaces
              </span>
            </div>
            
            {/* Simple pagination like in image 2 */}
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Page</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      handlePageChange(page);
                    }
                  }}
                  className="w-16 border px-2 py-1 rounded text-sm text-center hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <span className="text-sm text-gray-600">of {totalPages}</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[60vh] border rounded shadow-sm">
            <table className="min-w-full text-xs whitespace-nowrap">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr className="text-center">
                  <th className="px-3 py-2 font-semibold">Selection</th>
                  <th className="px-3 py-2 font-semibold">Space Name</th>
                  <th className="px-3 py-2 font-semibold">Space Type</th>
                  {spaceTypeFilter === 'Transit' && (
                    <>
                      <th className="px-3 py-2 font-semibold">Transit Type</th>
                      <th className="px-3 py-2 font-semibold">Transit Line</th>
                    </>
                  )}
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">TFT</th>
                  <th className="px-3 py-2 font-semibold">City</th>
                  <th className="px-3 py-2 font-semibold">Width (ft)</th>
                  <th className="px-3 py-2 font-semibold">Height (ft)</th>
                  <th className="px-3 py-2 font-semibold">Size (sq ft)</th>
                  <th className="px-3 py-2 font-semibold">Specification</th>
                  <th className="px-3 py-2 font-semibold">Ownership</th>
                  <th className="px-3 py-2 font-semibold">Occupied</th>
                  <th className="px-3 py-2 font-semibold">Total</th>
                  <th className="px-3 py-2 font-semibold">Select Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Selected spaces section */}
                {selectedTableSpaces.map(space => renderTableRow(space, true))}
                
                {/* Separator if both selected and unselected spaces exist */}
                {selectedTableSpaces.length > 0 && paginatedUnselectedSpaces.length > 0 && (
                  <tr className="bg-gray-200 font-semibold sticky top-[40px] z-10">
                    <td colSpan={spaceTypeFilter === 'Transit' ? 16 : 14} className="py-2 text-center text-gray-600">
                      Available Spaces (Page {currentPage} of {totalPages})
                    </td>
                  </tr>
                )}
                
                {/* Unselected spaces section (paginated) */}
                {paginatedUnselectedSpaces.map(space => renderTableRow(space, false))}
                
                {/* Empty state */}
                {filteredSpaces.length === 0 && (
                  <tr>
                    <td colSpan={spaceTypeFilter === 'Transit' ? 16 : 14} className="py-8 text-center text-gray-500">
                      No spaces found matching your criteria for the selected date range
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom pagination for unselected spaces */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Page</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      handlePageChange(page);
                    }
                  }}
                  className="w-16 border px-2 py-1 rounded text-sm text-center hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <span className="text-sm text-gray-600">of {totalPages}</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">📅 Select campaign dates to view available spaces</p>
          <p className="text-sm">{getDateValidationMessage()}</p>
          {startDate && endDate && !isDateRangeValid && (
            <p className="text-xs text-red-500 mt-2">
              ⚠️ Please ensure end date is on or after start date
            </p>
          )}
        </div>
      )}

      {/* Modal for space details */}
      {selectedSpace && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{selectedSpace.name}</h2>
              <button className="modal-close hover:bg-gray-100 transition-colors" onClick={closeModal}>×</button>
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
          padding: 4px 8px;
          border-radius: 4px;
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