import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner"; // Assuming sonner is installed

// --- ACTUAL IMPORTS ---
// Assuming these are the actual paths in your project
import Navbar from "./Navbar";
import { useSpaceForm } from "../context/SpaceFormContext"; // Replace mock with actual path
import { useSidebar } from "../context/SidebarContext"; // Replace mock with actual path
import { FaArrowLeft, FaCheck } from "react-icons/fa";

// --- REUSABLE UI COMPONENTS ---

const Card = ({ children, className = "", ...props }) => (
    <div
        className={`
            bg-gray-100 bg-opacity-80 shadow-xl rounded-2xl w-full flex flex-col relative overflow-hidden
            ${className}
        `}
        {...props}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-white via-indigo-50 to-purple-50 opacity-20 animate-bg-gradient-flow-diagonal z-0"></div>
        <div className="relative z-10 h-full flex flex-col">{children}</div>
    </div>
);

const CardContent = ({ children, className = "" }) => (
    <div className={`p-4 md:p-6 flex-grow flex flex-col ${className}`}>
        {children}
    </div>
);

const Button = ({ children, className = "", disabled = false, loading = false, ...props }) => (
    <button
        className={`px-4 py-2 rounded-xl bg-[black] text-white text-xs font-medium transition-all duration-200 transform hover:scale-105 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg ${className}`}
        disabled={disabled || loading}
        {...props}
    >
        {loading ? (
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {children}
            </div>
        ) : (
            children
        )}
    </button>
);

const PreviewField = ({ label, value }) => (
    <div className="w-full">
        <label className="text-sm font-medium text-gray-700 block mb-1">
            {label}
        </label>
        <p className="border px-4 py-2 rounded-xl w-full bg-white text-gray-900 shadow-sm whitespace-pre-wrap">
            {value || "-"}
        </p>
    </div>
);

