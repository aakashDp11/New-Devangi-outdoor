import express from 'express';
import Campaign from '../models/campaign.model.js';
import Space from '../models/space.model.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import Booking from '../models/booking.model.js';
import mongoose from 'mongoose';
import Pipeline from '../models/pipeline.model.js';
import BookingCampaign from '../models/bookingCampaignMapping.model.js';
import CampaignInventoryMapping from '../models/campaignInventoryMapping.model.js';
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


    res.status(200).json({ campaigns });
    
  } catch (err) {
    console.error('Error fetching campaigns:', err);
    res.status(500).json({ message: 'Server error, could not fetch campaigns.' });
  }
});


router.get('/by-space/:spaceId', async (req, res) => {
    try {
      const { spaceId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(spaceId)) {
        return res.status(400).json({ message: 'Invalid spaceId' });
      }
  
      // Optional overlap filtering (?from=YYYY-MM-DD&to=YYYY-MM-DD)
      const { from, to } = req.query;
      const match = { spaceId: new mongoose.Types.ObjectId(spaceId) };
      if (from && to) {
        match.startDate = { $lte: to };
        match.endDate   = { $gte: from };
      }
  
      // 1) find mappings for this space
      const mappings = await CampaignInventoryMapping.find(match, { campaignId: 1 }).lean();
  
      // 2) distinct campaign ids
      const campaignIds = [...new Set(mappings.map(m => m.campaignId?.toString()))]
        .filter(Boolean)
        .map(id => new mongoose.Types.ObjectId(id));
  
      if (!campaignIds.length) return res.status(200).json([]);
  
      // 3) fetch campaigns (header fields only)
      const campaigns = await Campaign.find(
        { _id: { $in: campaignIds } },
        { campaignName: 1, startDate: 1, endDate: 1 }
      ).lean();
  
      return res.status(200).json(campaigns);
    } catch (err) {
      console.error('Error fetching campaigns by space:', err);
      res.status(500).json({ message: 'Server error, could not fetch campaigns by space.' });
    }
  });

  router.put('/:id/add-tag', async (req, res) => {
    const { tag } = req.body;
    try {
      const campaign = await Campaign.findById(req.params.id);
      if (!campaign) return res.status(404).json({ message: 'Not found' });
  
      campaign.tags =  campaign.tags ? `${campaign.tags}, ${tag}` : tag;
      await  campaign.save();
      res.status(200).json(campaign);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  router.put('/:id/remove-tag', async (req, res) => {
    const { tag } = req.body;
    try {
      const campaign = await Booking.findById(req.params.id);
      if (!campaign) return res.status(404).json({ message: 'Not found' });
  
      const tagList = (campaign.tags || '').split(',').map(t => t.trim()).filter(t => t && t !== tag);
      campaign.tags = tagList.join(', ');
      await campaign.save();
      res.status(200).json(campaign);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.get('/get-space-details', async (req, res) => {
    const { tag } = req.body;
    try {
      const campaign = await Booking.findById(req.params.id);
      if (!campaign) return res.status(404).json({ message: 'Not found' });
  
      const tagList = (campaign.tags || '').split(',').map(t => t.trim()).filter(t => t && t !== tag);
      campaign.tags = tagList.join(', ');
      await campaign.save();
      res.status(200).json(campaign);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
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
        console.log("\n--- [CLONE ROUTE START] ---");

        const { campaignId, bookingId } = req.params;
        const { campaignName, startDate, endDate, description, inventoryIds = [], isFOC = false } = req.body;

        console.log("Clone request payload:", { campaignName, startDate, endDate, inventoryIds, isFOC });

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: 'Target booking not found.' });
        }

        // Fetch the original campaign and populate the pipeline
        const originalCampaign = await Campaign.findById(campaignId).populate('pipeline').lean();
        if (!originalCampaign) {
            return res.status(404).json({ error: 'Original campaign not found.' });
        }

        // Step 1: Fetch the related `CampaignInventoryMapping` entries for the original campaign
        const campaignInventoryMappings = await CampaignInventoryMapping.find({ campaignId: campaignId })
            .select('spaceId unitIds displayCost buyingPrice sellingPrice invoiceNo printingCostPerSquareFeet mountingCostPerSquareFeet area')
            .lean();

        console.log("Original campaign inventory mappings:", campaignInventoryMappings);

        // Step 2: Extract the `spaceId`s from the mappings
        const originalSpaceIds = campaignInventoryMappings.map(mapping => mapping.spaceId);

        // Step 3: Fetch the related `Space` documents using the original spaceIds
        const originalSpaces = await Space.find({ '_id': { $in: originalSpaceIds } }).lean();

        console.log("Original campaign spaces:", originalSpaces);

        // Step 4: Fetch the new spaces from the inventoryIds
        const newSpacesFromInventories = await Space.find({ '_id': { $in: inventoryIds } }).lean();

        console.log("New spaces from inventoryIds:", newSpacesFromInventories);

        // Step 5: Combine the fetched spaces with the new spaces from inventoryIds
        const finalSpacesMap = new Map();

        // Add original campaign spaces to the map with their mapping info
        originalSpaces.forEach(space => {
            const mapping = campaignInventoryMappings.find(m => m.spaceId.toString() === space._id.toString());
            finalSpacesMap.set(space._id.toString(), {
                ...space,
                selectedUnits: 1,  // Default selectedUnits
                originalMapping: mapping // Store the mapping for later use
            });
        });

        // Add new spaces from inventories
        newSpacesFromInventories.forEach(space => {
            finalSpacesMap.set(space._id.toString(), {
                ...space,
                selectedUnits: 1,  // Default selectedUnits
                originalMapping: null // No original mapping for new spaces
            });
        });

        // Create final spaces array
        const finalSpacesArray = Array.from(finalSpacesMap.values());

        console.log("Final spaces array length:", finalSpacesArray.length);

        // Step 6: Create a new pipeline for the cloned campaign
        const newPipeline = new Pipeline({
            artwork: originalCampaign.pipeline?.artwork || {},
            campaign: new mongoose.Types.ObjectId() // temporary ID
        });

        // Step 7: Create the cloned campaign (without spaces field)
        const clonedCampaign = new Campaign({
            campaignName: campaignName || `Copy of ${originalCampaign.campaignName}`,
            startDate: startDate || originalCampaign.startDate,
            endDate: endDate || originalCampaign.endDate,
            description: description !== undefined ? description : originalCampaign.description,
            isFOC: isFOC,
            pipeline: newPipeline._id,
            industry: originalCampaign.industry || 'Other',
            tags: originalCampaign.tags || ''
        });

        newPipeline.campaign = clonedCampaign._id;
        await newPipeline.save();
        await clonedCampaign.save();

        // Step 8: Create new CampaignInventoryMapping entries for the cloned campaign
        const newMappings = finalSpacesArray.map(space => ({
            campaignId: clonedCampaign._id,
            spaceId: space._id,
            unitIds: space.originalMapping?.unitIds || [1], // Use original mapping unitIds if available
            startDate: clonedCampaign.startDate,
            endDate: clonedCampaign.endDate,
            // Add required fields with defaults or from original mapping
            displayCost: space.originalMapping?.displayCost || 0,
            buyingPrice: space.originalMapping?.buyingPrice || 0,
            sellingPrice: space.originalMapping?.sellingPrice || 0,
            invoiceNo: space.originalMapping?.invoiceNo || '',
            printingCostPerSquareFeet: space.originalMapping?.printingCostPerSquareFeet || 0,
            mountingCostPerSquareFeet: space.originalMapping?.mountingCostPerSquareFeet || 0,
            area: space.originalMapping?.area || 1 // Default to 1 to avoid validation error
        }));

        await CampaignInventoryMapping.insertMany(newMappings);
        console.log("Created campaign inventory mappings:", newMappings.length);

        // Step 9: Create BookingCampaign mapping
        const newBookingCampaign = new BookingCampaign({
            bookingId: bookingId,
            campaignId: clonedCampaign._id
        });
        await newBookingCampaign.save();

        // **Conditional Update for occupiedUnits based on isFOC**
        // Note: Since Campaign model no longer has spaces, we use the finalSpacesArray
        if (!isFOC && finalSpacesArray.length > 0) {
            const bulkOps = finalSpacesArray.map(space => {
                const campaignDateEntry = {
                    campaignId: clonedCampaign._id,
                    spaceId: space._id,
                    unitIds: space.originalMapping?.unitIds || [1],
                    startDate: clonedCampaign.startDate,
                    endDate: clonedCampaign.endDate,
                };
                return {
                    updateOne: {
                        filter: { _id: space._id },
                        update: {
                            $inc: {
                                occupiedUnits: space.selectedUnits,
                                numberOfBookings: 1
                            },
                            $push: { 
                                campaignDates: { 
                                    $each: Array(space.selectedUnits).fill(campaignDateEntry) 
                                } 
                            }
                        }
                    }
                };
            });

            if (bulkOps.length > 0) {
                await Space.bulkWrite(bulkOps);
                console.log("Updated space occupancy for non-FOC campaign");
            }
        } else if (isFOC && finalSpacesArray.length > 0) {
            // If FOC, still push campaign dates to the space, but do not increment occupiedUnits
            const bulkOps = finalSpacesArray.map(space => {
                const campaignDateEntry = {
                    campaignId: clonedCampaign._id,
                    spaceId: space._id,
                    unitIds: space.originalMapping?.unitIds || [1],
                    startDate: clonedCampaign.startDate,
                    endDate: clonedCampaign.endDate,
                };
                return {
                    updateOne: {
                        filter: { _id: space._id },
                        update: {
                             $inc: { numberOfBookings: 1 },
                             $push: { 
                                campaignDates: { 
                                    $each: Array(space.selectedUnits).fill(campaignDateEntry) 
                                } 
                            }
                        }
                    }
                };
            });
            if (bulkOps.length > 0) {
                await Space.bulkWrite(bulkOps);
                console.log("Updated space tracking for FOC campaign");
            }
        }

        // Step 10: Add campaign to booking (if using the old structure)
        if (booking.campaigns) {
            booking.campaigns.push(clonedCampaign._id);
            await booking.save();
        }

        const populatedClonedCampaign = await Campaign.findById(clonedCampaign._id).populate('pipeline');

        console.log("--- [CLONE ROUTE SUCCESS] ---\n");

        res.status(201).json({
            message: 'Campaign cloned and linked successfully!',
            campaign: populatedClonedCampaign
        });

    } catch (error) {
        console.error('CRITICAL ERROR cloning campaign:', error);
        console.error('Error stack:', error.stack);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Duplicate campaign mapping detected.' });
        }
        res.status(500).json({ error: 'Server error while cloning campaign.' });
    }
});









router.get('/:id', async (req, res) => {
    try {
      const campaignId = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(campaignId)) {
        return res.status(400).json({ message: 'Invalid campaign ID format' });
      }
  
      // 1) Campaign header
      const campaign = await Campaign.findById(campaignId).lean();
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
  
      // 2) Find parent booking via join table
      const bc = await BookingCampaign.findOne({ campaignId }).lean();
      const parentBooking = bc ? await Booking.findById(bc.bookingId).lean() : null;
  
      // 3) Spaces for this campaign via mappings → join to Space
      const mappings = await CampaignInventoryMapping.find(
        { campaignId },
        { spaceId: 1 }
      ).lean();
  
      const spaceIds = [...new Set(mappings.map(m => String(m.spaceId)))];
      let spaces = [];
      if (spaceIds.length) {
        spaces = await Space.find(
          { _id: { $in: spaceIds.map(id => new mongoose.Types.ObjectId(id)) } },
          // select whatever you need; here we fetch full doc like before
          {}
        ).lean();
      }
  
      // (Back-compat) “spaceNames” like your old code did from populated campaign.spaces
      const spaceNames = spaces.map(s => s.spaceName).filter(Boolean);
  
      // 4) Response shaped like before (campaign + booking + spaceNames)
      const responseData = {
        ...campaign,
        booking: parentBooking, // entire booking object
        bookingName: parentBooking ? (parentBooking.companyName || parentBooking.clientName) : 'N/A',
        spaceNames
      };
  
      return res.status(200).json(responseData);
    } catch (err) {
      console.error('Error fetching single campaign:', err);
      return res.status(500).json({ message: 'Server error, could not fetch the campaign.' });
    }
  });
// router.get('/:id', async (req, res) => {
//     try {
//       const campaignId = req.params.id;
   
//       // Step 1: Find the parent booking and get the FULL document.
//       const parentBooking = await Booking.findOne({ campaigns: campaignId }).lean();
   
//       // Step 2: Find the campaign and populate the FULL space documents.
//       const campaign = await Campaign.findById(campaignId)
//         .populate({
//           path: 'spaces.id' // Get all fields from the Space model
//         })
//         .lean();
   
//       if (!campaign) {
//         return res.status(404).json({ message: 'Campaign not found' });
//       }
   
//       // Step 3: Construct a response that includes the full objects for the frontend.
//       const responseData = {
//         ...campaign,
//         booking: parentBooking, // Send the entire booking object
//         bookingName: parentBooking ? (parentBooking.companyName || parentBooking.clientName) : 'N/A',
//         spaceNames: campaign.spaces ? campaign.spaces.map(space => space.id?.spaceName).filter(Boolean) : []
//       };
   
//       res.status(200).json(responseData);
   
//     } catch (err) {
//       console.error('Error fetching single campaign:', err);
//       if (err.kind === 'ObjectId') {
//           return res.status(400).json({ message: 'Invalid campaign ID format' });
//       }
//       res.status(500).json({ message: 'Server error, could not fetch the campaign.' });
//     }
//   });


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