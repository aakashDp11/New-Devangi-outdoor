import React, { useEffect, useState, useCallback, useMemo } from "react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import { useBookingForm } from "../context/BookingFormContext";
import { toast } from "sonner";
import { useSidebar } from "../context/SidebarContext";
import Select from "react-select"; // Import for CustomSelect
import { FiAlertCircle } from "react-icons/fi";
import { FaArrowLeft, FaCheck } from "react-icons/fa";

// --- REUSABLE UI COMPONENTS (COPIED FROM CODE 2) ---

const Card = ({ children, className = "", ...props }) => (
  <div
    className={`
      bg-gray-100 bg-opacity-80 shadow-xl rounded-2xl w-full flex flex-col relative
      ${className}
    `}
    {...props}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white via-indigo-50 to-purple-50 opacity-20 animate-bg-gradient-flow-diagonal z-0 rounded-2xl"></div>
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

const Input = ({ className = "", label, mandatory = false, error = null, ...props }) => (
  <div className="relative w-full">
    <label className="text-sm font-medium text-gray-700 block mb-1">
      {label}
      {mandatory && <span className="ml-1 text-red-500">*</span>}
    </label>
    <input
      className={`border ${
        error ? "border-red-300" : "border-gray-200"
      } px-4 py-2 rounded-xl w-full bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md h-10 ${className}`}
      {...props}
    />
    {error && (
      <p className="absolute -bottom-5 left-0 text-red-500 text-xs mt-1 animate-slideDown flex items-center gap-1">
        <FiAlertCircle className="inline-block" /> {error}
      </p>
    )}
  </div>
);

export function CustomSelect({ mandatory = false, label, value, onChange, name, options, error, placeholder = "Select..." }) {
  const formattedValue = options.find((option) => option.value === value);
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: error ? '#ef4444' : '#D1D5DB',
      boxShadow: state.isFocused ? '0 0 0 1px #2563EB' : 'none',
      '&:hover': {
        borderColor: error ? '#ef4444' : '#9CA3AF',
      },
      borderRadius: '12px',
      padding: '4px 8px',
      minHeight: '40px',
      transition: 'all 0.2s',
      fontSize: '0.875rem',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9CA3AF',
      fontSize: '0.875rem',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#4B5563',
      fontSize: '0.875rem',
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 9999,
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#E5E7EB' : null,
      color: '#374151',
      '&:active': { backgroundColor: '#D1D5DB' },
      fontSize: '0.875rem',
    }),
  };

  return (
    <div className="flex flex-col space-y-1 w-full relative">
      <label className="text-sm font-medium text-gray-700 block">
        {label}
        {mandatory && <span className="ml-1 text-red-500">*</span>}
      </label>
      <Select
        className="w-full"
        name={name}
        options={options}
        value={formattedValue}
        onChange={(selectedOption) => onChange({ target: { name, value: selectedOption?.value || "" } })}
        isSearchable
        styles={customStyles}
        placeholder={placeholder}
        menuPortalTarget={document.body}
        menuPosition="fixed"
      />
      {error && (
        <span className="text-red-500 text-xs mt-1 flex items-center gap-1 absolute top-full">
          <FiAlertCircle className="inline-block" /> {error}
        </span>
      )}
    </div>
  );
}

// --- VALIDATION LOGIC (COPIED FROM CODE 2) ---

const validators = {
  required: (value) => {
    if (typeof value === 'string') {
      return value.trim() !== '';
    }
    return value !== null && value !== undefined && value !== '';
  },
  email: (value) => {
    return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },
  contact: (value) => {
    // Assuming a simple numerical check for contact
    return !value || /^[0-9]{7,15}$/.test(value);
  },
  pan: (value) => {
    return !value || /^[A-Z0-9]{10}$/i.test(value);
  },
  gst: (value) => {
    return !value || /^[A-Z0-9]{15}$/i.test(value);
  },
};

