import express from 'express';
import Campaign from '../models/campign.model.js';

const router = express.Router();
router.get('/', async (req, res) => {
    try {
      const campaigns = await Campaign.find({}, 'campaignName startDate endDate'); // Select only required fields
      res.status(200).json({campaigns});
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error, could not fetch campaigns.' });
    }
  });

export default router;