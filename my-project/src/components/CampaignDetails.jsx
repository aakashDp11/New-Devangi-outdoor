import React, { useState, useEffect, useCallback } from "react";
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
  FaBoxes,
  FaCheckCircle,
  FaLock,
  FaEdit,
  FaSave,
  FaTimes,
  FaStar,
  FaExclamationTriangle,
  FaCheck,
} from "react-icons/fa";
import EditCampaignModal from "./modals/EditCampaignModel";

// --- REUSABLE UI COMPONENTS (COPIED FROM SpaceDetails.jsx) ---

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
const Button = ({
  children,
  className = "",
  disabled = false,
  loading = false,
  ...props
}) => (
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
const Input = ({ className = "", error = null, ...props }) => (
  <div className="relative">
    <input
      className={`border ${
        error ? "border-red-300" : "border-gray-200"
      } px-4 py-2 rounded-xl w-full bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
      {...props}
    />
    {error && (
      <p className="absolute -bottom-5 left-0 text-red-500 text-xs mt-1 animate-slideDown">
        {error}
      </p>
    )}
  </div>
);

// Notification system component
const Notification = ({ message, type = "success", onClose }) => {
  return (
    <div
      className={`px-4 py-3 rounded-lg shadow-lg animate-fadeIn ${
        type === "error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"
      }`}
    >
      <div className="flex items-center gap-2">
        {type === "error" ? <FaExclamationTriangle /> : <FaCheck />}
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-auto text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

// Reusable component for Key-Value display.
const DetailItem = ({ label, value, className = "" }) => (
  <div className={`mb-3 ${className}`}>
    <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
      {label}
    </p>
    <p className="text-sm text-[var(--color-text)] break-words">
      {value ?? "N/A"}
    </p>
  </div>
);

// Reusable component for Key-Value display with icon.
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

// --- MODIFIED COMPONENT: CostInput using the new Input component ---
const CostInput = ({
  label,
  field,
  value,
  spaceId,
  isEditable,
  updateCostField,
  isCurrency = false,
  isDisabled,
  type = "number",
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
      <Input
        type={type}
        className={`${isCurrency ? "pl-7" : "px-2"} py-1 text-sm ${
          !isEditable || isDisabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
        }`}
        value={value}
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

// Main Component
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
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = "success") => {
    const notificationId = Date.now();
    const notification = { id: notificationId, message, type };
    setNotifications((prev) => [...prev, notification]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    }, 5000);
  }, []);

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

  useEffect(() => {
    if (id) {
      fetchCampaign();
    }
  }, [id]);

  useEffect(() => {
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

      setEditedCosts((prev) => ({
        ...prev,
        [spaceId]: {
          id: spaceId,
          displayCost: costItem.displayCost || 0,
          buyingPrice: costItem.buyingPrice || 0,
          sellingPrice: costItem.sellingPrice || 0,
          invoiceNo: costItem.invoiceNo || "",
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
      addNotification("No changes to save", "error");
      return;
    }

    const sanitizedCostToSave = { ...costToSave };
    for (const key in sanitizedCostToSave) {
      if (sanitizedCostToSave[key] === "") {
        if (key !== "invoiceNo") {
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
      addNotification("Costs saved for this space!");

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
      addNotification("Error saving costs for this space.", "error");
    }
  };

  if (!campaignData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-[var(--color-text)] flex flex-col lg:flex-row overflow-hidden">
        <Navbar />
        <main
          className={`flex-1 flex items-center justify-center p-6 transition-all duration-300 ${
            isCollapsed ? "lg:ml-24" : "lg:ml-64"
          }`}
        >
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
            <div className="text-[var(--color-muted)] text-sm">
              Loading campaign details...
            </div>
          </div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-[var(--color-text)] flex flex-col lg:flex-row overflow-hidden">
      <Navbar />
      {/* Notification System */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() =>
              setNotifications((prev) =>
                prev.filter((n) => n.id !== notification.id)
              )
            }
          />
        ))}
      </div>

      <main
        className={`flex-1 overflow-y-auto px-4 md:px-6 py-8 transition-all duration-300 ${
          isCollapsed ? "lg:ml-24" : "lg:ml-64"
        }`}
      >
        <div className="flex justify-between items-center mb-6 animate-slideDown">
          <div>
            <div className="mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">
                Campaign: {campaignName}
              </h1>
              {campaignData.isFOC && (
                <div className="mt-2 inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 text-sm font-bold px-3 py-1 rounded-full">
                  <FaStar />
                  <span>This is a Free of Cost (FOC) Campaign</span>
                </div>
              )}
            </div>
            <div className="flex space-x-4 mt-4">
              {["Details", "Pipeline"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1 rounded-xl font-medium transition duration-200 ${
                    activeTab === tab
                      ? "bg-black text-white"
                      : "bg-white text-[var(--color-text)] border border-gray-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="my-6 flex gap-2">
            <Button
              onClick={() => navigate(-1)}
              className="bg-black text-gray-700 hover:bg-gray-300"
            >
              <FaArrowLeft className="inline mr-2" />
              Back
            </Button>
            <Button
              onClick={() => setShowEditModal(true)}
              className="bg-[var(--color-primary)] text-white"
            >
              <FaEdit className="inline mr-2" />
              Edit Campaign
            </Button>
          </div>
        </div>

        {activeTab === "Pipeline" && (
          <CampaignPipeline campaignId={campaignData._id} isFOC={campaignData.isFOC} />
        )}

        {activeTab === "Details" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp">
            <Card>
              <CardContent>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 flex-grow">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                      Pipeline Overview
                    </h3>
                    <h2 className="text-sm font-semibold text-gray-700 mb-2">
                      Next Step:
                    </h2>
                    <div className="flex flex-wrap gap-4">
                      {pipelineSteps.map(
                        (step) =>
                          !step.data?.confirmed && (
                            <Card
                              key={step.key}
                              onClick={() => setActiveTab("Pipeline")}
                              className="w-full sm:w-48 cursor-pointer hover:shadow-lg"
                            >
                              <CardContent className="p-3">
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
                                  {step.data?.confirmed ? "✓ Confirmed" : "⚠ Pending"}
                                </p>
                              </CardContent>
                            </Card>
                          )
                      )}
                    </div>
                  </div>

                  {pipelineData?.payment ? (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mt-4 sm:mt-0 mb-4">
                        Payment Overview
                      </h3>
                      <div className="w-[200px] flex flex-col items-center">
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
                          <div className="text-xs mt-2 space-y-1 w-full text-center">
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
                          <h4 className="text-sm text-gray-600 text-center mt-4">
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
              </CardContent>
            </Card>

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

              let totalCost = displayCost;
              switch (space.spaceType) {
                case "BQS":
                case "Transit":
                  totalCost += printingCost + mountingCost;
                  break;

                case "DOOH":
                  break;

                default:
                  totalCost += printingCost * area + mountingCost * area;
                  break;
              }

              return (
                <Card key={space._id || index} className="flex flex-col">
                  <CardContent className="p-4">
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
                          <DetailItem
                            label="Location"
                            value={`${space.city}, ${space.state}`}
                          />
                          <DetailItem label="Type" value={space.spaceType} />
                          <DetailItem
                            label="Ownership"
                            value={space.ownershipType}
                          />
                          <DetailItem label="Total Units" value={space.unit} />
                          <DetailItem
                            label="Occupied"
                            value={space.occupiedUnits}
                          />
                          <DetailItem
                            label="Selected"
                            value={space.selectedUnits}
                          />
                        </div>
                      </div>

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
                            <div className="sm:col-span-2">
                              <CostInput
                                label="Invoice NO"
                                field="invoiceNo"
                                value={currentCost?.invoiceNo || ""}
                                type="text"
                                isEditable={isEditable}
                                updateCostField={updateCostField}
                                spaceId={space._id}
                                isDisabled={isFOC}
                              />
                            </div>
                          </div>
                        )}

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

                        {space.spaceType !== "BQS" &&
                          space.spaceType !== "Transit" && (
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
                              ₹{isFOC ? "0.00" : totalCost.toFixed(2)}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full gap-2 mt-4 pt-4 border-t">
                      <Button
                        onClick={() => handleEditToggle(space._id)}
                        disabled={isFOC}
                        className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 font-semibold transition-all ${
                          isEditable
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-black text-gray-700 hover:bg-gray-200"
                        } ${isFOC ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {isEditable ? <FaTimes /> : <FaEdit />}
                        {isEditable ? "Cancel" : "Edit"}
                      </Button>
                      {isEditable && (
                        <Button
                          onClick={() => handleSaveCostForSpace(space._id)}
                          disabled={!isEditable}
                          className="inline-flex items-center gap-2 text-xs ml-auto px-3 py-1.5 bg-[var(--color-primary)] text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <FaSave />
                          Save
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes bg-gradient-flow-diagonal {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 100% 100%;
          }
        }
        .animate-bg-gradient-flow-diagonal {
          background-size: 200% 200%;
          animation: bg-gradient-flow-diagonal 10s linear infinite;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.4s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}