import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useSpaceForm } from "../context/SpaceFormContext";
import { toast } from "sonner";
import MapPreview from "./MapPreview";
import Select from "react-select";
import { useSidebar } from "../context/SidebarContext";

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

  // State for dependent dropdown options
  const [transitTypeOptions, setTransitTypeOptions] = useState([]);
  const [lineOptions, setLineOptions] = useState([]);

  const formatForInput = (dateStr) => {
    if (!dateStr) return "";
    const [dd, mm, yyyy] = dateStr.split("-");
    if (!yyyy || !mm || !dd) return "";
    return `${yyyy}-${mm}-${dd}`;
  };

  const validateCurrentStep = () => {
    const isSpecialType = form.spaceType === "BQS"  || form.spaceType === "DigitalBQS" || form.spaceType === "Transit";

    const mandatoryFieldsByStep = {
      Basic: [
        "spaceName", "landlord", "spaceType", "ownershipType", "startDate", "endDate",
      ],
      Specifications:
        form.spaceType === "DOOH"
          ? [ "unit", "resolution", "width", "height"]
          : ["illumination", "width", "height"],
      Location: ["address", "city", "state",  "latitude", "longitude"],
    };

    // If spaceType is BQS or Transit, modify the mandatory fields
        // If spaceType is BQS or Transit, modify the mandatory fields
    if (isSpecialType) {
      mandatoryFieldsByStep.Basic.push("buyingPrice");
      mandatoryFieldsByStep.Specifications = ["illumination"]; // Only illumination is mandatory
      const locationFields = mandatoryFieldsByStep.Location;
      // MODIFICATION: Filter out latitude and longitude for BQS/Transit spaces
      mandatoryFieldsByStep.Location = locationFields.filter(
        field => !['zip', 'latitude', 'longitude'].includes(field)
      );
    }
    
    // If spaceType is Transit, add the new fields to the mandatory list
    if (form.spaceType === 'Transit') {
        mandatoryFieldsByStep.Basic.push('transitType', 'transitLine');
    }

    const currentFields = mandatoryFieldsByStep[step] || [];
    for (const field of currentFields) {
      if (!form[field] || form[field].toString().trim() === "") {
        toast.error(`Please fill the required field: ${field}`);
        return false;
      }
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
    handleInputChange(e); // Update form state for spaceType

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
  };

  const handleTransitTypeChange = (e) => {
    const { value } = e.target;
    handleInputChange(e); // Update form state for transitType
    
    // Reset the line selection
    setLineOptions([]);
    handleInputChange({ target: { name: 'transitLine', value: '' } });

    const selectedTypeData = transitTypeOptions.find(opt => opt.value === value);
    if (selectedTypeData && selectedTypeData.lines) {
      setLineOptions(selectedTypeData.lines);
    }
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
                  <Input label="Space name" mandatory="true" name="spaceName" value={form.spaceName} onChange={handleInputChange} required />
                  <Input label="Landlord" name="landlord" mandatory="true" value={form.landlord} onChange={handleInputChange} />
                  <Input label="Inventory Owner (Organization)" name="organization" value={form.organization} onChange={handleInputChange} />
                  <Input label="Peer Media Owner" name="peerMediaOwner" value={form.peerMediaOwner} onChange={handleInputChange} />
                  
                  {/* --- MODIFIED SPACETYPE SELECT --- */}
                  <CustomSelect
                    label="Space Type"
                    name="spaceType"
                    value={form.spaceType}
                    onChange={handleSpaceTypeChange}
                    options={spaceOptions.map(({ transitTypes, ...rest }) => rest)} // Pass options without nested data
                    mandatory="true"
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
                      />
                      {form.transitType && lineOptions.length > 0 && (
                        <CustomSelect
                          label="Transit Line"
                          name="transitLine"
                          value={form.transitLine}
                          onChange={handleInputChange} // Uses the default handler
                          options={lineOptions}
                          mandatory="true"
                        />
                      )}
                    </>
                  )}
                  {/* --- END: CONDITIONALLY RENDERED DROPDOWNS --- */}

                  <CustomSelect label="Ownership Type" name="ownershipType" value={form.ownershipType} onChange={handleInputChange} options={ownershipOptions} mandatory="true" />
                  <Input mandatory="true" label={`${form.ownershipType || ""} Start Date`} name="startDate" type="date" value={formatForInput(form.startDate)} onChange={handleInputChange} required />
                  <Input label={`${form.ownershipType || ""} End Date`} name="endDate" mandatory="true" type="date" value={formatForInput(form.endDate)} onChange={handleInputChange} required min={form.startDate ? formatForInput(form.startDate) : ""} />
                  <CustomSelect label="Category" name="category" value={form.category} onChange={handleInputChange} options={categoryOptions} mandatory="false" />
                  <CustomSelect label="Specification" name="specification" value={form.specification} onChange={handleInputChange} options={specificationOptions} mandatory={form.spaceType !== 'BQS' && form.spaceType !== 'DigitalBQS' && form.spaceType !== 'Transit' ? "true" : "false"} />
                  
                  {form.spaceType === 'BQS' || form.spaceType === 'DigitalBQS' || form.spaceType === 'Transit' ? (
                    <>
                      <Input label="Buying Price" name="buyingPrice" value={form.buyingPrice} onChange={handleInputChange} mandatory="true" />
                    </>
                  ) : (
                    <Input label="Price" name="price" value={form.price} onChange={handleInputChange} />
                  )}

                  <Input label="Footfall" name="footfall" value={form.footfall} onChange={handleInputChange} />
                  <MultiAudienceSelect label="Audience" name="audience" value={form.audience} onChange={handleInputChange} options={audienceOptions} mandatory="true" />
                  <Select1 label="Demographics" name="demographics" value={form.demographics} onChange={handleInputChange} required>
                    <option value="">Select...</option> <option value="Urban">Urban</option> <option value="Rural">Rural</option>
                  </Select1>
                  <div>
                    <label className="text-sm">Description</label>
                    <textarea name="description" value={form.description} onChange={handleInputChange} className="w-full border px-3 py-2 rounded mt-1" rows={4} maxLength={400} />
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
  <CustomSelect label="Illumination" name="illumination" value={form.illumination} onChange={handleInputChange} options={illuminationOptions} mandatory="true" />
)}                {form.spaceType === "DOOH" && (
                  <>
                    <Input label="Slots" name="unit" mandatory="true" value={form.unit} onChange={(e) => { const { value } = e.target; const maxMap = { Billboard: 1, DOOH: 10, "Pole kiosk": 1, Gantry: 1, BQS: 1, DigitalBQS: 1 , Miscellaneous: 1, }; const max = maxMap[form.spaceType]; if (value === "" || Number(value) <= max) { handleInputChange(e); } else { toast.error(`Max units allowed for ${form.spaceType || "this type"} is ${max}`); } }} required />
                    <Input label="Resolutions" mandatory="true" name="resolution" value={form.resolution} onChange={handleInputChange} />
                  </>
                )}
                <Input label="Width (in ft)" mandatory={form.spaceType !== 'BQS'  &&  form.spaceType !== 'DigitalBQS'&& form.spaceType !== 'Transit' ? "true" : "false"} name="width" value={form.width} onChange={handleInputChange} />
                <Input label="Height (in ft)" mandatory={form.spaceType !== 'BQS' &&  form.spaceType !== 'DigitalBQS' && form.spaceType !== 'Transit' ? "true" : "false"} name="height" value={form.height} onChange={handleInputChange} />
              </div>
              <div className="space-y-4">
                <Input label="Additional Tags" name="additionalTags" value={form.additionalTags} onChange={handleInputChange} />
                <Input label="Previous brands" name="previousBrands" value={form.previousBrands} onChange={handleInputChange} />
                <Input label="Tags" name="tags" value={form.tags} onChange={handleInputChange} />
              </div>
            </div>
          )}

          {step === "Location" && (
            <div className="grid text-xs grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Address" mandatory="true" name="address" value={form.address} onChange={handleInputChange} />
              <Input label="City" mandatory="true" name="city" value={form.city} onChange={handleInputChange} required />
              <CustomSelect label="State" name="state" value={form.state} onChange={handleInputChange} options={stateOptions} mandatory="true" />
              <Input label="Pin-code" mandatory="false" name="zip" value={form.zip} onChange={handleInputChange} />
              {/* MODIFICATION: Added Latitude input and made both Latitude/Longitude conditional */}
              <Input label="Latitude" mandatory={form.spaceType !== 'BQS'  && form.spaceType !== 'DigitalBQS' && form.spaceType !== 'Transit' ? "true" : "false"} name="latitude" value={form.latitude} onChange={handleInputChange} />
              <Input label="Longitude" mandatory={form.spaceType !== 'BQS' && form.spaceType !== 'DigitalBQS' && form.spaceType !== 'Transit' ? "true" : "false"} name="longitude" value={form.longitude} onChange={handleInputChange} />              {form.latitude && form.longitude && !isNaN(parseFloat(form.latitude)) && !isNaN(parseFloat(form.longitude)) && (
                <div className="md:col-span-2"> {/* Outer wrapper for the whole section */}
    <label className="text-sm font-semibold mb-1 block">Map Preview</label>
    <div className="h-80"> {/* Container with fixed height for the map ONLY */}
      <MapPreview latitude={parseFloat(form.latitude)} longitude={parseFloat(form.longitude)} />
    </div>
    <p className="mt-1 text-xs text-gray-500">Real-time map preview from OpenStreetMap.</p>
  </div>
)}
              <Input label="Landmark" name="landmark" value={form.landmark} onChange={handleInputChange} />
              <CustomSelect label="Zone" name="zone" value={form.zone} onChange={handleInputChange} options={zoneOptions} />
              <CustomSelect label="Tier" name="tier" value={form.tier} onChange={handleInputChange} options={tierOptions} mandatory="true" />
              <CustomSelect label="Facing" name="facing" value={form.facing} onChange={handleInputChange} options={facingOptions} mandatory="true" />
              <Input label="Facia towards" name="faciaTowards" value={form.faciaTowards} onChange={handleInputChange} />
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

function Input({ mandatory, label, ...props }) {
  return (
    <div className="mb-4">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {mandatory === "true" && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input
        {...props}
        className="w-3/4 block border border-gray-300 px-3 py-2 rounded-lg shadow-sm mt-1 
                   focus:ring-2 focus:ring-black focus:border-black text-sm"
      />
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

function ImageUpload({ label, name, multiple = false }) {
  const { form, setForm } = useSpaceForm();
  const handleFileChange = (e) => {
    const files = multiple ? Array.from(e.target.files) : e.target.files[0];
    setForm((prev) => ({ ...prev, [name]: files }));
  };
  const preview =
    multiple && Array.isArray(form[name])
      ? form[name].map((file, i) => URL.createObjectURL(file))
      : form[name]
      ? URL.createObjectURL(form[name])
      : null;

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 h-48 
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
