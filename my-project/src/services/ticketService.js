// services/ticketService.js

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const ticketAPI = axios.create({
  baseURL: `${API_BASE_URL}/tickets`,
  headers: {
    'Content-Type': 'application/json',
  },
});

ticketAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

ticketAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const ticketService = {
  createTicket: async (ticketData, files = []) => {
    const formData = new FormData();
    
    Object.keys(ticketData).forEach(key => {
      formData.append(key, ticketData[key]);
    });
    
    files.forEach(file => {
      formData.append('attachments', file);
    });

    const response = await ticketAPI.post('/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getUserTickets: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await ticketAPI.get(`/my-tickets?${queryString}`);
    return response.data;
  },

  getTicketById: async (ticketId) => {
    const response = await ticketAPI.get(`/${ticketId}`);
    return response.data;
  },

  addTicketMessage: async (ticketId, message, isInternal = false) => {
    const response = await ticketAPI.post(`/${ticketId}/message`, {
      message,
      isInternal,
    });
    return response.data;
  },

  updateTicketStatus: async (ticketId, status, resolution = '') => {
    const response = await ticketAPI.put(`/${ticketId}/status`, {
      status,
      resolution,
    });
    return response.data;
  },

  getAllTickets: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await ticketAPI.get(`/admin/all?${queryString}`);
    return response.data;
  },

  getTicketStats: async () => {
    const response = await ticketAPI.get('/admin/stats');
    return response.data;
  },

  createEmailTicket: async (ticketData) => {
    const response = await ticketAPI.post('/create-email-ticket', ticketData);
    return response.data;
  },

  updateTicket: async (ticketId, updateData) => {
    const response = await ticketAPI.put(`/${ticketId}`, updateData);
    return response.data;
  },

  deleteTicket: async (ticketId) => {
    const response = await ticketAPI.delete(`/${ticketId}`);
    return response.data;
  },
};