// import React, { useState } from 'react';
// import Navbar from './Navbar';
// import { useNavigate } from 'react-router-dom'
// export default function BookingFormOrderInfo() {
//     const navigate = useNavigate();
//   const [step, setStep] = useState('Order');
//   const [completedSteps, setCompletedSteps] = useState(['Basic']);
//   const [formData, setFormData] = useState({
//     campaignName: '', industry: '', description: ''
//   });

//   const stepOrder = ['Basic', 'Order', 'Spaces'];

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//   };

//   const handleNext = () => {
//     if (!completedSteps.includes(step)) {
//       setCompletedSteps(prev => [...prev, step]);
//     }
//     const currentIndex = stepOrder.indexOf(step);
//     if (currentIndex < stepOrder.length - 1) {
//       setStep(stepOrder[currentIndex + 1]);
//     }
//     navigate('/create-booking-addSpaces')
//   };

//   const handleBack = () => {
//     navigate('/create-booking')
//   };

//   return (
//     <div className="p-6 md:ml-64 min-h-screen">
//       <Navbar/>
//       <div className="max-w-screen-xl mx-auto">
//         <h2 className="text-2xl font-semibold mb-6">Create Order</h2>

//         <div className="flex gap-6 mb-6 text-sm font-medium">
//           {stepOrder.map(label => (
//             <div key={label} className={
//               step === label
//                 ? 'text-purple-600 flex items-center gap-1'
//                 : completedSteps.includes(label)
//                 ? 'text-purple-600 flex items-center gap-1'
//                 : 'text-black flex items-center gap-1'
//             }>
//               {completedSteps.includes(label) || step === label ? '✓' : ''} {label === 'Basic' ? 'Basic Information' : label === 'Order' ? 'Order Information' : 'Select Spaces'}
//             </div>
//           ))}
//         </div>

//         {step === 'Order' && (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <Input label="Campaign Name *" name="campaignName" value={formData.campaignName} onChange={handleChange} required />
//             <div>
//               <label className="text-sm font-medium">Industry *</label>
//               <select name="industry" value={formData.industry} onChange={handleChange} className="w-full border px-3 py-2 rounded mt-1">
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
//               <label className="text-sm font-medium">Description</label>
//               <textarea
//                 name="description"
//                 value={formData.description}
//                 onChange={handleChange}
//                 className="w-full border px-3 py-2 rounded mt-1"
//                 rows={4}
//                 placeholder="Maximum 400 characters"
//               />
//             </div>
//           </div>
//         )}

//         <div className="flex justify-between mt-8">
//           <button className="border px-4 py-2 rounded">Cancel</button>
//           <div className="space-x-2">
//             <button onClick={handleBack} className="bg-black text-white px-4 py-2 rounded">Back</button>
//             <button onClick={handleNext} className="bg-purple-600 text-white px-4 py-2 rounded">Next</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function Input({ label, ...props }) {
//   return (
//     <div>
//       <label className="text-sm font-medium">{label}</label>
//       <input {...props} className="w-full border px-3 py-2 rounded mt-1" />
//     </div>
//   );
// }

import React, { useState } from 'react';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import { useBookingForm } from '../context/BookingFormContext'; // ✅ Import context

export default function BookingFormOrderInfo() {
  const navigate = useNavigate();
  const { orderInfo, setOrderInfo } = useBookingForm(); // ✅ Access context

  const [step, setStep] = useState('Order');
  const [completedSteps, setCompletedSteps] = useState(['Basic']);
  const stepOrder = ['Basic', 'Order', 'Spaces'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrderInfo({ ...orderInfo, [name]: value });
  };

  const handleNext = () => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps((prev) => [...prev, step]);
    }
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
    navigate('/create-booking-addSpaces');
  };

  const handleBack = () => {
    navigate('/create-booking');
  };

  return (
    <div className="p-6 md:ml-64 min-h-screen">
      <Navbar />
      <div className="max-w-screen-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Create Order</h2>

        {/* Step Tabs */}
        <div className="flex gap-6 mb-6 text-sm font-medium">
          {/* {stepOrder.map((label) => (
            <div
              key={label}
              className={
                step === label
                  ? 'text-green-600 flex items-center gap-1'
                  : completedSteps.includes(label)
                  ? 'text-green-600 flex items-center gap-1'
                  : 'text-black flex items-center gap-1'
              }
            >
              {completedSteps.includes(label) || step === label ? '✓' : ''}{' '}
              {label === 'Basic'
                ? 'Basic Information'
                : label === 'Order'
                ? 'Order Information'
                : 'Select Spaces'}
            </div>
          ))} */}
          {stepOrder.map((label) => {
  const isCompleted = completedSteps.includes(label);
  const isCurrent = step === label;

  return (
    <div
      key={label}
      className={
        isCurrent
          ? 'text-black flex items-center gap-1'
          : isCompleted
          ? 'text-green-600 flex items-center gap-1'
          : 'text-black flex items-center gap-1'
      }
    >
      {isCompleted && !isCurrent ? '✓' : ''}{' '}
      {label === 'Basic'
        ? 'Basic Information'
        : label === 'Order'
        ? 'Order Information'
        : 'Select Spaces'}
    </div>
  );
})}

        </div>

        {/* Form */}
        {step === 'Order' && (
          <div className="grid text-xs grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-xs">
            <Input
            
              label="Campaign Name *"
              name="campaignName"
              value={orderInfo.campaignName}
              onChange={handleChange}
              required
            />
            </div>
           
            <div>
              <label className="text-xs font-medium">Industry *</label>
              <select
                name="industry"
                value={orderInfo.industry}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded mt-1"
              >
                <option value="">Select...</option>
                <option>Automotive</option>
                <option>Clothing & Apparel</option>
                <option>Ecommerce</option>
                <option>EdTech</option>
                <option>Entertainment</option>
                <option>FMCG</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium">Description</label>
              <textarea
                name="description"
                value={orderInfo.description}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded mt-1"
                rows={4}
                placeholder="Maximum 400 characters"
              />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex text-sm justify-between mt-8">
          <button className="border px-4 py-2 rounded">Cancel</button>
          <div className="space-x-2">
            <button onClick={handleBack} className="bg-black text-white px-3 py-1 rounded">
              Back
            </button>
            <button onClick={handleNext} className="bg-black text-white px-3 py-1 rounded transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110">
              Next
            </button>
          </div>
        </div>
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
