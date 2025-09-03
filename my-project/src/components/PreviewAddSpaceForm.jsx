import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useSpaceForm } from '../context/SpaceFormContext';
import { toast } from 'sonner';
import { useSidebar } from '../context/SidebarContext';

export default function PreviewAddSpace() {
  const navigate = useNavigate();
  const { form, stepOrder, completedSteps } = useSpaceForm();
  const { isCollapsed } = useSidebar();

  console.log("basic details", form);

  const handleBack = () => {
    navigate('/add-space');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Saving Space...');

    // --- START: MODIFIED DATA PREPARATION LOGIC ---

    // 1. Create a clean data object to avoid modifying the original form state directly.
    const dataToSubmit = { ...form };
    dataToSubmit.dates = [form.startDate, form.endDate];

    // 2. Conditionally remove irrelevant price fields to prevent validation errors.
    if (dataToSubmit.spaceType === 'BQS'||dataToSubmit.spaceType === 'DigitalBQS' || dataToSubmit.spaceType === 'Transit') {
      delete dataToSubmit.price; // For BQS/Transit, we only want buyingPrice and sellingPrice.
    } else {
      delete dataToSubmit.buyingPrice; // For other types, we only want the single price field.
    }

    const formData = new FormData();

    // 3. Loop over the clean data object to build the FormData payload.
    for (const key in dataToSubmit) {
      const value = dataToSubmit[key];
      const fileKeys = ['mainPhoto', 'longShot', 'closeShot', 'otherPhotos'];

      if (fileKeys.includes(key) || value === null || value === undefined || value === '') {
        // Skip files (handled later) and any empty/null/undefined fields.
        continue;
      }

      // 4. Correctly format arrays by appending each item separately.
      if (Array.isArray(value)) {
        value.forEach(item => {
          // This will create multiple entries like 'audience=Youth', 'audience=Students'
          formData.append(key, item);
        });
      } else {
        // Append all other non-empty fields.
        formData.append(key, value);
      }
    }

    // 5. Append files if they exist.
    if (form.mainPhoto) formData.append('mainPhoto', form.mainPhoto);
    if (form.longShot) formData.append('longShot', form.longShot);
    if (form.closeShot) formData.append('closeShot', form.closeShot);
    if (form.otherPhotos && Array.isArray(form.otherPhotos)) {
      form.otherPhotos.forEach((file) => {
        formData.append('otherPhotos', file);
      });
    }
    
    // --- END: MODIFIED DATA PREPARATION LOGIC ---

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/create`, {
        method: 'POST',
        body: formData, // The browser will automatically set the correct 'Content-Type' for FormData.
      });

      if (!res.ok) {
        // Try to get a more specific error message from the backend.
        const errorData = await res.json().catch(() => ({ message: 'Upload failed. The server returned an invalid response.' }));
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await res.json();

      toast.success('Space created successfully!', { id: loadingToast });
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Something went wrong!', { id: loadingToast });
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Navbar />
      <main className={`flex-1 p-6 text-xs transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <form onSubmit={handleSubmit} className="max-w-screen-xl mx-auto space-y-8">
          <div className="text-2xl font-semibold">Create Spaces</div>

          {/* Stepper */}
          <div className="flex gap-6 text-sm font-medium">
            {stepOrder.slice(0, 3).map((label) => (
              <div
                key={label}
                className={
                  completedSteps.includes(label)
                    ? 'text-green-600 flex items-center gap-1'
                    : 'text-black flex items-center gap-1'
                }
              >
                {completedSteps.includes(label) ? '✓' : ''} {label} Information
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Image Box */}
            <div className="rounded flex justify-center p-4">
              {form.mainPhoto && typeof form.mainPhoto === 'object' ? (
                <img
                  src={URL.createObjectURL(form.mainPhoto)}
                  alt="Main Preview"
                  className="object-cover h-32 w-32 rounded"
                />
              ) : (
                <span className="text-gray-500 text-lg">No Image Uploaded</span>
              )}
            </div>

            {/* Details */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="text-lg font-bold">{form.spaceName}</div>
                <div className="flex gap-4 text-sm mt-1">
                  <span className="text-blue-700 font-semibold">{form.spaceType}</span>
                  <span className="text-purple-700 font-semibold">{form.category}</span>
                </div>
                <div className="text-2xl font-bold mt-2">{form.ownershipType}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Advertising brands</strong>
                  <div className="text-gray-500">{form.previousBrands || 'N/A'}</div>
                </div>
                <div>
                  <strong>Advertising tags</strong>
                  <div className="text-gray-500">{form.tags || 'N/A'}</div>
                </div>
                <div>
                  <strong>Demographics</strong>
                  <div className="text-gray-500">{form.demographics || 'N/A'}</div>
                </div>
                <div>
                  <strong>Additional Tags</strong>
                  <div className="text-gray-500">{form.additionalTags || 'N/A'}</div>
                </div>
                
                {form.spaceType === 'BQS' || form.spaceType === 'DigitalBQS' || form.spaceType === 'Transit' ? (
                  <>
                    <div>
                      <strong>Buying Price</strong>
                      <div className="text-gray-500">{form.buyingPrice || 'N/A'}</div>
                    </div>
                    <div>
                      <strong>Selling Price</strong>
                      <div className="text-gray-500">{form.sellingPrice || 'N/A'}</div>
                    </div>
                  </>
                ) : (
                  <div>
                    <strong>Price</strong>
                    <div className="text-gray-500">{form.price || 'N/A'}</div>
                  </div>
                )}

                {form.spaceType === 'Transit' && (
                  <>
                    <div>
                      <strong>Transit Type</strong>
                      <div className="text-gray-500">{form.transitType || 'N/A'}</div>
                    </div>
                    <div>
                      <strong>Transit Line</strong>
                      <div className="text-gray-500">{form.transitLine || 'N/A'}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Specifications */}
              <div className="space-y-2">
                <div className="font-semibold">Specifications</div>
                <div className="grid grid-cols-2 gap-4 text-sm border p-4 rounded">
                  { form.illumination && <div><strong>Illumination</strong><br />{form.illumination}</div> }
                  { (form.width && form.height) && <div><strong>Size (WxH)</strong><br />{form.width}ft x {form.height}ft</div> }
                  { form.unit && <div><strong>Unit</strong><br />{form.unit}</div> }
                  { form.resolution && <div><strong>Resolution</strong><br />{form.resolution}</div> }
                  { form.facing && <div><strong>Facing</strong><br />{form.facing}</div> }
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <div className="font-semibold">Location</div>
                <div className="grid grid-cols-2 gap-4 text-sm border p-4 rounded">
                  <div><strong>Address</strong><br />{form.address}</div>
                  <div><strong>City</strong><br />{form.city}</div>
                  { form.zip && <div><strong>Pin Code</strong><br />{form.zip}</div> }
                  <div><strong>State</strong><br />{form.state}</div>
                  <div><strong>Tier</strong><br />{form.tier}</div>
                  <div><strong>Facia Towards</strong><br />{form.faciaTowards || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="border px-3 py-1 rounded"
            >
              Cancel
            </button>
            <div className="space-x-2">
              <button
                type="button"
                onClick={handleBack}
                className="bg-black text-white px-3 py-1 rounded"
              >
                Back
              </button>
              <button
                type="submit"
                className="bg-[#FF5733] text-white px-3 py-1 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}