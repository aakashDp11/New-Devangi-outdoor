




import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from './Navbar';
import CampaignPipeline from './CampaignPipeline';
import { PieChart } from '@mui/x-charts/PieChart';
import { toast } from 'sonner';

const KeyValueItem = ({ label, value, icon, className = "", iconClassName = "text-blue-600" }) => (
  <div className={`py-1 ${className}`}>
    <div className="flex items-center mb-0.5">
        {icon && <span className={`${iconClassName} mr-2 text-md`}>{icon}</span>} {/* Adjusted icon margin */}
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
    <p className={`text-sm text-gray-700 break-words ${icon ? 'pl-[calc(1rem+0.5rem)]' : 'pl-0'}`}> {/* Dynamic padding based on icon presence and size/margin */}
        {value || 'N/A'}
    </p>
  </div>
);
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
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings/campaign/${id}`);
        const data = await res.json();
        setCampaignData(data);
        setInventoryCosts(data.inventoryCosts || []);
        const fetchedSpaces = await Promise.all(
          (data.spaces || []).map(async (space) => {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${space.id}`);
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
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${id}`);
        const data = await res.json();
        console.log("Campaign data is", data);
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

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${id}/update-costs`, {
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
    <div className="text-xs min-h-screen  w-screen text-black flex flex-col lg:flex-row ">
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
              <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Campaign Info</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
                        <KeyValueItem label="Description" value={description} className="sm:col-span-2 lg:col-span-3"/>
                        <KeyValueItem label="Start Date" value={formatDate(startDate)} />
                        <KeyValueItem label="End Date" value={formatDate(endDate)} />
                    </div>
                </div>


              {pipelineData?.payment && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 text-sm">Payment Overview</h3>
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
                      <p><strong>Total:</strong> ₹{pipelineData.payment.finalAmountWithGST || 0}</p>
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

// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import Navbar from './Navbar';
// import CampaignPipeline from './CampaignPipeline';
// import { PieChart } from '@mui/x-charts/PieChart';
// import { toast } from 'sonner';
// import {
//   FiInfo, FiGrid, FiMapPin, FiType, FiCheckSquare, FiXSquare,
// } from 'react-icons/fi';

// // Reusable display component
// const KeyValueItem = ({ label, value, icon, className = "", iconClassName = "text-blue-600" }) => (
//   <div className={`py-1 ${className}`}>
//     <div className="flex items-center mb-0.5">
//       {icon && <span className={`${iconClassName} mr-2 text-md`}>{icon}</span>}
//       <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
//     </div>
//     <p className={`text-sm text-gray-700 break-words ${icon ? 'pl-[calc(1rem+0.5rem)]' : 'pl-0'}`}>
//       {value || 'N/A'}
//     </p>
//   </div>
// );

// const PaymentTextItem = ({ label, value, isTotal = false, valuePrefix = "₹", colorIndicatorClassName }) => (
//   <div className={`${isTotal ? 'pt-2 mt-2 border-t border-gray-200' : 'mb-1'}`}>
//     <div className="flex items-center">
//       {colorIndicatorClassName && <span className={`w-3 h-3 rounded-full mr-2 ${colorIndicatorClassName}`}></span>}
//       <p className={`text-xs font-semibold ${isTotal ? 'text-gray-700' : 'text-gray-500'} uppercase tracking-wider`}>{label}</p>
//     </div>
//     <p className={`text-sm ${isTotal ? 'font-bold text-gray-800' : 'text-gray-700'} mt-0.5 ml-0`}>
//       {valuePrefix}{value?.toLocaleString() || 0}
//     </p>
//   </div>
// );

// export default function CampaignDetails() {
//   const { id } = useParams();
//   const [campaignData, setCampaignData] = useState(null);
//   const [pipelineData, setPipelineData] = useState(null);
//   const [spaceDetails, setSpaceDetails] = useState([]);
//   const [inventoryCosts, setInventoryCosts] = useState([]);
//   const [editableSpaces, setEditableSpaces] = useState(new Set());
//   const [activeTab, setActiveTab] = useState('Details');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings/campaign/${id}`);
//         const campaign = await res.json();
//         setCampaignData(campaign);
//         setInventoryCosts(campaign.inventoryCosts || []);
//         const fetchedSpaces = await Promise.all(
//           (campaign.spaces || []).map(async (space) => {
//             const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${space.id}`);
//             const details = await res.json();
//             return { ...details, selectedUnits: space.selectedUnits };
//           })
//         );
//         setSpaceDetails(fetchedSpaces);
//         const pipelineRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${id}`);
//         const pipeline = await pipelineRes.json();
//         setPipelineData(pipeline);
//       } catch (err) {
//         setError(err.message);
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [id]);

//   const getCostItem = (spaceId) =>
//     inventoryCosts.find(cost => cost.id === spaceId || cost.id?._id === spaceId);

//   const updateCostField = (spaceId, field, value) => {
//     setInventoryCosts(prev => {
//       const index = prev.findIndex(cost => cost.id === spaceId || cost.id?._id === spaceId);
//       const updated = [...prev];
//       const space = spaceDetails.find(s => s._id === spaceId || s._id?.toString() === spaceId.toString());
//       const computedArea = (space?.width || 0) * (space?.height || 0);

//       if (index !== -1) {
//         const updatedItem = { ...updated[index], [field]: value };
//         if (field !== 'area') {
//           updatedItem.area = computedArea;
//         }
//         updated[index] = updatedItem;
//       } else {
//         updated.push({
//           id: spaceId,
//           displayCost: field === 'displayCost' ? value : 0,
//           printingcostpersquareFeet: field === 'printingcostpersquareFeet' ? value : 0,
//           mountingcostpersquareFeet: field === 'mountingcostpersquareFeet' ? value : 0,
//           area: field === 'area' ? value : computedArea
//         });
//       }

//       return updated;
//     });
//   };

//   const resetCostItem = (spaceId) => {
//     setEditableSpaces(prev => new Set(prev).add(spaceId));
//   };

//   const handleSaveCostForSpace = async (spaceId) => {
//     const cost = getCostItem(spaceId);
//     if (!cost) return toast.error('No cost data to save');
//     try {
//       const updatedCosts = inventoryCosts.map(c =>
//         (c.id === spaceId || c.id?._id === spaceId) ? cost : c
//       );
//       const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${id}/update-costs`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ inventoryCosts: updatedCosts }),
//       });
//       if (!res.ok) throw new Error('Failed to save costs');
//       toast.success('Costs saved for this space!');
//       setEditableSpaces(prev => {
//         const updated = new Set(prev);
//         updated.delete(spaceId);
//         return updated;
//       });
//     } catch (err) {
//       console.error(err);
//       toast.error('Error saving costs.');
//     }
//   };

//   const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-GB') : 'N/A';
//   const paymentInfo = pipelineData?.payment;
//   const pieChartData = paymentInfo ? [
//     { id: 0, value: paymentInfo.totalPaid || 0, label: 'PAID', color: '#4CAF50', colorClass: 'bg-[#4CAF50]' },
//     { id: 1, value: paymentInfo.paymentDue || 0, label: 'DUE', color: '#FF9800', colorClass: 'bg-[#FF9800]' }
//   ] : [];

//   if (loading) return <div className="min-h-screen bg-gray-100"><Navbar /><main className="ml-64 p-10">Loading...</main></div>;
//   if (error) return <div className="min-h-screen bg-gray-100"><Navbar /><main className="ml-64 p-10 text-red-500">{error}</main></div>;

//   return (
//     // <div className="min-h-screen bg-gray-100 w-full">
//     <div className="min-h-screen bg-gray-100 h-screen w-screen bg-white text-black flex flex-col lg:flex-row ">
//       <Navbar />
//       <main className="ml-64 px-6 py-6 w-full">
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-2xl font-bold text-gray-800">{campaignData?.campaignName || 'Campaign'}</h1>
//         </div>

//         {/* Tabs */}
//         <div className="flex space-x-2 mb-6 border-b border-gray-200">
//           {['Details', 'Pipeline', 'Spaces'].map(tab => (
//             <button
//               key={tab}
//               onClick={() => setActiveTab(tab)}
//               className={`px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-t-md ${
//                 activeTab === tab
//                   ? 'bg-white text-blue-600 border-t border-x border-gray-300 -mb-px shadow-sm'
//                   : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-b border-transparent'
//               }`}
//             >
//               {tab}
//             </button>
//           ))}
//         </div>

//         {/* Pipeline Tab */}
//         {activeTab === 'Pipeline' && <div className="bg-white px-[20%] rounded shadow"><CampaignPipeline campaignId={campaignData._id} /></div>}
//  {/* {activeTab === 'Pipeline' && <CampaignPipeline campaignId={campaignData._id} />} */}
//         {/* Details Tab */}
//         {activeTab === 'Details' && (
//           <div className="bg-white p-6 w-full rounded shadow-md">
//             <h2 className="text-lg font-semibold text-gray-700 mb-4">Campaign Info</h2>
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
//               <KeyValueItem label="Description" value={campaignData.description} />
//               <KeyValueItem label="Start Date" value={formatDate(campaignData.startDate)} />
//               <KeyValueItem label="End Date" value={formatDate(campaignData.endDate)} />
//             </div>
//             <div className="pt-6 mt-6 border-t">
//               <h2 className="text-lg font-semibold mb-4">Payment Overview</h2>
//               {(!paymentInfo || paymentInfo.totalAmount === 0) ? (
//                 <p className="text-gray-500 text-center">Please make the payment first.</p>
//               ) : (
//                 <div className="flex items-start gap-6">
//                   <PieChart
//                     series={[{ data: pieChartData, innerRadius: 40, outerRadius: 70 }]}
//                     width={180}
//                     height={160}
//                   />
//                   <div className='mr-auto'>
//                     {pieChartData.map(item => (
//                       <PaymentTextItem key={item.id} label={item.label} value={item.value} colorIndicatorClassName={item.colorClass} />
//                     ))}
//                     <PaymentTextItem label="TOTAL AMOUNT" value={paymentInfo?.totalAmount} isTotal={true} />
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Spaces Tab */}
//         {activeTab === 'Spaces' && (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//             {spaceDetails.map((space, index) => {
//               const cost = getCostItem(space._id);
//               const computedArea = (space.width || 0) * (space.height || 0);
//               const displayCost = cost?.displayCost || 0;
//               const printingCost = cost?.printingcostpersquareFeet || 0;
//               const mountingCost = cost?.mountingcostpersquareFeet || 0;
//               const area = cost?.area || computedArea || 0;
//               const totalCost = displayCost + (printingCost * area) + (mountingCost * area);
//               const isEditable = editableSpaces.has(space._id);

