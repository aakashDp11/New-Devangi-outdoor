import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "./Navbar";
import { PieChart } from "@mui/x-charts/PieChart";
import InventorySelector from "./BookingFormAddSpaces";
import { useSidebar } from "../context/SidebarContext";
import { FaArrowLeft, FaCheck, FaExclamationTriangle } from "react-icons/fa";
import axios from "axios";

// A component for displaying key-value information with fade-in animation
const InfoDetail = ({ label, value, delay = 0 }) => (
  <div 
    className="mb-3 opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards]"
    style={{ animationDelay: `${delay}ms` }}
  >
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {label}
    </p>
    <p className="text-sm text-gray-800 break-words">{value || "N/A"}</p>
  </div>
);

// Validation helper functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

const validatePAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

const validateGST = (gst) => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst);
};

const validateDate = (startDate, endDate) => {
  if (!startDate || !endDate) return { isValid: false, message: "Both dates are required" };
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (start < today) return { isValid: false, message: "Start date cannot be in the past" };
  if (end <= start) return { isValid: false, message: "End date must be after start date" };
  
  return { isValid: true, message: "" };
};

// Validation message component
const ValidationMessage = ({ message, type = "error" }) => {
  if (!message) return null;
  
  return (
    <div className={`flex items-center gap-1 mt-1 text-xs animate-[slideInDown_0.3s_ease-out] ${
      type === "error" ? "text-red-600" : type === "success" ? "text-green-600" : "text-yellow-600"
    }`}>
      {type === "error" && <FaExclamationTriangle />}
      {type === "success" && <FaCheck />}
      <span>{message}</span>
    </div>
  );
};

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [campaignDrafts, setCampaignDrafts] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    // Fetches spaces for campaign drafts
    const fetchSpaces = async () => {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/spaces/selectcampaignSpaces`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      const transformed = data.map((space) => ({
        id: space._id,
        name: space.spaceName,
        facia: space.faciaTowards,
        city: space.city,
        category: space.category,
        spaceType: space.spaceType,
        unit: space.unit,
        occupiedUnits: space.occupiedUnits,
        ownershipType: space.ownershipType,
        price: space.price,
        traded: space.traded,
        mainPhoto: space.mainPhoto,
        overlappingBooking: space.overlappingBooking,
        specification: space.specification,
        campaignDates: space.campaignDates,
        width: space.width,
        height: space.height,
        availableFrom: space.dates?.[0],
        availableTo: space.dates?.[space.dates.length - 1],
        status:
          space.occupiedUnits === 0
            ? "Completely available"
            : space.occupiedUnits < space.unit
            ? "Partially available"
            : "Completely booked",
        transitType: space.transitType,
        transitLine: space.transitLine,
      }));
      setSpaces(transformed);
    };
    fetchSpaces();
  }, []);

  useEffect(() => {
    // Fetches the main booking details
    const fetchBooking = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/bookings/${id}`
        );
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({
            message: `Failed to fetch booking (status: ${res.status})`,
          }));
          throw new Error(
            errorData.message ||
              `Failed to fetch booking (status: ${res.status})`
          );
        }
        const data = await res.json();
        setBooking(data);
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Failed to load booking details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  // Industry options for campaign drafts
  const industryOptions = [
    { value: "Tourism", label: "Tourism" },
    { value: "Retail", label: "Retail" },
    { value: "Real Estate", label: "Real Estate" },
    { value: "Other", label: "Other" },
    { value: "Movie", label: "Movie" },
    { value: "Media and Entertainment", label: "Media and Entertainment" },
    { value: "FMCG", label: "FMCG" },
    { value: "Finance", label: "Finance" },
    { value: "Financial Services", label: "Financial Services" },
    { value: "Healthcare", label: "Healthcare" },
    { value: "Hospitality", label: "Hospitality" },
    { value: "IT Industry", label: "IT Industry" },
    { value: "Automobile", label: "Automobile" },
    { value: "Clothing & Apparel", label: "Clothing & Apparel" },
    { value: "Ecommerce", label: "Ecommerce" },
    { value: "Edtech", label: "Edtech" },
    { value: "Entertainment", label: "Entertainment" },
  ];

  // Validate campaign draft
  const validateCampaignDraft = (campaign, index) => {
    const errors = {};
    const key = `campaign_${index}`;

    if (!campaign.campaignName?.trim()) {
      errors[`${key}_campaignName`] = "Campaign name is required";
    } else if (campaign.campaignName.length < 3) {
      errors[`${key}_campaignName`] = "Campaign name must be at least 3 characters";
    }

    if (!campaign.industry) {
      errors[`${key}_industry`] = "Industry is required";
    }

    if (!campaign.description?.trim()) {
      errors[`${key}_description`] = "Description is required";
    } else if (campaign.description.length < 10) {
      errors[`${key}_description`] = "Description must be at least 10 characters";
    }

    const dateValidation = validateDate(campaign.startDate, campaign.endDate);
    if (!dateValidation.isValid) {
      errors[`${key}_dates`] = dateValidation.message;
    }

    if (!campaign.selectedSpaces || campaign.selectedSpaces.length === 0) {
      errors[`${key}_spaces`] = "At least one space must be selected";
    }

    if (campaign.isFOC === undefined || campaign.isFOC === null) {
      errors[`${key}_isFOC`] = "Please specify if this is a FOC campaign";
    }

    return errors;
  };

  // Functions to manage campaign drafts
  const addDraftCampaign = () => {
    setCampaignDrafts([
      ...campaignDrafts,
      {
        campaignName: "",
        industry: "",
        description: "",
        startDate: "",
        endDate: "",
        selectedSpaces: [],
        searchQuery: "",
        isFOC: false,
      },
    ]);
  };

  const updateDraftCampaign = (index, updated) => {
    const updatedList = [...campaignDrafts];
    updatedList[index] = updated;
    setCampaignDrafts(updatedList);

    // Clear validation errors for this campaign when updating
    const newErrors = { ...validationErrors };
    const campaignKey = `campaign_${index}`;
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith(campaignKey)) {
        delete newErrors[key];
      }
    });
    setValidationErrors(newErrors);
  };

  const removeDraftCampaign = (index) => {
    setCampaignDrafts(campaignDrafts.filter((_, i) => i !== index));
    
    // Clear validation errors for removed campaign
    const newErrors = { ...validationErrors };
    const campaignKey = `campaign_${index}`;
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith(campaignKey)) {
        delete newErrors[key];
      }
    });
    setValidationErrors(newErrors);
  };

  // Saves a new campaign draft to the current booking
  const saveDraftCampaign = async (index) => {
    const campaign = campaignDrafts[index];
    const errors = validateCampaignDraft(campaign, index);
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(prev => ({ ...prev, ...errors }));
      toast.error("Please fix all validation errors before saving");
      return;
    }

    const payload = {
      ...campaign,
      isFOC: campaign.isFOC,
      spaces: campaign.selectedSpaces.map((space) => ({
        id: space.id,
        selectedUnits: space.selectedUnits,
      })),
    };
    
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/bookings/${
          booking._id
        }/campaigns`,
        payload
      );
      if (res.status === 201) {
        toast.success("Campaign added successfully");
        setCampaignDrafts([]);
        setValidationErrors({});
        setBooking((prev) => ({
          ...prev,
          campaigns: [...(prev.campaigns || []), res.data.campaign],
        }));
      } else {
        toast.error("Failed to save campaign");
      }
    } catch (err) {
      console.error("Error saving campaign:", err);
      toast.error(
        err.response?.data?.message || "Error occurred while saving campaign"
      );
    }
  };

  // Deletes a campaign from the current booking
  const handleDeleteCampaign = async (campaignId) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this campaign? This action cannot be undone."
      )
    ) {
      return;
    }
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Authentication error. Please log in again.");
      return;
    }
    try {
      const res = await axios.delete(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/campaigns/${campaignId}/booking/${booking._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 200) {
        toast.success("Campaign deleted successfully!");
        setBooking((prev) => ({
          ...prev,
          campaigns: prev.campaigns.filter((c) => c._id !== campaignId),
        }));
      } else {
        toast.error("Failed to delete campaign.");
      }
    } catch (err) {
      console.error("Error deleting campaign:", err);
      toast.error(
        err.response?.data?.error ||
          "An error occurred while deleting the campaign."
      );
    }
  };

  // Deletes the entire booking
  const handleDelete = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/bookings/${id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        toast.success("Booking deleted successfully");
        navigate("/booking-dashboard");
      } else {
        const errorData = await res
          .json()
          .catch(() => ({ message: "Delete failed" }));
        toast.error(errorData.message || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting booking");
    } finally {
      setShowDeletePopup(false);
    }
  };

  // Loading state with skeleton animation
  if (isLoading)
    return (
      <div className="flex flex-col min-h-screen bg-[#fafafb]">
        <Navbar />
        <main
          className={`flex-1 flex justify-center items-center p-6 transition-all duration-300 ${
            isCollapsed ? "lg:ml-24" : "lg:ml-64"
          }`}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <div className="text-xl text-gray-700 animate-pulse">
              Loading booking details...
            </div>
          </div>
        </main>
      </div>
    );

  if (!booking) return null;

  const totalPaid =
    booking.campaigns?.reduce(
      (sum, c) => sum + (c.pipeline?.payment?.totalPaid || 0),
      0
    ) || 0;
  const totalDue =
    booking.campaigns?.reduce(
      (sum, c) => sum + (c.pipeline?.payment?.paymentDue || 0),
      0
    ) || 0;
  const grandTotal = totalPaid + totalDue;
  
  const clientInfoData = [
    { key: "companyName", label: "Company Name", value: booking.companyName },
    { key: "clientName", label: "Client Name", value: booking.clientName },
    { key: "clientEmail", label: "Client Email", value: booking.clientEmail, validator: validateEmail },
    {
      key: "clientContactNumber",
      label: "Client Contact Number",
      value: booking.clientContactNumber,
      validator: validatePhone,
    },
    {
      key: "clientPanNumber",
      label: "Client Pan Number",
      value: booking.clientPanNumber,
      validator: validatePAN,
    },
    {
      key: "clientGstNumber",
      label: "Client Gst Number",
      value: booking.clientGstNumber,
      validator: validateGST,
    },
    {
      key: "brandDisplayName",
      label: "Brand Display Name",
      value: booking.brandDisplayName,
    },
    { key: "clientType", label: "Client Type", value: booking.clientType },
    {
      key: "bookingMode",
      label: "Booking Type",
      value: booking.bookingMode ?? "NA",
    },
    {
      key: "bookingSource",
      label: "Booking Source",
      value: booking.bookingSource ?? "NA",
    },
    {
      key: "createdAt",
      label: "Created At",
      value: new Date(booking.createdAt).toLocaleString(),
    },
  ];

  return (
    <div className="min-h-screen bg-white w-screen text-base-content">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out forwards;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out forwards;
        }
        
        .hover-scale {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        
        .hover-scale:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        
        .button-hover {
          transition: all 0.2s ease-in-out;
        }
        
        .button-hover:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
      `}</style>
      
      <Navbar />
      <main
        className={`h-full overflow-y-auto px-4 sm:px-6 py-6 transition-all duration-300 ${
          isCollapsed ? "lg:ml-24" : "lg:ml-64"
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4 opacity-0 animate-slideInLeft">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Booking Details
            </h1>
            <button
              onClick={() => navigate("/booking-dashboard")}
              className="flex items-center gap-2 text-sm mt-1 button-hover hover:text-blue-600"
            >
              <FaArrowLeft className="inline" /> Back
            </button>
          </div>
          <button
            className="bg-red-600 text-white px-4 py-2 text-xs rounded-md hover:bg-red-700 transition-all duration-150 shadow-sm button-hover"
            onClick={() => setShowDeletePopup(true)}
          >
            Delete Booking
          </button>
        </div>

        <div className="flex flex-col lg:flex-row w-full gap-6 mb-6">
          <div className="card bg-white shadow-xl p-6 rounded-lg flex-grow lg:w-2/3 opacity-0 animate-scaleIn hover-scale">
            <h2 className="text-xl font-semibold text-gray-700 mb-6 border-b pb-3">
              Client Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6">
              {clientInfoData.map(({ key, label, value, validator }, index) => {
                const isValid = validator && value ? validator(value) : true;
                
                if (key === "bookingSource" && value === "Agency") {
                  return (
                    <React.Fragment key={key}>
                      <InfoDetail label={label} value={value} delay={index * 100} />
                      <InfoDetail 
                        label="Agency Name" 
                        value={booking.agencyName ?? "NA"} 
                        delay={(index + 1) * 100} 
                      />
                    </React.Fragment>
                  );
                }
                
                return (
                  <div key={key}>
                    <InfoDetail label={label} value={value} delay={index * 100} />
                    {validator && value && (
                      <ValidationMessage 
                        message={isValid ? "" : `Invalid ${label.toLowerCase()}`}
                        type={isValid ? "success" : "error"}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div 
            className="card bg-white shadow-xl p-6 rounded-lg flex-grow lg:w-1/3 lg:max-w-md opacity-0 animate-scaleIn hover-scale"
            style={{ animationDelay: "200ms" }}
          >
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-3">
              Payment Overview
            </h2>
            {booking.isFOCBooking ? (
              <div className="flex items-center justify-center h-48">
                <p className="text-gray-500 text-md text-center">
                  This is a FOC booking
                </p>
              </div>
            ) : (
              <div>
                {totalPaid === 0 && totalDue === 0 && grandTotal === 0 ? (
                  <div className="flex items-center justify-center h-48">
                    <p className="text-gray-500 text-md text-center">
                      Please enter the payment details
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 text-xs text-gray-700 space-y-1 text-right">
                      <p>
                        <strong>Paid:</strong> ₹{totalPaid.toLocaleString()}
                      </p>
                      <p>
                        <strong>Remaining:</strong> ₹{totalDue.toLocaleString()}
                      </p>
                      <p>
                        <strong>Total Amount:</strong> ₹
                        {grandTotal.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex text-xs justify-center mt-2">
                      <PieChart
                        series={[
                          {
                            innerRadius: 45,
                            outerRadius: 70,
                            paddingAngle: 2,
                            cornerRadius: 5,
                            data: [
                              {
                                id: 0,
                                value: totalPaid,
                                label: "Paid",
                                color: "#4CAF50",
                              },
                              {
                                id: 1,
                                value: totalDue,
                                label: "Due",
                                color: "#FF9800",
                              },
                            ],
                            highlightScope: {
                              faded: "global",
                              highlighted: "item",
                            },
                            faded: {
                              innerRadius: 30,
                              additionalRadius: -5,
                              color: "gray",
                            },
                          },
                        ]}
                        width={250}
                        height={160}
                        slotProps={{
                          legend: {
                            hidden: false,
                            position: {
                              vertical: "bottom",
                              horizontal: "middle",
                            },
                            labelStyle: { fontSize: 12 },
                          },
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {booking.campaigns && booking.campaigns.length > 0 && (
          <div 
            className="opacity-0 animate-fadeInUp"
            style={{ animationDelay: "400ms" }}
          >
            <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-8 border-b pb-3">
              Campaigns ({booking.campaigns.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {booking.campaigns.map((campaign, idx) => {
                const artworkUrl = campaign.pipeline?.artwork?.documentUrl;
                return (
                  <div
                    key={campaign._id || idx}
                    className="card relative bg-white shadow-lg rounded-lg p-4 transition-all duration-300 flex flex-col justify-between hover-scale opacity-0 animate-scaleIn"
                    style={{ animationDelay: `${500 + idx * 100}ms` }}
                  >
                    <button
                      onClick={(e) => {
                        console.log("Booking id is ",booking._id);
                        console.log("Campaign id is ",campaign._id);
                        e.stopPropagation(); // Prevents navigation when clicking clone
                        navigate(
                          `/clone-campaign/${campaign._id}/from-booking/${booking._id}`
                        );
                      }}
                      className="absolute top-4 right-4 z-10 text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-md transition-all duration-200 button-hover"
                      title="Clone this campaign"
                    >
                      Clone
                    </button>

                    <div
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(`/campaign-details/${campaign._id}`)
                      }
                    >
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="flex-shrink-0 w-full sm:w-32 h-32">
                          {artworkUrl ? (
                            <img
                              src={artworkUrl}
                              alt={`${
                                campaign.campaignName || "Campaign"
                              } artwork`}
                              className="w-full h-full object-cover rounded-md bg-gray-200 transition-transform duration-200 hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md text-gray-400 text-xs text-center p-2 transition-all duration-200 hover:bg-gray-200">
                              No Artwork Uploaded
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <h3
                            className="text-lg font-semibold text-blue-600 mb-3 truncate transition-colors duration-200 hover:text-blue-800"
                            title={campaign.campaignName}
                          >
                            {campaign.campaignName || "Unnamed Campaign"}
                          </h3>
                          <div className="flex items-start gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Start Date
                              </p>
                              <p className="text-sm text-gray-800">
                                {campaign.startDate
                                  ? new Date(
                                      campaign.startDate
                                    ).toLocaleDateString("en-GB")
                                  : "N/A"}
                              </p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                End Date
                              </p>
                              <p className="text-sm text-gray-800">
                                {campaign.endDate
                                  ? new Date(
                                      campaign.endDate
                                    ).toLocaleDateString("en-GB")
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                          <InfoDetail
                            label="Description"
                            value={campaign.description}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end">
                      <button
                        onClick={() => handleDeleteCampaign(campaign._id)}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md transition-all duration-200 button-hover"
                        title="Delete this campaign"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {campaignDrafts.map((campaign, index) => (
          <div
            key={index}
            className="border rounded mt-[5%] p-4 mb-6 shadow-sm opacity-0 animate-scaleIn hover-scale bg-white"
            style={{ animationDelay: `${600 + index * 200}ms` }}
          >
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              New Campaign Draft {index + 1}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Campaign Name"
                value={campaign.campaignName}
                onChange={(e) => {
                  const updated = {
                    ...campaign,
                    campaignName: e.target.value,
                  };
                  updateDraftCampaign(index, updated);
                }}
                error={validationErrors[`campaign_${index}_campaignName`]}
                required
              />
              <CustomSelect
                label="Industry"
                name="industry"
                value={campaign.industry}
                onChange={(e) => {
                  const updated = { ...campaign, industry: e.target.value };
                  updateDraftCampaign(index, updated);
                }}
                options={industryOptions}
                error={validationErrors[`campaign_${index}_industry`]}
                required
              />
              <Input
                label="Start Date"
                type="date"
                value={campaign.startDate}
                onChange={(e) => {
                  const updated = { ...campaign, startDate: e.target.value };
                  updateDraftCampaign(index, updated);
                }}
                min={new Date().toISOString().split('T')[0]}
                error={validationErrors[`campaign_${index}_dates`]}
                required
              />
              <Input
                label="End Date"
                type="date"
                value={campaign.endDate}
                onChange={(e) => {
                  const updated = { ...campaign, endDate: e.target.value };
                  updateDraftCampaign(index, updated);
                }}
                min={campaign.startDate || new Date().toISOString().split('T')[0]}
                error={validationErrors[`campaign_${index}_dates`]}
                required
              />
              <div className="col-span-2">
                <label className="text-xs font-medium">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={campaign.description}
                  onChange={(e) => {
                    const updated = {
                      ...campaign,
                      description: e.target.value,
                    };
                    updateDraftCampaign(index, updated);
                  }}
                  className={`w-full border rounded p-2 mt-1 transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors[`campaign_${index}_description`] 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter campaign description (minimum 10 characters)"
                  rows={3}
                />
                <ValidationMessage message={validationErrors[`campaign_${index}_description`]} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium block mb-2">
                  Is this a FOC (Free of Cost) Campaign? <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-6">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={`foc-yes-${index}`}
                      name={`isFOC-${index}`}
                      value="true"
                      checked={campaign.isFOC === true}
                      onChange={(e) => {
                        const updated = {
                          ...campaign,
                          isFOC: e.target.value === "true",
                        };
                        updateDraftCampaign(index, updated);
                      }}
                      className="h-4 w-4 accent-black"
                    />
                    <label
                      htmlFor={`foc-yes-${index}`}
                      className="ml-2 text-xs font-medium cursor-pointer"
                    >
                      Yes
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={`foc-no-${index}`}
                      name={`isFOC-${index}`}
                      value="false"
                      checked={campaign.isFOC === false}
                      onChange={(e) => {
                        const updated = {
                          ...campaign,
                          isFOC: e.target.value === "false",
                        };
                        updateDraftCampaign(index, updated);
                      }}
                      className="h-4 w-4 accent-black"
                    />
                    <label
                      htmlFor={`foc-no-${index}`}
                      className="ml-2 text-xs font-medium cursor-pointer"
                    >
                      No
                    </label>
                  </div>
                </div>
                <ValidationMessage message={validationErrors[`campaign_${index}_isFOC`]} />
              </div>
            </div>
            
            <div className="mt-4">
              <InventorySelector
                campaignIndex={index}
                campaign={campaign}
                spaces={spaces}
                globalAvailability={{}}
                startDate={campaign.startDate}
                endDate={campaign.endDate}
                onToggleSpaceSelection={(i, id) => {
                  const updated = { ...campaign };
                  const exists = updated.selectedSpaces?.find((s) => s.id === id);
                  updated.selectedSpaces = exists
                    ? updated.selectedSpaces.filter((s) => s.id !== id)
                    : [
                        ...(updated.selectedSpaces || []),
                        {
                          ...spaces.find((s) => s.id === id),
                          selectedUnits: 1,
                        },
                      ];
                  updateDraftCampaign(index, updated);
                }}
                onUpdateSelectedUnits={(i, id, units) => {
                  const updated = { ...campaign };
                  updated.selectedSpaces = updated.selectedSpaces.map((s) =>
                    s.id === id ? { ...s, selectedUnits: units } : s
                  );
                  updateDraftCampaign(index, updated);
                }}
                onSearchChange={(i, query) => {
                  const updated = { ...campaign, searchQuery: query };
                  updateDraftCampaign(index, updated);
                }}
              />
              <ValidationMessage message={validationErrors[`campaign_${index}_spaces`]} />
            </div>
            
            <div className="flex mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => removeDraftCampaign(index)}
                className="mr-auto text-red-500 hover:text-red-700 transition-colors duration-200 p-2 rounded hover:bg-red-50"
                title="Delete this draft"
              >
                🗑️ Remove Draft
              </button>
              <button
                onClick={() => saveDraftCampaign(index)}
                className="bg-blue-500 ml-auto text-white text-xs px-4 py-2 rounded hover:bg-blue-600 transition-all duration-200 button-hover disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={Object.keys(validateCampaignDraft(campaign, index)).length > 0}
              >
                Save Campaign
              </button>
            </div>
          </div>
        ))}
        
        <button
          onClick={addDraftCampaign}
          className="border-2 border-dashed border-gray-300 px-4 py-3 rounded text-sm mt-4 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 text-gray-600 hover:text-blue-600"
        >
          <span className="text-lg">+</span> Add New Campaign
        </button>
      </main>

      {showDeletePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-[fadeIn_0.3s_ease-out]">
          <div 
            className="bg-white p-6 sm:p-8 rounded-lg shadow-2xl w-full max-w-md animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaExclamationTriangle className="text-red-500" />
              Confirm Deletion
            </h2>
            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to delete this booking and all its
              associated campaigns? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 sm:gap-4">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 button-hover"
                onClick={() => setShowDeletePopup(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 button-hover"
                onClick={handleDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced input component with validation
function Input({ label, error, required = false, ...props }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        {...props} 
        className={`w-full border px-3 py-2 rounded mt-1 transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
        }`}
      />
      <ValidationMessage message={error} />
    </div>
  );
}

// Enhanced select component with validation
function CustomSelect({ label, name, value, onChange, options, error, required = false }) {
  return (
    <div className="flex flex-col text-sm w-full">
      {label && (
        <label htmlFor={name} className="mb-1 text-xs font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`px-3 py-2 mt-1 border rounded-md shadow-sm transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
        }`}
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ValidationMessage message={error} />
    </div>
  );
} 