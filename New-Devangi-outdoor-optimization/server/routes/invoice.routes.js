// C:\Users\rajes\Downloads\New-Devangi-outdoor-optimization (5)\New-Devangi-outdoor-optimization\my-project\server\routes\invoice.routes.js

import express from 'express';
import Invoice from '../models/invoice.model.js';

const router = express.Router();

// Create invoice
router.post('/', async (req, res) => {
  try {
    // Saves entityName and entityType directly
    const invoice = new Invoice(req.body);
    await invoice.save();
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all invoices
router.get('/', async (req, res) => {
  try {
    const { entityType, status, startDate, endDate } = req.query;
    const filter = {};
    
    if (entityType) filter.entityType = entityType;
    if (status) filter.status = status;
    if (startDate && endDate) filter.invoiceDate = { $gte: new Date(startDate), $lte: new Date(endDate) };

    const invoices = await Invoice.find(filter); 
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one invoice
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id); 
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add payment
router.post('/:id/payments', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    invoice.payments.push(req.body);
    await invoice.save();
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update invoice
router.put('/:id', async (req, res) => {
  try {
    // FIX: Use findById + save instead of findByIdAndUpdate
    // This ensures the pre('save') middleware hook runs to recalculate totals
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Update the invoice fields with the request body
    Object.assign(invoice, req.body);
    
    // Save will trigger the pre('save') middleware for calculations
    await invoice.save();
    
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;