const Stepper = ({ stepOrder, completedSteps }) => {
    const currentStepIndex = completedSteps.length;
    const isPreviewActive = completedSteps.length === stepOrder.length;

    return (
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 text-sm font-medium border-b border-gray-200 animate-fadeIn">
            {stepOrder.map((label, idx) => {
                const isCompleted = completedSteps.includes(label) || idx < currentStepIndex;
                const isActive = idx === currentStepIndex;
                return (
                    <div
                        key={label}
                        className={`flex items-center gap-2 pb-2 cursor-pointer transition-colors duration-200
                        ${isCompleted
                                ? "text-green-600"
                                : isActive ? "text-[black]" : "text-gray-500"}
                        ${isActive ? "border-b-2 border-[black] text-[black]" : "border-b-2 border-transparent"}
                        `}
                    >
                        <span className={`${isCompleted ? "text-green-600" : "text-gray-400"}`}>
                            {isCompleted ? <FaCheck /> : <span className="text-xl leading-none">•</span>}
                        </span>
                        {label}
                    </div>
                );
            })}
             {/* The Preview Step itself, active only after all others are done */}
             <div
                className={`flex items-center gap-2 pb-2 transition-colors duration-200
                ${isPreviewActive ? "text-[black] border-b-2 border-[black]" : "text-gray-500 border-b-2 border-transparent"}
                `}
            >
                <span className={`${isPreviewActive ? "text-green-600" : "text-gray-400"}`}>
                    <span className="text-xl leading-none">•</span>
                </span>
                Preview
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---

export default function PreviewAddSpace() {
    const navigate = useNavigate();
    const { form, stepOrder, completedSteps } = useSpaceForm();
    const { isCollapsed } = useSidebar();

    const handleBack = () => navigate("/add-space"); // Navigate back to the main form route

    // Determine price requirement outside of handleSubmit
    const requiresBQSPrice = ['BQS', 'DigitalBQS', 'Transit'].includes(form.spaceType);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading('Saving Space...');

        // 1. Create a clean data object and append required structured fields.
        const dataToSubmit = { ...form };
        dataToSubmit.dates = [form.startDate, form.endDate];

        // 2. Conditionally remove irrelevant price fields
        if (requiresBQSPrice) {
            delete dataToSubmit.price;
        } else {
            delete dataToSubmit.buyingPrice;
            delete dataToSubmit.sellingPrice;
        }
        
        const formData = new FormData();
        const fileKeys = ['mainPhoto', 'longShot', 'closeShot', 'otherPhotos'];

        // 3. Loop over the clean data object to build the FormData payload.
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

        // 4. Append files if they exist (File object check is crucial)
        if (form.mainPhoto instanceof File) formData.append('mainPhoto', form.mainPhoto);
        if (form.longShot instanceof File) formData.append('longShot', form.longShot);
        if (form.closeShot instanceof File) formData.append('closeShot', form.closeShot);
        if (form.otherPhotos && Array.isArray(form.otherPhotos)) {
            form.otherPhotos.forEach((file) => {
                if (file instanceof File) {
                    formData.append('otherPhotos', file);
                }
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
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-gray-900 flex flex-col lg:flex-row overflow-hidden`}>
            <Navbar /> 
            <main
                className={`flex-1 overflow-y-auto px-4 md:px-6 py-8 transition-all duration-300 ${
                    isCollapsed ? "lg:ml-24" : "lg:ml-64"
                }`}
            >
                <div className="max-w-screen-xl w-full mx-auto">
                    
                    {/* Header/Back Button */}
                    <div className="flex justify-between items-center mb-6 animate-slideDown">
                        <Button onClick={handleBack} className="bg-gray-700 text-white">
                            <FaArrowLeft className="inline mr-2" /> Back to Edit
                        </Button>
                    </div>
                    
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 animate-slideDown">
                        Preview & Create Space
                    </h1>

                    {/* Stepper */}
                    <Stepper 
                        stepOrder={stepOrder.slice(0, 3)} // Basic, Details, Media
                        completedSteps={completedSteps} 
                    />

                    <motion.form
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="h-full flex flex-col"
                        // ⭐ FIX 1: Add a unique ID to the form
                        id="addSpaceForm" 
                    >
                        
                        {/* Content Area */}
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-6 mb-24">
                            
                            {/* Image Section */}
                            <Card className="h-fit lg:sticky lg:top-8 animate-slideIn">
                                <CardContent className="items-center justify-center p-6">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-4 w-full">Main Photo Preview</h2>
                                    {form.mainPhoto instanceof File ? (
                                        <motion.img
                                            src={URL.createObjectURL(form.mainPhoto)}
                                            alt="Main Space Preview"
                                            className="object-cover max-h-[500px] w-full rounded-xl shadow-lg border border-gray-200"
                                            whileHover={{ scale: 1.01 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    ) : (
                                        <div className="h-64 w-full flex items-center justify-center bg-gray-200 rounded-xl border border-dashed border-gray-400">
                                            <span className="text-gray-500 text-base font-medium">No Main Image Uploaded</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Details Section */}
                            <Card className="animate-slideIn">
                                <CardContent>
                                    <div className="space-y-6">
                                        
                                        {/* Space Title and Type */}
                                        <div className="border-b pb-4 mb-4">
                                            <div className="text-3xl font-extrabold text-blue-800">{form.spaceName || 'Untitled Space'}</div>
                                            <div className="flex items-center gap-3 text-sm mt-2">
                                                <span className="bg-blue-200 text-blue-900 px-3 py-1 rounded-full font-semibold">
                                                    {form.spaceType || 'N/A'}
                                                </span>
                                                <span className="bg-purple-200 text-purple-900 px-3 py-1 rounded-full font-semibold">
                                                    {form.category || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="text-md text-gray-700 font-medium mt-2">Ownership: {form.ownershipType || 'Unknown'}</div>
                                        </div>

                                        {/* General Information */}
                                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">General Information</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                            <PreviewField label="Advertising Brands" value={form.previousBrands} />
                                            <PreviewField label="Advertising Tags" value={form.tags} />
                                            <PreviewField label="Demographics" value={form.demographics} />
                                            <PreviewField label="Additional Tags" value={form.additionalTags} />
                                        </div>

                                        {/* Pricing Information */}
                                        <h2 className="text-xl font-bold text-gray-800 pt-4 border-t border-gray-200 pb-2">Pricing</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                            {requiresBQSPrice ? (
                                                <>
                                                    <PreviewField label="Buying Price" value={form.buyingPrice} />
                                                    <PreviewField label="Selling Price" value={form.sellingPrice} />
                                                </>
                                            ) : (
                                                <PreviewField label="Price" value={form.price} />
                                            )}
                                        </div>
                                        
                                        {/* Specifications Section */}
                                        <h2 className="text-xl font-bold text-gray-800 pt-4 border-t border-gray-200 pb-2">Specifications</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                            { form.illumination && <PreviewField label="Illumination" value={form.illumination} /> }
                                            { (form.width && form.height) && <PreviewField label="Size (W x H)" value={`${form.width}ft x ${form.height}ft`} /> }
                                            { form.unit && <PreviewField label="Unit" value={form.unit} /> }
                                            { form.resolution && <PreviewField label="Resolution" value={form.resolution} /> }
                                            { form.facing && <PreviewField label="Facing" value={form.facing} /> }
                                        </div>

                                        {/* Location Section */}
                                        <h2 className="text-xl font-bold text-gray-800 pt-4 border-t border-gray-200 pb-2">Location</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                            <PreviewField label="Address" value={form.address} />
                                            <PreviewField label="City" value={form.city} />
                                            { form.zip && <PreviewField label="Pin Code" value={form.zip} /> }
                                            <PreviewField label="State" value={form.state} />
                                            <PreviewField label="Tier" value={form.tier} />
                                            <PreviewField label="Facia Towards" value={form.faciaTowards} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </motion.form>
                </div>
            </main>

            {/* Footer (Fixed Footer) */}
            <div className={`fixed bottom-0 right-0 bg-white z-10 transition-all duration-300 border-t border-gray-200 ${isCollapsed ? 'lg:left-24' : 'lg:left-64'}`}>
                <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-xl mx-auto">
                    <Button onClick={() => navigate("/")} className="bg-gray-700 hover:bg-gray-800">
                        Cancel
                    </Button>
                    <div className="flex items-center space-x-3">
                        <Button
                            onClick={handleBack}
                            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                        >
                            Back to Edit
                        </Button>
                        <motion.div whileTap={{ scale: 0.95 }}>
                            <Button
                                type="submit" 
                                // ⭐ FIX 2: Link the button to the form ID
                                form="addSpaceForm" 
                                className="bg-orange-500 text-white hover:bg-orange-600"
                            >
                                Save & Publish
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Animation Styles */}
            <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                @keyframes bg-gradient-flow-diagonal { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
                .animate-bg-gradient-flow-diagonal { background-size: 200% 200%; animation: bg-gradient-flow-diagonal 10s linear infinite; }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
                .animate-slideUp { animation: slideUp 0.4s ease-out; }
                .animate-slideDown { animation: slideDown 0.4s ease-out; }
                .animate-slideIn { animation: slideIn 0.4s ease-out; }
                .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
            `}</style>
        </div>
    );
}