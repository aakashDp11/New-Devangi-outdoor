import { Router } from 'express';
import Campaign from '../models/campaign.model.js';
import Space from '../models/space.model.js'; // <-- Import the Space model
import { authenticate } from '../middleware/authenticate.middleware.js'; // <-- For security

const router = Router();

// Your existing route for debugging pipelines
router.get('/pipeline/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const campaign = await Campaign.findById(id).populate('pipeline');
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    return res.json({
      message: 'Pipeline population successful',
      pipeline: campaign.pipeline,
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
});


// ===================================================================
// =========== START: NEW RESYNCHRONIZATION ROUTE ====================
// ===================================================================
/**
 * @route   POST /api/debug/resync-occupied-units
 * @desc    A powerful one-time tool to resynchronize all occupiedUnits counts.
 *          It resets all counts to zero and then recalculates them based on ALL currently active campaigns.
 * @access  Private (Admin Only Recommended)
 */
router.post('/resync-occupied-units', authenticate, async (req, res) => {
    try {
        console.log('[RESYNC STARTED] Starting full resynchronization of occupiedUnits...');

        // Step 1: Reset all occupiedUnits to 0 for every space.
        const resetResult = await Space.updateMany({}, { $set: { occupiedUnits: 0 } });
        console.log(` -> Step 1 Complete: Reset occupiedUnits for ${resetResult.modifiedCount} spaces.`);

        // Step 2: Find ALL campaigns that are currently active.
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];

        const activeCampaigns = await Campaign.find({
            startDate: { $lte: todayString },
            endDate: { $gte: todayString }
        });

        if (activeCampaigns.length === 0) {
            console.log('[RESYNC COMPLETE] No active campaigns found. All units have been set to 0.');
            return res.status(200).json({ message: 'Resync complete. No active campaigns found.' });
        }
        console.log(` -> Step 2 Complete: Found ${activeCampaigns.length} currently active campaigns.`);

        // Step 3: Recalculate the correct occupiedUnits count based on your schema.
        const spaceUnitUpdates = {};
        activeCampaigns.forEach(campaign => {
            (campaign.spaces || []).forEach(space => {
                if (space && space.id && space.selectedUnits > 0) {
                    const spaceId = space.id.toString();
                    spaceUnitUpdates[spaceId] = (spaceUnitUpdates[spaceId] || 0) + space.selectedUnits;
                }
            });
        });

        // Step 4: Perform a bulk update to set the new, correct counts.
        const bulkOps = Object.keys(spaceUnitUpdates).map(spaceId => ({
            updateOne: {
                filter: { _id: spaceId },
                // Use $inc to add the calculated total to the now-zeroed field.
                update: { $inc: { occupiedUnits: spaceUnitUpdates[spaceId] } }
            }
        }));

        if (bulkOps.length > 0) {
            const result = await Space.bulkWrite(bulkOps);
            console.log(` -> Step 3 Complete: Successfully updated occupiedUnits for ${result.modifiedCount} spaces.`);
            console.log('[RESYNC COMPLETE] Full resynchronization finished successfully.');
            return res.status(200).json({
                message: 'Full resynchronization of occupied units is complete.',
                updatedSpaces: result.modifiedCount
            });
        } else {
            console.log('[RESYNC COMPLETE] No spaces needed updates.');
            return res.status(200).json({ message: 'Resync complete. No spaces needed updates.' });
        }

    } catch (error) {
        console.error('❌❌❌ Critical error during full resync:', error);
        return res.status(500).json({ error: 'A critical error occurred during the resync process.' });
    }
});
// ===================================================================
// ============= END: NEW RESYNCHRONIZATION ROUTE ====================
// ===================================================================

export default router;