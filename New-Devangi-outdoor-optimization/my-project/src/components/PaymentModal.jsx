// C:\Users\rajes\Downloads\New-Devangi-outdoor-optimization (5)\New-Devangi-outdoor-optimization\my-project\src\components\PaymentModal.jsx

import React, { useState } from 'react';
import { FaTimes, FaSave } from 'react-icons/fa';
import { addPayment } from '../services/invoiceService';

export default function PaymentModal({ invoiceId, balanceDue, onClose, onPaymentAdded }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: balanceDue,
    date: new Date().toISOString().split('T')[0],
    mode: 'cash',
    referenceNumber: '',
    documentUrl: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      alert('Payment amount must be greater than 0');
      return;
    }

    if (formData.amount > balanceDue) {
      if (!window.confirm('Payment amount exceeds balance due. Do you want to continue?')) {
        return;
      }
    }

    try {
      setLoading(true);
      await addPayment(invoiceId, {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      alert('Payment added successfully');
      onPaymentAdded();
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Add Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-700">Balance Due</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(balanceDue)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Mode *
            </label>
            <select
              name="mode"
              value={formData.mode}
              onChange={handleInputChange}
              required
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="pdc">PDC (Post Dated Cheque)</option>
              <option value="rtgs">RTGS</option>
              <option value="neft">NEFT</option>
            </select>
          </div>

          {formData.mode !== 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                name="referenceNumber"
                value={formData.referenceNumber}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Transaction/Cheque number"
              />
            </div>
          )}

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

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 disabled:bg-gray-400"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave /> Add Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}