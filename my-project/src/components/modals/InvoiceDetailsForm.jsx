// import React, { useState, useEffect, useContext, useCallback } from 'react';
// import axios from 'axios';
// import { PipelineContext } from '../../context/PipelineContext';
// import { toast } from 'sonner';
// import { Plus, X, FileText, Receipt, CreditCard } from 'lucide-react';

// // Memoized AddButton Component - Now with an `isDisabled` prop for conditional disabling
// const AddButton = React.memo(({ onClick, icon: Icon, title, description, isActive, isDisabled = false }) => {
//   // The button is finally disabled if it's already active OR if the external condition is met
//   const finalIsDisabled = isActive || isDisabled;

//   // Provide a more helpful description when the button is disabled for a reason
//   const finalDescription = isDisabled && !isActive ? 'Complete invoice details first' : description;

//   return (
//     <button
//       onClick={onClick}
//       disabled={finalIsDisabled}
//       className={`w-full p-4 border-2 border-dashed rounded-lg transition-all duration-200 ${
//         isActive
//           ? 'border-green-300 bg-green-50 cursor-not-allowed' // Active state
//           : finalIsDisabled
//           ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60' // Disabled state
//           : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50' // Default enabled state
//       }`}
//     >
//       <div className="flex items-center justify-center space-x-3">
//         <Icon className={`w-5 h-5 ${isActive ? 'text-green-600' : finalIsDisabled ? 'text-gray-400' : 'text-gray-500'}`} />
//         <div className="text-left">
//           <div className={`text-sm font-medium ${isActive ? 'text-green-700' : finalIsDisabled ? 'text-gray-500' : 'text-gray-700'}`}>
//             {isActive ? `${title} Added` : `Add ${title}`}
//           </div>
//           <div className={`text-xs ${isActive ? 'text-green-600' : finalIsDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
//             {isActive ? 'Section is active' : finalDescription}
//           </div>
//         </div>
//         {isActive ? (
//           <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
//             <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
//               <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//             </svg>
//           </div>
//         ) : (
//           <Plus className="w-5 h-5 text-gray-400" />
//         )}
//       </div>
//     </button>
//   );
// });


// // Memoized SectionCard Component
// const SectionCard = React.memo(({ title, children, onRemove, isPreviewMode }) => (
//   <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
//     <div className="flex items-center justify-between p-4 border-b border-gray-100">
//       <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
//       {!isPreviewMode && (
//         <button
//           onClick={onRemove}
//           className="text-gray-400 hover:text-red-500 transition-colors"
//         >
//           <X className="w-5 h-5" />
//         </button>
//       )}
//     </div>
//     <div className="p-4">
//       {children}
//     </div>
//   </div>
// ));


// function InvoiceForm({ campaignId, onConfirm, onClose }) {
//   const [invoiceNumber, setInvoiceNumber] = useState('');
//   const [invoiceDate, setInvoiceDate] = useState('');
//   const [invoiceValue, setInvoiceValue] = useState('');
//   const [invoiceFile, setInvoiceFile] = useState(null);
//   const [isInvoiceSaved, setIsInvoiceSaved] = useState(false);
//   const [invoiceUrl, setInvoiceUrl] = useState('');
//   const [cashMemoUrl, setCashMemoUrl] = useState('');
//   const [creditNoteUrl, setCreditNoteUrl] = useState('');

//   const [cashMemoRef, setCashMemoRef] = useState('');
//   const [cashMemoValue, setCashMemoValue] = useState('');
//   const [cashMemoFile, setCashMemoFile] = useState(null);

//   const [creditNoteRef, setCreditNoteRef] = useState('');
//   const [creditNoteValue, setCreditNoteValue] = useState('');
//   const [creditNoteFile, setCreditNoteFile] = useState(null);

//   const { pipelineData, setPipelineData } = useContext(PipelineContext);
//   const username = localStorage.getItem('userName');
//   const useremail = localStorage.getItem('userEmail');
//   const userId = localStorage.getItem('userId');

