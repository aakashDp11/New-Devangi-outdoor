// server/routes/ticketroutes.js

import express from 'express';
import {
  createTicket,
  getUserTickets,
  getTicketById,
  addTicketMessage,
  updateTicketStatus,
  getAllTickets,
  getTicketStats,
  createEmailTicket,
  updateTicket,
  deleteTicket,
  upload
} from '../controllers/ticketController.js';
import { authenticate } from '../middleware/authenticate.middleware.js';

const router = express.Router();

// User routes
router.post('/create', authenticate, upload.array('attachments', 5), createTicket);
router.get('/my-tickets', authenticate, getUserTickets);
router.get('/:ticketId', authenticate, getTicketById);
router.post('/:ticketId/message', authenticate, addTicketMessage);
router.post('/create-email-ticket', authenticate, createEmailTicket);

// Admin routes
router.get('/admin/all', authenticate, getAllTickets);
router.get('/admin/stats', authenticate, getTicketStats);
router.put('/:ticketId/status', authenticate, updateTicketStatus);
router.put('/:ticketId', authenticate, updateTicket);
router.delete('/:ticketId', authenticate, deleteTicket);

export default router;