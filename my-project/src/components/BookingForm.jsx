import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import { useBookingForm } from "../context/BookingFormContext";
import { toast } from "sonner";
import { useSidebar } from "../context/SidebarContext";

export default function CreateOrderBasicInfo() {
  const navigate = useNavigate();
  const { basicInfo, setBasicInfo, proposalId } = useBookingForm();
  const { isCollapsed } = useSidebar();

  // Stepper state
  const [step, setStep] = useState("Basic");
  const stepOrder = ["Basic", "Order"];

  // Users dropdown
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(basicInfo.user || "");

  // Validation errors
  const [errors, setErrors] = useState({});

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users`);
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        console.error("Failed to load users:", error);
        toast.error("Failed to load user list.");
      }
    };
    fetchUsers();
  }, []);

  // Sync user selection with form
  useEffect(() => {
    setBasicInfo((prev) => ({ ...prev, user: selectedUser }));
  }, [selectedUser, setBasicInfo]);

  // Validation rules
  const validators = {
    companyName: (val) => val.trim() !== "",
    clientName: (val) => val.trim() !== "",
    clientEmail: (val) =>
      !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), // optional
    clientContact: (val) =>
      !val || /^[0-9]{7,15}$/.test(val), // optional, 7–15 digits
    clientPan: (val) =>
      !val || /^[A-Z0-9]{10}$/i.test(val), // optional, 10 alphanumeric
    clientGst: (val) =>
      !val || /^[A-Z0-9]{15}$/i.test(val), // optional, 15 alphanumeric
    user: (val) => val.trim() !== "",
    clientType: (val) => val.trim() !== "",
    bookingMode: (val) => val.trim() !== "",
    bookingSource: (val) => val.trim() !== "",
    agencyName: (val, info) =>
      info.bookingSource !== "Agency" || (val && val.trim() !== ""),
  };

  // Validate a field
  const validateField = (field, value) => {
    const isValid = validators[field]?.(value, basicInfo);
    setErrors((prev) => ({
      ...prev,
      [field]: isValid ? "" : `Invalid ${field}`,
    }));
    return isValid;
  };

  // Validate all
  const validateAll = () => {
    let valid = true;
    const newErrors = {};
    for (const field in validators) {
      const isValid = validators[field](basicInfo[field] || "", basicInfo);
      if (!isValid) {
        valid = false;
        newErrors[field] = `Please enter a valid ${field}`;
      }
    }
    setErrors(newErrors);
    return valid;
  };

  // Next step
  const handleNext = () => {
    if (!validateAll()) {
      toast.error("Please fix the errors before proceeding.");
      return;
    }
    navigate("/create-booking-orderInfo");
  };

  // File upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValidType = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
    const isValidSize = file.size <= 10 * 1024 * 1024;

    if (!isValidType) {
      toast.error(`Invalid format: ${file.name}. Use JPG, PNG, or WEBP.`);
      return;
    }
    if (!isValidSize) {
      toast.error(`File too large: ${file.name} exceeds 10MB.`);
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setBasicInfo((prev) => ({
      ...prev,
      companyLogo: { file, preview: imageUrl },
    }));
  };

  return (
    <div className="bg-white text-xs flex">
      <Navbar />
      <main
        className={`flex-1 px-8 pb-24 transition-all duration-300 ${
          isCollapsed ? "lg:ml-24" : "lg:ml-64"
        }`}
      >
        <div className="flex justify-between items-center mb-8 pt-6">
          <h1 className="text-2xl font-semibold">
            {proposalId ? "Edit Proposal" : "Create Order"}
          </h1>
        </div>

        {/* Stepper */}
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

        {/* Form */}
        <div className="grid grid-cols-2 w-[70%] text-xs gap-6">
          {/* Company Name */}
          <div>
            <label className="block font-medium">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              className={`w-full p-2 border rounded mt-1 ${
                errors.companyName ? "border-red-500" : ""
              }`}
              placeholder="Write..."
              value={basicInfo.companyName || ""}
              onChange={(e) => {
                setBasicInfo({ ...basicInfo, companyName: e.target.value });
                validateField("companyName", e.target.value);
              }}
            />
            {errors.companyName && (
              <p className="text-red-500 text-[10px]">{errors.companyName}</p>
            )}
          </div>

          {/* Client Name */}
          <div>
            <label className="block font-medium">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              className={`w-full p-2 border rounded mt-1 ${
                errors.clientName ? "border-red-500" : ""
              }`}
              placeholder="Write..."
              value={basicInfo.clientName || ""}
              onChange={(e) => {
                setBasicInfo({ ...basicInfo, clientName: e.target.value });
                validateField("clientName", e.target.value);
              }}
            />
            {errors.clientName && (
              <p className="text-red-500 text-[10px]">{errors.clientName}</p>
            )}
          </div>

          {/* Client Email */}
          <div>
            <label className="block font-medium">Client Email</label>
            <input
              type="email"
              className={`w-full p-2 border rounded mt-1 ${
                errors.clientEmail ? "border-red-500" : ""
              }`}
              placeholder="Write..."
              value={basicInfo.clientEmail || ""}
              onChange={(e) => {
                setBasicInfo({ ...basicInfo, clientEmail: e.target.value });
                validateField("clientEmail", e.target.value);
              }}
            />
            {errors.clientEmail && (
              <p className="text-red-500 text-[10px]">{errors.clientEmail}</p>
            )}
          </div>

          {/* Client Contact */}
          <div>
            <label className="block font-medium">Client Contact Number</label>
            <input
              className={`w-full p-2 border rounded mt-1 ${
                errors.clientContact ? "border-red-500" : ""
              }`}
              placeholder="Write..."
              value={basicInfo.clientContact || ""}
              onChange={(e) => {
                setBasicInfo({ ...basicInfo, clientContact: e.target.value });
                validateField("clientContact", e.target.value);
              }}
            />
            {errors.clientContact && (
              <p className="text-red-500 text-[10px]">{errors.clientContact}</p>
            )}
          </div>

          {/* PAN */}
          <div>
            <label className="block font-medium">Client Pan Number</label>
            <input
              className={`w-full p-2 border rounded mt-1 ${
                errors.clientPan ? "border-red-500" : ""
              }`}
              placeholder="Write..."
              value={basicInfo.clientPan || ""}
              onChange={(e) => {
                setBasicInfo({ ...basicInfo, clientPan: e.target.value });
                validateField("clientPan", e.target.value);
              }}
            />
            {errors.clientPan && (
              <p className="text-red-500 text-[10px]">{errors.clientPan}</p>
            )}
          </div>

          {/* GST */}
          <div>
            <label className="block font-medium">Client GST Number</label>
            <input
              className={`w-full p-2 border rounded mt-1 ${
                errors.clientGst ? "border-red-500" : ""
              }`}
              placeholder="Write..."
              value={basicInfo.clientGst || ""}
              onChange={(e) => {
                setBasicInfo({ ...basicInfo, clientGst: e.target.value });
                validateField("clientGst", e.target.value);
              }}
            />
            {errors.clientGst && (
              <p className="text-red-500 text-[10px]">{errors.clientGst}</p>
            )}
          </div>

          {/* Logo + User */}
          <div className="col-span-2 flex gap-10 items-start">
            <div className="w-[30%]">
              <label className="block font-medium mb-1">Client Logo</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="w-full p-1 rounded mt-1"
              />
              {basicInfo.companyLogo && (
                <div className="relative mt-2 w-20">
                  <img
                    src={basicInfo.companyLogo.preview}
                    alt="logo"
                    className="h-20 w-20 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setBasicInfo((prev) => ({ ...prev, companyLogo: null }))
                    }
                    className="absolute -top-2 -right-2 bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-gray-700"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 ml-[15%]">
              <label className="block font-medium mb-1">
                Assigned Sales Person <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full p-2 border rounded mt-1 ${
                  errors.user ? "border-red-500" : ""
                }`}
                value={selectedUser}
                onChange={(e) => {
                  setSelectedUser(e.target.value);
                  validateField("user", e.target.value);
                }}
              >
                <option value="">Select a user...</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              {errors.user && (
                <p className="text-red-500 text-[10px]">{errors.user}</p>
              )}
            </div>
          </div>

          {/* Brand */}
          <div>
            <label className="block font-medium">Brand Display Name</label>
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
            <label className="block font-medium">
              Client Type <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full p-2 border rounded mt-1 ${
                errors.clientType ? "border-red-500" : ""
              }`}
              value={basicInfo.clientType || ""}
              onChange={(e) => {
                setBasicInfo({ ...basicInfo, clientType: e.target.value });
                validateField("clientType", e.target.value);
              }}
            >
              <option value="">Select...</option>
              <option>Corporate</option>
              <option>Agency</option>
              <option>Direct</option>
              <option>Government</option>
            </select>
            {errors.clientType && (
              <p className="text-red-500 text-[10px]">{errors.clientType}</p>
            )}
          </div>

          {/* Booking Type */}
          <div>
            <label className="block font-medium">
              Booking Type <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full p-2 border rounded mt-1 ${
                errors.bookingMode ? "border-red-500" : ""
              }`}
              value={basicInfo.bookingMode || ""}
              onChange={(e) => {
                setBasicInfo({ ...basicInfo, bookingMode: e.target.value });
                validateField("bookingMode", e.target.value);
              }}
            >
              <option value="">Select...</option>
              <option>Whatsapp</option>
              <option>Phone Call</option>
              <option>Email</option>
            </select>
            {errors.bookingMode && (
              <p className="text-red-500 text-[10px]">{errors.bookingMode}</p>
            )}
          </div>

          {/* Booking Source */}
          <div>
            <label className="block font-medium">
              Booking Source <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full p-2 border rounded mt-1 ${
                errors.bookingSource ? "border-red-500" : ""
              }`}
              value={basicInfo.bookingSource || ""}
              onChange={(e) => {
                setBasicInfo({ ...basicInfo, bookingSource: e.target.value });
                validateField("bookingSource", e.target.value);
              }}
            >
              <option value="">Select...</option>
              <option>Direct</option>
              <option>Agency</option>
            </select>
            {errors.bookingSource && (
              <p className="text-red-500 text-[10px]">{errors.bookingSource}</p>
            )}
          </div>

          {/* Agency Name */}
          {basicInfo.bookingSource === "Agency" && (
            <div>
              <label className="block font-medium">
                Agency Name <span className="text-red-500">*</span>
              </label>
              <input
                className={`w-full p-2 border rounded mt-1 ${
                  errors.agencyName ? "border-red-500" : ""
                }`}
                placeholder="Write..."
                value={basicInfo.agencyName || ""}
                onChange={(e) => {
                  setBasicInfo({ ...basicInfo, agencyName: e.target.value });
                  validateField("agencyName", e.target.value);
                }}
              />
              {errors.agencyName && (
                <p className="text-red-500 text-[10px]">{errors.agencyName}</p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <div
        className={`fixed bottom-0 right-0 bg-white z-10 left-0 transition-all duration-300 ${
          isCollapsed ? "lg:left-24" : "lg:left-64"
        }`}
      >
        <div className="flex justify-between items-center w-full px-6 py-3 max-w-screen-xl mx-auto">
          <button
            type="button"
            className="border border-gray-300 bg-white text-gray-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-50"
            onClick={() => navigate("/booking-dashboard")}
          >
            Cancel
          </button>
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
