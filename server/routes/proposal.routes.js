import express from 'express';
import Proposal from '../models/proposal.model.js';

const router = express.Router();

// Create Proposal
router.post('/', async (req, res) => {
  try {
    const proposal = new Proposal(req.body);
    await proposal.save();
    res.status(201).json(proposal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get All Proposals
router.get('/', async (req, res) => {
  try {
    const proposals = await Proposal.find();
    res.json(proposals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Single Proposal
// routes/proposal.routes.js

router.get('/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate('spaces');
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch proposal' });
  }
});


// Update Proposal
// routes/proposal.routes.js
router.put('/:id', async (req, res) => {
  try {
    const updatedProposal = await Proposal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProposal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update proposal' });
  }
});


// Delete Proposal
router.delete('/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findByIdAndDelete(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Proposal deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