//   // Section visibility states
//   const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
//   const [showCashMemo, setShowCashMemo] = useState(false);
//   const [showCreditNote, setShowCreditNote] = useState(false);
//   const [isPreviewMode, setIsPreviewMode] = useState(false);

//   // NEW: Condition to check if invoice details are complete
//   const isInvoiceDetailsComplete = !!(invoiceNumber && invoiceDate && invoiceValue && (invoiceFile || invoiceUrl));

//   useEffect(() => {
//     const fetchInvoice = async () => {
//       try {
//         const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}`);
//         const invoice = res.data?.invoice || {};
//         const cashMemo = res.data?.cashMemo || {};
//         const creditNote = res.data?.creditNote || {};

//         console.log("Invoice details are", res.data);

//         if (invoice.invoiceNumber) {
//           setInvoiceNumber(invoice.invoiceNumber);
//           setInvoiceDate(invoice.invoiceDate || '');
//           setInvoiceValue(invoice.invoiceValue || '');
//           setInvoiceUrl(invoice.documentUrl || '');
//           setShowInvoiceDetails(true);
//           setIsInvoiceSaved(true);
//         }

//         if (cashMemo.reference) {
//           setCashMemoRef(cashMemo.reference);
//           setCashMemoValue(cashMemo.value || '');
//           setShowCashMemo(true);
//         }

//         if (creditNote.reference) {
//           setCreditNoteRef(creditNote.reference);
//           setCreditNoteValue(creditNote.value || '');
//           setShowCreditNote(true);
//         }

//         setCashMemoUrl(cashMemo.documentUrl || '');
//         setCreditNoteUrl(creditNote.documentUrl || '');

//       } catch (err) {
//         console.error('Failed to fetch invoice data:', err);
//       }
//     };

//     fetchInvoice();
//   }, [campaignId]);

//   const handleFileChange = useCallback((e, setter) => setter(e.target.files[0]), []);

//   const handleDownloadGeneric = useCallback(async (url) => {
//     try {
//       const response = await fetch(url);
//       const blob = await response.blob();
//       const downloadUrl = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = downloadUrl;
//       a.download = url.split('/').pop();
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       window.URL.revokeObjectURL(downloadUrl);
//     } catch (error) {
//       console.error("Download failed:", error);
//       toast.error("Failed to download file.");
//     }
//   }, []);

//   const handleDownload = useCallback(async () => {
//     if (invoiceUrl) {
//       await handleDownloadGeneric(invoiceUrl);
//     }
//   }, [invoiceUrl, handleDownloadGeneric]);

//   const handleSave = useCallback(async () => {
//     try {
//       if (invoiceFile) {
//         const formData = new FormData();
//         formData.append('file', invoiceFile);
//         await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/invoice/upload`, formData, {
//           headers: { 'Content-Type': 'multipart/form-data' },
//         });
//       }

//       if (cashMemoFile) {
//         const formData = new FormData();
//         formData.append('file', cashMemoFile);
//         await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/cash-memo/upload`, formData);
//       }

//       if (creditNoteFile) {
//         const formData = new FormData();
//         formData.append('file', creditNoteFile);
//         await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/credit-note/upload`, formData);
//       }

//       const previousInvoiceDetails = { ...pipelineData?.invoice };

//       const newInvoiceDetails = {
//         invoiceNumber,
//         invoiceDate,
//         invoiceValue,
//         cashMemoRef,
//         cashMemoValue,
//         creditNoteRef,
//         creditNoteValue,
//       };

//       const changeLogData = {
//         campaignId,
//         userId,
//         userName: username,
//         userEmail: useremail,
//         changeType: 'Invoice details Update',
//         previousValue: previousInvoiceDetails,
//         newValue: newInvoiceDetails,
//       };

//       await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log`, changeLogData);

//       const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/invoice`, newInvoiceDetails);

