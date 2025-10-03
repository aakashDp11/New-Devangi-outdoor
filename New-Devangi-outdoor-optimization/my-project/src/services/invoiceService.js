// C:\Users\rajes\Downloads\New-Devangi-outdoor-optimization (5)\New-Devangi-outdoor-optimization\my-project\src\services\invoiceService.js

// 🚨 FIX: Use VITE_API_BASE_URL (http://localhost:3000) for the root endpoint
const API_ROOT = import.meta.env.VITE_API_BASE_URL;
// Construct the full API URL for invoices
const API_BASE_URL = `${API_ROOT}/api/invoices`;

const handleResponse = async (response) => {
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error Status ${response.status}:`, errorText);
        // Attempt to parse JSON error, fallback to text
        try {
            const error = JSON.parse(errorText);
            throw new Error(error.message || `API call failed with status ${response.status}`);
        } catch (e) {
            throw new Error(`API call failed with status ${response.status}: ${errorText.substring(0, 100)}...`);
        }
    }
    try {
        return response.json();
    } catch (e) {
        // Handle 204 No Content/successful deletion scenarios that return no body
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return {}; 
        }
        throw new Error("Failed to parse JSON response.");
    }
};

// --- CRUD Operations ---

// Create a new invoice
export const createInvoice = async (invoiceData) => {
    const response = await fetch(API_BASE_URL, { // Uses full path: http://localhost:3000/api/invoices
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
    });
    return handleResponse(response);
};

// Get all invoices (for a list/dashboard)
export const getAllInvoices = async () => {
    const response = await fetch(API_BASE_URL, {
        headers: {},
    });
    return handleResponse(response);
};

// Get a single invoice by ID
export const getInvoiceById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        headers: {},
    });
    return handleResponse(response);
};

// Update an existing invoice
export const updateInvoice = async (id, invoiceData) => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
    });
    return handleResponse(response);
};

// Delete an invoice
export const deleteInvoice = async (id) => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {},
    });
    return handleResponse(response);
};

// Add a payment to an invoice (used by PaymentModal)
export const addPayment = async (invoiceId, paymentData) => {
    const response = await fetch(`${API_BASE_URL}/${invoiceId}/payments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
    });
    return handleResponse(response);
};

// --- Entity Fetching (DEPRECATED: Placeholder for old code references) ---
export const getAllClients = async () => {
    return []; 
}; 
export const getAllVendors = async () => {
    return []; 
}; 
export const getAllAgencies = async () => {
    return []; 
}; 


// --- Report Endpoints ---

export const getOutstandingReport = async () => {
    const response = await fetch(`${API_BASE_URL}/reports/outstanding`, {
        headers: {},
    });
    return handleResponse(response);
};

export const getMonthlySummary = async () => {
    const response = await fetch(`${API_BASE_URL}/reports/monthly-summary`, {
        headers: {},
    });
    return handleResponse(response);
};

export const getGSTReport = async (startDate, endDate) => {
    const response = await fetch(`${API_BASE_URL}/reports/gst?startDate=${startDate}&endDate=${endDate}`, {
        headers: {},
    });
    return handleResponse(response);
};

export const getAgingReport = async () => {
    const response = await fetch(`${API_BASE_URL}/reports/aging`, {
        headers: {},
    });
    return handleResponse(response);
};