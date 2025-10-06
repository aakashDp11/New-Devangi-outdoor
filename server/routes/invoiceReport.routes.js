import express from 'express';
import Invoice from '../models/invoice.model.js';

const router = express.Router();

/**
 * 1. Outstanding per client
 */
router.get('/outstanding', async (req, res) => {
  try {
    const results = await Invoice.aggregate([
      {
        $group: {
          _id: "$clientId",
          totalBilled: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$totalPaid" },
          balanceDue: { $sum: "$balanceDue" }
        }
      },
      {
        $lookup: {
          from: "clientdetails", // collection name
          localField: "_id",
          foreignField: "_id",
          as: "client"
        }
      },
      { $unwind: "$client" }
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
      {
        $group: {
          _id: { year: { $year: "$invoiceDate" }, month: { $month: "$invoiceDate" } },
          totalBilled: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$totalPaid" },
          invoiceCount: { $sum: 1 }
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
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    if (startDate && endDate) {
      filter.invoiceDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const results = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalGST: { $sum: "$gstAmount" },
          totalTaxable: { $sum: "$subtotal" },
          totalInvoices: { $sum: 1 }
        }
      }
    ]);
    res.json(results[0] || { totalGST: 0, totalTaxable: 0, totalInvoices: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * 4. Aging report
 */
router.get('/aging', async (req, res) => {
  try {
    const today = new Date();

    const invoices = await Invoice.find({ balanceDue: { $gt: 0 } }, "invoiceNumber clientId balanceDue dueDate")
      .populate("clientId");

    const agingBuckets = { "0-30": [], "31-60": [], "61-90": [], "90+": [] };

    invoices.forEach(inv => {
      const daysOverdue = inv.dueDate ? Math.floor((today - inv.dueDate) / (1000 * 60 * 60 * 24)) : 0;
      if (daysOverdue <= 30) agingBuckets["0-30"].push(inv);
      else if (daysOverdue <= 60) agingBuckets["31-60"].push(inv);
      else if (daysOverdue <= 90) agingBuckets["61-90"].push(inv);
      else agingBuckets["90+"].push(inv);
    });

    res.json(agingBuckets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;