//       setPipelineData(res.data);
//       setIsInvoiceSaved(true);
//       setIsPreviewMode(false);
//       toast.success('Invoice details saved successfully!');
//       onConfirm();
//     } catch (err) {
//       console.error('Failed to save invoice details:', err);
//       toast.error('Failed to save invoice details');
//     }
//   }, [
//     campaignId, invoiceNumber, invoiceDate, invoiceValue, invoiceFile,
//     cashMemoRef, cashMemoValue, cashMemoFile, creditNoteRef, creditNoteValue,
//     creditNoteFile, pipelineData, setPipelineData, onConfirm, userId, username, useremail
//   ]);

//   const handleClose = useCallback(() => {
//     setShowInvoiceDetails(false);
//     setShowCashMemo(false);
//     setShowCreditNote(false);
//     setIsInvoiceSaved(false);
//     setIsPreviewMode(false);
//     onClose();
//   }, [onClose]);
  
//   const handlePreview = () => {
//     setIsInvoiceSaved(false);
//     setIsPreviewMode(true);
//   }

//   if (isInvoiceSaved) {
//     return (
//       <div className="relative max-w-4xl mx-auto mt-1 bg-white px-4 pt-0 pb-2">
//         <h2 className="text-2xl mr-auto font-semibold mb-4 text-gray-800">Invoice Details</h2>
//         <div className="text-center bg-white-50 p-8 rounded-xl">
//           <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <svg className="w-8 h-8 text-white-600" fill="currentColor" viewBox="0 0 20 20">
//               <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//             </svg>
//           </div>
//           <h3 className="text-xl font-semibold text-gray-800 mb-2">Successfully Saved!</h3>
//           <p className="text-gray-600 mb-4">Your invoice data has been saved successfully.</p>
//           <div className="flex justify-center gap-4">
//             <button
//               onClick={handlePreview}
//               className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//             >
//               Preview Form
//             </button>
            
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="relative max-w-4xl mx-auto mt-1 bg-white px-4 pt-0 pb-2">
//       <h2 className="text-2xl mr-auto font-semibold mb-4 text-gray-800">Invoice Details</h2>
      
//       <div className="space-y-6">
//         <div className="text-center mb-8">
//           <p className="text-gray-600">Add the sections you need for your invoice</p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
//           <AddButton
//             onClick={() => setShowInvoiceDetails(true)}
//             icon={FileText}
//             title="Invoice Details"
//             description="Add invoice information"
//             isActive={showInvoiceDetails}
//             isDisabled={isPreviewMode}
//           />
//           <AddButton
//             onClick={() => setShowCashMemo(true)}
//             icon={Receipt}
//             title="Cash Memo"
//             description="Add cash memo details"
//             isActive={showCashMemo}
//             isDisabled={isPreviewMode}
//           />
//           <AddButton
//             onClick={() => setShowCreditNote(true)}
//             icon={CreditCard}
//             title="Credit Note"
//             description="Add credit note information"
//             isActive={showCreditNote}
//             isDisabled={!isInvoiceDetailsComplete || isPreviewMode} 
//           />
//         </div>

//         <div className="space-y-6">
//           {showInvoiceDetails && (
//             <SectionCard 
//               title="Invoice Details" 
//               onRemove={() => setShowInvoiceDetails(false)}
//               isPreviewMode={isPreviewMode}
//             >
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number</label>
//                   <input
//                     type="text"
//                     value={invoiceNumber}
//                     onChange={(e) => setInvoiceNumber(e.target.value)}
//                     placeholder="Enter Invoice No"
//                     className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     disabled={isPreviewMode}
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Date</label>
//                   <input
//                     type="date"
//                     value={invoiceDate}
//                     onChange={(e) => setInvoiceDate(e.target.value)}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     disabled={isPreviewMode}
//                   />
//                 </div>
                
