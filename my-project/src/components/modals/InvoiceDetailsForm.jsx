// Updated InvoiceForm.jsx with non-mandatory uploads, consistent fields, and inline validations

import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { PipelineContext } from '../../context/PipelineContext';
import { toast } from 'sonner';
import { Plus, X, FileText, Receipt, CreditCard, AlertCircle } from 'lucide-react';

// Validation utility functions
const validateNumber = (value, min = 0) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > min;
};

const validateDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return date instanceof Date && !isNaN(date) && date <= today;
};

const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

// Error message component
const ErrorMessage = ({ message }) => (
  message ? (
    <div className="flex items-center text-red-500 text-xs mt-1">
      <AlertCircle className="w-3 h-3 mr-1" />
      {message}
    </div>
  ) : null
);

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

// Memoized AddButton Component
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
  const [errors, setErrors] = useState({});

  const [showInvoice, setShowInvoice] = useState(false);
  const [showCashMemo, setShowCashMemo] = useState(false);
  const [showCreditNote, setShowCreditNote] = useState(false);
  const { setPipelineData } = useContext(PipelineContext);

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

  // Validation function for individual fields
  const validateField = (section, index, field, value) => {
    const errorKey = `${section}_${index}_${field}`;
    let errorMessage = '';

    switch (field) {
      case 'invoiceNumber':
      case 'cashMemoNumber':
      case 'creditNoteNumber':
        if (!validateRequired(value)) {
          errorMessage = 'This field is required';
        } else if (value.length < 2) {
          errorMessage = 'Must be at least 2 characters';
        }
        break;
      
      case 'invoiceDate':
      case 'cashMemoDate':
      case 'creditNoteDate':
        if (!validateRequired(value)) {
          errorMessage = 'Date is required';
        } else if (!validateDate(value)) {
          errorMessage = 'Invalid date or future date';
        }
        break;
      
      case 'invoiceValue':
      case 'cashMemoValue':
      case 'creditNoteValue':
        if (!validateRequired(value)) {
          errorMessage = 'Value is required';
        } else if (!validateNumber(value, 0)) {
          errorMessage = 'Must be a positive number';
        } else if (parseFloat(value) > 10000000) {
          errorMessage = 'Value seems too high';
        }
        break;
      
      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [errorKey]: errorMessage
    }));

    return errorMessage === '';
  };

  const handleFileChange = (listSetter, index, file) => {
    // Validate file if provided
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      
      if (file.size > maxSize) {
        toast.error('File size should not exceed 10MB');
        return;
      }
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, JPEG, PNG files are allowed');
        return;
      }
    }
    
    listSetter(prev => prev.map((item, i) => i === index ? { ...item, file } : item));
  };

  const handleChange = (listSetter, section, index, field, value) => {
    // Validate field
    validateField(section, index, field, value);
    
    listSetter(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleAddRow = (listSetter, template) => {
    listSetter(prev => [...prev, { ...template }]);
  };

  const handleRemoveRow = (listSetter, index, section) => {
    // Clear errors for removed row
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`${section}_${index}_`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
    
    listSetter(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    let hasErrors = false;
    const newErrors = {};

    // Validate all sections
    const validateSection = (items, sectionName, fields) => {
      items.forEach((item, index) => {
        fields.forEach(field => {
          const isValid = validateField(sectionName, index, field, item[field]);
          if (!isValid) hasErrors = true;
        });
      });
    };

    if (showInvoice && invoices.length > 0) {
      validateSection(invoices, 'invoice', ['invoiceNumber', 'invoiceDate', 'invoiceValue']);
    }
    if (showCashMemo && cashMemos.length > 0) {
      validateSection(cashMemos, 'cashMemo', ['cashMemoNumber', 'cashMemoDate', 'cashMemoValue']);
    }
    if (showCreditNote && creditNotes.length > 0) {
      validateSection(creditNotes, 'creditNote', ['creditNoteNumber', 'creditNoteDate', 'creditNoteValue']);
    }

    if (hasErrors) {
      toast.error('Please fix all validation errors before saving');
      return;
    }

    // Check if at least one section has data
    if (!showInvoice && !showCashMemo && !showCreditNote) {
      toast.error('Please add at least one document section');
      return;
    }

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

      if (showInvoice && invoices.length > 0) await uploadSection('invoice/upload', invoices);
      if (showCashMemo && cashMemos.length > 0) await uploadSection('cash-memo/upload', cashMemos);
      if (showCreditNote && creditNotes.length > 0) await uploadSection('credit-note/upload', creditNotes);

      toast.success('All documents saved successfully!');
      onConfirm();
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('An error occurred during save.');
    }
  };

  const RedAsterisk = () => <span className="text-red-500 ml-1">*</span>;

  const getErrorMessage = (section, index, field) => {
    return errors[`${section}_${index}_${field}`] || '';
  };

  const renderDocumentSection = (items, setItems, section, title, template) => (
    <SectionCard title={title} onRemove={() => {
      if (section === 'invoice') setShowInvoice(false);
      else if (section === 'cashMemo') setShowCashMemo(false);
      else setShowCreditNote(false);
    }}>
      {items.map((item, i) => (
        <div key={i} className="p-3 border rounded-md relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {section === 'invoice' ? 'Invoice Number' : 
                 section === 'cashMemo' ? 'Cash Memo Number' : 'Credit Note Number'}
                <RedAsterisk />
              </label>
              <input 
                type="text" 
                placeholder="Number" 
                value={item[`${section}Number`] || ''} 
                onChange={(e) => handleChange(setItems, section, i, `${section}Number`, e.target.value)}
                className={`w-full p-2 border rounded ${getErrorMessage(section, i, `${section}Number`) ? 'border-red-500' : 'border-gray-300'}`}
                onBlur={() => validateField(section, i, `${section}Number`, item[`${section}Number`] || '')}
              />
              <ErrorMessage message={getErrorMessage(section, i, `${section}Number`)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {section === 'invoice' ? 'Invoice Date' : 
                 section === 'cashMemo' ? 'Cash Memo Date' : 'Credit Note Date'}
                <RedAsterisk />
              </label>
              <input 
                type="date" 
                value={item[`${section}Date`] || ''} 
                onChange={(e) => handleChange(setItems, section, i, `${section}Date`, e.target.value)}
                className={`w-full p-2 border rounded ${getErrorMessage(section, i, `${section}Date`) ? 'border-red-500' : 'border-gray-300'}`}
                max={new Date().toISOString().split('T')[0]}
                onBlur={() => validateField(section, i, `${section}Date`, item[`${section}Date`] || '')}
              />
              <ErrorMessage message={getErrorMessage(section, i, `${section}Date`)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {section === 'invoice' ? 'Invoice Value (₹)' : 
                 section === 'cashMemo' ? 'Cash Memo Value (₹)' : 'Credit Note Value (₹)'}
                <RedAsterisk />
              </label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={item[`${section}Value`] || ''} 
                onChange={(e) => handleChange(setItems, section, i, `${section}Value`, e.target.value)}
                className={`w-full p-2 border rounded ${getErrorMessage(section, i, `${section}Value`) ? 'border-red-500' : 'border-gray-300'}`}
                min="0"
                step="0.01"
                onBlur={() => validateField(section, i, `${section}Value`, item[`${section}Value`] || '')}
              />
              <ErrorMessage message={getErrorMessage(section, i, `${section}Value`)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Upload File <span className="text-gray-400">(Optional)</span>
              </label>
              {item.documentUrl && !item.file && (
                <a href={item.documentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 block mb-1">
                  View Uploaded File
                </a>
              )}
              <input 
                type="file" 
                onChange={(e) => handleFileChange(setItems, i, e.target.files[0])} 
                className="w-full text-sm"
                accept=".pdf,.jpeg,.jpg,.png"
              />
              <div className="text-xs text-gray-400 mt-1">PDF, JPEG, PNG (max 10MB)</div>
            </div>
          </div>
          {items.length > 1 && (
            <button 
              onClick={() => handleRemoveRow(setItems, i, section)} 
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              <X size={18} />
            </button>
          )}
        </div>
      ))}
      <button 
        onClick={() => handleAddRow(setItems, template)} 
        className="text-sm text-blue-600 mt-2 hover:text-blue-800"
      >
        + Add Another {title.replace(' Details', '')}
      </button>
    </SectionCard>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Upload Billing Documents</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <AddButton 
          onClick={() => {
            setShowInvoice(true);
            if (invoices.length === 0) {
              setInvoices([{ invoiceNumber: '', invoiceDate: '', invoiceValue: '', file: null, documentUrl: '' }]);
            }
          }} 
          icon={FileText} 
          title="Invoices" 
          description="Add invoice section" 
          isActive={showInvoice} 
        />
        <AddButton 
          onClick={() => {
            setShowCashMemo(true);
            if (cashMemos.length === 0) {
              setCashMemos([{ cashMemoNumber: '', cashMemoDate: '', cashMemoValue: '', file: null, documentUrl: '' }]);
            }
          }} 
          icon={Receipt} 
          title="Cash Memos" 
          description="Add cash memo section"
          isActive={showCashMemo} 
        />
        <AddButton 
          onClick={() => {
            setShowCreditNote(true);
            if (creditNotes.length === 0) {
              setCreditNotes([{ creditNoteNumber: '', creditNoteDate: '', creditNoteValue: '', file: null, documentUrl: '' }]);
            }
          }} 
          icon={CreditCard} 
          title="Credit Notes" 
          description="Add credit note section"
          isActive={showCreditNote} 
        />
      </div>
      
      {showInvoice && renderDocumentSection(
        invoices, 
        setInvoices, 
        'invoice', 
        'Invoice Details',
        { invoiceNumber: '', invoiceDate: '', invoiceValue: '', file: null, documentUrl: '' }
      )}

      {showCashMemo && renderDocumentSection(
        cashMemos, 
        setCashMemos, 
        'cashMemo', 
        'Cash Memo Details',
        { cashMemoNumber: '', cashMemoDate: '', cashMemoValue: '', file: null, documentUrl: '' }
      )}

      {showCreditNote && renderDocumentSection(
        creditNotes, 
        setCreditNotes, 
        'creditNote', 
        'Credit Note Details',
        { creditNoteNumber: '', creditNoteDate: '', creditNoteValue: '', file: null, documentUrl: '' }
      )}

      {(showInvoice || showCashMemo || showCreditNote) && (
        <div className="flex justify-center gap-4 mt-6">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Save All
          </button>
        </div>
      )}
    </div>
  );
}

export default React.memo(InvoiceForm);