

// import React, { useState, useEffect, useContext } from 'react';
// import axios from 'axios';
// import { PipelineContext } from '../../context/PipelineContext';
// import { toast } from 'sonner';

// export default function InvoiceForm({ campaignId, onConfirm, onClose }) {
//   const [invoiceNumber, setInvoiceNumber] = useState('');
//   const [invoiceDate, setInvoiceDate] = useState('');
//   const [invoiceValue, setInvoiceValue] = useState('');
//   const [invoiceFile, setInvoiceFile] = useState(null);
//   const [isInvoiceSaved, setIsInvoiceSaved] = useState(false);
//   const [invoiceUrl, setInvoiceUrl] = useState('');
//   const { pipelineData, setPipelineData } = useContext(PipelineContext);
// const username = localStorage.getItem('userName'); // Replace with your actual AuthContext or storage mechanism
//   const useremail = localStorage.getItem('userEmail');
//   const userId = localStorage.getItem('userId');
//   useEffect(() => {
//     const fetchInvoice = async () => {
//       try {
//         const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}`);
//         const invoice = res.data?.invoice || {};

//         if (invoice.invoiceNumber) {
//           setInvoiceNumber(invoice.invoiceNumber);
//           setInvoiceDate(invoice.invoiceDate || '');
//           setInvoiceValue(invoice.invoiceValue || '');
//           setInvoiceUrl(invoice.documentUrl || '');
//           setIsInvoiceSaved(true);
//         }
//       } catch (err) {
//         console.error('Failed to fetch invoice data:', err);
//       }
//     };

//     fetchInvoice();
//   }, [campaignId]);

//   const handleFileChange = (e) => {
//     setInvoiceFile(e.target.files[0]);
//   };

//   const handleDownload = async () => {
//     const response = await fetch(invoiceUrl);
//     const blob = await response.blob();
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = invoiceUrl.split('/').pop();
//     a.click();
//     window.URL.revokeObjectURL(url);
//   };

//   const handleSave = async () => {
//     try {
//       // if (!invoiceFile) {
//       //   toast.error('Please upload an invoice file before saving.');
//       //   return;
//       // }

//       if (invoiceFile) {
//         const formData = new FormData();
//         formData.append('file', invoiceFile);

//         await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/invoice/upload`, formData, {
//           headers: { 'Content-Type': 'multipart/form-data' },
//         });
//       }
//       const previousInvoiceDetails = { ...pipelineData?.invoice }; // Capture the previous booking status

//     const newInvoiceDetails = {
//        invoiceNumber,
//         invoiceDate,
//         invoiceValue,
//     };

//     // Log the change to the ChangeLog table
//     const changeLogData = {
//       campaignId,
//       userId: userId,  // Use username or email from localStorage or AuthContext
//       changeType: 'Invoice details Update',
//       userName:username,
//       userEmail:useremail,
//       previousValue: previousInvoiceDetails,
//       newValue: newInvoiceDetails,
//     };
// console.log("Changelog data from fr is",changeLogData);
//       const res1=await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log`, changeLogData); 
//       console.log("Change log for booking status form is",res1);
//       const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/invoice`, {
//         invoiceNumber,
//         invoiceDate,
//         invoiceValue,
//       });

//       setPipelineData(res.data);
//       setIsInvoiceSaved(true);
//       onConfirm();
//     } catch (err) {
//       console.error('Failed to save invoice details:', err);
//     }
//   };

//   return (
//     <div className="relative max-w-xl mx-auto mt-1 bg-white px-4 pt-0 pb-2 ">
   

//       <h2 className="text-2xl mr-auto font-semibold mb-4 text-gray-800">Invoice Details</h2>

//       {isInvoiceSaved ? (
//         <div className="space-y-4 text-xs text-gray-700">
//           <div>
//             <label className="block">Invoice Number:</label>
//             <p>{invoiceNumber}</p>
//           </div>
//           <div>
//             <label className="block">Invoice Date:</label>
//             <p>{invoiceDate}</p>
//           </div>
//           <div>
//             <label className="block">Invoice Value:</label>
//             <p>₹{invoiceValue}</p>
//           </div>

//           {invoiceUrl && (
//             <div>
//               <label className="block font-medium">Uploaded Invoice File:</label>
//               <div className="flex gap-4 items-center">
//                 <a href={invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
//                   View Invoice
//                 </a>
//                 <button onClick={handleDownload} className="text-green-700 underline hover:text-green-800">
//                   ⬇ Download
//                 </button>
//               </div>
//             </div>
//           )}
//           <div className="flex justify-end gap-4 mt-4">
//             <button
//               onClick={onClose}
//               className="w-[40%] mx-auto text-xs bg-gray-400 text-white py-2 rounded-xl  transition duration-200"
//             >
//               Close
//             </button>
            
