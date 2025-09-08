import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useSpaceForm } from "../context/SpaceFormContext";
import { toast } from "sonner";
import { useSidebar } from "../context/SidebarContext";
import { motion } from "framer-motion";

export default function PreviewAddSpace() {
  const navigate = useNavigate();
  const { form, stepOrder, completedSteps } = useSpaceForm();
  const { isCollapsed } = useSidebar();

  const handleBack = () => navigate("/add-space");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Saving Space...");

    const dataToSubmit = { ...form, dates: [form.startDate, form.endDate] };
    if (["BQS", "DigitalBQS", "Transit"].includes(dataToSubmit.spaceType)) {
      delete dataToSubmit.price;
    } else {
      delete dataToSubmit.buyingPrice;
    }

    const formData = new FormData();
    for (const key in dataToSubmit) {
      const value = dataToSubmit[key];
      if (["mainPhoto", "longShot", "closeShot", "otherPhotos"].includes(key) || !value) continue;
      Array.isArray(value)
        ? value.forEach((item) => formData.append(key, item))
        : formData.append(key, value);
    }

    if (form.mainPhoto) formData.append("mainPhoto", form.mainPhoto);
    if (form.longShot) formData.append("longShot", form.longShot);
    if (form.closeShot) formData.append("closeShot", form.closeShot);
    if (form.otherPhotos?.length) form.otherPhotos.forEach((f) => formData.append("otherPhotos", f));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/create`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(errorData.message || "Upload failed");
      }
      await res.json();
      toast.success("Space created successfully!", { id: loadingToast });
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Something went wrong!", { id: loadingToast });
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
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
          {/* Title + Stepper */}
          <div className="bg-white border-b flex justify-between items-center px-6 py-3">
            <h1 className="text-lg font-semibold">Create Space</h1>
            <div className="flex gap-3 text-xs">
              {stepOrder.slice(0, 3).map((label, i) => (
                <div
                  key={label}
                  className={`px-2 py-1 ${
                    completedSteps.includes(label)
                      ? "text-green-600 border-b-2 border-green-600"
                      : "text-gray-500 border-b-2 border-transparent"
                  }`}
                >
                  {completedSteps.includes(label) ? "✓" : i + 1}. {label}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-6 p-4">
            {/* Image Section */}
            <div className="flex items-center justify-center bg-gray-100 rounded-xl shadow-sm p-4">
              {form.mainPhoto && typeof form.mainPhoto === "object" ? (
                <motion.img
                  src={URL.createObjectURL(form.mainPhoto)}
                  alt="Main Preview"
                  className="object-cover max-h-[400px] w-auto rounded-xl shadow"
                  whileHover={{ scale: 1.02 }}
                />
              ) : (
                <span className="text-gray-400 text-sm">No Image Uploaded</span>
              )}
            </div>

            {/* Details Section */}
            <div className="bg-white shadow-sm rounded-xl p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm leading-relaxed">
                <div className="col-span-2 border-b pb-3 mb-3">
                  <div className="text-lg font-bold">{form.spaceName}</div>
                  <div className="flex gap-2 text-xs mt-1">
                    <span className="text-blue-600">{form.spaceType}</span>
                    <span className="text-purple-600">{form.category}</span>
                  </div>
                  <div className="text-sm text-gray-600">{form.ownershipType}</div>
                </div>

                <div>
                  <strong>Advertising brands</strong>
                  <div>{form.previousBrands || "N/A"}</div>
                </div>
                <div>
                  <strong>Advertising tags</strong>
                  <div>{form.tags || "N/A"}</div>
                </div>
                <div>
                  <strong>Demographics</strong>
                  <div>{form.demographics || "N/A"}</div>
                </div>
                <div>
                  <strong>Additional Tags</strong>
                  <div>{form.additionalTags || "N/A"}</div>
                </div>

                {["BQS", "DigitalBQS", "Transit"].includes(form.spaceType) ? (
                  <>
                    <div>
                      <strong>Buying Price</strong>
                      <div>{form.buyingPrice || "N/A"}</div>
                    </div>
                    <div>
                      <strong>Selling Price</strong>
                      <div>{form.sellingPrice || "N/A"}</div>
                    </div>
                  </>
                ) : (
                  <div>
                    <strong>Price</strong>
                    <div>{form.price || "N/A"}</div>
                  </div>
                )}

                {form.spaceType === "Transit" && (
                  <>
                    <div>
                      <strong>Transit Type</strong>
                      <div>{form.transitType || "N/A"}</div>
                    </div>
                    <div>
                      <strong>Transit Line</strong>
                      <div>{form.transitLine || "N/A"}</div>
                    </div>
                  </>
                )}

                {form.illumination && (
                  <div>
                    <strong>Illumination</strong>
                    <div>{form.illumination}</div>
                  </div>
                )}
                {form.width && form.height && (
                  <div>
                    <strong>Size</strong>
                    <div>
                      {form.width}ft x {form.height}ft
                    </div>
                  </div>
                )}
                {form.unit && (
                  <div>
                    <strong>Unit</strong>
                    <div>{form.unit}</div>
                  </div>
                )}
                {form.resolution && (
                  <div>
                    <strong>Resolution</strong>
                    <div>{form.resolution}</div>
                  </div>
                )}
                {form.facing && (
                  <div>
                    <strong>Facing</strong>
                    <div>{form.facing}</div>
                  </div>
                )}

                <div>
                  <strong>Address</strong>
                  <div>{form.address}</div>
                </div>
                <div>
                  <strong>City</strong>
                  <div>{form.city}</div>
                </div>
                {form.zip && (
                  <div>
                    <strong>Pin Code</strong>
                    <div>{form.zip}</div>
                  </div>
                )}
                <div>
                  <strong>State</strong>
                  <div>{form.state}</div>
                </div>
                <div>
                  <strong>Tier</strong>
                  <div>{form.tier}</div>
                </div>
                <div>
                  <strong>Facia Towards</strong>
                  <div>{form.faciaTowards || "N/A"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border-t flex justify-between px-6 py-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-3 py-1.5 rounded-lg text-sm border hover:bg-gray-100"
            >
              Cancel
            </button>
            <div className="space-x-2">
              <button
                type="button"
                onClick={handleBack}
                className="bg-black text-white px-3 py-1.5 text-sm rounded-lg hover:bg-gray-800"
              >
                Back
              </button>
              <motion.button
                type="submit"
                whileTap={{ scale: 0.95 }}
                className="bg-[#FF5733] text-white px-3 py-1.5 text-sm rounded-lg hover:bg-[#e04d2d]"
              >
                Save
              </motion.button>
            </div>
          </div>
        </motion.form>
      </main>
    </div>
  );
}
