import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import { useBookingForm } from '../context/BookingFormContext';
import InventorySelector from './BookingFormAddSpaces';
import Select from 'react-select';
import { toast } from 'sonner';
import { useSidebar } from '../context/SidebarContext';
import { FiAlertCircle } from "react-icons/fi";
import { FaArrowLeft, FaCheck } from "react-icons/fa";

// --- REUSABLE UI COMPONENTS (COPIED FROM ADDSPACEFORM.JSX) ---

// Card component with a flowing gradient animation on the background
const Card = ({ children, className = "", ...props }) => (
  <div
    className={`
      bg-gray-100 bg-opacity-80 shadow-xl rounded-2xl w-full flex flex-col relative overflow-hidden
      ${className}
    `}
    {...props}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white via-indigo-50 to-purple-50 opacity-20 animate-bg-gradient-flow-diagonal z-0"></div>
    <div className="relative z-10 h-full flex flex-col">{children}</div>
  </div>
);

// CardContent component for consistent padding and layout
const CardContent = ({ children, className = "" }) => (
  <div className={`p-4 md:p-6 flex-grow flex flex-col ${className}`}>
    {children}
  </div>
);

// Button component with consistent styling and loading state
const Button = ({ children, className = "", disabled = false, loading = false, ...props }) => (
  <button
    className={`px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-medium transition-all duration-200 transform hover:scale-105 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {children}
      </div>
    ) : (
      children
    )}
  </button>
);

// Input component with a more polished look and error handling
const Input = ({ className = "", label, mandatory = false, error = null, ...props }) => (
  <div className="relative w-full">
    <label className="text-sm font-medium text-gray-700 block mb-1">
      {label}
      {mandatory && <span className="ml-1 text-red-500">*</span>}
    </label>
    <input
      className={`border ${
        error ? "border-red-300" : "border-gray-200"
      } px-4 py-2 rounded-xl w-full bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md h-10 ${className}`}
      {...props}
    />
    {error && (
      <p className="absolute -bottom-5 left-0 text-red-500 text-xs mt-1 animate-slideDown">
        {error}
      </p>
    )}
  </div>
);

function DateInput({ label, error, allowPastDates = false, minDate, ...props }) {
  const getMinDate = () => {
    if (minDate) {
      return minDate;
    }
    if (!allowPastDates) {
      const today = new Date();
      return today.toISOString().split('T')[0];
    }
    return undefined;
  };

  const handleFocus = (e) => {
    if (e.target.showPicker) {
      e.target.showPicker();
    }
  };

  return (
    <div className="relative w-full">
      <label className="text-sm font-medium text-gray-700 block mb-1">
        {label}
        <span className="ml-1 text-red-500">*</span>
      </label>
      <input
        {...props}
        type="date"
        min={getMinDate()}
        onFocus={handleFocus}
        className={`border ${
          error ? "border-red-300" : "border-gray-200"
        } px-4 py-2 rounded-xl w-full bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md h-10`}
      />
      {error && (
        <p className="absolute -bottom-5 left-0 text-red-500 text-xs mt-1 animate-slideDown">
          {error}
        </p>
      )}
    </div>
  );
}

// Reusable CustomSelect component
export function CustomSelect({ mandatory = false, label, value, onChange, name, options, error, placeholder = "Select..." }) {
  const formattedValue = options.find((option) => option.value === value) || null;
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: error ? '#ef4444' : '#D1D5DB',
      boxShadow: state.isFocused ? '0 0 0 1px #2563EB' : 'none',
      '&:hover': {
        borderColor: error ? '#ef4444' : '#9CA3AF',
      },
      borderRadius: '12px',
      padding: '4px 8px',
      minHeight: '40px',
      transition: 'all 0.2s',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9CA3AF',
      fontSize: '0.875rem',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#4B5563',
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#E5E7EB' : null,
      color: '#374151',
      '&:active': { backgroundColor: '#D1D5DB' },
      fontSize: '0.875rem',
    }),
  };

  return (
    <div className="flex flex-col space-y-1 w-full">
      <label className="text-sm font-medium text-gray-700 block">
        {label}
        {mandatory && <span className="ml-1 text-red-500">*</span>}
      </label>
      <Select
        className="w-full"
        name={name}
        options={options}
        value={formattedValue}
        onChange={(selectedOption) => onChange({ target: { name, value: selectedOption?.value || "" } })}
        isSearchable
        styles={customStyles}
        placeholder={placeholder}
      />
      {error && (
        <span className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <FiAlertCircle className="inline-block" /> {error}
        </span>
      )}
    </div>
  );
}

// --- Stepper component remains the same ---
function Stepper({ currentStep }) {
  const stepOrder = ['Basic', 'Order'];
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 text-sm font-medium border-b border-gray-200 animate-fadeIn">
      {stepOrder.map((label, idx) => {
        const isCompleted = stepOrder.indexOf(currentStep) > idx;
        const isActive = currentStep === label;
        return (
          <div
            key={label}
            className={`flex items-center gap-2 pb-2 cursor-pointer transition-colors duration-200
              ${isCompleted
                ? "text-green-600 border-green-600"
                : isActive
                ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]"
                : "text-gray-500"}
            `}
          >
            <span className={`${isCompleted ? "text-green-600" : "text-gray-400"}`}>
              {isCompleted ? <FaCheck /> : <span className="text-xl leading-none">•</span>}
            </span>
            {label} Information
          </div>
        );
      })}
    </div>
  );
}

// --- industryOptions remains the same ---
const industryOptions = [
  { value: 'Tourism', label: 'Tourism' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Other', label: 'Other' },
  { value: 'Movie', label: 'Movie' },
  { value: 'Media and Entertainment', label: 'Media and Entertainment' },
  { value: 'FMCG', label: 'FMCG' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Financial Services', label: 'Financial Services' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Hospitality', label: 'Hospitality' },
  { value: 'IT Industry', label: 'IT Industry' },
  { value: 'Automobile', label: 'Automobile' },
  { value: 'Clothing & Apparel', label: 'Clothing & Apparel' },
  { value: 'Ecommerce', label: 'Ecommerce' },
  { value: 'Edtech', label: 'Edtech' },
  { value: 'Entertainment', label: 'Entertainment' },
];

export default function BookingFormOrderInfo() {
  const navigate = useNavigate();
  const { orderInfo, setOrderInfo } = useBookingForm();
  const { isCollapsed } = useSidebar();
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Track validation errors for campaigns
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchSpaces = async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/spaces/selectcampaignSpaces`
      );
      const data = await res.json();
      const transformed = data
        .filter((space) => {
          if (typeof space.isInventoryEnabled === 'undefined') return true;
          return space.isInventoryEnabled === true;
        })
        .map((space) => ({
          id: space._id,
          name: space.spaceName,
          facia: space.faciaTowards,
          city: space.city,
          category: space.category,
          spaceType: space.spaceType,
          isInventoryEnabled: space.isInventoryEnabled,
          unit: space.unit,
          occupiedUnits: space.occupiedUnits,
          ownershipType: space.ownershipType,
          specification: space.specification,
          campaignDates: space.campaignDates,
          price: space.price,
          traded: space.traded,
          mainPhoto: space.mainPhoto,
          overlappingBooking: space.overlappingBooking,
          width: space.width,
          height: space.height,
          availableFrom: space.dates?.[0],
          availableTo: space.dates?.[space.dates.length - 1],
          status:
            space.occupiedUnits === 0
              ? 'Completely available'
              : space.occupiedUnits < space.unit
              ? 'Partialy available'
              : 'Completely booked',
          transitType: space.transitType,
          transitLine: space.transitLine,
        }));
      setSpaces(transformed);
      setLoading(false);
    };
    fetchSpaces();
  }, []);

  const computeGlobalAvailability = () => {
    const availabilityMap = {};
    orderInfo.campaigns?.forEach((campaign) => {
      campaign.selectedSpaces?.forEach((space) => {
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
    const campaigns = orderInfo.campaigns.map((c, i) =>
      i === index ? updatedCampaign : c
    );
    setOrderInfo({ ...orderInfo, campaigns });
  };

  const validateCampaign = (campaign) => {
    const newErrors = {};

    if (!campaign.campaignName || campaign.campaignName.trim().length < 3) {
      newErrors.campaignName =
        'Campaign name is required and must be at least 3 characters.';
    } else if (!/^[a-zA-Z0-9\s]+$/.test(campaign.campaignName)) {
      newErrors.campaignName = 'Campaign name must not contain special characters.';
    }

    if (!campaign.industry) {
      newErrors.industry = 'Industry is required.';
    }

    if (!campaign.startDate) {
      newErrors.startDate = 'Start date is required.';
    }

    if (!campaign.endDate) {
      newErrors.endDate = 'End date is required.';
    } else if (campaign.startDate && new Date(campaign.endDate) < new Date(campaign.startDate)) {
      newErrors.endDate = 'End date must be on or after start date.';
    }

    if (campaign.description && campaign.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters.';
    }

    if (!campaign.selectedSpaces || campaign.selectedSpaces.length === 0) {
      newErrors.selectedSpaces = 'At least one space must be selected.';
    }

    return newErrors;
  };

  const handleCampaignChange = (index, e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'isFOC') {
      finalValue = value === 'true';
    }

    const updated = {
      ...orderInfo.campaigns[index],
      [name]: finalValue,
    };

    if (name === 'startDate' && updated.endDate) {
      const startDate = new Date(value);
      const endDate = new Date(updated.endDate);
      if (endDate < startDate) {
        updated.endDate = '';
        toast.info('End date cleared because it was before the new start date.');
      }
    }

    updateCampaign(index, updated);

    const validationErrors = validateCampaign(updated);
    setErrors((prev) => ({ ...prev, [index]: validationErrors }));
  };

  const toggleSpaceSelection = (campaignIndex, spaceId) => {
    const campaign = orderInfo.campaigns[campaignIndex];
    const exists = campaign.selectedSpaces?.find((s) => s.id === spaceId);
    const updatedSelectedSpaces = exists
      ? campaign.selectedSpaces.filter((s) => s.id !== spaceId)
      : [
          ...(campaign.selectedSpaces || []),
          { ...spaces.find((s) => s.id === spaceId), selectedUnits: 1 },
        ];
    const updated = { ...campaign, selectedSpaces: updatedSelectedSpaces };
    updateCampaign(campaignIndex, updated);
    const validationErrors = validateCampaign(updated);
    setErrors((prev) => ({ ...prev, [campaignIndex]: validationErrors }));
  };

  const updateSelectedUnits = (campaignIndex, spaceId, units) => {
    const campaign = orderInfo.campaigns[campaignIndex];
    const updatedSpaces = campaign.selectedSpaces.map((s) =>
      s.id === spaceId ? { ...s, selectedUnits: units } : s
    );
    const updated = { ...campaign, selectedSpaces: updatedSpaces };
    updateCampaign(campaignIndex, updated);
  };

  const handleSearchChange = (index, value) => {
    updateCampaign(index, {
      ...orderInfo.campaigns[index],
      searchQuery: value,
    });
  };

  const addCampaign = () => {
    setOrderInfo({
      ...orderInfo,
      campaigns: [
        ...(orderInfo.campaigns || []),
        {
          campaignName: '',
          industry: '',
          description: '',
          startDate: '',
          endDate: '',
          selectedSpaces: [],
          searchQuery: '',
          isSaved: false,
          isFOC: false,
        },
      ],
    });
  };

  const deleteCampaign = (index) => {
    const updatedCampaigns = orderInfo.campaigns.filter((_, i) => i !== index);
    setOrderInfo({ ...orderInfo, campaigns: updatedCampaigns });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const saveCampaign = (index) => {
    const campaign = orderInfo.campaigns[index];
    const validationErrors = validateCampaign(campaign);

    if (Object.keys(validationErrors).length > 0) {
      setErrors((prev) => ({ ...prev, [index]: validationErrors }));
      toast.error('Please fix validation errors before saving.');
      return;
    }

    updateCampaign(index, {
      ...orderInfo.campaigns[index],
      isSaved: true,
    });
    setErrors((prev) => ({ ...prev, [index]: {} }));
  };

  const editCampaign = (index) => {
    updateCampaign(index, {
      ...orderInfo.campaigns[index],
      isSaved: false,
    });
  };

  const handleNext = () => {
    if (!orderInfo.campaigns || orderInfo.campaigns.length === 0) {
      toast.error('Please add and save at least one campaign to continue.');
      return;
    }

    const hasUnsavedCampaigns = orderInfo.campaigns.some((c) => !c.isSaved);
    if (hasUnsavedCampaigns) {
      toast.error('Please save all campaigns before proceeding.');
      return;
    }

    navigate('/booking-preview');
  };

  const handleBack = () => navigate('/create-booking');

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-[var(--color-text)] flex flex-col lg:flex-row overflow-hidden`}>
      <Navbar />
      <main
        className={`flex-1 overflow-y-auto px-4 md:px-6 py-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}
      >
        <div className="max-w-screen-xl w-full mx-auto">
          <div className="flex justify-between items-center mb-6 animate-slideDown">
            <Button onClick={() => navigate(-1)} className="bg-gray-700 text-white">
              <FaArrowLeft className="inline mr-2" /> Back
            </Button>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-6 animate-slideDown">
            Create Order
          </h1>

          <Stepper currentStep="Order" />

          {loading ? (
            <p>Loading spaces...</p>
          ) : (
            <>
              {orderInfo.campaigns?.map((campaign, index) => (
                <Card key={index} className="relative mb-6">
                  <CardContent>
                    {campaign.isSaved ? (
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">{campaign.campaignName}</h3>
                          <p className="text-xs text-gray-600">Industry: {campaign.industry}</p>
                          <p className="text-xs text-gray-600">
                            From {campaign.startDate} to {campaign.endDate}
                          </p>
                          {campaign.isFOC && (
                            <p className="text-xs font-bold text-green-600 mt-1">
                              This is a FOC Campaign
                            </p>
                          )}
                        </div>
                        <div className="space-x-2">
                          <Button
                            onClick={() => editCampaign(index)}
                            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => deleteCampaign(index)}
                            className="bg-red-100 text-red-700 hover:bg-red-200"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          <Input
                            label="Campaign Name"
                            name="campaignName"
                            value={campaign.campaignName}
                            onChange={(e) => handleCampaignChange(index, e)}
                            error={errors[index]?.campaignName}
                          />
                          <CustomSelect
                            label="Industry"
                            name="industry"
                            value={campaign.industry}
                            onChange={(e) => handleCampaignChange(index, e)}
                            options={industryOptions}
                            error={errors[index]?.industry}
                          />
                          <DateInput
                            label="Start Date"
                            name="startDate"
                            value={campaign.startDate}
                            onChange={(e) => handleCampaignChange(index, e)}
                            error={errors[index]?.startDate}
                            allowPastDates={true}
                          />
                          <DateInput
                            label="End Date"
                            name="endDate"
                            value={campaign.endDate}
                            onChange={(e) => handleCampaignChange(index, e)}
                            error={errors[index]?.endDate}
                            minDate={campaign.startDate}
                            allowPastDates={false}
                          />
                          <div className="col-span-full flex flex-col space-y-1">
                            <label className="text-sm font-medium text-gray-700">Description</label>
                            <textarea
                              name="description"
                              value={campaign.description}
                              onChange={(e) => handleCampaignChange(index, e)}
                              className="w-full block border px-3 py-2 rounded-xl text-sm h-24 border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              maxLength={400}
                            />
                            {errors[index]?.description && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[index]?.description}
                              </p>
                            )}
                          </div>
                          <div className="col-span-full">
                            <label className="text-sm font-medium text-gray-700 block mb-2">
                              Is this a FOC (Free of Cost) Campaign?
                            </label>
                            <div className="flex items-center gap-6">
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  id={`foc-yes-${index}`}
                                  name="isFOC"
                                  value="true"
                                  checked={campaign.isFOC === true}
                                  onChange={(e) => handleCampaignChange(index, e)}
                                  className="h-4 w-4 accent-black"
                                />
                                <label
                                  htmlFor={`foc-yes-${index}`}
                                  className="ml-2 text-sm font-medium text-gray-600"
                                >
                                  Yes
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  id={`foc-no-${index}`}
                                  name="isFOC"
                                  value="false"
                                  checked={campaign.isFOC === false}
                                  onChange={(e) => handleCampaignChange(index, e)}
                                  className="h-4 w-4 accent-black"
                                />
                                <label
                                  htmlFor={`foc-no-${index}`}
                                  className="ml-2 text-sm font-medium text-gray-600"
                                >
                                  No
                                </label>
                              </div>
                            </div>
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
                        {errors[index]?.selectedSpaces && (
                          <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                             <FiAlertCircle className="inline-block" /> {errors[index]?.selectedSpaces}
                          </p>
                        )}

                        <div className="flex mt-6 justify-between">
                          <Button
                            onClick={() => deleteCampaign(index)}
                            className="bg-red-100 text-red-700 hover:bg-red-200"
                          >
                            Delete Campaign
                          </Button>
                          <Button
                            onClick={() => saveCampaign(index)}
                            className="bg-green-600 text-white hover:bg-green-700"
                          >
                            Save Campaign
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
              <Button onClick={addCampaign} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                + Add Campaign
              </Button>
            </>
          )}
        </div>
      </main>

      <div
        className={`fixed bottom-0 right-0 bg-white z-10 left-0 transition-all duration-300 border-t border-gray-200 ${isCollapsed ? 'lg:left-24' : 'lg:left-64'}`}
      >
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-xl mx-auto">
          <Button onClick={() => navigate('/booking-dashboard')} className="bg-gray-700 hover:bg-gray-800">
            Cancel
          </Button>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleBack}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              className="bg-[var(--color-primary)] text-white hover:bg-blue-700"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes bg-gradient-flow-diagonal { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
        .animate-bg-gradient-flow-diagonal { background-size: 200% 200%; animation: bg-gradient-flow-diagonal 10s linear infinite; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
        .animate-slideIn { animation: slideIn 0.4s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}