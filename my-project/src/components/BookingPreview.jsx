import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useBookingForm } from "../context/BookingFormContext";
import { useSidebar } from "../context/SidebarContext";

export default function BookingPreview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [assignedUser, setAssignedUser] = useState(null);
  const { isCollapsed } = useSidebar();

  const { basicInfo, orderInfo, resetForm, proposalId, setProposalId } =
    useBookingForm();
  const stepOrder = ["Basic", "Order"];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/users`
        );
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
      
      // --- START OF CHANGE ---
      const campaignsPayload = orderInfo.campaigns.map((c) => ({
        campaignName: c.campaignName,
        industry: c.industry,
        description: c.description,
        startDate: c.startDate,
        endDate: c.endDate,
        isFOC: c.isFOC, // <-- This is the important part
        selectedSpaces: c.selectedSpaces.map((s) => ({
          id: s.id,
          selectedUnits: s.selectedUnits,
        })),
      }));

      // *** ADD THIS LOG TO VERIFY ***
      console.log("FRONTEND IS SENDING THIS PAYLOAD:", JSON.stringify(campaignsPayload, null, 2));

      formData.append("campaigns", JSON.stringify(campaignsPayload));
      // --- END OF CHANGE ---
      
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
      toast.success("Booking submitted successfully!");
      resetForm();
      navigate("/");
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
      
      console.log("Saving Proposal with this FLAT payload (NO DATES):", JSON.stringify(payload, null, 2));

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
    <div className="flex min-h-screen bg-white">
      <Navbar />
      <main className={`flex-1 p-6 text-xs transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <div className="max-w-screen-xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">
            Review & Confirm Booking
          </h2>

          <div className="flex gap-6 mb-6 text-sm font-medium">
            {stepOrder.map((label) => (
              <div key={label} className="text-green-600 flex items-center gap-1">
                ✓{" "}
                {label === "Basic"
                  ? "Basic Information"
                  : "Order Information"}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6 mb-10">
            {Object.entries(basicInfo)
              .filter(
                ([key]) =>
                  key !== "companyLogo" &&
                  key !== "user" &&
                  key !== "campaignImages"
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
          </div>

          {assignedUser && (
            <div className="mb-6 grid grid-cols-2">
              <PreviewField
                label="Assigned User"
                value={`${assignedUser.name} (${assignedUser.email})`}
              />
            </div>
          )}

          {basicInfo.companyLogo && basicInfo.companyLogo.preview && (
            <div className="mb-10">
              <h3 className="font-semibold mb-2">Client logo</h3>
              <div className="flex flex-wrap gap-4">
                <div className="w-32 h-32 relative border rounded overflow-hidden shadow-sm">
                  <img
                    src={basicInfo.companyLogo.preview}
                    alt="Company logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          {orderInfo.campaigns
            .filter((c) => c.isSaved)
            .map((campaign, cIdx) => (
              <div
                key={cIdx}
                className="mb-10 w-full border rounded p-4 shadow-sm"
              >
                <h3 className="font-semibold text-lg mb-2 text-blue-700">
                  {campaign.campaignName}
                </h3>
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <PreviewField label="Industry" value={campaign.industry} />
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <p className="border rounded px-3 py-2 mt-1 bg-gray-50">
                      {campaign.description}
                    </p>
                  </div>
                  <PreviewField label="Start Date" value={campaign.startDate} />
                  <PreviewField label="End Date" value={campaign.endDate} />
                </div>

                <div className="overflow-x-auto border rounded mb-4">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-2">#</th>
                        <th className="px-2 py-2 text-left">Space Name</th>
                        <th className="px-2 py-2">Type</th>
                        <th className="px-2 py-2">Status</th>
                        <th className="px-2 py-2">Facia</th>
                        <th className="px-2 py-2">City</th>
                        <th className="px-2 py-2">Category</th>
                        <th className="px-2 py-2">Occupied</th>
                        <th className="px-2 py-2">Total</th>
                        <th className="px-2 py-2">Selected</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaign.selectedSpaces.map((space, sIdx) => (
                        <tr key={space.id} className="text-center border-t">
                          <td className="px-2 py-2">{sIdx + 1}</td>
                          <td className="px-2 py-2 text-left text-purple-700">
                            {space.name}
                          </td>
                          <td className="px-2 py-2">{space.spaceType}</td>
                          <td className="px-2 py-2">{space.status}</td>
                          <td className="px-2 py-2">{space.facia}</td>
                          <td className="px-2 py-2">{space.city}</td>
                          <td className="px-2 py-2">{space.category}</td>
                          <td className="px-2 py-2">{space.occupiedUnits}</td>
                          <td className="px-2 py-2">{space.unit}</td>
                          <td className="px-2 py-2">{space.selectedUnits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

          <div className="flex text-xs justify-between mt-6">
            <div>
              <button onClick={handleCancel} className="border px-3 py-1 rounded">
                Cancel
              </button>
              <button
                onClick={() => navigate("/create-booking-orderInfo")}
                className="ml-4 bg-black text-white px-3 py-1 rounded"
              >
                Back
              </button>
            </div>

            <div className="space-x-2 ml-auto">
              <button
                onClick={handleSaveProposal}
                className="bg-black text-white px-3 py-1 rounded disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save as Proposal"}
              </button>
              <button
                onClick={handleSubmitBooking}
                className="bg-orange-500 text-white px-3 py-1 rounded disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function PreviewField({ label, value }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <p className="border rounded px-3 py-2 mt-1 bg-gray-50">{value || "-"}</p>
    </div>
  );
}