const getValidationMessage = (fieldName, validationType) => {
  const nameMap = {
    companyName: "Company Name",
    clientName: "Client Name",
    user: "Assigned Sales Person",
    clientType: "Client Type",
    bookingMode: "Booking Type",
    bookingSource: "Booking Source",
    agencyName: "Agency Name",
    clientEmail: "Client Email",
    clientContact: "Client Contact Number",
    clientPan: "Client PAN Number",
    clientGst: "Client GST Number",
  };
  const displayName = nameMap[fieldName] || fieldName;

  const messages = {
    required: `${displayName} is required`,
    email: `Invalid email format`,
    contact: `Contact must be 7-15 digits`,
    pan: `PAN must be 10 alphanumeric characters`,
    gst: `GST must be 15 alphanumeric characters`,
  };
  return messages[validationType] || `Invalid ${displayName}`;
};

// --- MAIN COMPONENT (COMBINING LOGIC FROM CODE 1 AND UI FROM CODE 2) ---

export default function CreateOrderBasicInfo() {
  const navigate = useNavigate();
  // State from BookingFormContext (Code 1)
  const { basicInfo, setBasicInfo, proposalId } = useBookingForm();
  // Sidebar state (Code 1)
  const { isCollapsed } = useSidebar();

  // Local state for fetching users (Code 1)
  const [users, setUsers] = useState([]);
  // Validation state (Code 2)
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // 1. Fetch Users (useEffect from Code 1)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/users`
        );
        const data = await res.json();
        setUsers(data);
        // NOTE: The logic to set basicInfo.user based on selectedUser from Code 1 is now handled in handleValidatedInputChange
      } catch (error) {
        console.error("Failed to load users:", error);
        toast.error("Failed to load user list.");
      }
    };
    fetchUsers();
  }, []);

  // 2. Validation and Change Handlers (Logic from Code 2)

  const validateField = useCallback((name, value, formData = basicInfo) => {
    const errors = [];
    const isAgency = formData.bookingSource === "Agency";
    const mandatoryFields = [
      "companyName", "clientName", "user", "clientType", "bookingMode", "bookingSource",
    ];
    if (isAgency) {
      mandatoryFields.push("agencyName");
    }

    if (mandatoryFields.includes(name) && !validators.required(value)) {
      errors.push(getValidationMessage(name, "required"));
    }

    switch (name) {
      case "clientEmail":
        if (value && !validators.email(value)) errors.push(getValidationMessage(name, "email"));
        break;
      case "clientContact":
        if (value && !validators.contact(value)) errors.push(getValidationMessage(name, "contact"));
        break;
      case "clientPan":
        if (value && !validators.pan(value)) errors.push(getValidationMessage(name, "pan"));
        break;
      case "clientGst":
        if (value && !validators.gst(value)) errors.push(getValidationMessage(name, "gst"));
        break;
      case "agencyName":
        // Check for agencyName being required only if bookingSource is "Agency"
        if (isAgency && !validators.required(value)) errors.push(getValidationMessage(name, "required"));
        break;
      default:
        break;
    }
    return errors;
  }, [basicInfo]);

  const handleValidatedInputChange = useCallback((e) => {
    const { name, value } = e.target;
    const isSpecialCase = name === 'user' || name === 'clientType' || name === 'bookingMode' || name === 'bookingSource';

    // Clear agencyName if bookingSource changes to non-Agency
    let newBasicInfo = { ...basicInfo, [name]: value };
    if (name === 'bookingSource' && value !== 'Agency') {
        newBasicInfo = { ...newBasicInfo, agencyName: "" };
    }

    setBasicInfo(newBasicInfo);
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    // Validate the new state
    const errors = validateField(name, value, newBasicInfo);
    setFieldErrors((prev) => ({ ...prev, [name]: errors.length > 0 ? errors[0] : null }));

    // Re-validate agencyName if bookingSource changes
    if (name === 'bookingSource') {
        const agencyNameErrors = validateField('agencyName', newBasicInfo.agencyName, newBasicInfo);
        setFieldErrors((prev) => ({ ...prev, agencyName: agencyNameErrors.length > 0 ? agencyNameErrors[0] : null }));
    }

  }, [setBasicInfo, validateField, basicInfo]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errors = validateField(name, basicInfo[name]);
    setFieldErrors((prev) => ({ ...prev, [name]: errors.length > 0 ? errors[0] : null }));
  }, [basicInfo, validateField]);

  const validateAll = useCallback(() => {
    let hasErrors = false;
    const newErrors = {};
    const allFields = [
      "companyName", "clientName", "clientEmail", "clientContact",
      "clientPan", "clientGst", "user", "clientType", "bookingMode", "bookingSource", "agencyName"
    ];

    for (const field of allFields) {
      // Only validate required fields or fields that have a value
      const value = basicInfo[field] || "";
      const errors = validateField(field, value);

      if (errors.length > 0) {
        newErrors[field] = errors[0];
        hasErrors = true;
      }
    }
    setFieldErrors(newErrors);
    setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    return !hasErrors;
  }, [basicInfo, validateField]);

  // 3. handleNext (Logic from Code 1, enhanced with Code 2's validateAll)
  const handleNext = () => {
    if (!validateAll()) {
      toast.error("Please fix the errors before proceeding.");
      return;
    }
    // console.log(basicInfo); // Kept from Code 1 for debug if needed
    navigate("/create-booking-orderInfo");
  };

  // 4. handleFileChange (Logic from Code 1)
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

  // 5. Select Options (Logic from Code 2)
  const userOptions = useMemo(() => {
    return users.map((user) => ({
      value: user._id,
      label: `${user.name} (${user.email})`,
    }));
  }, [users]);

  const clientTypeOptions = [
    { value: "Corporate", label: "Corporate" },
    { value: "Agency", label: "Agency" },
    { value: "Direct", label: "Direct" },
    { value: "Government", label: "Government" },
  ];
  const bookingModeOptions = [
    { value: "Whatsapp", label: "Whatsapp" },
    { value: "Phone Call", label: "Phone Call" },
    { value: "Email", label: "Email" },
    { value: "Custom", label: "Custom" },
  ];
  const bookingSourceOptions = [
    { value: "Direct", label: "Direct" },
    { value: "Agency", label: "Agency" },
  ];


  // 6. Render UI (Structure and Styling from Code 2)
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-[var(--color-text)] flex flex-col lg:flex-row`}>
      <Navbar />
      <main className={`flex-1 overflow-y-auto px-4 md:px-6 py-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <div className="max-w-screen-xl w-full mx-auto">
          <div className="flex justify-between items-center mb-6 animate-slideDown">
            <Button onClick={() => navigate(-1)} className="bg-gray-700 text-white">
              <FaArrowLeft className="inline mr-2" /> Back
            </Button>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-6 animate-slideDown">
            {proposalId ? "Edit Proposal" : "Create Order"}
          </h1>
          
          {/* Step Navigation Tabs (UI from Code 2) */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 text-sm font-medium border-b border-gray-200 animate-fadeIn">
            <div
              className={`flex items-center gap-2 pb-2 transition-colors duration-200 border-b-2 border-[black] text-[black]`}
            >
              <span className="text-[black]">
                <FaCheck />
              </span>
              Basic Information
            </div>
            <div className="flex items-center gap-2 pb-2 text-gray-500">
              <span className="text-xl leading-none">•</span>
              Order Information
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="pb-24 space-y-8">
            <Card className="lg:col-span-2">
              <CardContent>
                <h2 className="text-lg font-semibold text-gray-800 mb-8">Basic Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                  <Input
                    label="Company Name"
                    mandatory
                    name="companyName"
                    value={basicInfo.companyName || ""}
                    onChange={handleValidatedInputChange}
                    onBlur={handleBlur}
                    error={touched.companyName && fieldErrors.companyName}
                  />
                  <Input
                    label="Client Name"
                    mandatory
                    name="clientName"
                    value={basicInfo.clientName || ""}
                    onChange={handleValidatedInputChange}
                    onBlur={handleBlur}
                    error={touched.clientName && fieldErrors.clientName}
                  />
                  <Input
                    label="Client Email"
                    name="clientEmail"
                    value={basicInfo.clientEmail || ""}
                    onChange={handleValidatedInputChange}
                    onBlur={handleBlur}
                    error={touched.clientEmail && fieldErrors.clientEmail}
                  />
                  <Input
                    label="Client Contact Number"
                    name="clientContact"
                    value={basicInfo.clientContact || ""}
                    onChange={handleValidatedInputChange}
                    onBlur={handleBlur}
                    error={touched.clientContact && fieldErrors.clientContact}
                  />
                  <Input
                    label="Client PAN Number"
                    name="clientPan"
                    value={basicInfo.clientPan || ""}
                    onChange={handleValidatedInputChange}
                    onBlur={handleBlur}
                    error={touched.clientPan && fieldErrors.clientPan}
                  />
                  <Input
                    label="Client GST Number"
                    name="clientGst"
                    value={basicInfo.clientGst || ""}
                    onChange={handleValidatedInputChange}
                    onBlur={handleBlur}
                    error={touched.clientGst && fieldErrors.clientGst}
                  />

                  {/* Client Logo - column 1 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Client Logo</label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleFileChange}
                      className="w-full p-1 rounded-xl mt-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {basicInfo.companyLogo?.preview && (
                      <div className="relative mt-4 w-20">
                        <img
                          src={basicInfo.companyLogo.preview}
                          alt="logo"
                          className="h-20 w-20 object-cover rounded-xl border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setBasicInfo((prev) => ({ ...prev, companyLogo: null }))
                          }
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                    {/* Assigned Sales Person - column 2 */}
                  <CustomSelect
                    label="Assigned Sales Person"
                    mandatory
                    name="user"
                    value={basicInfo.user || ""}
                    onChange={handleValidatedInputChange}
                    options={userOptions}
                    error={touched.user && fieldErrors.user}
                  />
                    
                    {/* BOOKING SOURCE MOVED HERE - column 3 */}
                    <CustomSelect
                    label="Booking Source"
                    mandatory
                    name="bookingSource"
                    value={basicInfo.bookingSource || ""}
                    onChange={handleValidatedInputChange}
                    options={bookingSourceOptions}
                    error={touched.bookingSource && fieldErrors.bookingSource}
                  />

                    {/* Remaining fields adjusted below */}

                  <Input
                    label="Brand Display Name"
                    name="brandName"
                    value={basicInfo.brandName || ""}
                    onChange={handleValidatedInputChange}
                    onBlur={handleBlur}
                    // No validation error state needed for non-mandatory, unvalidated field
                  />
                  <CustomSelect
                    label="Client Type"
                    mandatory
                    name="clientType"
                    value={basicInfo.clientType || ""}
                    onChange={handleValidatedInputChange}
                    options={clientTypeOptions}
                    error={touched.clientType && fieldErrors.clientType}
                  />
                  <CustomSelect
                    label="Booking Type"
                    mandatory
                    name="bookingMode"
                    value={basicInfo.bookingMode || ""}
                    onChange={handleValidatedInputChange}
                    options={bookingModeOptions}
                    error={touched.bookingMode && fieldErrors.bookingMode}
                  />
                  
                  {basicInfo.bookingSource === "Agency" && (
                    <Input
                      label="Agency Name"
                      mandatory
                      name="agencyName"
                      value={basicInfo.agencyName || ""}
                      onChange={handleValidatedInputChange}
                      onBlur={handleBlur}
                      error={touched.agencyName && fieldErrors.agencyName}
                    />
                  )}
                    {/* This empty div is now unnecessary as Booking Source is in column 3 */}
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </main>

      {/* Footer (UI from Code 2) */}
      <div className={`fixed bottom-0 right-0 bg-white z-10 transition-all duration-300 border-t border-gray-200 ${isCollapsed ? "left-0 lg:left-24" : "left-0 lg:left-64"}`}>
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-xl mx-auto">
          <Button className="bg-gray-700 hover:bg-gray-800" onClick={() => navigate("/booking-dashboard")}>
            Cancel
          </Button>
          <div className="flex items-center space-x-3">
            <Button
              disabled
              className="bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              className="bg-[black] text-white hover:bg-gray-800"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      
      {/* Styles (Code 2) */}
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