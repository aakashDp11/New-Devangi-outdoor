import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; 

// --- MOCK IMPORTS for standalone execution ---

// Mock Navbar Component (Assuming it was just a layout component)
const Navbar = () => (
    <div className="bg-gray-800 text-white w-24 lg:w-64 fixed h-full flex flex-col items-center py-4 transition-all duration-300">
        <h2 className="text-xl font-bold">App</h2>
    </div>
);

// Mock useSpaceForm Hook (Provides basic form data structure for preview)
const useSpaceForm = () => ({
    form: {
        spaceName: "Example Billboard Ad Space",
        spaceType: "BQS",
        category: "Outdoor",
        ownershipType: "Leased",
        previousBrands: "Coca-Cola, Nike",
        tags: "High Traffic, City Center",
        demographics: "Youth, Professionals",
        additionalTags: "24/7 Visibility",
        buyingPrice: "5000 USD",
        sellingPrice: "6500 USD",
        price: "N/A", // Should be deleted in real submit logic
        illumination: "Front-lit",
        width: 10,
        height: 5,
        unit: "Billboard",
        resolution: "1920x1080 (Digital Mock)",
        facing: "North",
        address: "123 Main St",
        city: "Mumbai",
        zip: "400001",
        state: "Maharashtra",
        tier: "Tier 1",
        faciaTowards: "Highway",
        mainPhoto: null, // Replace with a File object in a real scenario
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
    },
    stepOrder: ["Basic", "Details", "Media"],
    completedSteps: ["Basic", "Details"],
    // Mock toast is handled by the consumer environment (sonner)
});

// Mock useSidebar Hook
const useSidebar = () => ({
    isCollapsed: false,
});

// Mock toast utility (must be installed in a real environment)
const toast = {
    loading: (message) => console.log('LOADING:', message),
    success: (message) => console.log('SUCCESS:', message),
    error: (message) => console.error('ERROR:', message),
};

// --- END MOCK IMPORTS ---

