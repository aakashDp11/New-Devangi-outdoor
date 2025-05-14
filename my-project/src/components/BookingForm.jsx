


import React from 'react';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import { useBookingForm } from '../context/BookingFormContext';
import { useState } from 'react';
import { toast } from 'sonner';
export default function CreateOrderBasicInfo() {
  const navigate = useNavigate();
  const { basicInfo, setBasicInfo,proposalId } = useBookingForm();
   const [step, setStep] = useState('Order');
    const [completedSteps, setCompletedSteps] = useState(['Basic']);
    const stepOrder = ['Basic', 'Order', 'Spaces'];
  

  return (
    <div className=" bg-white text-xs">
      <Navbar />
      <main className="ml-64 w-full flex-1 px-8 ">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">{proposalId?"Edit Proposal":"Create Order"}</h1>
        </div>
        <div className="flex gap-6 mb-6 text-sm font-medium">
          {stepOrder.map((label) => (
            <div
              key={label}
              className={
                step === label
                  ? 'text-black flex items-center gap-1'
                  : completedSteps.includes(label)
                  ? 'text-black flex items-center gap-1'
                  : 'text-black flex items-center gap-1'
              }
            >
              {completedSteps.includes(label) || step === label ? '' : ''}{' '}
              {label === 'Basic'
                ? 'Basic Information'
                : label === 'Order'
                ? 'Order Information'
                : 'Select Spaces'}
            </div>
          ))}
        </div>
        {/* <div className="flex space-x-8 border-b pb-4 mb-6">
          <div className="font-semibold text-black border-b-2 border-purple-700">Basic Information</div>
          <div className="text-gray-500">Order Information</div>
          <div className="text-gray-500">Select Spaces</div>
        </div> */}

        <div className="grid grid-cols-2 text-xs gap-6">
          <div>
            <label className="block text-xs font-medium">Company Name <span className="text-red-500">*</span></label>
            <input
              className="w-full p-2 border rounded mt-1"
              placeholder="Write..."
              value={basicInfo.companyName}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, companyName: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Client Name <span className="text-red-500">*</span></label>
            <input
              className="w-full p-2 border rounded mt-1"
              placeholder="Write..."
              value={basicInfo.clientName}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, clientName: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Client Email</label>
            <input
              className="w-full p-2 border rounded mt-1"
              placeholder="Write..."
              value={basicInfo.clientEmail}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, clientEmail: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Client Contact Number</label>
            <input
              className="w-full p-2 border rounded mt-1"
              placeholder="Write..."
              value={basicInfo.clientContact}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, clientContact: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Client Pan Number</label>
            <input
              className="w-full p-2 border rounded mt-1"
              placeholder="Write..."
              value={basicInfo.clientPan}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, clientPan: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Client GST Number</label>
            <input
              className="w-full p-2 border rounded mt-1"
              placeholder="Write..."
              value={basicInfo.clientGst}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, clientGst: e.target.value })
              }
            />
          </div>
          <div className="col-span-2">
  <label className="block text-xs font-medium mb-1">Campaign Images</label>
  {/* <input
    type="file"
    accept="image/*"
    multiple
    onChange={(e) => {
      const files = Array.from(e.target.files);
      const readers = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then(images => {
        setBasicInfo(prev => ({
          ...prev,
          campaignImages: [...(prev.campaignImages || []), ...images],
        }));
      });
    }}
    className="w-full border p-2 rounded mt-1"
  /> */}
  <input
  type="file"
  accept=".jpg,.jpeg,.png,.webp"
  multiple
  onChange={(e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];

    files.forEach((file) => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

      if (!isValidType) {
        toast.error(`Invalid format: ${file.name}. Only JPG, PNG, and WEBP allowed.`);
      } else if (!isValidSize) {
        toast.error(`File too large: ${file.name} exceeds 10MB limit.`);
      } else {
        validFiles.push(file);
      }
    });

    setBasicInfo(prev => ({
      ...prev,
      campaignImages: [...(prev.campaignImages || []), ...validFiles],
    }));
  }}
  className="w-full border p-2 rounded mt-1"
/>

  <div className="flex flex-wrap gap-2 mt-2">
    {basicInfo.campaignImages?.map((img, index) => (
      <div key={index} className="relative">
        <img src={img} alt={`campaign-${index}`} className="h-20 w-20 object-cover rounded border" />
        <button
          onClick={() => {
            const updated = [...basicInfo.campaignImages];
            updated.splice(index, 1);
            setBasicInfo(prev => ({
              ...prev,
              campaignImages: updated
            }));
          }}
          className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1 hover:bg-red-700"
        >
          ✕
        </button>
      </div>
    ))}
  </div>
</div>

          <div>
            <label className="block text-xs font-medium">Brand Display Name</label>
            <input
              className="w-full p-2 border rounded mt-1"
              placeholder="Write..."
              value={basicInfo.brandName}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, brandName: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium">Client Type <span className="text-red-500">*</span></label>
            <select
              className="w-full p-2 border rounded mt-1"
              value={basicInfo.clientType}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, clientType: e.target.value })
              }
            >
              <option>Select...</option>
              <option>Corporate</option>
              <option>Agency</option>
            </select>
          </div>
        </div>

        <div className="mt-8 text-sm flex">
          <button className="px-1 py-0 border rounded mr-auto transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110">Cancel</button>
          <div className="px-4 py-2 ">
            
            <button
              onClick={() => navigate('/create-booking-orderInfo')}
              className="px-3 py-1 bg-black text-white rounded transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
