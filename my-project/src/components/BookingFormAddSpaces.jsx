
// import React from 'react';

// export default function InventorySelector({
//   campaignIndex,
//   campaign,
//   spaces,
//   globalAvailability,
//   startDate,
//   endDate,
//   onToggleSpaceSelection,
//   onUpdateSelectedUnits,
//   onSearchChange
// }) {
//   const parseDDMMYY = (str) => {
//     const [dd, mm, yy] = str.split("-");
//     const fullYear = yy.length === 2 ? `20${yy}` : yy;
//     return new Date(`${fullYear}-${mm}-${dd}`);
//   };

//   const isSpaceAvailableInRange = (space) => {
//     if (!startDate || !endDate) return false;
//     if (!space.availableFrom || !space.availableTo) return false;

//     const selectedStart = new Date(startDate);
//     const selectedEnd = new Date(endDate);

//     const spaceStart = parseDDMMYY(space.availableFrom);
//     const spaceEnd = parseDDMMYY(space.availableTo);

//     return spaceStart <= selectedEnd && spaceEnd >= selectedStart;
//   };

//   const filteredSpaces = spaces.filter(space => {
//     if (!isSpaceAvailableInRange(space)) return false;
//     if (space.overlappingBooking && space.status === 'Completely booked') return false;
//     if ((space.status === 'Completely available' || space.status === 'Partialy available') && space.traded) return false;

//     if (campaign.searchQuery?.trim()) {
//       const query = campaign.searchQuery.toLowerCase();
//       return (
//         space.name.toLowerCase().includes(query) ||
//         space.city.toLowerCase().includes(query) ||
//         space.category.toLowerCase().includes(query)
//       );
//     }
//     return true;
//   });

//   return (
//     <div className="mt-6">
//       <div className="flex justify-between items-center mb-2">
//         <div className="text-sm font-medium">
//           Selected Places: {campaign.selectedSpaces?.length || 0}
//         </div>
//         <div className="w-1/3">
//           <input
//             type="text"
//             placeholder="Search by space name, city, category"
//             className="w-full border px-3 py-1 rounded text-sm"
//             value={campaign.searchQuery || ''}
//             onChange={(e) => onSearchChange(campaignIndex, e.target.value)}
//           />
//         </div>
//       </div>

//       <div className="overflow-x-auto border rounded">
//         <table className="min-w-full text-xs">
//           <thead className="bg-gray-100">
//             <tr className="text-left">
//               <th className="px-2 py-2">#</th>
//               <th className="px-2 py-2">Space Name</th>
//               <th className="px-2 py-2">Space Type</th>
//               <th className="px-2 py-2">Status</th>
//               <th className="px-2 py-2">Facia</th>
//               <th className="px-2 py-2">City</th>
//               <th className="px-2 py-2">Category</th>
//               <th className="px-2 py-2">Occupied</th>
//               <th className="px-2 py-2">Total</th>
//               <th className="px-2 py-2">Select Units</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredSpaces.map(space => {
//               const globallySelectedUnits = globalAvailability[space.id] || 0;
//               const currentCampaignUnits = campaign.selectedSpaces?.find(s => s.id === space.id)?.selectedUnits || 0;
//               const remainingUnits = space.unit - space.occupiedUnits - globallySelectedUnits + currentCampaignUnits;
//               const updatedOccupiedUnits = space.occupiedUnits + globallySelectedUnits - currentCampaignUnits;

//               const updatedStatus =
//                 updatedOccupiedUnits >= space.unit
//                   ? 'Completely booked'
//                   : updatedOccupiedUnits === 0
//                   ? 'Completely available'
//                   : 'Partialy available';

//               const canSelectUnits = remainingUnits > 0;

//               return (
//                 <tr key={space.id} className="border-t text-center">
//                   <td className="px-2 py-2">
//                     <input
//                       type="checkbox"
//                       checked={campaign.selectedSpaces?.some(s => s.id === space.id)}
//                       onChange={() => onToggleSpaceSelection(campaignIndex, space.id)}
//                     />
//                   </td>
//                   <td className="px-2 py-2 text-left">{space.name}</td>
//                   <td className="px-2 py-2">{space.spaceType}</td>
//                   <td className="px-2 py-2">
//                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                       updatedStatus === "Completely available" ? "bg-green-100 text-green-700" :
//                       updatedStatus === "Partialy available" ? "bg-yellow-100 text-yellow-700" :
//                       "bg-red-100 text-red-700"
//                     }`}>
//                       {updatedStatus}
//                     </span>
//                   </td>
//                   <td className="px-2 py-2">{space.facia}</td>
//                   <td className="px-2 py-2">{space.city}</td>
//                   <td className="px-2 py-2">
//                     <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
//                       {space.category}
//                     </span>
//                   </td>
//                   <td className="px-2 py-2">{updatedOccupiedUnits}</td>
//                   <td className="px-2 py-2">{space.unit}</td>
//                   <td className="px-2 py-2">
//                     {updatedStatus === "Completely booked" || !canSelectUnits ? (
//                       <span className="text-gray-400 italic">N/A</span>
//                     ) : (
//                       <input
//                         type="number"
//                         min={1}
//                         max={remainingUnits}
//                         value={currentCampaignUnits || 1}
//                         onChange={(e) => onUpdateSelectedUnits(campaignIndex, space.id, parseInt(e.target.value))}
//                         className="w-16 border rounded px-1"
//                         disabled={!campaign.selectedSpaces?.some(s => s.id === space.id)}
//                       />
//                     )}
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }



import React from 'react';

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
  console.log("🚀 InventorySelector loaded");
console.log("📦 Campaign Index:", campaignIndex);
console.log("🧾 Campaign:", campaign);
console.log("📆 Selected Start Date:", startDate);
console.log("📆 Selected End Date:", endDate);
console.log("📦 Total Spaces received:", spaces?.length);

  const parseDDMMYY = (str) => {
  const [dd, mm, yy] = str.split("-");
  const fullYear = yy.length === 2 ? `20${yy}` : yy;
  return new Date(`${fullYear}-${mm}-${dd}`);
};

const isSpaceAvailableInRange = (space) => {
  try {
    if (!startDate || !endDate) return false;
    if (!space.availableFrom || !space.availableTo) return false;

    const selectedStart = new Date(startDate);
    const selectedEnd = new Date(endDate);
    const spaceStart = parseDDMMYY(space.availableFrom);
    const spaceEnd = parseDDMMYY(space.availableTo);

    console.log("🔍 Checking:", space.name);
    console.log("📆 Campaign:", selectedStart.toDateString(), "→", selectedEnd.toDateString());
    console.log("📍 Available:", spaceStart.toDateString(), "→", spaceEnd.toDateString());

    if (!(selectedStart >= spaceStart && selectedEnd <= spaceEnd)) {
      console.log("❌ Outside availability");
      return false;
    }

    // Skip campaignDates check since not present in BookingFormOrderInfo

    console.log("✅ Passed");
    return true;

  } catch (err) {
    console.error("🚨 Error:", err);
    return false;
  }
};


 const filteredSpaces = (spaces || []).filter(space => {
  console.log("Space is",space);
  console.log("🔍 Checking space:", space?.name);

    if (!isSpaceAvailableInRange(space)) return false;
    if (space.overlappingBooking && space.status === 'Completely booked') return false;
    if ((space.status === 'Completely available' || space.status === 'Partialy available') && space.traded) return false;

    if (campaign.searchQuery?.trim()) {
      const query = campaign.searchQuery.toLowerCase();
      return (
        space.name.toLowerCase().includes(query) ||
        space.city.toLowerCase().includes(query) ||
        space.category.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium">
          Selected Places: {campaign.selectedSpaces?.length || 0}
        </div>
        <div className="w-1/3">
          <input
            type="text"
            placeholder="Search by space name, city, category"
            className="w-full border px-3 py-1 rounded text-sm"
            value={campaign.searchQuery || ''}
            onChange={(e) => onSearchChange(campaignIndex, e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-100">
            <tr className="text-left">
              <th className="px-2 py-2">#</th>
              <th className="px-2 py-2">Space Name</th>
              <th className="px-2 py-2">Space Type</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Facia</th>
              <th className="px-2 py-2">City</th>
              <th className="px-2 py-2">Category</th>
              <th className="px-2 py-2">Occupied</th>
              <th className="px-2 py-2">Total</th>
              <th className="px-2 py-2">Select Units</th>
            </tr>
          </thead>
          <tbody>
            {filteredSpaces.map(space => {
              const globallySelectedUnits = globalAvailability[space.id] || 0;
              const currentCampaignUnits = campaign.selectedSpaces?.find(s => s.id === space.id)?.selectedUnits || 0;
              const remainingUnits = space.unit - space.occupiedUnits - globallySelectedUnits + currentCampaignUnits;
              const updatedOccupiedUnits = space.occupiedUnits + globallySelectedUnits - currentCampaignUnits;

              const updatedStatus =
                updatedOccupiedUnits >= space.unit
                  ? 'Completely booked'
                  : updatedOccupiedUnits === 0
                  ? 'Completely available'
                  : 'Partialy available';

              const canSelectUnits = remainingUnits > 0;

              return (
                <tr key={space.id} className="border-t text-center">
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={campaign.selectedSpaces?.some(s => s.id === space.id)}
                      onChange={() => onToggleSpaceSelection(campaignIndex, space.id)}
                    />
                  </td>
                  <td className="px-2 py-2 text-left">{space.name}</td>
                  <td className="px-2 py-2">{space.spaceType}</td>
                  <td className="px-2 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      updatedStatus === "Completely available" ? "bg-green-100 text-green-700" :
                      updatedStatus === "Partialy available" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {updatedStatus}
                    </span>
                  </td>
                  <td className="px-2 py-2">{space.facia}</td>
                  <td className="px-2 py-2">{space.city}</td>
                  <td className="px-2 py-2">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {space.category}
                    </span>
                  </td>
                  <td className="px-2 py-2">{updatedOccupiedUnits}</td>
                  <td className="px-2 py-2">{space.unit}</td>
                  <td className="px-2 py-2">
                    {updatedStatus === "Completely booked" || !canSelectUnits ? (
                      <span className="text-gray-400 italic">N/A</span>
                    ) : (
                      <input
                        type="number"
                        min={1}
                        max={remainingUnits}
                        value={currentCampaignUnits || 1}
                        onChange={(e) => onUpdateSelectedUnits(campaignIndex, space.id, parseInt(e.target.value))}
                        className="w-16 border rounded px-1"
                        disabled={!campaign.selectedSpaces?.some(s => s.id === space.id)}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


