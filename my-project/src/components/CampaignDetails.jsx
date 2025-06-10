

// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import Navbar from './Navbar';
// import CampaignPipeline from './CampaignPipeline';
// import { PieChart } from '@mui/x-charts/PieChart';

// export default function CampaignDetails() {
//   const { id } = useParams();
//   const [campaignData, setCampaignData] = useState(null);
//   const [pipelineData, setPipelineData] = useState(null);
//   const [spaceDetails, setSpaceDetails] = useState([]);
//   const [activeTab, setActiveTab] = useState('Pipeline');

//   useEffect(() => {
//     const fetchCampaign = async () => {
//       try {
//         const res = await fetch(`http://localhost:3000/api/bookings/campaign/${id}`);
//         const data = await res.json();
//         console.log("Fetched data is",data);
//         setCampaignData(data);

//         const fetchedSpaces = await Promise.all(
//           (data.spaces || []).map(async (space) => {
//             const res = await fetch(`http://localhost:3000/api/spaces/${space.id}`);
//             const details = await res.json();
//             console.log("details are",details);
//             return { ...details, selectedUnits: space.selectedUnits };
//           })
//         );
//         setSpaceDetails(fetchedSpaces);
//       } catch (err) {
//         console.error('Failed to load campaign details:', err);
//       }
//     };

//     fetchCampaign();
//   }, [id]);

//   useEffect(() => {
//     const fetchPipelineData = async () => {
//       try {
//         const res = await fetch(`http://localhost:3000/api/pipeline/campaign/${id}`);
//         const data = await res.json();
//         setPipelineData(data);
//       } catch (err) {
//         console.error('Failed to load pipeline data:', err);
//       }
//     };

//     if (campaignData?._id) {
//       fetchPipelineData();
//     }
//   }, [campaignData]);

//   if (!campaignData) return <div className="p-6">Loading campaign...</div>;

//   const { campaignName, description, startDate, endDate } = campaignData;
//   const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN');

//   return (
//     <div className="text-xs w-full">
//       <Navbar />
//       <main className="ml-64 w-full flex-1 px-8 py-4">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl ">Campaign : {campaignName}</h2>
//         </div>

//         {/* Tab Buttons */}
//         <div className="flex space-x-4 mb-4">
//           {['Details','Pipeline'].map(tab => (
//             <button
//               key={tab}
//               onClick={() => setActiveTab(tab)}
//               className={`px-4 py-1 border rounded ${
//                 activeTab === tab ? 'bg-black text-white' : 'bg-white text-black border-gray-400'
//               } transition duration-200`}
//             >
//               {tab}
//             </button>
//           ))}
//         </div>

//         {/* Pipeline Tab */}
//         {activeTab === 'Pipeline' && (
//           <div className="w-full">
//             <CampaignPipeline campaignId={campaignData._id} />
//           </div>
//         )}

//         {/* Data Tab */}
//         {activeTab === 'Details' && (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-[5%]">
//             {/* Campaign Info with Payment Chart */}
//             <div className="bg-white shadow-md border rounded-xl p-4">
//               <h2 className="text-base font-semibold mb-2">Campaign Info</h2>
//               <p className="text-sm"><strong>Description:</strong> {description}</p>
//               <p className="text-sm"><strong>Start Date:</strong> {formatDate(startDate)}</p>
//               <p className="text-sm"><strong>End Date:</strong> {formatDate(endDate)}</p>

//               {pipelineData?.payment && (
//                 <div className="mt-4">
//                   <h3 className="text-sm font-semibold mb-1">Payment Overview</h3>
//                   <div className="w-[200px]">
//                     <PieChart
//                       series={[
//                         {
//                           data: [
//                             { id: 0, value: pipelineData.payment.totalPaid, label: 'Paid' },
//                             { id: 1, value: pipelineData.payment.paymentDue, label: 'Due' }
//                           ],
//                           innerRadius: 50,
//                           outerRadius: 80,
//                         },
//                       ]}
//                       width={200}
//                       height={200}
//                     />
//                     <div className="text-xs mt-2">
//                       <p><strong>Total:</strong> ₹{pipelineData.payment.totalAmount || 0}</p>
//                       <p><strong>Paid:</strong> ₹{pipelineData.payment.totalPaid || 0}</p>
//                       <p><strong>Due:</strong> ₹{pipelineData.payment.paymentDue || 0}</p>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Space Info Cards */}
//             {spaceDetails.map((space, index) => (
//               <div key={space._id || index} className="bg-white shadow-md border rounded-xl p-4">
//                 <h2 className="text-base font-semibold mb-2">Space {index + 1}</h2>
//                 {space.mainPhoto && (
//                   <img
//                     src={space.mainPhoto}
//                     alt="Main"
//                     className="w-48 h-32 object-cover rounded border mb-2"
//                   />
//                 )}
//                 <div className="text-sm space-y-1">
//                   <p><strong>Name:</strong> {space.spaceName}</p>
//                   <p><strong>Location:</strong> {space.city}, {space.state}</p>
//                   <p><strong>Type:</strong> {space.spaceType}</p>
//                   <p><strong>Total Units:</strong> {space.unit}</p>
//                   <p><strong>Occupied Units:</strong> {space.occupiedUnits}</p>
//                   <p><strong>Selected Units:</strong> {space.selectedUnits}</p>
//                   <p><strong>Availability:</strong> {space.availability}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }





// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import Navbar from './Navbar';
// import CampaignPipeline from './CampaignPipeline';
// import { PieChart } from '@mui/x-charts/PieChart';

// export default function CampaignDetails() {
//   const { id } = useParams();
//   const [campaignData, setCampaignData] = useState(null);
//   const [pipelineData, setPipelineData] = useState(null);
//   const [spaceDetails, setSpaceDetails] = useState([]);
//   const [inventoryCosts, setInventoryCosts] = useState([]);
//   const [activeTab, setActiveTab] = useState('Details');
//   const [editableSpaces, setEditableSpaces] = useState(new Set());

//   useEffect(() => {
//     const fetchCampaign = async () => {
//       try {
//         const res = await fetch(`http://localhost:3000/api/bookings/campaign/${id}`);
//         const data = await res.json();
//         setCampaignData(data);
//         setInventoryCosts(data.inventoryCosts || []);
//         const fetchedSpaces = await Promise.all(
//           (data.spaces || []).map(async (space) => {
//             const res = await fetch(`http://localhost:3000/api/spaces/${space.id}`);
//             const details = await res.json();
//             return { ...details, selectedUnits: space.selectedUnits };
//           })
//         );
//         setSpaceDetails(fetchedSpaces);
//       } catch (err) {
//         console.error('Failed to load campaign details:', err);
//       }
//     };

//     fetchCampaign();
//   }, [id]);

//   useEffect(() => {
//     const fetchPipelineData = async () => {
//       try {
//         const res = await fetch(`http://localhost:3000/api/pipeline/campaign/${id}`);
//         const data = await res.json();
//         setPipelineData(data);
//       } catch (err) {
//         console.error('Failed to load pipeline data:', err);
//       }
//     };
//     if (campaignData?._id) fetchPipelineData();
//   }, [campaignData]);

//   const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN');

//   const getCostItem = (spaceId) =>
//     inventoryCosts.find(cost => cost.id === spaceId || cost.id?._id === spaceId);

//   const updateCostField = (spaceId, field, value) => {
//     setInventoryCosts(prev => {
//       const index = prev.findIndex(cost => cost.id === spaceId || cost.id?._id === spaceId);
//       const updated = [...prev];
//       if (index !== -1) {
//         updated[index] = { ...updated[index], [field]: value };
//       } else {
//         updated.push({
//           id: spaceId,
//           displayCost: 0,
//           printingcostpersquareFeet: 0,
//           mountingcostpersquareFeet: 0,
//           area: 0,
//           [field]: value
//         });
//       }
//       return updated;
//     });
//   };

//   const resetCostItem = (spaceId) => {
//     setEditableSpaces(prev => new Set(prev).add(spaceId));
//   };

//   const handleSaveCosts = async () => {
//     try {
//       const res = await fetch(`http://localhost:3000/api/pipeline/campaign/${id}/update-costs`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ inventoryCosts }),
//       });
//       if (!res.ok) throw new Error('Failed to save costs');
//       alert('Costs saved successfully!');
//       setEditableSpaces(new Set()); // lock all fields after save
//     } catch (err) {
//       console.error(err);
//       alert('Error saving costs');
//     }
//   };

//   if (!campaignData) return <div className="p-6">Loading campaign...</div>;

//   const { campaignName, description, startDate, endDate } = campaignData;

//   return (
//     <div className="text-xs w-[90%]">
//       <Navbar />
//       <main className="ml-64 w-full flex-1 px-8 py-4">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl ">Campaign : {campaignName}</h2>
//         </div>