//                 <div className="text-left">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Upload Invoice Document</label>
//                   <input
//                     type="file"
//                     onChange={(e) => handleFileChange(e, setInvoiceFile)}
//                     className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
//                     disabled={isPreviewMode}
//                   />
//                   {invoiceUrl && (
//                     <button
//                       onClick={handleDownload}
//                       className="mt-4 text-sm text-purple-600 hover:text-purple-800"
//                     >
//                       Download  invoice
//                     </button>
//                   )}
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Value (₹)</label>
//                   <input
//                     type="number"
//                     value={invoiceValue}
//                     onChange={(e) => setInvoiceValue(e.target.value)}
//                     placeholder="Enter amount"
//                     className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     disabled={isPreviewMode}
//                   />
//                 </div>
//               </div>
//             </SectionCard>
//           )}

//           {showCashMemo && (
//             <SectionCard 
//               title="Cash Memo Details" 
//               onRemove={() => setShowCashMemo(false)}
//               isPreviewMode={isPreviewMode}
//             >
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Cash Memo Reference</label>
//                   <input
//                     type="text"
//                     value={cashMemoRef}
//                     onChange={(e) => setCashMemoRef(e.target.value)}
//                     placeholder="Enter reference no"
//                     className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     disabled={isPreviewMode}
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Cash Memo Value (₹)</label>
//                   <input
//                     type="number"
//                     value={cashMemoValue}
//                     onChange={(e) => setCashMemoValue(e.target.value)}
//                     placeholder="Enter value"
//                     className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     disabled={isPreviewMode}
//                   />
//                 </div>
//                 <div className="md:col-span-2 text-left">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Upload Cash Memo</label>
//                   <input
//                     type="file"
//                     onChange={(e) => handleFileChange(e, setCashMemoFile)}
//                     className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
//                     disabled={isPreviewMode}
//                   />
//                   {cashMemoUrl && (
//                     <button
//                       onClick={() => handleDownloadGeneric(cashMemoUrl)}
//                       className="mt-4 text-sm text-purple-600 hover:text-purple-800"
//                     >
//                       Download  cash memo
//                     </button>
//                   )}
//                 </div>
//               </div>
//             </SectionCard>
//           )}

//           {showCreditNote && (
//             <SectionCard 
//               title="Credit Note Details" 
//               onRemove={() => setShowCreditNote(false)}
//               isPreviewMode={isPreviewMode}
//             >
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Credit Note Reference</label>
//                   <input
//                     type="text"
//                     value={creditNoteRef}
//                     onChange={(e) => setCreditNoteRef(e.target.value)}
//                     placeholder="Enter reference no"
//                     className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     disabled={isPreviewMode}
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Credit Note Value (₹)</label>
//                   <input
//                     type="number"
//                     value={creditNoteValue}
//                     onChange={(e) => setCreditNoteValue(e.target.value)}
//                     placeholder="Enter value"
//                     className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     disabled={isPreviewMode}
//                   />
//                 </div>
//                 <div className="md:col-span-2 text-left">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Upload Credit Note</label>
//                   <input
//                     type="file"
//                     onChange={(e) => handleFileChange(e, setCreditNoteFile)}
//                     className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
//                     disabled={isPreviewMode}
//                   />
//                   {creditNoteUrl && (
//                     <button
//                       onClick={() => handleDownloadGeneric(creditNoteUrl)}
//                       className="mt-4 text-sm text-purple-600 hover:text-purple-800"
//                     >
//                       Download credit note
//                     </button>
//                   )}
//                 </div>
//               </div>
//             </SectionCard>
//           )}
//         </div>

//         {(showInvoiceDetails || showCashMemo || showCreditNote) && (
//           <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-gray-200">
//             {isPreviewMode ? (
//               <>
//                 <button
//                   onClick={handleClose}
//                   className="px-8 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
//                 >
//                   Close
//                 </button>
//                 <button
//                   onClick={() => setIsPreviewMode(false)}
//                   className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                 >
//                   Edit Form
//                 </button>
//               </>
//             ) : (
//               <>
//                 <button
//                   onClick={handleClose}
//                   className="px-8 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSave}
//                   className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                 >
//                   Save All
//                 </button>
//               </>
//             )}
            
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default React.memo(InvoiceForm);

