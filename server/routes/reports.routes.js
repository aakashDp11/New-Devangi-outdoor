// In backend/routes/reports.routes.js

import express from 'express';
import { getTradeMarginReport } from '../controllers/reports.controller.js'; // We will create this next
import { authenticate } from '../middleware/authenticate.middleware.js';

const router = express.Router();

// @route   GET /api/reports/trade-margin
// @desc    Get data for the Trade Margin Report
// @access  Public (or add authentication middleware if needed)
router.get('/trade-margin', authenticate, getTradeMarginReport);

export default router;