

// import React, { useState } from 'react';
// import Navbar from './Navbar';
// import { useNavigate } from 'react-router-dom';
// import { useBookingForm } from '../context/BookingFormContext'; // ✅ Import context

// export default function BookingFormOrderInfo() {
//   const navigate = useNavigate();
//   const { orderInfo, setOrderInfo } = useBookingForm(); // ✅ Access context

//   const [step, setStep] = useState('Order');
//   const [completedSteps, setCompletedSteps] = useState(['Basic']);
//   const stepOrder = ['Basic', 'Order', 'Spaces'];

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setOrderInfo({ ...orderInfo, [name]: value });
//   };

//   const handleNext = () => {
//     if (!completedSteps.includes(step)) {
//       setCompletedSteps((prev) => [...prev, step]);
//     }
//     const currentIndex = stepOrder.indexOf(step);
//     if (currentIndex < stepOrder.length - 1) {
//       setStep(stepOrder[currentIndex + 1]);
//     }
//     navigate('/create-booking-addSpaces');
//   };

//   const handleBack = () => {
//     navigate('/create-booking');
//   };

//   return (
//     <div className="p-6 md:ml-64 min-h-screen">
//       <Navbar />
//       <div className="max-w-screen-xl mx-auto">
//         <h2 className="text-2xl font-semibold mb-6">Create Order</h2>

//         {/* Step Tabs */}
//         <div className="flex gap-6 mb-6 text-sm font-medium">
//           {/* {stepOrder.map((label) => (
//             <div
//               key={label}
//               className={
//                 step === label
//                   ? 'text-green-600 flex items-center gap-1'
//                   : completedSteps.includes(label)
//                   ? 'text-green-600 flex items-center gap-1'
//                   : 'text-black flex items-center gap-1'
//               }
//             >
//               {completedSteps.includes(label) || step === label ? '✓' : ''}{' '}
//               {label === 'Basic'
//                 ? 'Basic Information'
//                 : label === 'Order'
//                 ? 'Order Information'
//                 : 'Select Spaces'}
//             </div>
//           ))} */}
//           {stepOrder.map((label) => {
//   const isCompleted = completedSteps.includes(label);
//   const isCurrent = step === label;

//   return (
//     <div
//       key={label}
//       className={
//         isCurrent
//           ? 'text-black flex items-center gap-1'
//           : isCompleted
//           ? 'text-green-600 flex items-center gap-1'
//           : 'text-black flex items-center gap-1'
//       }
//     >
//       {isCompleted && !isCurrent ? '✓' : ''}{' '}
//       {label === 'Basic'
//         ? 'Basic Information'
//         : label === 'Order'
//         ? 'Order Information'
//         : 'Select Spaces'}
//     </div>
//   );
// })}

//         </div>

//         {/* Form */}
//         {step === 'Order' && (
//           <div className="grid text-xs grid-cols-1 md:grid-cols-2 gap-6">
//             <div className="text-xs">
//             <Input
            
//               label="Campaign Name *"
//               name="campaignName"
//               value={orderInfo.campaignName}
//               onChange={handleChange}
//               required
//             />
//             </div>
           
//             <div>
//               <label className="text-xs font-medium">Industry *</label>
//               <select
//                 name="industry"
//                 value={orderInfo.industry}
//                 onChange={handleChange}
//                 className="w-full border px-3 py-2 rounded mt-1"
//               >
//                 <option value="">Select...</option>
//                 <option>Automotive</option>
//                 <option>Clothing & Apparel</option>
//                 <option>Ecommerce</option>
//                 <option>EdTech</option>
//                 <option>Entertainment</option>
//                 <option>FMCG</option>
//               </select>
//             </div>
//             <div className="md:col-span-2">
//               <label className="text-xs font-medium">Description</label>
//               <textarea
//                 name="description"
//                 value={orderInfo.description}
//                 onChange={handleChange}
//                 className="w-full border px-3 py-2 rounded mt-1"
//                 rows={4}
//                 placeholder="Maximum 400 characters"
//               />
//             </div>
//           </div>
//         )}

