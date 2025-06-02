import express from 'express';
import Booking from '../models/booking.model.js';
import Space from '../models/space.model.js';
import upload from '../middleware/multer.middleware.js';
import pipelineModel from '../models/pipeline.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';
import Campaign from '../models/campign.model.js';
import { uploadToS3 } from '../utils/s3uploader.js';
const router = express.Router();
// CREATE - POST /api/bookings
export const getAllBookings = async (req, res) => {
  try {

    const bookings = await Booking.find()
  .populate({
    path: 'campaigns',
    populate: [
      {
        path: 'spaces.id',
        model: 'Space',
      },
      {
        path: 'pipeline',
        model: 'Pipeline',
        options: { strictPopulate: false } 
      },
    ],
  })
  .sort({ createdAt: -1 }).lean(false);
// console.dir(bookings, { depth: null });


    return res.status(200).json({ bookings });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Failed to fetch bookings' });
  }
};





export const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('id of campaign is', id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }

    // Optional: validate campaign exists first
    const campaign = await Campaign.findById(id).lean();
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Ensure campaign is associated with a booking
    const booking = await Booking.findOne({ campaigns: id }).lean();
    if (!booking) {
      return res.status(404).json({ error: 'Campaign is not linked to any booking' });
    }

    return res.status(200).json(campaign);
  } catch (error) {
    console.error('Error fetching campaign by ID:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};


export const createBooking = async (req, res) => {
  console.log("Create booking data is", req.body);
  console.log("Uploaded file info:", req.file);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      companyName,
      clientName,
      clientEmail,
      clientPan,
      clientGst,
      clientContact,
      brandName,
      clientType,
      campaigns = [],
      user: userId
    } = req.body;

    if (!companyName) throw new Error('Company Name is required');
    if (!userId) throw new Error('Assigned User is required');

    // ✅ Validate user exists
    const user = await User.findById(userId);
    if (!user) throw new Error('Invalid user assigned to booking');

    const parsedCampaigns = typeof campaigns === 'string' ? JSON.parse(campaigns) : campaigns;

    // ✅ Handle logo upload
    let companyLogo = '';
    if (req.file?.path) {
      try {
        companyLogo = await uploadToS3(req.file.path, req.file.filename);
      } catch (uploadErr) {
        throw new Error(`Logo upload failed: ${uploadErr.message}`);
      }
    }

    // ✅ Create Booking
    const newBooking = new Booking({
      companyName,
      clientName,
      clientEmail,
      clientPanNumber: clientPan,
      clientGstNumber: clientGst,
      clientContactNumber: clientContact,
      brandDisplayName: brandName,
      clientType,
      companyLogo,
      campaigns: [],
      user: userId
    });

    await newBooking.save({ session });

    const createdCampaigns = [];

    for (const campaignData of parsedCampaigns) {
      const {
        campaignName,
        industry,
        description,
        selectedSpaces = [],
        campaignImages = [],
        startDate,
        endDate
      } = campaignData;

      // ✅ Space allocation and availability
      for (const selected of selectedSpaces) {
        const space = await Space.findById(selected.id).session(session);
        if (!space) throw new Error(`Space not found: ${selected.id}`);

        const availableUnits = space.unit - space.occupiedUnits;
        if (selected.selectedUnits > availableUnits) {
          throw new Error(`Not enough units for space: ${space.spaceName}`);
        }

        space.occupiedUnits += selected.selectedUnits;

        space.availability =
          space.occupiedUnits >= space.unit
            ? 'Completely booked'
            : space.occupiedUnits === 0
              ? 'Completely available'
              : 'Partialy available';

        if (!Array.isArray(space.campaignDates)) {
          space.campaignDates = [];
        }

        for (let i = 0; i < selected.selectedUnits; i++) {
          space.campaignDates.push({ startDate, endDate });
        }

        await space.save({ session });
      }

      // ✅ Create Campaign
      const newCampaign = new Campaign({
        campaignName,
        description,
        industry,
        campaignImages,
        spaces: selectedSpaces.map(s => ({
          id: s.id,
          selectedUnits: s.selectedUnits
        })),
        startDate,
        endDate
      });

      await newCampaign.save({ session });
      createdCampaigns.push(newCampaign._id);
    }

    // ✅ Link campaigns to booking
    newBooking.campaigns = createdCampaigns;
    await newBooking.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: 'Booking created successfully',
      bookingId: newBooking._id
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Booking creation error:", error);
    return res.status(500).json({ error: error.message || 'Failed to create booking' });
  }
};

