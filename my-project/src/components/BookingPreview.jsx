

// import React from 'react';
// import { toast } from 'sonner';
// import { useState } from 'react';

// import Navbar from './Navbar';
// import { useNavigate } from 'react-router-dom';
// import { useBookingForm } from '../context/BookingFormContext'; // ✅ Import context

// export default function BookingPreview() {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);

//   const { basicInfo, orderInfo, selectedSpaces, resetForm,proposalId, setProposalId } = useBookingForm(); // ✅ Assuming you have resetForm
//   const totalPrice = selectedSpaces.reduce((sum, space) => sum + (space.price || 0), 0);
//   const stepOrder = ['Basic', 'Order', 'Spaces'];


// const preparePayload = () => {
//     return {
//       companyName: basicInfo.companyName,
//       clientName: basicInfo.clientName,
//       clientEmail: basicInfo.clientEmail,
//       clientPanNumber: basicInfo.clientPan, // ✅ Match schema name
//       clientGstNumber: basicInfo.clientGst, // ✅ Match schema name
//       clientContactNumber: basicInfo.clientContact, // ✅ Match schema name
//       brandDisplayName: basicInfo.brandName, // ✅ Match schema name
//       clientType: basicInfo.clientType,
//       campaignName: orderInfo.campaignName,
//       industry: orderInfo.industry,
//       description: orderInfo.description,
//       spaces: selectedSpaces.map(space => space.id), // ✅ ONLY IDs here
//     };
//   };
  


  
// // const handleSaveProposal = async () => {
// //     setLoading(true);
// //     try {
// //       const payload = preparePayload();
// //       const response = await fetch('http://localhost:3000/api/proposals', {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify(payload),
// //       });
  
// //       if (!response.ok) {
// //         const errorData = await response.json();
// //         throw new Error(errorData.error || 'Failed to save proposal');
// //       }
  
// //       toast.success('Proposal saved successfully!');
// //       resetForm();
// //     } catch (error) {
// //       console.error('Error saving proposal:', error);
// //       toast.error(error.message || 'Something went wrong!');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };
  
// const handleSaveProposal = async () => {
//   setLoading(true);
//   try {
//     const payload = preparePayload();
//     const url = proposalId 
//       ? `http://localhost:3000/api/proposals/${proposalId}` // if editing existing proposal
//       : 'http://localhost:3000/api/proposals'; // if creating new

//     const method = proposalId ? 'PUT' : 'POST'; // ✅ choose method

//     const response = await fetch(url, {
//       method,
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(payload),
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.error || 'Failed to save proposal');
//     }

//     if (proposalId) {
//       toast.success('Proposal updated successfully!');
//     } else {
//       toast.success('Proposal saved successfully!');
//     }

//     resetForm();
//     setProposalId(null); // ✅ very important: clear id after save
//     navigate('/proposal-dashboard');
//   } catch (error) {
//     console.error('Error saving proposal:', error);
//     toast.error(error.message || 'Something went wrong!');
//   } finally {
//     setLoading(false);
//   }
// };
// const handleSubmitBooking = async () => {
//     setLoading(true);
//     try {
//       const payload = preparePayload();
//       const response = await fetch('http://localhost:3000/api/bookings', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });
  
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to submit booking');
//       }
  
//       toast.success('Booking submitted successfully!');
//       resetForm();
//       navigate('/');
//     } catch (error) {
//       console.error('Error submitting booking:', error);
//       toast.error(error.message || 'Something went wrong!');
//     } finally {
//       setLoading(false);
//     }
//   };
  

//   const handleCancel = () => {
//     if (window.confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
//       resetForm();
//       navigate('/');
//     }
//   };

//   return (
//     <div className="p-6 w-full text-xs md:ml-64 min-h-screen">
//       <Navbar />
//       <div className="max-w-screen-xl mx-auto">
//         <h2 className="text-2xl font-semibold mb-6">Review & Confirm Booking</h2>

