// C:\Users\rajes\Downloads\New-Devangi-outdoor-optimization (5)\New-Devangi-outdoor-optimization\my-project\src\components\InvoiceList.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaFileInvoiceDollar, FaChartBar, FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { getAllInvoices, deleteInvoice } from '../services/invoiceService';

export default function InvoiceList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await getAllInvoices();
      // Sort to show newest first, assuming 'invoiceDate' field
      const sortedData = data.sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate));
      setInvoices(sortedData);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    // UPDATED PATH
    navigate(`/misc-invoices/edit/${id}`);
  };

  const handleView = (id) => {
    // UPDATED PATH
    navigate(`/misc-invoices/view/${id}`);
  };

  const handleDelete = async (id, invoiceNumber) => {
    if (window.confirm(`Are you sure you want to delete Invoice ${invoiceNumber}? This action cannot be undone.`)) {
      try {
        await deleteInvoice(id);
        alert('Invoice deleted successfully');
        fetchInvoices(); // Refresh the list
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      issued: 'bg-blue-100 text-blue-700',
      partial: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || colors.draft;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:ml-24">
        <div className="max-w-7xl mx-auto bg-white p-8 rounded-lg shadow text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full"> {/* Removed p-6 and md:ml-24 */}
      <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8"> {/* Added p-4/p-6 back to inner div for inner spacing */}
        {/* Header and Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FaFileInvoiceDollar className="text-orange-500" /> Invoices
            </h1>
            <p className="text-gray-600 mt-1">Manage and track all client/miscellaneous invoices.</p>
          </div>
          <div className="flex gap-3">
            <button
              // ✅ FIX: Navigate to the correct route for Invoice Reports
              onClick={() => navigate('/reports/invoices')} 
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2"
            >
              <FaChartBar /> View Reports
            </button>
            <button
              // UPDATED PATH
              onClick={() => navigate('/misc-invoices/create')}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2"
            >
              <FaPlus /> Create New Invoice
            </button>
        </div>
        </div>

        {/* Invoice Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No invoices found. Click 'Create New Invoice' to start.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity Name (Type)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance Due</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="font-medium text-gray-900">
                            {invoice.entityName || 'N/A'} 
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                            ({(invoice.entityType || 'N/A').charAt(0).toUpperCase()})
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className={`px-6 py-4 text-sm text-right font-bold ${invoice.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(invoice.balanceDue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <div className="flex justify-center items-center gap-3">
                          <button onClick={() => handleView(invoice._id)} className="text-blue-600 hover:text-blue-900" title="View">
                            <FaEye />
                          </button>
                          <button onClick={() => handleEdit(invoice._id)} className="text-orange-600 hover:text-orange-900" title="Edit">
                            <FaEdit />
                          </button>
                          <button onClick={() => handleDelete(invoice._id, invoice.invoiceNumber)} className="text-red-600 hover:text-red-900" title="Delete">
                            <FaTrash />
                          </button>
                      </div>
                      </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}