import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "./Navbar";
import { PieChart } from "@mui/x-charts/PieChart";
import InventorySelector from "./BookingFormAddSpaces";
import { useSidebar } from "../context/SidebarContext";
import { FaArrowLeft } from "react-icons/fa";
import axios from "axios";

// A component for displaying key-value information
const InfoDetail = ({ label, value }) => (
  <div className="mb-3">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {label}
    </p>
    <p className="text-sm text-gray-800 break-words">{value || "N/A"}</p>
  </div>
);

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [campaignDrafts, setCampaignDrafts] = useState([]);
  const [spaces, setSpaces] = useState([]);
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
  };

  const removeDraftCampaign = (index) => {
    setCampaignDrafts(campaignDrafts.filter((_, i) => i !== index));
  };

  // Saves a new campaign draft to the current booking
  const saveDraftCampaign = async (index) => {
    const campaign = campaignDrafts[index];
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

  // Loading state
  if (!booking)
    return (
      <div className="flex flex-col min-h-screen bg-[#fafafb]">
        <Navbar />
        <main
          className={`flex-1 flex justify-center items-center p-6 transition-all duration-300 ${
            isCollapsed ? "lg:ml-24" : "lg:ml-64"
          }`}
        >
          <div className="text-xl text-gray-700">
            Loading booking details...
          </div>
        </main>
      </div>
    );

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
    { key: "clientEmail", label: "Client Email", value: booking.clientEmail },
    {
      key: "clientContactNumber",
      label: "Client Contact Number",
      value: booking.clientContactNumber,
    },
    {
      key: "clientPanNumber",
      label: "Client Pan Number",
      value: booking.clientPanNumber,
    },
    {
      key: "clientGstNumber",
      label: "Client Gst Number",
      value: booking.clientGstNumber,
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
      <Navbar />
      <main
        className={`h-full overflow-y-auto px-4 sm:px-6 py-6 transition-all duration-300 ${
          isCollapsed ? "lg:ml-24" : "lg:ml-64"
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Booking Details
            </h1>
            <button
              onClick={() => navigate("/booking-dashboard")}
              className="flex items-center gap-2 text-sm mt-1 "
            >
              <FaArrowLeft className="inline" /> Back
            </button>
          </div>
          <button
            className="bg-red-600 text-white px-4 py-2 text-xs rounded-md hover:bg-red-700 transition-colors duration-150 shadow-sm"
            onClick={() => setShowDeletePopup(true)}
          >
            Delete Booking
          </button>
        </div>

        <div className="flex flex-col lg:flex-row w-full gap-6 mb-6">
          <div className="card bg-white shadow-xl p-6 rounded-lg flex-grow lg:w-2/3">
            <h2 className="text-xl font-semibold text-gray-700 mb-6 border-b pb-3">
              Client Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6">
              {clientInfoData.map(({ key, label, value }) => {
                if (key === "bookingSource" && value === "Agency") {
                  return (
                    <React.Fragment key={key}>
                      <InfoDetail label={label} value={value} />
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Agency Name
                        </p>
                        <p className="text-sm text-gray-800 break-words">
                          {booking.agencyName ?? "NA"}
                        </p>
                      </div>
                    </React.Fragment>
                  );
                }
                return <InfoDetail key={key} label={label} value={value} />;
              })}
            </div>
          </div>
          <div className="card bg-white shadow-xl p-6 rounded-lg flex-grow lg:w-1/3 lg:max-w-md">
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
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-8 border-b pb-3">
              Campaigns ({booking.campaigns.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {booking.campaigns.map((campaign, idx) => {
                const artworkUrl = campaign.pipeline?.artwork?.documentUrl;
                return (
                  <div
                    key={campaign._id || idx}
                    className="card relative bg-white shadow-lg rounded-lg p-4 hover:shadow-xl transition-shadow duration-200 flex flex-col justify-between"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents navigation when clicking clone
                        navigate(
                          `/clone-campaign/${campaign._id}/from-booking/${booking._id}`
                        );
                      }}
                      className="absolute top-4 right-4 z-10 text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-md transition-colors"
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
                              className="w-full h-full object-cover rounded-md bg-gray-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md text-gray-400 text-xs text-center p-2">
                              No Artwork Uploaded
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <h3
                            className="text-lg font-semibold text-blue-600 mb-3 truncate"
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
                        className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md transition-colors"
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
            className="border rounded mt-[5%] p-4 mb-6 shadow-sm"
          >
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
              />
              <Input
                label="Start Date"
                type="date"
                value={campaign.startDate}
                onChange={(e) => {
                  const updated = { ...campaign, startDate: e.target.value };
                  updateDraftCampaign(index, updated);
                }}
              />
              <Input
                label="End Date"
                type="date"
                value={campaign.endDate}
                onChange={(e) => {
                  const updated = { ...campaign, endDate: e.target.value };
                  updateDraftCampaign(index, updated);
                }}
              />
              <div className="col-span-2">
                <label className="text-xs font-medium">Description</label>
                <textarea
                  value={campaign.description}
                  onChange={(e) => {
                    const updated = {
                      ...campaign,
                      description: e.target.value,
                    };
                    updateDraftCampaign(index, updated);
                  }}
                  className="w-full border rounded p-2"
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
                      className="ml-2 text-xs font-medium"
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
                          isFOC: e.target.value === "true",
                        };
                        updateDraftCampaign(index, updated);
                      }}
                      className="h-4 w-4 accent-black"
                    />
                    <label
                      htmlFor={`foc-no-${index}`}
                      className="ml-2 text-xs font-medium"
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
            <div className="flex mt-4">
              <button
                onClick={() => removeDraftCampaign(index)}
                className="mr-auto text-red-500 hover:text-red-700"
              >
                🗑️
              </button>
              <button
                onClick={() => saveDraftCampaign(index)}
                className="bg-blue-500 ml-auto text-white text-xs px-4 py-1 rounded hover:bg-blue-600"
              >
                Save Campaign
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={addDraftCampaign}
          className="border px-3 py-2 rounded text-sm mt-4"
        >
          + Add Campaign
        </button>
      </main>

      {showDeletePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Confirm Deletion
            </h2>
            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to delete this booking and all its
              associated campaigns? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 sm:gap-4">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                onClick={() => setShowDeletePopup(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
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

// A simple reusable input component
function Input({ label, ...props }) {
  return (
    <div>
      <label className="text-xs font-medium">{label}</label>
      <input {...props} className="w-full border px-3 py-2 rounded mt-1" />
    </div>
  );
}

// A simple reusable select component
function CustomSelect({ label, name, value, onChange, options }) {
  return (
    <div className="flex flex-col text-sm w-full">
      {label && (
        <label htmlFor={name} className="mb-1 text-gray-700 font-medium">
          {label}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}