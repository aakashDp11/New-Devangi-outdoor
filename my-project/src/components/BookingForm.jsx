import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import { useBookingForm } from "../context/BookingFormContext";
import { toast } from "sonner";

export default function CreateOrderBasicInfo() {
  const navigate = useNavigate();
  const { basicInfo, setBasicInfo, proposalId } = useBookingForm();

  // State for the stepper UI
  const [step, setStep] = useState("Basic");
  const stepOrder = ["Basic", "Order"];

  // Local state for fetching and managing the 'Assigned Sales Person' dropdown
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(basicInfo.user || "");

  // Fetch the list of users from the API when the component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/users`
        );
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        console.error("Failed to load users:", error);
        toast.error("Failed to load user list.");
      }
    };

    fetchUsers();
  }, []);

  // Update the global form context whenever the selected user changes
  useEffect(() => {
    setBasicInfo((prev) => ({ ...prev, user: selectedUser }));
  }, [selectedUser, setBasicInfo]);

  /**
   * Validates all required fields before proceeding to the next step.
   * If a field is missing, it shows an error toast and prevents navigation.
   */
  const handleNext = () => {
    const mandatoryFields = {
      companyName: "Company Name",
      clientName: "Client Name",
      user: "Assigned Sales Person",
      clientType: "Client Type",
      bookingMode: "Booking Type",
      bookingSource: "Booking Source",
    };

    for (const field in mandatoryFields) {
      if (!basicInfo[field] || String(basicInfo[field]).trim() === "") {
        toast.error(
          `Please fill in the required field: ${mandatoryFields[field]}`
        );
        return; // Stop the function if a required field is empty
      }
    }

    // If all validations pass, navigate to the next step
    if (basicInfo.bookingSource === "Agency" && !basicInfo.agencyName) {
      toast.error(`Please fill in the required field: Agency Name`);
      return;
    }

    console.log(basicInfo);

    navigate("/create-booking-orderInfo");
  };

  /**
   * Handles file selection for the client logo, including validation.
   */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValidType = ["image/jpeg", "image/png", "image/webp"].includes(
      file.type
    );
    const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

    if (!isValidType) {
      toast.error(
        `Invalid format: ${file.name}. Please use JPG, PNG, or WEBP.`
      );
      return;
    }

    if (!isValidSize) {
      toast.error(`File too large: ${file.name} exceeds the 10MB limit.`);
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setBasicInfo((prev) => ({
      ...prev,
      companyLogo: { file, preview: imageUrl },
    }));
  };

  return (
    <div className="bg-white text-xs">
      <Navbar />
      {/* Add pb-24 to create space for the fixed footer */}
      <main className="ml-64 w-full flex-1 px-8 pb-24">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">
            {proposalId ? "Edit Proposal" : "Create Order"}
          </h1>
        </div>

        {/* Stepper UI */}
        <div className="flex gap-6 mb-6 text-sm font-medium">
          {stepOrder.map((label) => (
            <div
              key={label}
              className={
                step === label
                  ? "text-black border-b-2 border-black pb-1 flex items-center gap-1"
                  : "text-gray-500 pb-1 flex items-center gap-1"
              }
            >
              {label === "Basic" ? "Basic Information" : "Order Information"}
            </div>
          ))}
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-2 w-[70%] text-xs gap-6">
          {/* Company Name */}
          <div>
            <label className="block text-xs font-medium">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full p-2 border rounded mt-1"
              placeholder="Write..."
              value={basicInfo.companyName || ""}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, companyName: e.target.value })
              }
            />
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-xs font-medium">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full p-2 border rounded mt-1"
              placeholder="Write..."
              value={basicInfo.clientName || ""}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, clientName: e.target.value })
              }
            />
          </div>

          {/* Client Email */}
          <div>
            <label className="block text-xs font-medium">Client Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded mt-1"
              placeholder="Write..."
              value={basicInfo.clientEmail || ""}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, clientEmail: e.target.value })
              }
            />
          </div>

          {/* Client Contact */}
          <div>
            <label className="block text-xs font-medium">
              Client Contact Number
            </label>
            <input
              className="w-full p-2 border rounded mt-1"
              placeholder="Write..."
              value={basicInfo.clientContact || ""}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, clientContact: e.target.value })
              }
            />
          </div>

          {/* Client PAN */}
          <div>
            <label className="block text-xs font-medium">
              Client Pan Number
            </label>
            <input
              className="w-full p-2 border rounded mt-1"
              placeholder="Write..."
              value={basicInfo.clientPan || ""}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, clientPan: e.target.value })
              }
            />
          </div>

          {/* Client GST */}
          <div>
            <label className="block text-xs font-medium">
              Client GST Number
            </label>
            <input
              className="w-full p-2 border rounded mt-1"
              placeholder="Write..."
              value={basicInfo.clientGst || ""}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, clientGst: e.target.value })
              }
            />
          </div>

          {/* Image Upload and User Dropdown */}
          <div className="col-span-2 flex gap-10 items-start">
            <div className="w-[30%]">
              <label className="block text-xs font-medium mb-1">
                Client logo
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="w-full p-1 rounded mt-1"
              />
              {basicInfo.companyLogo && (
                <div className="relative mt-2">
                  <img
                    src={basicInfo.companyLogo.preview}
                    alt="logo"
                    className="h-20 w-20 object-cover rounded border"
                  />
                  <button
                    onClick={() =>
                      setBasicInfo((prev) => ({ ...prev, companyLogo: null }))
                    }
                    className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 ml-[15%]">
              <label className="block text-xs font-medium mb-1">
                Assigned Sales Person <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full p-2 border rounded mt-1"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select a user...</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Brand Display Name */}
          <div>
            <label className="block text-xs font-medium">
              Brand Display Name
            </label>
            <input
              className="w-full p-2 border rounded mt-1"
              placeholder="Write..."
              value={basicInfo.brandName || ""}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, brandName: e.target.value })
              }
            />
          </div>

          {/* Client Type */}
          <div>
            <label className="block text-xs font-medium">
              Client Type <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full p-2 border rounded mt-1"
              value={basicInfo.clientType || ""}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, clientType: e.target.value })
              }
            >
              <option value="">Select...</option>
              <option>Corporate</option>
              <option>Agency</option>
              <option>Direct</option>
              <option>Government</option>
            </select>
          </div>

          {/* Booking Type */}
          <div>
            <label className="block text-xs font-medium">
              Booking Type <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full p-2 border rounded mt-1"
              value={basicInfo.bookingMode || ""}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, bookingMode: e.target.value })
              }
            >
              <option value="">Select...</option>
              <option>Whatsapp</option>
              <option>Phone Call</option>
              <option>Email</option>
            </select>
          </div>

          {/* Booking Source */}
          <div>
            <label className="block text-xs font-medium">
              Booking Source <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full p-2 border rounded mt-1"
              value={basicInfo.bookingSource || ""}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, bookingSource: e.target.value })
              }
            >
              <option value="">Select...</option>
              <option>Direct</option>
              <option>Agency</option>
            </select>
          </div>

          {basicInfo.bookingSource === "Agency" ? (
            <div>
              <label className="block text-xs font-medium">
                Agency Name <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full p-2 border rounded mt-1"
                placeholder="Write..."
                value={basicInfo.agencyName || ""}
                onChange={(e) =>
                  setBasicInfo({ ...basicInfo, agencyName: e.target.value })
                }
              />
            </div>
          ) : null}

          {/* FOC Booking */}
          <div className="col-span-2 mt-2 flex items-center">
            <input
              id="focBooking"
              type="checkbox"
              checked={basicInfo.isFOCBooking || false}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, isFOCBooking: e.target.checked })
              }
              className="mr-2 h-4 w-4 accent-black"
            />
            <label htmlFor="focBooking" className="text-xs font-normal">
              FOC (Free of Cost) booking
            </label>
          </div>
        </div>
      </main>

      {/* --- STANDARDIZED FIXED FOOTER --- */}
      <div className="fixed bottom-0 right-0 bg-white z-10 left-0 md:left-64">
        <div className="flex justify-between items-center w-full px-6 py-3 max-w-screen-xl mx-auto">
          {/* *** THIS IS THE FIX *** */}
          {/* Changed the path to match the route for the dashboard defined in App.jsx */}
          <button
            type="button"
            className="border border-gray-300 bg-white text-gray-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-50"
            onClick={() => navigate("/booking-dashboard")}
          >
            Cancel
          </button>

          {/* Back and Next Buttons */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              disabled
              className="bg-black text-white px-3 py-1 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
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