//           </div>
//         </div>
//       ) : (
//         <div className="space-y-5">
//           <div>
//             <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Number</label>
//             <input
//               type="text"
//               placeholder="Enter Invoice No"
//               value={invoiceNumber}
//               onChange={(e) => setInvoiceNumber(e.target.value)}
//               className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Date</label>
//             <input
//               type="date"
//               value={invoiceDate}
//               onChange={(e) => setInvoiceDate(e.target.value)}
//               className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Value (₹)</label>
//             <input
//               type="number"
//               placeholder="Enter amount"
//               value={invoiceValue}
//               onChange={(e) => setInvoiceValue(e.target.value)}
//               className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-xs font-medium text-gray-700 mb-1">Upload Invoice Document</label>
//             <input
//               type="file"
//               onChange={handleFileChange}
//               className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
//             />
//           </div>

//           <div className="flex justify-end gap-4 mt-2">
//             <button
//               onClick={onClose}
//               className="w-[40%] mr-auto text-xs bg-gray-400 text-white py-2 rounded-xl  transition duration-200"
//             >
//               Close
//             </button>
//             <button
//               onClick={handleSave}
//               className="w-[40%] text-xs bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition duration-200"
//             >
//               Save
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { PipelineContext } from '../../context/PipelineContext';
import { toast } from 'sonner';

