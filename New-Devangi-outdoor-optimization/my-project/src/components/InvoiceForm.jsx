import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPlus, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import { createInvoice, updateInvoice, getInvoiceById } from '../services/invoiceService';

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [entityType, setEntityType] = useState('client');
  const [entityName, setEntityName] = useState('');

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    lineItems: [
      { description: '', quantity: '1', rate: '0', amount: '0', manualAmount: false },
    ],
    gstRate: 18,
    status: 'draft',
    documentUrl: '',
  });

  useEffect(() => {
    if (isEditMode) {
      fetchInvoice();
    }
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const data = await getInvoiceById(id);

      setEntityType(data.entityType || 'client');
      setEntityName(data.entityName || '');

      setFormData({
        ...data,
        // Convert numbers to strings for editing
        lineItems: data.lineItems.map((item) => ({
          ...item,
          quantity: item.quantity?.toString() || '',
          rate: item.rate?.toString() || '',
          amount: item.amount?.toString() || '',
          manualAmount: false,
        })),
        invoiceDate: new Date(data.invoiceDate).toISOString().split('T')[0],
        dueDate: data.dueDate
          ? new Date(data.dueDate).toISOString().split('T')[0]
          : '',
      });
    } catch (error) {
      console.error('Error fetching invoice:', error);
      alert('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEntityTypeChange = (e) => {
    const newType = e.target.value;
    setEntityType(newType);
    setEntityName('');
  };

  const handleLineItemChange = (index, field, value) => {
    const updatedItems = [...formData.lineItems];

    // Handle 'description' field separately as it's a string
    if (field === 'description') {
      updatedItems[index][field] = value;
      setFormData((prev) => ({ ...prev, lineItems: updatedItems }));
      return;
    }

    // For numeric fields (quantity, rate, amount):
    // Keep the value as a string to allow editing
    if (field === 'amount') {
      updatedItems[index].amount = value; // Store as string directly
      updatedItems[index].manualAmount = true; // mark overridden
    } else {
      // Handles 'quantity' and 'rate'
      updatedItems[index][field] = value; // Store as string

      // Recalculate amount only if user hasn't overridden
      if (!updatedItems[index].manualAmount) {
        const quantity = parseFloat(updatedItems[index].quantity) || 0;
        const rate = parseFloat(updatedItems[index].rate) || 0;
        
        // Calculate and store as string for consistency
        updatedItems[index].amount = (quantity * rate).toString();
      }
    }

    setFormData((prev) => ({ ...prev, lineItems: updatedItems }));
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { description: '', quantity: '1', rate: '0', amount: '0', manualAmount: false },
      ],
    }));
  };

  const removeLineItem = (index) => {
    if (formData.lineItems.length > 1) {
      setFormData((prev) => ({
        ...prev,
        lineItems: prev.lineItems.filter((_, i) => i !== index),
      }));
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.lineItems.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );
    const gstAmount = (subtotal * formData.gstRate) / 100;
    const totalAmount = subtotal + gstAmount;
    return { subtotal, gstAmount, totalAmount };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!entityName.trim()) {
      alert(`Please enter the ${entityLabels[entityType]}.`);
      return;
    }

    if (formData.lineItems.length === 0 || !formData.lineItems[0].description) {
      alert('Please add at least one line item');
      return;
    }
    
    // Clean up line items before sending: convert strings to numbers
    const cleanedLineItems = formData.lineItems.map(item => ({
      description: item.description,
      quantity: parseFloat(item.quantity) || 0,
      rate: parseFloat(item.rate) || 0,
      amount: parseFloat(item.amount) || 0,
    }));
    
    const dataToSend = {
      ...formData,
      lineItems: cleanedLineItems,
      entityType,
      entityName,
      clientId: undefined,
    };

    try {
      setLoading(true);
      if (isEditMode) {
        await updateInvoice(id, dataToSend);
        alert('Invoice updated successfully');
      } else {
        await createInvoice(dataToSend);
        alert('Invoice created successfully');
      }
      navigate('/misc-invoices');
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, gstAmount, totalAmount } = calculateTotals();

  const entityLabels = {
    client: 'Client Name',
    vendor: 'Vendor Name',
    agency: 'External Agency Name',
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Edit Invoice' : 'Create New Invoice'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode
                ? 'Update invoice details'
                : 'Fill in the details to create a new invoice'}
            </p>
          </div>
          <button
            onClick={() => navigate('/misc-invoices')}
            className="text-gray-600 hover:text-gray-900"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {loading && !isEditMode ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Details */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Invoice Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="INV-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entity Type *
                  </label>
                  <select
                    name="entityType"
                    value={entityType}
                    onChange={handleEntityTypeChange}
                    required
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="client">Client</option>
                    <option value="vendor">Vendor</option>
                    <option value="agency">External Agency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {entityLabels[entityType]} *
                  </label>
                  <input
                    type="text"
                    name="entityName"
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    required
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder={`Enter ${entityLabels[entityType]}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    name="invoiceDate"
                    value={formData.invoiceDate}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="issued">Issued</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Rate (%)
                  </label>
                  <input
                    type="number"
                    name="gstRate"
                    value={formData.gstRate}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              
            </div>

            {/* Line Items */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Line Items</h2>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2"
                >
                  <FaPlus /> Add Item
                </button>
              </div>

              <div className="space-y-4">
                {formData.lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-12 md:col-span-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleLineItemChange(index, 'description', e.target.value)
                        }
                        required
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Item description"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleLineItemChange(
                            index,
                            'quantity',
                            e.target.value
                          )
                        }
                        min="0"
                        step="0.01"
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rate (₹)
                      </label>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) =>
                          handleLineItemChange(
                            index,
                            'rate',
                            e.target.value
                          )
                        }
                        min="0"
                        step="0.01"
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) =>
                          handleLineItemChange(
                            index,
                            'amount',
                            e.target.value
                          )
                        }
                        step="0.01"
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        disabled={formData.lineItems.length === 1}
                        className="text-red-600 hover:text-red-800 disabled:text-gray-300 p-2"
                        title="Remove item"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
              <div className="space-y-3 max-w-md ml-auto">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>GST ({formData.gstRate}%):</span>
                  <span className="font-semibold">₹{gstAmount.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total Amount:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Document URL */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Additional Information
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document URL (Optional)
                </label>
                <input
                  type="url"
                  name="documentUrl"
                  value={formData.documentUrl}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => navigate('/misc-invoices')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2 disabled:bg-gray-400"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave /> {isEditMode ? 'Update Invoice' : 'Create Invoice'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
      
    </div>
  );
}