import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useSpaceForm } from "../context/SpaceFormContext";
import { toast } from "sonner";
import MapPreview from "./MapPreview";
import Select from "react-select";
import { useSidebar } from "../context/SidebarContext";
import { FiUploadCloud, FiAlertCircle } from "react-icons/fi";
import { FaArrowLeft, FaCheck } from 'react-icons/fa';

// --- REUSABLE UI COMPONENTS (SHARED from Code 2) ---

const Card = ({ children, className = '', ...props }) => (
    <div
        className={`
            bg-gray-100 bg-opacity-80 shadow-xl rounded-2xl w-full flex flex-col relative overflow-hidden
            ${className}
        `}
        {...props}
    >
        {/* Removed the intense background animation for simplicity, kept the base styling */}
        <div className='absolute inset-0 bg-gradient-to-br from-white via-indigo-50 to-purple-50 opacity-20 z-0'></div>
        <div className='relative z-10 h-full flex flex-col'>{children}</div>
    </div>
);

const CardContent = ({ children, className = '' }) => (
    <div className={`p-4 md:p-6 flex-grow flex flex-col ${className}`}>
        {children}
    </div>
);

const Button = ({ children, className = '', disabled = false, loading = false, ...props }) => (
    <button
        className={`px-4 py-2 rounded-xl bg-[black] text-white text-xs font-medium transition-all duration-200 transform hover:scale-105 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg ${className}`}
        disabled={disabled || loading}
        {...props}
    >
        {loading ? (
            <div className='flex items-center gap-2'>
                <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                {children}
            </div>
        ) : (
            children
        )}
    </button>
);

const Input = ({ className = '', label, mandatory = false, error = null, onBlur, ...props }) => (
    <div className='relative w-full'>
        <label className="text-sm font-medium text-gray-700 block mb-1">
            {label}
            {mandatory && <span className="ml-1 text-red-500">*</span>}
        </label>
        <input
            className={`border ${
                error ? 'border-red-500' : 'border-gray-200'
            } px-4 py-2 rounded-xl w-full bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md h-10 ${className}`}
            onBlur={onBlur}
            {...props}
        />
        {error && (
            <p className='absolute -bottom-5 left-0 text-red-500 text-xs mt-1'>
                <FiAlertCircle className="inline-block mr-1" /> {error}
            </p>
        )}
    </div>
);

// NOTE: CustomSelect in Code 2 uses React-Select, matching the functionality of Select1 in Code 1, 
// but with better styling and validation display.

export function CustomSelect({ mandatory = false, label, value, onChange, name, options, error, placeholder = "Select..." }) {
    // Ensure the default "Select..." option is included if not already present, but handle it's removal from value state
    const displayOptions = options.filter(opt => opt.value !== "");
    const formattedValue = displayOptions.find((option) => option.value === value) || null;
    
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
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9CA3AF',
            fontSize: '0.875rem',
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#4B5563',
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 20, // Ensure dropdown is above other elements
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
        <div className="flex flex-col space-y-1 w-full">
            <label className="text-sm font-medium text-gray-700 block">
                {label}
                {mandatory && <span className="ml-1 text-red-500">*</span>}
            </label>
            <Select
                className="w-full"
                name={name}
                options={displayOptions}
                value={formattedValue}
                // 💡 ISSUE FIX: Ensure the change handler always creates a proper pseudo-event object 
                // for the parent component to consume.
                onChange={(selectedOption) => onChange({ target: { name, value: selectedOption?.value || "" } })}
                isSearchable
                styles={customStyles}
                placeholder={placeholder}
            />
            {error && (
                <span className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <FiAlertCircle className="inline-block" /> {error}
                </span>
            )}
        </div>
    );
}