export default function InvoiceForm({ campaignId, onConfirm, onClose }) {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [invoiceValue, setInvoiceValue] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [isInvoiceSaved, setIsInvoiceSaved] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [cashMemoUrl, setCashMemoUrl] = useState('');
  const [creditNoteUrl, setCreditNoteUrl] = useState('');
  
  const [cashMemoRef, setCashMemoRef] = useState('');
  const [cashMemoValue, setCashMemoValue] = useState('');
  const [cashMemoFile, setCashMemoFile] = useState(null);

  const [creditNoteRef, setCreditNoteRef] = useState('');
  const [creditNoteValue, setCreditNoteValue] = useState('');
  const [creditNoteFile, setCreditNoteFile] = useState(null);

  const { pipelineData, setPipelineData } = useContext(PipelineContext);
  const username = localStorage.getItem('userName');
  const useremail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}`);
        const invoice = res.data?.invoice || {};
        const cashMemo = res.data?.cashMemo || {};
        const creditNote = res.data?.creditNote || {};
  
        console.log("Invoice details are", res.data);
  
        if (invoice.invoiceNumber) {
          setInvoiceNumber(invoice.invoiceNumber);
          setInvoiceDate(invoice.invoiceDate || '');
          setInvoiceValue(invoice.invoiceValue || '');
          setInvoiceUrl(invoice.documentUrl || '');
          setIsInvoiceSaved(true);
        }
  
        if (cashMemo.reference) {
          setCashMemoRef(cashMemo.reference);
          setCashMemoValue(cashMemo.value || '');
        }
  
        if (creditNote.reference) {
          setCreditNoteRef(creditNote.reference);
          setCreditNoteValue(creditNote.value || '');
        }
  
        // Set document URLs even in view mode
        setCashMemoUrl(cashMemo.documentUrl || '');
        setCreditNoteUrl(creditNote.documentUrl || '');
  
      } catch (err) {
        console.error('Failed to fetch invoice data:', err);
      }
    };
  
    fetchInvoice();
  }, [campaignId]);
  
  // useEffect(() => {
  //   const fetchInvoice = async () => {
  //     try {
  //       const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}`);
  //       const invoice = res.data?.invoice || {};
  //       console.log("Invoice details are",res.data);
  //       if (invoice.invoiceNumber) {
  //         setInvoiceNumber(invoice.invoiceNumber);
  //         setInvoiceDate(invoice.invoiceDate || '');
  //         setInvoiceValue(invoice.invoiceValue || '');
  //         setInvoiceUrl(invoice.documentUrl || '');
  //         setIsInvoiceSaved(true);
  //       }
  //     } catch (err) {
  //       console.error('Failed to fetch invoice data:', err);
  //     }
  //   };

  //   fetchInvoice();
  // }, [campaignId]);

  const handleFileChange = (e, setter) => setter(e.target.files[0]);
  const handleDownloadGeneric = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = url.split('/').pop();
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
  };
  

  const handleDownload = async () => {
    const response = await fetch(invoiceUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = invoiceUrl.split('/').pop();
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    try {
      if (invoiceFile) {
        const formData = new FormData();
        formData.append('file', invoiceFile);
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/invoice/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (cashMemoFile) {
        const formData = new FormData();
        formData.append('file', cashMemoFile);
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/cash-memo/upload`, formData);
      }

      if (creditNoteFile) {
        const formData = new FormData();
        formData.append('file', creditNoteFile);
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/credit-note/upload`, formData);
      }

      const previousInvoiceDetails = { ...pipelineData?.invoice };

      const newInvoiceDetails = {
        invoiceNumber,
        invoiceDate,
        invoiceValue,
        cashMemoRef,
        cashMemoValue,
        creditNoteRef,
        creditNoteValue,
      };

      const changeLogData = {
        campaignId,
        userId,
        userName: username,
        userEmail: useremail,
        changeType: 'Invoice details Update',
        previousValue: previousInvoiceDetails,
        newValue: newInvoiceDetails,
      };

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log`, changeLogData);
    console.log("New invoice details are",newInvoiceDetails);
      const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/invoice`, {
        invoiceNumber,
        invoiceDate,
        invoiceValue,
        cashMemoRef,
        cashMemoValue,
        creditNoteRef,
        creditNoteValue,
      });

      setPipelineData(res.data);
      setIsInvoiceSaved(true);
      onConfirm();
    } catch (err) {
      console.error('Failed to save invoice details:', err);
    }
  };

  return (
    <div className="relative max-w-xl mx-auto mt-1 bg-white px-4 pt-0 pb-2 ">
      <h2 className="text-2xl mr-auto font-semibold mb-4 text-gray-800">Invoice Details</h2>

      {!isInvoiceSaved ? (
        <div className="space-y-5">
          {/* Invoice Fields */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Number</label>
            <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Enter Invoice No" className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Date</label>
            <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Value (₹)</label>
            <input type="number" value={invoiceValue} onChange={(e) => setInvoiceValue(e.target.value)} placeholder="Enter amount" className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Upload Invoice Document</label>
            <input type="file" onChange={(e) => handleFileChange(e, setInvoiceFile)} className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
          </div>

          {/* Cash Memo Fields */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cash Memo Reference</label>
            <input type="text" value={cashMemoRef} onChange={(e) => setCashMemoRef(e.target.value)} placeholder="Enter reference no" className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cash Memo Value (₹)</label>
            <input type="number" value={cashMemoValue} onChange={(e) => setCashMemoValue(e.target.value)} placeholder="Enter value" className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Upload Cash Memo</label>
            <input type="file" onChange={(e) => handleFileChange(e, setCashMemoFile)} className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
          </div>

          {/* Credit Note Fields */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Credit Note Reference</label>
            <input type="text" value={creditNoteRef} onChange={(e) => setCreditNoteRef(e.target.value)} placeholder="Enter reference no" className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Credit Note Value (₹)</label>
            <input type="number" value={creditNoteValue} onChange={(e) => setCreditNoteValue(e.target.value)} placeholder="Enter value" className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Upload Credit Note</label>
            <input type="file" onChange={(e) => handleFileChange(e, setCreditNoteFile)} className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
          </div>

          <div className="flex justify-end gap-4 mt-2">
            <button onClick={onClose} className="w-[40%] mr-auto text-xs bg-gray-400 text-white py-2 rounded-xl">Close</button>
            <button onClick={handleSave} className="w-[40%] text-xs bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700">Save</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-xs text-gray-700">
          <div><label className="block">Invoice Number:</label><p>{invoiceNumber}</p></div>
          <div><label className="block">Invoice Date:</label><p>{invoiceDate}</p></div>
          <div><label className="block">Invoice Value:</label><p>₹{invoiceValue}</p></div>
          {invoiceUrl && (
            <div>
              <label className="block font-medium">Uploaded Invoice File:</label>
              <div className="flex gap-4 items-center">
                <a href={invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Invoice</a>
                <button onClick={handleDownload} className="text-green-700 underline hover:text-green-800">⬇ Download</button>
              </div>
            </div>
          )}
          {cashMemoRef && (
  <div>
    <label className="block">Cash Memo Reference:</label>
    <p>{cashMemoRef}</p>
  </div>
)}
{cashMemoValue && (
  <div>
    <label className="block">Cash Memo Value:</label>
    <p>₹{cashMemoValue}</p>
  </div>
)}
{cashMemoUrl && (
  <div>
    <label className="block font-medium">Uploaded Cash Memo:</label>
    <div className="flex gap-4 items-center">
      <a href={cashMemoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Cash Memo</a>
      <button onClick={() => handleDownloadGeneric(cashMemoUrl)} className="text-green-700 underline hover:text-green-800">⬇ Download</button>
    </div>
  </div>
)}

{creditNoteRef && (
  <div>
    <label className="block">Credit Note Reference:</label>
    <p>{creditNoteRef}</p>
  </div>
)}
{creditNoteValue && (
  <div>
    <label className="block">Credit Note Value:</label>
    <p>₹{creditNoteValue}</p>
  </div>
)}
{creditNoteUrl && (
  <div>
    <label className="block font-medium">Uploaded Credit Note:</label>
    <div className="flex gap-4 items-center">
      <a href={creditNoteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Credit Note</a>
      <button onClick={() => handleDownloadGeneric(creditNoteUrl)} className="text-green-700 underline hover:text-green-800">⬇ Download</button>
    </div>
  </div>
)}


          <div className="flex justify-end gap-4 mt-4">
            <button onClick={onClose} className="w-[40%] mx-auto text-xs bg-gray-400 text-white py-2 rounded-xl">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
