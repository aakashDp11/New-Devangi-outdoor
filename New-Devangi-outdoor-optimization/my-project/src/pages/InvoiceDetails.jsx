import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchInvoiceById, updateInvoice, addPayment, deleteInvoice, createInvoice } from '../services/invoiceApi';
import LoadingSpinner from '../components/LoadingSpinner';
import { Toaster, toast } from 'sonner';

const initialNewInvoice = {
    invoiceNumber: '', // Should be set by user or backend logic
    clientId: '', // Link to Client ID (e.g., ObjectId string)
    // Add date fields here for clean state initialization
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    lineItems: [{ description: 'Service', quantity: 1, rate: 0 }],
    gstRate: 18,
};

const initialPayment = { amount: 0, mode: 'cash', referenceNumber: '' };

const InvoiceDetails = () => {
    const { id } = useParams();
    const isNew = id === undefined || id === 'new';
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newPayment, setNewPayment] = useState(initialPayment);
    const [isEditing, setIsEditing] = useState(isNew);
    const [editData, setEditData] = useState(isNew ? initialNewInvoice : {});

    // Helper to extract client name for display
    const getClientName = (data) => {
        if (!data) return 'N/A';
        // Assumes clientDetails model has a 'name' field and is populated
        if (data.clientId && typeof data.clientId === 'object' && data.clientId.name) {
            return data.clientId.name;
        }
        // Fallback to client ID if not populated or no name field
        return data.clientId || 'Unspecified Client';
    };

    // Helper to calculate line item amount on the frontend for immediate feedback
    // The backend's pre-save hook dictates the final amount, but this is for UI.
    const calculateLineItemAmount = useCallback((item) => {
        // Line items use (quantity * rate) if 'amount' is null/undefined
        return (item.amount || (item.quantity * item.rate) || 0);
    }, []);

    const loadInvoice = useCallback(async () => {
        if (!isNew) {
            try {
                const response = await fetchInvoiceById(id);
                setInvoice(response.data);
                // IMPORTANT: Use response.data for initial editData
                // Mongoose pre-save hook ensures the populated data is correct.
                // Format dates for input fields
                const dataWithFormattedDates = {
                    ...response.data,
                    invoiceDate: response.data.invoiceDate ? new Date(response.data.invoiceDate).toISOString().split('T')[0] : '',
                    dueDate: response.data.dueDate ? new Date(response.data.dueDate).toISOString().split('T')[0] : '',
                };
                setEditData(dataWithFormattedDates); 
            } catch (err) {
                toast.error("Failed to load invoice.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, [id, isNew]);

    useEffect(() => {
        loadInvoice();
    }, [loadInvoice]);

    // Handler for invoice header fields
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    // Handler for line items (Refactored to rely on backend calculation for 'amount')
    const handleLineItemChange = (index, field, value) => {
        const updatedItems = [...editData.lineItems];
        // Only update description, quantity, or rate. The actual 'amount' field (if present) is ignored for calculation.
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        
        // REFACTOR: We no longer try to set the 'amount' field based on quantity/rate here.
        // The backend's pre-save hook handles the total line item amount calculation.

        setEditData({ ...editData, lineItems: updatedItems });
    };

    const handleSave = async () => {
        try {
            // Ensure fields like gstRate are converted to numbers if they exist
            const dataToSave = { 
                ...editData, 
                gstRate: Number(editData.gstRate) // Ensure GST is numeric
            };

            let response;
            if (isNew) {
                response = await createInvoice(dataToSave);
                toast.success('Invoice created successfully!');
                navigate(`/invoices/${response.data._id}`); // Redirect to the new invoice detail page
            } else {
                response = await updateInvoice(id, dataToSave); 
                toast.success('Invoice updated successfully!');
                
                // Re-fetch or update state cleanly after save
                const dataWithFormattedDates = {
                    ...response.data,
                    invoiceDate: response.data.invoiceDate ? new Date(response.data.invoiceDate).toISOString().split('T')[0] : '',
                    dueDate: response.data.dueDate ? new Date(response.data.dueDate).toISOString().split('T')[0] : '',
                };
                setInvoice(response.data);
                setEditData(dataWithFormattedDates); // Update edit data from server response
                setIsEditing(false);
            }
        } catch (err) {
            toast.error('Error saving invoice. Check required fields or server logic.');
            console.error(err);
        }
    };

    const handlePaymentChange = (e) => {
        const { name, value, type } = e.target;
        setNewPayment({ 
            ...newPayment, 
            [name]: type === 'number' ? Number(value) : value 
        });
    };

    const handleAddPayment = async () => {
        if (!newPayment.amount || newPayment.amount <= 0 || !newPayment.mode) {
            return toast.error("Please enter a valid amount and mode.");
        }
        try {
            const response = await addPayment(id, newPayment);
            setInvoice(response.data);
            
            // Re-update edit data with formatted dates from server
            const dataWithFormattedDates = {
                ...response.data,
                invoiceDate: response.data.invoiceDate ? new Date(response.data.invoiceDate).toISOString().split('T')[0] : '',
                dueDate: response.data.dueDate ? new Date(response.data.dueDate).toISOString().split('T')[0] : '',
            };
            setEditData(dataWithFormattedDates); 
            
            setNewPayment(initialPayment); // Reset payment form
            toast.success('Payment recorded successfully!');
        } catch (err) {
            toast.error('Error adding payment. Check server validation.');
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
            try {
                await deleteInvoice(id);
                toast.success('Invoice deleted successfully!');
                navigate('/invoices');
            } catch (err) {
                toast.error('Error deleting invoice.');
                console.error(err);
            }
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!isNew && !invoice) return <div className="p-6">Invoice not found.</div>;

    const currentData = isEditing ? editData : invoice;

    return (
        // Outer container using increased padding (p-6) only for left/right margins
        <div className="p-4 sm:px-6 md:px-8 py-4 bg-gray-50 min-h-screen">
            <Toaster position="top-right" />
            {/* REMOVED: max-w-7xl mx-auto container */}
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 border-b pb-2">
                    {isNew ? 'Create New Invoice' : `Invoice #${invoice.invoiceNumber}`}
                </h2>
                
                <div className="bg-white p-6 rounded-lg shadow-xl">
                    {/* Header Actions & Status */}
                    <div className="mb-4 flex justify-between items-start border-b pb-4">
                        <div className="space-x-2">
                            {/* Standardized primary action to green for 'Save/Create' */}
                            {isEditing && (
                                <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                                    {isNew ? 'Create Invoice' : 'Save Changes'}
                                </button>
                            )}
                            {!isNew && (
                                <button 
                                    onClick={() => setIsEditing(prev => !prev)} 
                                    className={`px-4 py-2 rounded-lg transition duration-150 ${isEditing ? 'bg-gray-400 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                >
                                    {isEditing ? 'Cancel Edit' : 'Edit Details'}
                                </button>
                            )}
                            {!isNew && (
                                <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                                    Delete
                                </button>
                            )}
                        </div>

                        <div className="text-right flex flex-col items-end">
                            {!isNew && <p className="text-sm text-gray-500">Status: <span className="font-bold text-lg text-indigo-700 capitalize">{invoice.status}</span></p>}
                            {!isNew && <p className="text-xl font-bold text-red-600">Balance Due: ${invoice.balanceDue.toFixed(2)}</p>}
                        </div>
                    </div>

                    {/* Invoice Details Grid: Now stretches wider */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {/* Invoice Number */}
                        <label className="block">
                            <span className="text-gray-700 text-sm font-medium">Invoice Number:</span>
                            <input 
                                type="text" 
                                name="invoiceNumber" 
                                value={currentData.invoiceNumber || ''} 
                                onChange={handleEditChange} 
                                readOnly={!isNew} 
                                required 
                                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 text-sm ${!isNew ? 'bg-gray-100' : 'bg-white'}`} 
                            />
                        </label>
                        {/* Client ID/Name */}
                        <label className="block">
                            <span className="text-gray-700 text-sm font-medium">Client:</span>
                            {isEditing ? (
                                <input 
                                    type="text" 
                                    name="clientId" 
                                    value={currentData.clientId?._id || currentData.clientId || ''} 
                                    onChange={handleEditChange} 
                                    required 
                                    placeholder="Enter Client ID"
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 text-sm" 
                                />
                            ) : (
                                <p className="mt-1 p-2 bg-gray-100 rounded-md shadow-sm text-sm font-semibold">
                                    {getClientName(invoice)}
                                </p>
                            )}
                        </label>
                        {/* Invoice Date */}
                        <label className="block">
                            <span className="text-gray-700 text-sm font-medium">Invoice Date:</span>
                            <input 
                                type="date" 
                                name="invoiceDate" 
                                value={currentData.invoiceDate || ''} 
                                onChange={handleEditChange} 
                                readOnly={!isEditing} 
                                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 text-sm ${!isEditing ? 'bg-gray-100' : 'bg-white'}`}
                            />
                        </label>
                        {/* Due Date */}
                        <label className="block">
                            <span className="text-gray-700 text-sm font-medium">Due Date:</span>
                            <input 
                                type="date" 
                                name="dueDate" 
                                value={currentData.dueDate || ''} 
                                onChange={handleEditChange} 
                                readOnly={!isEditing} 
                                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 text-sm ${!isEditing ? 'bg-gray-100' : 'bg-white'}`}
                            />
                        </label>
                    </div>

                    {/* Line Items Table */}
                    <h3 className="text-xl font-semibold mb-3 border-t pt-4">Line Items</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 mb-4 border border-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">Qty</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-24">Rate</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-24">Amount</th>
                                    {isEditing && <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-10"></th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentData.lineItems.map((item, index) => (
                                    <tr key={index}>
                                        <td className="p-2">
                                            <input 
                                                type="text" 
                                                value={item.description || ''} 
                                                onChange={(e) => handleLineItemChange(index, 'description', e.target.value)} 
                                                readOnly={!isEditing} 
                                                className={`w-full border p-1 text-sm ${!isEditing ? 'bg-gray-50 border-transparent' : 'border-gray-300'}`}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input 
                                                type="number" 
                                                value={item.quantity || 0} 
                                                onChange={(e) => handleLineItemChange(index, 'quantity', Number(e.target.value))} 
                                                readOnly={!isEditing} 
                                                className={`w-full border p-1 text-center text-sm ${!isEditing ? 'bg-gray-50 border-transparent' : 'border-gray-300'}`} 
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input 
                                                type="number" 
                                                value={item.rate || 0} 
                                                onChange={(e) => handleLineItemChange(index, 'rate', Number(e.target.value))} 
                                                readOnly={!isEditing} 
                                                className={`w-full border p-1 text-right text-sm ${!isEditing ? 'bg-gray-50 border-transparent' : 'border-gray-300'}`} 
                                            />
                                        </td>
                                        {/* Display amount using helper function, always read-only */}
                                        <td className="p-2 font-medium text-right text-sm bg-gray-50">
                                            ${calculateLineItemAmount(item).toFixed(2)}
                                        </td>
                                        {isEditing && (
                                            <td className="p-2 text-center">
                                                <button 
                                                    onClick={() => setEditData(prev => ({ ...prev, lineItems: prev.lineItems.filter((_, i) => i !== index) }))} 
                                                    className="text-red-500 hover:text-red-700 text-lg"
                                                >
                                                    &times;
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {isEditing && (
                        <button 
                            onClick={() => setEditData(prev => ({ ...prev, lineItems: [...prev.lineItems, { description: '', quantity: 1, rate: 0 }] }))} 
                            className="text-indigo-600 hover:text-indigo-900 font-medium p-2 text-sm"
                        >
                            + Add Item
                        </button>
                    )}

                    {/* Summary & Totals: Adjusted to align right within the full width container */}
                    <div className="mt-6 border-t pt-4 flex justify-end">
                        <div className="w-80 space-y-2 text-sm">
                            <p className="flex justify-between">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium text-gray-800">${currentData.subtotal ? currentData.subtotal.toFixed(2) : '0.00'}</span>
                            </p>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">GST ({isEditing ? (
                                    <input 
                                        type="number" 
                                        name="gstRate" 
                                        value={editData.gstRate} 
                                        onChange={handleEditChange} 
                                        className="w-12 border border-gray-300 px-1 text-right text-sm" 
                                        required
                                    />
                                ) : currentData.gstRate}%):</span>
                                <span className="font-medium text-indigo-600">${currentData.gstAmount ? currentData.gstAmount.toFixed(2) : '0.00'}</span>
                            </div>
                            <p className="flex justify-between text-lg font-bold border-t pt-2">
                                <span>Total Amount:</span>
                                <span className="text-green-600">${currentData.totalAmount ? currentData.totalAmount.toFixed(2) : '0.00'}</span>
                            </p>
                        </div>
                    </div>

                    {/* Payments Section (Only for existing invoices) */}
                    {!isNew && (
                        <div className="mt-8 border-t pt-6">
                            <h3 className="text-xl font-semibold mb-3">Payments (Total Paid: ${invoice.totalPaid.toFixed(2)})</h3>
                            <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-2 text-sm">
                                {invoice.payments.length === 0 ? (
                                    <li className="text-gray-500">No payments recorded yet.</li>
                                ) : (
                                    invoice.payments.map((p, index) => (
                                        <li key={index} className="flex justify-between bg-green-50/50 p-2 rounded-md border border-green-200">
                                            <span className="font-semibold text-green-800">${p.amount.toFixed(2)}</span>
                                            <span className="text-gray-600">Mode: <span className="font-medium capitalize">{p.mode}</span> | Date: {new Date(p.date).toLocaleDateString()} (Ref: {p.referenceNumber || 'N/A'})</span>
                                        </li>
                                    ))
                                )}
                            </ul>

                            <div className="p-4 border rounded-lg grid grid-cols-4 gap-3 items-end bg-indigo-50/50">
                                <input 
                                    type="number" 
                                    name="amount" 
                                    placeholder="Amount" 
                                    value={newPayment.amount} 
                                    onChange={handlePaymentChange} 
                                    required 
                                    className="border border-gray-300 p-2 rounded-md text-sm" 
                                />
                                <select 
                                    name="mode" 
                                    value={newPayment.mode} 
                                    onChange={handlePaymentChange} 
                                    required 
                                    className="border border-gray-300 p-2 rounded-md text-sm"
                                >
                                    {['cash', 'cheque', 'pdc', 'rtgs', 'neft'].map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                                </select>
                                <input 
                                    type="text" 
                                    name="referenceNumber" 
                                    placeholder="Reference No." 
                                    value={newPayment.referenceNumber} 
                                    onChange={handlePaymentChange} 
                                    className="border border-gray-300 p-2 rounded-md text-sm" 
                                />
                                <button 
                                    onClick={handleAddPayment} 
                                    className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 text-sm"
                                >
                                    Record Payment
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetails;