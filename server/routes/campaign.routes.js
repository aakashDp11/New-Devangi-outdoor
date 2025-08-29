import express from 'express';
import Campaign from '../models/campaign.model.js';
import Space from '../models/space.model.js';
import Booking from '../models/booking.model.js';
import Pipeline from '../models/pipeline.model.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import mongoose from 'mongoose';

const router = express.Router();

// This route remains unchanged
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

// ===================================================================
// =========== START OF THE CORRECTED CODE BLOCK =====================
// ===================================================================
/**
 * @route   GET /api/campaigns/:id
 * @desc    Get a single campaign's details, including the full parent booking and space objects.
 * @access  Private (Authenticated)
 */
router.get('/:id', async (req, res) => {
  try {
    const campaignId = req.params.id;

    // Step 1: Find the parent booking and get the FULL document.
    const parentBooking = await Booking.findOne({ campaigns: campaignId }).lean(); 

    // Step 2: Find the campaign and populate the FULL space documents.
    const campaign = await Campaign.findById(campaignId)
      .populate({
        path: 'spaces.id' // Get all fields from the Space model
      })
      .lean();

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Step 3: Construct a response that includes the full objects for the frontend.
    const responseData = {
      ...campaign, 
      booking: parentBooking, // Send the entire booking object
      bookingName: parentBooking ? (parentBooking.companyName || parentBooking.clientName) : 'N/A',
      spaceNames: campaign.spaces ? campaign.spaces.map(space => space.id?.spaceName).filter(Boolean) : []
    };

    res.status(200).json(responseData);

  } catch (err) {
    console.error('Error fetching single campaign:', err);
    if (err.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid campaign ID format' });
    }
    res.status(500).json({ message: 'Server error, could not fetch the campaign.' });
  }
});
// ===================================================================
// ============= END OF THE CORRECTED CODE BLOCK =====================
// ===================================================================


// All other routes below this line remain unchanged.
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

router.post('/', authenticate, async (req, res) => {
    try {
        const newCampaign = new Campaign(req.body);
        await newCampaign.save();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(newCampaign.startDate);
        const endDate = new Date(newCampaign.endDate);
        
        // Only update occupied units if the campaign is not FOC
        if (!newCampaign.isFOC && startDate <= today && endDate >= today) {
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
                    update: { $inc: { occupiedUnits: spaceUnitUpdates[spaceId] } }
                }
            }));
            if (bulkOps.length > 0) {
                await Space.bulkWrite(bulkOps);
            }
        }
        res.status(201).json({ message: "Campaign created successfully!", campaign: newCampaign });
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({ error: 'Server error while creating campaign.' });
    }
});