//         {/* Stepper */}
//         <div className="flex gap-6 mb-6 text-sm font-medium">
//           {stepOrder.map((label) => (
//             <div key={label} className="text-green-600 flex items-center gap-1">
//               ✓ {label === 'Basic'
//                 ? 'Basic Information'
//                 : label === 'Order'
//                 ? 'Order Information'
//                 : 'Select Spaces'}
//             </div>
//           ))}
//         </div>

//         {/* Basic Info */}
//         <div className="grid grid-cols-2 gap-6 mb-10">
//           <PreviewField label="Company Name" value={basicInfo.companyName} />
//           <PreviewField label="Client Name" value={basicInfo.clientName} />
//           <PreviewField label="Client Email" value={basicInfo.clientEmail} />
//           <PreviewField label="Client Contact Number" value={basicInfo.clientContact} />
//           <PreviewField label="Client PAN" value={basicInfo.clientPan} />
//           <PreviewField label="Client GST" value={basicInfo.clientGst} />
//           <PreviewField label="Brand Display Name" value={basicInfo.brandName} />
//           <PreviewField label="Client Type" value={basicInfo.clientType} />
//         </div>

//         {/* Order Info */}
//         <div className="grid grid-cols-2 gap-6 mb-10">
//           <PreviewField label="Campaign Name" value={orderInfo.campaignName} />
//           <PreviewField label="Industry" value={orderInfo.industry} />
//           <div className="col-span-2">
//             <label className="text-sm font-medium">Campaign Description</label>
//             <p className="border rounded px-3 py-2 mt-1 bg-gray-50">{orderInfo.description}</p>
//           </div>
//         </div>

//         {/* Selected Spaces */}
//         <div className="mb-10">
//           <h3 className="font-semibold mb-2">Selected Spaces</h3>
//           <div className="overflow-x-auto border rounded">
//             <table className="min-w-full text-sm">
//               <thead className="bg-gray-100">
//                 <tr>
//                   <th className="px-4 py-2">#</th>
//                   <th className="px-4 py-2">Space Name</th>
//                   <th className="px-4 py-2">Status</th>
//                   <th className="px-4 py-2">Facia</th>
//                   <th className="px-4 py-2">City</th>
//                   <th className="px-4 py-2">Category</th>
//                   <th className="px-4 py-2">Subcategory</th>
//                   <th className="px-4 py-2">Price</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {selectedSpaces.map((space, idx) => (
//                   <tr key={space.id} className="text-center border-t">
//                     <td className="px-2 py-2">{idx + 1}</td>
//                     <td className="px-2 py-2 text-left text-purple-700">{space.name}</td>
//                     <td className="px-2 py-2">
//                       <span className={`px-2 py-1 text-xs rounded-full font-medium ${space.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
//                         {space.status}
//                       </span>
//                     </td>
//                     <td className="px-2 py-2">{space.facia}</td>
//                     <td className="px-2 py-2">{space.city}</td>
//                     <td className="px-2 py-2">{space.category}</td>
//                     <td className="px-2 py-2">{space.subCategory || '-'}</td>
//                     <td className="px-2 py-2">₹{space.price?.toLocaleString()}</td>
//                   </tr>
//                 ))}
//               </tbody>
//               <tfoot className="bg-gray-50 font-semibold">
//                 <tr>
//                   <td colSpan="7" className="text-right px-4 py-2">Total Price:</td>
//                   <td className="px-4 py-2">₹{totalPrice.toLocaleString()}</td>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//         </div>

//         {/* Actions */}
//         <div className="flex text-xs justify-between mt-6">
//           <div>
//             <button onClick={handleCancel} className="border px-3 py-1 rounded">
//               Cancel
//             </button>
//             <button onClick={() => navigate('/create-booking-addSpaces')} className="ml-4 bg-black text-white px-3 py-1 rounded">
//               Back
//             </button>
//           </div>

//           <div className="space-x-2 ml-auto">
//           <button
//   onClick={handleSaveProposal}
//   className="bg-black text-white px-3 py-1 rounded disabled:opacity-50 transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
//   disabled={loading}
// >
//   {loading ? 'Saving...' : 'Save as Proposal'}
// </button>

