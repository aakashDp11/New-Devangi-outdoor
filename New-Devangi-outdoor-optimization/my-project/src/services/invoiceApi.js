import axios from 'axios';

// *** UPDATED BASE URL TO localhost:3000 ***
const BASE_URL = 'http://localhost:3000';

const API = axios.create({
  baseURL: `${BASE_URL}/api/invoices`,
});

// --- CRUD Operations ---

export const fetchInvoices = (filters = {}) => {
  return API.get('/', { params: filters });
};

export const fetchInvoiceById = (id) => {
  return API.get(`/${id}`);
};

export const createInvoice = (invoiceData) => {
  return API.post('/', invoiceData);
};

export const updateInvoice = (id, updateData) => {
  return API.put(`/${id}`, updateData);
};

export const deleteInvoice = (id) => {
  return API.delete(`/${id}`);
};

// --- Payments ---

export const addPayment = (invoiceId, paymentData) => {
  return API.post(`/${invoiceId}/payments`, paymentData);
};

// --- Reports ---
// Note: Reports use a different base URL that points to /api/reports/
export const fetchOutstandingReport = () => {
  return axios.get(`${BASE_URL}/api/reports/outstanding`);
};

export const fetchMonthlySummary = () => {
  return axios.get(`${BASE_URL}/api/reports/monthly-summary`);
};

export const fetchGSTReport = (startDate, endDate) => {
  return axios.get(`${BASE_URL}/api/reports/gst`, { params: { startDate, endDate } });
};

export const fetchAgingReport = () => {
  return axios.get(`${BASE_URL}/api/reports/aging`);
};