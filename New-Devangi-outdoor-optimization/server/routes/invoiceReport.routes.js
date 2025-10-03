// C:\Users\rajes\Downloads\New-Devangi-outdoor-optimization (5)\New-Devangi-outdoor-optimization\my-project\server\routes\invoiceReport.routes.js

import express from 'express';
import Invoice from '../models/invoice.model.js';

const router = express.Router();

/**
 * 1. Outstanding per entity (Aggregated by Entity Name)
 */
router.get('/outstanding', async (req, res) => {
  try {
    const results = await Invoice.aggregate([
      {
        $group: {
          // ✅ FIX: Use $ifNull to group null/missing entityName/entityType under a default string
          _id: { 
            name: { $ifNull: ["$entityName", "Legacy/Missing Entity"] }, 
            type: { $ifNull: ["$entityType", "L"] } // Use 'L' for the type abbreviation
          }, 
          totalBilled: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$totalPaid" },
          balanceDue: { $sum: "$balanceDue" }
        }
      },
      { // Reformat output for frontend compatibility
        $project: {
          _id: 0,
          client: { // Used in frontend tables/reports to display name
            name: "$_id.name",
            type: "$_id.type" 
          },
          totalBilled: 1,
          totalPaid: 1,
          balanceDue: 1,
        }
      }
    ]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * 2. Monthly invoice summary
 */
router.get('/monthly-summary', async (req, res) => {
  try {
    const results = await Invoice.aggregate([
      { $match: { status: { $in: ['issued', 'paid', 'partial'] } } },
      {
        $group: {
          _id: {
            year: { $year: "$invoiceDate" },
            month: { $month: "$invoiceDate" }
          },
          invoiceCount: { $sum: 1 },
          totalBilled: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$totalPaid" },
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * 3. GST / Tax report
 */
router.get('/gst', async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start date and end date are required for the GST report.' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Include the entire end date

  try {
    const results = await Invoice.aggregate([
      {
        $match: {
          invoiceDate: { $gte: start, $lte: end },
          status: { $in: ['issued', 'paid', 'partial'] }
        }
      },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalTaxable: { $sum: "$subtotal" },
          totalGST: { $sum: "$gstAmount" }
        }
      }
    ]);

    if (results.length === 0) {
      return res.json({ totalInvoices: 0, totalTaxable: 0, totalGST: 0 });
    }

    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * 4. Aging report (Updated to use entityName directly and fallback)
 */
router.get('/aging', async (req, res) => {
  try {
    const today = new Date();

    // Fetch necessary fields directly
    const invoices = await Invoice.find({ balanceDue: { $gt: 0 } }, "invoiceNumber entityName balanceDue dueDate entityType");

    const agingBuckets = { "0-30": [], "31-60": [], "61-90": [], "90+": [] };

    invoices.forEach(inv => {
      const daysOverdue = inv.dueDate ? Math.floor((today - inv.dueDate) / (1000 * 60 * 60 * 24)) : 0;
      
      // Create a report object compatible with the frontend's expected structure
      const reportInv = { 
          ...inv.toObject(), 
          // ✅ FIX: Stub object for the name property the frontend expects, using fallback
          clientId: { name: inv.entityName || 'Legacy/Missing Entity' } 
      };

      if (daysOverdue <= 30) agingBuckets["0-30"].push(reportInv);
      else if (daysOverdue <= 60) agingBuckets["31-60"].push(reportInv);
      else if (daysOverdue <= 90) agingBuckets["61-90"].push(reportInv);
      else agingBuckets["90+"].push(reportInv);
    });

    res.json(agingBuckets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;