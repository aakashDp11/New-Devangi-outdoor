import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useSpaceForm } from "../context/SpaceFormContext";
import { toast } from "sonner";
import MapPreview from "./MapPreview";
import Select from "react-select";
import { useSidebar } from "../context/SidebarContext";

// Validation utility functions
const validators = {
  // Text validations
  isValidName: (value) => {
    const regex = /^[a-zA-Z\s'-]+$/;
    return regex.test(value) && value.length >= 2;
  },

  isValidSpaceName: (value) => {
    const regex = /^[a-zA-Z0-9\s'-]+$/;
    return regex.test(value) && value.length >= 2 && value.length <= 100;
  },

  // Email validation
  isValidEmail: (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  },

  // Phone validation (Indian format)
  isValidPhone: (value) => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(value.replace(/\s+/g, ''));
  },

  // Numeric validations
  isValidPrice: (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0 && num <= 100000000; // Max 10 crores
  },

  isValidFootfall: (value) => {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0 && num <= 10000000; // Max 1 crore
  },

  isValidDimension: (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0 && num <= 1000; // Max 1000 ft
  },

  // Coordinate validations
  isValidLatitude: (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= -90 && num <= 90;
  },

  isValidLongitude: (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= -180 && num <= 180;
  },

  // PIN code validation (Indian format)
  isValidPinCode: (value) => {
    const regex = /^[1-9][0-9]{5}$/;
    return regex.test(value);
  },

  // Date validations
  isValidDate: (dateStr) => {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  },

  isEndDateValid: (startDate, endDate) => {
    if (!startDate || !endDate) return true;
    
    // Handle both DD-MM-YYYY and YYYY-MM-DD formats
    let start, end;
    
    if (startDate.includes('-') && startDate.split('-')[0].length === 4) {
      // YYYY-MM-DD format
      start = new Date(startDate);
    } else if (startDate.includes('-') && startDate.split('-')[2].length === 4) {
      // DD-MM-YYYY format
      const [day, month, year] = startDate.split('-');
      start = new Date(`${year}-${month}-${day}`);
    } else {
      start = new Date(startDate);
    }
    
    if (endDate.includes('-') && endDate.split('-')[0].length === 4) {
      // YYYY-MM-DD format
      end = new Date(endDate);
    } else if (endDate.includes('-') && endDate.split('-')[2].length === 4) {
      // DD-MM-YYYY format
      const [day, month, year] = endDate.split('-');
      end = new Date(`${year}-${month}-${day}`);
    } else {
      end = new Date(endDate);
    }
    
    return end > start;
  },

  // Address validation
  isValidAddress: (value) => {
    return value.length >= 10 && value.length <= 500;
  },

  // Resolution validation for DOOH
  isValidResolution: (value) => {
    const regex = /^\d+x\d+$/i;
    return regex.test(value) || /^\d+\s*[x*]\s*\d+$/i.test(value);
  },

  // File validations
  isValidImageFile: (file) => {
    if (!file) return true; // Optional files
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    return validTypes.includes(file.type) && file.size <= maxSize;
  },

  // Custom business validations
  isValidOwnershipDuration: (startDate, endDate, ownershipType) => {
    if (!startDate || !endDate || !ownershipType) return { valid: true };
    
    const start = validators.parseDate(startDate);
    const end = validators.parseDate(endDate);
    
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { valid: true }; // Let other validations handle invalid dates
    }
    
    const diffDays = (end - start) / (1000 * 60 * 60 * 24);
    
    // Minimum lease period validations
    if (ownershipType === 'Leased' && diffDays < 30) {
      return { valid: false, message: 'Lease period should be at least 30 days' };
    }
    return { valid: true };
  }
};

