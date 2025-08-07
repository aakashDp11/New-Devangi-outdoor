import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import CampaignPipeline from "./CampaignPipeline";
import { PieChart } from "@mui/x-charts/PieChart";
import { toast } from "sonner";
import { useSidebar } from "../context/SidebarContext";
import { FaArrowLeft } from "react-icons/fa";
import EditCampaignModal from "./modals/EditCampaignModel";

const KeyValueItem = ({
  label,
  value,
  icon,
  className = "",
  iconClassName = "text-blue-600",
}) => (
  <div className={`py-1 ${className}`}>
    <div className="flex items-center mb-0.5">
      {icon && <span className={`${iconClassName} mr-2 text-md`}>{icon}</span>}
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </p>
    </div>
    <p
      className={`text-sm text-gray-700 break-words ${
        icon ? "pl-[calc(1rem+0.5rem)]" : "pl-0"
      }`}
    >
      {value || "N/A"}
    </p>
  </div>
);

export default function CampaignDetails() {
  const { id } = useParams();
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const [campaignData, setCampaignData] = useState(null);
  const [pipelineData, setPipelineData] = useState(null);
  const [spaceDetails, setSpaceDetails] = useState([]);
  const [inventoryCosts, setInventoryCosts] = useState([]);
  const [activeTab, setActiveTab] = useState("Details");
  const [editableSpaces, setEditableSpaces] = useState(new Set());
  const [pipelineError, setPipelineError] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);


  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/bookings/campaign/${id}`
        );
        if (!res.ok) {
          throw new Error(`Campaign fetch failed: ${res.status}`);
        }
        const data = await res.json();
        setCampaignData(data);
        setInventoryCosts(data.inventoryCosts || []);

        const fetchedSpaces = await Promise.all(
          (data.spaces || []).map(async (space) => {
            const res = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/api/spaces/${space.id}`
            );
            if (!res.ok) {
              console.error(`Failed to fetch space ${space.id}: ${res.status}`);
              return null;
            }
            const details = await res.json();
            return { ...details, selectedUnits: space.selectedUnits };
          })
        );
        setSpaceDetails(fetchedSpaces.filter(Boolean));
      } catch (err) {
        console.error("Failed to load campaign details:", err);
        toast.error("Failed to load campaign details");
      }
    };

    if (id) {
      fetchCampaign();
    }
  }, [id]);

  useEffect(() => {
    const fetchPipelineData = async () => {
      try {
        setPipelineError(false);
        const token = localStorage.getItem("accessToken");
        const headers = {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        };
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${id}`,
          { method: "GET", headers }
        );
        if (!res.ok) {
          if (res.status === 404) {
            setPipelineData({
              artwork: { confirmed: false },
              bookingStatus: { confirmed: false },
              printingStatus: { confirmed: false },
              mountingStatus: { confirmed: false },
              po: { confirmed: false },
              invoice: { invoiceNumber: "" },
              payment: {
                totalPaid: 0,
                paymentDue: 0,
                finalAmountWithGST: 0,
                payments: [],
              },
            });
            setPipelineError(true);
            return;
          }
          throw new Error(`Pipeline fetch failed: ${res.status}`);
        }
        const data = await res.json();
        setPipelineData(data);
      } catch (err) {
        console.error("Failed to load pipeline data:", err);
        setPipelineError(true);
        setPipelineData({
          artwork: { confirmed: false },
          bookingStatus: { confirmed: false },
          printingStatus: { confirmed: false },
          mountingStatus: { confirmed: false },
          po: { confirmed: false },
          invoice: { invoiceNumber: "" },
          payment: {
            totalPaid: 0,
            paymentDue: 0,
            finalAmountWithGST: 0,
            payments: [],
          },
        });
      }
    };

    if (campaignData?._id) {
      fetchPipelineData();
    }
  }, [campaignData, id]);

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-IN");

  const getCostItem = (spaceId) =>
    inventoryCosts.find(
      (cost) => cost.id === spaceId || cost.id?._id === spaceId
    );

  const updateCostField = (spaceId, field, value) => {
    setInventoryCosts((prev) => {
      const index = prev.findIndex(
        (cost) => cost.id === spaceId || cost.id?._id === spaceId
      );
      const updated = [...prev];
      const space = spaceDetails.find(
        (s) => s._id === spaceId || s._id?.toString() === spaceId.toString()
      );
      const computedArea = (space?.width || 0) * (space?.height || 0);

      if (index !== -1) {
        const updatedItem = { ...updated[index], [field]: value };
        if (field !== "area") {
          updatedItem.area = computedArea;
        }
        updated[index] = updatedItem;
      } else {
        updated.push({
          id: spaceId,
          displayCost: field === "displayCost" ? value : 0,
          buyingPrice: field === "buyingPrice" ? value : 0,
          sellingPrice: field === "sellingPrice" ? value : 0,
          printingcostpersquareFeet:
            field === "printingcostpersquareFeet" ? value : 0,
          mountingcostpersquareFeet:
            field === "mountingcostpersquareFeet" ? value : 0,
          area: field === "area" ? value : computedArea,
        });
      }
      return updated;
    });
  };

  const handleEditToggle = (spaceId) => {
    setEditableSpaces((prev) => {
      const updated = new Set(prev);
      if (updated.has(spaceId)) {
        updated.delete(spaceId);
      } else {
        updated.add(spaceId);
      }
      return updated;
    });
  };

  const handleSaveCostForSpace = async (spaceId) => {
    const cost = getCostItem(spaceId);
    if (!cost) {
      toast.error("No cost data to save");
      return;
    }

    try {
      const updatedCosts = inventoryCosts.map((c) =>
        c.id === spaceId || c.id?._id === spaceId ? cost : c
      );

      const res = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/pipeline/campaign/${id}/update-costs`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inventoryCosts: updatedCosts }),
        }
      );

      if (!res.ok) throw new Error("Failed to save costs");
      toast.success("Costs saved for this space!");
      setEditableSpaces((prev) => {
        const updated = new Set(prev);
        updated.delete(spaceId);
        return updated;
      });
    } catch (err) {
      console.error(err);
      toast.error("Error saving costs for this space.");
    }
  };

  if (!campaignData) {
    return (
      <div className="text-xs min-h-screen w-screen text-black flex flex-col lg:flex-row">
        <Navbar />
        <main
          className={`w-full flex-1 px-8 py-4 transition-all duration-300 ${
            isCollapsed ? "lg:ml-24" : "lg:ml-64"
          }`}
        >
          <div className="p-6">Loading campaign...</div>
        </main>
      </div>
    );
  }

  const { campaignName, description, startDate, endDate } = campaignData;

  const pipelineSteps = [
    { title: "Artwork", key: "artwork", data: pipelineData?.artwork },
    {
      title: "Booking",
      key: "bookingStatus",
      data: pipelineData?.bookingStatus,
    },
    // {
    //   title: "Printing",
    //   key: "printingStatus",
    //   data: pipelineData?.printingStatus,
    // },
    // {
    //   title: "Mounting",
    //   key: "mountingStatus",
    //   data: pipelineData?.mountingStatus,
    // },
  ];

  return (
    <div className="text-xs min-h-screen w-screen text-black flex flex-col lg:flex-row ">
      <Navbar />
      <main
        className={`w-full flex-1 px-8 py-4 transition-all duration-300 ${
          isCollapsed ? "lg:ml-24" : "lg:ml-64"
        }`}
      >
        <div className="flex justify-between">
          <div>
            <div className="mb-6">
              <h2 className="text-2xl ">Campaign : {campaignName}</h2>
              {pipelineError && (
                <p className="text-sm text-orange-600 mt-1">
                  ⚠ Pipeline data not found - showing default values
                </p>
              )}
            </div>
            <div className="flex space-x-4 mb-4">
              {["Details", "Pipeline"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1 border rounded ${
                    activeTab === tab
                      ? "bg-black text-white"
                      : "bg-white text-black border-gray-400"
                  } transition duration-200`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="my-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex gap-2 items-center px-4 py-2 bg-slate-50 border border-slate-200 text-xs"
            >
              <FaArrowLeft className="inline" />
              Back
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="ml-2 inline-flex gap-2 items-center px-4 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Edit Campaign
            </button>
          </div>
        </div>

        {activeTab === "Pipeline" && (
          <CampaignPipeline campaignId={campaignData._id} />
        )}

        {activeTab === "Details" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col bg-white shadow-md border rounded-xl p-4">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                  Campaign Info
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
                  <KeyValueItem
                    label="Description"
                    value={description}
                    className="sm:col-span-2 lg:col-span-3"
                  />
                  <KeyValueItem
                    label="Start Date"
                    value={formatDate(startDate)}
                  />
                  <KeyValueItem label="End Date" value={formatDate(endDate)} />
                </div>
              </div>

              <div className="grid grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Pipeline Overview
                  </h3>
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">
                    Next Step:{" "}
                  </h2>
                  <div>
                    <div className="flex flex-wrap gap-4">
                      {pipelineSteps.map(
                        (step) =>
                          !step.data?.confirmed && (
                            <div
                              key={step.key}
                              onClick={() => setActiveTab("Pipeline")}
                              className="border p-3 rounded-lg w-48 shadow-sm bg-white cursor-pointer"
                            >
                              <h3 className="font-medium text-xs text-gray-700 mb-1">
                                {step.title}
                              </h3>
                              <p
                                className={`text-xs ${
                                  step.data?.confirmed
                                    ? "text-green-600"
                                    : "text-red-500"
                                }`}
                              >
                                {step.data?.confirmed
                                  ? "✓ Confirmed"
                                  : "⚠ Pending"}
                              </p>
                            </div>
                          )
                      )}
                    </div>
                    <div className="flex gap-2 mx-1 text-xs mt-4">
                      <span className="text-gray-700">
                        {pipelineData?.po?.confirmed
                          ? "PO Completed: "
                          : "PO Pending: "}
                        <span
                          className={
                            pipelineData?.po?.confirmed
                              ? "text-green-600"
                              : "text-red-500"
                          }
                        >
                          {pipelineData?.po?.confirmed ? "✓" : "⚠"}
                        </span>
                      </span>
                      <span className="text-gray-700">
                        {pipelineData?.invoice?.invoiceNumber?.trim()
                          ? "Invoice Done: "
                          : "Invoice Pending: "}
                        <span
                          className={
                            pipelineData?.invoice?.invoiceNumber?.trim()
                              ? "text-green-600"
                              : "text-red-500"
                          }
                        >
                          {pipelineData?.invoice?.invoiceNumber?.trim()
                            ? "✓"
                            : "⚠"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {pipelineData?.payment ? (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                      Payment Overview
                    </h3>
                    <div className="w-[200px]">
                      <PieChart
                        series={[
                          {
                            data: [
                              {
                                id: 0,
                                value: pipelineData.payment.totalPaid || 0,
                                label: "Paid",
                              },
                              {
                                id: 1,
                                value:
                                  pipelineData.payment.paymentDue === 0
                                    ? 100
                                    : pipelineData.payment.paymentDue || 100,
                                label: "Due",
                              },
                            ],
                            innerRadius: 50,
                            outerRadius: 90,
                          },
                        ]}
                        width={200}
                        height={200}
                      />
                      {pipelineData?.payment?.payments?.length > 0 ? (
                        <div className="text-xs mt-2 space-y-1">
                          <p>
                            <strong>Total:</strong> ₹
                            {pipelineData.payment.finalAmountWithGST ?? 0}
                          </p>
                          <p>
                            <strong>Paid:</strong> ₹
                            {pipelineData.payment.totalPaid ?? 0}
                          </p>
                          <p>
                            <strong>Due:</strong> ₹
                            {pipelineData.payment.paymentDue ?? 0}
                          </p>
                        </div>
                      ) : (
                        <h4 className="text-sm text-gray-600">
                          Please enter the payment details in the pipeline.
                        </h4>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                      Payment Overview
                    </h3>
                    <div className="w-[200px]">
                      <div className="rounded-full bg-gray-300 h-[150px] w-[150px] mb-4"></div>
                      <div className="space-y-2 text-xs">
                        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-2/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {spaceDetails.map((space, index) => {
              const cost = getCostItem(space._id);
              const computedArea = space.width * space.height;
              const displayCost = cost?.displayCost || 0;
              const sellingPrice = cost?.sellingPrice || 0;
              const printingCost = cost?.printingcostpersquareFeet || 0;
              const mountingCost = cost?.mountingcostpersquareFeet || 0;
              const area = cost?.area || computedArea || 0;
              const isEditable = editableSpaces.has(space._id);

              // --- UPDATED TOTAL COST CALCULATION ---
             let totalCost = displayCost; // Always starts with displayCost

              if (space.spaceType !== "DOOH") {
                totalCost += (printingCost * area) + (mountingCost * area);
              }

              return (
                <div
                  key={space._id || index}
                  className="bg-white shadow-md border rounded-xl p-4"
                >
                  <h2 className="text-base font-semibold mb-2">
                    Space {index + 1}
                  </h2>
                  {space.mainPhoto && (
                    <img
                      src={space.mainPhoto}
                      alt="Main"
                      className="w-48 h-32 object-cover rounded border mb-2"
                    />
                  )}
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Name:</strong> {space.spaceName}
                    </p>
                    <p>
                      <strong>Location:</strong> {space.city}, {space.state}
                    </p>
                    <p>
                      <strong>Type:</strong> {space.spaceType}
                    </p>
                    <p>
                      <strong>Total Units:</strong> {space.unit}
                    </p>
                    <p>
                      <strong>Occupied Units:</strong> {space.occupiedUnits}
                    </p>
                    <p>
                      <strong>Selected Units:</strong> {space.selectedUnits}
                    </p>
                    <p>
                      <strong>Availability:</strong> {space.availability}
                    </p>
                    {/* --- CHANGE 1: Always show Ownership Type --- */}
                    <p>
                      <strong>Ownership Type: </strong> {space.ownershipType}
                    </p>
                    <hr className="my-2" />

                    <div className="grid grid-cols-1 gap-2">
                      <label>
                        Display Cost:
                        <input
                          type="number"
                          className="border rounded ml-2 px-2 py-1 w-[20%]"
                          value={cost?.displayCost || 0}
                          onChange={(e) =>
                            updateCostField(
                              space._id,
                              "displayCost",
                              Number(e.target.value)
                            )
                          }
                          readOnly={!isEditable}
                        />
                      </label>
                      
                      {/* --- CHANGE 2: Conditionally render Buying/Selling Price --- */}
                      {space.ownershipType === "Traded" && (
                        <>
                          <div className="mb-2">
                            <label>
                              Buying Price:
                              <input
                                type="number"
                                className="border rounded ml-2 px-2 py-1 w-[20%]"
                                value={cost?.buyingPrice || 0}
                                onChange={(e) =>
                                  updateCostField(
                                    space._id,
                                    "buyingPrice",
                                    Number(e.target.value)
                                  )
                                }
                                readOnly={!isEditable}
                              />
                            </label>
                          </div>
                          <div>
                            <label>
                              Selling Price:
                              <input
                                type="number"
                                className="border rounded ml-2 px-2 py-1 w-[20%]"
                                value={cost?.sellingPrice || 0}
                                onChange={(e) =>
                                  updateCostField(
                                    space._id,
                                    "sellingPrice",
                                    Number(e.target.value)
                                  )
                                }
                                readOnly={!isEditable}
                              />
                            </label>
                          </div>
                        </>
                      )}

                      {/* --- CHANGE 3 & 4: Logic to handle DOOH vs. other types --- */}
                      {[
                        "printingcostpersquareFeet",
                        "mountingcostpersquareFeet",
                        "area",
                      ].map((field) => {
                        if (space.spaceType === "DOOH") {
                          return null;
                        }
                        return (
                          <label key={field}>
                            {field === "printingcostpersquareFeet" && (
                              <span>Printing Cost/sq.ft.:</span>
                            )}
                            {field === "mountingcostpersquareFeet" && (
                              <span>Mounting Cost/sq.ft.:</span>
                            )}
                            {field === "area" && <span>Area (sq.ft.):</span>}
                            <input
                              type="number"
                              className="border rounded ml-2 px-2 py-1 w-[20%]"
                              value={
                                cost?.[field] ||
                                (field === "area" ? computedArea : 0)
                              }
                              onChange={(e) =>
                                updateCostField(
                                  space._id,
                                  field,
                                  Number(e.target.value)
                                )
                              }
                              readOnly={!isEditable}
                            />
                          </label>
                        );
                      })}

                      {/* --- CHANGE 5: Display the correctly calculated total cost --- */}
                      <p>
                        <strong>Total Cost:</strong> ₹{totalCost.toFixed(2)}
                      </p>

                      <div className="flex w-full gap-2 mt-2">
                        <button
                          onClick={() => handleEditToggle(space._id)}
                          className={`text-xs px-2 py-1 rounded text-white ${
                            isEditable
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-gray-500 hover:bg-gray-600"
                          }`}
                        >
                          {isEditable ? "Cancel" : "Edit Costs"}
                        </button>
                        <button
                          onClick={() => handleSaveCostForSpace(space._id)}
                          disabled={!isEditable}
                          className={`text-xs ml-auto px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                            !isEditable ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          Save Costs
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {showEditModal && (
          <EditCampaignModal
            campaignData={campaignData}
            pipelineSpaces={pipelineData?.spaces || []}
            onClose={() => setShowEditModal(false)}
            onUpdate={(updated) => setCampaignData(updated)}
          />
        )}
      </main>
    </div>
  );
}