//         {/* Buttons */}
//         <div className="flex text-sm justify-between mt-8">
//           <button className="border px-4 py-2 rounded">Cancel</button>
//           <div className="space-x-2">
//             <button onClick={handleBack} className="bg-black text-white px-3 py-1 rounded">
//               Back
//             </button>
//             <button onClick={handleNext} className="bg-black text-white px-3 py-1 rounded transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110">
//               Next
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function Input({ label, ...props }) {
//   return (
//     <div>
//       <label className="text-xs font-medium">{label}</label>
//       <input {...props} className="w-full border px-3 py-2 rounded mt-1" />
//     </div>
//   );
// }





  // import React, { useEffect, useState } from 'react';
  // import Navbar from './Navbar';
  // import { useNavigate } from 'react-router-dom';
  // import { useBookingForm } from '../context/BookingFormContext';
  // import InventorySelector from './BookingFormAddSpaces';

  // export default function BookingFormOrderInfo() {
  //   const navigate = useNavigate();
  //   const { orderInfo, setOrderInfo } = useBookingForm();
  //   const [spaces, setSpaces] = useState([]);
  //   const [loading, setLoading] = useState(true);

  //   useEffect(() => {
  //     const fetchSpaces = async () => {
  //       const res = await fetch('http://localhost:3000/api/spaces');
  //       const data = await res.json();
  //       const transformed = data.map(space => ({
  //         id: space._id,
  //         name: space.spaceName,
  //         facia: space.faciaTowards,
  //         city: space.city,
  //         category: space.category,
  //         spaceType: space.spaceType,
  //         unit: space.unit,
  //         occupiedUnits: space.occupiedUnits,
  //         price: space.price,
  //         traded: space.traded,
  //         overlappingBooking: space.overlappingBooking,
  //         availableFrom: space.dates?.[0],
  //         availableTo: space.dates?.[space.dates.length - 1],
  //         status: space.occupiedUnits === 0 ? 'Completely available' :
  //                 space.occupiedUnits < space.unit ? 'Partialy available' : 'Completely booked'
  //       }));
  //       setSpaces(transformed);
  //       setLoading(false);
  //     };
  //     fetchSpaces();
  //   }, []);

  //   const updateCampaign = (index, updatedCampaign) => {
  //     const campaigns = orderInfo.campaigns.map((c, i) => i === index ? updatedCampaign : c);
  //     setOrderInfo({ ...orderInfo, campaigns });
  //   };

  //   const handleCampaignChange = (index, e) => {
  //     const { name, value } = e.target;
  //     updateCampaign(index, { ...orderInfo.campaigns[index], [name]: value });
  //   };

  //   const toggleSpaceSelection = (campaignIndex, spaceId) => {
  //     const campaign = orderInfo.campaigns[campaignIndex];
  //     const exists = campaign.selectedSpaces?.find(s => s.id === spaceId);
  //     const updatedSelectedSpaces = exists
  //       ? campaign.selectedSpaces.filter(s => s.id !== spaceId)
  //       : [...(campaign.selectedSpaces || []), { ...spaces.find(s => s.id === spaceId), selectedUnits: 1 }];
  //     updateCampaign(campaignIndex, { ...campaign, selectedSpaces: updatedSelectedSpaces });
  //   };

  //   const updateSelectedUnits = (campaignIndex, spaceId, units) => {
  //     const campaign = orderInfo.campaigns[campaignIndex];
  //     const updatedSpaces = campaign.selectedSpaces.map(s =>
  //       s.id === spaceId ? { ...s, selectedUnits: units } : s
  //     );
  //     updateCampaign(campaignIndex, { ...campaign, selectedSpaces: updatedSpaces });
  //   };

  //   const handleSearchChange = (index, value) => {
  //     updateCampaign(index, { ...orderInfo.campaigns[index], searchQuery: value });
  //   };

  //   const addCampaign = () => {
  //     setOrderInfo({ ...orderInfo, campaigns: [...(orderInfo.campaigns || []), {
  //       campaignName: '', industry: '', description: '', startDate: '', endDate: '', selectedSpaces: [], searchQuery: '', isSaved: false
  //     }] });
  //   };

  //   const deleteCampaign = (index) => {
  //     const updatedCampaigns = orderInfo.campaigns.filter((_, i) => i !== index);
  //     setOrderInfo({ ...orderInfo, campaigns: updatedCampaigns });
  //   };

  //   const saveCampaign = (index) => {
  //     updateCampaign(index, { ...orderInfo.campaigns[index], isSaved: true });
  //   };

  //   const editCampaign = (index) => {
  //     updateCampaign(index, { ...orderInfo.campaigns[index], isSaved: false });
  //   };

  //   const handleNext = () => navigate('/booking-preview');
  //   const handleBack = () => navigate('/create-booking');

  //   return (
  //     <div className="p-6 md:ml-64 min-h-screen">
  //       <Navbar />
  //       <h2 className="text-2xl font-semibold mb-6">Create Order</h2>

  //       {loading ? <p>Loading spaces...</p> : (
  //         <>
  //           {orderInfo.campaigns?.map((campaign, index) => (
  //             <div key={index} className="relative border rounded p-4 mb-6 shadow-sm">
                

  //               {campaign.isSaved ? (
  //                 <div className="flex justify-between items-center">
  //                   <div>
  //                     <h3 className="font-semibold">{campaign.campaignName}</h3>
  //                     <p className="text-xs">Industry: {campaign.industry}</p>
  //                     <p className="text-xs">From {campaign.startDate} to {campaign.endDate}</p>
  //                   </div>
  //                   <div className="space-x-2">
  //                     <button onClick={() => editCampaign(index)} className="text-xs border px-3 py-1 rounded">Edit</button>
  //                     <button onClick={() => deleteCampaign(index)} className="text-xs border px-3 py-1 rounded text-red-500">Delete</button>
  //                   </div>
  //                 </div>
  //               ) : (
  //                 <>
  //                   <div className="grid grid-cols-2 gap-4">
  //                     {/* <button onClick={() => deleteCampaign(index)} className="absolute top-0 right-2 text-red-500 hover:text-red-700">🗑️</button> */}
  //                     <Input label="Campaign Name" name="campaignName" value={campaign.campaignName} onChange={(e) => handleCampaignChange(index, e)} />
  //                     <Input label="Industry" name="industry" value={campaign.industry} onChange={(e) => handleCampaignChange(index, e)} />
  //                     <Input label="Start Date" name="startDate" type="date" value={campaign.startDate} onChange={(e) => handleCampaignChange(index, e)} />
  //                     <Input label="End Date" name="endDate" type="date" value={campaign.endDate} onChange={(e) => handleCampaignChange(index, e)} />
  //                     <div className="col-span-2">
  //                       <label className="text-xs font-medium">Description</label>
  //                       <textarea name="description" value={campaign.description} onChange={(e) => handleCampaignChange(index, e)} className="w-full border rounded p-2" />
  //                     </div>
  //                   </div>

  //                   <InventorySelector
  //                     campaignIndex={index}
  //                     campaign={campaign}
  //                     spaces={spaces}
  //                     startDate={campaign.startDate}
  //                     endDate={campaign.endDate}
  //                     onToggleSpaceSelection={toggleSpaceSelection}
  //                     onUpdateSelectedUnits={updateSelectedUnits}
  //                     onSearchChange={handleSearchChange}
  //                   />

  //                   <div className="flex mt-4">
  //                     <button onClick={() => deleteCampaign(index)} className="mr-auto text-red-500 hover:text-red-700">🗑️</button>
  //                     <button
  //                       onClick={() => saveCampaign(index)}
  //                       className="bg-blue-500 ml-auto text-white text-xs px-4 py-1 rounded hover:bg-blue-600"
  //                     >
  //                       Save Campaign
  //                     </button>
  //                   </div>
  //                 </>
  //               )}
  //             </div>
  //           ))}

  //           <button onClick={addCampaign} className="border px-3 py-1 rounded">+ Add Campaign</button>
  //         </>
  //       )}

  //       <div className="flex justify-between mt-6">
  //         <button onClick={handleBack} className="border px-3 py-1 rounded">Back</button>
  //         <button onClick={handleNext} className="bg-black text-white px-3 py-1 rounded">Next</button>
  //       </div>
  //     </div>
  //   );
  // }

  // function Input({ label, ...props }) {
  //   return (
  //     <div className=''>
  //       <label className="text-xs font-medium">{label}</label>
  //       <input {...props} className="w-full border px-3 py-2 rounded mt-1" />
  //     </div>
  //   );
  // }


  import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import { useBookingForm } from '../context/BookingFormContext';
import InventorySelector from './BookingFormAddSpaces';

export default function BookingFormOrderInfo() {
  const navigate = useNavigate();
  const { orderInfo, setOrderInfo } = useBookingForm();
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpaces = async () => {
      const res = await fetch('http://localhost:3000/api/spaces');
      const data = await res.json();
      const transformed = data.map(space => ({
        id: space._id,
        name: space.spaceName,
        facia: space.faciaTowards,
        city: space.city,
        category: space.category,
        spaceType: space.spaceType,
        unit: space.unit,
        occupiedUnits: space.occupiedUnits,
        price: space.price,
        traded: space.traded,
        overlappingBooking: space.overlappingBooking,
        availableFrom: space.dates?.[0],
        availableTo: space.dates?.[space.dates.length - 1],
        status: space.occupiedUnits === 0 ? 'Completely available' :
                space.occupiedUnits < space.unit ? 'Partialy available' : 'Completely booked'
      }));
      setSpaces(transformed);
      setLoading(false);
    };
    fetchSpaces();
  }, []);

  const computeGlobalAvailability = () => {
    const availabilityMap = {};
    orderInfo.campaigns.forEach(campaign => {
      campaign.selectedSpaces?.forEach(space => {
        if (!availabilityMap[space.id]) {
          availabilityMap[space.id] = 0;
        }
        availabilityMap[space.id] += space.selectedUnits;
      });
    });
    return availabilityMap;
  };

  const globalAvailability = computeGlobalAvailability();

  const updateCampaign = (index, updatedCampaign) => {
    const campaigns = orderInfo.campaigns.map((c, i) => i === index ? updatedCampaign : c);
    setOrderInfo({ ...orderInfo, campaigns });
  };

  const handleCampaignChange = (index, e) => {
    const { name, value } = e.target;
    updateCampaign(index, { ...orderInfo.campaigns[index], [name]: value });
  };

  const toggleSpaceSelection = (campaignIndex, spaceId) => {
    const campaign = orderInfo.campaigns[campaignIndex];
    const exists = campaign.selectedSpaces?.find(s => s.id === spaceId);
    const updatedSelectedSpaces = exists
      ? campaign.selectedSpaces.filter(s => s.id !== spaceId)
      : [...(campaign.selectedSpaces || []), { ...spaces.find(s => s.id === spaceId), selectedUnits: 1 }];
    updateCampaign(campaignIndex, { ...campaign, selectedSpaces: updatedSelectedSpaces });
  };

  const updateSelectedUnits = (campaignIndex, spaceId, units) => {
    const campaign = orderInfo.campaigns[campaignIndex];
    const updatedSpaces = campaign.selectedSpaces.map(s =>
      s.id === spaceId ? { ...s, selectedUnits: units } : s
    );
    updateCampaign(campaignIndex, { ...campaign, selectedSpaces: updatedSpaces });
  };

  const handleSearchChange = (index, value) => {
    updateCampaign(index, { ...orderInfo.campaigns[index], searchQuery: value });
  };

  const addCampaign = () => {
    setOrderInfo({ ...orderInfo, campaigns: [...(orderInfo.campaigns || []), {
      campaignName: '', industry: '', description: '', startDate: '', endDate: '', selectedSpaces: [], searchQuery: '', isSaved: false
    }] });
  };

  const deleteCampaign = (index) => {
    const updatedCampaigns = orderInfo.campaigns.filter((_, i) => i !== index);
    setOrderInfo({ ...orderInfo, campaigns: updatedCampaigns });
  };

  const saveCampaign = (index) => {
    updateCampaign(index, { ...orderInfo.campaigns[index], isSaved: true });
  };

  const editCampaign = (index) => {
    updateCampaign(index, { ...orderInfo.campaigns[index], isSaved: false });
  };

  const handleNext = () => navigate('/booking-preview');
  const handleBack = () => navigate('/create-booking');

  return (
    <div className="p-6 md:ml-64 min-h-screen">
      <Navbar />
      <h2 className="text-2xl font-semibold mb-6">Create Order</h2>

      {loading ? <p>Loading spaces...</p> : (
        <>
          {orderInfo.campaigns?.map((campaign, index) => (
            <div key={index} className="relative border rounded p-4 mb-6 shadow-sm">
              {campaign.isSaved ? (
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{campaign.campaignName}</h3>
                    <p className="text-xs">Industry: {campaign.industry}</p>
                    <p className="text-xs">From {campaign.startDate} to {campaign.endDate}</p>
                  </div>
                  <div className="space-x-2">
                    <button onClick={() => editCampaign(index)} className="text-xs border px-3 py-1 rounded">Edit</button>
                    <button onClick={() => deleteCampaign(index)} className="text-xs border px-3 py-1 rounded text-red-500">Delete</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Campaign Name" name="campaignName" value={campaign.campaignName} onChange={(e) => handleCampaignChange(index, e)} />
                    <Input label="Industry" name="industry" value={campaign.industry} onChange={(e) => handleCampaignChange(index, e)} />
                    <Input label="Start Date" name="startDate" type="date" value={campaign.startDate} onChange={(e) => handleCampaignChange(index, e)} />
                    <Input label="End Date" name="endDate" type="date" value={campaign.endDate} onChange={(e) => handleCampaignChange(index, e)} />
                    <div className="col-span-2">
                      <label className="text-xs font-medium">Description</label>
                      <textarea name="description" value={campaign.description} onChange={(e) => handleCampaignChange(index, e)} className="w-full border rounded p-2" />
                    </div>
                  </div>

                  <InventorySelector
                    campaignIndex={index}
                    campaign={campaign}
                    spaces={spaces}
                    globalAvailability={globalAvailability}
                    startDate={campaign.startDate}
                    endDate={campaign.endDate}
                    onToggleSpaceSelection={toggleSpaceSelection}
                    onUpdateSelectedUnits={updateSelectedUnits}
                    onSearchChange={handleSearchChange}
                  />

                  <div className="flex mt-4">
                    <button onClick={() => deleteCampaign(index)} className="mr-auto text-red-500 hover:text-red-700">🗑️</button>
                    <button
                      onClick={() => saveCampaign(index)}
                      className="bg-blue-500 ml-auto text-white text-xs px-4 py-1 rounded hover:bg-blue-600"
                    >
                      Save Campaign
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          <button onClick={addCampaign} className="border px-3 py-1 rounded">+ Add Campaign</button>
        </>
      )}

      <div className="flex justify-between mt-6">
        <button onClick={handleBack} className="border px-3 py-1 rounded">Back</button>
        <button onClick={handleNext} className="bg-black text-white px-3 py-1 rounded">Next</button>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="text-xs font-medium">{label}</label>
      <input {...props} className="w-full border px-3 py-2 rounded mt-1" />
    </div>
  );
}
