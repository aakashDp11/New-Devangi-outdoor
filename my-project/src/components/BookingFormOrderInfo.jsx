import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import { useBookingForm } from '../context/BookingFormContext';
import InventorySelector from './BookingFormAddSpaces';
import Select from 'react-select';
import { toast } from 'sonner';
import { useSidebar } from '../context/SidebarContext';

// --- Stepper component remains the same ---
function Stepper({ currentStep }) {
  const stepOrder = ['Basic', 'Order'];
  return (
    <div className="flex gap-6 mb-6 text-sm font-medium">
      {stepOrder.map((label, idx) => {
        const isCompleted = stepOrder.indexOf(currentStep) > idx;
        const isActive = currentStep === label;
        return (
          <div
            key={label}
            className={`flex items-center gap-2 pb-1 ${
              isCompleted
                ? 'text-green-600'
                : isActive
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500'
            }`}
          >
            {isCompleted && <span className="text-green-600">✔</span>}
            <span>
              {label === 'Basic' ? 'Basic Information' : 'Order Information'}
            </span>
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

  useEffect(() => {
    const fetchSpaces = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/selectcampaignSpaces`);
      const data = await res.json();
      const transformed = data.filter(space => {
        if (typeof space.isInventoryEnabled === 'undefined') return true;
        return space.isInventoryEnabled === true;
      })
      .map(space => ({
        id: space._id,
        name: space.spaceName,
        facia: space.faciaTowards,
        city: space.city,
        category: space.category,
        spaceType: space.spaceType,
        isInventoryEnabled:space.isInventoryEnabled,
        unit: space.unit,
        occupiedUnits: space.occupiedUnits,
        ownershipType: space.ownershipType,
        specification:space.specification,
        campaignDates:space.campaignDates,
        price: space.price,
        traded: space.traded,
        mainPhoto:space.mainPhoto,
        overlappingBooking: space.overlappingBooking,
        width: space.width,
        height: space.height,
        availableFrom: space.dates?.[0],
        availableTo: space.dates?.[space.dates.length - 1],
        status: space.occupiedUnits === 0
          ? 'Completely available'
          : space.occupiedUnits < space.unit
          ? 'Partialy available'
          : 'Completely booked',
        // --- FIX: Add the missing transit fields to the transformed object ---
        transitType: space.transitType,
        transitLine: space.transitLine,
        // --- END FIX ---
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
    const campaigns = orderInfo.campaigns.map((c, i) => i === index ? updatedCampaign : c);
    setOrderInfo({ ...orderInfo, campaigns });
  };

  const handleCampaignChange = (index, e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'isFOC') {
      finalValue = value === 'true';
    }

    updateCampaign(index, {
      ...orderInfo.campaigns[index],
      [name]: finalValue,
    });
  };
  
  const toggleSpaceSelection = (campaignIndex, spaceId) => {
    const campaign = orderInfo.campaigns[campaignIndex];
    const exists = campaign.selectedSpaces?.find((s) => s.id === spaceId);
    const updatedSelectedSpaces = exists
      ? campaign.selectedSpaces.filter((s) => s.id !== spaceId)
      : [...(campaign.selectedSpaces || []), { ...spaces.find((s) => s.id === spaceId), selectedUnits: 1 }];
    updateCampaign(campaignIndex, { ...campaign, selectedSpaces: updatedSelectedSpaces });
  };

  const updateSelectedUnits = (campaignIndex, spaceId, units) => {
    const campaign = orderInfo.campaigns[campaignIndex];
    const updatedSpaces = campaign.selectedSpaces.map((s) =>
      s.id === spaceId ? { ...s, selectedUnits: units } : s
    );
    updateCampaign(campaignIndex, { ...campaign, selectedSpaces: updatedSpaces });
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
  };

  const saveCampaign = (index) => {
    const campaign = orderInfo.campaigns[index];
    if (!campaign.campaignName || !campaign.industry || !campaign.startDate || !campaign.endDate) {
        toast.error("Please fill in all required fields before saving.");
        return;
    }
    updateCampaign(index, {
      ...orderInfo.campaigns[index],
      isSaved: true,
    });
  };

  const editCampaign = (index) => {
    updateCampaign(index, {
      ...orderInfo.campaigns[index],
      isSaved: false,
    });
  };

  const handleNext = () => {
    if (!orderInfo.campaigns || orderInfo.campaigns.length === 0) {
      toast.error("Please add and save at least one campaign to continue.");
      return;
    }

    const hasUnsavedCampaigns = orderInfo.campaigns.some(c => !c.isSaved);
    if (hasUnsavedCampaigns) {
      toast.error("Please save all campaigns before proceeding.");
      return;
    }
    
    navigate('/booking-preview');
  };
  
  const handleBack = () => navigate('/create-booking');

  return (
    <div className="bg-white flex">
      <Navbar />
      <main className={`flex-1 p-6 min-h-screen pb-24 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <Stepper currentStep="Order" />
        <h2 className="text-2xl font-semibold mb-6">Create Order</h2>

        {loading ? (
          <p>Loading spaces...</p>
        ) : (
          <>
            {orderInfo.campaigns?.map((campaign, index) => (
              <div key={index} className="relative border rounded p-4 mb-6 shadow-sm">
                {campaign.isSaved ? (
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{campaign.campaignName}</h3>
                      <p className="text-xs">Industry: {campaign.industry}</p>
                      <p className="text-xs">From {campaign.startDate} to {campaign.endDate}</p>
                      {campaign.isFOC && (
                        <p className="text-xs font-bold text-green-600">This is a FOC Campaign</p>
                      )}
                    </div>
                    <div className="space-x-2">
                      <button onClick={() => editCampaign(index)} className="text-xs border px-3 py-1 rounded">
                        Edit
                      </button>
                      <button onClick={() => deleteCampaign(index)} className="text-xs border px-3 py-1 rounded text-red-500">
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <Input
                        label="Campaign Name"
                        name="campaignName"
                        value={campaign.campaignName}
                        onChange={(e) => handleCampaignChange(index, e)}
                      />
                      <CustomSelect
                        label="Industry"
                        name="industry"
                        value={campaign.industry}
                        onChange={(e) => handleCampaignChange(index, e)}
                        options={industryOptions}
                      />
                      <Input
                        label="Start Date"
                        name="startDate"
                        type="date"
                        value={campaign.startDate}
                        onChange={(e) => handleCampaignChange(index, e)}
                      />
                      <Input
                        label="End Date"
                        name="endDate"
                        type="date"
                        value={campaign.endDate}
                        onChange={(e) => handleCampaignChange(index, e)}
                      />
                      <div className="col-span-2">
                        <label className="text-xs font-medium">Description</label>
                        <textarea
                          name="description"
                          value={campaign.description}
                          onChange={(e) => handleCampaignChange(index, e)}
                          className="w-full border rounded p-2 mt-1 text-xs"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="text-xs font-medium block mb-2">
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
                            <label htmlFor={`foc-yes-${index}`} className="ml-2 text-xs font-medium">
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
                            <label htmlFor={`foc-no-${index}`} className="ml-2 text-xs font-medium">
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

                    <div className="flex mt-4">
                      <button onClick={() => deleteCampaign(index)} className="mr-auto text-red-500 hover:text-red-700">
                        🗑️
                      </button>
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
            <button onClick={addCampaign} className="border px-3 py-2 rounded text-sm">
              + Add Campaign
            </button>
          </>
        )}
      </main>

      <div className={`fixed bottom-0 right-0 bg-white z-10 left-0 transition-all duration-300 ${isCollapsed ? 'lg:left-24' : 'lg:left-64'}`}>
        <div className="flex justify-between items-center w-full px-6 py-3 max-w-screen-xl mx-auto">
          <button
            type="button"
            className="border border-gray-300 bg-white text-gray-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-50"
            onClick={() => navigate('/booking-dashboard')}
          >
            Cancel
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleBack}
              className="bg-black text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-800"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="bg-black text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Input and CustomSelect components remain the same ---
function Input({ label, ...props }) {
  return (
    <div>
      <label className="text-xs font-medium">{label}</label>
      <input {...props} className="w-full border px-3 py-2 rounded mt-1 text-xs" />
    </div>
  );
}

export function CustomSelect({ label, value, onChange, name, options, mandatory }) {
  const selected = options.find((o) => o.value === value) || null;
  const customStyles = {
    control: (provided) => ({
      ...provided, minHeight: '42px', height: '42px', borderColor: 'hsl(0, 0%, 80%)', boxShadow: 'none', '&:hover': { borderColor: 'hsl(0, 0%, 70%)' },
    }),
    valueContainer: (provided) => ({ ...provided, height: '42px', padding: '0 8px' }),
    input: (provided) => ({ ...provided, fontSize: '0.75rem', margin: '0', padding: '0' }),
    singleValue: (provided) => ({ ...provided, fontSize: '0.75rem' }),
    indicatorsContainer: (provided) => ({ ...provided, height: '42px' }),
  };
  return (
    <div>
      <label className="text-xs font-medium block mb-1">
        {label}
        {mandatory === 'true' && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Select styles={customStyles} className="w-full" name={name} options={options} value={selected} onChange={(option) => onChange({ target: { name, value: option?.value || '' } })} isSearchable placeholder="Select..."/>
    </div>
  );
}