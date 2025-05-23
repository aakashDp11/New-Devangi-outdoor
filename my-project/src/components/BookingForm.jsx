

import React from 'react';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import { useBookingForm } from '../context/BookingFormContext';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CreateOrderBasicInfo() {
  const navigate = useNavigate();
  const { basicInfo, setBasicInfo, proposalId } = useBookingForm();
  const [step, setStep] = useState('Order');
  const [completedSteps, setCompletedSteps] = useState(['Basic']);
  const stepOrder = ['Basic', 'Order', 'Spaces'];

  return (
    <div className="bg-white text-xs">
      <Navbar />
      <main className="ml-64 w-full flex-1 px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">{proposalId ? "Edit Proposal" : "Create Order"}</h1>
        </div>

        <div className="flex gap-6 mb-6 text-sm font-medium">
          {stepOrder.map((label) => (
            <div
              key={label}
              className={
                step === label || completedSteps.includes(label)
                  ? 'text-black flex items-center gap-1'
                  : 'text-black flex items-center gap-1'
              }
            >
              {label === 'Basic'
                ? 'Basic Information'
                : label === 'Order'
                ? 'Order Information'
                : 'Select Spaces'}
            </div>
          ))}
        </div>

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

          {/* Image Upload and Preview */}
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1">Client logo</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
                const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

                if (!isValidType) {
                  toast.error(`Invalid format: ${file.name}. Only JPG, PNG, and WEBP allowed.`);
                  return;
                }

                if (!isValidSize) {
                  toast.error(`File too large: ${file.name} exceeds 10MB limit.`);
                  return;
                }

                const imageUrl = URL.createObjectURL(file);

                setBasicInfo(prev => ({
                  ...prev,
                  // campaignImages: [{ file, preview: imageUrl }],
                  companyLogo:{ file, preview: imageUrl }
                }));
              }}
              className="w-[30%] p-1 rounded mt-1"
            />

            <div className="flex flex-wrap gap-2 mt-2">
              {basicInfo.companyLogo &&
                <div className="relative">
                  <img
                    src={basicInfo?.companyLogo.preview}
                    alt={`campaign`}
                    className="h-20 w-20 object-cover rounded border"
                  />
                  <button
                    onClick={() => {
                      setBasicInfo(prev => ({
                        ...prev,
                        companyLogo: '',
                      }));
                    }}
                    className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1 hover:bg-red-700"
                  >
                    ✕
                  </button>
                </div>
              }
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
