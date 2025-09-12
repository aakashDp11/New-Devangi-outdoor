import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { toast } from "sonner";
import { useSidebar } from "../context/SidebarContext";
import Select from "react-select";
import { FaTimes, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

// Helper functions for date formatting
const toInputDate = (dateStr) => {
  if (!dateStr || dateStr.split('-').length !== 3) return "";
  const [day, month, year] = dateStr.split('-');
  // Handle both DD-MM-YYYY and YYYY-MM-DD
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

// Validation functions
const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return '';
};

const validateNumber = (value, fieldName, min = 0) => {
  if (!value) return '';
  const num = parseFloat(value);
  if (isNaN(num)) return `${fieldName} must be a valid number`;
  if (num < min) return `${fieldName} must be at least ${min}`;
  return '';
};

const validateEmail = (value) => {
  if (!value) return '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return 'Please enter a valid email address';
  return '';
};

// Image Preview Modal Component
const ImagePreviewModal = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] animate-fadeIn" 
      onClick={onClose}
    >
      <div 
        className="relative p-4 rounded-2xl shadow-2xl max-w-screen-lg max-h-screen-lg animate-scaleIn" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute -top-2 -right-2 text-white text-xl bg-red-500 hover:bg-red-600 rounded-full p-2 cursor-pointer transition-all duration-300 hover:scale-110 shadow-lg"
        >
          <FaTimes />
        </button>
        <img 
          src={imageUrl} 
          alt="Preview" 
          className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" 
        />
      </div>
    </div>
  );
};