// <button
//   onClick={handleSubmitBooking}
//   className="bg-orange-500 text-white px-3 py-1 rounded disabled:opacity-50 transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
//   disabled={loading}
// >
//   {loading ? 'Submitting...' : 'Submit'}
// </button>

//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function PreviewField({ label, value }) {
//   return (
//     <div>
//       <label className="text-sm font-medium">{label}</label>
//       <p className="border rounded px-3 py-2 mt-1 bg-gray-50">{value || '-'}</p>
//     </div>
//   );
// }
import React from 'react';
import { toast } from 'sonner';
import { useState } from 'react';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import { useBookingForm } from '../context/BookingFormContext';

export default function BookingPreview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { basicInfo, orderInfo, selectedSpaces, resetForm, proposalId, setProposalId } = useBookingForm();
  const totalPrice = selectedSpaces.reduce((sum, space) => sum + ((space.price || 0) * (space.selectedUnits || 1)), 0);
  const stepOrder = ['Basic', 'Order', 'Spaces'];

  const handleSubmitBooking = async () => {
    setLoading(true);
    try {
      const formData = new FormData();

      // Basic Info
      formData.append("companyName", basicInfo.companyName);
      formData.append("clientName", basicInfo.clientName);
      formData.append("clientEmail", basicInfo.clientEmail);
      formData.append("clientPanNumber", basicInfo.clientPan);
      formData.append("clientGstNumber", basicInfo.clientGst);
      formData.append("clientContactNumber", basicInfo.clientContact);
      formData.append("brandDisplayName", basicInfo.brandName);
      formData.append("clientType", basicInfo.clientType);

      // Order Info
      formData.append("campaignName", orderInfo.campaignName);
      formData.append("industry", orderInfo.industry);
      formData.append("description", orderInfo.description);

      // Spaces
      selectedSpaces.forEach((space) => {
        formData.append("spaces", JSON.stringify({ id: space.id, selectedUnits: space.selectedUnits || 1 }));
      });

      // Campaign Images
      if (basicInfo.campaignImages && basicInfo.campaignImages.length) {
        basicInfo.campaignImages.forEach((file) => {
          formData.append("campaignImages", file);
        });
      }

      const response = await fetch("http://localhost:3000/api/bookings", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit booking");
      }

      toast.success("Booking submitted successfully!");
      resetForm();
      navigate("/");
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast.error(error.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProposal = async () => {
    setLoading(true);
    try {
      const payload = {
        companyName: basicInfo.companyName,
        clientName: basicInfo.clientName,
        clientEmail: basicInfo.clientEmail,
        clientPanNumber: basicInfo.clientPan,
        clientGstNumber: basicInfo.clientGst,
        clientContactNumber: basicInfo.clientContact,
        brandDisplayName: basicInfo.brandName,
        clientType: basicInfo.clientType,
        campaignName: orderInfo.campaignName,
        industry: orderInfo.industry,
        description: orderInfo.description,
        spaces: selectedSpaces.map(space => ({ id: space.id, selectedUnits: space.selectedUnits || 1 })),
      };

      const url = proposalId
        ? `http://localhost:3000/api/proposals/${proposalId}`
        : 'http://localhost:3000/api/proposals';

      const method = proposalId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save proposal');
      }

      toast.success(proposalId ? 'Proposal updated successfully!' : 'Proposal saved successfully!');
      resetForm();
      setProposalId(null);
      navigate('/proposal-dashboard');
    } catch (error) {
      console.error('Error saving proposal:', error);
      toast.error(error.message || 'Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
      resetForm();
      navigate('/');
    }
  };

  return (
    <div className="p-6 w-full text-xs md:ml-64 min-h-screen">
      <Navbar />
      <div className="max-w-screen-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Review & Confirm Booking</h2>

        {/* Stepper */}
        <div className="flex gap-6 mb-6 text-sm font-medium">
          {stepOrder.map((label) => (
            <div key={label} className="text-green-600 flex items-center gap-1">
              ✓ {label === 'Basic'
                ? 'Basic Information'
                : label === 'Order'
                ? 'Order Information'
                : 'Select Spaces'}
            </div>
          ))}
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <PreviewField label="Company Name" value={basicInfo.companyName} />
          <PreviewField label="Client Name" value={basicInfo.clientName} />
          <PreviewField label="Client Email" value={basicInfo.clientEmail} />
          <PreviewField label="Client Contact Number" value={basicInfo.clientContact} />
          <PreviewField label="Client PAN" value={basicInfo.clientPan} />
          <PreviewField label="Client GST" value={basicInfo.clientGst} />
          <PreviewField label="Brand Display Name" value={basicInfo.brandName} />
          <PreviewField label="Client Type" value={basicInfo.clientType} />
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <PreviewField label="Campaign Name" value={orderInfo.campaignName} />
          <PreviewField label="Industry" value={orderInfo.industry} />
          <div className="col-span-2">
            <label className="text-sm font-medium">Campaign Description</label>
            <p className="border rounded px-3 py-2 mt-1 bg-gray-50">{orderInfo.description}</p>
          </div>
        </div>

        {/* Campaign Images */}
        {basicInfo.campaignImages?.length > 0 && (
          <div className="mb-10">
            <h3 className="font-semibold mb-2">Campaign Images</h3>
            <div className="flex flex-wrap gap-4">
              {basicInfo.campaignImages.map((img, index) => (
                <div key={index} className="w-32 h-32 relative border rounded overflow-hidden shadow-sm">
                  <img
                    src={typeof img === 'string' ? img : URL.createObjectURL(img)}
                    alt={`Campaign ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Spaces */}
        <div className="mb-10">
          <h3 className="font-semibold mb-2">Selected Spaces</h3>
          <div className="overflow-x-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Space Name</th>
                  <th className="px-4 py-2">Space Type</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Facia</th>
                  <th className="px-4 py-2">City</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Occupied</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Selected</th>
                  <th className="px-4 py-2">Price</th>
                </tr>
              </thead>
              <tbody>
                {selectedSpaces.map((space, idx) => (
                  <tr key={space.id} className="text-center border-t">
                    <td className="px-2 py-2">{idx + 1}</td>
                    <td className="px-2 py-2 text-left text-purple-700">{space.name}</td>
                    <td className="px-2 py-2">{space.spaceType}</td>
                    <td className="px-2 py-2">{space.status}</td>
                    <td className="px-2 py-2">{space.facia}</td>
                    <td className="px-2 py-2">{space.city}</td>
                    <td className="px-2 py-2">{space.category}</td>
                    <td className="px-2 py-2">{space.occupiedUnits}</td>
                    <td className="px-2 py-2">{space.unit}</td>
                    <td className="px-2 py-2">{space.selectedUnits}</td>
                    <td className="px-2 py-2">₹{(space.price * (space.selectedUnits || 1)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td colSpan="10" className="text-right px-4 py-2">Total Price:</td>
                  <td className="px-4 py-2">₹{totalPrice.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex text-xs justify-between mt-6">
          <div>
            <button onClick={handleCancel} className="border px-3 py-1 rounded">
              Cancel
            </button>
            <button onClick={() => navigate('/create-booking-addSpaces')} className="ml-4 bg-black text-white px-3 py-1 rounded">
              Back
            </button>
          </div>

          <div className="space-x-2 ml-auto">
            <button
              onClick={handleSaveProposal}
              className="bg-black text-white px-3 py-1 rounded disabled:opacity-50 transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save as Proposal'}
            </button>

            <button
              onClick={handleSubmitBooking}
              className="bg-orange-500 text-white px-3 py-1 rounded disabled:opacity-50 transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewField({ label, value }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <p className="border rounded px-3 py-2 mt-1 bg-gray-50">{value || '-'}</p>
    </div>
  );
}

