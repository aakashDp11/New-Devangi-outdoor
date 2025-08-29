import express from 'express';
import Campaign from '../models/campaign.model.js';
import Space from '../models/space.model.js';
import { authenticate } from '../middleware/authenticate.middleware.js';

const router = express.Router();

// ===================================================================
// =========== EXISTING LOGIC (UNCHANGED) ============================
// ===================================================================

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
        path: 'spaces.id',
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

    const campaigns = await Campaign.find({ 'spaces.id': spaceId })
      .select('campaignName startDate endDate');

    res.status(200).json(campaigns);
  } catch (err) {
    console.error('Error fetching campaigns by space:', err);
    res.status(500).json({ message: 'Server error, could not fetch campaigns by space.' });
  }
});


// ===================================================================
// =========== START: NEW CAMPAIGN CREATION ROUTE ====================
// ===================================================================
/**
 * @route   POST /api/campaigns
 * @desc    Create a new campaign and immediately update space availability if it's active
 * @access  Private (Authenticated)
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const newCampaign = new Campaign(req.body);
        await newCampaign.save(); // First, save the campaign

        // --- START: LOGIC FOR IMMEDIATE REFLECTION ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(newCampaign.startDate);
        const endDate = new Date(newCampaign.endDate);

        // Check if the newly created campaign is active as of today
        if (startDate <= today && endDate >= today) {
            const spaceUnitUpdates = {};
            newCampaign.spaces.forEach(space => {
                if (space && space.id && space.selectedUnits > 0) {
                    const spaceId = space.id.toString();
                    spaceUnitUpdates[spaceId] = (spaceUnitUpdates[spaceId] || 0) + space.selectedUnits;
                }
            });

            const bulkOps = Object.keys(spaceUnitUpdates).map(spaceId => ({
                updateOne: {
                    filter: { _id: spaceId },
                    // INCREMENT the occupiedUnits count immediately
                    update: { $inc: { occupiedUnits: spaceUnitUpdates[spaceId] } }
                }
            }));

            if (bulkOps.length > 0) {
                await Space.bulkWrite(bulkOps);
                console.log(`[IMMEDIATE UPDATE] Incremented occupiedUnits for new campaign: ${newCampaign._id}`);
            }
        }
        // --- END: NEW LOGIC ---

        res.status(201).json({ message: "Campaign created successfully!", campaign: newCampaign });

    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({ error: 'Server error while creating campaign.' });
    }
});
// ===================================================================
// ============= END: NEW CAMPAIGN CREATION ROUTE ====================
// ===================================================================


// ===================================================================
// =========== START: NEW CAMPAIGN UPDATE ROUTE ======================
// ===================================================================
/**
 * @route   PUT /api/campaigns/:id
 * @desc    Update a campaign and immediately adjust space availability
 * @access  Private (Authenticated)
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        const campaignId = req.params.id;

        // 1. Get the state of the campaign BEFORE the update
        const campaignBeforeUpdate = await Campaign.findById(campaignId);
        if (!campaignBeforeUpdate) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // 2. Calculate the "before" occupied units map
        const unitsBeforeMap = new Map();
        campaignBeforeUpdate.spaces.forEach(s => {
            unitsBeforeMap.set(s.id.toString(), s.selectedUnits);
        });

        // 3. Perform the update
        const campaignAfterUpdate = await Campaign.findByIdAndUpdate(campaignId, req.body, { new: true });

        // 4. Check if the campaign's active status has changed or if spaces have changed
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const startDateBefore = new Date(campaignBeforeUpdate.startDate);
        const endDateBefore = new Date(campaignBeforeUpdate.endDate);
        const startDateAfter = new Date(campaignAfterUpdate.startDate);
        const endDateAfter = new Date(campaignAfterUpdate.endDate);

        const wasActiveBefore = startDateBefore <= today && endDateBefore >= today;
        const isActiveNow = startDateAfter <= today && endDateAfter >= today;

        const unitsDifferenceMap = new Map();

        // Calculate the "after" map
        const unitsAfterMap = new Map();
        campaignAfterUpdate.spaces.forEach(s => {
            unitsAfterMap.set(s.id.toString(), s.selectedUnits);
        });

        // Combine all unique space IDs from before and after
        const allSpaceIds = new Set([...unitsBeforeMap.keys(), ...unitsAfterMap.keys()]);

        allSpaceIds.forEach(spaceId => {
            const beforeUnits = unitsBeforeMap.get(spaceId) || 0;
            const afterUnits = unitsAfterMap.get(spaceId) || 0;
            
            let difference = 0;
            if (wasActiveBefore && !isActiveNow) { // Became inactive
                difference = -beforeUnits;
            } else if (!wasActiveBefore && isActiveNow) { // Became active
                difference = afterUnits;
            } else if (wasActiveBefore && isActiveNow) { // Remained active, units might have changed
                difference = afterUnits - beforeUnits;
            }
            
            if (difference !== 0) {
                unitsDifferenceMap.set(spaceId, difference);
            }
        });
        
        // 5. Apply the calculated differences to the database
        const bulkOps = [];
        for (const [spaceId, difference] of unitsDifferenceMap.entries()) {
            bulkOps.push({
                updateOne: {
                    filter: { _id: spaceId },
                    update: { $inc: { occupiedUnits: difference } }
                }
            });
        }

        if (bulkOps.length > 0) {
            await Space.bulkWrite(bulkOps);
            console.log(`[IMMEDIATE UPDATE] Adjusted occupiedUnits for updated campaign: ${campaignId}`);
        }

        res.json({ message: 'Campaign updated successfully!', campaign: campaignAfterUpdate });

    } catch (error) {
        console.error('Error updating campaign:', error);
        res.status(500).json({ error: 'Server error while updating campaign.' });
    }
});
// ===================================================================
// ============= END: NEW CAMPAIGN UPDATE ROUTE ======================
// ===================================================================


// ===================================================================
// =========== EXISTING LOGIC (UNCHANGED) ============================
// ===================================================================
/**
 * @route   DELETE /api/campaigns/:id
 * @desc    Delete a campaign and immediately update space availability
 * @access  Private (Authenticated)
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const campaignId = req.params.id;
        const campaignToDelete = await Campaign.findById(campaignId);
        if (!campaignToDelete) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(campaignToDelete.startDate);
        const endDate = new Date(campaignToDelete.endDate);
        if (startDate <= today && endDate >= today) {
            if (campaignToDelete.spaces && campaignToDelete.spaces.length > 0) {
                const spaceUnitUpdates = {};
                campaignToDelete.spaces.forEach(space => {
                    if (space && space.id && space.selectedUnits > 0) {
                        const spaceId = space.id.toString();
                        spaceUnitUpdates[spaceId] = (spaceUnitUpdates[spaceId] || 0) + space.selectedUnits;
                    }
                });
                const bulkOps = Object.keys(spaceUnitUpdates).map(spaceId => ({
                    updateOne: {
                        filter: { _id: spaceId },
                        update: { $inc: { occupiedUnits: -spaceUnitUpdates[spaceId] } }
                    }
                }));
                if (bulkOps.length > 0) {
                    await Space.bulkWrite(bulkOps);
                    console.log(`[IMMEDIATE UPDATE] Decremented occupiedUnits for spaces from deleted campaign: ${campaignId}`);
                }
            }
        }
        await Campaign.findByIdAndDelete(campaignId);
        res.json({ message: 'Campaign deleted successfully and space availability updated immediately.' });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        res.status(500).json({ error: 'Server error while deleting campaign.' });
    }
});


export default router;