//         <div className="flex space-x-4 mb-4">
//           {['Details', 'Pipeline'].map(tab => (
//             <button
//               key={tab}
//               onClick={() => setActiveTab(tab)}
//               className={`px-4 py-1 border rounded ${
//                 activeTab === tab ? 'bg-black text-white' : 'bg-white text-black border-gray-400'
//               } transition duration-200`}
//             >
//               {tab}
//             </button>
//           ))}
//         </div>

//         {activeTab === 'Pipeline' && <CampaignPipeline campaignId={campaignData._id} />}

//         {activeTab === 'Details' && (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-[5%]">
//             <div className="bg-white shadow-md border rounded-xl p-4">
//               <h2 className="text-base font-semibold mb-2">Campaign Info</h2>
//               <p className="text-sm"><strong>Description:</strong> {description}</p>
//               <p className="text-sm"><strong>Start Date:</strong> {formatDate(startDate)}</p>
//               <p className="text-sm"><strong>End Date:</strong> {formatDate(endDate)}</p>

//               {pipelineData?.payment && (
//                 <div className="mt-4">
//                   <h3 className="text-sm font-semibold mb-1">Payment Overview</h3>
//                   <div className="w-[200px]">
//                     <PieChart
//                       series={[
//                         {
//                           data: [
//                             { id: 0, value: pipelineData.payment.totalPaid, label: 'Paid' },
//                             { id: 1, value: pipelineData.payment.paymentDue, label: 'Due' }
//                           ],
//                           innerRadius: 50,
//                           outerRadius: 80,
//                         },
//                       ]}
//                       width={200}
//                       height={200}
//                     />
//                     <div className="text-xs mt-2">
//                       <p><strong>Total:</strong> ₹{pipelineData.payment.totalAmount || 0}</p>
//                       <p><strong>Paid:</strong> ₹{pipelineData.payment.totalPaid || 0}</p>
//                       <p><strong>Due:</strong> ₹{pipelineData.payment.paymentDue || 0}</p>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {spaceDetails.map((space, index) => {
//               const cost = getCostItem(space._id);
//               const computedArea = space.width * space.height;
//               const displayCost = cost?.displayCost || 0;
//               const printingCost = cost?.printingcostpersquareFeet || 0;
//               const mountingCost = cost?.mountingcostpersquareFeet || 0;
//               const area = cost?.area || computedArea || 0;
//               const totalCost = displayCost + (printingCost * area) + (mountingCost * area);

//               const isEditable = editableSpaces.has(space._id);

//               return (
//                 <div key={space._id || index} className="bg-white shadow-md border rounded-xl p-4">
//                   <h2 className="text-base font-semibold mb-2">Space {index + 1}</h2>
//                   {space.mainPhoto && (
//                     <img
//                       src={space.mainPhoto}
//                       alt="Main"
//                       className="w-48 h-32 object-cover rounded border mb-2"
//                     />
//                   )}
//                   <div className="text-sm space-y-1">
//                     <p><strong>Name:</strong> {space.spaceName}</p>
//                     <p><strong>Location:</strong> {space.city}, {space.state}</p>
//                     <p><strong>Type:</strong> {space.spaceType}</p>
//                     <p><strong>Total Units:</strong> {space.unit}</p>
//                     <p><strong>Occupied Units:</strong> {space.occupiedUnits}</p>
//                     <p><strong>Selected Units:</strong> {space.selectedUnits}</p>
//                     <p><strong>Availability:</strong> {space.availability}</p>
//                     <hr className="my-2" />

//                     <div className="grid grid-cols-1 gap-2">
//                       {['displayCost', 'printingcostpersquareFeet', 'mountingcostpersquareFeet', 'area'].map(field => (
//                         <label key={field}>
//                           {field === 'displayCost' && 'Display Cost:'}
//                           {field === 'printingcostpersquareFeet' && 'Printing Cost/sq.ft.:'}
//                           {field === 'mountingcostpersquareFeet' && 'Mounting Cost/sq.ft.:'}
//                           {field === 'area' && 'Area (sq.ft.):'}
//                           <input
//                             type="number"
//                             className="border rounded ml-2 px-2 py-1 w-[20%]"
//                             value={cost?.[field] || (field === 'area' ? computedArea : 0)}
//                             onChange={(e) => updateCostField(space._id, field, Number(e.target.value))}
//                             readOnly={!isEditable}
//                           />
//                         </label>
//                       ))}

//                       <p><strong>Total Cost:</strong> ₹{totalCost.toFixed(2)}</p>

//                       <button
//                         onClick={() => resetCostItem(space._id)}
//                         className="text-xs mt-1 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
//                       >
//                         Reset
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}

