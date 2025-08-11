import express from 'express';
import Campaign from '../models/campaign.model.js';

const router = express.Router();

/**
 * @route   GET /api/campaigns
 * @desc    Get all campaigns with populated pipeline and space details
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find({})
      .select('campaignName startDate endDate pipeline spaces')
      .populate({
        path: 'pipeline',
        select: 'bookingStatus artwork po invoice'
      })
      .populate({
        path: 'spaces.id', // ✅ fixed populate path
        select: 'spaceName spaceType price printingStatus mountingStatus'
      });

    res.status(200).json({ campaigns });
    
  } catch (err) {
    console.error('Error fetching campaigns:', err);
    res.status(500).json({ message: 'Server error, could not fetch campaigns.' });
  }
});

/**
 * @route   GET /api/campaigns/by-space/:spaceId
 * @desc    Get all campaigns that include a specific space ID
 * @access  Public
 */
router.get('/by-space/:spaceId', async (req, res) => {
  try {
    const { spaceId } = req.params;

    // Find all campaigns where the `spaces` array contains an object with the given spaceId
    const campaigns = await Campaign.find({ 'spaces.id': spaceId })
      .select('campaignName startDate endDate'); // Select only the fields needed by the frontend

    res.status(200).json(campaigns);
  } catch (err) {
    console.error('Error fetching campaigns by space:', err);
    res.status(500).json({ message: 'Server error, could not fetch campaigns by space.' });
  }
});


export default router;