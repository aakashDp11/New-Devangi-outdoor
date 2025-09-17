import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { toast } from "sonner";
import { useSidebar } from "../context/SidebarContext";
import Select from "react-select";
import { FaArrowLeft, FaExclamationTriangle, FaCheckCircle, FaTimes } from 'react-icons/fa';

// --- REUSABLE UI COMPONENTS (COPIED FROM SpaceDetails.jsx) ---
// In a real application, these components would be in a shared 'components' directory.

// Card component with a flowing gradient animation on the background
const Card = ({ children, className = '', ...props }) => (
    <div
        className={`
      bg-gray-100 bg-opacity-80 shadow-xl rounded-2xl w-full flex flex-col relative overflow-hidden
      ${className}
    `}
        {...props}
    >
        <div className='absolute inset-0 bg-gradient-to-br from-white via-indigo-50 to-purple-50 opacity-20 animate-bg-gradient-flow-diagonal z-0'></div>
        <div className='relative z-10 h-full flex flex-col'>{children}</div>
    </div>
);

// CardContent component for consistent padding and layout
const CardContent = ({ children, className = '' }) => (
    <div className={`p-4 md:p-6 flex-grow flex flex-col ${className}`}>
        {children}
    </div>
);

// Button component with consistent styling and loading state
const Button = ({ children, className = '', disabled = false, loading = false, ...props }) => (
    <button
        className={`px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-medium transition-all duration-200 transform hover:scale-105 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg ${className}`}
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

// Input component with a more polished look and error handling
const Input = ({ className = '', error = null, ...props }) => (
    <div className='relative'>
        <input
            className={`border ${
                error ? 'border-red-300' : 'border-gray-200'
            } px-4 py-2 rounded-xl w-full bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
            {...props}
        />
        {error && (
            <p className='absolute -bottom-5 left-0 text-red-500 text-xs mt-1 animate-slideDown'>
                {error}
            </p>
        )}
    </div>
);

// New Image Preview Modal Component (extracted for reusability)
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

// New form field wrappers for consistent styling and validation display
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

// --- HELPER FUNCTIONS ---
const toInputDate = (dateStr) => {
    if (!dateStr || dateStr.split('-').length !== 3) return "";
    const [day, month, year] = dateStr.split('-');
    if (year.length === 4) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return `20${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const toDisplayDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
};

const validateRequired = (value, fieldName) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
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


// Custom Multi-select for Audience
function MultiAudienceSelect({ label, name, value, onChange, options, error, required }) {
    const valueAsArray = Array.isArray(value) ? value : [];
    const selectedValueObjects = options.filter(option => valueAsArray.includes(option.value));

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            borderRadius: '1rem', // 16px
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

// Re-styled File Upload Component
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
                    <div className="h-32 flex items-center justify-center p-4 text-center text-sm text-[var(--color-muted)] bg-gray-50 hover:bg-gray-100 transition-colors">
                        Click or drag to upload image
                    </div>
                )}
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

    // Options arrays
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

    const validateField = (name, value, spaceData = space) => {
        let error = '';
        switch (name) {
            case 'spaceName':
            case 'landlord':
            case 'organization':
                error = validateRequired(value, name.charAt(0).toUpperCase() + name.slice(1));
                break;
            case 'price':
            case 'buyingPrice':
                error = validateNumber(value, 'Price');
                break;
            case 'footfall':
            case 'width':
            case 'height':
            case 'totalUnits':
            case 'occupiedUnits':
                error = validateNumber(value, name.charAt(0).toUpperCase() + name.slice(1));
                break;
            case 'latitude':
                error = validateNumber(value, 'Latitude', -90) || (parseFloat(value) > 90 ? 'Latitude must be between -90 and 90' : '');
                break;
            case 'longitude':
                error = validateNumber(value, 'Longitude', -180) || (parseFloat(value) > 180 ? 'Longitude must be between -180 and 180' : '');
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
    };

    const fetchSpace = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${id}`);
            const data = await response.json();
            const audienceAsArray = Array.isArray(data.audience) ? data.audience : (data.audience ? data.audience.toString().split(',') : []);
            const transformedData = {
                ...data,
                audience: audienceAsArray.map(item => item.trim()).filter(Boolean),
                totalUnits: data.unit,
                availableFrom: toInputDate(data.dates?.[0]),
                availableTo: toInputDate(data.dates?.[1]),
            };
            setSpace(transformedData);
        } catch (error) {
            console.error("Error fetching space:", error);
            toast.error("Could not load space details.");
        }
    };

    useEffect(() => {
        fetchSpace();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newSpace = { ...space, [name]: value };
        setSpace(newSpace);
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value, newSpace) }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value, space) }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (name === "otherPhotos") {
            setSelectedFiles((prev) => ({ ...prev, otherPhotos: Array.from(files) }));
        } else {
            setSelectedFiles((prev) => ({ ...prev, [name]: files[0] }));
        }
    };

    const handleSave = async () => {
        const newErrors = {};
        Object.keys(space || {}).forEach(key => {
            const error = validateField(key, space[key]);
            if (error) newErrors[key] = error;
        });

        setErrors(newErrors);
        setTouched(Object.keys(space || {}).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

        if (Object.keys(newErrors).some(key => newErrors[key])) {
            toast.error("Please fix the form errors before saving.");
            return;
        }

        try {
            const { availableFrom, availableTo, totalUnits, _id, __v, createdAt, updatedAt, ...restOfSpace } = space;
            const payload = {
                ...restOfSpace,
                unit: totalUnits,
                dates: [toDisplayDate(availableFrom), toDisplayDate(availableTo)],
            };
            
            const formData = new FormData();
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
            toast.error("An error occurred. Check the console for details.");
        }
    };
    
    // Deletion Modal logic from SpaceDetails
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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-[var(--color-text)] flex flex-col lg:flex-row overflow-hidden">
                <Navbar />
                <main className={`flex-1 flex items-center justify-center p-6 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
                    <div className='flex flex-col items-center gap-3 animate-pulse'>
                        <div className='w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin'></div>
                        <div className='text-[var(--color-muted)] text-sm'>
                            Loading space details...
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-[var(--color-text)] flex flex-col lg:flex-row overflow-hidden'>
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
            <Navbar />
            <main className={`flex-1 overflow-y-auto px-4 md:px-6 py-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
                <div className="flex justify-between items-center mb-6 animate-slideDown">
                    <Button onClick={() => navigate(-1)} className="text-white">
                        <FaArrowLeft className="inline mr-2" /> Back
                    </Button>
                </div>

                <div className='p-6 md:p-8 rounded-2xl shadow-xl animate-slideUp bg-white border border-gray-200'>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-6 pb-4 border-b border-gray-200">
                        Edit {space.spaceName ?? 'Space'}
                    </h1>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
                        {/* Form Fields using the new FormField wrapper */}
                        <FormField label="Space Name" name="spaceName" required error={touched.spaceName ? errors.spaceName : ''}>
                            <Input name="spaceName" value={space.spaceName || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>

                        <FormField label="Landlord" name="landlord" required error={touched.landlord ? errors.landlord : ''}>
                            <Input name="landlord" value={space.landlord || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>
                        
                        <FormField label="Inventory Owner (Organization)" name="organization" required error={touched.organization ? errors.organization : ''}>
                            <Input name="organization" value={space.organization || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>

                        <FormField label="Peer Media Owner" name="peerMediaOwner" error={touched.peerMediaOwner ? errors.peerMediaOwner : ''}>
                            <Input name="peerMediaOwner" value={space.peerMediaOwner || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>

                        {/* Using standard select with the FormField wrapper */}
                        <FormField label="Ownership Type" name="ownershipType" error={touched.ownershipType ? errors.ownershipType : ''}>
                            <select 
                                name="ownershipType" 
                                value={space.ownershipType || ""} 
                                onChange={handleChange}
                                className="border border-gray-200 px-4 py-2 rounded-xl w-full bg-white focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <option value="">Select...</option>
                                {ownershipOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>
                        
                        <FormField label="Space Type" name="spaceType" error={touched.spaceType ? errors.spaceType : ''}>
                            <select 
                                name="spaceType" 
                                value={space.spaceType || ""} 
                                onChange={handleChange} 
                                className="border border-gray-200 px-4 py-2 rounded-xl w-full bg-white focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <option value="">Select...</option>
                                {spaceTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>

                        {/* Conditional fields */}
                        {space.spaceType === 'Transit' && (
                            <>
                                <FormField label="Transit Type" name="transitType" error={touched.transitType ? errors.transitType : ''}>
                                    <select name="transitType" value={space.transitType || ""} onChange={handleChange} className="border border-gray-200 px-4 py-2 rounded-xl w-full bg-white focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md">
                                        <option value="">Select...</option>
                                        {transitTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </FormField>
                                <FormField label="Transit Line" name="transitLine" error={touched.transitLine ? errors.transitLine : ''}>
                                    <select name="transitLine" value={space.transitLine || ""} onChange={handleChange} className="border border-gray-200 px-4 py-2 rounded-xl w-full bg-white focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md">
                                        <option value="">Select...</option>
                                        {transitLineOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </FormField>
                            </>
                        )}

                        <FormField label="Category" name="category" error={touched.category ? errors.category : ''}>
                            <select name="category" value={space.category || ""} onChange={handleChange} className="border border-gray-200 px-4 py-2 rounded-xl w-full bg-white focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md">
                                <option value="">Select...</option>
                                {categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>
                        
                        <FormField label="Specification" name="specification" error={touched.specification ? errors.specification : ''}>
                            <select name="specification" value={space.specification || ""} onChange={handleChange} className="border border-gray-200 px-4 py-2 rounded-xl w-full bg-white focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md">
                                <option value="">Select...</option>
                                {specificationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>

                        <FormField label="Media Type" name="mediaType" error={touched.mediaType ? errors.mediaType : ''}>
                            <select name="mediaType" value={space.mediaType || ""} onChange={handleChange} className="border border-gray-200 px-4 py-2 rounded-xl w-full bg-white focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md">
                                <option value="">Select...</option>
                                {mediaTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>
                        
                        {space.spaceType !== 'DOOH' && (
                            <FormField label="Illumination" name="illumination" error={touched.illumination ? errors.illumination : ''}>
                                <select name="illumination" value={space.illumination || ""} onChange={handleChange} className="border border-gray-200 px-4 py-2 rounded-xl w-full bg-white focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md">
                                    <option value="">Select...</option>
                                    {illuminationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </FormField>
                        )}
                        
                        <FormField label={space.spaceType === 'BQS' || space.spaceType === 'DigitalBQS' || space.spaceType === 'Transit' ? "Buying Price" : "Price"} name={space.spaceType === 'BQS' || space.spaceType === 'DigitalBQS' || space.spaceType === 'Transit' ? "buyingPrice" : "price"} error={touched.price ? errors.price : ''}>
                            <Input type="number" name={space.spaceType === 'BQS' || space.spaceType === 'DigitalBQS' || space.spaceType === 'Transit' ? "buyingPrice" : "price"} value={space.price || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>
                        
                        <FormField label="Footfall" name="footfall" error={touched.footfall ? errors.footfall : ''}>
                            <Input type="number" name="footfall" value={space.footfall || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>

                        <MultiAudienceSelect 
                            label="Audience" 
                            name="audience" 
                            value={space.audience || []} 
                            onChange={handleChange} 
                            options={audienceOptions}
                            error={touched.audience ? errors.audience : ''}
                        />

                        <FormField label="Demographics" name="demographics" error={touched.demographics ? errors.demographics : ''}>
                            <select name="demographics" value={space.demographics || ""} onChange={handleChange} className="border border-gray-200 px-4 py-2 rounded-xl w-full bg-white focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md">
                                <option value="">Select...</option>
                                {demographicsOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>
                        
                        <FormField label="Width (ft)" name="width" error={touched.width ? errors.width : ''}>
                            <Input type="number" name="width" value={space.width || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>
                        
                        <FormField label="Height (ft)" name="height" error={touched.height ? errors.height : ''}>
                            <Input type="number" name="height" value={space.height || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>

                        <FormField label="Address" name="address" error={touched.address ? errors.address : ''}>
                            <Input name="address" value={space.address || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>
                        
                        <FormField label="City" name="city" error={touched.city ? errors.city : ''}>
                            <Input name="city" value={space.city || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>
                        
                        <FormField label="State" name="state" error={touched.state ? errors.state : ''}>
                            <Input name="state" value={space.state || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>
                        
                        <FormField label="Latitude" name="latitude" error={touched.latitude ? errors.latitude : ''}>
                            <Input name="latitude" value={space.latitude || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>
                        
                        <FormField label="Longitude" name="longitude" error={touched.longitude ? errors.longitude : ''}>
                            <Input name="longitude" value={space.longitude || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>
                        
                        <FormField label="Zone" name="zone" error={touched.zone ? errors.zone : ''}>
                            <Input name="zone" value={space.zone || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>
                        
                        <FormField label="Tier" name="tier" error={touched.tier ? errors.tier : ''}>
                            <select name="tier" value={space.tier || ""} onChange={handleChange} className="border border-gray-200 px-4 py-2 rounded-xl w-full bg-white focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md">
                                <option value="">Select...</option>
                                {tierOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>

                        <FormField label="Facing" name="facing" error={touched.facing ? errors.facing : ''}>
                            <select name="facing" value={space.facing || ""} onChange={handleChange} className="border border-gray-200 px-4 py-2 rounded-xl w-full bg-white focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md">
                                <option value="">Select...</option>
                                {facingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </FormField>
                        
                        <FormField label="Available From" name="availableFrom" error={touched.availableFrom ? errors.availableFrom : ''}>
                            <Input type="date" name="availableFrom" value={space.availableFrom || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>
                        
                        <FormField label="Available To" name="availableTo" error={touched.availableTo ? errors.availableTo : ''}>
                            <Input type="date" name="availableTo" value={space.availableTo || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>

                        <FormField label="Total Units" name="totalUnits" error={touched.totalUnits ? errors.totalUnits : ''}>
                            <Input type="number" name="totalUnits" value={space.totalUnits ?? ""} onChange={handleChange} onBlur={handleBlur} placeholder="Total Units" />
                        </FormField>

                        <FormField label="Occupied Units" name="occupiedUnits" error={touched.occupiedUnits ? errors.occupiedUnits : ''}>
                            <Input type="number" name="occupiedUnits" value={space.occupiedUnits ?? ""} onChange={handleChange} onBlur={handleBlur} placeholder="Occupied Units" />
                        </FormField>
                        
                        <FormField label="Facia Towards" name="faciaTowards" error={touched.faciaTowards ? errors.faciaTowards : ''}>
                            <Input name="faciaTowards" value={space.faciaTowards || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>
                        
                        <FormField label="Tags" name="tags" error={touched.tags ? errors.tags : ''}>
                            <Input name="tags" value={space.tags || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>
                        
                        <FormField label="Previous Brands" name="previousBrands" error={touched.previousBrands ? errors.previousBrands : ''}>
                            <Input name="previousBrands" value={space.previousBrands || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>
                        
                        <FormField label="Additional Tags" name="additionalTags" error={touched.additionalTags ? errors.additionalTags : ''}>
                            <Input name="additionalTags" value={space.additionalTags || ""} onChange={handleChange} onBlur={handleBlur} />
                        </FormField>
                        
                        <div className="col-span-full">
                            <FormField label="Description" name="description" error={touched.description ? errors.description : ''}>
                                <textarea 
                                    name="description" 
                                    value={space.description || ""} 
                                    onChange={handleChange} 
                                    onBlur={handleBlur} 
                                    rows="4"
                                    className="border border-gray-200 px-4 py-2 rounded-xl w-full bg-white focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md resize-none"
                                />
                            </FormField>
                        </div>
                        
                        {/* Image Uploads */}
                        <div className="col-span-full mt-4">
                            <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">Space Images</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                <FileUploadField label="Main Photo" name="mainPhoto" onChange={handleFileChange} currentImage={space.mainPhoto} onImageClick={setPreviewImageUrl} />
                                <FileUploadField label="Long Shot" name="longShot" onChange={handleFileChange} currentImage={space.longShot} onImageClick={setPreviewImageUrl} />
                                <FileUploadField label="Close Shot" name="closeShot" onChange={handleFileChange} currentImage={space.closeShot} onImageClick={setPreviewImageUrl} />
                                {/* Additional images can be added here */}
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
                        <Button onClick={handleSave} className="bg-[var(--color-primary)] ml-auto" disabled={Object.keys(errors).some(key => errors[key])}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </main>
            
            {showDeleteModal && (
                <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fadeIn'>
                    <div className='bg-gray-100 p-6 rounded-2xl shadow-lg w-80 text-[var(--color-text)] transform transition-all duration-300 scale-95 hover:scale-100 animate-scaleIn'>
                        <h2 className='text-lg font-semibold mb-4'>Confirm Deletion</h2>
                        <p className='text-sm text-[var(--color-muted)] mb-6'>
                            Are you sure you want to delete "{space.spaceName || 'this space'}"? This action cannot be undone.
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
            
            <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />
        </div>
    );
}