//             <div className="col-span-1 md:col-span-2 flex justify-end mt-4">
//               <button
//                 onClick={handleSaveCosts}
//                 className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
//               >
//                 Save Costs
//               </button>
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }



import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from './Navbar';
import CampaignPipeline from './CampaignPipeline';
import { PieChart } from '@mui/x-charts/PieChart';
import { toast } from 'sonner';
export default function CampaignDetails() {
  const { id } = useParams();
  const [campaignData, setCampaignData] = useState(null);
  const [pipelineData, setPipelineData] = useState(null);
  const [spaceDetails, setSpaceDetails] = useState([]);
  const [inventoryCosts, setInventoryCosts] = useState([]);
  const [activeTab, setActiveTab] = useState('Details');
  const [editableSpaces, setEditableSpaces] = useState(new Set());

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/bookings/campaign/${id}`);
        const data = await res.json();
        setCampaignData(data);
        setInventoryCosts(data.inventoryCosts || []);
        const fetchedSpaces = await Promise.all(
          (data.spaces || []).map(async (space) => {
            const res = await fetch(`http://localhost:3000/api/spaces/${space.id}`);
            const details = await res.json();
            return { ...details, selectedUnits: space.selectedUnits };
          })
        );
        setSpaceDetails(fetchedSpaces);
      } catch (err) {
        console.error('Failed to load campaign details:', err);
      }
    };

    fetchCampaign();
  }, [id]);

  useEffect(() => {
    const fetchPipelineData = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/pipeline/campaign/${id}`);
        const data = await res.json();
        setPipelineData(data);
      } catch (err) {
        console.error('Failed to load pipeline data:', err);
      }
    };
    if (campaignData?._id) fetchPipelineData();
  }, [campaignData]);

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN');

  const getCostItem = (spaceId) =>
    inventoryCosts.find(cost => cost.id === spaceId || cost.id?._id === spaceId);

//   const updateCostField = (spaceId, field, value) => {
//     setInventoryCosts(prev => {
//       const index = prev.findIndex(cost => cost.id === spaceId || cost.id?._id === spaceId);
//       const updated = [...prev];
//       if (index !== -1) {
//         updated[index] = { ...updated[index], [field]: value };
//       } else {
//         updated.push({
//           id: spaceId,
//           displayCost: 0,
//           printingcostpersquareFeet: 0,
//           mountingcostpersquareFeet: 0,
//           area: 0,
//           [field]: value
//         });
//       }
//       return updated;
//     });
//   };
const updateCostField = (spaceId, field, value) => {
  setInventoryCosts(prev => {
    const index = prev.findIndex(cost => cost.id === spaceId || cost.id?._id === spaceId);
    const updated = [...prev];
    const space = spaceDetails.find(s => s._id === spaceId || s._id?.toString() === spaceId.toString());
    const computedArea = (space?.width || 0) * (space?.height || 0);

    if (index !== -1) {
      const updatedItem = { ...updated[index], [field]: value };

      // 🧠 If the field isn't 'area', update area with computed value if not manually changed
      if (field !== 'area') {
        updatedItem.area = computedArea;
      }

      updated[index] = updatedItem;
    } else {
      console.log('New cost added. Computed Area:', computedArea);
      updated.push({
        id: spaceId,
        displayCost: field === 'displayCost' ? value : 0,
        printingcostpersquareFeet: field === 'printingcostpersquareFeet' ? value : 0,
        mountingcostpersquareFeet: field === 'mountingcostpersquareFeet' ? value : 0,
        area: field === 'area' ? value : computedArea
      });
    }

    return updated;
  });
};



  const resetCostItem = (spaceId) => {
    setEditableSpaces(prev => new Set(prev).add(spaceId));
  };

  const handleSaveCostForSpace = async (spaceId) => {
    const cost = getCostItem(spaceId);
    if (!cost) {
      toast.error('No cost data to save');
      return;
    }

    try {
      const updatedCosts = inventoryCosts.map(c =>
        (c.id === spaceId || c.id?._id === spaceId) ? cost : c
      );

      const res = await fetch(`http://localhost:3000/api/pipeline/campaign/${id}/update-costs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryCosts: updatedCosts }),
      });

      if (!res.ok) throw new Error('Failed to save costs');
      toast.success('Costs saved for this space!');
      setEditableSpaces(prev => {
        const updated = new Set(prev);
        updated.delete(spaceId);
        return updated;
      });
    } catch (err) {
      console.error(err);
      toast.error('Error saving costs for this space.');
    }
  };

  if (!campaignData) return <div className="p-6">Loading campaign...</div>;

  const { campaignName, description, startDate, endDate } = campaignData;

  return (
    <div className="text-xs w-[90%]">
      <Navbar />
      <main className="ml-64 w-full flex-1 px-8 py-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl ">Campaign : {campaignName}</h2>
        </div>

        <div className="flex space-x-4 mb-4">
          {['Details', 'Pipeline'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1 border rounded ${
                activeTab === tab ? 'bg-black text-white' : 'bg-white text-black border-gray-400'
              } transition duration-200`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Pipeline' && <CampaignPipeline campaignId={campaignData._id} />}

        {activeTab === 'Details' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-[5%]">
            <div className="bg-white shadow-md border rounded-xl p-4">
              <h2 className="text-base font-semibold mb-2">Campaign Info</h2>
              <p className="text-sm"><strong>Description:</strong> {description}</p>
              <p className="text-sm"><strong>Start Date:</strong> {formatDate(startDate)}</p>
              <p className="text-sm"><strong>End Date:</strong> {formatDate(endDate)}</p>

              {pipelineData?.payment && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-1">Payment Overview</h3>
                  <div className="w-[200px]">
                    <PieChart
                      series={[
                        {
                          data: [
                            { id: 0, value: pipelineData.payment.totalPaid, label: 'Paid' },
                            { id: 1, value: pipelineData.payment.paymentDue, label: 'Due' }
                          ],
                          innerRadius: 50,
                          outerRadius: 80,
                        },
                      ]}
                      width={200}
                      height={200}
                    />
                    <div className="text-xs mt-2">
                      <p><strong>Total:</strong> ₹{pipelineData.payment.totalAmount || 0}</p>
                      <p><strong>Paid:</strong> ₹{pipelineData.payment.totalPaid || 0}</p>
                      <p><strong>Due:</strong> ₹{pipelineData.payment.paymentDue || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {spaceDetails.map((space, index) => {
              const cost = getCostItem(space._id);
              const computedArea = space.width * space.height;
              const displayCost = cost?.displayCost || 0;
              const printingCost = cost?.printingcostpersquareFeet || 0;
              const mountingCost = cost?.mountingcostpersquareFeet || 0;
              const area = cost?.area || computedArea || 0;
              const totalCost = displayCost + (printingCost * area) + (mountingCost * area);

              const isEditable = editableSpaces.has(space._id);

              return (
                <div key={space._id || index} className="bg-white shadow-md border rounded-xl p-4">
                  <h2 className="text-base font-semibold mb-2">Space {index + 1}</h2>
                  {space.mainPhoto && (
                    <img
                      src={space.mainPhoto}
                      alt="Main"
                      className="w-48 h-32 object-cover rounded border mb-2"
                    />
                  )}
                  <div className="text-sm space-y-1">
                    <p><strong>Name:</strong> {space.spaceName}</p>
                    <p><strong>Location:</strong> {space.city}, {space.state}</p>
                    <p><strong>Type:</strong> {space.spaceType}</p>
                    <p><strong>Total Units:</strong> {space.unit}</p>
                    <p><strong>Occupied Units:</strong> {space.occupiedUnits}</p>
                    <p><strong>Selected Units:</strong> {space.selectedUnits}</p>
                    <p><strong>Availability:</strong> {space.availability}</p>
                    <hr className="my-2" />

                    <div className="grid grid-cols-1 gap-2">
                      {['displayCost', 'printingcostpersquareFeet', 'mountingcostpersquareFeet', 'area'].map(field => (
                        <label key={field}>
                          {field === 'displayCost' && 'Display Cost:'}
                          {field === 'printingcostpersquareFeet' && 'Printing Cost/sq.ft.:'}
                          {field === 'mountingcostpersquareFeet' && 'Mounting Cost/sq.ft.:'}
                          {field === 'area' && 'Area (sq.ft.):'}
                          <input
                            type="number"
                            className="border rounded ml-2 px-2 py-1 w-[20%]"
                            value={cost?.[field] || (field === 'area' ? computedArea : 0)}
                            onChange={(e) => updateCostField(space._id, field, Number(e.target.value))}
                            readOnly={!isEditable}
                          />
                        </label>
                      ))}

                      <p><strong>Total Cost:</strong> ₹{totalCost.toFixed(2)}</p>

                      <div className="flex w-full gap-2 mt-2">
                        <button
                          onClick={() => resetCostItem(space._id)}
                          className="text-xs  px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => handleSaveCostForSpace(space._id)}
                          className="text-xs ml-auto px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Save Costs
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