router.put('/:id', authenticate, async (req, res) => {
    try {
        const campaignId = req.params.id;
        const campaignBeforeUpdate = await Campaign.findById(campaignId);
        if (!campaignBeforeUpdate) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        const unitsBeforeMap = new Map();
        campaignBeforeUpdate.spaces.forEach(s => {
            unitsBeforeMap.set(s.id.toString(), s.selectedUnits);
        });
        const campaignAfterUpdate = await Campaign.findByIdAndUpdate(campaignId, req.body, { new: true });
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const startDateBefore = new Date(campaignBeforeUpdate.startDate);
        const endDateBefore = new Date(campaignBeforeUpdate.endDate);
        const startDateAfter = new Date(campaignAfterUpdate.startDate);
        const endDateAfter = new Date(campaignAfterUpdate.endDate);
        const wasActiveBefore = startDateBefore <= today && endDateBefore >= today;
        const isActiveNow = startDateAfter <= today && endDateAfter >= today;
        const unitsDifferenceMap = new Map();
        const unitsAfterMap = new Map();
        campaignAfterUpdate.spaces.forEach(s => {
            unitsAfterMap.set(s.id.toString(), s.selectedUnits);
        });
        const allSpaceIds = new Set([...unitsBeforeMap.keys(), ...unitsAfterMap.keys()]);
        
        // Only update occupied units if the campaign is NOT FOC, both before and after
        if (!campaignAfterUpdate.isFOC) { // Apply changes only if the updated campaign is not FOC
            allSpaceIds.forEach(spaceId => {
                const beforeUnits = (campaignBeforeUpdate.isFOC) ? 0 : (unitsBeforeMap.get(spaceId) || 0); // If before was FOC, consider units as 0 for diff calc
                const afterUnits = (campaignAfterUpdate.isFOC) ? 0 : (unitsAfterMap.get(spaceId) || 0); // If after is FOC, consider units as 0
                
                let difference = 0;

                // Scenario 1: Campaign was active and not FOC, now it's inactive (or FOC)
                if (wasActiveBefore && !campaignBeforeUpdate.isFOC && (!isActiveNow || campaignAfterUpdate.isFOC)) {
                    difference = -beforeUnits; // Release all units
                } 
                // Scenario 2: Campaign was inactive (or FOC), now it's active and not FOC
                else if ((!wasActiveBefore || campaignBeforeUpdate.isFOC) && isActiveNow && !campaignAfterUpdate.isFOC) {
                    difference = afterUnits; // Occupy new units
                } 
                // Scenario 3: Campaign was active and not FOC, still active and not FOC
                else if (wasActiveBefore && !campaignBeforeUpdate.isFOC && isActiveNow && !campaignAfterUpdate.isFOC) {
                    difference = afterUnits - beforeUnits; // Adjust units
                }
                // Other scenarios (e.g., FOC to FOC, inactive to inactive, FOC to active and FOC) result in 0 difference
                
                if (difference !== 0) {
                    unitsDifferenceMap.set(spaceId, difference);
                }
            });
        }
        // If the campaign is updated to FOC, and it was previously occupying units, those units need to be released.
        // If it was FOC before and is FOC now, no change.
        if (campaignAfterUpdate.isFOC && wasActiveBefore && !campaignBeforeUpdate.isFOC) {
             campaignBeforeUpdate.spaces.forEach(s => {
                const spaceId = s.id.toString();
                unitsDifferenceMap.set(spaceId, (unitsDifferenceMap.get(spaceId) || 0) - s.selectedUnits); // Release previously occupied units
             });
        }
        // If the campaign was FOC and is now NOT FOC, it should start occupying units
        if (!campaignAfterUpdate.isFOC && (campaignBeforeUpdate.isFOC || !wasActiveBefore)) { // If it was FOC OR inactive before
            campaignAfterUpdate.spaces.forEach(s => {
                const spaceId = s.id.toString();
                if (isActiveNow) { // Only occupy if currently active
                    unitsDifferenceMap.set(spaceId, (unitsDifferenceMap.get(spaceId) || 0) + s.selectedUnits);
                }
            });
        }

        const bulkOps = [];
        for (const [spaceId, difference] of unitsDifferenceMap.entries()) {
            if (difference !== 0) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: spaceId },
                        update: { $inc: { occupiedUnits: difference } }
                    }
                });
            }
        }
        
        if (bulkOps.length > 0) {
            await Space.bulkWrite(bulkOps);
        }
        res.json({ message: 'Campaign updated successfully!', campaign: campaignAfterUpdate });
    } catch (error) {
        console.error('Error updating campaign:', error);
        res.status(500).json({ error: 'Server error while updating campaign.' });
    }
});

router.delete('/:campaignId/booking/:bookingId', authenticate, async (req, res) => {
    try {
        const { campaignId, bookingId } = req.params;
        const campaignObjectId = new mongoose.Types.ObjectId(campaignId);
        const campaignToDelete = await Campaign.findById(campaignObjectId);
        if (!campaignToDelete) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        await Booking.findByIdAndUpdate(bookingId, {
            $pull: { campaigns: campaignObjectId }
        });
        
        // Only decrement occupied units if the campaign was NOT FOC
        if (!campaignToDelete.isFOC && campaignToDelete.spaces && campaignToDelete.spaces.length > 0) {
            const bulkOps = campaignToDelete.spaces.map(space => ({
                updateOne: {
                    filter: { _id: space.id },
                    update: { 
                        $inc: { 
                            occupiedUnits: -space.selectedUnits,
                            numberOfBookings: -1
                        },
                        $pull: { 
                            campaignDates: { campaignId: campaignObjectId } 
                        }
                    }
                }
            }));
            
            if (bulkOps.length > 0) {
                await Space.bulkWrite(bulkOps);
            }
        } else {
             // If FOC, just remove campaign dates without changing occupied units count
             if (campaignToDelete.spaces && campaignToDelete.spaces.length > 0) {
                const bulkOps = campaignToDelete.spaces.map(space => ({
                    updateOne: {
                        filter: { _id: space.id },
                        update: { 
                            $pull: { 
                                campaignDates: { campaignId: campaignObjectId } 
                            }
                        }
                    }
                }));
                if (bulkOps.length > 0) {
                    await Space.bulkWrite(bulkOps);
                }
             }
        }

        await Campaign.findByIdAndDelete(campaignObjectId);
        res.json({ message: 'Campaign deleted successfully from booking and spaces.' });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        res.status(500).json({ error: 'Server error while deleting campaign.' });
    }
});

router.post('/check-availability', authenticate, async (req, res) => {
    try {
        const { spaceIds, startDate, endDate, campaignIdToIgnore } = req.body;
        if (!spaceIds || spaceIds.length === 0 || !startDate || !endDate) {
            return res.status(200).json({ conflictingSpaceIds: [] });
        }
        
        // When checking availability, we should ignore FOC campaigns,
        // as they don't count towards 'occupiedUnits' for other bookings.
        const conflictingCampaigns = await Campaign.find({
            'spaces.id': { $in: spaceIds },
            _id: { $ne: campaignIdToIgnore },
            startDate: { $lte: endDate },
            endDate: { $gte: startDate },
            isFOC: false, // <--- Only consider non-FOC campaigns for conflicts
        }).select('spaces.id');

        const conflictingSpaceIds = new Set();
        conflictingCampaigns.forEach(campaign => {
            campaign.spaces.forEach(space => {
                if (spaceIds.includes(space.id.toString())) {
                    conflictingSpaceIds.add(space.id.toString());
                }
            });
        });
        res.status(200).json({ conflictingSpaceIds: Array.from(conflictingSpaceIds) });
    } catch (error) {
        console.error('Error checking campaign availability:', error);
        res.status(500).json({ error: 'Server error while checking availability.' });
    }
});

