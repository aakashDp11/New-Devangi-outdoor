

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
        <AddButton onClick={() => setShowCashMemo(true)} icon={Receipt} title="Cash Memos" isActive={showCashMemo}  />
        <AddButton onClick={() => setShowCreditNote(true)} icon={CreditCard} title="Credit Notes"  isActive={showCreditNote} />
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









