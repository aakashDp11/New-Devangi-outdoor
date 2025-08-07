import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { toast } from "sonner";
import { useSidebar } from "../context/SidebarContext"; // 1. IMPORTE O HOOK DA BARRA LATERAL

export default function EditSpace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar(); // 2. USE O HOOK PARA OBTER O ESTADO
  const [space, setSpace] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({
    mainPhoto: null,
    longShot: null,
    closeShot: null,
    otherPhotos: [],
  });
  const spaceTypeOptions = ["Billboard", "Digital Screen"];
  const categoryOptions = ["Retail", "Transit"];
  const mediaTypeOptions = ["Static", "Digital"];
  const audienceOptions = ["Youth", "Working Professionals"];
  const demographicsOptions = ["Urban", "Rural"];
  const tierOptions = ["Tier 1", "Tier 2", "Tier 3"];
  const facingOptions = ["Single Facing", "Double Facing"];

  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/spaces/${id}`
        );
        const data = await response.json();
        setSpace(data);
      } catch (error) {
        console.error("Error fetching space:", error);
      }
    };
    fetchSpace();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSpace((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this space? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/spaces/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Space deleted successfully!");
        navigate("/"); // Go back to InventoryDashboard
      } else {
        toast.error("Failed to delete space.");
      }
    } catch (error) {
      console.error("Error deleting space:", error);
      toast.error("An error occurred while deleting.");
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === "otherPhotos") {
      setSelectedFiles((prev) => ({
        ...prev,
        otherPhotos: Array.from(files),
      }));
    } else {
      setSelectedFiles((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    }
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      for (const key in space) {
        if (typeof space[key] !== "object") {
          formData.append(key, space[key]);
        }
      }

      if (selectedFiles.mainPhoto)
        formData.append("mainPhoto", selectedFiles.mainPhoto);
      if (selectedFiles.longShot)
        formData.append("longShot", selectedFiles.longShot);
      if (selectedFiles.closeShot)
        formData.append("closeShot", selectedFiles.closeShot);
      if (selectedFiles.otherPhotos.length > 0) {
        selectedFiles.otherPhotos.forEach((photo) =>
          formData.append("otherPhotos", photo)
        );
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/spaces/${id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (response.ok) {
        toast.success("Space updated successfully!");
        navigate(`/`);
      } else {
        toast.error("Failed to update space.");
      }
    } catch (error) {
      console.error("Error updating space:", error);
    }
  };

  if (!space) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-xs h-full w-screen bg-gray-50 text-black flex flex-col lg:flex-row">
      <Navbar />
      {/* 3. TORNE A CLASSE DO ELEMENTO PRINCIPAL DINÂMICA */}
      <main
        className={`flex-1 overflow-y-auto px-4 md:px-8 py-6 transition-all duration-300 ${
          isCollapsed ? "lg:ml-24" : "lg:ml-64"
        }`}
      >
        {/* Card Container */}
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold mb-6 border-b pb-4">Edit Space</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TEXT INPUT FIELDS */}
            <InputField
              label="Space Name"
              name="spaceName"
              value={space.spaceName}
              onChange={handleChange}
              placeholder="Space Name"
            />

            <InputField
              label="Landlord"
              name="landlord"
              value={space.landlord}
              onChange={handleChange}
              placeholder="Landlord"
            />

            {/* SELECT FIELDS */}
            <SelectField
              label="Space Type"
              name="spaceType"
              value={space.spaceType}
              onChange={handleChange}
              options={spaceTypeOptions}
              placeholder="Select Space Type"
            />

            <SelectField
              label="Category"
              name="category"
              value={space.category}
              onChange={handleChange}
              options={categoryOptions}
              placeholder="Select Category"
            />

            <SelectField
              label="Media Type"
              name="mediaType"
              value={space.mediaType}
              onChange={handleChange}
              options={mediaTypeOptions}
              placeholder="Select Media Type"
            />

            {/* NUMBER INPUTS */}
            <InputField
              label="Price"
              name="price"
              type="number"
              value={space.price}
              onChange={handleChange}
              placeholder="Price"
            />

            <InputField
              label="Footfall"
              name="footfall"
              type="number"
              value={space.footfall}
              onChange={handleChange}
              placeholder="Footfall"
            />

            {/* MORE SELECT FIELDS */}
            <SelectField
              label="Audience"
              name="audience"
              value={space.audience}
              onChange={handleChange}
              options={audienceOptions}
              placeholder="Select Audience"
            />

            <SelectField
              label="Demographics"
              name="demographics"
              value={space.demographics}
              onChange={handleChange}
              options={demographicsOptions}
              placeholder="Select Demographics"
            />

            {/* LOCATION FIELDS */}
            <InputField
              label="Address"
              name="address"
              value={space.address}
              onChange={handleChange}
              placeholder="Address"
            />

            <InputField
              label="City"
              name="city"
              value={space.city}
              onChange={handleChange}
              placeholder="City"
            />

            <InputField
              label="State"
              name="state"
              value={space.state}
              onChange={handleChange}
              placeholder="State"
            />

            <InputField
              label="Latitude"
              name="latitude"
              value={space.latitude}
              onChange={handleChange}
              placeholder="Latitude"
            />

            <InputField
              label="Longitude"
              name="longitude"
              value={space.longitude}
              onChange={handleChange}
              placeholder="Longitude"
            />

            <InputField
              label="Zone"
              name="zone"
              value={space.zone}
              onChange={handleChange}
              placeholder="Zone"
            />

            {/* MORE SELECT FIELDS */}
            <SelectField
              label="Tier"
              name="tier"
              value={space.tier}
              onChange={handleChange}
              options={tierOptions}
              placeholder="Select Tier"
            />

            <SelectField
              label="Facing"
              name="facing"
              value={space.facing}
              onChange={handleChange}
              options={facingOptions}
              placeholder="Select Facing"
            />

            {/* ADDITIONAL TEXT FIELDS */}
            <InputField
              label="Facia Towards"
              name="faciaTowards"
              value={space.faciaTowards}
              onChange={handleChange}
              placeholder="Facia Towards"
            />

            <InputField
              label="Tags"
              name="tags"
              value={space.tags}
              onChange={handleChange}
              placeholder="Tags"
            />

            <InputField
              label="Previous Brands"
              name="previousBrands"
              value={space.previousBrands}
              onChange={handleChange}
              placeholder="Previous Brands"
            />

            <InputField
              label="Additional Tags"
              name="additionalTags"
              value={space.additionalTags}
              onChange={handleChange}
              placeholder="Additional Tags"
            />

            {/* DESCRIPTION - SPANS 2 COLUMNS */}
            <div className="col-span-2">
              <TextareaField
                label="Description"
                name="description"
                value={space.description}
                onChange={handleChange}
                placeholder="Description"
                rows={4}
              />
            </div>

            {/* FILE UPLOADS */}
            <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <FileUploadField
                label="Main Photo"
                name="mainPhoto"
                onChange={handleFileChange}
                currentImage={space.mainPhoto}
              />

              <FileUploadField
                label="Long Shot"
                name="longShot"
                onChange={handleFileChange}
                currentImage={space.longShot}
              />

              <FileUploadField
                label="Close Shot"
                name="closeShot"
                onChange={handleFileChange}
                currentImage={space.closeShot}
              />
            </div>
          </div>

          {/* <button
          onClick={handleSave}
          className="mt-6 bg-black text-xs text-white px-4 py-2 rounded ml-[90%]"
        >
          Save
        </button> */}
          <div className="mt-4 mr-[5%] flex mt-[5%] gap-4">
            <button
              onClick={() => navigate(`/space/${id}`)}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
            >
              Delete Space
            </button>
            <button
              onClick={handleSave}
              className="bg-black ml-auto text-white px-4 py-2 rounded transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
            >
              Save
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

const InputField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={name} className="font-medium text-sm text-gray-700">
      {label}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    />
  </div>
);

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
}) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={name} className="font-medium text-sm text-gray-700">
      {label}
    </label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className={`border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const TextareaField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  className = "",
  rows = 4,
}) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={name} className="font-medium text-sm text-gray-700">
      {label}
    </label>
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical ${className}`}
    />
  </div>
);

const FileUploadField = ({ label, name, onChange, currentImage }) => {
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

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="font-medium text-sm text-gray-700">{label}</label>

      {previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt={`${label} preview`}
            className="w-32 h-32 object-cover rounded-md border shadow-sm"
          />
          <div className="absolute top-1 right-1 bg-slate-500 text-white text-xs px-2 py-1 rounded">
            New
          </div>
          <button
            type="button"
            onClick={clearPreview}
            className="absolute top-1 left-1 bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
          >
            ×
          </button>
        </div>
      ) : currentImage ? (
        <div className="relative">
          <img
            src={currentImage}
            alt={label}
            className="w-32 h-32 object-cover rounded-md border shadow-sm"
          />
        </div>
      ) : (
        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400">
          <span className="text-sm">No image</span>
        </div>
      )}

      <input
        type="file"
        name={name}
        onChange={handleFileChange}
        className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold hover:file:bg-blue-100"
        accept="image/*"
      />
    </div>
  );
};
