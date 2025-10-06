import axios from 'axios';

// This is your correctly configured API instance.
const API = axios.create({ baseURL: 'http://localhost:3000/api/notifications' });

// --- Existing Functions ---

export const getNotifications = () => API.get('/');

export const markAsRead = (id) => API.put(`/${id}/read`);

export const markAllAsRead = () => API.put('/mark-all-read');

export const deleteNotification = (id) => API.delete(`/${id}`);


// --- ✅ NEW FUNCTION ADDED ---

/**
 * Fetches only the count of unread notifications from the backend.
 * This will make a GET request to http://localhost:3000/api/notifications/unread-count
 */
export const getUnreadNotificationsCount = () => API.get('/unread-count');