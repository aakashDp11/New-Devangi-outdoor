import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { FaArrowLeft, FaExclamationTriangle } from "react-icons/fa";
import Navbar from "./Navbar";
import { useSidebar } from "../context/SidebarContext";

// Reusable Input component
function Input({ label, ...props }) {
  return (
    <div>
      <label className="text-xs font-medium">{label}</label>
      <input {...props} className="w-full border px-3 py-2 rounded mt-1" />
    </div>
  );
}

// AvailabilityBadge component
const AvailabilityBadge = ({ availabilityStatus }) => {
  let colorClasses, text;
  switch (availabilityStatus) {
    case 'Completely booked': case 'Booked': colorClasses = 'bg-red-100 text-red-700'; text = 'Booked'; break;
    case 'Partially available': case 'Partialy available': colorClasses = 'bg-yellow-100 text-yellow-700'; text = 'Partially Available'; break;
    case 'Overlapping booking': colorClasses = 'bg-orange-100 text-orange-700'; text = 'Overlapping'; break;
    default: colorClasses = 'bg-green-100 text-green-700'; text = 'Available'; break;
  }
  return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${colorClasses}`}>{text}</span>;
};


export default function CloneCampaignPage() {
  const { campaignId, bookingId } = useParams();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [campaign, setCampaign] = useState(null);
  
  const [originalCampaignData, setOriginalCampaignData] = useState({
    bookingName: '',
    spaceNames: []
  });

  // State to hold original items for separate display
  const [originalInventories, setOriginalInventories] = useState([]);
  const [originalBooking, setOriginalBooking] = useState(null);

  const [formData, setFormData] = useState({
    campaignName: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const [isFOC, setIsFOC] = useState(false); // <--- New state for FOC

  // const [cloneOption, setCloneOption] = useState("same"); // Commented out
  const cloneOption = "same"; // Hardcoded to "same"
  const [allBookings, setAllBookings] = useState([]);
  const [selectedBookings, setSelectedBookings] = useState([]);
  
  const [allInventories, setAllInventories] = useState([]);
  const [selectedInventories, setSelectedInventories] = useState([]);
  const [inventorySearch, setInventorySearch] = useState('');

  const [conflictingInventories, setConflictingInventories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Effect to fetch original campaign details
  useEffect(() => {
    const fetchCampaignDetails = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/campaigns/${campaignId}`, { headers: { Authorization: `Bearer ${token}` } });
        const campaignData = res.data;
        console.log("Campaign data is cloning",campaignData);
        setCampaign(campaignData);
        setFormData({
          campaignName: `Copy of ${campaignData.campaignName}`,
          startDate: campaignData.startDate ? campaignData.startDate.split("T")[0] : "",
          endDate: campaignData.endDate ? campaignData.endDate.split("T")[0] : "",
          description: campaignData.description,
        });
        setIsFOC(campaignData.isFOC || false); // <--- Initialize FOC state from original campaign

        setOriginalCampaignData({
            bookingName: campaignData.bookingName || 'N/A',
            spaceNames: campaignData.spaceNames || [],
        });
        
        // Set original items from the rich API response
        setOriginalBooking(campaignData.booking);
        const originalInvs = campaignData.spaces.map(s => ({ ...s.id, selectedUnits: s.selectedUnits }));
        setOriginalInventories(originalInvs);

        // Pre-select the original inventories by default
        setSelectedInventories(originalInvs.map(inv => inv._id));

      } catch (error) {
        toast.error("Failed to fetch campaign details.");
        navigate(-1);
      }
    };
    fetchCampaignDetails();
  }, [campaignId, navigate]);

 
  useEffect(() => {
    const fetchInventories = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/bookings/inventories-for-selection`, { headers: { Authorization: `Bearer ${token}` } });
        setAllInventories(res.data);
      } catch (error) { toast.error("Failed to fetch inventory list."); }
    };
    fetchInventories();
  }, []);

  // Effect to check for inventory availability on changes
  useEffect(() => {
    const checkAvailability = async () => {
      // If FOC, we assume no conflicts, so clear conflictingInventories
      if (isFOC) {
        setConflictingInventories([]);
        return;
      }

      if (selectedInventories.length === 0 || !formData.startDate || !formData.endDate || new Date(formData.endDate) < new Date(formData.startDate)) {
        setConflictingInventories([]);
        return;
      }
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/campaigns/check-availability`,
          { spaceIds: selectedInventories, startDate: formData.startDate, endDate: formData.endDate, campaignIdToIgnore: campaignId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setConflictingInventories(res.data.conflictingSpaceIds || []);
      } catch (error) {
        toast.error("Could not verify inventory availability.");
      }
    };
    const handler = setTimeout(() => { checkAvailability(); }, 500);
    return () => { clearTimeout(handler); };
  }, [selectedInventories, formData.startDate, formData.endDate, campaignId, isFOC]); // Added isFOC to dependencies

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
  // const handleBookingSelectionToggle = (bId) => { setSelectedBookings((prev) => prev.includes(bId) ? prev.filter((id) => id !== bId) : [...prev, bId]); }; // Commented out
  const handleInventorySelectionToggle = (invId) => { setSelectedInventories((prev) => prev.includes(invId) ? prev.filter((id) => id !== invId) : [...prev, invId]); };

  const executeClone = async () => {
    if (!isFOC && conflictingInventories.length > 0) { // Only check conflicts if NOT FOC
        toast.error("Cannot clone campaign with conflicting inventories. Please deselect them.");
        return;
    }
    setIsLoading(true);
    const token = localStorage.getItem("accessToken");
    const clonePayload = { 
        ...formData, 
        campaignName: formData.campaignName || `Copy of ${campaign.campaignName}`, 
        inventoryIds: selectedInventories,
        isFOC: isFOC, // <--- Include the isFOC state here
    };
    const targetBookingIds = cloneOption === "same" ? [bookingId] : selectedBookings;
    if (cloneOption === "other" && targetBookingIds.length === 0) {
      toast.error("Please select at least one booking to clone into.");
      setIsLoading(false);
      return;
    }
    try {
      const clonePromises = targetBookingIds.map((id) => axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/campaigns/${campaignId}/clone/${id}`, clonePayload, { headers: { Authorization: `Bearer ${token}` } }));
      const results = await Promise.allSettled(clonePromises);
      const successCount = results.filter(r => r.status === "fulfilled" && r.value.status === 201).length;
      if (successCount > 0) { toast.success(`${successCount} campaign(s) cloned successfully!`); navigate(`/booking/${bookingId}`); }
      if (successCount < results.length) { toast.error("Some campaigns failed to clone."); }
    } catch (err) {
      toast.error(err.response?.data?.error || "An error occurred while cloning.");
    } finally {
      setIsLoading(false);
    }
  };
    
  // Memoized lists to separate original items from others - otherBookings is no longer needed
  // const otherBookings = useMemo(() => {
  //   if (!originalBooking) return allBookings;
  //   return allBookings.filter(b => b._id !== originalBooking._id);
  // }, [allBookings, originalBooking]);

  const searchedInventories = useMemo(() => {
    if (!inventorySearch) return allInventories;
    return allInventories.filter(inv => 
        inv.spaceName?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        inv.address?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        inv.city?.toLowerCase().includes(inventorySearch.toLowerCase())
    );
  }, [allInventories, inventorySearch]);

  const otherInventories = useMemo(() => {
    const originalIds = new Set(originalInventories.map(inv => inv._id));
    const listToFilter = inventorySearch ? searchedInventories : allInventories;
    return listToFilter.filter(inv => !originalIds.has(inv._id));
  }, [searchedInventories, allInventories, inventorySearch, originalInventories]);


  if (!campaign) {
    return (
       <div className="flex flex-col min-h-screen bg-[#fafafb]"><Navbar /><main className={`flex-1 flex justify-center items-center p-6 transition-all duration-300 ${isCollapsed ? "lg:ml-24" : "lg:ml-64"}`}><div className="text-xl text-gray-700">Loading campaign...</div></main></div>
    );
  }

  // Conflicts are only relevant if the campaign is NOT FOC
  const hasConflicts = !isFOC && conflictingInventories.length > 0; 

  // Reusable row component for inventory table
  const InventoryRow = ({ inv }) => {
    const isSelected = selectedInventories.includes(inv._id);
    // Display conflict only if the campaign is NOT FOC
    const isConflicting = !isFOC && conflictingInventories.includes(inv._id); 
    return (
      <tr className={`transition-colors ${isSelected ? (isConflicting ? 'bg-red-200' : 'bg-green-50') : 'bg-white'} ${isConflicting ? 'hover:bg-red-200' : 'hover:bg-gray-50'}`}>
        <td className="p-2 text-center"><input type="checkbox" className="h-4 w-4 accent-green-600" checked={isSelected} onChange={() => handleInventorySelectionToggle(inv._id)}/></td>
        <td className="p-2"><div>{inv.spaceName}</div><div className="text-xs text-gray-500">{inv.address}</div>{isConflicting && <div className="text-red-600 font-semibold text-xs mt-1">Date Conflict</div>}</td>
        <td className="p-2">{inv.city}</td><td className="p-2">{inv.spaceType}</td><td className="p-2"><AvailabilityBadge availabilityStatus={inv.availability} /></td><td className="p-2">{inv.ownershipType}</td>
      </tr>
    );
  };
  
  return (
    <div className="min-h-screen bg-white w-screen text-base-content">
      <Navbar />
      <main className={`h-full overflow-y-auto px-4 sm:px-6 py-6 transition-all duration-300 ${ isCollapsed ? "lg:ml-24" : "lg:ml-64" }`}>
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Clone Campaign</h1>
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm mt-1"><FaArrowLeft className="inline" /> Back to Booking Details</button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-xl w-full">
                <div className="space-y-4">
                    
                    <div>
                        <Input label="Campaign Name" name="campaignName" value={formData.campaignName} onChange={handleChange}/>
                        <div className="text-xs text-gray-500 mt-1 pl-1 space-y-0.5">
                            <p><strong>Cloned from Campaign:</strong> "{campaign.campaignName}"</p>
                            <p><strong>Original Booking:</strong> "{originalCampaignData.bookingName}"</p>
                            {originalCampaignData.spaceNames.length > 0 && (
                                <p><strong>Original Spaces:</strong> "{originalCampaignData.spaceNames.join(', ')}"</p>
                            )}
                        </div>
                    </div>
                    
                    {/* FOC Checkbox */}
                    <div className="flex items-center mt-2">
                        <input
                            type="checkbox"
                            id="is-foc"
                            checked={isFOC}
                            onChange={(e) => setIsFOC(e.target.checked)}
                            className="h-4 w-4 accent-blue-600"
                        />
                        <label htmlFor="is-foc" className="ml-2 text-sm font-medium text-gray-700">
                            Mark as Free of Charge (FOC)
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Start Date" name="startDate" type="date" value={formData.startDate} onChange={handleChange}/>
                        <Input label="End Date" name="endDate" type="date" value={formData.endDate} onChange={handleChange}/>
                    </div>
                    <div>
                        <label className="text-xs font-medium">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} className="w-full border rounded p-2 mt-1"/>
                    </div>
                    <div className="border-t pt-4">
                        <label className="text-sm font-semibold block mb-2">Clone Options</label>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center">
                                <input type="radio" id="clone-same" name="cloneOption" value="same" checked={cloneOption === "same"} onChange={() => { /* setCloneOption("same") */ }} className="h-4 w-4 accent-black"/>
                                <label htmlFor="clone-same" className="ml-2 text-sm font-medium">Clone in the same Booking</label>
                            </div>
                            {/* Commented out "Clone in another Booking" option */}
                            {/* <div className="flex items-center">
                                <input type="radio" id="clone-other" name="cloneOption" value="other" checked={cloneOption === "other"} onChange={() => setCloneOption("other")} className="h-4 w-4 accent-black"/>
                                <label htmlFor="clone-other" className="ml-2 text-sm font-medium">Clone in another Booking</label>
                            </div> */}
                        </div>
                    </div>
                    {/* Commented out the "Select Bookings" section for "other" clone option */}
                    {/* {cloneOption === 'other' && (
                        <div>
                            <label className="text-xs font-medium">Select Bookings</label>
                            <div className="border rounded-md mt-1 max-h-48 overflow-y-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                        <tr>
                                            <th scope="col" className="p-2 w-10">Select</th>
                                            <th scope="col" className="p-2">Company Name</th>
                                            <th scope="col" className="p-2">Client Name</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {originalBooking && <tr className="bg-blue-100 font-semibold"><td className="p-2 text-center text-xs" colSpan="3">Original Booking</td></tr>}
                                        {originalBooking && (
                                          <tr className="bg-blue-50 hover:bg-blue-100">
                                            <td className="p-2 text-center"><input type="checkbox" className="h-4 w-4 accent-blue-600" checked={selectedBookings.includes(originalBooking._id)} onChange={() => handleBookingSelectionToggle(originalBooking._id)}/></td>
                                            <td className="p-2">{originalBooking.companyName}</td>
                                            <td className="p-2">{originalBooking.clientName}</td>
                                          </tr>
                                        )}
                                        {otherBookings.length > 0 && <tr className="bg-gray-100 font-semibold"><td className="p-2 text-center text-xs" colSpan="3">Other Bookings</td></tr>}
                                        {otherBookings.map(b => (
                                          <tr key={b._id} className="bg-white hover:bg-gray-50">
                                            <td className="p-2 text-center"><input type="checkbox" className="h-4 w-4 accent-blue-600" checked={selectedBookings.includes(b._id)} onChange={() => handleBookingSelectionToggle(b._id)}/></td>
                                            <td className="p-2">{b.companyName}</td>
                                            <td className="p-2">{b.clientName}</td>
                                          </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )} */}

                    <div className="border-t pt-4">
                        <label className="text-sm font-semibold block mb-2">Select Inventories</label>
                         <input type="text" placeholder="Search inventories by name, city, address..." value={inventorySearch} onChange={e => setInventorySearch(e.target.value)} className="w-full px-3 py-2 text-xs border rounded-md mb-2"/>
                        {hasConflicts && (
                            <div className="p-3 mb-2 bg-red-50 border-l-4 border-red-400 text-red-700 text-xs">
                                <FaExclamationTriangle className="inline mr-2" />
                                Some selected inventories are booked for these dates. Please deselect them.
                            </div>
                        )}
                        <div className="border rounded-md mt-1 max-h-56 overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                    <tr>
                                        <th scope="col" className="p-2 w-10">Add</th>
                                        <th scope="col" className="p-2">Inventory Name</th>
                                        <th scope="col" className="p-2">City</th>
                                        <th scope="col" className="p-2">Category</th>
                                        <th scope="col" className="p-2">Availability</th>
                                        <th scope="col" className="p-2">Ownership</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {originalInventories.length > 0 && <tr className="bg-gray-100 font-semibold"><td className="p-2 text-xs" colSpan="6">Original Inventories</td></tr>}
                                    {originalInventories.map(inv => <InventoryRow key={inv._id} inv={inv} />)}

                                    {otherInventories.length > 0 && <tr className="bg-gray-100 font-semibold"><td className="p-2 text-xs" colSpan="6">Add Extra Inventories</td></tr>}
                                    {otherInventories.map(inv => <InventoryRow key={inv._id} inv={inv} />)}
                                    
                                    {(originalInventories.length === 0 && otherInventories.length === 0) && (<tr><td colSpan="6" className="text-center p-4 text-gray-500">No inventories found.</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => navigate(-1)} disabled={isLoading}>Cancel</button>
                    <button 
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed" 
                        onClick={executeClone} 
                        disabled={isLoading || hasConflicts} 
                        title={hasConflicts ? "Cannot clone with conflicting inventories" : ""}
                    >
                        {isLoading ? "Cloning..." : "Clone Campaign"}
                    </button>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}