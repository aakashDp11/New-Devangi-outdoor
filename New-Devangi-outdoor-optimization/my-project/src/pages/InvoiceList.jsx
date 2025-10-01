import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchInvoices } from '../services/invoiceApi'; 
import LoadingSpinner from '../components/LoadingSpinner';
import { FaFileInvoiceDollar, FaChartLine, FaPlus } from 'react-icons/fa';
import { Toaster, toast } from 'sonner';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ clientId: '', status: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true);
      try {
        const response = await fetchInvoices(filters);
        setInvoices(response.data);
      } catch (err) {
        toast.error("Failed to fetch invoices. Check server connection.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadInvoices();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="max-w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FaFileInvoiceDollar className="text-indigo-600" />
            External Parties Invoices
          </h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => navigate('/invoices/reports')}
              className="bg-gray-700 text-white px-3 py-2 text-sm rounded-lg hover:bg-gray-800 transition duration-150 flex items-center gap-1"
            >
              <FaChartLine /> Reports
            </button>
            <button 
              onClick={() => navigate('/invoices/new')}
              className="bg-indigo-600 text-white px-3 py-2 text-sm rounded-lg hover:bg-indigo-700 transition duration-150 flex items-center gap-1"
            >
              <FaPlus /> New Invoice
            </button>
          </div>
        </div>
        
        {/* Filtering UI */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-md flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            name="clientId" 
            placeholder="Filter by Client ID" 
            value={filters.clientId}
            onChange={handleFilterChange} 
            className="border border-gray-300 p-2 rounded-lg flex-grow focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <select 
            name="status" 
            value={filters.status}
            onChange={handleFilterChange} 
            className="border border-gray-300 p-2 rounded-lg sm:w-48 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="issued">Issued</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Invoice Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-8 text-gray-500">No invoices found.</td></tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/invoices/${inv._id}`)}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">{inv.invoiceNumber}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">{inv.clientId ? inv.clientId.name || inv.clientId._id : 'N/A'}</td> 
                      <td className="px-4 py-4 whitespace-nowrap text-sm">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-right">${inv.totalAmount.toFixed(2)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 text-right">${inv.totalPaid.toFixed(2)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-bold text-right">${inv.balanceDue.toFixed(2)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                          inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                          inv.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                          inv.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <span className="text-indigo-600 hover:text-indigo-900">
                          View
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;