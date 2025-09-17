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
  required: (value) => {
    if (typeof value === 'string') {
      return value.trim() !== '';
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== null && value !== undefined && value !== '';
  },
  
  minLength: (value, min) => {
    return typeof value === 'string' && value.trim().length >= min;
  },
  
  maxLength: (value, max) => {
    return typeof value === 'string' && value.length <= max;
  },
  
  numeric: (value) => {
    return value === '' || (!isNaN(value) && !isNaN(parseFloat(value)));
  },
  
  positiveNumber: (value) => {
    return value === '' || (validators.numeric(value) && parseFloat(value) > 0);
  },
  
  latitude: (value) => {
    if (value === '') return true;
    const num = parseFloat(value);
    return !isNaN(num) && num >= -90 && num <= 90;
  },
  
  longitude: (value) => {
    if (value === '') return true;
    const num = parseFloat(value);
    return !isNaN(num) && num >= -180 && num <= 180;
  },
  
  pincode: (value) => {
    return value === '' || /^\d{6}$/.test(value);
  },
  
  

  
  resolution: (value) => {
    return value === '' || /^\d+x\d+$/.test(value);
  },
  
  spaceName: (value) => {
    return value === '' || /^[a-zA-Z0-9\s\-_.,()]+$/.test(value);
  },
  
  organization: (value) => {
    return value === '' || /^[a-zA-Z0-9\s\-_.,()&]+$/.test(value);
  },
  
  maxSlots: (value, spaceType) => {
    if (value === '') return true;
    const maxMap = { 
      Billboard: 1, 
      DOOH: 10, 
      "Pole kiosk": 1, 
      Gantry: 1, 
      BQS: 1, 
      DigitalBQS: 1, 
      Miscellaneous: 1,
      Transit: 1
    };
    const max = maxMap[spaceType] || 1;
    return parseInt(value) <= max;
  }
};

// Validation messages
const getValidationMessage = (fieldName, validationType, additionalInfo = '') => {
  const messages = {
    required: `${fieldName} is required`,
    minLength: `${fieldName} must be at least ${additionalInfo} characters`,
    maxLength: `${fieldName} must not exceed ${additionalInfo} characters`,
    numeric: `${fieldName} must be a valid number`,
    positiveNumber: `${fieldName} must be a positive number`,
    latitude: `Latitude must be between -90 and 90 degrees`,
    longitude: `Longitude must be between -180 and 180 degrees`,
    pincode: `Pin-code must be exactly 6 digits`,
    
    resolution: `Resolution must be in format like 1920x1080`,
    spaceName: `Space name can only contain letters, numbers, spaces, and basic punctuation`,
    organization: `Organization name contains invalid characters`,
    maxSlots: `Maximum ${additionalInfo} slots allowed for this space type`,
  };
  return messages[validationType] || `Invalid ${fieldName}`;
};

