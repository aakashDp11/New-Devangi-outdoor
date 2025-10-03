// C:\Users\rajes\Downloads\New-Devangi-outdoor-optimization (5)\New-Devangi-outdoor-optimization\my-project\src\components\InvoiceView.jsx

import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import { useNavigate, useParams } from 'react-router-dom';
import { FaEdit, FaDownload, FaPrint, FaTimes, FaPlus, FaImage } from 'react-icons/fa'; // Import FaImage
import { getInvoiceById } from '../services/invoiceService';
import PaymentModal from '../components/PaymentModal';

// You will need to install html2canvas: npm install html2canvas
import html2canvas from 'html2canvas';

export default function InvoiceView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Ref to the element you want to capture for PDF/Image
  const invoiceContentRef = useRef(null);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const data = await getInvoiceById(id);
      setInvoice(data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      alert('Failed to load invoice');
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
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

  // 1. Function to handle "Save as PDF" (using browser print dialog)
  const handleSaveAsPDF = () => {
    window.print();
  };

  // 2. Function to handle "Save as Image" (using html2canvas)
  const handleSaveAsImage = async () => {
    if (invoiceContentRef.current) {
      // Temporarily hide elements with 'print:hidden' class to clean up the image
      const hiddenElements = document.querySelectorAll('.print\\:hidden');
      hiddenElements.forEach(el => el.style.display = 'none');
      
      try {
        const canvas = await html2canvas(invoiceContentRef.current, {
          scale: 2, // Higher scale for better quality
          useCORS: true, // If you have images/assets from other domains
        });
        
        // Create an anchor tag to download the image
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `Invoice_${invoice.invoiceNumber}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (error) {
        console.error('Error saving as image:', error);
        alert('Failed to save invoice as image.');
      } finally {
        // Restore the hidden elements display property
        hiddenElements.forEach(el => el.style.display = '');
      }
    }
  };
  
  const handlePaymentAdded = () => {
    setShowPaymentModal(false);
    fetchInvoice(); // Refresh invoice data
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:ml-24">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:ml-24">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600">Invoice not found</p>
          <button
            onClick={() => navigate('/misc-invoices')}
            className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full"> {/* Removed p-6 and md:ml-24 */}
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8"> {/* Added p-4/p-6 back to inner div for inner spacing */}
        {/* Action Bar - Hidden in print */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <button
            onClick={() => navigate('/misc-invoices')}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <FaTimes /> Back to Invoices
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <FaPlus /> Add Payment
            </button>
            <button
              onClick={() => navigate(`/misc-invoices/edit/${id}`)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2"
            >
              <FaEdit /> Edit
            </button>
            {/* New: Save as PDF button */}
            <button
              onClick={handleSaveAsPDF}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2"
            >
              <FaDownload /> Save as PDF
            </button>
            {/* New: Save as Image button */}
            <button
              onClick={handleSaveAsImage}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 flex items-center gap-2"
            >
              <FaImage /> Save as Image
            </button>
          </div>
        </div>

        {/* Invoice Content - ADDED REF HERE */}
        <div ref={invoiceContentRef} className="bg-white rounded-lg shadow p-8">
          {/* Header */}
          <div className="border-b pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
                <p className="text-gray-600 mt-1">#{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Billing Details: UPDATED SECTION */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              {/* Display Entity Type */}
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                BILLED TO ({invoice.entityType ? invoice.entityType.toUpperCase() : 'ENTITY'})
              </h3>
              {/* Display Entity Name */}
              <p className="text-lg font-semibold text-gray-900">
                {invoice.entityName || 'N/A'}
              </p>
              {/* Removed obsolete invoice.clientId?.email and phone checks */}
            </div>
            <div className="text-right">
              <div className="mb-3">
                <p className="text-sm text-gray-600">Invoice Date</p>
                <p className="font-semibold">{formatDate(invoice.invoiceDate)}</p>
              </div>
              {invoice.dueDate && (
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="font-semibold">{formatDate(invoice.dueDate)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <table className="w-full">
              <thead className="border-b-2 border-gray-200">
                <tr>
                  <th className="text-left py-3 text-sm font-semibold text-gray-700">Description</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-700">Quantity</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-700">Rate</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 text-gray-900">{item.description}</td>
                    <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-600">{formatCurrency(item.rate)}</td>
                    <td className="py-3 text-right text-gray-900">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-2 text-gray-700">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between py-2 text-gray-700">
                <span>GST ({invoice.gstRate}%):</span>
                <span>{formatCurrency(invoice.gstAmount)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-200 text-lg font-bold text-gray-900">
                <span>Total:</span>
                <span>{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between py-2 text-green-600">
                <span>Paid:</span>
                <span className="font-semibold">{formatCurrency(invoice.totalPaid)}</span>
              </div>
              <div className="flex justify-between py-2 text-red-600 font-bold">
                <span>Balance Due:</span>
                <span>{formatCurrency(invoice.balanceDue)}</span>
              </div>
            </div>
          </div>

          {/* Payments History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="border-t pt-6 print:hidden">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoice.payments.map((payment, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(payment.date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 uppercase">
                          {payment.mode}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {payment.referenceNumber || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                          {formatCurrency(payment.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Credit Notes */}
          {invoice.creditNotes && invoice.creditNotes.length > 0 && (
            <div className="border-t pt-6 mt-6 print:hidden">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Notes</h3>
              <div className="space-y-2">
                {invoice.creditNotes.map((note, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-700">{note.noteNumber}</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(note.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          invoiceId={id}
          balanceDue={invoice.balanceDue}
          onClose={() => setShowPaymentModal(false)}
          onPaymentAdded={handlePaymentAdded}
        />
      )}
    </div>
  );
}