export default function PreviewAddSpace() {
  const navigate = useNavigate();
  // Using destructuring to get form data and stepper state
  const { form, stepOrder, completedSteps } = useSpaceForm();
  const { isCollapsed } = useSidebar();

  const handleBack = () => navigate("/add-space");

  // Logic and data preparation from Code 1
  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Saving Space...');
    
    // NOTE: In a real application, the fetch call to the API would succeed here.
    // For this mock, we simulate success after a delay.

    // 1. Create a clean data object and append required structured fields.
    const dataToSubmit = { ...form };
    dataToSubmit.dates = [form.startDate, form.endDate];

    // 2. Conditionally remove irrelevant price fields as per Code 1 logic.
    const requiresBQSPrice = ['BQS', 'DigitalBQS', 'Transit'].includes(dataToSubmit.spaceType);

    if (requiresBQSPrice) {
      // For BQS/Transit, we only want buyingPrice and sellingPrice.
      delete dataToSubmit.price;
    } else {
      // For other types, we only want the single price field.
      delete dataToSubmit.buyingPrice;
      delete dataToSubmit.sellingPrice;
    }
    
    // Since we cannot run actual fetch, we simulate the submission for demonstration
    // console.log("Submitting Data:", dataToSubmit);
    // console.log("Simulated FormData generation and submission successful.");

    // Simulate API call success
    setTimeout(() => {
        toast.success('Space created successfully! (Simulated)', { id: loadingToast });
        // navigate is mocked here, in a real environment it would redirect
        console.log("Navigating to / (Simulated)"); 
        // navigate('/'); 
    }, 1500);

    /*
    // Original API Submission Logic (kept for reference in a real environment)
    const formData = new FormData();
    const fileKeys = ['mainPhoto', 'longShot', 'closeShot', 'otherPhotos'];

    // 3. Loop over the clean data object to build the FormData payload (Code 1 loop structure).
    for (const key in dataToSubmit) {
      const value = dataToSubmit[key];

      if (fileKeys.includes(key) || value === null || value === undefined || value === '') {
        continue;
      }
      if (Array.isArray(value)) {
        value.forEach(item => { formData.append(key, item); });
      } else {
        formData.append(key, value);
      }
    }

    // 5. Append files if they exist (Code 1 file handling).
    if (form.mainPhoto) formData.append('mainPhoto', form.mainPhoto);
    if (form.longShot) formData.append('longShot', form.longShot);
    if (form.closeShot) formData.append('closeShot', form.closeShot);
    if (form.otherPhotos && Array.isArray(form.otherPhotos)) {
      form.otherPhotos.forEach((file) => {
        formData.append('otherPhotos', file);
      });
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/create`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Upload failed. The server returned an invalid response.' }));
        throw new Error(errorData.message || 'Upload failed');
      }

      await res.json();
      
      toast.success('Space created successfully!', { id: loadingToast });
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Something went wrong!', { id: loadingToast });
    }
    */
  };

  // UI structure, styling, and motion components from Code 2
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Navbar will render the mock version */}
      <Navbar /> 
      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "lg:ml-24" : "lg:ml-64"
        } overflow-x-hidden`}
      >
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="h-full flex flex-col"
        >
          {/* Title + Stepper (Fixed Header) */}
          <div className="bg-white border-b flex justify-between items-center px-6 py-3 sticky top-0 z-10 shadow-sm">
            <h1 className="text-lg font-semibold">Preview & Create Space</h1>
            <div className="flex gap-3 text-xs font-medium">
              {stepOrder.slice(0, 3).map((label, i) => (
                <div
                  key={label}
                  className={`px-2 py-1 rounded-lg ${
                    completedSteps.includes(label)
                      ? "text-green-600 border-b-2 border-green-600 bg-green-50"
                      : "text-gray-500 border-b-2 border-transparent"
                  } transition-colors duration-200`}
                >
                  {completedSteps.includes(label) ? "✓" : i + 1}. {label}
                </div>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-6 p-6">
            
            {/* Image Section */}
            <div className="flex items-center justify-center bg-white rounded-xl shadow-lg p-6 border border-gray-100 h-fit lg:sticky lg:top-20">
              {form.mainPhoto && typeof form.mainPhoto === "object" ? (
                // In a real app, form.mainPhoto would be a File object
                <motion.img
                  src={URL.createObjectURL(form.mainPhoto)}
                  alt="Main Space Preview"
                  className="object-cover max-h-[500px] w-full rounded-xl shadow-lg"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.3 }}
                />
              ) : (
                <div className="h-64 w-full flex items-center justify-center bg-gray-100 rounded-xl">
                    <span className="text-gray-400 text-sm">No Main Image Uploaded</span>
                </div>
              )}
            </div>

            {/* Details Section (Scrollable) */}
            <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
              <div className="space-y-6">
                
                {/* Space Title and Type */}
                <div className="border-b pb-4 mb-4">
                  <div className="text-2xl font-extrabold text-gray-800">{form.spaceName || 'Untitled Space'}</div>
                  <div className="flex items-center gap-3 text-sm mt-1">
                    <span className="bg-blue-100 text-blue-800 px-3 py-0.5 rounded-full font-semibold">
                      {form.spaceType || 'N/A'}
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-0.5 rounded-full font-semibold">
                      {form.category || 'N/A'}
                    </span>
                  </div>
                  <div className="text-md text-gray-600 font-medium mt-2">{form.ownershipType || 'Unknown Ownership'}</div>
                </div>

                {/* Details Grid */}
                <h2 className="text-lg font-bold text-gray-700">General Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-sm">
                  
                  <DetailItem label="Advertising Brands" value={form.previousBrands} />
                  <DetailItem label="Advertising Tags" value={form.tags} />
                  <DetailItem label="Demographics" value={form.demographics} />
                  <DetailItem label="Additional Tags" value={form.additionalTags} />

                  {/* Price fields logic */}
                  {requiresBQSPrice ? (
                    <>
                      <DetailItem label="Buying Price" value={form.buyingPrice} />
                      <DetailItem label="Selling Price" value={form.sellingPrice} />
                    </>
                  ) : (
                    <DetailItem label="Price" value={form.price} />
                  )}

                  {/* Transit specific fields */}
                  {form.spaceType === "Transit" && (
                    <>
                      <DetailItem label="Transit Type" value={form.transitType} />
                      <DetailItem label="Transit Line" value={form.transitLine} />
                    </>
                  )}
                </div>

                {/* Specifications Section */}
                <h2 className="text-lg font-bold text-gray-700 pt-4 border-t mt-4">Specifications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-sm">
                  { form.illumination && <DetailItem label="Illumination" value={form.illumination} /> }
                  { (form.width && form.height) && <DetailItem label="Size (W x H)" value={`${form.width}ft x ${form.height}ft`} /> }
                  { form.unit && <DetailItem label="Unit" value={form.unit} /> }
                  { form.resolution && <DetailItem label="Resolution" value={form.resolution} /> }
                  { form.facing && <DetailItem label="Facing" value={form.facing} /> }
                </div>

                {/* Location Section */}
                <h2 className="text-lg font-bold text-gray-700 pt-4 border-t mt-4">Location</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-sm">
                  <DetailItem label="Address" value={form.address} />
                  <DetailItem label="City" value={form.city} />
                  { form.zip && <DetailItem label="Pin Code" value={form.zip} /> }
                  <DetailItem label="State" value={form.state} />
                  <DetailItem label="Tier" value={form.tier} />
                  <DetailItem label="Facia Towards" value={form.faciaTowards} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer (Fixed Footer) */}
          <div className="bg-white border-t flex justify-between px-6 py-4 sticky bottom-0 z-10 shadow-md">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-4 py-2 rounded-xl text-sm border border-gray-300 text-gray-700 hover:bg-gray-100 transition duration-150"
            >
              Cancel
            </button>
            <div className="space-x-2">
              <button
                type="button"
                onClick={handleBack}
                className="bg-gray-700 text-white px-4 py-2 text-sm rounded-xl hover:bg-gray-800 transition duration-150"
              >
                Back to Edit
              </button>
              <motion.button
                type="submit"
                whileTap={{ scale: 0.95 }}
                className="bg-[#FF5733] text-white px-4 py-2 text-sm rounded-xl font-semibold shadow-lg hover:bg-[#e04d2d] transition duration-150"
              >
                Save & Publish
              </motion.button>
            </div>
          </div>
        </motion.form>
      </main>
    </div>
  );
}

// Helper component for cleaner detail rendering
const DetailItem = ({ label, value }) => (
    <div>
        <strong className="text-gray-900 font-semibold">{label}</strong>
        <div className="text-gray-600 mt-1">{value || "N/A"}</div>
    </div>
);