// Multi-select component for Audience
function MultiAudienceSelect({ label, name, value, onChange, options, error }) {
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
    control: (provided, state) => ({
      ...provided,
      borderRadius: '16px',
      border: error ? '2px solid #ef4444' : state.isFocused ? '2px solid #3b82f6' : '2px solid #e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      padding: '4px 8px',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: error ? '#ef4444' : '#3b82f6',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#f1f5f9' : null,
      color: 'inherit',
      borderRadius: '8px',
      margin: '2px 8px',
      transition: 'all 0.2s ease',
      '&:active': { backgroundColor: '#e5e7eb' },
    }),
    multiValue: () => ({ display: 'none' }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
    }),
  };

  const handleChange = (selectedOptions) => {
    const newValues = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    onChange({ target: { name, value: newValues } });
  };

  const formatOptionLabel = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {label}
      {valueAsArray.includes(value) && <span className="text-green-500">✓</span>}
    </div>
  );

  return (
    <div className="flex flex-col gap-2 animate-slideInUp">
      <label htmlFor={name} className="font-semibold text-sm text-gray-700 transition-colors duration-300">
        {label}
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
        className="transition-all duration-300"
      />
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-xs animate-slideDown">
          <FaExclamationTriangle className="text-xs" />
          <span>{error}</span>
        </div>
      )}
      {valueAsArray.length > 0 && (
        <div className="flex flex-wrap gap-1 animate-fadeIn">
          {valueAsArray.map((item, index) => (
            <span
              key={index}
              className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium animate-scaleIn"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EditSpace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [space, setSpace] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({
    mainPhoto: null, longShot: null, closeShot: null, otherPhotos: [],
  });
  
  // State for image preview
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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

  // Validation function
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
        error = validateNumber(value, 'Price', 0);
        break;
      case 'footfall':
      case 'width':
      case 'height':
      case 'totalUnits':
      case 'occupiedUnits':
        error = validateNumber(value, name.charAt(0).toUpperCase() + name.slice(1), 0);
        break;
      case 'latitude':
        error = validateNumber(value, 'Latitude', -90) || (parseFloat(value) > 90 ? 'Latitude must be between -90 and 90' : '');
        break;
      case 'longitude':
        error = validateNumber(value, 'Longitude', -180) || (parseFloat(value) > 180 ? 'Longitude must be between -180 and 180' : '');
        break;
      case 'availableFrom':
      case 'availableTo':
        if (value && name === 'availableTo' && spaceData?.availableFrom) {
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

  // Update errors when field changes
  const updateFieldError = (name, value) => {
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  useEffect(() => {
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
      }
    };
    fetchSpace();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSpace((prev) => ({ ...prev, [name]: value }));
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate field
    updateFieldError(name, value);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    updateFieldError(name, value);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this space?")) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Space deleted successfully!");
        navigate("/");
      } else {
        toast.error("Failed to delete space.");
      }
    } catch (error) {
      toast.error("An error occurred while deleting.");
    }
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
    // Validate all fields before saving
    const newErrors = {};
    Object.keys(space || {}).forEach(key => {
      const error = validateField(key, space[key]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    setTouched(Object.keys(space || {}).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    if (Object.keys(newErrors).some(key => newErrors[key])) {
      return; // Don't save if there are errors
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
      if (selectedFiles.otherPhotos.length > 0) {
        selectedFiles.otherPhotos.forEach((photo) => formData.append("otherPhotos", photo));
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${id}`, {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        toast.success("Space updated successfully!");
        navigate(`/space/${id}`);
      } else {
        const err = await response.json();
        console.error("Full Update Error Response:", err);
        toast.error(`Failed to update space: ${err.details || err.message || 'Internal Server Error'}`);
      }
    } catch (error) {
      console.error("Catch Block Error:", error);
      toast.error("An error occurred. Check the console for details.");
    }
  };

  if (!space) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg font-semibold text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-xs h-full w-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-black flex flex-col lg:flex-row">
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0; 
            transform: scale(0.9); 
          }
          to { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideInUp { animation: slideInUp 0.4s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
        .animate-pulse-custom { animation: pulse 2s infinite; }
      `}</style>
      
      <Navbar />
      <main className={`flex-1 overflow-y-auto px-4 md:px-8 py-6 transition-all duration-300 ${isCollapsed ? "lg:ml-24" : "lg:ml-64"}`}>
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl backdrop-blur-sm border border-white/20 animate-slideInUp">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b-2 border-gradient-to-r from-blue-500 to-purple-500">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold animate-pulse-custom">
              ✎
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Edit Space
            </h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <EnhancedInputField 
              label="Space Name" 
              name="spaceName" 
              value={space.spaceName || ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              error={touched.spaceName ? errors.spaceName : ''}
              required
            />
            <EnhancedInputField 
              label="Landlord" 
              name="landlord" 
              value={space.landlord || ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              error={touched.landlord ? errors.landlord : ''}
              required
            />
            <EnhancedInputField 
              label="Inventory Owner (Organization)" 
              name="organization" 
              value={space.organization || ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              error={touched.organization ? errors.organization : ''}
              required
            />
            <EnhancedInputField 
              label="Peer Media Owner" 
              name="peerMediaOwner" 
              value={space.peerMediaOwner || ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              error={touched.peerMediaOwner ? errors.peerMediaOwner : ''}
            />
            <EnhancedSelectField 
              label="Ownership Type" 
              name="ownershipType" 
              value={space.ownershipType || ""} 
              onChange={handleChange} 
              options={ownershipOptions}
              error={touched.ownershipType ? errors.ownershipType : ''}
            />
            <EnhancedSelectField 
              label="Space Type" 
              name="spaceType" 
              value={space.spaceType || ""} 
              onChange={handleChange} 
              options={spaceTypeOptions}
              error={touched.spaceType ? errors.spaceType : ''}
            />
            
            {space.spaceType === 'Transit' && (
              <>
                <EnhancedSelectField 
                  label="Transit Type" 
                  name="transitType" 
                  value={space.transitType || ""} 
                  onChange={handleChange} 
                  options={transitTypeOptions}
                  error={touched.transitType ? errors.transitType : ''}
                />
                <EnhancedSelectField 
                  label="Transit Line" 
                  name="transitLine" 
                  value={space.transitLine || ""} 
                  onChange={handleChange} 
                  options={transitLineOptions}
                  error={touched.transitLine ? errors.transitLine : ''}
                />
              </>
            )}

            <EnhancedSelectField 
              label="Category" 
              name="category" 
              value={space.category || ""} 
              onChange={handleChange} 
              options={categoryOptions}
              error={touched.category ? errors.category : ''}
            />
            <EnhancedSelectField 
              label="Specification" 
              name="specification" 
              value={space.specification || ""} 
              onChange={handleChange} 
              options={specificationOptions}
              error={touched.specification ? errors.specification : ''}
            />
            <EnhancedSelectField 
              label="Media Type" 
              name="mediaType" 
              value={space.mediaType || ""} 
              onChange={handleChange} 
              options={mediaTypeOptions}
              error={touched.mediaType ? errors.mediaType : ''}
            />
            
            {/* Conditional rendering for Illumination */}
            {space.spaceType !== 'DOOH' && (
              <EnhancedSelectField 
                label="Illumination" 
                name="illumination" 
                value={space.illumination || ""} 
                onChange={handleChange} 
                options={illuminationOptions}
                error={touched.illumination ? errors.illumination : ''}
              />
            )}
            
            {space.spaceType === 'BQS' || space.spaceType === 'DigitalBQS' || space.spaceType === 'Transit' ? (
              <>
                <EnhancedInputField 
                  label="Buying Price" 
                  name="buyingPrice" 
                  type="number" 
                  value={space.buyingPrice || ""} 
                  onChange={handleChange} 
                  onBlur={handleBlur}
                  error={touched.buyingPrice ? errors.buyingPrice : ''}
                />
              </>
            ) : (
              <EnhancedInputField 
                label="Price" 
                name="price" 
                type="number" 
                value={space.price || ""} 
                onChange={handleChange} 
                onBlur={handleBlur}
                error={touched.price ? errors.price : ''}
              />
            )}

            <EnhancedInputField 
              label="Footfall" 
              name="footfall" 
              type="number" 
              value={space.footfall || ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              error={touched.footfall ? errors.footfall : ''}
            />
            <MultiAudienceSelect 
              label="Audience" 
              name="audience" 
              value={space.audience || []} 
              onChange={handleChange} 
              options={audienceOptions}
              error={touched.audience ? errors.audience : ''}
            />
            <EnhancedSelectField 
              label="Demographics" 
              name="demographics" 
              value={space.demographics || ""} 
              onChange={handleChange} 
              options={demographicsOptions}
              error={touched.demographics ? errors.demographics : ''}
            />
            <EnhancedInputField 
              label="Width (ft)" 
              name="width" 
              type="number" 
              value={space.width || ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              error={touched.width ? errors.width : ''}
            />
            <EnhancedInputField 
              label="Height (ft)" 
              name="height" 
              type="number" 
              value={space.height || ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              error={touched.height ? errors.height : ''}
            />
            <EnhancedInputField 
              label="Address" 
              name="address" 
              value={space.address || ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              error={touched.address ? errors.address : ''}
            />
            <EnhancedInputField 
              label="City" 
              name="city" 
              value={space.city || ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              error={touched.city ? errors.city : ''}
            />
            <EnhancedInputField 
              label="State" 
              name="state" 
              value={space.state || ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              error={touched.state ? errors.state : ''}
            />
            <EnhancedInputField 
              label="Latitude" 
              name="latitude" 
              value={space.latitude || ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              error={touched.latitude ? errors.latitude : ''}
            />
            <EnhancedInputField 
              label="Longitude" 
              name="longitude" 
              value={space.longitude || ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              error={touched.longitude ? errors.longitude : ''}
            />
            <EnhancedInputField 
              label="Zone" 
              name="zone" 
              value={space.zone || ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              error={touched.zone ? errors.zone : ''}
            />
            <EnhancedSelectField 
              label="Tier" 
              name="tier" 
              value={space.tier || ""} 
              onChange={handleChange} 
              options={tierOptions}
              error={touched.tier ? errors.tier : ''}
            />
            <EnhancedSelectField 
              label="Facing" 
              name="facing" 
              value={space.facing || ""} 
              onChange={handleChange} 
              options={facingOptions}
              error={touched.facing ? errors.facing : ''}
            />
            <EnhancedInputField 
              label="Available From" 
              name="availableFrom" 
              type="date" 
              value={space.availableFrom || ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              error={touched.availableFrom ? errors.availableFrom : ''}
            />
            <EnhancedInputField 
              label="Available To" 
              name="availableTo" 
              type="date" 
              value={space.availableTo || ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              error={touched.availableTo ? errors.availableTo : ''}
            />
            <EnhancedInputField 
              label="Total Units" 
              name="totalUnits" 
              type="number" 
              value={space.totalUnits ?? ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="Total Units"
              error={touched.totalUnits ? errors.totalUnits : ''}
            />
            <EnhancedInputField 
              label="Occupied Units" 
              name="occupiedUnits" 
              type="number" 
              value={space.occupiedUnits ?? ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="Occupied Units"
              error={touched.occupiedUnits ? errors.occupiedUnits : ''}
            />
            <EnhancedInputField 
              label="Facia Towards" 
              name="faciaTowards" 
              value={space.faciaTowards || ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              error={touched.faciaTowards ? errors.faciaTowards : ''}
            />
            <EnhancedInputField 
              label="Tags" 
              name="tags" 
              value={space.tags || ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              error={touched.tags ? errors.tags : ''}
            />
            <EnhancedInputField 
              label="Previous Brands" 
              name="previousBrands" 
              value={space.previousBrands || ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              error={touched.previousBrands ? errors.previousBrands : ''}
            />
            <EnhancedInputField 
              label="Additional Tags" 
              name="additionalTags" 
              value={space.additionalTags || ""} 
              onChange={handleChange} 
              onBlur={handleBlur}
              error={touched.additionalTags ? errors.additionalTags : ''}
            />
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <EnhancedTextareaField 
                label="Description" 
                name="description" 
                value={space.description || ""} 
                onChange={handleChange} 
                onBlur={handleBlur}
                error={touched.description ? errors.description : ''}
              />
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              <EnhancedFileUploadField 
                label="Main Photo" 
                name="mainPhoto" 
                onChange={handleFileChange} 
                currentImage={space.mainPhoto} 
                onImageClick={setPreviewImageUrl} 
              />
              <EnhancedFileUploadField 
                label="Long Shot" 
                name="longShot" 
                onChange={handleFileChange} 
                currentImage={space.longShot} 
                onImageClick={setPreviewImageUrl} 
              />
              <EnhancedFileUploadField 
                label="Close Shot" 
                name="closeShot" 
                onChange={handleFileChange} 
                currentImage={space.closeShot} 
                onImageClick={setPreviewImageUrl} 
              />
            </div>
          </div>
          
          <div className="mt-10 flex flex-wrap gap-4 pt-8 border-t border-gray-200">
            <button 
              onClick={() => navigate(`/space/${id}`)} 
              className="bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
            >
              Cancel
            </button>
            <button 
              onClick={handleDelete} 
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
            >
              Delete Space
            </button>
            <button 
              onClick={handleSave} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 ml-auto text-white px-8 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={Object.keys(errors).some(key => errors[key])}
            >
              Save Changes
            </button>
          </div>
        </div>
      </main>
      
      {/* Image Preview Modal */}
      <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />
    </div>
  );
}

// Enhanced Input Field Component
const EnhancedInputField = ({ label, name, value, onChange, onBlur, placeholder, type = "text", error, required }) => (
  <div className="flex flex-col gap-2 animate-slideInUp">
    <label htmlFor={name} className="font-semibold text-sm text-gray-700 transition-colors duration-300">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <input 
        id={name} 
        name={name} 
        type={type} 
        value={value} 
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder} 
        className={`
          w-full px-4 py-3 rounded-2xl border-2 transition-all duration-300 
          focus:outline-none focus:ring-0 bg-white/70 backdrop-blur-sm
          ${error 
            ? 'border-red-400 focus:border-red-500 bg-red-50/50' 
            : 'border-gray-200 focus:border-blue-400 hover:border-blue-300'
          }
          focus:shadow-lg hover:shadow-md hover:-translate-y-1
          placeholder-gray-400 font-medium
        `}
      />
      {!error && value && (
        <FaCheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 animate-scaleIn" />
      )}
    </div>
    {error && (
      <div className="flex items-center gap-2 text-red-500 text-xs animate-slideDown">
        <FaExclamationTriangle className="text-xs" />
        <span>{error}</span>
      </div>
    )}
  </div>
);

// Enhanced Select Field Component
const EnhancedSelectField = ({ label, name, value, onChange, options, placeholder = "Select...", error, required }) => (
  <div className="flex flex-col gap-2 animate-slideInUp">
    <label htmlFor={name} className="font-semibold text-sm text-gray-700 transition-colors duration-300">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <select 
        id={name} 
        name={name} 
        value={value} 
        onChange={onChange} 
        className={`
          w-full px-4 py-3 rounded-2xl border-2 transition-all duration-300 
          focus:outline-none focus:ring-0 bg-white/70 backdrop-blur-sm appearance-none
          ${error 
            ? 'border-red-400 focus:border-red-500 bg-red-50/50' 
            : 'border-gray-200 focus:border-blue-400 hover:border-blue-300'
          }
          focus:shadow-lg hover:shadow-md hover:-translate-y-1
          font-medium cursor-pointer
        `}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        {!error && value ? (
          <FaCheckCircle className="text-green-500 animate-scaleIn" />
        ) : (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
    </div>
    {error && (
      <div className="flex items-center gap-2 text-red-500 text-xs animate-slideDown">
        <FaExclamationTriangle className="text-xs" />
        <span>{error}</span>
      </div>
    )}
  </div>
);

// Enhanced Textarea Field Component
const EnhancedTextareaField = ({ label, name, value, onChange, onBlur, placeholder, rows = 4, error, required }) => (
  <div className="flex flex-col gap-2 animate-slideInUp">
    <label htmlFor={name} className="font-semibold text-sm text-gray-700 transition-colors duration-300">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <textarea 
        id={name} 
        name={name} 
        value={value} 
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder} 
        rows={rows} 
        className={`
          w-full px-4 py-3 rounded-2xl border-2 transition-all duration-300 
          focus:outline-none focus:ring-0 bg-white/70 backdrop-blur-sm resize-none
          ${error 
            ? 'border-red-400 focus:border-red-500 bg-red-50/50' 
            : 'border-gray-200 focus:border-blue-400 hover:border-blue-300'
          }
          focus:shadow-lg hover:shadow-md hover:-translate-y-1
          placeholder-gray-400 font-medium
        `}
      />
      {!error && value && (
        <FaCheckCircle className="absolute right-3 top-3 text-green-500 animate-scaleIn" />
      )}
    </div>
    {error && (
      <div className="flex items-center gap-2 text-red-500 text-xs animate-slideDown">
        <FaExclamationTriangle className="text-xs" />
        <span>{error}</span>
      </div>
    )}
  </div>
);

// Enhanced File Upload Field Component
const EnhancedFileUploadField = ({ label, name, onChange, currentImage, onImageClick }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
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

  const handleImageClick = (imageUrl) => {
    if (imageUrl) {
      onImageClick(imageUrl);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const url = URL.createObjectURL(files[0]);
      setPreviewUrl(url);
      // Create a synthetic event for onChange
      onChange({
        target: {
          name: name,
          files: [files[0]]
        }
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 animate-slideInUp">
      <label className="font-semibold text-sm text-gray-700">{label}</label>
      
      <div 
        className={`
          relative rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden
          ${isDragging ? 'border-blue-400 bg-blue-50/50' : 'border-gray-300 hover:border-blue-400'}
          ${previewUrl || currentImage ? 'p-0' : 'p-6'}
          hover:shadow-lg hover:-translate-y-1
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <div className="relative group">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-48 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105" 
              onClick={() => handleImageClick(previewUrl)}
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="text-white font-semibold">Click to preview</span>
            </div>
          </div>
        ) : currentImage ? (
          <div className="relative group">
            <img 
              src={currentImage} 
              alt={label} 
              className="w-full h-48 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105" 
              onClick={() => handleImageClick(currentImage)}
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="text-white font-semibold">Click to preview</span>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="text-gray-600 font-medium mb-2">
              Drag & drop an image here
            </div>
            <div className="text-gray-400 text-xs">or click to browse</div>
          </div>
        )}
      </div>
      
      <input 
        type="file" 
        name={name} 
        onChange={handleFileChange} 
        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-purple-500 file:text-white hover:file:from-blue-600 hover:file:to-purple-600 file:transition-all file:duration-300 file:cursor-pointer" 
        accept="image/*"
      />
    </div>
  );
};