function MultiAudienceSelect({ label, name, value, onChange, options, mandatory, error }) {
    const valueAsArray = Array.isArray(value) ? value : [];
    
    // Filter out the initial "Select..." option from the list of selectable/displayable options
    const selectableOptions = options.filter(option => option.value !== "");
    
    const selectedValueObjects = selectableOptions.filter(option => valueAsArray.includes(option.value));
    const selectedOptions = selectedValueObjects;
    const unselectedOptions = selectableOptions.filter(option => !valueAsArray.includes(option.value));

    const groupedOptions = useMemo(() => {
        const groups = [];
        if (selectedOptions.length > 0) {
            groups.push({ label: 'Selected', options: selectedOptions });
        }
        if (unselectedOptions.length > 0) {
            groups.push({ label: 'Not Selected', options: unselectedOptions });
        }
        return groups;
    }, [selectedOptions, unselectedOptions]);

    const customStyles = {
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused ? '#E5E7EB' : null,
            color: '#374151',
            '&:active': { backgroundColor: '#D1D5DB' },
            fontSize: '0.875rem',
        }),
        multiValue: () => ({ display: 'none' }),
        control: (provided, state) => ({
            ...provided,
            borderColor: error ? '#EF4444' : '#D1D5DB',
            boxShadow: state.isFocused ? '0 0 0 1px #2563EB' : 'none',
            '&:hover': {
                borderColor: error ? '#EF4444' : '#9CA3AF',
            },
            borderRadius: '12px',
            padding: '4px 8px',
            minHeight: '40px',
            transition: 'all 0.2s',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9CA3AF',
            fontSize: '0.875rem',
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 20,
        }),
        valueContainer: (provided) => ({
            ...provided,
            height: '40px',
            padding: '0 6px',
        }),
    };

    const handleChange = (selectedOptions) => {
        const newValues = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
        onChange({ target: { name, value: newValues } });
    };

    const formatOptionLabel = ({ label, value }) => (
        <div className="flex justify-between items-center text-sm">
            {label}
            {valueAsArray.includes(value) && <span className="text-blue-500">✓</span>}
        </div>
    );

    const removeValue = (valueToRemove) => {
        const newValues = valueAsArray.filter(v => v !== valueToRemove);
        onChange({ target: { name, value: newValues } });
    };

    return (
        <div className="flex flex-col space-y-1 w-full">
            <label className="text-sm font-medium text-gray-700 block">
                {label}
                {mandatory && <span className="ml-1 text-red-500">*</span>}
            </label>
            
            <Select
                isMulti
                name={name}
                options={groupedOptions}
                styles={customStyles}
                value={selectedValueObjects}
                onChange={handleChange}
                formatOptionLabel={formatOptionLabel}
                hideSelectedOptions={false}
                closeMenuOnSelect={false}
                placeholder="Select one or more audience types..."
                components={{
                    Placeholder: ({ children, ...props }) => (
                        <div {...props}>
                            {selectedOptions.length > 0 
                                ? `${selectedOptions.length} selected...` 
                                : children
                            }
                        </div>
                    )
                }}
            />
            
            {selectedOptions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {selectedOptions.map((option) => (
                        <span
                            key={option.value}
                            className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200"
                        >
                            <span>{option.label}</span>
                            <button
                                type="button"
                                onClick={() => removeValue(option.value)}
                                className="ml-2 w-4 h-4 flex items-center justify-center text-blue-600 hover:text-blue-800"
                                title={`Remove ${option.label}`}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}
            
            {error && (
                <span className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <FiAlertCircle className="inline-block" /> {error}
                </span>
            )}
        </div>
    );
}

// Reusable Image Upload component
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

        if (multiple) {
            const allFiles = Array.from(files);
            if (allFiles.length > 10) {
                setUploadError('Maximum 10 files allowed');
                return;
            }
            for (const file of allFiles) {
                const error = validateFile(file);
                if (error) {
                    setUploadError(error);
                    return;
                }
            }
            setForm((prev) => ({ ...prev, [name]: allFiles }));
        } else if (files) {
            const error = validateFile(files);
            if (error) {
                setUploadError(error);
                return;
            }
            setForm((prev) => ({ ...prev, [name]: files }));
        }
    };

    const preview = multiple 
        ? (Array.isArray(form[name]) ? form[name].map(file => URL.createObjectURL(file)) : [])
        : (form[name] ? URL.createObjectURL(form[name]) : null);

    return (
        <div className={`p-4 rounded-xl border-2 border-dashed transition-colors duration-200 relative
            ${uploadError ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-blue-400 bg-gray-50'}`}>
            <label className="cursor-pointer flex flex-col items-center justify-center text-center text-sm text-gray-500 min-h-[10rem]">
                {label && <span className="font-semibold text-gray-700 mb-2">{label}</span>}
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    multiple={multiple} 
                    className="hidden" 
                />
                {preview && !multiple && <img src={preview} alt="Preview" className="mt-2 max-h-32 object-contain rounded-md" />}
                {preview && multiple && preview.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mt-2 max-h-28 overflow-y-auto">
                        {preview.map((src, idx) => 
                            <img key={idx} src={src} alt={`Preview ${idx}`} className="h-20 object-contain rounded-md shadow-sm" />
                        )}
                    </div>
                )}
                {!preview || (multiple && preview.length === 0) ? (
                    <div className="text-center flex flex-col items-center">
                        <FiUploadCloud className="text-4xl text-gray-400" />
                        <div className="mt-2 font-medium text-gray-600">Click to upload {multiple ? 'images' : 'image'}</div>
                        <div className="text-xs text-gray-400 mt-1">
                            Max size: 5MB {multiple ? '(up to 10 files)' : ''}
                        </div>
                    </div>
                ) : (
                    <div className="mt-2 text-blue-600 font-medium">Change {multiple ? 'images' : 'image'}</div>
                )}
            </label>
            {uploadError && (
                <div className="absolute bottom-2 left-2 right-2 text-red-500 text-xs flex items-center gap-1">
                    <FiAlertCircle className="inline-block" /> {uploadError}
                </div>
            )}
        </div>
    );
}

// --- VALIDATION UTILITIES (FROM Code 2) ---

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
            "Pole Kiosk": 1, 
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

