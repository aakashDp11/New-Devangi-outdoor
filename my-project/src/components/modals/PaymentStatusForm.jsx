

import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { PipelineContext } from '../../context/PipelineContext';

const PaymentStatusForm = ({ campaignId, onConfirm, onClose }) => {
  const [totalAmount, setTotalAmount] = useState('');
  const [isTotalAmountLocked, setIsTotalAmountLocked] = useState(false);
  const [payments, setPayments] = useState([]);
  const [costBreakdown, setCostBreakdown] = useState({
    display: 0,
    printing: 0,
    mounting: 0,
    totalBeforeGST: 0,
    finalWithGST: 0,
  });

  const { setPipelineData } = useContext(PipelineContext);

  useEffect(() => {
    const fetchPipelinePayment = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/pipeline/campaign/${campaignId}`);
        console.log('Data received in Payment form is', res.data);

        const data = res.data?.payment || {};
        if (data.totalAmount) {
          setTotalAmount(data.totalAmount);
          setIsTotalAmountLocked(true);
        }

        if (Array.isArray(data.payments)) {
          const enriched = data.payments.map(p => ({
            amount: p.amount || '',
            date: p.date || '',
            modeOfPayment: p.modeOfPayment || 'cash',
            locked: true,
          }));
          setPayments(enriched);
        }

        // 🧠 Calculate cost breakdown from campaign.inventoryCosts
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
        const finalWithGST = totalBeforeGST * 1.18;

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
  }, [campaignId]);

  const handleAddPayment = () => {
    setPayments([...payments, { amount: '', date: '', modeOfPayment: 'cash', locked: false }]);
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

  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const paymentDue = parseFloat(totalAmount || 0) - totalPaid;

  const handleSave = async () => {
    try {
      if (totalPaid > parseFloat(totalAmount)) {
        toast.error('❌ Total paid exceeds the total amount!');
        return;
      }

      const cleanedPayments = payments.map(({ locked, ...rest }) => rest);

      const payload = {
        totalAmount,
        payments: cleanedPayments,
        totalPaid,
        paymentDue,
      };

      const res = await axios.put(`http://localhost:3000/api/pipeline/campaign/${campaignId}/payment`, payload);
      setPipelineData(res.data);
      toast.success('Payment details saved!');
      setIsTotalAmountLocked(true);
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
        <p><strong>Final Amount with GST (18%):</strong> ₹{costBreakdown.finalWithGST.toFixed(2)}</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700">Total Amount (₹)</label>
        <input
          type="number"
          value={totalAmount}
          onChange={e => setTotalAmount(e.target.value)}
          className="mt-1 w-full border rounded-md px-3 py-2"
          placeholder="Enter total amount"
          disabled={isTotalAmountLocked}
        />
      </div>

      <div>
        <h3 className="font-semibold text-gray-700 mb-2">Payment Records</h3>
        {payments.map((payment, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
            <input
              type="number"
              placeholder="Amount (₹)"
              value={payment.amount}
              onChange={e => handlePaymentChange(idx, 'amount', e.target.value)}
              className="w-full sm:w-[30%] border rounded-md px-3 py-2"
              readOnly={payment.locked}
            />
            <input
              type="date"
              value={payment.date ? new Date(payment.date).toISOString().split('T')[0] : ''}
              onChange={e => handlePaymentChange(idx, 'date', e.target.value)}
              className="w-full sm:w-[30%] border rounded-md px-3 py-2"
              disabled={payment.locked}
            />
            <select
              value={payment.modeOfPayment}
              onChange={e => handlePaymentChange(idx, 'modeOfPayment', e.target.value)}
              className="w-full sm:w-[30%] border rounded-md px-3 py-2"
              disabled={payment.locked}
            >
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="pdc">PDC</option>
            </select>
            {!payment.locked && (
              <button
                onClick={() => handleDeletePayment(idx)}
                className="text-red-500 hover:text-red-700 text-xs"
                title="Delete Payment"
              >
                🗑️
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
          Payment Due: ₹{paymentDue}
        </p>
      </div>

      {totalPaid > parseFloat(totalAmount || 0) && (
        <p className="text-red-600 text-xs font-medium">
          ⚠ Total payment exceeds the allowed amount.
        </p>
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


// import React, { useEffect, useState, useContext } from 'react';
// import axios from 'axios';
// import { toast } from 'sonner';
// import { PipelineContext } from '../../context/PipelineContext';

// const PaymentStatusForm = ({ campaignId, onConfirm, onClose }) => {
//   const [totalAmount, setTotalAmount] = useState('');
//   const [isTotalAmountLocked, setIsTotalAmountLocked] = useState(false);
//   const [payments, setPayments] = useState([]);
//   const [costBreakdown, setCostBreakdown] = useState({
//     display: 0,
//     printing: 0,
//     mounting: 0,
//     totalBeforeGST: 0,
//     finalWithGST: 0,
//   });

//   const { setPipelineData } = useContext(PipelineContext);

//   useEffect(() => {
//     const fetchPipelinePayment = async () => {
//       try {
//         const res = await axios.get(`http://localhost:3000/api/pipeline/campaign/${campaignId}`);
//         console.log('Data received in Payment form is', res.data);

//         const data = res.data?.payment || {};
//         if (data.totalAmount) {
//           setTotalAmount(data.totalAmount);
//           setIsTotalAmountLocked(true);
//         }

//         if (Array.isArray(data.payments)) {
//           const enriched = data.payments.map(p => ({
//             amount: p.amount || '',
//             date: p.date || '',
//             modeOfPayment: p.modeOfPayment || 'cash',
//             category: p.category || 'display',
//             locked: true,
//           }));
//           setPayments(enriched);
//         }

//         // 🧠 Calculate cost breakdown from campaign.inventoryCosts
//         const campaignCosts = res.data?.campaign?.inventoryCosts || [];
//         let totalDisplay = 0;
//         let totalPrinting = 0;
//         let totalMounting = 0;

//         for (const cost of campaignCosts) {
//           const area = cost.area || 0;
//           totalDisplay += cost.displayCost || 0;
//           totalPrinting += (cost.printingcostpersquareFeet || 0) * area;
//           totalMounting += (cost.mountingcostpersquareFeet || 0) * area;
//         }

//         const totalBeforeGST = totalDisplay + totalPrinting + totalMounting;
//         const finalWithGST = totalBeforeGST * 1.18;

//         setCostBreakdown({
//           display: totalDisplay,
//           printing: totalPrinting,
//           mounting: totalMounting,
//           totalBeforeGST,
//           finalWithGST,
//         });
//       } catch (err) {
//         console.error('Failed to fetch payment data:', err);
//       }
//     };

//     fetchPipelinePayment();
//   }, [campaignId]);

//   const handleAddPayment = () => {
//     setPayments([...payments, {
//       amount: '',
//       date: '',
//       modeOfPayment: 'cash',
//       category: 'display',
//       locked: false
//     }]);
//   };

//   const handleDeletePayment = index => {
//     const updated = payments.filter((_, idx) => idx !== index);
//     setPayments(updated);
//   };

//   const handlePaymentChange = (index, field, value) => {
//     const updated = [...payments];
//     updated[index][field] = value;
//     setPayments(updated);
//   };

//   const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
//   const paymentDue = parseFloat(totalAmount || 0) - totalPaid;

//   const handleSave = async () => {
//     try {
//       if (totalPaid > parseFloat(totalAmount)) {
//         toast.error('❌ Total paid exceeds the total amount!');
//         return;
//       }

//       const cleanedPayments = payments.map(({ locked, ...rest }) => rest);

//       const payload = {
//         totalAmount,
//         payments: cleanedPayments,
//         totalPaid,
//         paymentDue,
//       };

//       const res = await axios.put(`http://localhost:3000/api/pipeline/campaign/${campaignId}/payment`, payload);
//       setPipelineData(res.data);
//       toast.success('Payment details saved!');
//       setIsTotalAmountLocked(true);
//       onConfirm();
//     } catch (err) {
//       console.error('Error saving payment:', err);
//       toast.error('Failed to save payment details.');
//     }
//   };

//   return (
//     <div className="max-w-2xl mx-auto p-6 bg-white space-y-6">
//       <h2 className="text-2xl font-bold text-gray-800">Payment Status</h2>

//       <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-md border">
//         <p><strong>Total Display Cost:</strong> ₹{costBreakdown.display}</p>
//         <p><strong>Total Printing Cost:</strong> ₹{costBreakdown.printing}</p>
//         <p><strong>Total Mounting Cost:</strong> ₹{costBreakdown.mounting}</p>
//         <p><strong>Total Before GST:</strong> ₹{costBreakdown.totalBeforeGST.toFixed(2)}</p>
//         <p><strong>Final Amount with GST (18%):</strong> ₹{costBreakdown.finalWithGST.toFixed(2)}</p>
//       </div>

//       <div>
//         <label className="block text-xs font-medium text-gray-700">Total Amount (₹)</label>
//         <input
//           type="number"
//           value={totalAmount}
//           onChange={e => setTotalAmount(e.target.value)}
//           className="mt-1 w-full border rounded-md px-3 py-2"
//           placeholder="Enter total amount"
//           disabled={isTotalAmountLocked}
//         />
//       </div>

//       <div>
//         <h3 className="font-semibold text-gray-700 mb-2">Payment Records</h3>
//         {payments.map((payment, idx) => (
//           <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
//             <input
//               type="number"
//               placeholder="Amount (₹)"
//               value={payment.amount}
//               onChange={e => handlePaymentChange(idx, 'amount', e.target.value)}
//               className="w-full sm:w-[20%] border rounded-md px-3 py-2"
//               readOnly={payment.locked}
//             />
//             <input
//               type="date"
//               value={payment.date ? new Date(payment.date).toISOString().split('T')[0] : ''}
//               onChange={e => handlePaymentChange(idx, 'date', e.target.value)}
//               className="w-full sm:w-[20%] border rounded-md px-3 py-2"
//               disabled={payment.locked}
//             />
//             <select
//               value={payment.modeOfPayment}
//               onChange={e => handlePaymentChange(idx, 'modeOfPayment', e.target.value)}
//               className="w-full sm:w-[20%] border rounded-md px-3 py-2"
//               disabled={payment.locked}
//             >
//               <option value="cash">Cash</option>
//               <option value="cheque">Cheque</option>
//               <option value="pdc">PDC</option>
//             </select>
//             <select
//               value={payment.category}
//               onChange={e => handlePaymentChange(idx, 'category', e.target.value)}
//               className="w-full sm:w-[20%] border rounded-md px-3 py-2"
//               disabled={payment.locked}
//             >
//               <option value="display">Display</option>
//               <option value="printing">Printing</option>
//               <option value="mounting">Mounting</option>
//             </select>
//             {!payment.locked && (
//               <button
//                 onClick={() => handleDeletePayment(idx)}
//                 className="text-red-500 hover:text-red-700 text-xs"
//                 title="Delete Payment"
//               >
//                 🗑️
//               </button>
//             )}
//           </div>
//         ))}
//         <button
//           onClick={handleAddPayment}
//           className="mt-2 text-xs text-blue-600 hover:underline"
//         >
//           + Add Payment
//         </button>
//       </div>

//       <div className="pt-4 border-t">
//         <p className="text-gray-800 font-semibold">Total Paid: ₹{totalPaid}</p>
//         <p className={`font-semibold ${paymentDue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//           Payment Due: ₹{paymentDue}
//         </p>
//       </div>

//       {totalPaid > parseFloat(totalAmount || 0) && (
//         <p className="text-red-600 text-xs font-medium">
//           ⚠ Total payment exceeds the allowed amount.
//         </p>
//       )}

//       <div className="flex">
//         <button
//           onClick={onClose}
//           className="w-[40%] mr-auto text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400 transition duration-200"
//         >
//           Close
//         </button>
//         <button
//           onClick={handleSave}
//           className="w-[40%] text-xs bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition duration-200"
//         >
//           Save
//         </button>
//       </div>
//     </div>
//   );
// };

// export default PaymentStatusForm;
