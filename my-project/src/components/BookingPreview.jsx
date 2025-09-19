import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useBookingForm } from "../context/BookingFormContext";
import { useSidebar } from "../context/SidebarContext";
import { FaArrowLeft, FaCheck } from "react-icons/fa";

// --- REUSABLE UI COMPONENTS (COPIED FROM PREVIOUS COMPONENTS) ---

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

const CardContent = ({ children, className = "" }) => (
  <div className={`p-4 md:p-6 flex-grow flex flex-col ${className}`}>
    {children}
  </div>
);

const Button = ({ children, className = "", disabled = false, loading = false, ...props }) => (
  <button
    className={`px-4 py-2 rounded-xl bg-[black] text-white text-xs font-medium transition-all duration-200 transform hover:scale-105 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg ${className}`}
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

const PreviewField = ({ label, value }) => (
  <div className="w-full">
    <label className="text-sm font-medium text-gray-700 block mb-1">
      {label}
    </label>
    <p className="border px-4 py-2 rounded-xl w-full bg-white text-[var(--color-text)] shadow-sm">
      {value || "-"}
    </p>
  </div>
);

const Stepper = ({ currentStep }) => {
  const stepOrder = ['Basic', 'Order', 'Preview'];
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 text-sm font-medium border-b border-gray-200 animate-fadeIn">
      {stepOrder.map((label, idx) => {
        const isCompleted = stepOrder.indexOf(currentStep) >= idx;
        return (
          <div
            key={label}
            className={`flex items-center gap-2 pb-2 cursor-pointer transition-colors duration-200
              ${isCompleted
                ? "text-green-600"
                : "text-gray-500"}
              ${currentStep === label ? "border-b-2 border-[black] text-[black]" : ""}
            `}
          >
            <span className={`${isCompleted ? "text-green-600" : "text-gray-400"}`}>
              {isCompleted ? <FaCheck /> : <span className="text-xl leading-none">•</span>}
            </span>
            {label === 'Basic' ? 'Basic Information' : label === 'Order' ? 'Order Information' : 'Preview'}
          </div>
        );
      })}
    </div>
  );
};

