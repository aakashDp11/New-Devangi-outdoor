import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { toast } from "sonner";
import { useSidebar } from "../context/SidebarContext";
import Select from "react-select";

// ... (Helper functions and MultiSelectField component remain the same)
const toInputDate = (dateStr) => {
  if (!dateStr || dateStr.split('-').length !== 3) return "";
  const [day, month, year] = dateStr.split('-');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const toDisplayDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
};

const MultiSelectField = ({ label, name, value, onChange, options }) => {
  const valueAsArray = Array.isArray(value) ? value : [];
  const optionObjects = options.map(opt => ({ value: opt, label: opt }));
  const selectedValueObjects = optionObjects.filter(opt => valueAsArray.includes(opt.value));
  const customStyles = {
    option: (provided, state) => ({ ...provided, backgroundColor: state.isSelected ? '#dcfce7' : state.isFocused ? '#f1f5f9' : null, color: state.isSelected ? '#166534' : 'inherit', '&:active': { backgroundColor: state.isSelected ? '#bbf7d0' : '#e5e7eb' } }),
    multiValue: () => ({ display: 'none' }),
  };
  const handleChange = (selectedOptions) => {
    const newValues = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    onChange({ target: { name, value: newValues } });
  };
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="font-medium text-sm text-gray-700">{label}</label>
      <Select isMulti name={name} options={optionObjects} value={selectedValueObjects} onChange={handleChange} styles={customStyles} hideSelectedOptions={false} closeMenuOnSelect={false} placeholder="Select one or more..." className="border-gray-300 rounded w-full" theme={(theme) => ({ ...theme, colors: { ...theme.colors, primary: '#3b82f6', primary25: '#eff6ff' } })} />
    </div>
  );
};