export const updateBooking = async (req, res) => {
  const { id:bookingId } = req.params;
  const {
    companyName,
    clientName,
    clientEmail,
    clientPanNumber,
    clientGstNumber,
    clientContactNumber,
    brandDisplayName,
    clientType,
    campaigns = []
  } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // ✅ Update basic info
    Object.assign(booking, {
      companyName,
      clientName,
      clientEmail,
      clientPanNumber,
      clientGstNumber,
      clientContactNumber,
      brandDisplayName,
      clientType
    });

    // ✅ Update campaigns
    for (const updatedCampaign of campaigns) {
      const campaign = await Campaign.findById(updatedCampaign._id).session(session);
      if (!campaign) continue;

      // ✅ Update Campaign info
      campaign.campaignName = updatedCampaign.campaignName;
      campaign.description = updatedCampaign.description;

      // ✅ Re-adjust spaces inventory (delta logic)
      for (const updatedSpace of updatedCampaign.selectedSpaces) {
        const space = await Space.findById(updatedSpace.id).session(session);
        if (!space) throw new Error(`Space not found: ${updatedSpace.id}`);

        const existingSelection = campaign.spaces.find(s => s.id.equals(updatedSpace.id));
        const previousUnits = existingSelection ? existingSelection.selectedUnits : 0;
        const delta = updatedSpace.selectedUnits - previousUnits;

        // Validate available units
        if (delta > 0 && space.occupiedUnits + delta > space.unit) {
          throw new Error(`Not enough available units for space: ${space.spaceName}`);
        }

        // Update space occupiedUnits
        space.occupiedUnits += delta;

        // Update space availability
        if (space.occupiedUnits >= space.unit) {
          space.availability = 'Completely booked';
        } else if (space.occupiedUnits === 0) {
          space.availability = 'Completely available';
        } else {
          space.availability = 'Partialy available';
        }

        await space.save({ session });

        // Update campaign's space selection
        if (existingSelection) {
          existingSelection.selectedUnits = updatedSpace.selectedUnits;
        } else {
          campaign.spaces.push({ id: updatedSpace.id, selectedUnits: updatedSpace.selectedUnits });
        }
      }

      await campaign.save({ session });
    }

    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: 'Booking updated successfully' });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    return res.status(500).json({ error: error.message || 'Failed to update booking' });
  }
};
export const deleteBooking = async (req, res) => {
  const { id:bookingId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(bookingId).populate('campaigns').session(session);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // ✅ Revert space inventories
    for (const campaign of booking.campaigns) {
      for (const selected of campaign.spaces) {
        const space = await Space.findById(selected.id).session(session);
        if (!space) continue;

        space.occupiedUnits = Math.max(0, space.occupiedUnits - selected.selectedUnits);

        // Update availability
        if (space.occupiedUnits >= space.unit) {
          space.availability = 'Completely booked';
        } else if (space.occupiedUnits === 0) {
          space.availability = 'Completely available';
        } else {
          space.availability = 'Partialy available';
        }

        await space.save({ session });
      }

      // ✅ Delete Campaign
      await Campaign.findByIdAndDelete(campaign._id).session(session);
    }

    // ✅ Delete Booking
    await Booking.findByIdAndDelete(bookingId).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: 'Booking deleted successfully' });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    return res.status(500).json({ error: error.message || 'Failed to delete booking' });
  }
};

export const getBookingById = async (req, res) => {
  const { id: bookingId } = req.params;

  try {
    const booking = await Booking.findById(bookingId).populate('user')
      .populate({
        path: 'campaigns',
        populate: [
          {
            path: 'spaces.id', // populate Space inside Campaign
            model: 'Space'
          },
          {
            path: 'pipeline', // populate Pipeline inside Campaign
            model: 'Pipeline'
          }
        ]
      });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.status(200).json(booking);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Failed to fetch booking' });
  }
};
router.get('/campaign/:id', getCampaignById);

// routes/spaces.js



router.get('/',getAllBookings);
router.post('/',upload.single('companyLogo'),  // Limit to 10 images
  createBooking
);
// router.post('/', upload.array('campaignImages', 10), async (req, res) => {
//   try {
//     const rawSpaces = Array.isArray(req.body.spaces)
//       ? req.body.spaces
//       : [req.body.spaces];

//     // ✅ STEP 1: PARSE EACH ENTRY SAFELY
//     const spaceEntries = rawSpaces.map(entry => {
//       if (typeof entry === 'string') {
//         try {
//           return JSON.parse(entry);
//         } catch (err) {
//           throw new Error(`Invalid space JSON: ${entry}`);
//         }
//       }
//       return entry;
//     });

//     // ✅ STEP 2: Extract only ObjectIds
//     const spaceIds = spaceEntries.map(s => s.id);

//     // ✅ STEP 3: Validate space IDs
//     const spacesFound = await Space.find({ _id: { $in: spaceIds } });
//     if (spacesFound.length !== spaceIds.length) {
//       return res.status(400).json({ error: 'One or more space IDs are invalid' });
//     }

 
//     for (const { id, selectedUnits } of spaceEntries) {
//       const space = await Space.findById(id);
//       if (!space) continue;
    
//       const newOccupied = space.occupiedUnits + selectedUnits;
//       const total = space.unit;
    
//       // Determine new availability
//       let newAvailability = 'Completely available';
//       if (newOccupied === total) {
//         newAvailability = 'Completely booked';
//       } else if (newOccupied > 0 && newOccupied < total) {
//         newAvailability = 'Partialy available';
//       }
    
//       // Detect overlap if already full before increment
//       if (space.occupiedUnits >= total) {
//         await Space.findByIdAndUpdate(id, {
//           $set: { overlappingBooking: true }
//         });
//       } else {
//         await Space.findByIdAndUpdate(id, {
//           $inc: { occupiedUnits: selectedUnits },
//           $set: { availability: newAvailability }
//         });
    
//         if (newOccupied > total) {
//           await Space.findByIdAndUpdate(id, { overlappingBooking: true });
//         }
//       }
//     }
    
//     const imagePaths = req.files.map(f => `/uploads/${f.filename}`);

//     // ✅ STEP 6: Save the booking
//     const newBooking = new Booking({
//       companyName: req.body.companyName,
//       clientName: req.body.clientName,
//       clientEmail: req.body.clientEmail,
//       clientPanNumber: req.body.clientPanNumber,
//       clientGstNumber: req.body.clientGstNumber,
//       clientContactNumber: req.body.clientContactNumber,
//       brandDisplayName: req.body.brandDisplayName,
//       clientType: req.body.clientType,
//       campaignName: req.body.campaignName,
//       industry: req.body.industry,
//       description: req.body.description,
//       campaignImages: imagePaths,
//       spaces: spaceEntries  // ✅ includes id + selectedUnits
//     });

//     const saved = await newBooking.save();

  
    

//     res.status(201).json({ message: 'Booking created successfully', data: saved });
//   } catch (err) {
//     console.error('Booking creation error:', err);
//     res.status(500).json({ error: 'Failed to create booking', details: err.message });
//   }
// });


// READ ALL - GET /api/bookings
// router.get('/', async (req, res) => {
//   try {
//     const bookings = await Booking.find().populate('spaces');
//     res.json(bookings);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch bookings', details: error.message });
//   }
// });

// READ ALL - GET /api/bookings
// router.get('/', async (req, res) => {
//   try {
//     const bookings = await Booking.find().populate('spaces.id');

//     // ✅ Fetch all pipelines for these bookings
//     const bookingIds = bookings.map(b => b._id);
//     const pipelines = await pipelineModel.find({ booking: { $in: bookingIds } });

//     // ✅ Create a pipeline lookup map { bookingId: pipeline }
//     const pipelineMap = {};
//     pipelines.forEach(p => {
//       pipelineMap[p.booking.toString()] = p;
//     });

//     // ✅ Attach pipeline to each booking
//     const bookingsWithPipeline = bookings.map(b => ({
//       ...b.toObject(),
//       pipeline: pipelineMap[b._id.toString()] || null,
//     }));

//     res.json(bookingsWithPipeline);

//   } catch (error) {
//     console.error('Error fetching bookings:', error);
//     res.status(500).json({ error: 'Failed to fetch bookings', details: error.message });
//   }
// });


// READ ONE - GET /api/bookings/:id
router.get('/:id', getBookingById);

// UPDATE - PUT /api/bookings/:id
router.put('/:id', updateBooking);

// DELETE - DELETE /api/bookings/:id
router.delete('/:id', deleteBooking);

export default router;