// --- MAIN COMPONENT ---

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

    const [transitTypeOptions, setTransitTypeOptions] = useState([]);
    const [lineOptions, setLineOptions] = useState([]);
    // State for field-level errors and touch status (from Code 2)
    const [fieldErrors, setFieldErrors] = useState({});
    const [touched, setTouched] = useState({});

    // --- UTILITY FUNCTIONS (FROM Code 1) ---

    const formatForInput = (dateStr) => {
        if (!dateStr) return "";
        // Assuming dateStr is in dd-mm-yyyy format
        const [dd, mm, yyyy] = dateStr.split("-");
        // Ensure reverse formatting for date input type
        if (!yyyy || !mm || !dd) return "";
        return `${yyyy}-${mm}-${dd}`;
    };

    // --- VALIDATION AND STEP LOGIC (COMBINED/ENHANCED) ---

    // Enhanced validation logic (mostly from Code 2)
    const validateField = useCallback((name, value, formData = form) => {
        const errors = [];
        const isSpecialType = ["BQS", "DigitalBQS", "Transit"].includes(formData.spaceType);

        const mandatoryFields = {
            Basic: [ "spaceName", "landlord", "spaceType", "ownershipType", "startDate", "endDate", "audience" ],
            Specifications: formData.spaceType === "DOOH" 
                ? ["unit", "resolution", "width", "height"]
                : ["illumination", "width", "height"],
            Location: ["address", "city", "state", "tier", "facing"]
        };

        if (isSpecialType) {
            mandatoryFields.Basic.push("buyingPrice");
            // If it's a special type, Illumination is the only mandatory spec (as per Code 1 logic)
            mandatoryFields.Specifications = ["illumination"]; 
            // Latitude/Longitude are not mandatory for these types (as per Code 1 logic)
            mandatoryFields.Location = mandatoryFields.Location.filter(
                field => !['zip', 'latitude', 'longitude'].includes(field)
            );
        } else {
            // Price is mandatory for non-special types (implied by Code 1 logic for validation)
            mandatoryFields.Location.push("latitude", "longitude");
            mandatoryFields.Basic.push("price");
        }

        if (formData.spaceType === 'Transit') {
            mandatoryFields.Basic.push('transitType', 'transitLine');
        }

        // Add zip to mandatory fields for non-special types
        if (!isSpecialType) {
            mandatoryFields.Location.push("zip");
        }

        const currentStepFields = mandatoryFields[step] || [];
        const isMandatory = currentStepFields.includes(name);

        if (isMandatory && !validators.required(value)) {
            errors.push(getValidationMessage(name, 'required'));
        }

        switch (name) {
            case 'spaceName':
                if (value && !validators.minLength(value, 2)) errors.push(getValidationMessage('Space name', 'minLength', '2'));
                if (value && !validators.maxLength(value, 100)) errors.push(getValidationMessage('Space name', 'maxLength', '100'));
                if (value && !validators.spaceName(value)) errors.push(getValidationMessage('Space name', 'spaceName'));
                break;
            case 'landlord':
                if (value && !validators.minLength(value, 2)) errors.push(getValidationMessage('Landlord', 'minLength', '2'));
                if (value && !validators.maxLength(value, 100)) errors.push(getValidationMessage('Landlord', 'maxLength', '100'));
                break;
            case 'organization':
            case 'peerMediaOwner':
                if (value && !validators.organization(value)) errors.push(getValidationMessage(name, 'organization'));
                if (value && !validators.maxLength(value, 100)) errors.push(getValidationMessage(name, 'maxLength', '100'));
                break;
            case 'price':
            case 'buyingPrice':
                if (value && !validators.positiveNumber(value)) errors.push(getValidationMessage(name, 'positiveNumber'));
                break;
            case 'footfall':
                if (value && !validators.numeric(value)) errors.push(getValidationMessage('Footfall', 'numeric'));
                if (value && parseFloat(value) < 0) errors.push('Footfall cannot be negative');
                break;
            case 'audience':
                if (isMandatory && (!Array.isArray(value) || value.length === 0)) errors.push('Please select at least one audience type');
                break;
            case 'description':
                if (value && !validators.maxLength(value, 400)) errors.push(getValidationMessage('Description', 'maxLength', '400'));
                break;
            case 'unit': // Slots
                if (value && !validators.positiveNumber(value)) errors.push(getValidationMessage('Slots', 'positiveNumber'));
                if (value && !validators.maxSlots(value, formData.spaceType)) {
                    const maxMap = { Billboard: 1, DOOH: 10, "Pole Kiosk": 1, Gantry: 1, BQS: 1, DigitalBQS: 1, Miscellaneous: 1, Transit: 1 };
                    const max = maxMap[formData.spaceType] || 1;
                    errors.push(getValidationMessage('Slots', 'maxSlots', max));
                }
                break;
            case 'resolution':
                if (value && !validators.resolution(value)) errors.push(getValidationMessage('Resolution', 'resolution'));
                break;
            case 'width':
            case 'height':
                if (value && !validators.positiveNumber(value)) errors.push(getValidationMessage(name, 'positiveNumber'));
                if (value && parseFloat(value) > 1000) errors.push(`${name} seems too large (max 1000 ft)`);
                break;
            case 'latitude':
                if (value && !validators.latitude(value)) errors.push(getValidationMessage('Latitude', 'latitude'));
                break;
            case 'longitude':
                if (value && !validators.longitude(value)) errors.push(getValidationMessage('Longitude', 'longitude'));
                break;
            case 'zip':
                // Check mandatory field for zip
                if (isMandatory && value === '') {
                     errors.push(getValidationMessage('Pin-code', 'required'));
                }
                // Always validate format if there's a value
                if (value && !validators.pincode(value)) errors.push(getValidationMessage('Pin-code', 'pincode'));
                break;
            case 'address':
                if (value && !validators.minLength(value, 10)) errors.push(getValidationMessage('Address', 'minLength', '10'));
                if (value && !validators.maxLength(value, 200)) errors.push(getValidationMessage('Address', 'maxLength', '200'));
                break;
            case 'city':
                if (value && !validators.minLength(value, 2)) errors.push(getValidationMessage('City', 'minLength', '2'));
                if (value && !/^[a-zA-Z\s]+$/.test(value)) errors.push('City name can only contain letters and spaces');
                break;
            default:
                break;
        }
        return errors;
    }, [form, step]);

    // Function to handle input changes with validation and error/touch updates
    const handleValidatedInputChange = (e) => {
        const { name, value } = e.target;
        // Use a functional update to ensure you're validating against the latest state
        setTouched(prev => ({ ...prev, [name]: true }));
        
        // Optimistically update the form state (use handleInputChange which updates global form state)
        handleInputChange(e); 
        
        // Validate against the *new* state, combining the optimistic update with current form data
        const newFormData = { ...form, [name]: value }; 
        const errors = validateField(name, value, newFormData); 
        
        setFieldErrors(prev => ({ ...prev, [name]: errors.length > 0 ? errors[0] : null }));
    };

    // Function to handle field blurring with validation and error/touch updates
    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const errors = validateField(name, form[name]);
        setFieldErrors(prev => ({ ...prev, [name]: errors.length > 0 ? errors[0] : null }));
    };

    // Validation function for stepping (from Code 2)
    const validateCurrentStep = useCallback(() => {
        const isSpecialType = ["BQS", "DigitalBQS", "Transit"].includes(form.spaceType);
        const mandatoryFieldsByStep = {
            Basic: [ "spaceName", "landlord", "spaceType", "ownershipType", "startDate", "endDate", "audience" ],
            Specifications: form.spaceType === "DOOH" ? ["unit", "resolution", "width", "height"] : ["illumination", "width", "height"],
            Location: ["address", "city", "state", "tier", "facing"],
        };

        if (isSpecialType) {
            mandatoryFieldsByStep.Basic.push("buyingPrice");
            mandatoryFieldsByStep.Specifications = ["illumination"];
            mandatoryFieldsByStep.Location = mandatoryFieldsByStep.Location.filter(field => !['zip', 'latitude', 'longitude'].includes(field));
        } else {
            mandatoryFieldsByStep.Location.push("latitude", "longitude", "zip");
            mandatoryFieldsByStep.Basic.push("price");
        }
        
        if (form.spaceType === 'Transit') {
            mandatoryFieldsByStep.Basic.push('transitType', 'transitLine');
        }

        const currentFields = mandatoryFieldsByStep[step] || [];
        let hasErrors = false;
        const newErrors = {};
        const newTouched = {};

        for (const field of currentFields) {
            const errors = validateField(field, form[field]);
            if (errors.length > 0) {
                newErrors[field] = errors[0];
                hasErrors = true;
            } else {
                newErrors[field] = null;
            }
            newTouched[field] = true;
        }

        setFieldErrors(prev => ({ ...prev, ...newErrors }));
        setTouched(prev => ({ ...prev, ...newTouched }));

        if (hasErrors) {
            toast.error("Please fix all required fields before proceeding.");
            return false;
        }
        return true;
    }, [form, step, validateField]);

    // --- STEP NAVIGATION HANDLERS (FROM Code 1) ---

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
            // NOTE: The original Code 1 logic removes the next step from completed, 
            // which can be confusing. Keeping the Code 1 logic for this function as requested, 
            // but standard forms usually keep completed steps as complete.
            setCompletedSteps((prev) => prev.filter((s) => s !== newStep)); 
        }
    };

    // --- SUBMISSION HANDLER (FROM Code 1) ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateCurrentStep()) return;

        const formData = new FormData();
        for (const key in form) {
            // Exclude file keys for separate processing
            if (!["mainPhoto", "longShot", "closeShot", "otherPhotos"].includes(key) && form[key] !== null && form[key] !== undefined) {
                // Handle array for audience by serializing
                if (Array.isArray(form[key])) {
                    formData.append(key, JSON.stringify(form[key])); 
                } else {
                    formData.append(key, form[key]);
                }
            }
        }
        // Append files
        if (form.mainPhoto) formData.append("mainPhoto", form.mainPhoto);
        if (form.longShot) formData.append("longShot", form.longShot);
        if (form.closeShot) formData.append("closeShot", form.closeShot);
        if (form.otherPhotos && Array.isArray(form.otherPhotos)) {
            form.otherPhotos.forEach((file) => formData.append("otherPhotos", file));
        }

        try {
            // Using fetch from Code 1
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/create`, {
                method: "POST",
                body: formData,
            });
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            toast.success("Space created successfully! 🎉");
            navigate("/success");
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong with the submission!");
        }
    };

    // --- CASCADING DROPDOWN HANDLERS (FROM Code 1) ---

    const handleSpaceTypeChange = (e) => {
    const { value } = e.target;
    
    // Update form state with validated input change
    handleValidatedInputChange({ target: { name: 'spaceType', value } }); 
    
    // Reset dependent fields and state manually since we are outside handleValidatedInputChange
    handleInputChange({ target: { name: 'transitType', value: '' } });
    handleInputChange({ target: { name: 'transitLine', value: '' } });
    handleInputChange({ target: { name: 'illumination', value: value === 'DOOH' ? '' : form.illumination } });

    setTransitTypeOptions([]);
    setLineOptions([]);

    if (value === 'Transit') {
        const transitData = spaceOptions.find(opt => opt.value === 'Transit');
        if (transitData && transitData.transitTypes) {
            // Map the options to exclude the nested lines array before setting state for the next select
            setTransitTypeOptions(transitData.transitTypes.map(({ lines, ...rest }) => rest));
        }
    }
    
    // Clear errors for dependent fields
    setFieldErrors(prev => ({
        ...prev,
        transitType: null,
        transitLine: null,
        illumination: null
    }));
};

const handleTransitTypeChange = (e) => {
    const { value } = e.target;
    handleValidatedInputChange({ target: { name: 'transitType', value } });
    
    // Reset the line selection
    setLineOptions([]);
    handleInputChange({ target: { name: 'transitLine', value: '' } });

    const transitOptionsWithLines = spaceOptions.find(opt => opt.value === 'Transit')?.transitTypes || [];
    
    const selectedTypeData = transitOptionsWithLines.find(opt => opt.value === value);
    if (selectedTypeData && selectedTypeData.lines) {
        setLineOptions(selectedTypeData.lines);
    }
    setFieldErrors(prev => ({ ...prev, transitLine: null }));
};

    // --- OPTIONS DATA (FROM Code 1) ---

    const audienceOptions = [
        { value: "Youth", label: "Youth" }, { value: "Working Professionals", label: "Working Professionals" }, { value: "Business Professional", label: "Business Professional" }, { value: "College Students", label: "College Students" }, { value: "Elite", label: "Elite" }, { value: "Families", label: "Families" }, { value: "Fashion Enthusiast", label: "Fashion Enthusiast" }, { value: "Female focused", label: "Female focused" }, { value: "Government official", label: "Government official" }, { value: "Male focused", label: "Male focused" }, { value: "Middle class", label: "Middle class" }, { value: "Rural", label: "Rural" }, { value: "Students", label: "Students" }, { value: "Tourists", label: "Tourists" }, { value: "Working", label: "Working" },
    ];
    const categoryOptions = [
        { value: "Retail", label: "Retail" }, { value: "Transit", label: "Transit" },
    ];
    const illuminationOptions = [
        { value: "Front Lit", label: "Front Lit" }, { value: "Back Lit", label: "Back Lit" }, { value: "Non Lit", label: "Non Lit" },
    ];
    const ownershipOptions = [
        { value: "Owned", label: "Owned" }, { value: "Leased", label: "Leased" }, { value: "Traded", label: "Traded" },
    ];
    
    const spaceOptions = [
        { value: "Billboard", label: "Billboard" }, { value: "DOOH", label: "DOOH" }, { value: "Pole Kiosk", label: "Pole Kiosk" }, { value: "Gantry", label: "Gantry" }, { value: "BQS", label: "BQS" }, { value: "DigitalBQS", label: "DigitalBQS" },
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
    
    const demographicsOptions = [
        { value: "Urban", label: "Urban" }, { value: "Rural", label: "Rural" },
    ];

    const zoneOptions = [ { value: "West", label: "West" }, { value: "East", label: "East" }, ];
    const tierOptions = [ { value: "Tier 1", label: "Tier 1" }, { value: "Tier 2", label: "Tier 2" }, ];
    const facingOptions = [ { value: "Single facing", label: "Single facing" }, { value: "Double facing", label: "Double facing" }, ];
    const stateOptions = [ { value: "Andhra Pradesh", label: "Andhra Pradesh" }, { value: "Arunachal Pradesh", label: "Arunachal Pradesh" }, { value: "Assam", label: "Assam" }, { value: "Bihar", label: "Bihar" }, { value: "Chhattisgarh", label: "Chhattisgarh" }, { value: "Goa", label: "Goa" }, { value: "Gujarat", label: "Gujarat" }, { value: "Haryana", label: "Haryana" }, { value: "Himachal Pradesh", label: "Himachal Pradesh" }, { value: "Jharkhand", label: "Jharkhand" }, { value: "Karnataka", label: "Karnataka" }, { value: "Kerala", label: "Kerala" }, { value: "Madhya Pradesh", label: "Madhya Pradesh" }, { value: "Maharashtra", label: "Maharashtra" }, { value: "Manipur", label: "Manipur" }, { value: "Meghalaya", label: "Meghalaya" }, { value: "Mizoram", label: "Mizoram" }, { value: "Nagaland", label: "Nagaland" }, { value: "Odisha", label: "Odisha" }, { value: "Punjab", label: "Punjab" }, { value: "Rajasthan", label: "Rajasthan" }, { value: "Sikkim", label: "Sikkim" }, { value: "Tamil Nadu", label: "Tamil Nadu" }, { value: "Telangana", label: "Telangana" }, { value: "Tripura", label: "Tripura" }, { value: "Uttar Pradesh", label: "Uttar Pradesh" }, { value: "Uttarakhand", label: "Uttarakhand" }, { value: "West Bengal", label: "West Bengal" }, { value: "Andaman and Nicobar Islands", label: "Andaman and Nicobar Islands", }, { value: "Chandigarh", label: "Chandigarh" }, { value: "Dadra and Nagar Haveli and Daman and Diu", label: "Dadra and Nagar Haveli and Daman and Diu", }, { value: "Delhi", label: "Delhi" }, { value: "Jammu and Kashmir", label: "Jammu and Kashmir" }, { value: "Ladakh", label: "Ladakh" }, { value: "Lakshadweep", label: "Lakshadweep" }, { value: "Puducherry", label: "Puducherry" }, ];
    const specificationOptions = [ { value: "LHS", label: "LHS" }, { value: "RHS", label: "RHS" }, ];


    // --- RENDER (Using Code 2 structure and UI components) ---

    return (
        <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-gray-800 flex flex-col lg:flex-row overflow-hidden`}>
            <Navbar />
            <main className={`flex-1 overflow-y-auto px-4 md:px-6 py-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
                <div className="max-w-screen-xl w-full mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <Button onClick={() => navigate(-1)} className="bg-gray-700 text-white">
                            <FaArrowLeft className="inline mr-2" /> Back
                        </Button>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Create New Space</h1>
                    
                    {/* Step Navigation Tabs */}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 text-sm font-medium border-b border-gray-200">
                        {stepOrder.map((label) => (
                            <div 
                                key={label} 
                                className={`flex items-center gap-2 pb-2 cursor-pointer transition-colors duration-200
                                    ${step === label ? "border-b-2 border-black text-black" : "text-gray-500"}
                                    ${completedSteps.includes(label) && "text-green-600 border-green-600"}`}
                                onClick={() => setStep(label)}
                            >
                                <span className={`${completedSteps.includes(label) ? "text-green-600" : "text-gray-400"}`}>
                                    {completedSteps.includes(label) ? <FaCheck /> : <span className="text-xl leading-none">•</span>}
                                </span>
                                {label} Information
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="pb-24 space-y-8">
                        {step === "Basic" && (
                            <div className="space-y-8">
                                {/* Basic Details Card */}
                                <Card>
                                    <CardContent>
                                        <h2 className="text-lg font-semibold text-gray-800 mb-6">Basic Details</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                                            <Input 
                                                label="Space name" 
                                                mandatory 
                                                name="spaceName" 
                                                value={form.spaceName} 
                                                onChange={handleValidatedInputChange}
                                                onBlur={handleBlur}
                                                error={touched.spaceName && fieldErrors.spaceName}
                                            />
                                            <Input 
                                                label="Landlord" 
                                                name="landlord" 
                                                mandatory 
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
                                            
                                            <CustomSelect
                                                label="Space Type"
                                                name="spaceType"
                                                value={form.spaceType}
                                                // 💡 FIX: Use the dedicated cascading handler here. The CustomSelect component internally converts the selected option into the pseudo-event object expected by this handler.
                                                onChange={handleSpaceTypeChange} 
                                                options={spaceOptions.map(({ transitTypes, ...rest }) => rest)}
                                                mandatory
                                                error={touched.spaceType && fieldErrors.spaceType}
                                            />
                                            
                                            {form.spaceType === 'Transit' && (
                                                <>
                                                    <CustomSelect
                                                        label="Transit Type"
                                                        name="transitType"
                                                        value={form.transitType}
                                                        onChange={handleTransitTypeChange}
                                                        options={transitTypeOptions}
                                                        mandatory
                                                        error={touched.transitType && fieldErrors.transitType}
                                                    />
                                                    {form.transitType && lineOptions.length > 0 && (
                                                        <CustomSelect
                                                            label="Transit Line"
                                                            name="transitLine"
                                                            value={form.transitLine}
                                                            onChange={handleValidatedInputChange} // Simple selection, use direct handler
                                                            options={lineOptions}
                                                            mandatory
                                                            error={touched.transitLine && fieldErrors.transitLine}
                                                        />
                                                    )}
                                                </>
                                            )}
                                            
                                            <CustomSelect 
                                                label="Ownership Type" 
                                                name="ownershipType" 
                                                value={form.ownershipType} 
                                                onChange={handleValidatedInputChange} 
                                                options={ownershipOptions} 
                                                mandatory
                                                error={touched.ownershipType && fieldErrors.ownershipType}
                                            />
                                            <Input 
                                                mandatory 
                                                label={`${form.ownershipType || "Contract"} Start Date`} 
                                                name="startDate" 
                                                type="date" 
                                                value={formatForInput(form.startDate)} 
                                                onChange={handleValidatedInputChange}
                                                onBlur={handleBlur}
                                                error={touched.startDate && fieldErrors.startDate}
                                            />
                                            <Input 
                                                label={`${form.ownershipType || "Contract"} End Date`} 
                                                name="endDate" 
                                                mandatory 
                                                type="date" 
                                                value={formatForInput(form.endDate)} 
                                                onChange={handleValidatedInputChange}
                                                onBlur={handleBlur}
                                                error={touched.endDate && fieldErrors.endDate}
                                                min={form.startDate ? formatForInput(form.startDate) : ""} 
                                            />
                                            <CustomSelect 
                                                label="Category" 
                                                name="category" 
                                                value={form.category} 
                                                onChange={handleValidatedInputChange} 
                                                options={categoryOptions} 
                                                mandatory={false}
                                                error={touched.category && fieldErrors.category}
                                            />
                                            <CustomSelect 
                                                label="Specification" 
                                                name="specification" 
                                                value={form.specification} 
                                                onChange={handleValidatedInputChange} 
                                                options={specificationOptions} 
                                                mandatory={false} // Note: Keeping false based on your visible image and form's current step constraints
                                                error={touched.specification && fieldErrors.specification}
                                            />
                                            
                                            {["BQS", "DigitalBQS", "Transit"].includes(form.spaceType) ? (
                                                <Input 
                                                    label="Buying Price" 
                                                    name="buyingPrice" 
                                                    value={form.buyingPrice} 
                                                    onChange={handleValidatedInputChange}
                                                    onBlur={handleBlur}
                                                    error={touched.buyingPrice && fieldErrors.buyingPrice}
                                                    mandatory 
                                                />
                                            ) : (
                                                <Input 
                                                    label="Price" 
                                                    name="price" 
                                                    value={form.price} 
                                                    onChange={handleValidatedInputChange}
                                                    onBlur={handleBlur}
                                                    error={touched.price && fieldErrors.price}
                                                    mandatory 
                                                />
                                            )}

                                            <Input 
                                                label="Footfall" 
                                                name="footfall" 
                                                value={form.footfall} 
                                                onChange={handleValidatedInputChange}
                                                onBlur={handleBlur}
                                                error={touched.footfall && fieldErrors.footfall}
                                                type="number"
                                            />
                                            <MultiAudienceSelect 
                                                label="Audience" 
                                                name="audience" 
                                                value={form.audience} 
                                                onChange={handleValidatedInputChange} 
                                                options={audienceOptions} 
                                                mandatory
                                                error={touched.audience && fieldErrors.audience}
                                            />
                                            <CustomSelect
                                                label="Demographics" 
                                                name="demographics" 
                                                value={form.demographics} 
                                                onChange={handleValidatedInputChange}
                                                options={demographicsOptions}
                                                error={touched.demographics && fieldErrors.demographics}
                                            />
                                            <div className="col-span-full flex flex-col space-y-1">
                                                <label className="text-sm font-medium text-gray-700">Description</label>
                                                <textarea 
                                                    name="description" 
                                                    value={form.description} 
                                                    onChange={handleValidatedInputChange}
                                                    onBlur={handleBlur}
                                                    className={`w-full block border px-3 py-2 rounded-xl text-sm h-24 ${touched.description && fieldErrors.description ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                                                    maxLength={400} 
                                                />
                                                <div className="flex justify-between items-center mt-1">
                                                    {touched.description && fieldErrors.description && (
                                                        <span className="text-red-500 text-xs flex items-center gap-1">
                                                            <FiAlertCircle className="inline-block" /> {fieldErrors.description}
                                                        </span>
                                                    )}
                                                    <span className="text-gray-500 text-xs ml-auto">
                                                        {form.description?.length || 0}/400 characters
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Photos Section Card */}
                                <Card>
                                    <CardContent>
                                        <h2 className="text-lg font-semibold text-gray-800 mb-6">Photos</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div>
                                                <ImageUpload label="Inventory Image (Main Photo)" name="mainPhoto" />
                                            </div>
                                            <div>
                                                <ImageUpload label="Long Shot" name="longShot" />
                                            </div>
                                            <div>
                                                <ImageUpload label="Close Shot" name="closeShot" />
                                            </div>
                                            <div className="md:col-span-2 lg:col-span-3">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">Other Images</label>
                                                    <ImageUpload name="otherPhotos" multiple />
                                                    <p className="text-xs text-gray-500">
                                                        You can upload multiple other images (max 10 files, 5MB each).
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {step === "Specifications" && (
                            <Card>
                                <CardContent>
                                    <h2 className="text-lg font-semibold text-gray-800 mb-6">Specifications</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                                        {form.spaceType !== "DOOH" && (
                                            <CustomSelect 
                                                label="Illumination" 
                                                name="illumination" 
                                                value={form.illumination} 
                                                onChange={handleValidatedInputChange} 
                                                options={illuminationOptions} 
                                                mandatory
                                                error={touched.illumination && fieldErrors.illumination}
                                            />
                                        )}
                                        {form.spaceType === "DOOH" && (
                                            <>
                                                <Input 
                                                    label="Slots" 
                                                    name="unit" 
                                                    mandatory
                                                    value={form.unit} 
                                                    onChange={handleValidatedInputChange}
                                                    onBlur={handleBlur}
                                                    error={touched.unit && fieldErrors.unit}
                                                    type="number"
                                                />
                                                <Input 
                                                    label="Resolutions" 
                                                    mandatory
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
                                            mandatory={!["BQS", "DigitalBQS", "Transit"].includes(form.spaceType)} 
                                            name="width" 
                                            value={form.width} 
                                            onChange={handleValidatedInputChange}
                                            onBlur={handleBlur}
                                            error={touched.width && fieldErrors.width}
                                            type="number"
                                        />
                                        <Input 
                                            label="Height (in ft)" 
                                            mandatory={!["BQS", "DigitalBQS", "Transit"].includes(form.spaceType)} 
                                            name="height" 
                                            value={form.height} 
                                            onChange={handleValidatedInputChange}
                                            onBlur={handleBlur}
                                            error={touched.height && fieldErrors.height}
                                            type="number"
                                        />
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
                                </CardContent>
                            </Card>
                        )}

                        {step === "Location" && (
                            <Card>
                                <CardContent>
                                    <h2 className="text-lg font-semibold text-gray-800 mb-6">Location Details</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                                        <Input 
                                            label="Address" 
                                            mandatory 
                                            name="address" 
                                            value={form.address} 
                                            onChange={handleValidatedInputChange}
                                            onBlur={handleBlur}
                                            error={touched.address && fieldErrors.address}
                                        />
                                        <Input 
                                            label="City" 
                                            mandatory 
                                            name="city" 
                                            value={form.city} 
                                            onChange={handleValidatedInputChange}
                                            onBlur={handleBlur}
                                            error={touched.city && fieldErrors.city}
                                        />
                                        <CustomSelect 
                                            label="State" 
                                            name="state" 
                                            value={form.state} 
                                            onChange={handleValidatedInputChange} 
                                            options={stateOptions} 
                                            mandatory
                                            error={touched.state && fieldErrors.state}
                                        />
                                        <Input 
                                            label="Pin-code" 
                                            name="zip" 
                                            value={form.zip} 
                                            onChange={handleValidatedInputChange}
                                            onBlur={handleBlur}
                                            error={touched.zip && fieldErrors.zip}
                                            placeholder="e.g., 400001"
                                            mandatory={!["BQS", "DigitalBQS", "Transit"].includes(form.spaceType)} 
                                        />
                                        <Input 
                                            label="Latitude" 
                                            mandatory={!["BQS", "DigitalBQS", "Transit"].includes(form.spaceType)} 
                                            name="latitude" 
                                            value={form.latitude} 
                                            onChange={handleValidatedInputChange}
                                            onBlur={handleBlur}
                                            error={touched.latitude && fieldErrors.latitude}
                                            placeholder="e.g., 19.0760"
                                            type="number"
                                        />
                                        <Input 
                                            label="Longitude" 
                                            mandatory={!["BQS", "DigitalBQS", "Transit"].includes(form.spaceType)} 
                                            name="longitude" 
                                            value={form.longitude} 
                                            onChange={handleValidatedInputChange}
                                            onBlur={handleBlur}
                                            error={touched.longitude && fieldErrors.longitude}
                                            placeholder="e.g., 72.8777"
                                            type="number"
                                        />
                                        <div className="lg:col-span-full">
                                            {form.latitude && form.longitude && !isNaN(parseFloat(form.latitude)) && !isNaN(parseFloat(form.longitude)) && (
                                                <div className="rounded-xl shadow-inner overflow-hidden">
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Map Preview</label>
                                                    <div className="h-80">
                                                        <MapPreview latitude={parseFloat(form.latitude)} longitude={parseFloat(form.longitude)} />
                                                    </div>
                                                    <p className="mt-1 text-xs text-gray-500">Real-time map preview from OpenStreetMap.</p>
                                                </div>
                                            )}
                                        </div>
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
                                            mandatory
                                            error={touched.tier && fieldErrors.tier}
                                        />
                                        <CustomSelect 
                                            label="Facing" 
                                            name="facing" 
                                            value={form.facing} 
                                            onChange={handleValidatedInputChange} 
                                            options={facingOptions} 
                                            mandatory
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
                                </CardContent>
                            </Card>
                        )}
                    </form>
                </div>

                {/* Fixed Footer for Navigation */}
                <div className={`fixed bottom-0 right-0 bg-white z-10 transition-all duration-300 border-t border-gray-200 ${isCollapsed ? "left-0 lg:left-24" : "left-0 lg:left-64"}`}>
                    <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-xl mx-auto">
                        <Button className="bg-gray-700 hover:bg-gray-800" onClick={() => navigate(-1)}>
                            Cancel
                        </Button>
                        <div className="flex items-center space-x-3">
                            <Button 
                                onClick={handleBack} 
                                disabled={step === "Basic"} 
                                className="bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                                Back
                            </Button>
                            <Button 
                                onClick={handleNext} 
                                className="bg-black text-white hover:bg-blue-700"
                            >
                                {step === stepOrder[stepOrder.length - 1] ? "Preview" : "Next"}
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Injected Styles for Animations (from Code 2) */}
            <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
                .animate-slideDown { animation: slideDown 0.4s ease-out; }
            `}</style>
        </div>
    );
}