// Updated component for multi-select audience field with visible selected values
function MultiAudienceSelect({ label, name, value, onChange, options, mandatory, error }) {
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
    // Hide the selected values inside the select box
    multiValue: () => ({ display: 'none' }),
    control: (provided, state) => ({
      ...provided,
      borderColor: error ? '#ef4444' : provided.borderColor,
      '&:hover': {
        borderColor: error ? '#ef4444' : provided.borderColor,
      },
    }),
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

  // Remove a specific selected value
  const removeValue = (valueToRemove) => {
    const newValues = valueAsArray.filter(v => v !== valueToRemove);
    onChange({ target: { name, value: newValues } });
  };

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
        components={{
          // Custom component to show count in placeholder when values are selected
          Placeholder: ({ children, ...props }) => (
            <div {...props}>
              {selectedOptions.length > 0 
                ? `${selectedOptions.length} selected - click to add more...` 
                : children
              }
            </div>
          )
        }}
      />
      
      {/* Display selected values as styled tags below the select */}
      {selectedOptions.length > 0 && (
  <div className="mt-2 flex flex-col gap-2 max-h-40 overflow-y-auto">
    {selectedOptions.map((option) => (
      <span
        key={option.value}
        className="inline-flex items-center justify-between px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-md border border-blue-200 w-fit"
      >
        <span>{option.label}</span>
        <button
          type="button"
          onClick={() => removeValue(option.value)}
          className="ml-2 hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center text-blue-600 hover:text-blue-800"
          title={`Remove ${option.label}`}
        >
          ×
        </button>
      </span>
    ))}
  </div>
)}
      
      {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
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

  // State for dependent dropdown options
  const [transitTypeOptions, setTransitTypeOptions] = useState([]);
  const [lineOptions, setLineOptions] = useState([]);
  
  // State for field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const formatForInput = (dateStr) => {
    if (!dateStr) return "";
    const [dd, mm, yyyy] = dateStr.split("-");
    if (!yyyy || !mm || !dd) return "";
    return `${yyyy}-${mm}-${dd}`;
  };

  // Enhanced validation function
  const validateField = (name, value, formData = form) => {
    const errors = [];
    const isSpecialType = formData.spaceType === "BQS" || formData.spaceType === "DigitalBQS" || formData.spaceType === "Transit";

    // Define mandatory fields based on current step and space type
    const mandatoryFields = {
      Basic: [
        "spaceName", "landlord", "spaceType", "ownershipType", "startDate", "endDate", "audience"
      ],
      Specifications: formData.spaceType === "DOOH" 
        ? ["unit", "resolution", "width", "height"]
        : ["illumination", "width", "height"],
      Location: ["address", "city", "state", "tier", "facing"]
    };

    // Modify mandatory fields for special space types
    if (isSpecialType) {
      mandatoryFields.Basic.push("buyingPrice");
      mandatoryFields.Specifications = ["illumination"];
      mandatoryFields.Location = mandatoryFields.Location.filter(
        field => !['zip', 'latitude', 'longitude'].includes(field)
      );
    } else {
      mandatoryFields.Location.push("latitude", "longitude");
      mandatoryFields.Basic.push("price"); // ADD THIS LINE
    }

    if (formData.spaceType === 'Transit') {
      mandatoryFields.Basic.push('transitType', 'transitLine');
    }

    // Get current step's mandatory fields
    const currentStepFields = mandatoryFields[step] || [];
    const isMandatory = currentStepFields.includes(name);

    // Required field validation
    if (isMandatory && !validators.required(value)) {
      errors.push(getValidationMessage(name, 'required'));
    }

    // Field-specific validations
    switch (name) {
      case 'spaceName':
        if (value && !validators.minLength(value, 2)) {
          errors.push(getValidationMessage('Space name', 'minLength', '2'));
        }
        if (value && !validators.maxLength(value, 100)) {
          errors.push(getValidationMessage('Space name', 'maxLength', '100'));
        }
        if (value && !validators.spaceName(value)) {
          errors.push(getValidationMessage('Space name', 'spaceName'));
        }
        break;

      case 'landlord':
        if (value && !validators.minLength(value, 2)) {
          errors.push(getValidationMessage('Landlord', 'minLength', '2'));
        }
        if (value && !validators.maxLength(value, 100)) {
          errors.push(getValidationMessage('Landlord', 'maxLength', '100'));
        }
        break;

      case 'organization':
      case 'peerMediaOwner':
        if (value && !validators.organization(value)) {
          errors.push(getValidationMessage(name, 'organization'));
        }
        if (value && !validators.maxLength(value, 100)) {
          errors.push(getValidationMessage(name, 'maxLength', '100'));
        }
        break;

     

      case 'price':
      case 'buyingPrice':
        if (value && !validators.positiveNumber(value)) {
          errors.push(getValidationMessage(name, 'positiveNumber'));
        }
        break;

      case 'footfall':
        if (value && !validators.numeric(value)) {
          errors.push(getValidationMessage('Footfall', 'numeric'));
        }
        if (value && parseFloat(value) < 0) {
          errors.push('Footfall cannot be negative');
        }
        break;

      case 'audience':
        if (isMandatory && (!Array.isArray(value) || value.length === 0)) {
          errors.push('Please select at least one audience type');
        }
        break;

      case 'description':
        if (value && !validators.maxLength(value, 400)) {
          errors.push(getValidationMessage('Description', 'maxLength', '400'));
        }
        break;

      case 'unit':
        if (value && !validators.positiveNumber(value)) {
          errors.push(getValidationMessage('Slots', 'positiveNumber'));
        }
        if (value && !validators.maxSlots(value, formData.spaceType)) {
          const maxMap = { Billboard: 1, DOOH: 10, "Pole kiosk": 1, Gantry: 1, BQS: 1, DigitalBQS: 1, Miscellaneous: 1, Transit: 1 };
          const max = maxMap[formData.spaceType] || 1;
          errors.push(getValidationMessage('Slots', 'maxSlots', max));
        }
        break;

      case 'resolution':
        if (value && !validators.resolution(value)) {
          errors.push(getValidationMessage('Resolution', 'resolution'));
        }
        break;

      case 'width':
      case 'height':
        if (value && !validators.positiveNumber(value)) {
          errors.push(getValidationMessage(name, 'positiveNumber'));
        }
        if (value && parseFloat(value) > 1000) {
          errors.push(`${name} seems too large (max 1000 ft)`);
        }
        break;

      case 'latitude':
        if (value && !validators.latitude(value)) {
          errors.push(getValidationMessage('Latitude', 'latitude'));
        }
        break;

      case 'longitude':
        if (value && !validators.longitude(value)) {
          errors.push(getValidationMessage('Longitude', 'longitude'));
        }
        break;

      case 'zip':
        if (value && !validators.pincode(value)) {
          errors.push(getValidationMessage('Pin-code', 'pincode'));
        }
        break;

      case 'address':
        if (value && !validators.minLength(value, 10)) {
          errors.push(getValidationMessage('Address', 'minLength', '10'));
        }
        if (value && !validators.maxLength(value, 200)) {
          errors.push(getValidationMessage('Address', 'maxLength', '200'));
        }
        break;

      case 'city':
        if (value && !validators.minLength(value, 2)) {
          errors.push(getValidationMessage('City', 'minLength', '2'));
        }
        if (value && !/^[a-zA-Z\s]+$/.test(value)) {
          errors.push('City name can only contain letters and spaces');
        }
        break;
    }

    return errors;
  };

  // Enhanced input change handler with validation
  const handleValidatedInputChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data
    handleInputChange(e);
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate field
    const errors = validateField(name, value, { ...form, [name]: value });
    
    // Update field errors
    setFieldErrors(prev => ({
      ...prev,
      [name]: errors.length > 0 ? errors[0] : null
    }));

    // Special validation for dependent fields
    
  };

  // Handle blur events for validation
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const validateCurrentStep = () => {
    const isSpecialType = form.spaceType === "BQS" || form.spaceType === "DigitalBQS" || form.spaceType === "Transit";

    const mandatoryFieldsByStep = {
      Basic: [
        "spaceName", "landlord", "spaceType", "ownershipType", "startDate", "endDate", "audience"
      ],
      Specifications:
        form.spaceType === "DOOH"
          ? ["unit", "resolution", "width", "height"]
          : ["illumination", "width", "height"],
      Location: ["address", "city", "state", "tier", "facing"],
    };

    // If spaceType is BQS or Transit, modify the mandatory fields
    if (isSpecialType) {
      mandatoryFieldsByStep.Basic.push("buyingPrice");
      mandatoryFieldsByStep.Specifications = ["illumination"]; // Only illumination is mandatory
      const locationFields = mandatoryFieldsByStep.Location;
      // MODIFICATION: Filter out latitude and longitude for BQS/Transit spaces
      mandatoryFieldsByStep.Location = locationFields.filter(
        field => !['zip', 'latitude', 'longitude'].includes(field)
      );
    } else {
      mandatoryFieldsByStep.Location.push("latitude", "longitude");
    }
    
    // If spaceType is Transit, add the new fields to the mandatory list
    if (form.spaceType === 'Transit') {
      mandatoryFieldsByStep.Basic.push('transitType', 'transitLine');
    }

    const currentFields = mandatoryFieldsByStep[step] || [];
    
    // Check for any validation errors in current step fields
    let hasErrors = false;
    const newErrors = {};
    
    for (const field of currentFields) {
      const errors = validateField(field, form[field]);
      if (errors.length > 0) {
        newErrors[field] = errors[0];
        hasErrors = true;
      }
    }
    
    // Update all field errors for current step
    setFieldErrors(prev => ({ ...prev, ...newErrors }));
    
    // Mark all current step fields as touched
    const newTouched = {};
    currentFields.forEach(field => {
      newTouched[field] = true;
    });
    setTouched(prev => ({ ...prev, ...newTouched }));
    
    if (hasErrors) {
      toast.error("Please fix all validation errors before proceeding");
      return false;
    }

    return true;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    const formData = new FormData();
    for (const key in form) {
      if (!["mainPhoto", "longShot", "closeShot", "otherPhotos"].includes(key)) {
        formData.append(key, form[key]);
      }
    }
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

  // --- START: CASCADING DROPDOWN HANDLERS ---

  const handleSpaceTypeChange = (e) => {
    const { value } = e.target;
    handleValidatedInputChange(e); // Update form state for spaceType

    // Reset dependent fields
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

    // Clear validation errors for dependent fields
    setFieldErrors(prev => ({
      ...prev,
      transitType: null,
      transitLine: null,
      illumination: null
    }));
  };

  const handleTransitTypeChange = (e) => {
    const { value } = e.target;
    handleValidatedInputChange(e); // Update form state for transitType
    
    // Reset the line selection
    setLineOptions([]);
    handleInputChange({ target: { name: 'transitLine', value: '' } });

    const selectedTypeData = transitTypeOptions.find(opt => opt.value === value);
    if (selectedTypeData && selectedTypeData.lines) {
      setLineOptions(selectedTypeData.lines);
    }

    // Clear validation error for transit line
    setFieldErrors(prev => ({ ...prev, transitLine: null }));
  };

  // --- END: CASCADING DROPDOWN HANDLERS ---
  
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
                    onBlur={handleBlur}
                    error={touched.spaceName && fieldErrors.spaceName}
                    required 
                  />
                  <Input 
                    label="Landlord" 
                    name="landlord" 
                    mandatory="true" 
                    value={form.landlord} 
                    onChange={handleValidatedInputChange}
                    onBlur={handleBlur}
                    error={touched.landlord && fieldErrors.landlord}
                  />
                  <Input 
                    label="Inventory Owner (Organization)" 
                    name="organization" 
                    value={form.organization} 
                    onChange={handleValidatedInputChange}
                    onBlur={handleBlur}
                    error={touched.organization && fieldErrors.organization}
                  />
                  <Input 
                    label="Peer Media Owner" 
                    name="peerMediaOwner" 
                    value={form.peerMediaOwner} 
                    onChange={handleValidatedInputChange}
                    onBlur={handleBlur}
                    error={touched.peerMediaOwner && fieldErrors.peerMediaOwner}
                  />
                  
                  {/* --- MODIFIED SPACETYPE SELECT --- */}
                  <CustomSelect
                    label="Space Type"
                    name="spaceType"
                    value={form.spaceType}
                    onChange={handleSpaceTypeChange}
                    options={spaceOptions.map(({ transitTypes, ...rest }) => rest)} // Pass options without nested data
                    mandatory="true"
                    error={touched.spaceType && fieldErrors.spaceType}
                  />
                  
                  {/* --- START: CONDITIONALLY RENDERED DROPDOWNS --- */}
                  {form.spaceType === 'Transit' && (
                    <>
                      <CustomSelect
                        label="Transit Type"
                        name="transitType"
                        value={form.transitType}
                        onChange={handleTransitTypeChange}
                        options={transitTypeOptions.map(({ lines, ...rest }) => rest)} // Pass options without nested data
                        mandatory="true"
                        error={touched.transitType && fieldErrors.transitType}
                      />
                      {form.transitType && lineOptions.length > 0 && (
                        <CustomSelect
                          label="Transit Line"
                          name="transitLine"
                          value={form.transitLine}
                          onChange={handleValidatedInputChange} // Uses the default handler
                          options={lineOptions}
                          mandatory="true"
                          error={touched.transitLine && fieldErrors.transitLine}
                        />
                      )}
                    </>
                  )}
                  {/* --- END: CONDITIONALLY RENDERED DROPDOWNS --- */}

                  <CustomSelect 
                    label="Ownership Type" 
                    name="ownershipType" 
                    value={form.ownershipType} 
                    onChange={handleValidatedInputChange} 
                    options={ownershipOptions} 
                    mandatory="true"
                    error={touched.ownershipType && fieldErrors.ownershipType}
                  />
                  <Input 
                    mandatory="true" 
                    label={`${form.ownershipType || ""} Start Date`} 
                    name="startDate" 
                    type="date" 
                    value={formatForInput(form.startDate)} 
                    onChange={handleValidatedInputChange}
                    onBlur={handleBlur}
                    error={touched.startDate && fieldErrors.startDate}
                    required 
                  />
                  <Input 
                    label={`${form.ownershipType || ""} End Date`} 
                    name="endDate" 
                    mandatory="true" 
                    type="date" 
                    value={formatForInput(form.endDate)} 
                    onChange={handleValidatedInputChange}
                    onBlur={handleBlur}
                    error={touched.endDate && fieldErrors.endDate}
                    required 
                    min={form.startDate ? formatForInput(form.startDate) : ""} 
                  />
                  <CustomSelect 
                    label="Category" 
                    name="category" 
                    value={form.category} 
                    onChange={handleValidatedInputChange} 
                    options={categoryOptions} 
                    mandatory="false"
                    error={touched.category && fieldErrors.category}
                  />
                  <CustomSelect 
                    label="Specification" 
                    name="specification" 
                    value={form.specification} 
                    onChange={handleValidatedInputChange} 
                    options={specificationOptions} 
                    mandatory={form.spaceType !== 'BQS' && form.spaceType !== 'DigitalBQS' && form.spaceType !== 'Transit' ? "true" : "false"}
                    error={touched.specification && fieldErrors.specification}
                  />
                  
                  {form.spaceType === 'BQS' || form.spaceType === 'DigitalBQS' || form.spaceType === 'Transit' ? (
                    <>
                      <Input 
                        label="Buying Price" 
                        name="buyingPrice" 
                        value={form.buyingPrice} 
                        onChange={handleValidatedInputChange}
                        onBlur={handleBlur}
                        error={touched.buyingPrice && fieldErrors.buyingPrice}
                        mandatory="true" 
                      />
                    </>
                  ) : (
                    <Input 
                      label="Price" 
                      name="price" 
                      value={form.price} 
                      onChange={handleValidatedInputChange}
                      onBlur={handleBlur}
                      error={touched.price && fieldErrors.price}
                      mandatory="true"  // ADD THIS LINE
                    />
                  )}

                  <Input 
                    label="Footfall" 
                    name="footfall" 
                    value={form.footfall} 
                    onChange={handleValidatedInputChange}
                    onBlur={handleBlur}
                    error={touched.footfall && fieldErrors.footfall}
                  />
                  <MultiAudienceSelect 
                    label="Audience" 
                    name="audience" 
                    value={form.audience} 
                    onChange={handleValidatedInputChange} 
                    options={audienceOptions} 
                    mandatory="true"
                    error={touched.audience && fieldErrors.audience}
                  />
                  <Select1 
                    label="Demographics" 
                    name="demographics" 
                    value={form.demographics} 
                    onChange={handleValidatedInputChange}
                    error={touched.demographics && fieldErrors.demographics}
                    required
                  >
                    <option value="">Select...</option> 
                    <option value="Urban">Urban</option> 
                    <option value="Rural">Rural</option>
                  </Select1>
                  <div>
                    <label className="text-sm">Description</label>
                    <textarea 
                      name="description" 
                      value={form.description} 
                      onChange={handleValidatedInputChange}
                      onBlur={handleBlur}
                      className={`w-full border px-3 py-2 rounded mt-1 ${touched.description && fieldErrors.description ? 'border-red-500' : ''}`}
                      rows={4} 
                      maxLength={400} 
                    />
                    <div className="flex justify-between items-center mt-1">
                      {touched.description && fieldErrors.description && (
                        <span className="text-red-500 text-xs">{fieldErrors.description}</span>
                      )}
                      <span className="text-gray-500 text-xs ml-auto">
                        {form.description?.length || 0}/400 characters
                      </span>
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
                  <CustomSelect 
                    label="Illumination" 
                    name="illumination" 
                    value={form.illumination} 
                    onChange={handleValidatedInputChange} 
                    options={illuminationOptions} 
                    mandatory="true"
                    error={touched.illumination && fieldErrors.illumination}
                  />
                )}
                {form.spaceType === "DOOH" && (
                  <>
                    <Input 
                      label="Slots" 
                      name="unit" 
                      mandatory="true" 
                      value={form.unit} 
                      onChange={handleValidatedInputChange}
                      onBlur={handleBlur}
                      error={touched.unit && fieldErrors.unit}
                      required 
                    />
                    <Input 
                      label="Resolutions" 
                      mandatory="true" 
                      name="resolution" 
                      value={form.resolution} 
                      onChange={handleValidatedInputChange}
                      onBlur={handleBlur}
                      error={touched.resolution && fieldErrors.resolution}
                      placeholder="e.g., 1920x1080"
                    />
                  </>
                )}
                <Input 
                  label="Width (in ft)" 
                  mandatory={form.spaceType !== 'BQS' && form.spaceType !== 'DigitalBQS' && form.spaceType !== 'Transit' ? "true" : "false"} 
                  name="width" 
                  value={form.width} 
                  onChange={handleValidatedInputChange}
                  onBlur={handleBlur}
                  error={touched.width && fieldErrors.width}
                />
                <Input 
                  label="Height (in ft)" 
                  mandatory={form.spaceType !== 'BQS' && form.spaceType !== 'DigitalBQS' && form.spaceType !== 'Transit' ? "true" : "false"} 
                  name="height" 
                  value={form.height} 
                  onChange={handleValidatedInputChange}
                  onBlur={handleBlur}
                  error={touched.height && fieldErrors.height}
                />
              </div>
              <div className="space-y-4">
                <Input 
                  label="Additional Tags" 
                  name="additionalTags" 
                  value={form.additionalTags} 
                  onChange={handleValidatedInputChange}
                  onBlur={handleBlur}
                  error={touched.additionalTags && fieldErrors.additionalTags}
                />
                <Input 
                  label="Previous brands" 
                  name="previousBrands" 
                  value={form.previousBrands} 
                  onChange={handleValidatedInputChange}
                  onBlur={handleBlur}
                  error={touched.previousBrands && fieldErrors.previousBrands}
                />
                <Input 
                  label="Tags" 
                  name="tags" 
                  value={form.tags} 
                  onChange={handleValidatedInputChange}
                  onBlur={handleBlur}
                  error={touched.tags && fieldErrors.tags}
                />
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
                onBlur={handleBlur}
                error={touched.address && fieldErrors.address}
              />
              <Input 
                label="City" 
                mandatory="true" 
                name="city" 
                value={form.city} 
                onChange={handleValidatedInputChange}
                onBlur={handleBlur}
                error={touched.city && fieldErrors.city}
                required 
              />
              <CustomSelect 
                label="State" 
                name="state" 
                value={form.state} 
                onChange={handleValidatedInputChange} 
                options={stateOptions} 
                mandatory="true"
                error={touched.state && fieldErrors.state}
              />
              <Input 
                label="Pin-code" 
                mandatory="false" 
                name="zip" 
                value={form.zip} 
                onChange={handleValidatedInputChange}
                onBlur={handleBlur}
                error={touched.zip && fieldErrors.zip}
                placeholder="e.g., 400001"
              />
              {/* MODIFICATION: Added Latitude input and made both Latitude/Longitude conditional */}
              <Input 
                label="Latitude" 
                mandatory={form.spaceType !== 'BQS' && form.spaceType !== 'DigitalBQS' && form.spaceType !== 'Transit' ? "true" : "false"} 
                name="latitude" 
                value={form.latitude} 
                onChange={handleValidatedInputChange}
                onBlur={handleBlur}
                error={touched.latitude && fieldErrors.latitude}
                placeholder="e.g., 19.0760"
              />
              <Input 
                label="Longitude" 
                mandatory={form.spaceType !== 'BQS' && form.spaceType !== 'DigitalBQS' && form.spaceType !== 'Transit' ? "true" : "false"} 
                name="longitude" 
                value={form.longitude} 
                onChange={handleValidatedInputChange}
                onBlur={handleBlur}
                error={touched.longitude && fieldErrors.longitude}
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
              <Input 
                label="Landmark" 
                name="landmark" 
                value={form.landmark} 
                onChange={handleValidatedInputChange}
                onBlur={handleBlur}
                error={touched.landmark && fieldErrors.landmark}
              />
              <CustomSelect 
                label="Zone" 
                name="zone" 
                value={form.zone} 
                onChange={handleValidatedInputChange} 
                options={zoneOptions}
                error={touched.zone && fieldErrors.zone}
              />
              <CustomSelect 
                label="Tier" 
                name="tier" 
                value={form.tier} 
                onChange={handleValidatedInputChange} 
                options={tierOptions} 
                mandatory="true"
                error={touched.tier && fieldErrors.tier}
              />
              <CustomSelect 
                label="Facing" 
                name="facing" 
                value={form.facing} 
                onChange={handleValidatedInputChange} 
                options={facingOptions} 
                mandatory="true"
                error={touched.facing && fieldErrors.facing}
              />
              <Input 
                label="Facia towards" 
                name="faciaTowards" 
                value={form.faciaTowards} 
                onChange={handleValidatedInputChange}
                onBlur={handleBlur}
                error={touched.faciaTowards && fieldErrors.faciaTowards}
              />
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