//               return (
//                 <div key={space._id || index} className="bg-white p-4 border rounded-xl shadow">
//                   <h2 className="text-md font-bold mb-2">Space {index + 1} - {space.spaceName}</h2>
//                   {space.mainPhoto && (
//                     <img src={space.mainPhoto} alt="space" className="w-full h-32 object-cover rounded mb-2 border" />
//                   )}
//                   <KeyValueItem label="Location" value={`${space.city}, ${space.state}`} icon={<FiMapPin />} />
//                   <KeyValueItem label="Type" value={space.spaceType} icon={<FiType />} />
//                   <KeyValueItem label="Selected Units" value={space.selectedUnits} icon={<FiGrid />} />
//                   <KeyValueItem label="Availability" value={space.availability} icon={<FiInfo />} />

//                   <div className="mt-2 space-y-2">
//                     {['displayCost', 'printingcostpersquareFeet', 'mountingcostpersquareFeet', 'area'].map(field => (
//                       <div key={field}>
//                         <label className="text-sm">
//                           {field.replace(/([A-Z])/g, ' $1')}: 
//                           <input
//                             type="number"
//                             className="border ml-2 px-2 py-1 rounded w-[100px]"
//                             value={cost?.[field] !== undefined ? cost[field] : (field === 'area' ? computedArea : 0)}
//                             onChange={e => updateCostField(space._id, field, Number(e.target.value))}
//                             readOnly={!isEditable}
//                           />
//                         </label>
//                       </div>
//                     ))}
//                     <p className="text-sm font-semibold mt-2">Total Cost: ₹{totalCost.toFixed(2)}</p>
//                     <div className="flex gap-2">
//                       <button className="text-xs px-2 py-1 bg-red-500 text-white rounded" onClick={() => resetCostItem(space._id)}>Reset</button>
//                       <button className="text-xs px-2 py-1 bg-blue-600 text-white rounded" onClick={() => handleSaveCostForSpace(space._id)}>Save Costs</button>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }

