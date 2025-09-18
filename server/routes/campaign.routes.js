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

/**
 * @route   GET /api/campaigns/:id
 * @desc    Get a single campaign by ID with related data for cloning
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid campaign ID' });
    }

    // Fetch the campaign with populated pipeline
    const campaign = await Campaign.findById(id).populate('pipeline').lean();
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Fetch related inventory mappings
    const inventoryMappings = await CampaignInventoryMapping.find({ campaignId: id })
      .populate('spaceId', 'spaceName address city spaceType ownershipType availability unit occupiedUnits')
      .lean();

    // Transform inventory mappings to spaces format expected by frontend
    const spaces = inventoryMappings.map(mapping => ({
      _id: mapping.spaceId._id,
      id: mapping.spaceId._id,
      spaceName: mapping.spaceId.spaceName,
      address: mapping.spaceId.address,
      city: mapping.spaceId.city,
      spaceType: mapping.spaceId.spaceType,
      ownershipType: mapping.spaceId.ownershipType,
      availability: mapping.spaceId.availability || "Available",
      selectedUnits: mapping.unitIds ? mapping.unitIds.length : 1,
      unitIds: mapping.unitIds
    }));

    // Try to find the booking this campaign belongs to
    const bookingCampaignMapping = await BookingCampaign.findOne({ campaignId: id })
      .populate('bookingId', 'companyName clientName')
      .lean();

    const response = {
      ...campaign,
      spaces: spaces, // Add the spaces data
      inventories: spaces, // Also provide as inventories for compatibility
      spaceIds: spaces.map(s => s._id), // And as spaceIds
      spaceNames: spaces.map(s => s.spaceName),
      bookingName: bookingCampaignMapping?.bookingId?.companyName || 'Unknown Booking',
      booking: bookingCampaignMapping?.bookingId || null
    };

    res.status(200).json(response);

  } catch (err) {
    console.error('Error fetching campaign by ID:', err);
    res.status(500).json({ message: 'Server error, could not fetch campaign.' });
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
      const campaign = await Campaign.findById(req.params.id);
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
      const campaign = await Campaign.findById(req.params.id);
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
       
        // Check conflicts using CampaignInventoryMapping instead of Campaign.spaces
        const conflictingMappings = await CampaignInventoryMapping.find({
            spaceId: { $in: spaceIds.map(id => new mongoose.Types.ObjectId(id)) },
            campaignId: { $ne: campaignIdToIgnore },
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
        }).populate('campaignId', 'isFOC').select('spaceId campaignId');
 
        const conflictingSpaceIds = new Set();
        conflictingMappings.forEach(mapping => {
            // Only consider non-FOC campaigns for conflicts
            if (!mapping.campaignId?.isFOC) {
                conflictingSpaceIds.add(mapping.spaceId.toString());
            }
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

/**
 * @route   DELETE /api/campaigns/:campaignId/booking/:bookingId
 * @desc    Delete a campaign and remove it from the booking
 * @access  Private
 */
router.delete('/:campaignId/booking/:bookingId', authenticate, async (req, res) => {
  try {
    const { campaignId, bookingId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(campaignId) || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ error: 'Invalid campaign or booking ID' });
    }

    // Check if campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get campaign inventory mappings to update space occupancy
    const inventoryMappings = await CampaignInventoryMapping.find({ campaignId }).lean();

    // Update space occupancy if not FOC
    if (!campaign.isFOC && inventoryMappings.length > 0) {
      const bulkOps = inventoryMappings.map(mapping => ({
        updateOne: {
          filter: { _id: mapping.spaceId },
          update: {
            $inc: {
              occupiedUnits: -(mapping.unitIds ? mapping.unitIds.length : 1),
              numberOfBookings: -1
            },
            $pull: {
              campaignDates: { campaignId: new mongoose.Types.ObjectId(campaignId) }
            }
          }
        }
      }));

      await Space.bulkWrite(bulkOps);
    } else if (campaign.isFOC && inventoryMappings.length > 0) {
      // For FOC campaigns, just remove campaign dates and decrement booking count
      const bulkOps = inventoryMappings.map(mapping => ({
        updateOne: {
          filter: { _id: mapping.spaceId },
          update: {
            $inc: { numberOfBookings: -1 },
            $pull: {
              campaignDates: { campaignId: new mongoose.Types.ObjectId(campaignId) }
            }
          }
        }
      }));

      await Space.bulkWrite(bulkOps);
    }

    // Delete campaign inventory mappings
    await CampaignInventoryMapping.deleteMany({ campaignId });

    // Delete booking-campaign mapping
    await BookingCampaign.deleteOne({ campaignId, bookingId });

    // Delete the pipeline if it exists
    if (campaign.pipeline) {
      await Pipeline.findByIdAndDelete(campaign.pipeline);
    }

    // Delete the campaign
    await Campaign.findByIdAndDelete(campaignId);

    // Remove campaign from booking if using old structure
    await Booking.findByIdAndUpdate(
      bookingId,
      { $pull: { campaigns: campaignId } }
    );

    res.status(200).json({ message: 'Campaign deleted successfully' });

  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Server error while deleting campaign' });
  }
});

export default router;