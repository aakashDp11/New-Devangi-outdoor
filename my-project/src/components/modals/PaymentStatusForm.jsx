


import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { PipelineContext } from '../../context/PipelineContext';

const PaymentStatusForm = ({ campaignId, onConfirm, onClose }) => {
  const [payments, setPayments] = useState([]);
  const [gstValue, setGstValue] = useState('');
  const [costBreakdown, setCostBreakdown] = useState({
    display: 0,
    printing: 0,
    mounting: 0,
    totalBeforeGST: 0,
    finalWithGST: 0,
  });

  const [paymentDue, setPaymentDue] = useState(0);
  const username = localStorage.getItem('userName');
  const useremail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');
  const { pipelineData, setPipelineData } = useContext(PipelineContext);

  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  useEffect(() => {
    const fetchPipelinePayment = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}`);
        const data = res.data?.payment || {};
        console.log("Data recieved in Payment Status form is",res.data);

        if (Array.isArray(data.payments)) {
          const enriched = data.payments.map(p => ({
            amount: p.amount || '',
            date: p.date || '',
            modeOfPayment: p.modeOfPayment || 'cash',
            referenceNumber: p.referenceNumber || '',
            documentUrl: p.documentUrl || '',
            locked: true,
          }));
          setPayments(enriched);
        }

        const campaignCosts = res.data?.campaign?.inventoryCosts || [];
        let totalDisplay = 0;
        let totalPrinting = 0;
        let totalMounting = 0;

        for (const cost of campaignCosts) {
          const area = cost.area || 0;
          totalDisplay += cost.displayCost || 0;
          totalPrinting += (cost.printingcostpersquareFeet || 0) * area;
          totalMounting += (cost.mountingcostpersquareFeet || 0) * area;
        }

        const totalBeforeGST = totalDisplay + totalPrinting + totalMounting;
        const savedGst = data.gstValue || 0;
        setGstValue(savedGst);

        const finalWithGST = totalBeforeGST + parseFloat(savedGst);

        setCostBreakdown({
          display: totalDisplay,
          printing: totalPrinting,
          mounting: totalMounting,
          totalBeforeGST,
          finalWithGST,
        });

        setPaymentDue(finalWithGST - totalPaid);
      } catch (err) {
        console.error('Failed to fetch payment data:', err);
      }
    };

    fetchPipelinePayment();
  }, [campaignId]);

  useEffect(() => {
    const newFinal = costBreakdown.totalBeforeGST + parseFloat(gstValue || 0);
    setCostBreakdown(prev => ({
      ...prev,
      finalWithGST: newFinal,
    }));
    setPaymentDue(newFinal - totalPaid);
  }, [gstValue, payments]);

  const handleAddPayment = () => {
    setPayments([...payments, {
      amount: '',
      date: '',
      modeOfPayment: 'cash',
      referenceNumber: '',
      documentUrl: '',
      locked: false,
    }]);
  };

  const handleDeletePayment = index => {
    const updated = payments.filter((_, idx) => idx !== index);
    setPayments(updated);
  };

  const handlePaymentChange = (index, field, value) => {
    const updated = [...payments];
    updated[index][field] = value;
    setPayments(updated);
  };
 

//   const invoiceTotal = Array.isArray(pipelineData?.invoice)
//   ? pipelineData.invoice.reduce((sum, inv) => sum + (inv.invoiceValue || 0), 0)
//   : 0;

// const mismatchWarning = Math.abs(invoiceTotal - costBreakdown.finalWithGST) > 1;

const invoiceTotal = Array.isArray(pipelineData?.invoice)
  ? pipelineData.invoice.reduce((sum, inv) => sum + (inv.invoiceValue || 0), 0)
  : 0;

const cashMemoTotal = Array.isArray(pipelineData?.cashMemo)
  ? pipelineData.cashMemo.reduce((sum, memo) => sum + (memo.value || 0), 0)
  : 0;

const creditNoteTotal = Array.isArray(pipelineData?.creditNote)
  ? pipelineData.creditNote.reduce((sum, note) => sum + (note.value || 0), 0)
  : 0;

const calculatedInvoiceValue = invoiceTotal + cashMemoTotal - creditNoteTotal;

const mismatchWarning = Math.abs(calculatedInvoiceValue - costBreakdown.finalWithGST) > 1;

  const handleFileUpload = async (index, file) => {
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
    const previousPaymentStatus = { ...pipelineData?.payment };

    if (totalPaid > costBreakdown.finalWithGST) {
      toast.error('❌ Total paid exceeds the final amount (with GST)!');
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

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Payment Status</h2>

      <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-md border">
        <p><strong>Total Display Cost:</strong> ₹{costBreakdown.display}</p>
        <p><strong>Total Printing Cost:</strong> ₹{costBreakdown.printing}</p>
        <p><strong>Total Mounting Cost:</strong> ₹{costBreakdown.mounting}</p>
        <p><strong>Total Before GST:</strong> ₹{costBreakdown.totalBeforeGST.toFixed(2)}</p>
        <p>
          <strong>GST Value:</strong>
          <input
            type="number"
            min="0"
            className="ml-2 border px-2 py-1 rounded w-[100px]"
            value={gstValue}
            onChange={e => setGstValue(e.target.value)}
            placeholder="Enter GST"
          />
        </p>
        <p><strong>Final Amount with GST:</strong> ₹{costBreakdown.finalWithGST.toFixed(2)}</p>
      </div>

      <div>
        <h3 className="font-semibold text-gray-700 mb-2">Payment Records</h3>
        {payments.map((payment, idx) => (
          <div key={idx} className="border p-3 mb-3 rounded-md space-y-2 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="w-full sm:w-[30%]">
                {payment.locked && <label className="text-xs text-gray-500">Amount</label>}
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={payment.amount}
                  onChange={e => handlePaymentChange(idx, 'amount', e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  readOnly={payment.locked}
                />
              </div>
              <div className="w-full sm:w-[30%]">
                {payment.locked && <label className="text-xs text-gray-500">Date</label>}
                <input
                  type="date"
                  value={payment.date ? new Date(payment.date).toISOString().split('T')[0] : ''}
                  onChange={e => handlePaymentChange(idx, 'date', e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  disabled={payment.locked}
                />
              </div>
              <div className="w-full sm:w-[30%]">
                {payment.locked && <label className="text-xs text-gray-500">Mode of Payment</label>}
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

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="w-full sm:w-[30%]">
                {payment.locked && <label className="text-xs text-gray-500">Reference Number</label>}
                <input
                  type="text"
                  placeholder="Reference Number"
                  value={payment.referenceNumber}
                  onChange={e => handlePaymentChange(idx, 'referenceNumber', e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  readOnly={payment.locked}
                />
              </div>
              <div className="w-full sm:w-[48%]">
                {!payment.locked && (
                  <input
                    type="file"
                    onChange={e => {
                      if (e.target.files[0]) handleFileUpload(idx, e.target.files[0]);
                    }}
                    className="w-full text-sm"
                  />
                )}
                {payment.documentUrl && (
                  <p className="text-xs text-blue-600 mt-1">
                    <a href={payment.documentUrl} target="_blank" rel="noopener noreferrer">View Uploaded File</a>
                  </p>
                )}
              </div>
            </div>

            {!payment.locked && (
              <button
                onClick={() => handleDeletePayment(idx)}
                className="text-red-500 hover:text-red-700 text-xs"
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
        <p className="text-gray-800 font-semibold">Total Paid: ₹{totalPaid}</p>
        <p className={`font-semibold ${paymentDue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          Payment Due: ₹{paymentDue.toFixed(2)}
        </p>
      </div>

      {totalPaid > costBreakdown.finalWithGST && (
        <p className="text-red-600 text-xs font-medium">
          ⚠ Total payment exceeds the final amount with GST.
        </p>
      )}

{/* {mismatchWarning && (
  <div className="bg-yellow-100 text-yellow-800 text-xs font-medium p-3 rounded-md border border-yellow-300 mt-4">
    ⚠ Invoice Value Mismatch:
    <br />
    • Total Invoice Value: ₹{invoiceTotal.toFixed(2)}  
    <br />
    • Final Amount with GST: ₹{costBreakdown.finalWithGST.toFixed(2)}
    <br />
    Please ensure the invoice totals match the final billed amount.
  </div>
)} */}
{mismatchWarning && (
  <div className="bg-yellow-100 text-yellow-800 text-xs font-medium p-3 rounded-md border border-yellow-300 mt-4">
    ⚠ Invoice Mismatch:
    <br />
    {/* • Invoice Total = ₹{invoiceTotal.toFixed(2)}
    <br />
    • Cash Memo Total = ₹{cashMemoTotal.toFixed(2)}
    <br />
    • Credit Note Total = ₹{creditNoteTotal.toFixed(2)} */}
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
          className="w-[40%] text-xs bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition duration-200"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default PaymentStatusForm;

