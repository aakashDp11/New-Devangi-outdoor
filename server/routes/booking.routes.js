import express from 'express';
import Booking from '../models/booking.model.js';
import Space from '../models/space.model.js';
import upload from '../middleware/multer.middleware.js';
import pipelineModel from '../models/pipeline.model.js';
const router = express.Router();

// CREATE - POST /api/bookings


// router.post('/', upload.array('campaignImages', 10), async (req, res) => {
//   try {
//     const body = req.body;

//     // Convert comma-separated string to array if needed
//     const spacesArray = Array.isArray(body.spaces)
//       ? body.spaces
//       : body.spaces?.split(',') || [];

//     const spacesExist = await Space.find({ _id: { $in: spacesArray } });
//     if (spacesExist.length !== spacesArray.length) {
//       return res.status(400).json({ error: 'One or more invalid space IDs' });
//     }

//     // Store file paths in booking
//     const imagePaths = req.files.map(file => `/uploads/${file.filename}`);

//     const newBooking = new Booking({
//       ...body,
//       spaces: spacesArray,
//       campaignImages: imagePaths,
//     });

//     const savedBooking = await newBooking.save();

//     await Space.updateMany(
//       { _id: { $in: spacesArray } },
//       { $set: { available: false } }
//     );

//     res.status(201).json({ message: 'Booking created successfully', data: savedBooking });
//   } catch (error) {
//     console.error('Booking creation error:', error);
//     res.status(400).json({ error: 'Failed to create booking', details: error.message });
//   }
// });
router.post('/', upload.array('campaignImages', 10), async (req, res) => {
  try {
    const rawSpaces = Array.isArray(req.body.spaces)
      ? req.body.spaces
      : [req.body.spaces];

    // ✅ STEP 1: PARSE EACH ENTRY SAFELY
    const spaceEntries = rawSpaces.map(entry => {
      if (typeof entry === 'string') {
        try {
          return JSON.parse(entry);
        } catch (err) {
          throw new Error(`Invalid space JSON: ${entry}`);
        }
      }
      return entry;
    });

    // ✅ STEP 2: Extract only ObjectIds
    const spaceIds = spaceEntries.map(s => s.id);

    // ✅ STEP 3: Validate space IDs
    const spacesFound = await Space.find({ _id: { $in: spaceIds } });
    if (spacesFound.length !== spaceIds.length) {
      return res.status(400).json({ error: 'One or more space IDs are invalid' });
    }

   
    // for (const { id, selectedUnits } of spaceEntries) {
    //   const space = await Space.findById(id);
    
    //   const newOccupied = space.occupiedUnits + selectedUnits;
    //   const total = space.unit;
    
    //   // ✅ Check if booking causes overlap
    //   if (space.occupiedUnits >= total) {
    //     await Space.findByIdAndUpdate(id, { overlappingBooking: true });
    //   } else {
    //     // Normal flow: increment occupiedUnits
    //     await Space.findByIdAndUpdate(id, {
    //       $inc: { occupiedUnits: selectedUnits }
    //     });
    
    //     // If still causes overbooking after increment, flag it
    //     if (newOccupied > total) {
    //       await Space.findByIdAndUpdate(id, { overlappingBooking: true });
    //     }
    //   }
    // }
    

    // ✅ STEP 5: Store image paths
    for (const { id, selectedUnits } of spaceEntries) {
      const space = await Space.findById(id);
      if (!space) continue;
    
      const newOccupied = space.occupiedUnits + selectedUnits;
      const total = space.unit;
    
      // Determine new availability
      let newAvailability = 'Completely available';
      if (newOccupied === total) {
        newAvailability = 'Completely booked';
      } else if (newOccupied > 0 && newOccupied < total) {
        newAvailability = 'Partialy available';
      }
    
      // Detect overlap if already full before increment
      if (space.occupiedUnits >= total) {
        await Space.findByIdAndUpdate(id, {
          $set: { overlappingBooking: true }
        });
      } else {
        await Space.findByIdAndUpdate(id, {
          $inc: { occupiedUnits: selectedUnits },
          $set: { availability: newAvailability }
        });
    
        if (newOccupied > total) {
          await Space.findByIdAndUpdate(id, { overlappingBooking: true });
        }
      }
    }
    
    const imagePaths = req.files.map(f => `/uploads/${f.filename}`);

    // ✅ STEP 6: Save the booking
    const newBooking = new Booking({
      companyName: req.body.companyName,
      clientName: req.body.clientName,
      clientEmail: req.body.clientEmail,
      clientPanNumber: req.body.clientPanNumber,
      clientGstNumber: req.body.clientGstNumber,
      clientContactNumber: req.body.clientContactNumber,
      brandDisplayName: req.body.brandDisplayName,
      clientType: req.body.clientType,
      campaignName: req.body.campaignName,
      industry: req.body.industry,
      description: req.body.description,
      campaignImages: imagePaths,
      spaces: spaceEntries  // ✅ includes id + selectedUnits
    });

    const saved = await newBooking.save();

    // ✅ STEP 7: Update occupiedUnits for each space
    

    res.status(201).json({ message: 'Booking created successfully', data: saved });
  } catch (err) {
    console.error('Booking creation error:', err);
    res.status(500).json({ error: 'Failed to create booking', details: err.message });
  }
});


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
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().populate('spaces.id');

    // ✅ Fetch all pipelines for these bookings
    const bookingIds = bookings.map(b => b._id);
    const pipelines = await pipelineModel.find({ booking: { $in: bookingIds } });

    // ✅ Create a pipeline lookup map { bookingId: pipeline }
    const pipelineMap = {};
    pipelines.forEach(p => {
      pipelineMap[p.booking.toString()] = p;
    });

    // ✅ Attach pipeline to each booking
    const bookingsWithPipeline = bookings.map(b => ({
      ...b.toObject(),
      pipeline: pipelineMap[b._id.toString()] || null,
    }));

    res.json(bookingsWithPipeline);

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings', details: error.message });
  }
});


// READ ONE - GET /api/bookings/:id
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('spaces');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    // console.log("Asked booking is",booking);
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch booking', details: error.message });
  }
});

// UPDATE - PUT /api/bookings/:id
router.put('/:id', async (req, res) => {
  try {
    const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('space');

    if (!updatedBooking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Booking updated successfully', data: updatedBooking });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update booking', details: error.message });
  }
});

// DELETE - DELETE /api/bookings/:id
router.delete('/:id', async (req, res) => {
  try {
    const deletedBooking = await Booking.findByIdAndDelete(req.params.id);
    if (!deletedBooking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Booking deleted successfully', data: deletedBooking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete booking', details: error.message });
  }
});

export default router;
