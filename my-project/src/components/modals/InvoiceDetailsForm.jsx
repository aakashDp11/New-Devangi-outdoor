
// import React, { useState, useContext } from 'react';
// import axios from 'axios';
// import { PipelineContext } from '../../context/PipelineContext';

// export default function InvoiceForm({ bookingId, onConfirm }) {
//   const [invoiceNumber, setInvoiceNumber] = useState('');
//   const [invoiceFile, setInvoiceFile] = useState(null);
//   const { pipelineData, setPipelineData } = useContext(PipelineContext);

//   const handleFileChange = (e) => {
//     setInvoiceFile(e.target.files[0]);
//   };

//   const handleSave = async () => {
//     try {
//       if (invoiceFile) {
//         const formData = new FormData();
//         formData.append('file', invoiceFile);

//         // Upload invoice file
//         await axios.post(`http://localhost:3000/api/pipeline/${bookingId}/invoice/upload`, formData, {
//           headers: { 'Content-Type': 'multipart/form-data' }
//         });
//       }

//       // Save invoice number
//       const res = await axios.put(`http://localhost:3000/api/pipeline/${bookingId}/invoice`, {
//         invoiceNumber
//       });

//       setPipelineData(res.data);
//       onConfirm();
//     } catch (err) {
//       console.error('Failed to save invoice details:', err);
//     }
//   };

//   return (
//     <div className="max-w-xl mx-auto mt-10 bg-white shadow-lg rounded-lg p-6 border">
//       <h2 className="text-2xl font-semibold mb-4 text-gray-800">Invoice Details</h2>

//       <div className="mb-4">
//         <label className="block text-sm text-gray-700 mb-1">Invoice Number:</label>
//         <input
//           type="text"
//           placeholder="Enter Invoice No"
//           value={invoiceNumber}
//           onChange={(e) => setInvoiceNumber(e.target.value)}
//           className="w-full px-3 py-2 text-sm border rounded-md"
//         />
//       </div>

//       <div className="mb-6">
//         <label className="block text-xs text-gray-700 font-medium mb-2">
//           Upload Invoice Document:
//         </label>
//         <input
//           type="file"
//           onChange={handleFileChange}
//           className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
//         />
//       </div>

//       <div className="flex gap-4">
//         <button
//           onClick={handleSave}
//           className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
//         >
//           Save
//         </button>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { PipelineContext } from '../../context/PipelineContext';

export default function InvoiceForm({ bookingId, onConfirm }) {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [isInvoiceSaved, setIsInvoiceSaved] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const { pipelineData, setPipelineData } = useContext(PipelineContext);

  useEffect(() => {
    const fetchInvoice = async () => {
      
      try {
        const res = await axios.get(`http://localhost:3000/api/pipeline/${bookingId}`);
        const invoice = res.data?.invoice || {};

        if (invoice.invoiceNumber) {
          setInvoiceNumber(invoice.invoiceNumber);
          setInvoiceUrl(invoice.documentUrl || '');
          setIsInvoiceSaved(true);
          console.log("Invoice is",invoice);
        }
      } catch (err) {
        console.error('Failed to fetch invoice data:', err);
      }
    };

    fetchInvoice();
  }, [bookingId]);

  const handleFileChange = (e) => {
    setInvoiceFile(e.target.files[0]);
  };

  const handleSave = async () => {
    try {
      if (invoiceFile) {
        const formData = new FormData();
        formData.append('file', invoiceFile);

        await axios.post(`http://localhost:3000/api/pipeline/${bookingId}/invoice/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      const res = await axios.put(`http://localhost:3000/api/pipeline/${bookingId}/invoice`, {
        invoiceNumber
      });

      setPipelineData(res.data);
      setIsInvoiceSaved(true);
      onConfirm();
    } catch (err) {
      console.error('Failed to save invoice details:', err);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white  p-6 ">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Invoice Details</h2>

      {isInvoiceSaved ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Invoice Number:</label>
            <p className="text-sm text-gray-900">{invoiceNumber}</p>
          </div>
          {invoiceUrl && (
  <div>
    <label className="block text-sm font-medium text-gray-700">Uploaded Invoice File:</label>
    <div className="flex gap-4 items-center">
      <a
        href={invoiceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline text-sm"
      >
        View Invoice
      </a>
      <a
        href={invoiceUrl}
        download
        className="text-sm text-green-700 underline hover:text-green-800"
      >
        ⬇ Download
      </a>
    </div>
  </div>
)}

        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm text-gray-700 mb-1">Invoice Number:</label>
            <input
              type="text"
              placeholder="Enter Invoice No"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md"
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs text-gray-700 font-medium mb-2">
              Upload Invoice Document:
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Save
            </button>
          </div>
        </>
      )}
    </div>
  );
}