// Enhanced validation messages
const getValidationMessage = (field, value, form) => {
  switch (field) {
    case 'spaceName':
      if (!value) return 'Space name is required';
      if (value.length < 2) return 'Space name must be at least 2 characters';
      if (value.length > 100) return 'Space name must be less than 100 characters';
      if (!validators.isValidSpaceName(value)) return 'Space name contains invalid characters';
      return null;

    case 'landlord':
      if (!value) return 'Landlord name is required';
      if (!validators.isValidName(value)) return 'Please enter a valid landlord name';
      return null;

    case 'price':
    case 'buyingPrice':
      if (value && !validators.isValidPrice(value)) return 'Please enter a valid price (max 10 crores)';
      return null;

    case 'footfall':
      if (value && !validators.isValidFootfall(value)) return 'Please enter a valid footfall number';
      return null;

    case 'width':
    case 'height':
      if (form.spaceType !== 'BQS' && form.spaceType !== 'DigitalBQS' && form.spaceType !== 'Transit') {
        if (!value) return `${field} is required`;
        if (!validators.isValidDimension(value)) return `Please enter a valid ${field} (max 1000 ft)`;
      }
      return null;

    case 'latitude':
      if (form.spaceType !== 'BQS' && form.spaceType !== 'DigitalBQS' && form.spaceType !== 'Transit') {
        if (!value) return 'Latitude is required';
        if (!validators.isValidLatitude(value)) return 'Please enter a valid latitude (-90 to 90)';
      }
      return null;

    case 'longitude':
      if (form.spaceType !== 'BQS' && form.spaceType !== 'DigitalBQS' && form.spaceType !== 'Transit') {
        if (!value) return 'Longitude is required';
        if (!validators.isValidLongitude(value)) return 'Please enter a valid longitude (-180 to 180)';
      }
      return null;

    case 'zip':
      if (value && !validators.isValidPinCode(value)) return 'Please enter a valid 6-digit PIN code';
      return null;

    case 'address':
      if (!value) return 'Address is required';
      if (!validators.isValidAddress(value)) return 'Address should be between 10-500 characters';
      return null;

    case 'city':
      if (!value) return 'City is required';
      if (!validators.isValidName(value)) return 'Please enter a valid city name';
      return null;

    case 'resolution':
      if (form.spaceType === 'DOOH') {
        if (!value) return 'Resolution is required for DOOH';
        if (!validators.isValidResolution(value)) return 'Please enter resolution in format like "1920x1080"';
      }
      return null;

    case 'unit':
      if (form.spaceType === 'DOOH') {
        if (!value) return 'Slots are required for DOOH';
        const num = parseInt(value);
        if (isNaN(num) || num < 1 || num > 10) return 'Slots should be between 1-10 for DOOH';
      }
      return null;

    case 'startDate':
      if (!value) return 'Start date is required';
      if (!validators.isValidDate(value)) return 'Please enter a valid start date';
      return null;

    case 'endDate':
      if (!value) return 'End date is required';
      if (!validators.isValidDate(value)) return 'Please enter a valid end date';
      if (!validators.isEndDateValid(form.startDate, value)) return 'End date must be after start date';
      
      // Check ownership duration
      const durationCheck = validators.isValidOwnershipDuration(form.startDate, value, form.ownershipType);
      if (!durationCheck.valid) return durationCheck.message;
      return null;

    default:
      return null;
  }
};

// Real-time validation hook
const useFieldValidation = () => {
  const [fieldErrors, setFieldErrors] = useState({});
  const [fieldWarnings, setFieldWarnings] = useState({});

  const validateField = (name, value, form) => {
    const error = getValidationMessage(name, value, form);
    
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));

    // Add warnings for potential issues
    let warning = null;
    if (name === 'footfall' && value) {
      const num = parseInt(value);
      if (num > 1000000) warning = 'Very high footfall - please verify';
    }
    
    if (name === 'price' && value) {
      const num = parseFloat(value);
      if (num > 10000000) warning = 'Very high price - please verify';
    }

    setFieldWarnings(prev => ({
      ...prev,
      [name]: warning
    }));

    return !error;
  };

  const clearFieldError = (name) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  return { fieldErrors, fieldWarnings, validateField, clearFieldError };
};

// New component specifically for multi-select audience field with custom UI
function MultiAudienceSelect({ label, name, value, onChange, options, mandatory }) {
  const valueAsArray = Array.isArray(value) ? value : [];
  const selectedValueObjects = options.filter(option => valueAsArray.includes(option.value));
  const selectedOptions = options.filter(option => valueAsArray.includes(option.value) && option.value !== "");
  const unselectedOptions = options.filter(option => !valueAsArray.includes(option.value) && option.value !== "");

  const groupedOptions = [];
  if (selectedOptions.length > 0) {
    groupedOptions.push({ label: 'Selected', options: selectedOptions });
  }
  if (unselectedOptions.length > 0) {
    groupedOptions.push({ label: 'Not Selected', options: unselectedOptions });
  }

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#f1f5f9' : null,
      color: 'inherit',
      '&:active': { backgroundColor: '#e5e7eb' },
    }),
    multiValue: () => ({ display: 'none' }),
  };

  const handleChange = (selectedOptions) => {
    const newValues = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    onChange({ target: { name, value: newValues } });
  };

  const formatOptionLabel = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {label}
      {valueAsArray.includes(value) && <span>✓</span>}
    </div>
  );

  return (
    <div>
      <label className="text-sm block mb-1">
        {label}
        {mandatory === "true" && <span className="ml-1 text-red-500">*</span>}
      </label>
      <Select
        isMulti
        name={name}
        options={groupedOptions}
        className="w-3/4"
        styles={customStyles}
        value={selectedValueObjects}
        onChange={handleChange}
        formatOptionLabel={formatOptionLabel}
        hideSelectedOptions={false}
        closeMenuOnSelect={false}
        placeholder="Select one or more audience types..."
      />
    </div>
  );
}

export default function AddSpaceForm() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const {
    form,
    handleInputChange,
    step,
    setStep,
    completedSteps,
    setCompletedSteps,
    stepOrder,
  } = useSpaceForm();

  // Add validation hooks
  const { fieldErrors, fieldWarnings, validateField, clearFieldError } = useFieldValidation();

  // State for dependent dropdown options
  const [transitTypeOptions, setTransitTypeOptions] = useState([]);
  const [lineOptions, setLineOptions] = useState([]);

  const formatForInput = (dateStr) => {
    if (!dateStr) return "";
    const [dd, mm, yyyy] = dateStr.split("-");
    if (!yyyy || !mm || !dd) return "";
    return `${yyyy}-${mm}-${dd}`;
  };

  // Enhanced input change handler with validation
  const handleValidatedInputChange = (e) => {
    const { name, value } = e.target;
    
    // Update form state
    handleInputChange(e);
    
    // Validate field in real-time
    setTimeout(() => {
      validateField(name, value, { ...form, [name]: value });
    }, 300); // Debounce validation
  };

  // Enhanced validation for current step - REMOVED TOAST MESSAGES
  const validateCurrentStep = () => {
    const isSpecialType = form.spaceType === "BQS" || form.spaceType === "DigitalBQS" || form.spaceType === "Transit";

    const mandatoryFieldsByStep = {
      Basic: [
        "spaceName", "landlord", "spaceType", "ownershipType", "startDate", "endDate",
      ],
      Specifications:
        form.spaceType === "DOOH"
          ? ["unit", "resolution", "width", "height"]
          : ["illumination", "width", "height"],
      Location: ["address", "city", "state", "latitude", "longitude"],
    };

    // Modify mandatory fields for special types
    if (isSpecialType) {
      mandatoryFieldsByStep.Basic.push("buyingPrice");
      mandatoryFieldsByStep.Specifications = ["illumination"];
      const locationFields = mandatoryFieldsByStep.Location;
      mandatoryFieldsByStep.Location = locationFields.filter(
        field => !['zip', 'latitude', 'longitude'].includes(field)
      );
    }
    
    if (form.spaceType === 'Transit') {
      mandatoryFieldsByStep.Basic.push('transitType', 'transitLine');
    }

    const currentFields = mandatoryFieldsByStep[step] || [];
    let hasErrors = false;

    // Validate all current step fields
    for (const field of currentFields) {
      const value = form[field];
      const isValid = validateField(field, value, form);
      
      if (!isValid || !value || value.toString().trim() === "") {
        hasErrors = true;
      }
    }

    // Check for any existing field errors in current step
    const currentStepErrors = Object.keys(fieldErrors).filter(field => 
      currentFields.includes(field) && fieldErrors[field]
    );

    if (currentStepErrors.length > 0) {
      hasErrors = true;
    }

    return !hasErrors;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (!completedSteps.includes(step)) {
      setCompletedSteps((prev) => [...prev, step]);
    }
    if (step === "Location") {
      navigate("/preview-add-space");
    }
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  };
  
  const handleBack = () => {
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      const newStep = stepOrder[currentIndex - 1];
      setStep(newStep);
      setCompletedSteps((prev) => prev.filter((s) => s !== newStep));
    }
  };

  // Enhanced file validation
  const handleFileValidation = (files, fieldName) => {
    if (!files) return true;
    
    const fileArray = Array.isArray(files) ? files : [files];
    
    for (const file of fileArray) {
      if (!validators.isValidImageFile(file)) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    // Final validation of all critical fields
    const criticalErrors = [];
    Object.keys(form).forEach(key => {
      const error = getValidationMessage(key, form[key], form);
      if (error) criticalErrors.push(error);
    });

    if (criticalErrors.length > 0) {
      return;
    }

    const formData = new FormData();
    for (const key in form) {
      if (!["mainPhoto", "longShot", "closeShot", "otherPhotos"].includes(key)) {
        formData.append(key, form[key]);
      }
    }

    // Validate and append files
    if (form.mainPhoto && !handleFileValidation(form.mainPhoto, 'mainPhoto')) return;
    if (form.longShot && !handleFileValidation(form.longShot, 'longShot')) return;
    if (form.closeShot && !handleFileValidation(form.closeShot, 'closeShot')) return;
    if (form.otherPhotos && !handleFileValidation(form.otherPhotos, 'otherPhotos')) return;

    if (form.mainPhoto) formData.append("mainPhoto", form.mainPhoto);
    if (form.longShot) formData.append("longShot", form.longShot);
    if (form.closeShot) formData.append("closeShot", form.closeShot);
    if (form.otherPhotos && Array.isArray(form.otherPhotos)) {
      form.otherPhotos.forEach((file) => formData.append("otherPhotos", file));
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/create`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      toast.success("Space created!");
      navigate("/success");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    }
  };

  // Cascading dropdown handlers (unchanged)
  const handleSpaceTypeChange = (e) => {
    const { value } = e.target;
    handleValidatedInputChange(e);

    setTransitTypeOptions([]);
    setLineOptions([]);
    handleInputChange({ target: { name: 'transitType', value: '' } });
    handleInputChange({ target: { name: 'transitLine', value: '' } });

    if (value === 'DOOH') {
      handleInputChange({ target: { name: 'illumination', value: '' } });
    }

    if (value === 'Transit') {
      const transitData = spaceOptions.find(opt => opt.value === 'Transit');
      if (transitData && transitData.transitTypes) {
        setTransitTypeOptions(transitData.transitTypes);
      }
    }
  };

  const handleTransitTypeChange = (e) => {
    const { value } = e.target;
    handleValidatedInputChange(e);
    
    setLineOptions([]);
    handleInputChange({ target: { name: 'transitLine', value: '' } });

    const selectedTypeData = transitTypeOptions.find(opt => opt.value === value);
    if (selectedTypeData && selectedTypeData.lines) {
      setLineOptions(selectedTypeData.lines);
    }
  };

  // Options arrays (unchanged)
  const audienceOptions = [
    { value: "", label: "Select..." }, { value: "Youth", label: "Youth" }, { value: "Working Professionals", label: "Working Professionals" }, { value: "Business Professional", label: "Business Professional" }, { value: "College Students", label: "College Students" }, { value: "Elite", label: "Elite" }, { value: "Families", label: "Families" }, { value: "Fashion Enthusiast", label: "Fashion Enthusiast" }, { value: "Female focused", label: "Female focused" }, { value: "Government official", label: "Government official" }, { value: "Male focused", label: "Male focused" }, { value: "Middle class", label: "Middle class" }, { value: "Rural", label: "Rural" }, { value: "Students", label: "Students" }, { value: "Tourists", label: "Tourists" }, { value: "Working", label: "Working" },
  ];
  const categoryOptions = [
    { value: "", label: "Select..." }, { value: "Retail", label: "Retail" }, { value: "Transit", label: "Transit" },
  ];
  const illuminationOptions = [
    { value: "", label: "Select..." }, { value: "Front Lit", label: "Front Lit" }, { value: "Back Lit", label: "Back Lit" }, { value: "Non Lit", label: "Non Lit" },
  ];
  const ownershipOptions = [
    { value: "", label: "Select..." }, { value: "Owned", label: "Owned" }, { value: "Leased", label: "Leased" }, { value: "Traded", label: "Traded" },
  ];
  
  const spaceOptions = [
    { value: "", label: "Select Space..." }, { value: "Billboard", label: "Billboard" }, { value: "DOOH", label: "DOOH" }, { value: "Pole Kiosk", label: "Pole Kiosk" }, { value: "Gantry", label: "Gantry" }, { value: "BQS", label: "BQS" }, { value: "DigitalBQS", label: "DigitalBQS" },
    {
      value: "Transit",
      label: "Transit",
      transitTypes: [
        {
          value: "Normal Local",
          label: "Normal Local",
          lines: [
            { value: "Central Line", label: "Central Line" }, { value: "Western Line", label: "Western Line" }, { value: "Harbour line", label: "Harbour line" },
          ],
        },
        {
          value: "AC Local",
          label: "AC Local",
          lines: [
            { value: "Central Line", label: "Central Line" }, { value: "Western Line", label: "Western Line" }, { value: "Harbour line", label: "Harbour line" },
          ],
        },
      ],
    },
    { value: "Miscellaneous", label: "Miscellaneous" },
  ];
  
  const zoneOptions = [ { value: "West", label: "West" }, { value: "East", label: "East" }, ];
  const tierOptions = [ { value: "Tier 1", label: "Tier 1" }, { value: "Tier 2", label: "Tier 2" }, ];
  const facingOptions = [ { value: "Single facing", label: "Single facing" }, { value: "Double facing", label: "Double facing" }, ];
  const stateOptions = [ { value: "", label: "Select..." }, { value: "Andhra Pradesh", label: "Andhra Pradesh" }, { value: "Arunachal Pradesh", label: "Arunachal Pradesh" }, { value: "Assam", label: "Assam" }, { value: "Bihar", label: "Bihar" }, { value: "Chhattisgarh", label: "Chhattisgarh" }, { value: "Goa", label: "Goa" }, { value: "Gujarat", label: "Gujarat" }, { value: "Haryana", label: "Haryana" }, { value: "Himachal Pradesh", label: "Himachal Pradesh" }, { value: "Jharkhand", label: "Jharkhand" }, { value: "Karnataka", label: "Karnataka" }, { value: "Kerala", label: "Kerala" }, { value: "Madhya Pradesh", label: "Madhya Pradesh" }, { value: "Maharashtra", label: "Maharashtra" }, { value: "Manipur", label: "Manipur" }, { value: "Meghalaya", label: "Meghalaya" }, { value: "Mizoram", label: "Mizoram" }, { value: "Nagaland", label: "Nagaland" }, { value: "Odisha", label: "Odisha" }, { value: "Punjab", label: "Punjab" }, { value: "Rajasthan", label: "Rajasthan" }, { value: "Sikkim", label: "Sikkim" }, { value: "Tamil Nadu", label: "Tamil Nadu" }, { value: "Telangana", label: "Telangana" }, { value: "Tripura", label: "Tripura" }, { value: "Uttar Pradesh", label: "Uttar Pradesh" }, { value: "Uttarakhand", label: "Uttarakhand" }, { value: "West Bengal", label: "West Bengal" }, { value: "Andaman and Nicobar Islands", label: "Andaman and Nicobar Islands", }, { value: "Chandigarh", label: "Chandigarh" }, { value: "Dadra and Nagar Haveli and Daman and Diu", label: "Dadra and Nagar Haveli and Daman and Diu", }, { value: "Delhi", label: "Delhi" }, { value: "Jammu and Kashmir", label: "Jammu and Kashmir" }, { value: "Ladakh", label: "Ladakh" }, { value: "Lakshadweep", label: "Lakshadweep" }, { value: "Puducherry", label: "Puducherry" }, ];
  const specificationOptions = [ { value: "", label: "Select..." }, { value: "LHS", label: "LHS" }, { value: "RHS", label: "RHS" }, ];

  return (
    <div className={`p-6 min-h-screen transition-all duration-300 ${isCollapsed ? "md:ml-24" : "md:ml-64"}`}>
      <Navbar />
      <form onSubmit={handleSubmit} className="max-w-screen-xl w-full mx-auto">
        <div className="text-2xl font-semibold mb-6">Create Spaces</div>
        <div className="flex gap-6 mb-6 text-sm font-medium">
          {stepOrder.map((label) => (
            <div key={label} className={`flex items-center gap-1 pb-1 min-w-fit ${step === label ? "border-b-2 border-black text-black" : completedSteps.includes(label) ? "text-green-600" : "text-black"}`}>
              {completedSteps.includes(label) ? "✓" : ""} {label} Information
            </div>
          ))}
        </div>
        <div className="pb-24">
          {step === "Basic" && (
            <div className="flex w-full">
              <div className="grid grid-cols-1 text-xs lg:grid-cols-2">
                <div className="space-y-4">
                  <Input 
                    label="Space name" 
                    mandatory="true" 
                    name="spaceName" 
                    value={form.spaceName} 
                    onChange={handleValidatedInputChange} 
                    error={fieldErrors.spaceName}
                    required 
                  />
                  <Input 
                    label="Landlord" 
                    name="landlord" 
                    mandatory="true" 
                    value={form.landlord} 
                    onChange={handleValidatedInputChange}
                    error={fieldErrors.landlord}
                  />
                  <Input label="Inventory Owner (Organization)" name="organization" value={form.organization} onChange={handleValidatedInputChange} />
                  <Input label="Peer Media Owner" name="peerMediaOwner" value={form.peerMediaOwner} onChange={handleValidatedInputChange} />
                  
                  <CustomSelect
                    label="Space Type"
                    name="spaceType"
                    value={form.spaceType}
                    onChange={handleSpaceTypeChange}
                    options={spaceOptions.map(({ transitTypes, ...rest }) => rest)}
                    mandatory="true"
                  />
                  
                  {form.spaceType === 'Transit' && (
                    <>
                      <CustomSelect
                        label="Transit Type"
                        name="transitType"
                        value={form.transitType}
                        onChange={handleTransitTypeChange}
                        options={transitTypeOptions.map(({ lines, ...rest }) => rest)}
                        mandatory="true"
                      />
                      {form.transitType && lineOptions.length > 0 && (
                        <CustomSelect
                          label="Transit Line"
                          name="transitLine"
                          value={form.transitLine}
                          onChange={handleValidatedInputChange}
                          options={lineOptions}
                          mandatory="true"
                        />
                      )}
                    </>
                  )}

                  <CustomSelect label="Ownership Type" name="ownershipType" value={form.ownershipType} onChange={handleValidatedInputChange} options={ownershipOptions} mandatory="true" />
                  <Input 
                    mandatory="true" 
                    label={`${form.ownershipType || ""} Start Date`} 
                    name="startDate" 
                    type="date" 
                    value={formatForInput(form.startDate)} 
                    onChange={handleValidatedInputChange}
                    error={fieldErrors.startDate}
                    required 
                  />
                  <Input 
                    label={`${form.ownershipType || ""} End Date`} 
                    name="endDate" 
                    mandatory="true" 
                    type="date" 
                    value={formatForInput(form.endDate)} 
                    onChange={handleValidatedInputChange}
                    error={fieldErrors.endDate}
                    required 
                    min={form.startDate ? formatForInput(form.startDate) : ""} 
                  />
                  <CustomSelect label="Category" name="category" value={form.category} onChange={handleValidatedInputChange} options={categoryOptions} mandatory="false" />
                  <CustomSelect label="Specification" name="specification" value={form.specification} onChange={handleValidatedInputChange} options={specificationOptions} mandatory={form.spaceType !== 'BQS' && form.spaceType !== 'DigitalBQS' && form.spaceType !== 'Transit' ? "true" : "false"} />
                  
                  {form.spaceType === 'BQS' || form.spaceType === 'DigitalBQS' || form.spaceType === 'Transit' ? (
                    <>
                      <Input 
                        label="Buying Price" 
                        name="buyingPrice" 
                        value={form.buyingPrice} 
                        onChange={handleValidatedInputChange}
                        error={fieldErrors.buyingPrice}
                        warning={fieldWarnings.buyingPrice}
                        mandatory="true" 
                      />
                    </>
                  ) : (
                    <Input 
                      label="Price" 
                      name="price" 
                      value={form.price} 
                      onChange={handleValidatedInputChange}
                      error={fieldErrors.price}
                      warning={fieldWarnings.price}
                    />
                  )}

                  <Input 
                    label="Footfall" 
                    name="footfall" 
                    value={form.footfall} 
                    onChange={handleValidatedInputChange}
                    error={fieldErrors.footfall}
                    warning={fieldWarnings.footfall}
                  />
                  <MultiAudienceSelect label="Audience" name="audience" value={form.audience} onChange={handleValidatedInputChange} options={audienceOptions} mandatory="true" />
                  <Select1 label="Demographics" name="demographics" value={form.demographics} onChange={handleValidatedInputChange} required>
                    <option value="">Select...</option> <option value="Urban">Urban</option> <option value="Rural">Rural</option>
                  </Select1>
                  <div>
                    <label className="text-sm">Description</label>
                    <textarea 
                      name="description" 
                      value={form.description} 
                      onChange={handleValidatedInputChange} 
                      className="w-full border px-3 py-2 rounded mt-1" 
                      rows={4} 
                      maxLength={400} 
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {form.description ? form.description.length : 0}/400 characters
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t mt-6 mr-6">
                <div className="text-lg font-semibold mb-4">Photo</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ImageUpload label="Upload Inventory Image" name="mainPhoto" />
                  <div className="grid grid-cols-2 gap-4">
                    <ImageUpload label="Long Shot" name="longShot" />
                    <ImageUpload label="Close Shot" name="closeShot" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Other Images</label>
                    <div className="flex flex-col gap-2 mt-2">
                      <ImageUpload name="otherPhotos" multiple />
                      <span className="text-xs text-gray-600">To add more photos, click "Add More Photo" and select the files you wish to upload.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "Specifications" && (
            <div className="space-y-6 w-full text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {form.spaceType !== "DOOH" && (
                  <CustomSelect label="Illumination" name="illumination" value={form.illumination} onChange={handleValidatedInputChange} options={illuminationOptions} mandatory="true" />
                )}
                {form.spaceType === "DOOH" && (
                  <>
                    <Input 
                      label="Slots" 
                      name="unit" 
                      mandatory="true" 
                      value={form.unit} 
                      onChange={handleValidatedInputChange}
                      error={fieldErrors.unit}
                      required 
                    />
                    <Input 
                      label="Resolutions" 
                      mandatory="true" 
                      name="resolution" 
                      value={form.resolution} 
                      onChange={handleValidatedInputChange}
                      error={fieldErrors.resolution}
                      placeholder="e.g., 1920x1080"
                    />
                  </>
                )}
                <Input 
                  label="Width (in ft)" 
                  mandatory={form.spaceType !== 'BQS' && form.spaceType !== 'DigitalBQS'&& form.spaceType !== 'Transit' ? "true" : "false"} 
                  name="width" 
                  value={form.width} 
                  onChange={handleValidatedInputChange}
                  error={fieldErrors.width}
                  type="number"
                  step="0.1"
                  min="0"
                />
                <Input 
                  label="Height (in ft)" 
                  mandatory={form.spaceType !== 'BQS' && form.spaceType !== 'DigitalBQS' && form.spaceType !== 'Transit' ? "true" : "false"} 
                  name="height" 
                  value={form.height} 
                  onChange={handleValidatedInputChange}
                  error={fieldErrors.height}
                  type="number"
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="space-y-4">
                <Input label="Additional Tags" name="additionalTags" value={form.additionalTags} onChange={handleValidatedInputChange} />
                <Input label="Previous brands" name="previousBrands" value={form.previousBrands} onChange={handleValidatedInputChange} />
                <Input label="Tags" name="tags" value={form.tags} onChange={handleValidatedInputChange} />
              </div>
            </div>
          )}

          {step === "Location" && (
            <div className="grid text-xs grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Address" 
                mandatory="true" 
                name="address" 
                value={form.address} 
                onChange={handleValidatedInputChange}
                error={fieldErrors.address}
              />
              <Input 
                label="City" 
                mandatory="true" 
                name="city" 
                value={form.city} 
                onChange={handleValidatedInputChange}
                error={fieldErrors.city}
                required 
              />
              <CustomSelect label="State" name="state" value={form.state} onChange={handleValidatedInputChange} options={stateOptions} mandatory="true" />
              <Input 
                label="Pin-code" 
                mandatory="false" 
                name="zip" 
                value={form.zip} 
                onChange={handleValidatedInputChange}
                error={fieldErrors.zip}
                type="text"
                maxLength="6"
                pattern="[1-9][0-9]{5}"
                placeholder="e.g., 400001"
              />
              <Input 
                label="Latitude" 
                mandatory={form.spaceType !== 'BQS' && form.spaceType !== 'DigitalBQS' && form.spaceType !== 'Transit' ? "true" : "false"} 
                name="latitude" 
                value={form.latitude} 
                onChange={handleValidatedInputChange}
                error={fieldErrors.latitude}
                type="number"
                step="any"
                placeholder="e.g., 19.0760"
              />
              <Input 
                label="Longitude" 
                mandatory={form.spaceType !== 'BQS' && form.spaceType !== 'DigitalBQS' && form.spaceType !== 'Transit' ? "true" : "false"} 
                name="longitude" 
                value={form.longitude} 
                onChange={handleValidatedInputChange}
                error={fieldErrors.longitude}
                type="number"
                step="any"
                placeholder="e.g., 72.8777"
              />
              {form.latitude && form.longitude && !isNaN(parseFloat(form.latitude)) && !isNaN(parseFloat(form.longitude)) && (
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold mb-1 block">Map Preview</label>
                  <div className="h-80">
                    <MapPreview latitude={parseFloat(form.latitude)} longitude={parseFloat(form.longitude)} />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Real-time map preview from OpenStreetMap.</p>
                </div>
              )}
              <Input label="Landmark" name="landmark" value={form.landmark} onChange={handleValidatedInputChange} />
              <CustomSelect label="Zone" name="zone" value={form.zone} onChange={handleValidatedInputChange} options={zoneOptions} />
              <CustomSelect label="Tier" name="tier" value={form.tier} onChange={handleValidatedInputChange} options={tierOptions} mandatory="true" />
              <CustomSelect label="Facing" name="facing" value={form.facing} onChange={handleValidatedInputChange} options={facingOptions} mandatory="true" />
              <Input label="Facia towards" name="faciaTowards" value={form.faciaTowards} onChange={handleValidatedInputChange} />
            </div>
          )}
        </div>

        <div className={`fixed bottom-0 right-0 bg-white z-10 transition-all duration-300 ${isCollapsed ? "left-0 md:left-24" : "left-0 md:left-64"}`}>
          <div className="flex justify-between items-center w-full px-6 py-3 max-w-screen-xl mx-auto">
            <button type="button" className="border border-gray-300 bg-white text-gray-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-50" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <div className="flex items-center space-x-3">
              <button type="button" onClick={handleBack} disabled={step === "Basic"} className="bg-black text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed">
                Back
              </button>
              <button type="button" onClick={handleNext} className="bg-black text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-800">
                {step === "Location" ? "Preview" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// Enhanced Input component with error and warning display
function Input({ mandatory, label, error, warning, ...props }) {
  return (
    <div className="mb-4">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {mandatory === "true" && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input
        {...props}
        className={`w-3/4 block border px-3 py-2 rounded-lg shadow-sm mt-1 text-sm
                   focus:ring-2 focus:ring-black focus:border-black
                   ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                   ${warning ? 'border-orange-400' : ''}`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {warning && <p className="text-orange-500 text-xs mt-1">⚠️ {warning}</p>}
    </div>
  );
}

function Select1({ mandatory, label, children, ...props }) {
  return (
    <div className="mb-4">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {mandatory === "true" && <span className="ml-1 text-red-500">*</span>}
      </label>
      <select
        {...props}
        className="w-3/4 block border border-gray-300 px-3 py-2 rounded-lg shadow-sm mt-1 
                   focus:ring-2 focus:ring-black focus:border-black text-sm"
      >
        {children}
      </select>
    </div>
  );
}

// Enhanced ImageUpload component with file validation
function ImageUpload({ label, name, multiple = false }) {
  const { form, setForm } = useSpaceForm();
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = (e) => {
    const files = multiple ? Array.from(e.target.files) : e.target.files[0];
    setUploadError('');

    // Validate files
    const fileArray = multiple ? files : [files];
    for (const file of fileArray) {
      if (!validators.isValidImageFile(file)) {
        setUploadError(`Invalid file: ${file.name}. Please upload JPG, PNG, or WebP images under 5MB.`);
        return;
      }
    }

    setForm((prev) => ({ ...prev, [name]: files }));
  };

  const preview =
    multiple && Array.isArray(form[name])
      ? form[name].map((file, i) => URL.createObjectURL(file))
      : form[name]
      ? URL.createObjectURL(form[name])
      : null;

  return (
    <div className="border-2 border-dashed rounded-xl p-4 h-48 
                    relative bg-gray-50 flex flex-col items-center justify-center text-center 
                    hover:border-black transition">
      <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-sm text-gray-600">
        {label || "Upload Image"}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          multiple={multiple}
          className="hidden"
        />
        {preview && !multiple && (
          <img
            src={preview}
            alt="Preview"
            className="mt-3 h-24 object-cover rounded-lg shadow-sm"
          />
        )}
        {preview && multiple && (
          <div className="flex gap-2 mt-3 overflow-x-auto">
            {preview.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`Preview ${idx}`}
                className="h-20 w-20 object-cover rounded-lg shadow-sm"
              />
            ))}
          </div>
        )}
      </label>
      {uploadError && <p className="text-red-500 text-xs mt-2">{uploadError}</p>}
      <div className="text-xs text-gray-400 mt-2">
        Max 5MB • JPG, PNG, WebP
      </div>
    </div>
  );
}

export function CustomSelect({ mandatory, label, value, onChange, name, options }) {
  const formattedValue = options.find((option) => option.value === value);
  return (
    <div className="mb-4">
      <label className="text-sm font-medium text-gray-700 block mb-1">
        {label}
        {mandatory === "true" && <span className="ml-1 text-red-500">*</span>}
      </label>
      <Select
        className="w-3/4 text-sm"
        name={name}
        options={options}
        value={formattedValue}
        onChange={(selectedOption) =>
          onChange({ target: { name, value: selectedOption?.value || "" } })
        }
        isSearchable
        styles={{
          control: (base) => ({
            ...base,
            borderRadius: "0.5rem",
            borderColor: "#d1d5db",
            padding: "2px",
            boxShadow: "none",
            "&:hover": { borderColor: "#000" },
          }),
        }}
      />
    </div>
  );
}