// Full updated InvoiceForm.jsx with support for multiple uploads for invoice, cash memo, and credit note
// NOTE: Preserves existing UI/UX layout — one section per type with dynamic multiple file and metadata entries



// InvoiceForm.jsx — Now with per-row file upload + Add/Remove buttons for invoices, cash memos, and credit notes

// // Updated InvoiceForm.jsx with data pre-fill from backend


import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { PipelineContext } from '../../context/PipelineContext';
import { toast } from 'sonner';
import { Plus, X, FileText, Receipt, CreditCard } from 'lucide-react';

// Memoized SectionCard Component with added margin for spacing
const SectionCard = React.memo(({ title, children, onRemove }) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
    <div className="flex items-center justify-between p-4 border-b border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <button onClick={onRemove} className="text-gray-400 hover:text-red-500 transition-colors">
        <X className="w-5 h-5" />
      </button>
    </div>
    <div className="p-4 space-y-4">{children}</div>
  </div>
));

// Memoized AddButton Component with updated logic for sequential enabling
const AddButton = React.memo(({ onClick, icon: Icon, title, description, isActive, isDisabled = false }) => {
  const finalIsDisabled = isActive || isDisabled;

  return (
    <button
      onClick={onClick}
      disabled={finalIsDisabled}
      className={`w-full p-4 border-2 border-dashed rounded-lg transition-all duration-200 text-left ${
        isActive
          ? 'border-green-300 bg-green-50 cursor-not-allowed'
          : finalIsDisabled
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
          : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
      }`}
    >
      <div className="flex items-center justify-start space-x-3">
        <Icon className={`w-5 h-5 ${isActive ? 'text-green-600' : finalIsDisabled ? 'text-gray-400' : 'text-gray-500'}`} />
        <div>
          <div className={`text-sm font-medium ${isActive ? 'text-green-700' : finalIsDisabled ? 'text-gray-500' : 'text-gray-700'}`}>
            {isActive ? `${title} Added` : `Add ${title}`}
          </div>
          <div className={`text-xs ${isActive ? 'text-green-600' : finalIsDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
            {description}
          </div>
        </div>
        <div className="flex-grow"></div>
        {isActive ? (
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        ) : (
          <Plus className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </div>
    </button>
  );
});


function InvoiceForm({ campaignId, onConfirm, onClose }) {
  const [invoices, setInvoices] = useState([]);
  const [cashMemos, setCashMemos] = useState([]);
  const [creditNotes, setCreditNotes] = useState([]);

  const [showInvoice, setShowInvoice] = useState(false);
  const [showCashMemo, setShowCashMemo] = useState(false);
  const [showCreditNote, setShowCreditNote] = useState(false);
  const { setPipelineData } = useContext(PipelineContext);

  // Conditions for enabling the next section
  const isInvoiceSectionComplete = invoices.some(inv => inv.invoiceNumber && inv.invoiceDate && inv.invoiceValue && (inv.file || inv.documentUrl));
  const isCashMemoSectionComplete = cashMemos.some(memo => memo.reference && memo.value && (memo.file || memo.documentUrl));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}`);
        const { invoice = [], cashMemo = [], creditNote = [] } = res.data || {};
        
        if (invoice.length > 0) {
          setInvoices(invoice.map(inv => ({ ...inv, file: null })));
          setShowInvoice(true);
        }
        if (cashMemo.length > 0) {
          setCashMemos(cashMemo.map(memo => ({ ...memo, file: null })));
          setShowCashMemo(true);
        }
        if (creditNote.length > 0) {
          setCreditNotes(creditNote.map(note => ({ ...note, file: null })));
          setShowCreditNote(true);
        }
      } catch (err) {
        console.error('Failed to fetch pipeline data:', err);
        toast.error('Could not load existing billing data.');
      }
    };
    fetchData();
  }, [campaignId]);

  const handleFileChange = (listSetter, index, file) => {
    listSetter(prev => prev.map((item, i) => i === index ? { ...item, file } : item));
  };

  const handleChange = (listSetter, index, field, value) => {
    listSetter(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleAddRow = (listSetter, template) => {
    listSetter(prev => [...prev, { ...template }]);
  };

  const handleRemoveRow = (listSetter, index) => {
    listSetter(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const validateRows = (rows, type) => {
      for (const row of rows) {
        if (type === 'invoice' && (!row.invoiceNumber || !row.invoiceDate || !row.invoiceValue || (!row.file && !row.documentUrl))) {
          toast.error('Please complete all fields for each invoice, including the file.');
          return false;
        }
        if (type !== 'invoice' && (!row.reference || !row.value || (!row.file && !row.documentUrl))) {
           toast.error(`Please complete all fields for each ${type === 'cashMemo' ? 'cash memo' : 'credit note'}, including the file.`);
           return false;
        }
      }
      return true;
    };

    if (showInvoice && !validateRows(invoices, 'invoice')) return;
    if (showCashMemo && !validateRows(cashMemos, 'cashMemo')) return;
    if (showCreditNote && !validateRows(creditNotes, 'creditNote')) return;

    try {
      const uploadSection = async (endpoint, dataList) => {
        if (!dataList || dataList.length === 0) return;
        const formData = new FormData();
        const payload = [];

        dataList.forEach(entry => {
          if (entry.file) formData.append('files', entry.file);
          const plainEntry = { ...entry };
          delete plainEntry.file;
          payload.push(plainEntry);
        });
        
        formData.append('data', JSON.stringify(payload));

        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${campaignId}/${endpoint}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      };

      if (showInvoice) await uploadSection('invoice/upload', invoices);
      if (showCashMemo) await uploadSection('cash-memo/upload', cashMemos);
      if (showCreditNote) await uploadSection('credit-note/upload', creditNotes);

      toast.success('All documents saved successfully!');
      onConfirm();
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('An error occurred during save.');
    }
  };

  const RedAsterisk = () => <span className="text-red-500 ml-1">*</span>;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Upload Billing Documents</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <AddButton onClick={() => setShowInvoice(true)} icon={FileText} title="Invoices" description="Add invoice section" isActive={showInvoice} />
        <AddButton onClick={() => setShowCashMemo(true)} icon={Receipt} title="Cash Memos" description={isInvoiceSectionComplete ? "Add cash memo section" : "Complete invoice first"} isActive={showCashMemo} isDisabled={!isInvoiceSectionComplete} />
        <AddButton onClick={() => setShowCreditNote(true)} icon={CreditCard} title="Credit Notes" description={isCashMemoSectionComplete ? "Add credit note section" : "Complete cash memo first"} isActive={showCreditNote} isDisabled={!isCashMemoSectionComplete} />
      </div>
      
      {showInvoice && (
        <SectionCard title="Invoice Details" onRemove={() => setShowInvoice(false)}>
          {invoices.map((inv, i) => (
            <div key={i} className="p-3 border rounded-md relative">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Invoice Number<RedAsterisk /></label>
                  <input type="text" placeholder="Number" value={inv.invoiceNumber} onChange={(e) => handleChange(setInvoices, i, 'invoiceNumber', e.target.value)} className="w-full p-2 border rounded" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Invoice Date<RedAsterisk /></label>
                  <input type="date" value={inv.invoiceDate} onChange={(e) => handleChange(setInvoices, i, 'invoiceDate', e.target.value)} className="w-full p-2 border rounded" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Invoice Value (₹)<RedAsterisk /></label>
                  <input type="number" placeholder="Value" value={inv.invoiceValue} onChange={(e) => handleChange(setInvoices, i, 'invoiceValue', e.target.value)} className="w-full p-2 border rounded" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Upload File<RedAsterisk /></label>
                  {inv.documentUrl && !inv.file && <a href={inv.documentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500">View Uploaded</a>}
                  <input type="file" onChange={(e) => handleFileChange(setInvoices, i, e.target.files[0])} className="w-full text-sm" required={!inv.documentUrl} />
                </div>
              </div>
              {invoices.length > 1 && <button onClick={() => handleRemoveRow(setInvoices, i)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><X size={18} /></button>}
            </div>
          ))}
          <button onClick={() => handleAddRow(setInvoices, { invoiceNumber: '', invoiceDate: '', invoiceValue: '', file: null, documentUrl: '' })} className="text-sm text-blue-600 mt-2">+ Add Another Invoice</button>
        </SectionCard>
      )}

      {showCashMemo && (
        <SectionCard title="Cash Memo Details" onRemove={() => setShowCashMemo(false)}>
          {cashMemos.map((memo, i) => (
            <div key={i} className="p-3 border rounded-md relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reference<RedAsterisk /></label>
                  <input type="text" placeholder="Reference" value={memo.reference} onChange={(e) => handleChange(setCashMemos, i, 'reference', e.target.value)} className="w-full p-2 border rounded" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Value (₹)<RedAsterisk /></label>
                  <input type="number" placeholder="Value" value={memo.value} onChange={(e) => handleChange(setCashMemos, i, 'value', e.target.value)} className="w-full p-2 border rounded" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Upload File<RedAsterisk /></label>
                  {memo.documentUrl && !memo.file && <a href={memo.documentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500">View Uploaded</a>}
                  <input type="file" onChange={(e) => handleFileChange(setCashMemos, i, e.target.files[0])} className="w-full text-sm" required={!memo.documentUrl}/>
                </div>
              </div>
              {cashMemos.length > 1 && <button onClick={() => handleRemoveRow(setCashMemos, i)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><X size={18} /></button>}
            </div>
          ))}
          <button onClick={() => handleAddRow(setCashMemos, { reference: '', value: '', file: null, documentUrl: '' })} className="text-sm text-blue-600 mt-2">+ Add Another Cash Memo</button>
        </SectionCard>
      )}

      {showCreditNote && (
        <SectionCard title="Credit Note Details" onRemove={() => setShowCreditNote(false)}>
          {creditNotes.map((note, i) => (
            <div key={i} className="p-3 border rounded-md relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reference<RedAsterisk /></label>
                  <input type="text" placeholder="Reference" value={note.reference} onChange={(e) => handleChange(setCreditNotes, i, 'reference', e.target.value)} className="w-full p-2 border rounded" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Value (₹)<RedAsterisk /></label>
                  <input type="number" placeholder="Value" value={note.value} onChange={(e) => handleChange(setCreditNotes, i, 'value', e.target.value)} className="w-full p-2 border rounded" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Upload File<RedAsterisk /></label>
                  {note.documentUrl && !note.file && <a href={note.documentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500">View Uploaded</a>}
                  <input type="file" onChange={(e) => handleFileChange(setCreditNotes, i, e.target.files[0])} className="w-full text-sm" required={!note.documentUrl}/>
                </div>
              </div>
              {creditNotes.length > 1 && <button onClick={() => handleRemoveRow(setCreditNotes, i)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><X size={18} /></button>}
            </div>
          ))}
          <button onClick={() => handleAddRow(setCreditNotes, { reference: '', value: '', file: null, documentUrl: '' })} className="text-sm text-blue-600 mt-2">+ Add Another Credit Note</button>
        </SectionCard>
      )}

      {(showInvoice || showCashMemo || showCreditNote) && (
        <div className="flex justify-center gap-4 mt-6">
          <button onClick={onClose} className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save All</button>
        </div>
      )}
    </div>
  );
}

export default React.memo(InvoiceForm);









