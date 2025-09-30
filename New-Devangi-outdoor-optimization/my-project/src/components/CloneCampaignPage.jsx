import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom"; // <-- CORRECTED
import { toast } from "sonner";
import axios from "axios";
import { FaArrowLeft, FaExclamationTriangle, FaClone, FaSave } from "react-icons/fa"; // Added FaClone and FaSave
import Navbar from "./Navbar";
import { useSidebar } from "../context/SidebarContext";

// --- REUSABLE UI COMPONENTS (COPIED FROM EditProposal.jsx for consistent styling) ---

// Card component with gradient background flair
const Card = ({ children, className = '', ...props }) => (
  <div
    className={`
      bg-white shadow-xl rounded-2xl w-full flex flex-col relative overflow-hidden transition duration-300
      ${className}
    `}
    {...props}
  >
    <div className='absolute inset-0 bg-gradient-to-br from-white via-indigo-50 to-purple-50 opacity-20 animate-bg-gradient-flow-diagonal z-0'></div>
    <div className='relative z-10 h-full flex flex-col'>{children}</div>
  </div>
);

// CardContent component for consistent padding
const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 md:p-8 flex-grow flex flex-col ${className}`}>
    {children}
  </div>
);

// Button component with consistent styling and loading state
const Button = ({ children, className = '', disabled = false, loading = false, ...props }) => (
  <button
    className={`px-6 py-2 rounded-xl bg-black text-white text-sm font-medium transition-all duration-200 transform hover:scale-105 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? (
      <div className='flex items-center gap-2'>
        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
        {children}
      </div>
    ) : (
      children
    )}
  </button>
);

// Input component with polished look
const InputField = ({ label, name, value, onChange, placeholder, type = 'text', rows = 1, required = false }) => (
  <div className="w-full">
    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
    {rows > 1 ? (
      <textarea
        name={name}
        value={value || ''}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        required={required}
        className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 
                   bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all duration-200"
      ></textarea>
    ) : (
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 
                   bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all duration-200"
      />
    )}
  </div>
);

// 🔹 Availability Badge (Original)
const AvailabilityBadge = ({ availabilityStatus }) => {
  let colorClasses, text;
  switch (availabilityStatus) {
    case "Completely booked":
    case "Booked":
      colorClasses = "bg-red-100 text-red-700";
      text = "Booked";
      break;
    case "Partially available":
    case "Partialy available":
      colorClasses = "bg-yellow-100 text-yellow-700";
      text = "Partially Available";
      break;
    case "Overlapping booking":
      colorClasses = "bg-orange-100 text-orange-700";
      text = "Overlapping";
      break;
    default:
      colorClasses = "bg-green-100 text-green-700";
      text = "Available";
      break;
  }
  return (
    <span
      className={`px-2.5 py-1 text-xs font-medium rounded-full ${colorClasses}`}
    >
      {text}
    </span>
  );
};

// --- MAIN COMPONENT ---

