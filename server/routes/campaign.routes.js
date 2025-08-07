import express from 'express';
import Campaign from '../models/campaign.model.js';
// These imports are good for context but not strictly needed for the route to function
// import Space from '../models/space.model.js'; 
// import Pipeline from '../models/pipeline.model.js';

const router = express.Router();

/**
 * @route   GET /api/campaigns
 * @desc    Get all campaigns with populated pipeline and space details
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find({})
      // 1. Select the top-level fields from the Campaign model.
      // We must include 'pipeline' and 'spaces' so they are available to be populated.
      .select('campaignName startDate endDate pipeline spaces')

      // 2. Populate the 'pipeline' field.
      // The `printingStatus` and `mountingStatus` fields DO NOT exist on the Pipeline model,
      // so we remove them from this selection.
      .populate({
        path: 'pipeline',
        select: 'bookingStatus artwork po invoice' // <-- CORRECTED: Removed printing/mounting status
      })

      // 3. Populate the 'spaces' field.
      // This is where `printingStatus` and `mountingStatus` ACTUALLY live.
      // This part of your code was already correct.
      .populate({
        path: 'spaces',
        select: 'spaceName spaceType price printingStatus mountingStatus' // <-- This correctly fetches the statuses
      });

    res.status(200).json({ campaigns });
    
  } catch (err) {
    console.error('Error fetching campaigns:', err);
    res.status(500).json({ message: 'Server error, could not fetch campaigns.' });
  }
});

export default router;