router.post('/:campaignId/clone/:bookingId', authenticate, async (req, res) => {
    try {
        const { campaignId, bookingId } = req.params;
        // Destructure isFOC from req.body, default to false if not provided
        const { campaignName, startDate, endDate, description, inventoryIds = [], isFOC = false } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: 'Target booking not found.' });
        }

        const originalCampaign = await Campaign.findById(campaignId).populate('pipeline').lean();
        if (!originalCampaign) {
            return res.status(404).json({ error: 'Original campaign not found.' });
        }

        const newSpacesFromInventories = inventoryIds.map(id => ({
            id: new mongoose.Types.ObjectId(id),
            selectedUnits: 1 // Assuming 1 unit for newly added inventories
        }));

        const finalSpacesMap = new Map();
        originalCampaign.spaces.forEach(space => finalSpacesMap.set(space.id.toString(), space));
        newSpacesFromInventories.forEach(space => finalSpacesMap.set(space.id.toString(), space));
        
        const finalSpacesArray = Array.from(finalSpacesMap.values());

        const newPipeline = new Pipeline({
            artwork: originalCampaign.pipeline?.artwork,
            campaign: new mongoose.Types.ObjectId()
        });

        const clonedCampaign = new Campaign({
            ...originalCampaign,
            _id: undefined, // Mongoose will generate a new _id
            createdAt: undefined, // Mongoose will set new timestamps
            updatedAt: undefined, // Mongoose will set new timestamps
            pipeline: newPipeline._id,
            campaignName: campaignName || `Copy of ${originalCampaign.campaignName}`,
            startDate: startDate || originalCampaign.startDate,
            endDate: endDate || originalCampaign.endDate,
            description: description !== undefined ? description : originalCampaign.description,
            spaces: finalSpacesArray,
            isFOC: isFOC, // <--- Set the isFOC flag for the cloned campaign
        });

        newPipeline.campaign = clonedCampaign._id;
        await newPipeline.save();
        await clonedCampaign.save();

        // **Conditional Update for occupiedUnits based on isFOC**
        if (!isFOC && clonedCampaign.spaces && clonedCampaign.spaces.length > 0) { // Only update occupiedUnits if NOT FOC
            const bulkOps = clonedCampaign.spaces.map(selected => {
                const campaignDateEntry = {
                    campaignId: clonedCampaign._id,
                    startDate: clonedCampaign.startDate,
                    endDate: clonedCampaign.endDate,
                };
                return {
                    updateOne: {
                        filter: { _id: selected.id },
                        update: {
                            $inc: { 
                                occupiedUnits: selected.selectedUnits,
                                numberOfBookings: 1 // Still count as a booking for other metrics if needed
                            },
                            $push: { campaignDates: { $each: Array(selected.selectedUnits).fill(campaignDateEntry) } }
                        }
                    }
                };
            });

            if (bulkOps.length > 0) {
                await Space.bulkWrite(bulkOps);
            }
        } else if (isFOC && clonedCampaign.spaces && clonedCampaign.spaces.length > 0) {
            // If FOC, still push campaign dates to the space, but do not increment occupiedUnits
            // This allows the space to know it has an FOC campaign for those dates, without blocking availability
            const bulkOps = clonedCampaign.spaces.map(selected => {
                const campaignDateEntry = {
                    campaignId: clonedCampaign._id,
                    startDate: clonedCampaign.startDate,
                    endDate: clonedCampaign.endDate,
                };
                return {
                    updateOne: {
                        filter: { _id: selected.id },
                        update: {
                             $inc: { numberOfBookings: 1 }, // Still count as a booking for other metrics if needed
                             $push: { campaignDates: { $each: Array(selected.selectedUnits).fill(campaignDateEntry) } }
                        }
                    }
                };
            });
            if (bulkOps.length > 0) {
                await Space.bulkWrite(bulkOps);
            }
        }

        booking.campaigns.push(clonedCampaign._id);
        await booking.save();

        const populatedClonedCampaign = await Campaign.findById(clonedCampaign._id).populate('pipeline');
        res.status(201).json({ 
            message: 'Campaign cloned and linked successfully!', 
            campaign: populatedClonedCampaign 
        });

    } catch (error) {
        console.error('CRITICAL ERROR cloning campaign:', error); 
        if (error.name === 'ValidationError') {
             return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Server error while cloning campaign.' });
    }
});

export default router;