// Main component
export default function BookingPreview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [assignedUser, setAssignedUser] = useState(null);
  const { isCollapsed } = useSidebar();
  const { basicInfo, orderInfo, resetForm, proposalId, setProposalId } = useBookingForm();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users`);
        const data = await res.json();
        const foundUser = data.find((u) => u._id === basicInfo.user);
        setAssignedUser(foundUser);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    if (basicInfo.user) {
      fetchUsers();
    }
  }, [basicInfo.user]);

  const computeTotalPrice = () => {
    return orderInfo.campaigns.reduce((total, campaign) => {
      if (campaign.isFOC) return total;
      const campaignTotal =
        campaign.selectedSpaces?.reduce(
          (sum, space) => sum + (space.price || 0) * (space.selectedUnits || 1),
          0
        ) || 0;
      return total + campaignTotal;
    }, 0);
  };

  const grandTotalPrice = computeTotalPrice();

  const handleSubmitBooking = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(basicInfo).forEach(([key, value]) => {
        if (key !== "companyLogo") {
          formData.append(key, value);
        }
      });
      
      const campaignsPayload = orderInfo.campaigns.map((c) => ({
        campaignName: c.campaignName,
        industry: c.industry,
        description: c.description,
        startDate: c.startDate,
        endDate: c.endDate,
        isFOC: c.isFOC,
        selectedSpaces: c.selectedSpaces.map((s) => ({
          id: s.id,
          selectedUnits: s.selectedUnits,
        })),
      }));

      formData.append("campaigns", JSON.stringify(campaignsPayload));
      
      if (basicInfo.companyLogo && basicInfo.companyLogo.file) {
        formData.append("companyLogo", basicInfo.companyLogo.file);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/bookings`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit booking");
      }

      const responseData = await response.json();
      toast.success("Booking submitted successfully!");
      resetForm();

      if (responseData.bookingId) {
        navigate(`/booking/${responseData.bookingId}`); 
      } else {
        navigate("/booking-dashboard");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProposal = async () => {
    setLoading(true);
    try {
      const firstCampaign = orderInfo.campaigns[0] || {};
      const payload = {
        companyName: basicInfo.companyName,
        clientName: basicInfo.clientName,
        clientEmail: basicInfo.clientEmail,
        clientType: basicInfo.clientType,
        brandDisplayName: basicInfo.brandName,
        bookingSource: basicInfo.bookingSource,
        clientContactNumber: basicInfo.clientContact,
        clientPanNumber: basicInfo.clientPan,
        clientGstNumber: basicInfo.clientGst,
        industry: firstCampaign.industry,
        campaignName: firstCampaign.campaignName,
        description: firstCampaign.description,
        campaigns: orderInfo.campaigns.map((c) => ({
          selectedSpaces: c.selectedSpaces.map((s) => ({
            id: s.id,
            selectedUnits: s.selectedUnits,
          })),
        })),
      };

      const url = proposalId
        ? `${import.meta.env.VITE_API_BASE_URL}/api/proposals/${proposalId}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/proposals`;
      const method = proposalId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save proposal");
      }

      toast.success(
        proposalId
          ? "Proposal updated successfully!"
          : "Proposal saved successfully!"
      );
      resetForm();
      setProposalId(null);
      navigate("/proposal-dashboard");
    } catch (error) {
      console.error("Error saving proposal:", error);
      toast.error(error.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel?")) {
      resetForm();
      navigate("/");
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-[var(--color-text)] flex flex-col lg:flex-row overflow-hidden`}>
      <Navbar />
      <main className={`flex-1 overflow-y-auto px-4 md:px-6 py-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <div className="max-w-screen-xl w-full mx-auto">
          <div className="flex justify-between items-center mb-6 animate-slideDown">
            <Button onClick={() => navigate(-1)} className="bg-gray-700 text-white">
              <FaArrowLeft className="inline mr-2" /> Back
            </Button>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-6 animate-slideDown">
            Review & Confirm Booking
          </h1>
          
          <Stepper currentStep="Preview" />

          {/* Basic Info Card */}
          <Card className="mb-8">
            <CardContent>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(basicInfo)
                  .filter(
                    ([key]) =>
                      key !== "companyLogo" &&
                      key !== "user" &&
                      key !== "campaignImages" &&
                      key !== "agencyName"
                  )
                  .map(([key, value]) => (
                    <PreviewField
                      key={key}
                      label={key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                      value={value}
                    />
                  ))}
                {basicInfo.bookingSource === "Agency" && (
                  <PreviewField label="Agency Name" value={basicInfo.agencyName} />
                )}
                {assignedUser && (
                  <PreviewField
                    label="Assigned Sales Person"
                    value={`${assignedUser.name} (${assignedUser.email})`}
                  />
                )}
                {basicInfo.companyLogo && basicInfo.companyLogo.preview && (
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Client Logo</h3>
                    <img
                      src={basicInfo.companyLogo.preview}
                      alt="Company logo"
                      className="w-32 h-32 object-contain rounded-xl border-2 border-gray-200"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Campaigns Card */}
          <Card className="mb-8">
            <CardContent>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Campaigns</h2>
              {orderInfo.campaigns?.filter((c) => c.isSaved).map((campaign, cIdx) => (
                <div key={cIdx} className="mb-6 border-b pb-6 last:border-b-0 last:pb-0">
                  <h3 className="text-lg font-bold text-blue-700 mb-2">
                    {campaign.campaignName}
                    {campaign.isFOC && (
                      <span className="text-xs font-bold text-green-600 ml-2">(FOC)</span>
                    )}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <PreviewField label="Industry" value={campaign.industry} />
                    <PreviewField label="Duration" value={`${campaign.startDate} to ${campaign.endDate}`} />
                    <div className="col-span-full">
                      <PreviewField label="Description" value={campaign.description} />
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-800 mt-6 mb-2">Selected Spaces</h4>
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Space Name</th>
                          <th className="px-4 py-2 text-left">Type</th>
                          <th className="px-4 py-2 text-left">City</th>
                          <th className="px-4 py-2 text-left">Units</th>
                          <th className="px-4 py-2 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaign.selectedSpaces.map((space) => (
                          <tr key={space.id} className="border-t border-gray-200">
                            <td className="px-4 py-3 text-left">{space.name}</td>
                            <td className="px-4 py-3 text-left">{space.spaceType}</td>
                            <td className="px-4 py-3 text-left">{space.city}</td>
                            <td className="px-4 py-3 text-left">{space.selectedUnits}</td>
                            <td className="px-4 py-3 text-right">
                              ₹{new Intl.NumberFormat('en-IN').format((space.price || 0) * (space.selectedUnits || 1))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Total Price</h2>
              <span className="text-2xl font-bold text-orange-500">
                ₹{new Intl.NumberFormat('en-IN').format(grandTotalPrice)}
              </span>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer (with fixed positioning) */}
      <div className={`fixed bottom-0 right-0 bg-white z-10 transition-all duration-300 border-t border-gray-200 ${isCollapsed ? 'lg:left-24' : 'lg:left-64'}`}>
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-xl mx-auto">
          <Button onClick={handleCancel} className="bg-gray-700 hover:bg-gray-800">
            Cancel
          </Button>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => navigate("/create-booking-orderInfo")}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              Back
            </Button>
            <Button
              onClick={handleSaveProposal}
              disabled={loading}
              className="bg-black text-white hover:bg-gray-800"
              loading={loading}
            >
              {loading ? "Saving..." : "Save as Proposal"}
            </Button>
            <Button
              onClick={handleSubmitBooking}
              disabled={loading}
              className="bg-orange-500 text-white hover:bg-orange-600"
              loading={loading}
            >
              {loading ? "Submitting..." : "Submit"}
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