export default function EditSpace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [space, setSpace] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({
    mainPhoto: null, longShot: null, closeShot: null, otherPhotos: [],
  });

  const ownershipOptions = ["Owned", "Leased", "Traded"];
  const illuminationOptions = ["Front Lit", "Back Lit", "Non Lit"];
  const specificationOptions = ["LHS", "RHS"];
  const spaceTypeOptions = ["Billboard", "DOOH", "Pole Kiosk", "Gantry"];
  const categoryOptions = ["Retail", "Transit"];
  const mediaTypeOptions = ["Static", "Digital"];
  const audienceOptions = [
    "Youth", "Working Professionals", "Business Professional", "College Students", "Elite", "Families",
    "Fashion Enthusiast", "Female focused", "Government official", "Male focused", "Middle class",
    "Rural", "Students", "Tourists", "Working",
  ];
  const demographicsOptions = ["Urban", "Rural"];
  const tierOptions = ["Tier 1", "Tier 2"];
  const facingOptions = ["Single facing", "Double facing"];

  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${id}`);
        const data = await response.json();
        const audienceAsArray = Array.isArray(data.audience) ? data.audience : (data.audience ? data.audience.split(',') : []);
        const transformedData = {
          ...data,
          audience: audienceAsArray,
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
    try {
      const {
        availableFrom, availableTo, totalUnits, mainPhoto, longShot, closeShot, otherPhotos, _id, __v,
        ...restOfSpace
      } = space;

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
            // --- FIX START: Handle 'audience' array specifically ---
            if (key === 'audience') {
              // The backend expects 'audience' as a single comma-separated string.
              formData.append(key, value.join(','));
            } else {
              // Other arrays (like 'dates') should be appended individually.
              value.forEach(item => {
                if (item !== null && item !== undefined) {
                  formData.append(key, item);
                }
              });
            }
            // --- FIX END ---
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
        toast.error(`Failed to update space: ${err.message || 'Internal Server Error'}`);
      }
    } catch (error) {
      console.error("Catch Block Error:", error);
      toast.error("An error occurred. Check the console for details.");
    }
  };

  if (!space) {
    return <div className="flex items-center justify-center h-screen bg-gray-50"><div>Loading...</div></div>;
  }

  return (
    <div className="min-h-screen text-xs h-full w-screen bg-gray-50 text-black flex flex-col lg:flex-row">
      <Navbar />
      <main className={`flex-1 overflow-y-auto px-4 md:px-8 py-6 transition-all duration-300 ${isCollapsed ? "lg:ml-24" : "lg:ml-64"}`}>
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold mb-6 border-b pb-4">Edit Space</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField label="Space Name" name="spaceName" value={space.spaceName || ""} onChange={handleChange} />
            <InputField label="Landlord" name="landlord" value={space.landlord || ""} onChange={handleChange} />
            <InputField label="Inventory Owner (Organization)" name="organization" value={space.organization || ""} onChange={handleChange} />
            <InputField label="Peer Media Owner" name="peerMediaOwner" value={space.peerMediaOwner || ""} onChange={handleChange} />
            <SelectField label="Ownership Type" name="ownershipType" value={space.ownershipType || ""} onChange={handleChange} options={ownershipOptions} />
            <SelectField label="Space Type" name="spaceType" value={space.spaceType || ""} onChange={handleChange} options={spaceTypeOptions} />
            <SelectField label="Category" name="category" value={space.category || ""} onChange={handleChange} options={categoryOptions} />
            <SelectField label="Specification" name="specification" value={space.specification || ""} onChange={handleChange} options={specificationOptions} />
            <SelectField label="Media Type" name="mediaType" value={space.mediaType || ""} onChange={handleChange} options={mediaTypeOptions} />
            <SelectField label="Illumination" name="illumination" value={space.illumination || ""} onChange={handleChange} options={illuminationOptions} />
            <InputField label="Price" name="price" type="number" value={space.price || ""} onChange={handleChange} />
            <InputField label="Footfall" name="footfall" type="number" value={space.footfall || ""} onChange={handleChange} />
            <MultiSelectField label="Audience" name="audience" value={space.audience || []} onChange={handleChange} options={audienceOptions} />
            <SelectField label="Demographics" name="demographics" value={space.demographics || ""} onChange={handleChange} options={demographicsOptions} />
            <InputField label="Width (ft)" name="width" type="number" value={space.width || ""} onChange={handleChange} />
            <InputField label="Height (ft)" name="height" type="number" value={space.height || ""} onChange={handleChange} />
            <InputField label="Address" name="address" value={space.address || ""} onChange={handleChange} />
            <InputField label="City" name="city" value={space.city || ""} onChange={handleChange} />
            <InputField label="State" name="state" value={space.state || ""} onChange={handleChange} />
            <InputField label="Latitude" name="latitude" value={space.latitude || ""} onChange={handleChange} />
            <InputField label="Longitude" name="longitude" value={space.longitude || ""} onChange={handleChange} />
            <InputField label="Zone" name="zone" value={space.zone || ""} onChange={handleChange} />
            <SelectField label="Tier" name="tier" value={space.tier || ""} onChange={handleChange} options={tierOptions} />
            <SelectField label="Facing" name="facing" value={space.facing || ""} onChange={handleChange} options={facingOptions} />
            <InputField label="Available From" name="availableFrom" type="date" value={space.availableFrom || ""} onChange={handleChange} />
            <InputField label="Available To" name="availableTo" type="date" value={space.availableTo || ""} onChange={handleChange} />
            <InputField label="Total Units" name="totalUnits" type="number" value={space.totalUnits ?? ""} onChange={handleChange} placeholder="Total Units" />
            <InputField label="Occupied Units" name="occupiedUnits" type="number" value={space.occupiedUnits ?? ""} onChange={handleChange} placeholder="Occupied Units" />
            <InputField label="Facia Towards" name="faciaTowards" value={space.faciaTowards || ""} onChange={handleChange} />
            <InputField label="Tags" name="tags" value={space.tags || ""} onChange={handleChange} />
            <InputField label="Previous Brands" name="previousBrands" value={space.previousBrands || ""} onChange={handleChange} />
            <InputField label="Additional Tags" name="additionalTags" value={space.additionalTags || ""} onChange={handleChange} />
            <div className="col-span-1 md:col-span-2 lg:col-span-3"><TextareaField label="Description" name="description" value={space.description || ""} onChange={handleChange} /></div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <FileUploadField label="Main Photo" name="mainPhoto" onChange={handleFileChange} currentImage={space.mainPhoto} />
              <FileUploadField label="Long Shot" name="longShot" onChange={handleFileChange} currentImage={space.longShot} />
              <FileUploadField label="Close Shot" name="closeShot" onChange={handleFileChange} currentImage={space.closeShot} />
            </div>
          </div>
          <div className="mt-8 flex gap-4">
            <button onClick={() => navigate(`/space/${id}`)} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel</button>
            <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Delete Space</button>
            <button onClick={handleSave} className="bg-black ml-auto text-white px-4 py-2 rounded">Save Changes</button>
          </div>
        </div>
      </main>
    </div>
  );
}

const InputField = ({ label, name, value, onChange, placeholder, type = "text" }) => ( <div className="flex flex-col gap-1"> <label htmlFor={name} className="font-medium text-sm text-gray-700">{label}</label> <input id={name} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500" /> </div> );
const SelectField = ({ label, name, value, onChange, options, placeholder = "Select..." }) => ( <div className="flex flex-col gap-1"> <label htmlFor={name} className="font-medium text-sm text-gray-700">{label}</label> <select id={name} name={name} value={value} onChange={onChange} className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"> <option value="">{placeholder}</option> {options.map(opt => <option key={opt} value={opt}>{opt}</option>)} </select> </div> );
const TextareaField = ({ label, name, value, onChange, placeholder, rows = 4 }) => ( <div className="flex flex-col gap-1"> <label htmlFor={name} className="font-medium text-sm text-gray-700">{label}</label> <textarea id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows} className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500" /> </div> );
const FileUploadField = ({ label, name, onChange, currentImage }) => { const [previewUrl, setPreviewUrl] = useState(null); const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { const url = URL.createObjectURL(file); setPreviewUrl(url); onChange(e); } else { setPreviewUrl(null); } }; return ( <div className="flex flex-col gap-2"> <label className="font-medium text-sm text-gray-700">{label}</label> {previewUrl ? <div className="relative"><img src={previewUrl} alt="Preview" className="w-32 h-32 object-cover rounded-md border"/></div> : currentImage ? <div className="relative"><img src={currentImage} alt={label} className="w-32 h-32 object-cover rounded-md border"/></div> : <div className="w-32 h-32 border-2 border-dashed rounded-md flex items-center justify-center text-gray-400"><span>No image</span></div>} <input type="file" name={name} onChange={handleFileChange} className="text-sm" accept="image/*"/> </div> ); };