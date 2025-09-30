import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { toast } from "sonner";
import { useSidebar } from "../context/SidebarContext";
import Select from "react-select";
import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';

// --- STYLING CONSTANTS & ANIMATION STYLES (From Code 2 for UI/UX) ---
const CustomStyles = () => (
    <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes bg-gradient-flow-diagonal { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
        .animate-bg-gradient-flow-diagonal { background-size: 200% 200%; animation: bg-gradient-flow-diagonal 10s linear infinite; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
    `}</style>
);

// --- HELPER FUNCTIONS (From Code 1 & 2) ---

const toInputDate = (dateStr) => {
    if (!dateStr || dateStr.split('-').length !== 3) return "";
    const [day, month, year] = dateStr.split('-');
    // Handle DD-MM-YYYY and YYYY-MM-DD
    if (year.length === 4 && day.length === 2 && month.length === 2) {
        // Assume YYYY-MM-DD is incorrect if fetching DD-MM-YYYY is what's expected for dates?.[0]
        // Code 1 logic: if year is 4 digits, assume DD-MM-YYYY from backend and return YYYY-MM-DD for input
        // This is a common pattern for date libraries, so we keep the logic from Code 1.
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // If year is 2 digits, prepend "20"
    return `20${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const toDisplayDate = (dateStr) => {
    if (!dateStr || dateStr.split('-').length !== 3) return null;
    const [year, month, day] = dateStr.split('-');
    // Convert YYYY-MM-DD (from input) to DD-MM-YYYY (for API payload)
    return `${day}-${month}-${year}`;
};

const validateRequired = (value, fieldName) => {
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0)) {
        return `${fieldName} is required`;
    }
    return '';
};

const validateNumber = (value, fieldName, min = 0) => {
    if (value === null || value === undefined || value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num)) return `${fieldName} must be a valid number`;
    if (num < min) return `${fieldName} must be at least ${min}`;
    return '';
};

// --- REUSABLE UI COMPONENTS (From Code 2 for consistent look) ---

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

const Input = ({ className = '', ...props }) => (
    <input
        className={`border ${props.error ? 'border-red-300' : 'border-gray-200'} px-4 py-2 rounded-xl w-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
        {...props}
    />
);

const FormField = ({ label, name, children, required, error, className = '' }) => (
    <div className={`flex flex-col gap-2 ${className}`}>
        <label htmlFor={name} className="font-semibold text-sm text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {children}
            {error && (
                <p className="absolute -bottom-5 left-0 text-red-500 text-xs mt-1 animate-slideDown">
                    <FaExclamationTriangle className="inline-block mr-1 text-xs" />
                    {error}
                </p>
            )}
        </div>
    </div>
);

// Unified Field Components using FormField and Input/Select styling from Code 2
const InputField = ({ label, name, value, onChange, onBlur, placeholder, type = "text", required, error }) => (
    <FormField label={label} name={name} required={required} error={error}>
        <Input 
            id={name} 
            name={name} 
            type={type} 
            value={value} 
            onChange={onChange} 
            onBlur={onBlur}
            placeholder={placeholder} 
            error={error}
        />
    </FormField>
);

const SelectField = ({ label, name, value, onChange, options, placeholder = "Select...", required, error, onBlur }) => (
    <FormField label={label} name={name} required={required} error={error}>
        <select 
            id={name} 
            name={name} 
            value={value} 
            onChange={onChange} 
            onBlur={onBlur}
            className={`border ${error ? 'border-red-300' : 'border-gray-200'} px-4 py-2 rounded-xl w-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm hover:shadow-md`}
        >
            <option value="">{placeholder}</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </FormField>
);

const TextareaField = ({ label, name, value, onChange, onBlur, placeholder, rows = 4, required, error }) => (
    <FormField label={label} name={name} required={required} error={error} className="col-span-full">
        <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            rows={rows}
            className={`border ${error ? 'border-red-300' : 'border-gray-200'} px-4 py-2 rounded-xl w-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 shadow-sm hover:shadow-md resize-none`}
        />
    </FormField>
);

// Custom Multi-select for Audience (From Code 2)
function MultiAudienceSelect({ label, name, value, onChange, options, error, required }) {
    const valueAsArray = Array.isArray(value) ? value : [];
    const selectedValueObjects = options.filter(option => valueAsArray.includes(option.value));

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            borderRadius: '1rem',
            border: error ? '1px solid #f87171' : '1px solid #e5e7eb',
            boxShadow: state.isFocused ? '0 0 0 2px #c7d2fe' : 'none',
            '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#9ca3af' },
            minHeight: '42px',
            backgroundColor: '#fff',
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: '#e0f2fe',
            borderRadius: '12px',
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: '#075985',
            fontWeight: '600',
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: '#075985',
            '&:hover': { backgroundColor: '#bae6fd', color: '#0369a1' },
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: '1rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
        }),
    };

    const handleChange = (selectedOptions) => {
        const newValues = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
        onChange({ target: { name, value: newValues } });
    };

    return (
        <FormField label={label} name={name} required={required} error={error}>
            <Select
                isMulti
                name={name}
                options={options}
                styles={customStyles}
                value={selectedValueObjects}
                onChange={handleChange}
                placeholder="Select one or more audience types..."
            />
        </FormField>
    );
}

// Re-styled File Upload Component (From Code 2)
const FileUploadField = ({ label, name, onChange, currentImage, onImageClick }) => {
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            onChange(e);
        } else {
            setPreviewUrl(null);
        }
    };

    const imageUrl = previewUrl || currentImage;
    
    return (
        <div className="flex flex-col gap-2">
            <label className="font-semibold text-sm text-gray-700">{label}</label>
            <div className={`relative rounded-xl border-2 border-gray-200 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md`}>
                <input 
                    type="file" 
                    name={name} 
                    onChange={handleFileChange} 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                    accept="image/*"
                />
                {imageUrl ? (
                    <div className="h-32 w-full">
                        <img 
                            src={imageUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300" 
                            onClick={(e) => { e.preventDefault(); onImageClick(imageUrl); }}
                        />
                    </div>
                ) : (
                    <div className="h-32 flex items-center justify-center p-4 text-center text-sm text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors">
                        Click or drag to upload image
                    </div>
                )}
            </div>
        </div>
    );
};

// New Image Preview Modal Component (extracted for reusability from Code 2)
const ImagePreviewModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="relative bg-gray-100 rounded-2xl shadow-xl overflow-hidden max-w-4xl max-h-[90vh] animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 text-lg hover:bg-opacity-75 z-10"
                    onClick={onClose}
                >
                    &times;
                </button>
                <img src={imageUrl} alt="Preview" className="max-w-full max-h-[85vh] object-contain" />
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
export default function EditSpace() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isCollapsed } = useSidebar();
    const [space, setSpace] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState({
        mainPhoto: null, longShot: null, closeShot: null, otherPhotos: [],
    });
    const [previewImageUrl, setPreviewImageUrl] = useState(null);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Options arrays (From Code 1)
    const ownershipOptions = ["Owned", "Leased", "Traded"];
    const illuminationOptions = ["Front Lit", "Back Lit", "Non Lit"];
    const specificationOptions = ["LHS", "RHS"];
    const spaceTypeOptions = ["Billboard", "DOOH", "Pole Kiosk", "Gantry", "BQS", "DigitalBQS", "Transit", "Miscellaneous"];
    const categoryOptions = ["Retail", "Transit"];
    const mediaTypeOptions = ["Static", "Digital"];
    const audienceOptions = [
        { value: "Youth", label: "Youth" }, { value: "Working Professionals", label: "Working Professionals" }, { value: "Business Professional", label: "Business Professional" }, { value: "College Students", label: "College Students" }, { value: "Elite", label: "Elite" }, { value: "Families", label: "Families" }, { value: "Fashion Enthusiast", label: "Fashion Enthusiast" }, { value: "Female focused", label: "Female focused" }, { value: "Government official", label: "Government official" }, { value: "Male focused", label: "Male focused" }, { value: "Middle class", label: "Middle class" }, { value: "Rural", label: "Rural" }, { value: "Students", label: "Students" }, { value: "Tourists", label: "Tourists" }, { value: "Working", label: "Working" },
    ];
    const demographicsOptions = ["Urban", "Rural"];
    const tierOptions = ["Tier 1", "Tier 2"];
    const facingOptions = ["Single facing", "Double facing"];
    const transitTypeOptions = ["Normal Local", "AC Local"];
    const transitLineOptions = ["Central Line", "Western Line", "Harbour line"];

    // Validation logic (From Code 2, now using useCallback for memoization)
    const validateField = useCallback((name, value, spaceData) => {
        let error = '';
        const fieldMap = {
            'spaceName': 'Space Name', 'landlord': 'Landlord', 'organization': 'Organization',
            'price': 'Price', 'buyingPrice': 'Buying Price', 'footfall': 'Footfall',
            'width': 'Width', 'height': 'Height', 'totalUnits': 'Total Units',
            'occupiedUnits': 'Occupied Units', 'latitude': 'Latitude', 'longitude': 'Longitude'
        };

        const fieldName = fieldMap[name] || name.charAt(0).toUpperCase() + name.slice(1);

        switch (name) {
            case 'spaceName':
            case 'landlord':
            case 'organization':
                error = validateRequired(value, fieldName);
                break;
            case 'price':
            case 'buyingPrice':
                // Only validate if present, but since these are key fields, they are often implicitly required on the backend
                if (value || value === 0) error = validateNumber(value, fieldName);
                break;
            case 'footfall':
            case 'width':
            case 'height':
            case 'totalUnits':
            case 'occupiedUnits':
                if (value || value === 0) error = validateNumber(value, fieldName);
                break;
            case 'latitude':
                error = validateNumber(value, 'Latitude', -90) || (value && (parseFloat(value) < -90 || parseFloat(value) > 90) ? 'Latitude must be between -90 and 90' : '');
                break;
            case 'longitude':
                error = validateNumber(value, 'Longitude', -180) || (value && (parseFloat(value) < -180 || parseFloat(value) > 180) ? 'Longitude must be between -180 and 180' : '');
                break;
            case 'availableTo':
                if (value && spaceData?.availableFrom) {
                    const fromDate = new Date(spaceData.availableFrom);
                    const toDate = new Date(value);
                    if (toDate <= fromDate) {
                        error = 'End date must be after start date';
                    }
                }
                break;
            case 'occupiedUnits':
                if (value && spaceData?.totalUnits) {
                    const occupied = parseInt(value);
                    const total = parseInt(spaceData.totalUnits);
                    if (occupied > total) {
                        error = 'Occupied units cannot exceed total units';
                    }
                }
                break;
            default:
                break;
        }
        return error;
    }, []);

    // Fetch space data (From Code 1)
    const fetchSpace = useCallback(async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${id}`);
            const data = await response.json();
            
            // Handle audience: convert comma-separated string to array if necessary
            const audienceAsArray = Array.isArray(data.audience) 
                ? data.audience 
                : (data.audience ? data.audience.toString().split(',').map(item => item.trim()).filter(Boolean) : []);

            const transformedData = {
                ...data,
                audience: audienceAsArray,
                totalUnits: data.unit, // Map 'unit' from API to 'totalUnits' for form state
                availableFrom: toInputDate(data.dates?.[0]),
                availableTo: toInputDate(data.dates?.[1]),
            };
            setSpace(transformedData);
        } catch (error) {
            console.error("Error fetching space:", error);
            toast.error("Could not load space details.");
        }
    }, [id]);

    useEffect(() => {
        fetchSpace();
    }, [fetchSpace]);

    // Handle all input/select changes (Improved logic from Code 2)
    const handleChange = (e) => {
        const { name, value } = e.target;
        // Use a temporary object for validation checks involving multiple fields (e.g., date range)
        const newSpace = { ...space, [name]: value }; 
        setSpace(newSpace);
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value, newSpace) }));

        // Re-validate coupled fields to ensure cross-validation is updated
        if (name === 'availableFrom' || name === 'availableTo') {
            const coupledName = name === 'availableFrom' ? 'availableTo' : 'availableFrom';
            setErrors(prev => ({ 
                ...prev, 
                [coupledName]: validateField(coupledName, newSpace[coupledName], newSpace) 
            }));
        } else if (name === 'totalUnits' || name === 'occupiedUnits') {
            const coupledName = name === 'totalUnits' ? 'occupiedUnits' : 'totalUnits';
            setErrors(prev => ({ 
                ...prev, 
                [coupledName]: validateField(coupledName, newSpace[coupledName], newSpace) 
            }));
        }
    };

    // Handle blur event for live validation feedback
    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value, space) }));
    };

    // Handle file change (From Code 1)
    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (name === "otherPhotos") {
            setSelectedFiles((prev) => ({ ...prev, otherPhotos: Array.from(files) }));
        } else {
            setSelectedFiles((prev) => ({ ...prev, [name]: files[0] }));
        }
    };

    // Handle save (From Code 1 with added pre-save validation)
    const handleSave = async () => {
        const newErrors = {};
        // Run full validation on all fields
        Object.keys(space || {}).forEach(key => {
            const error = validateField(key, space[key], space);
            if (error) newErrors[key] = error;
        });

        setErrors(newErrors);
        // Mark all fields as touched to display all errors
        setTouched(Object.keys(space || {}).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

        if (Object.keys(newErrors).some(key => newErrors[key])) {
            toast.error("Please fix the form errors before saving. ⚠️");
            return;
        }

        try {
            // Destructure state for payload creation (as in Code 1)
            const { availableFrom, availableTo, totalUnits, _id, __v, createdAt, updatedAt, ...restOfSpace } = space;

            const payload = {
                ...restOfSpace,
                unit: totalUnits, // Map 'totalUnits' from state back to 'unit' for API
                dates: [toDisplayDate(availableFrom), toDisplayDate(availableTo)],
            };
            
            const formData = new FormData();
            
            // Append all payload data to FormData (handling arrays)
            for (const key in payload) {
                if (payload[key] !== null && payload[key] !== undefined) {
                    const value = payload[key];
                    if (Array.isArray(value)) {
                        value.forEach(item => {
                            if (item !== null && item !== undefined) {
                                formData.append(key, item);
                            }
                        });
                    } else {
                        formData.append(key, value);
                    }
                }
            }

            // Append new files to FormData
            if (selectedFiles.mainPhoto) formData.append("mainPhoto", selectedFiles.mainPhoto);
            if (selectedFiles.longShot) formData.append("longShot", selectedFiles.longShot);
            if (selectedFiles.closeShot) formData.append("closeShot", selectedFiles.closeShot);
            selectedFiles.otherPhotos.forEach((photo) => formData.append("otherPhotos", photo));

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${id}`, {
                method: "PUT",
                body: formData,
            });

            if (response.ok) {
                toast.success("Space updated successfully! 🎉");
                navigate(`/space/${id}`);
            } else {
                const err = await response.json();
                toast.error(`Failed to update space: ${err.details || err.message || 'Internal Server Error'}`);
            }
        } catch (error) {
            console.error("Catch Block Error:", error);
            toast.error("An error occurred. Check the console for details.");
        }
    };

    // Deletion Modal logic (From Code 2's structure but using Code 1's delete logic)
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const handleDelete = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${id}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success('Space deleted successfully!');
                navigate('/');
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Failed to delete space' }));
                toast.error(errorData.message || 'Failed to delete space.');
            }
        } catch (error) {
            toast.error(error.message || 'An error occurred while deleting the space.');
        } finally {
            setShowDeleteModal(false);
        }
    };


    if (!space) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-gray-800 flex flex-col lg:flex-row overflow-hidden">
                <Navbar />
                <main className={`flex-1 flex items-center justify-center p-6 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
                    <div className='flex flex-col items-center gap-3 animate-pulse'>
                        <div className='w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin'></div>
                        <div className='text-gray-500 text-sm'>
                            Loading space details...
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Determine price field name dynamically
    const priceFieldName = space.spaceType === 'BQS' || space.spaceType === 'DigitalBQS' || space.spaceType === 'Transit' ? "buyingPrice" : "price";
    const priceLabel = space.spaceType === 'BQS' || space.spaceType === 'DigitalBQS' || space.spaceType === 'Transit' ? "Buying Price" : "Price";

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-gray-800 flex flex-col lg:flex-row overflow-hidden'>
            <CustomStyles />
            <Navbar />
            <main className={`flex-1 overflow-y-auto px-4 md:px-6 py-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
                <div className="flex justify-between items-center mb-6 animate-slideDown">
                    <Button onClick={() => navigate(-1)} className="bg-gray-700 hover:bg-gray-800">
                        <FaArrowLeft className="inline mr-2" /> Back
                    </Button>
                </div>

                <div className='p-6 md:p-8 rounded-2xl shadow-xl animate-slideUp bg-white border border-gray-200'>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
                        Edit {space.spaceName ?? 'Space'}
                    </h1>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
                        {/* Form Fields */}
                        <InputField label="Space Name" name="spaceName" required value={space.spaceName || ""} onChange={handleChange} onBlur={handleBlur} error={touched.spaceName ? errors.spaceName : ''} />
                        <InputField label="Landlord" name="landlord" required value={space.landlord || ""} onChange={handleChange} onBlur={handleBlur} error={touched.landlord ? errors.landlord : ''} />
                        <InputField label="Inventory Owner (Organization)" name="organization" required value={space.organization || ""} onChange={handleChange} onBlur={handleBlur} error={touched.organization ? errors.organization : ''} />
                        <InputField label="Peer Media Owner" name="peerMediaOwner" value={space.peerMediaOwner || ""} onChange={handleChange} onBlur={handleBlur} error={touched.peerMediaOwner ? errors.peerMediaOwner : ''} />

                        <SelectField label="Ownership Type" name="ownershipType" value={space.ownershipType || ""} onChange={handleChange} onBlur={handleBlur} options={ownershipOptions} error={touched.ownershipType ? errors.ownershipType : ''} />
                        <SelectField label="Space Type" name="spaceType" value={space.spaceType || ""} onChange={handleChange} onBlur={handleBlur} options={spaceTypeOptions} error={touched.spaceType ? errors.spaceType : ''} />
                        
                        {/* Conditional Transit Fields */}
                        {space.spaceType === 'Transit' && (
                            <>
                                <SelectField label="Transit Type" name="transitType" value={space.transitType || ""} onChange={handleChange} onBlur={handleBlur} options={transitTypeOptions} error={touched.transitType ? errors.transitType : ''} />
                                <SelectField label="Transit Line" name="transitLine" value={space.transitLine || ""} onChange={handleChange} onBlur={handleBlur} options={transitLineOptions} error={touched.transitLine ? errors.transitLine : ''} />
                            </>
                        )}

                        <SelectField label="Category" name="category" value={space.category || ""} onChange={handleChange} onBlur={handleBlur} options={categoryOptions} error={touched.category ? errors.category : ''} />
                        <SelectField label="Specification" name="specification" value={space.specification || ""} onChange={handleChange} onBlur={handleBlur} options={specificationOptions} error={touched.specification ? errors.specification : ''} />
                        <SelectField label="Media Type" name="mediaType" value={space.mediaType || ""} onChange={handleChange} onBlur={handleBlur} options={mediaTypeOptions} error={touched.mediaType ? errors.mediaType : ''} />
                        
                        {/* Conditional Illumination Field (DOOH is typically not lit) */}
                        {space.spaceType !== 'DOOH' && (
                            <SelectField label="Illumination" name="illumination" value={space.illumination || ""} onChange={handleChange} onBlur={handleBlur} options={illuminationOptions} error={touched.illumination ? errors.illumination : ''} />
                        )}
                        
                        {/* Price/Buying Price Field */}
                        <InputField 
                            label={priceLabel} 
                            name={priceFieldName} 
                            type="number" 
                            value={space[priceFieldName] || ""} 
                            onChange={handleChange} 
                            onBlur={handleBlur} 
                            error={touched[priceFieldName] ? errors[priceFieldName] : ''} 
                        />
                        
                        <InputField label="Footfall" name="footfall" type="number" value={space.footfall || ""} onChange={handleChange} onBlur={handleBlur} error={touched.footfall ? errors.footfall : ''} />
                        
                        <MultiAudienceSelect 
                            label="Audience" 
                            name="audience" 
                            value={space.audience || []} 
                            onChange={handleChange} 
                            options={audienceOptions} 
                            error={touched.audience ? errors.audience : ''}
                        />

                        <SelectField label="Demographics" name="demographics" value={space.demographics || ""} onChange={handleChange} onBlur={handleBlur} options={demographicsOptions} error={touched.demographics ? errors.demographics : ''} />
                        
                        <InputField label="Width (ft)" name="width" type="number" value={space.width || ""} onChange={handleChange} onBlur={handleBlur} error={touched.width ? errors.width : ''} />
                        <InputField label="Height (ft)" name="height" type="number" value={space.height || ""} onChange={handleChange} onBlur={handleBlur} error={touched.height ? errors.height : ''} />

                        <InputField label="Address" name="address" value={space.address || ""} onChange={handleChange} onBlur={handleBlur} error={touched.address ? errors.address : ''} />
                        <InputField label="City" name="city" value={space.city || ""} onChange={handleChange} onBlur={handleBlur} error={touched.city ? errors.city : ''} />
                        <InputField label="State" name="state" value={space.state || ""} onChange={handleChange} onBlur={handleBlur} error={touched.state ? errors.state : ''} />
                        
                        <InputField label="Latitude" name="latitude" value={space.latitude || ""} onChange={handleChange} onBlur={handleBlur} error={touched.latitude ? errors.latitude : ''} />
                        <InputField label="Longitude" name="longitude" value={space.longitude || ""} onChange={handleChange} onBlur={handleBlur} error={touched.longitude ? errors.longitude : ''} />
                        
                        <InputField label="Zone" name="zone" value={space.zone || ""} onChange={handleChange} onBlur={handleBlur} error={touched.zone ? errors.zone : ''} />
                        <SelectField label="Tier" name="tier" value={space.tier || ""} onChange={handleChange} onBlur={handleBlur} options={tierOptions} error={touched.tier ? errors.tier : ''} />
                        <SelectField label="Facing" name="facing" value={space.facing || ""} onChange={handleChange} onBlur={handleBlur} options={facingOptions} error={touched.facing ? errors.facing : ''} />
                        
                        <InputField label="Available From" name="availableFrom" type="date" value={space.availableFrom || ""} onChange={handleChange} onBlur={handleBlur} error={touched.availableFrom ? errors.availableFrom : ''} />
                        <InputField label="Available To" name="availableTo" type="date" value={space.availableTo || ""} onChange={handleChange} onBlur={handleBlur} error={touched.availableTo ? errors.availableTo : ''} />

                        <InputField label="Total Units" name="totalUnits" type="number" value={space.totalUnits ?? ""} onChange={handleChange} onBlur={handleBlur} placeholder="Total Units" error={touched.totalUnits ? errors.totalUnits : ''} />
                        <InputField label="Occupied Units" name="occupiedUnits" type="number" value={space.occupiedUnits ?? ""} onChange={handleChange} onBlur={handleBlur} placeholder="Occupied Units" error={touched.occupiedUnits ? errors.occupiedUnits : ''} />
                        
                        <InputField label="Facia Towards" name="faciaTowards" value={space.faciaTowards || ""} onChange={handleChange} onBlur={handleBlur} error={touched.faciaTowards ? errors.faciaTowards : ''} />
                        <InputField label="Tags" name="tags" value={space.tags || ""} onChange={handleChange} onBlur={handleBlur} error={touched.tags ? errors.tags : ''} />
                        <InputField label="Previous Brands" name="previousBrands" value={space.previousBrands || ""} onChange={handleChange} onBlur={handleBlur} error={touched.previousBrands ? errors.previousBrands : ''} />
                        <InputField label="Additional Tags" name="additionalTags" value={space.additionalTags || ""} onChange={handleChange} onBlur={handleBlur} error={touched.additionalTags ? errors.additionalTags : ''} />
                        
                        <TextareaField label="Description" name="description" value={space.description || ""} onChange={handleChange} onBlur={handleBlur} error={touched.description ? errors.description : ''} />

                        {/* Image Uploads */}
                        <div className="col-span-full mt-4">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Space Images</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                <FileUploadField label="Main Photo" name="mainPhoto" onChange={handleFileChange} currentImage={space.mainPhoto} onImageClick={setPreviewImageUrl} />
                                <FileUploadField label="Long Shot" name="longShot" onChange={handleFileChange} currentImage={space.longShot} onImageClick={setPreviewImageUrl} />
                                <FileUploadField label="Close Shot" name="closeShot" onChange={handleFileChange} currentImage={space.closeShot} onImageClick={setPreviewImageUrl} />
                                {/* TODO: Add component for otherPhotos array upload if needed */}
                            </div>
                        </div>

                    </div>

                    <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200">
                        <Button onClick={() => navigate(`/space/${id}`)} className="bg-gray-700 text-white">
                            Cancel
                        </Button>
                        <Button onClick={() => setShowDeleteModal(true)} className="bg-red-500 hover:bg-red-600">
                            Delete Space
                        </Button>
                        {/* Disable save button if any errors exist */}
                        <Button onClick={handleSave} className="bg-black ml-auto" disabled={Object.keys(errors).some(key => errors[key])}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </main>
            
            {/* Delete Confirmation Modal (From Code 2) */}
            {showDeleteModal && (
                <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fadeIn'>
                    <div className='bg-gray-100 p-6 rounded-2xl shadow-lg w-80 text-gray-800 transform transition-all duration-300 scale-95 hover:scale-100 animate-scaleIn'>
                        <h2 className='text-lg font-semibold mb-4'>Confirm Deletion</h2>
                        <p className='text-sm text-gray-600 mb-6'>
                            Are you sure you want to delete "{(space?.spaceName || 'this space')}"? This action cannot be undone.
                        </p>
                        <div className='flex justify-end gap-2 text-sm'>
                            <Button className='bg-gray-700 text-white' onClick={() => setShowDeleteModal(false)}>
                                Cancel
                            </Button>
                            <Button className='bg-red-500 hover:bg-red-600' onClick={handleDelete}>
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Image Preview Modal (From Code 2) */}
            <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />
        </div>
    );
}