export default function CloneCampaignPage() {
  const { campaignId, bookingId } = useParams();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();

  const [campaign, setCampaign] = useState(null);
  const [originalCampaignData, setOriginalCampaignData] = useState({
    bookingName: "",
    spaceNames: [],
  });
  const [originalInventories, setOriginalInventories] = useState([]);
  const [originalBooking, setOriginalBooking] = useState(null);

  const [formData, setFormData] = useState({
    campaignName: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const [isFOC, setIsFOC] = useState(false);
  const cloneOption = "same"; // Hardcoded
  
  // const [allBookings, setAllBookings] = useState([]); // Removed unused state
  // const [selectedBookings, setSelectedBookings] = useState([]); // Removed unused state

  const [allInventories, setAllInventories] = useState([]);
  const [selectedInventories, setSelectedInventories] = useState([]);
  const [inventorySearch, setInventorySearch] = useState("");

  const [conflictingInventories, setConflictingInventories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Renamed isLoading to isSubmitting for the final action

  // 🔹 Fetch campaign details
  useEffect(() => {
    const fetchCampaignDetails = async () => {
      setIsLoading(true);
      try {
        if (!campaignId) {
          toast.error("No campaign ID provided.");
          navigate(-1);
          return;
        }

        const token = localStorage.getItem("accessToken");
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/campaigns/${campaignId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const campaignData = res.data;
        setCampaign(campaignData);

        setFormData({
          campaignName: `Copy of ${campaignData.campaignName}`,
          startDate: campaignData.startDate
            ? campaignData.startDate.split("T")[0]
            : "",
          endDate: campaignData.endDate
            ? campaignData.endDate.split("T")[0]
            : "",
          description: campaignData.description || "",
        });

        setIsFOC(campaignData.isFOC || false);

        setOriginalCampaignData({
          bookingName: campaignData.bookingName || "N/A",
          spaceNames: campaignData.spaceNames || [],
        });

        setOriginalBooking(campaignData.booking);

        // FIX: Properly extract original inventories
        let spacesData = campaignData.spaces || campaignData.inventories || campaignData.spaceIds;
        
        if (spacesData && Array.isArray(spacesData) && spacesData.length > 0) {
          const originalInvs = spacesData.map(space => {
            const spaceId = space._id || space.id || space.spaceId || space;
            // Ensure we are handling raw IDs (strings) or full objects
            return {
              _id: typeof space === 'string' ? space : spaceId,
              spaceName: space.spaceName || space.name || 'Unknown Space',
              address: space.address || 'N/A',
              city: space.city || 'N/A',
              spaceType: space.spaceType || space.category || 'N/A',
              availability: space.availability || "Available",
              ownershipType: space.ownershipType || 'N/A',
              selectedUnits: space.selectedUnits || []
            };
          }).filter(inv => inv._id);
          
          setOriginalInventories(originalInvs);
          
          const inventoryIds = originalInvs.map(inv => inv._id);
          setSelectedInventories(inventoryIds);
        } else {
          setOriginalInventories([]);
          setSelectedInventories([]);
        }

      } catch (error) {
        console.error("❌ Error fetching campaign details:", error);
        toast.error("Failed to fetch campaign details.");
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaignDetails();
  }, [campaignId, navigate]);

  // 🔹 Fetch all inventories (now runs concurrently with campaign fetch)
  useEffect(() => {
    const fetchInventories = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/bookings/inventories-for-selection`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAllInventories(res.data);
      } catch (error) {
        toast.error("Failed to fetch inventory list.");
      }
    };
    fetchInventories();
  }, []);

  // 🔹 Check availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (isFOC) {
        setConflictingInventories([]);
        return;
      }
      if (
        selectedInventories.length === 0 ||
        !formData.startDate ||
        !formData.endDate ||
        new Date(formData.endDate) < new Date(formData.startDate)
      ) {
        setConflictingInventories([]);
        return;
      }
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/campaigns/check-availability`,
          {
            spaceIds: selectedInventories,
            startDate: formData.startDate,
            endDate: formData.endDate,
            campaignIdToIgnore: campaignId,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setConflictingInventories(res.data.conflictingSpaceIds || []);
      } catch (error) {
        toast.error("Could not verify inventory availability.");
      }
    };
    const handler = setTimeout(() => {
      checkAvailability();
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [selectedInventories, formData.startDate, formData.endDate, campaignId, isFOC]);

  // 🔹 Handlers
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleInventorySelectionToggle = (invId) => {
    setSelectedInventories((prev) =>
      prev.includes(invId)
        ? prev.filter((id) => id !== invId)
        : [...prev, invId]
    );
  };

  const executeClone = async () => {
    // 🔹 Validation checks
    if (!formData.campaignName.trim()) {
      toast.error("Campaign name is required.");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error("Start date and end date are required.");
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error("End date must be after start date.");
      return;
    }

    if (selectedInventories.length === 0) {
      toast.error("Please select at least one inventory.");
      return;
    }

    const hasConflicts = !isFOC && conflictingInventories.length > 0;
    if (hasConflicts) {
      toast.error(
        "Cannot clone campaign with conflicting inventories. Please deselect them or mark as FOC."
      );
      return;
    }

    if (!bookingId) {
      toast.error("No booking ID found to clone into.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("accessToken");
      
      const clonePayload = {
        campaignName: formData.campaignName.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description || "",
        inventoryIds: selectedInventories,
        isFOC: isFOC,
      };
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/campaigns/${campaignId}/clone/${bookingId}`,
        clonePayload,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (response.status === 201 || response.status === 200) {
        toast.success("Campaign cloned successfully!");
        // Assuming successful clone navigates back to the booking details page
        navigate(`/booking/${bookingId}`); 
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }

    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           'An unknown error occurred while cloning.';
      toast.error(`Failed to clone campaign: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔹 Filtered inventories memo
  const searchedInventories = useMemo(() => {
    if (!inventorySearch) return allInventories;
    const searchLower = inventorySearch.toLowerCase();
    return allInventories.filter(
      (inv) =>
        inv.spaceName?.toLowerCase().includes(searchLower) ||
        inv.address?.toLowerCase().includes(searchLower) ||
        inv.city?.toLowerCase().includes(searchLower)
    );
  }, [allInventories, inventorySearch]);

  // 🔹 Other inventories memo
  const otherInventories = useMemo(() => {
    const originalIds = new Set(originalInventories.map((inv) => inv._id));
    const listToFilter = inventorySearch ? searchedInventories : allInventories;

    // Filter out any item that is already in originalInventories AND is selected/filtered
    return listToFilter.filter((inv) => !originalIds.has(inv._id));
  }, [searchedInventories, allInventories, inventorySearch, originalInventories]);

  if (isLoading || !campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-gray-900 flex flex-col lg:flex-row overflow-hidden">
        <Navbar />
        <main 
            className={`flex-1 flex items-center justify-center p-6 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}
        >
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-500 text-sm mt-3">
              Loading campaign details for cloning...
            </div>
          </div>
        </main>
      </div>
    );
  }

  const hasConflicts = !isFOC && conflictingInventories.length > 0;

  // 🔹 Reusable row
  const InventoryRow = ({ inv }) => {
    const isSelected = selectedInventories.includes(inv._id);
    const isConflicting = !isFOC && conflictingInventories.includes(inv._id);
    return (
      <tr
        className={`transition-colors text-xs ${
          isSelected
            ? isConflicting
              ? "bg-red-100" // Lighter red for selected conflict
              : "bg-indigo-50" // Indigo highlight for selected
            : "bg-white"
        } ${isConflicting ? "hover:bg-red-200" : "hover:bg-gray-50"}`}
      >
        <td className="p-3 text-center">
          <input
            type="checkbox"
            className="h-4 w-4 accent-indigo-600"
            checked={isSelected}
            onChange={() => handleInventorySelectionToggle(inv._id)}
          />
        </td>
        <td className="p-3">
          <div className="font-medium text-gray-800">{inv.spaceName}</div>
          <div className="text-xs text-gray-500">{inv.address}</div>
          {isConflicting && (
            <div className="text-red-600 font-semibold text-xs mt-1">
              Date Conflict! ⚠️
            </div>
          )}
        </td>
        <td className="p-3">{inv.city}</td>
        <td className="p-3">{inv.spaceType}</td>
        <td className="p-3">
          <AvailabilityBadge availabilityStatus={inv.availability} />
        </td>
        <td className="p-3">{inv.ownershipType}</td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-gray-900 flex flex-col lg:flex-row overflow-hidden">
      <Navbar />
      <main
        className={`flex-1 w-full overflow-y-auto px-4 md:px-8 py-8 transition-all duration-300 ${
          isCollapsed ? "lg:ml-24" : "lg:ml-64"
        }`}
      >
        <div className="max-w-5xl mx-auto animate-slideDown">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Clone Campaign</h1>
            <Button
              onClick={() => navigate(-1)}
              className="bg-black text-white hover:bg-gray-800"
            >
              <FaArrowLeft className="inline mr-2" /> Back
            </Button>
          </div>
        </div>

        {/* Form Card */}
        <Card className="max-w-5xl mx-auto shadow-2xl animate-slideUp">
          <CardContent className="space-y-6">
            <h2 className='text-xl font-bold text-gray-800 border-b pb-2'>New Campaign Details</h2>
            
            <div>
              <InputField 
                label="Campaign Name" 
                name="campaignName" 
                value={formData.campaignName} 
                onChange={handleChange}
                required
              />
              <div className="text-xs text-gray-500 mt-2 pl-1 space-y-0.5">
                <p>
                  <strong>Cloned from Campaign:</strong> "
                  {campaign.campaignName}"
                </p>
                <p>
                  <strong>Original Booking:</strong> "
                  {originalCampaignData.bookingName}"
                </p>
                {originalCampaignData.spaceNames.length > 0 && (
                  <p>
                    <strong>Original Spaces:</strong> "
                    {originalCampaignData.spaceNames.join(", ")}"
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Start Date"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
              <InputField
                label="End Date"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>

            <InputField 
              label="Description" 
              name="description" 
              value={formData.description} 
              onChange={handleChange}
              rows={3}
              placeholder="Enter a description for the cloned campaign"
            />

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-semibold text-gray-700">
                  Clone Target
                </label>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="clone-same"
                    name="cloneOption"
                    value="same"
                    checked={cloneOption === "same"}
                    readOnly
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <label
                    htmlFor="clone-same"
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    Clone in the same Booking: <strong className="text-indigo-600">{originalCampaignData.bookingName}</strong>
                  </label>
                </div>
              </div>
              
              {/* FOC Checkbox (Restyled to match InputField family) */}
              <div className="flex items-center p-3 rounded-xl border border-gray-300 shadow-sm bg-gray-50/50">
                <input
                  type="checkbox"
                  id="is-foc"
                  checked={isFOC}
                  onChange={(e) => setIsFOC(e.target.checked)}
                  className="h-5 w-5 accent-purple-600 cursor-pointer"
                />
                <label
                  htmlFor="is-foc"
                  className="ml-3 text-sm font-medium text-purple-700 flex items-center gap-2 cursor-pointer"
                >
                  Mark as Free of Charge (FOC)
                </label>
                <p className="text-xs text-gray-500 ml-auto hidden sm:block">
                  (FOC campaigns bypass availability checks)
                </p>
              </div>
            </div>


            <div className="border-t pt-4">
              <label className="text-sm font-semibold block mb-2 text-gray-800">
                Select Inventories ({selectedInventories.length} selected)
              </label>
              <input
                type="text"
                placeholder="Search inventories by name, city, address..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 
                           bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm mb-4 transition-all duration-200"
              />

              {hasConflicts && (
                <div className="p-4 mb-4 bg-red-100 border-l-4 border-red-500 text-red-800 text-sm font-medium rounded-md shadow-inner">
                  <FaExclamationTriangle className="inline mr-2" />
                  **Conflict Warning:** Some selected inventories are booked for the chosen dates. Please deselect them or check the FOC box to proceed.
                </div>
              )}

              <div className="border border-gray-200 rounded-xl mt-1 max-h-96 overflow-y-auto shadow-inner">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 border-b">
                    <tr>
                      <th scope="col" className="p-3 w-10">
                        Add
                      </th>
                      <th scope="col" className="p-3">
                        Inventory Name
                      </th>
                      <th scope="col" className="p-3">
                        City
                      </th>
                      <th scope="col" className="p-3">
                        Category
                      </th>
                      <th scope="col" className="p-3">
                        Status
                      </th>
                      <th scope="col" className="p-3">
                        Ownership
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {originalInventories.length > 0 && (
                      <tr className="bg-indigo-50/70 font-semibold sticky top-[38px] z-10 border-t border-b border-indigo-200">
                        <td className="p-3 text-xs text-indigo-800" colSpan="6">
                          Original Inventories ({originalInventories.length})
                        </td>
                      </tr>
                    )}
                    {originalInventories.map((inv) => (
                      <InventoryRow key={inv._id} inv={inv} />
                    ))}

                    {otherInventories.length > 0 && (
                      <tr className="bg-gray-200/70 font-semibold sticky top-[76px] z-10 border-t border-b border-gray-300">
                        <td className="p-3 text-xs text-gray-800" colSpan="6">
                          Available Inventories ({otherInventories.length})
                        </td>
                      </tr>
                    )}
                    {otherInventories.map((inv) => (
                      <InventoryRow key={inv._id} inv={inv} />
                    ))}

                    {originalInventories.length === 0 &&
                      otherInventories.length === 0 && (
                        <tr>
                          <td
                            colSpan="6"
                            className="text-center p-4 text-gray-500"
                          >
                            No inventories found.
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-end pt-4 border-t mt-8">
                <Button 
                  onClick={() => navigate(-1)} 
                  disabled={isSubmitting} 
                  className="bg-gray-300 text-gray-800 hover:bg-gray-400 mr-4"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={executeClone} 
                  className='bg-indigo-600 text-white hover:bg-indigo-700'
                  loading={isSubmitting}
                  disabled={isSubmitting || hasConflicts || selectedInventories.length === 0}
                  title={hasConflicts ? "Cannot clone due to date conflicts" : selectedInventories.length === 0 ? "Please select at least one inventory" : ""}
                >
                  <FaClone className="inline mr-2"/>
                  {isSubmitting ? 'Cloning...' : 'Clone Campaign'}
                </Button>
              </div>
          </CardContent>
        </Card>
      </main>

      {/* Global CSS for Animations (Copied from EditProposal.jsx) */}
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bg-gradient-flow-diagonal { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
        .animate-bg-gradient-flow-diagonal {
          background-size: 200% 200%;
          animation: bg-gradient-flow-diagonal 10s linear infinite;
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
        .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}