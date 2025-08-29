import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import CampaignPipeline from "./CampaignPipeline";
import { PieChart } from "@mui/x-charts/PieChart";
import { toast } from "sonner";
import { useSidebar } from "../context/SidebarContext";
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaRegBuilding,
  FaTag,
  FaLayerGroup,
  FaCheckCircle,
  FaLock,
  FaEdit,
  FaSave,
  FaTimes,
  FaBoxes,
  FaStar,
} from "react-icons/fa";
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

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-center text-xs text-gray-600">
    <span className="w-5">{icon}</span>
    <span className="font-semibold mr-1">{label}:</span>
    <span>{value}</span>
  </div>
);

// --- MODIFIED COMPONENT: CostInput ---
const CostInput = ({
  label,
  field,
  value,
  spaceId,
  isEditable,
  updateCostField,
  isCurrency = false,
  isDisabled,
  type = "number", // Added type prop, defaults to "number"
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {label}
    </label>
    <div className="relative">
      {isCurrency && (
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
          ₹
        </span>
      )}
      <input
        type={type} // Use the new type prop
        className={`border rounded-md w-full py-1 text-sm ${
          isCurrency ? "pl-7" : "px-2"
        } ${!isEditable || isDisabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
        value={value}
        // Handle both number and text inputs in the onChange handler
        onChange={(e) =>
          updateCostField(
            spaceId,
            field,
            type === "number" && e.target.value !== ""
              ? Number(e.target.value)
              : e.target.value
          )
        }
        readOnly={!isEditable || isDisabled}
        disabled={isDisabled}
      />
    </div>
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
  const [editedCosts, setEditedCosts] = useState({});

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
              payment: { totalPaid: 0, paymentDue: 0, finalAmountWithGST: 0, payments: [] },
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
          payment: { totalPaid: 0, paymentDue: 0, finalAmountWithGST: 0, payments: [] },
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
    setEditedCosts((prev) => ({
      ...prev,
      [spaceId]: {
        ...prev[spaceId],
        [field]: value,
      },
    }));
  };

  const handleEditToggle = (spaceId) => {
    const updated = new Set(editableSpaces);
    if (updated.has(spaceId)) {
      updated.delete(spaceId);
      setEditedCosts((prev) => {
        const newEditedCosts = { ...prev };
        delete newEditedCosts[spaceId];
        return newEditedCosts;
      });
    } else {
      updated.add(spaceId);
      const costItem = getCostItem(spaceId) || {};
      const space = spaceDetails.find((s) => s._id === spaceId);
      const computedArea = (space?.width || 0) * (space?.height || 0);

      // --- MODIFIED SECTION: handleEditToggle ---
      setEditedCosts((prev) => ({
        ...prev,
        [spaceId]: {
          id: spaceId,
          displayCost: costItem.displayCost || 0,
          buyingPrice: costItem.buyingPrice || 0,
          sellingPrice: costItem.sellingPrice || 0,
          invoiceNo: costItem.invoiceNo || "", // Added invoiceNo to state
          printingcostpersquareFeet: costItem.printingcostpersquareFeet || 0,
          mountingcostpersquareFeet: costItem.mountingcostpersquareFeet || 0,
          area: costItem.area || computedArea,
        },
      }));
    }
    setEditableSpaces(updated);
  };

  const handleSaveCostForSpace = async (spaceId) => {
    const costToSave = editedCosts[spaceId];
    if (!costToSave) {
      toast.error("No changes to save");
      return;
    }

    const sanitizedCostToSave = { ...costToSave };
    for (const key in sanitizedCostToSave) {
      if (sanitizedCostToSave[key] === '') {
        // Allow empty string for invoiceNo, but convert others to 0
        if (key !== 'invoiceNo') {
          sanitizedCostToSave[key] = 0;
        }
      }
    }

    try {
      const index = inventoryCosts.findIndex(
        (c) => c.id === spaceId || c.id?._id === spaceId
      );
      let updatedCosts;
      if (index !== -1) {
        updatedCosts = inventoryCosts.map((c, i) =>
          i === index ? { ...inventoryCosts[i], ...sanitizedCostToSave } : c
        );
      } else {
        updatedCosts = [...inventoryCosts, sanitizedCostToSave];
      }

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

      setInventoryCosts(updatedCosts);
      toast.success("Costs saved for this space!");

      const updated = new Set(editableSpaces);
      updated.delete(spaceId);
      setEditableSpaces(updated);

      setEditedCosts((prev) => {
        const newEditedCosts = { ...prev };
        delete newEditedCosts[spaceId];
        return newEditedCosts;
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
            <div className="mb-2">
              <h2 className="text-2xl ">Campaign : {campaignName}</h2>

              {campaignData.isFOC && (
                <div className="mt-2 inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 text-sm font-bold px-3 py-1 rounded-full">
                  <FaStar />
                  <span>This is a Free of Cost (FOC) Campaign</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-4">
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

              {pipelineError && (
                <p className="text-sm text-orange-600">
                  ⚠ Pipeline data not found - showing default values
                </p>
              )}
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
          <CampaignPipeline
            campaignId={campaignData._id}
            isFOC={campaignData.isFOC}
          />
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
                              { id: 0, value: pipelineData.payment.totalPaid || 0, label: "Paid" },
                              { id: 1, value: pipelineData.payment.paymentDue === 0 ? 100 : pipelineData.payment.paymentDue || 100, label: "Due" },
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
                          <p><strong>Total:</strong> ₹{pipelineData.payment.finalAmountWithGST ?? 0}</p>
                          <p><strong>Paid:</strong> ₹{pipelineData.payment.totalPaid ?? 0}</p>
                          <p><strong>Due:</strong> ₹{pipelineData.payment.paymentDue ?? 0}</p>
                        </div>
                      ) : (
                        <h4 className="text-sm text-gray-600">Please enter the payment details in the pipeline.</h4>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Payment Overview</h3>
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
              const isFOC = campaignData.isFOC;
              const isEditable = editableSpaces.has(space._id) && !isFOC;
              const originalCost = getCostItem(space._id);
              const currentCost = isEditable
                ? editedCosts[space._id]
                : originalCost;

              const computedArea = space.width * space.height;
              const displayCost = Number(currentCost?.displayCost || 0);
              const printingCost = Number(currentCost?.printingcostpersquareFeet || 0);
              const mountingCost = Number(currentCost?.mountingcostpersquareFeet || 0);
              const area = Number(currentCost?.area || computedArea || 0);

              // --- MODIFIED SECTION: Total Cost Calculation Logic ---
              let totalCost = displayCost;
              switch (space.spaceType) {
                case "BQS":
                case "Transit":
                  // For BQS and Transit, treat printing/mounting as flat costs
                  totalCost += printingCost + mountingCost;
                  break;
                
                case "DOOH":
                  // For DOOH, total cost is just the display cost. No other cost is added.
                  break;
                  
                default:
                  // For all other types (Billboard, etc.), calculate based on area
                  totalCost += (printingCost * area) + (mountingCost * area);
                  break;
              }

              return (
                <div
                  key={space._id || index}
                  className="bg-white shadow-md border rounded-xl p-4 flex flex-col"
                >
                  <h3 className="text-base font-bold text-gray-800 mb-3">
                    {space.spaceName || `Space ${index + 1}`}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-grow">
                    <div className="md:col-span-2">
                      {space.mainPhoto && (
                        <img
                          src={space.mainPhoto}
                          alt={space.spaceName}
                          className="w-full h-32 object-cover rounded-lg border mb-3"
                        />
                      )}
                      <div className="space-y-1.5">
                        <DetailItem icon={<FaMapMarkerAlt />} label="Location" value={`${space.city}, ${space.state}`} />
                        <DetailItem icon={<FaRegBuilding />} label="Type" value={space.spaceType} />
                        <DetailItem icon={<FaTag />} label="Ownership" value={space.ownershipType} />
                        <DetailItem icon={<FaBoxes />} label="Total Units" value={space.unit} />
                        <DetailItem icon={<FaLock />} label="Occupied" value={space.occupiedUnits} />
                        <DetailItem icon={<FaCheckCircle />} label="Selected" value={space.selectedUnits} />
                      </div>
                    </div>

                    {/* --- Cost Inputs Section (Unchanged) --- */}
                    <div className="md:col-span-3 space-y-3">
                      <CostInput
                        label="Display Cost"
                        field="displayCost"
                        value={currentCost?.displayCost || 0}
                        isCurrency
                        isEditable={isEditable}
                        updateCostField={updateCostField}
                        spaceId={space._id}
                        isDisabled={isFOC}
                      />

                      {space.ownershipType === "Traded" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <CostInput
                            label="Buying Price"
                            field="buyingPrice"
                            value={currentCost?.buyingPrice || 0}
                            isCurrency
                            isEditable={isEditable}
                            updateCostField={updateCostField}
                            spaceId={space._id}
                            isDisabled={isFOC}
                          />
                          <CostInput
                            label="Selling Price"
                            field="sellingPrice"
                            value={currentCost?.sellingPrice || 0}
                            isCurrency
                            isEditable={isEditable}
                            updateCostField={updateCostField}
                            spaceId={space._id}
                            isDisabled={isFOC}
                          />
                          {/* New Invoice No Input Field */}
                          <div className="sm:col-span-2">
                             <CostInput
                                label="Invoice NO"
                                field="invoiceNo"
                                value={currentCost?.invoiceNo || ''}
                                type="text"
                                isEditable={isEditable}
                                updateCostField={updateCostField}
                                spaceId={space._id}
                                isDisabled={isFOC}
                              />
                          </div>
                        </div>
                      )}

                      {/* Show Printing and Mounting only for non-DOOH types */}
                      {space.spaceType !== "DOOH" && (
                        <div className="grid grid-cols-2 gap-3">
                          <CostInput
                            label="Printing Cost"
                            field="printingcostpersquareFeet"
                            value={currentCost?.printingcostpersquareFeet || 0}
                            isCurrency
                            isEditable={isEditable}
                            updateCostField={updateCostField}
                            spaceId={space._id}
                            isDisabled={isFOC}
                          />
                          <CostInput
                            label="Mounting Cost"
                            field="mountingcostpersquareFeet"
                            value={currentCost?.mountingcostpersquareFeet || 0}
                            isCurrency
                            isEditable={isEditable}
                            updateCostField={updateCostField}
                            spaceId={space._id}
                            isDisabled={isFOC}
                          />
                        </div>
                      )}
                      
                      {/* Show Area field for all types EXCEPT BQS and Transit */}
                      {space.spaceType !== "BQS" && space.spaceType !== "Transit" && (
                        <div>
                          <CostInput
                            label="Area (sq.ft)"
                            field="area"
                            value={currentCost?.area || computedArea}
                            isEditable={isEditable}
                            updateCostField={updateCostField}
                            spaceId={space._id}
                            isDisabled={isFOC}
                          />
                        </div>
                      )}

                      <div className="border-t pt-3 mt-3">
                        <p className="flex justify-between items-center text-sm font-bold">
                          <span>Total Cost:</span>
                          <span className="text-lg text-blue-600">
                            ₹{isFOC ? '0.00' : totalCost.toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full gap-2 mt-4 pt-4 border-t">
                    <button
                      onClick={() => handleEditToggle(space._id)}
                      disabled={isFOC}
                      className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
                        isEditable
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } ${isFOC ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isEditable ? <FaTimes /> : <FaEdit />}
                      {isEditable ? "Cancel" : "Edit"}
                    </button>
                    {isEditable && (
                      <button
                        onClick={() => handleSaveCostForSpace(space._id)}
                        disabled={!isEditable}
                        className="inline-flex items-center gap-2 text-xs ml-auto px-3 py-1.5 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <FaSave />
                        Save
                      </button>
                    )}
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