

// import React, { useEffect, useState, useContext } from 'react';
// import axios from 'axios';
// import { toast } from 'sonner';
// import { PipelineContext } from '../../context/PipelineContext';

// const PaymentStatusForm = ({ campaignId, onConfirm,onClose }) => {
//   const [totalAmount, setTotalAmount] = useState('');
//   const [isTotalAmountLocked, setIsTotalAmountLocked] = useState(false);
//   const [modeOfPayment, setModeOfPayment] = useState('cash');
//   const [payments, setPayments] = useState([]);
//   const { setPipelineData } = useContext(PipelineContext);

//   useEffect(() => {
//     const fetchPipelinePayment = async () => {
//       try {
//         const res = await axios.get(`http://localhost:3000/api/pipeline/campaign/${campaignId}`);
//         const data = res.data?.payment || {};

//         if (data.totalAmount) {
//           setTotalAmount(data.totalAmount);
//           setIsTotalAmountLocked(true);
//         }

//         if (data.modeOfPayment) {
//           setModeOfPayment(data.modeOfPayment);
//         }

//         if (Array.isArray(data.payments)) {
//           setPayments(data.payments);
//         }
//       } catch (err) {
//         console.error('Failed to fetch payment data:', err);
//       }
//     };

//     fetchPipelinePayment();
//   }, [campaignId]);

//   const handleAddPayment = () => {
//     setPayments([...payments, { amount: '', date: '' }]);
//   };

//   const handleDeletePayment = (index) => {
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


// const handleSave = async () => {
//     try {
//       if (totalPaid > parseFloat(totalAmount)) {
//         toast.error('❌ Total paid exceeds the total amount!');
//         return;
//       }
  
//       const payload = {
//         totalAmount,
//         modeOfPayment,
//         payments,
//         totalPaid,
//         paymentDue,
//       };
  
//       const res = await axios.put(`http://localhost:3000/api/pipeline/campaign/${campaignId}/payment`, payload);
//       setPipelineData(res.data);
//       toast.success('Payment details saved!');
//       onConfirm();
//     } catch (err) {
//       console.error('Error saving payment:', err);
//       toast.error('Failed to save payment details.');
//     }
//   };
  

//   return (
//     <div className="max-w-2xl mx-auto p-6 bg-white  space-y-6">
//       <h2 className="text-2xl font-bold text-gray-800"> Payment Status</h2>

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
//         <label className="block text-xs font-medium text-gray-700">Mode of Payment</label>
//         <select
//           value={modeOfPayment}
//           onChange={e => setModeOfPayment(e.target.value)}
//           className="mt-1 w-full border rounded-md px-3 py-2"
//         >
//           <option value="cash">Cash</option>
//           <option value="cheque">Cheque</option>
//           <option value="pdc">PDC</option>
//         </select>
//       </div>

//       <div>
//         <h3 className="font-semibold text-gray-700 mb-2">Payment Records</h3>
//         {payments.map((payment, idx) => (
//           <div key={idx} className="flex items-center gap-2 mb-2">
//             <input
//               type="number"
//               placeholder="Amount (₹)"
//               value={payment.amount}
//               onChange={e => handlePaymentChange(idx, 'amount', e.target.value)}
//               className="w-[40%] border rounded-md px-3 py-2"
//             />
//             <input
//               type="date"
//               value={
//                 payment.date
//                   ? new Date(payment.date).toISOString().split('T')[0]
//                   : ''
//               }
//               onChange={e => handlePaymentChange(idx, 'date', e.target.value)}
//               className="w-[40%] border rounded-md px-3 py-2"
//             />
//             <button
//               onClick={() => handleDeletePayment(idx)}
//               className="text-red-500 hover:text-red-700 text-xs"
//               title="Delete Payment"
//             >
//               🗑️
//             </button>
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
//   <p className="text-red-600 text-xs font-medium">
//     ⚠ Total payment exceeds the allowed amount.
//   </p>
// )}

//       <div className="flex">
// <button
//   onClick={onClose}
//   className="w-[40%] mr-auto text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400 transition duration-200"
// >
//   Close
// </button>
//         <button
//                 onClick={handleSave}
//                 className="w-[40%] text-xs bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition duration-200"
//               >
//                 Save 
//               </button>
//       </div>
//     </div>
//   );
// };

// export default PaymentStatusForm;


import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { PipelineContext } from '../../context/PipelineContext';

const PaymentStatusForm = ({ campaignId, onConfirm, onClose }) => {
  const [totalAmount, setTotalAmount] = useState('');
  const [isTotalAmountLocked, setIsTotalAmountLocked] = useState(false);
  const [payments, setPayments] = useState([]);
  const { setPipelineData } = useContext(PipelineContext);

  useEffect(() => {
    const fetchPipelinePayment = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/pipeline/campaign/${campaignId}`);
        const data = res.data?.payment || {};

        if (data.totalAmount) {
          setTotalAmount(data.totalAmount);
          setIsTotalAmountLocked(true);
        }

        if (Array.isArray(data.payments)) {
          // Initialize missing modeOfPayment if not already present
          const enriched = data.payments.map(p => ({
            amount: p.amount || '',
            date: p.date || '',
            modeOfPayment: p.modeOfPayment || 'cash',
          }));
          setPayments(enriched);
        }
      } catch (err) {
        console.error('Failed to fetch payment data:', err);
      }
    };

    fetchPipelinePayment();
  }, [campaignId]);

  const handleAddPayment = () => {
    setPayments([...payments, { amount: '', date: '', modeOfPayment: 'cash' }]);
  };

  const handleDeletePayment = (index) => {
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

      const payload = {
        totalAmount,
        payments,
        totalPaid,
        paymentDue,
      };

      const res = await axios.put(`http://localhost:3000/api/pipeline/campaign/${campaignId}/payment`, payload);
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
            />
            <input
              type="date"
              value={payment.date ? new Date(payment.date).toISOString().split('T')[0] : ''}
              onChange={e => handlePaymentChange(idx, 'date', e.target.value)}
              className="w-full sm:w-[30%] border rounded-md px-3 py-2"
            />
            <select
              value={payment.modeOfPayment}
              onChange={e => handlePaymentChange(idx, 'modeOfPayment', e.target.value)}
              className="w-full sm:w-[30%] border rounded-md px-3 py-2"
            >
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="pdc">PDC</option>
            </select>
            <button
              onClick={() => handleDeletePayment(idx)}
              className="text-red-500 hover:text-red-700 text-xs"
              title="Delete Payment"
            >
              🗑️
            </button>
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
