import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { PipelineContext } from '../../context/PipelineContext';

const PaymentStatusForm = ({ campaignId, onConfirm, onClose, existingData }) => {
  const [payments, setPayments] = useState([]);
  const [gstValue, setGstValue] = useState('');
  const [costBreakdown, setCostBreakdown] = useState({
    display: 0,
    printing: 0,
    mounting: 0,
    totalBeforeGST: 0,
    finalWithGST: 0,
  });
  const [validationErrors, setValidationErrors] = useState({});

  const [paymentDue, setPaymentDue] = useState(0);
  const username = localStorage.getItem('userName');
  const useremail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');
  const { pipelineData, setPipelineData } = useContext(PipelineContext);

  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  // Validation functions
  const validateAmount = (amount) => {
    if (!amount || amount.trim() === '') return 'Amount is required';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 'Amount must be a valid number';
    if (numAmount <= 0) return 'Amount must be greater than 0';
    // Check for more than 2 decimal places
    if (amount.includes('.') && amount.split('.')[1].length > 2) {
      return 'Amount can have maximum 2 decimal places';
    }
    return null;
  };

  const validateReferenceNumber = (refNum, modeOfPayment) => {
    if (!refNum || refNum.trim() === '') {
      if (modeOfPayment === 'cash') return null; // Reference number optional for cash
      return 'Reference number is required for this payment mode';
    }
    if (refNum.length < 3) return 'Reference number must be at least 3 characters';
    if (refNum.length > 50) return 'Reference number must be less than 50 characters';
    // Check for special characters (allow alphanumeric, hyphens, underscores)
    if (!/^[A-Za-z0-9\-_]+$/.test(refNum)) {
      return 'Reference number can only contain letters, numbers, hyphens, and underscores';
    }
    return null;
  };

  const validateGST = (gst) => {
    if (!gst || gst.trim() === '') return null; // GST is optional
    const numGst = parseFloat(gst);
    if (isNaN(numGst)) return 'GST must be a valid number';
    if (numGst < 0) return 'GST cannot be negative';
    // Check for more than 2 decimal places
    if (gst.includes('.') && gst.split('.')[1].length > 2) {
      return 'GST can have maximum 2 decimal places';
    }
    return null;
  };

  const validatePaymentRecord = (payment, index) => {
    const errors = {};
    
    const amountError = validateAmount(payment.amount);
    if (amountError) errors[`amount_${index}`] = amountError;

    const refError = validateReferenceNumber(payment.referenceNumber, payment.modeOfPayment);
    if (refError) errors[`referenceNumber_${index}`] = refError;

    return errors;
  };

  const validateAllPayments = () => {
    let allErrors = {};
    
    // Validate GST
    const gstError = validateGST(gstValue);
    if (gstError) allErrors.gst = gstError;

    // Validate each payment
    payments.forEach((payment, index) => {
      if (!payment.locked) { // Only validate unlocked payments
        const paymentErrors = validatePaymentRecord(payment, index);
        allErrors = { ...allErrors, ...paymentErrors };
      }
    });

    // Check for duplicate reference numbers (non-cash payments)
    const nonCashPayments = payments.filter(p => p.modeOfPayment !== 'cash' && p.referenceNumber);
    const refNumbers = nonCashPayments.map(p => p.referenceNumber.toLowerCase());
    const duplicateRefs = refNumbers.filter((ref, index) => refNumbers.indexOf(ref) !== index);
    
    if (duplicateRefs.length > 0) {
      allErrors.duplicateRef = 'Duplicate reference numbers found for non-cash payments';
    }

    setValidationErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  useEffect(() => {
    const fetchPipelinePayment = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}`);
        const data = existingData || res.data?.payment || {};
        console.log("Payment data is ",data);
        
        if (Array.isArray(data.payments)) {
          const enriched = data.payments.map(p => ({
            amount: p.amount || '',
            date: p.date || '',
            modeOfPayment: p.modeOfPayment || 'cash',
            referenceNumber: p.referenceNumber || '',
            documentUrl: p.documentUrl || '',
            locked: true, // All previously saved records are locked by default
          }));
          setPayments(enriched);
        }

        const campaignCosts = res.data?.campaign?.inventoryCosts || [];
        let totalDisplay = data.displayAmount;
        let totalPrinting = data.printingAmount;
        let totalMounting = data.mountingAmount;

        const totalBeforeGST = totalDisplay + totalPrinting + totalMounting;
        const savedGst = data.gstValue || 0;
        setGstValue(savedGst);

        const finalWithGST = totalBeforeGST + parseFloat(savedGst || 0);

        setCostBreakdown({
          display: totalDisplay,
          printing: totalPrinting,
          mounting: totalMounting,
          totalBeforeGST,
          finalWithGST,
        });

      } catch (err) {
        console.error('Failed to fetch payment data:', err);
      }
    };

    fetchPipelinePayment();
  }, [campaignId, existingData]);

  useEffect(() => {
    const newFinal = costBreakdown.totalBeforeGST + parseFloat(gstValue || 0);
    setCostBreakdown(prev => ({
      ...prev,
      finalWithGST: newFinal,
    }));
    setPaymentDue(newFinal - totalPaid);
  }, [gstValue, payments, costBreakdown.totalBeforeGST, totalPaid]);

  // Real-time validation on input change
  useEffect(() => {
    const timer = setTimeout(() => {
      validateAllPayments();
    }, 500); // Debounce validation
    
    return () => clearTimeout(timer);
  }, [payments, gstValue]);

  const handleAddPayment = () => {
    setPayments([...payments, {
      amount: '',
      date: '',
      modeOfPayment: 'cash',
      referenceNumber: '',
      documentUrl: '',
      locked: false, // New records are unlocked for data entry
    }]);
  };

  const handleDeletePayment = index => {
    const updated = payments.filter((_, idx) => idx !== index);
    setPayments(updated);
    // Clear validation errors for deleted payment
    const newErrors = { ...validationErrors };
    delete newErrors[`amount_${index}`];
    delete newErrors[`referenceNumber_${index}`];
    setValidationErrors(newErrors);
  };

  const handlePaymentChange = (index, field, value) => {
    const updated = [...payments];
    updated[index][field] = value;
    setPayments(updated);
  };

  const handleGSTChange = (value) => {
    setGstValue(value);
  };

  const handleFileUpload = async (index, file) => {
    // File validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/gif'];
    
    if (file.size > maxSize) {
      toast.error('File size should be less than 5MB');
      return;
    }
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPEG, JPG, PNG, and GIF files are allowed');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    try {
      const uploadRes = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/payment/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      const updated = [...payments];
      updated[index].documentUrl = uploadRes.data.documentUrl;
      setPayments(updated);
      toast.success('File uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload file');
      console.error(err);
    }
  };

  const handleSave = async () => {
    // Validate before saving
    if (!validateAllPayments()) {
      toast.error('Please fix all validation errors before saving');
      return;
    }

    const previousPaymentStatus = { ...pipelineData?.payment };

    if (totalPaid > costBreakdown.finalWithGST && costBreakdown.finalWithGST > 0) {
      toast.error('❌ Total paid exceeds the final amount (with GST)!');
      return;
    }

    // Check if there are any unlocked payments without amounts
    const unlockedPayments = payments.filter(p => !p.locked);
    const emptyPayments = unlockedPayments.filter(p => !p.amount || p.amount.trim() === '');
    
    if (emptyPayments.length > 0) {
      toast.error('Please fill all payment amounts or remove empty payment records');
      return;
    }

    const cleanedPayments = payments.map(({ locked, ...rest }) => rest);

    const newPaymentStatus = {
      displayAmount: costBreakdown.display,
      printingAmount: costBreakdown.printing,
      mountingAmount: costBreakdown.mounting,
      gstValue: parseFloat(gstValue || 0),
      finalAmountWithGST: costBreakdown.finalWithGST,
      payments: cleanedPayments,
      totalPaid,
      paymentDue,
    };

    const changeLogData = {
      campaignId,
      userId,
      changeType: 'Payment Status Update',
      userName: username,
      userEmail: useremail,
      previousValue: previousPaymentStatus,
      newValue: newPaymentStatus,
    };

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log`, changeLogData);
      const res = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/payment`,
        newPaymentStatus
      );
      setPipelineData(res.data);
      toast.success('Payment details saved!');
      onConfirm();
    } catch (err) {
      console.error('Error saving payment:', err);
      toast.error('Failed to save payment details.');
    }
  };
  
  const invoiceTotal = Array.isArray(pipelineData?.invoice) ? pipelineData.invoice.reduce((sum, inv) => sum + (inv.invoiceValue || 0), 0) : 0;
  const cashMemoTotal = Array.isArray(pipelineData?.cashMemo) ? pipelineData.cashMemo.reduce((sum, memo) => sum + (memo.value || 0), 0) : 0;
  const creditNoteTotal = Array.isArray(pipelineData?.creditNote) ? pipelineData.creditNote.reduce((sum, note) => sum + (note.value || 0), 0) : 0;
  const calculatedInvoiceValue = invoiceTotal + cashMemoTotal - creditNoteTotal;
  const mismatchWarning = Math.abs(calculatedInvoiceValue - costBreakdown.finalWithGST) > 1;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Payment Status</h2>

      <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-md border">
        <p><strong>Total Display Cost:</strong> ₹{costBreakdown.display}</p>
        <p><strong>Total Printing Cost:</strong> ₹{costBreakdown.printing}</p>
        <p><strong>Total Mounting Cost:</strong> ₹{costBreakdown.mounting}</p>
        <p><strong>Total Before GST:</strong> ₹{costBreakdown.totalBeforeGST.toFixed(2)}</p>
        <div>
          <p>
            <strong>GST Value:</strong>
            <input 
              type="number" 
              min="0" 
              step="0.01"
              className={`ml-2 border px-2 py-1 rounded w-[100px] ${validationErrors.gst ? 'border-red-500' : ''}`}
              value={gstValue} 
              onChange={e => handleGSTChange(e.target.value)} 
              placeholder="Enter GST"
            />
          </p>
          {validationErrors.gst && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.gst}</p>
          )}
        </div>
        <p><strong>Final Amount with GST:</strong> ₹{costBreakdown.finalWithGST.toFixed(2)}</p>
      </div>

      {validationErrors.duplicateRef && (
        <div className="bg-red-100 text-red-800 text-xs font-medium p-3 rounded-md border border-red-300">
          ⚠ {validationErrors.duplicateRef}
        </div>
      )}

      <div>
        <h3 className="font-semibold text-gray-700 mb-2">Payment Records</h3>
        {payments.map((payment, idx) => (
          <div key={idx} className="border p-3 mb-3 rounded-md space-y-2 bg-gray-50 relative">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="w-full sm:w-[30%]">
                <label className="text-xs text-gray-500">Amount *</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Amount (₹)" 
                  value={payment.amount} 
                  onChange={e => handlePaymentChange(idx, 'amount', e.target.value)} 
                  className={`w-full border rounded-md px-3 py-2 ${validationErrors[`amount_${idx}`] ? 'border-red-500' : ''}`}
                  readOnly={payment.locked} 
                />
                {validationErrors[`amount_${idx}`] && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors[`amount_${idx}`]}</p>
                )}
              </div>
              <div className="w-full sm:w-[30%]">
                <label className="text-xs text-gray-500">Date</label>
                <input 
                  type="date" 
                  value={payment.date ? new Date(payment.date).toISOString().split('T')[0] : ''} 
                  onChange={e => handlePaymentChange(idx, 'date', e.target.value)} 
                  className="w-full border rounded-md px-3 py-2" 
                  disabled={payment.locked} 
                />
              </div>
              <div className="w-full sm:w-[30%]">
                <label className="text-xs text-gray-500">Mode of Payment</label>
                <select 
                  value={payment.modeOfPayment} 
                  onChange={e => handlePaymentChange(idx, 'modeOfPayment', e.target.value)} 
                  className="w-full border rounded-md px-3 py-2" 
                  disabled={payment.locked}
                >
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="pdc">PDC</option>
                  <option value="rtgs">RTGS</option>
                  <option value="neft">NEFT</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-2">
              <div className="w-full sm:w-[30%]">
                <label className="text-xs text-gray-500">
                  Reference Number {payment.modeOfPayment !== 'cash' && '*'}
                </label>
                <input 
                  type="text" 
                  placeholder="Reference Number" 
                  value={payment.referenceNumber} 
                  onChange={e => handlePaymentChange(idx, 'referenceNumber', e.target.value)} 
                  className={`w-full border rounded-md px-3 py-2 ${validationErrors[`referenceNumber_${idx}`] ? 'border-red-500' : ''}`}
                  readOnly={payment.locked} 
                />
                {validationErrors[`referenceNumber_${idx}`] && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors[`referenceNumber_${idx}`]}</p>
                )}
              </div>
              <div className="w-full sm:w-[48%]">
                <label className="text-xs text-gray-500">Document (Optional)</label>
                {payment.documentUrl && payment.locked && (
                  <p className="text-xs text-blue-600 mt-1">
                    <a href={payment.documentUrl} target="_blank" rel="noopener noreferrer">View Uploaded File</a>
                  </p>
                )}
                {!payment.locked && (
                  <div>
                    <input 
                      type="file" 
                      onChange={e => { if (e.target.files[0]) handleFileUpload(idx, e.target.files[0]); }} 
                      className="w-full text-sm" 
                      accept=".pdf,.jpg,.jpeg,.png,.gif"
                    />
                    <p className="text-xs text-gray-400 mt-1">Max 5MB • PDF, JPG, PNG, GIF</p>
                    {payment.documentUrl && (
                      <p className="text-xs text-green-600 mt-1">✓ File uploaded successfully</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {!payment.locked && (
              <button
                onClick={() => handleDeletePayment(idx)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs"
                title="Delete Payment"
              >
                🗑️ Remove
              </button>
            )}
          </div>
        ))}
        <button
          onClick={handleAddPayment}
          className="mt-2 text-xs text-blue-600 hover:underline"
        >
          + Add Payment
        </button>
      </div>

      <div className="pt-4 border-t">
        <p className="text-gray-800 font-semibold">Total Paid: ₹{totalPaid.toFixed(2)}</p>
        <p className={`font-semibold ${paymentDue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          Payment Due: ₹{paymentDue.toFixed(2)}
        </p>
      </div>

      {totalPaid > costBreakdown.finalWithGST && costBreakdown.finalWithGST > 0 && (
        <p className="text-red-600 text-xs font-medium">
          ⚠ Total payment exceeds the final amount with GST.
        </p>
      )}

      {mismatchWarning && (
        <div className="bg-yellow-100 text-yellow-800 text-xs font-medium p-3 rounded-md border border-yellow-300 mt-4">
          ⚠ Invoice Mismatch:
          <br />
          • Final Invoice Value = ₹{calculatedInvoiceValue.toFixed(2)}
          <br />
          • Final Amount with GST = ₹{costBreakdown.finalWithGST.toFixed(2)}
          <br />
          Please ensure totals match before proceeding.
        </div>
      )}

      <div className="flex">
        <button
          onClick={onClose}
          className="w-[40%] mr-auto text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400 transition duration-200"
        >
          Close
        </button>
        <button
          onClick={handleSave}
          disabled={Object.keys(validationErrors).length > 0}
          className={`w-[40%] text-xs py-2 rounded-xl transition duration-200 ${
            Object.keys(validationErrors).length > 0 
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default PaymentStatusForm;