function Input({ mandatory, label, error, ...props }) {
  return (
    <div>
      <label className="text-sm">{label}</label>
      {mandatory === "true" && <span className="ml-1 text-red-500">*</span>}
      <input 
        {...props} 
        className={`w-3/4 block border px-2 py-1 rounded mt-1 ${error ? 'border-red-500' : 'border-gray-300'}`} 
      />
      {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
    </div>
  );
}

function Select1({ mandatory, label, children, error, ...props }) {
  return (
    <div>
      <label className="text-sm">{label}</label>
      {mandatory === "true" && <span className="ml-1 text-red-500">*</span>}
      <select 
        {...props} 
        className={`w-3/4 block border px-1 py-1 rounded mt-1 ${error ? 'border-red-500' : 'border-gray-300'}`}
      >
        {children}
      </select>
      {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
    </div>
  );
}

function ImageUpload({ label, name, multiple = false }) {
  const { form, setForm } = useSpaceForm();
  const [uploadError, setUploadError] = useState(null);

  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Only image files (JPEG, PNG, GIF, WebP) are allowed';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }

    return null;
  };

  const handleFileChange = (e) => {
    const files = multiple ? Array.from(e.target.files) : e.target.files[0];
    setUploadError(null);

    if (multiple && Array.isArray(files)) {
      // Validate all files
      for (const file of files) {
        const error = validateFile(file);
        if (error) {
          setUploadError(error);
          return;
        }
      }
      
      // Check total number of files
      if (files.length > 10) {
        setUploadError('Maximum 10 files allowed');
        return;
      }
    } else if (files) {
      const error = validateFile(files);
      if (error) {
        setUploadError(error);
        return;
      }
    }

    setForm((prev) => ({ ...prev, [name]: files }));
  };

  const preview = multiple && Array.isArray(form[name]) 
    ? form[name].map((file, i) => URL.createObjectURL(file)) 
    : form[name] ? URL.createObjectURL(form[name]) : null;

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-4 h-48 relative bg-white flex flex-col items-center justify-center text-center">
      <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-sm text-gray-500">
        {label || "Upload Image"}
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          multiple={multiple} 
          className="hidden" 
        />
        {preview && !multiple && <img src={preview} alt="Preview" className="mt-2 h-20 object-contain" />}
        {preview && multiple && (
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {preview.map((src, idx) => 
              <img key={idx} src={src} alt={`Preview ${idx}`} className="h-20 object-contain" />
            )}
          </div>
        )}
        {!preview && (
          <div className="text-center">
            <div className="text-2xl mb-2">📁</div>
            <div>Click to upload {multiple ? 'images' : 'image'}</div>
            <div className="text-xs text-gray-400 mt-1">
              Max size: 5MB {multiple ? '(up to 10 files)' : ''}
            </div>
          </div>
        )}
      </label>
      {uploadError && (
        <div className="absolute bottom-2 left-2 right-2 text-red-500 text-xs bg-red-50 p-1 rounded">
          {uploadError}
        </div>
      )}
    </div>
  );
}

export function CustomSelect({ mandatory, label, value, onChange, name, options, error }) {
  const formattedValue = options.find((option) => option.value === value);
  
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: error ? '#ef4444' : provided.borderColor,
      '&:hover': {
        borderColor: error ? '#ef4444' : provided.borderColor,
      },
    }),
  };

  return (
    <div className="mb-2">
      <label className="text-sm block mb-1">
        {label}
        {mandatory === "true" && <span className="ml-1 text-red-500">*</span>}
      </label>
      <Select
        className="w-3/4 h-[3%]"
        name={name}
        options={options}
        value={formattedValue}
        onChange={(selectedOption) => onChange({ target: { name, value: selectedOption?.value || "" } })}
        isSearchable
        styles={customStyles}
      />
      {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
    </div>
  );
}