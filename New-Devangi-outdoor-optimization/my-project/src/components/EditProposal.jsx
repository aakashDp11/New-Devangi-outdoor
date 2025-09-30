import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from './Navbar';
import { useSidebar } from '../context/SidebarContext';
import { FaSave, FaArrowLeft } from 'react-icons/fa'; // Added icons

// --- REUSABLE UI COMPONENTS (from previous files for consistent styling) ---

// Card component with gradient background flair
const Card = ({ children, className = '', ...props }) => (
  <div
    className={`
      bg-white shadow-xl rounded-2xl w-full flex flex-col relative overflow-hidden transition duration-300
      ${className}
    `}
    {...props}
  >
    <div className='absolute inset-0 bg-gradient-to-br from-white via-indigo-50 to-purple-50 opacity-20 animate-bg-gradient-flow-diagonal z-0'></div>
    <div className='relative z-10 h-full flex flex-col'>{children}</div>
  </div>
);

// CardContent component for consistent padding
const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 md:p-8 flex-grow flex flex-col ${className}`}>
    {children}
  </div>
);

// Button component with consistent styling and loading state
const Button = ({ children, className = '', disabled = false, loading = false, ...props }) => (
  <button
    className={`px-6 py-2 rounded-xl bg-black text-white text-sm font-medium transition-all duration-200 transform hover:scale-105 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? (
      <div className='flex items-center gap-2'>
        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
        {children}
      </div>
    ) : (
      children
    )}
  </button>
);

// Input component with polished look
const InputField = ({ label, name, value, onChange, placeholder, type = 'text', rows = 1 }) => (
  <div className="w-full">
    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    {rows > 1 ? (
      <textarea
        name={name}
        value={value || ''}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 
                   bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all duration-200"
      ></textarea>
    ) : (
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 
                   bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all duration-200"
      />
    )}
  </div>
);

// Reusable Select component (using the InputField styling)
const SelectField = ({ label, name, value, onChange, options }) => (
  <div className="w-full">
    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    <select
      name={name}
      value={value || ''}
      onChange={onChange}
      className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 
                 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all duration-200"
    >
      <option value="" disabled>Select an option...</option>
      {options.map(option => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

// --- MAIN COMPONENT ---

export default function EditProposal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();

  const clientTypeOptions = ['Corporate', 'Direct', 'Agency', 'Government'];
  const industryOptions = [
    'Automobile', 'Clothing & Apparel', 'Ecommerce', 'Edtech', 'Entertainment', 'FMCG',
    'Finance', 'Financial Services', 'Healthcare', 'Hospitality', 'IT Industry',
    'Media and Entertainment', 'Movie', 'Real Estate', 'Retail', 'Tourism', 'Other'
  ];

  const [proposal, setProposal] = useState({
    companyName: '',
    clientName: '',
    clientEmail: '',
    clientContactNumber: '',
    clientPanNumber: '',
    clientGstNumber: '',
    clientType: '',
    campaignName: '',
    industry: '',
    description: '',
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/proposals/${id}`);
        if (!response.ok) throw new Error('Proposal not found');
        const data = await response.json();
        setProposal(data);
      } catch (error) {
        console.error('Error fetching proposal:', error);
        toast.error('Failed to load proposal data.');
        navigate('/proposal-dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchProposal();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProposal(prevProposal => ({
      ...prevProposal,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/proposals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposal),
      });
      if (response.ok) {
        toast.success('Proposal updated successfully!');
        navigate(`/proposal/${id}`);
      } else {
        // Attempt to read error message from response body
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update proposal.');
      }
    } catch (error) {
      console.error('Error updating proposal:', error);
      toast.error('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-gray-900 flex flex-col lg:flex-row overflow-hidden">
        <Navbar />
        <main 
            className={`flex-1 flex items-center justify-center p-6 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}
        >
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-500 text-sm mt-3">
              Loading proposal for editing...
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-gray-900 flex flex-col lg:flex-row overflow-hidden">
      <Navbar />
      <main className={`flex-1 w-full overflow-y-auto px-4 md:px-8 py-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        
        <div className="max-w-5xl mx-auto animate-slideDown">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Edit Proposal Details</h1>
            <Button
              onClick={() => navigate(-1)}
              // --- MODIFIED STYLE HERE to match Proposal Details component ---
              className="bg-black text-white hover:bg-gray-800"
              // -----------------------------------------------------------------
            >
              <FaArrowLeft className="inline mr-2"/>
              Back
            </Button>
          </div>
        </div>

        {/* Form Card (using the styled Card component) */}
        <Card className="max-w-5xl mx-auto shadow-2xl animate-slideUp">
          <CardContent>
            <h2 className='text-xl font-bold text-gray-800 mb-6 border-b pb-2'>General Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <InputField label="Company Name" name="companyName" value={proposal.companyName} onChange={handleChange} placeholder="Enter company name" />
              <InputField label="Client Name" name="clientName" value={proposal.clientName} onChange={handleChange} placeholder="Enter client name" />
              <InputField label="Client Email" name="clientEmail" value={proposal.clientEmail} onChange={handleChange} placeholder="Enter client email" type="email" />
              <InputField label="Client Contact Number" name="clientContactNumber" value={proposal.clientContactNumber} onChange={handleChange} placeholder="Enter contact number" type="tel" />
              <InputField label="Client PAN Number" name="clientPanNumber" value={proposal.clientPanNumber} onChange={handleChange} placeholder="Enter PAN number" />
              <InputField label="Client GST Number" name="clientGstNumber" value={proposal.clientGstNumber} onChange={handleChange} placeholder="Enter GST number" />
              <SelectField label="Client Type" name="clientType" value={proposal.clientType} onChange={handleChange} options={clientTypeOptions} />
              <InputField label="Campaign Name" name="campaignName" value={proposal.campaignName} onChange={handleChange} placeholder="Enter campaign name" />
              <SelectField label="Industry" name="industry" value={proposal.industry} onChange={handleChange} options={industryOptions} />

              <div className="col-span-1 md:col-span-2">
                <InputField 
                  label="Description" 
                  name="description" 
                  value={proposal.description} 
                  onChange={handleChange} 
                  rows={4} 
                  placeholder="Enter a description of the proposal or campaign"
                />
              </div>

              <div className="col-span-1 md:col-span-2 flex justify-end pt-4">
                <Button 
                  onClick={handleSave} 
                  className='bg-indigo-600 text-white hover:bg-indigo-700'
                  loading={isSaving}
                >
                  <FaSave className="inline mr-2"/>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Global CSS for Animations */}
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bg-gradient-flow-diagonal { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
        .animate-bg-gradient-flow-diagonal {
          background-size: 200% 200%;
          animation: bg-gradient-flow-diagonal 10s linear infinite;
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
        .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}