import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from './Navbar';
import { useSidebar } from '../context/SidebarContext';

// Reusable Button component
const Button = ({ children, className = '', ...props }) => (
  <button
    className={`px-4 py-2 rounded bg-black text-white transition hover:bg-gray-800 ${className}`}
    {...props}
  >
    {children}
  </button>
);

// Reusable Input component
const Input = ({ label, name, value, onChange, placeholder }) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type="text"
      name={name}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 
                 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    />
  </div>
);

// Reusable Select component
const SelectField = ({ label, name, value, onChange, options }) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <select
      name={name}
      value={value || ''}
      onChange={onChange}
      className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 
                 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
        toast.error('Failed to update proposal.');
      }
    } catch (error) {
      console.error('Error updating proposal:', error);
      toast.error('An error occurred while saving.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading Proposal...</div>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen bg-gray-50 flex lg:flex-row">

      <Navbar />
      <main className={`flex-1 w-full overflow-y-auto px-4 md:px-8 py-6 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        {/* This div centers the form card */}
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg w-full max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold text-gray-900">Edit Proposal</h1>
            <Button
              onClick={() => navigate(-1)}
              className="bg-gray-200 text-black hover:bg-gray-300"
            >
              Back
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Company Name" name="companyName" value={proposal.companyName} onChange={handleChange} placeholder="Enter company name" />
            <Input label="Client Name" name="clientName" value={proposal.clientName} onChange={handleChange} placeholder="Enter client name" />
            <Input label="Client Email" name="clientEmail" value={proposal.clientEmail} onChange={handleChange} placeholder="Enter client email" />
            <Input label="Client Contact Number" name="clientContactNumber" value={proposal.clientContactNumber} onChange={handleChange} placeholder="Enter contact number" />
            <Input label="Client PAN Number" name="clientPanNumber" value={proposal.clientPanNumber} onChange={handleChange} placeholder="Enter PAN number" />
            <Input label="Client GST Number" name="clientGstNumber" value={proposal.clientGstNumber} onChange={handleChange} placeholder="Enter GST number" />
            <SelectField label="Client Type" name="clientType" value={proposal.clientType} onChange={handleChange} options={clientTypeOptions} />
            <Input label="Campaign Name" name="campaignName" value={proposal.campaignName} onChange={handleChange} placeholder="Enter campaign name" />
            <SelectField label="Industry" name="industry" value={proposal.industry} onChange={handleChange} options={industryOptions} />

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={proposal.description || ''}
                onChange={handleChange}
                rows="4"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 
                           focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter a description"
              ></textarea>
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-center pt-4">
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}