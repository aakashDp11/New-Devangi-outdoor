import express from 'express';
import Space from '../models/space.model.js';
import upload from '../middleware/multer.middleware.js';
import { createSpace } from '../controllers/spaceController.js';
const router = express.Router();

const cpUpload = upload.fields([
  { name: 'mainPhoto', maxCount: 1 },
  { name: 'longShot', maxCount: 1 },
  { name: 'closeShot', maxCount: 1 },
  { name: 'otherPhotos', maxCount: 10 },
]);


router.post('/create', cpUpload, createSpace)

function parseDate(dateString) {
  const [day, month, year] = dateString.split('-').map(Number);
  return new Date(2000 + year, month - 1, day); // year is like 25 => 2025
}

router.get('/available', async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    const requestedStart = new Date(start);
    const requestedEnd = new Date(end);

    const allSpaces = await Space.find();

    const availableSpaces = allSpaces.filter(space => {
      if (!space.dates || space.dates.length < 2) return false;

      const [spaceStartStr, spaceEndStr] = space.dates;

      const [day1, month1, year1] = spaceStartStr.split('-').map(Number);
      const [day2, month2, year2] = spaceEndStr.split('-').map(Number);

      const spaceStart = new Date(2000 + year1, month1 - 1, day1);
      const spaceEnd = new Date(2000 + year2, month2 - 1, day2);

      return spaceStart <= requestedStart && spaceEnd >= requestedEnd;
    });

    res.json(availableSpaces);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available spaces', details: error.message });
  }
});




router.get('/', async (req, res) => {
    try {
      const spaces = await Space.find();
      res.json(spaces);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch spaces', details: error.message });
    }
  });
  
  // READ ONE - GET /api/space/:id
  router.get('/:id', async (req, res) => {
    try {
      const space = await Space.findById(req.params.id);
      if (!space) return res.status(404).json({ error: 'Space not found' });
      res.json(space);
    } catch (error) {
      console.error('Error fetching space by ID:', error);
      res.status(500).json({ error: 'Failed to fetch space', details: error.message });
    }
  });
  
  // UPDATE - PUT /api/space/:id
  // router.put('/:id', async (req, res) => {
  //   try {
  //     const updatedSpace = await Space.findByIdAndUpdate(req.params.id, req.body, {
  //       new: true,
  //       runValidators: true,
  //     });
  //     if (!updatedSpace) return res.status(404).json({ error: 'Space not found' });
  //     res.json({ message: 'Space updated successfully', data: updatedSpace });
  //   } catch (error) {
  //     res.status(400).json({ error: 'Failed to update space', details: error.message });
  //   }
  // });

  // PUT /api/spaces/:id
router.put('/:id', upload.fields([
  { name: 'mainPhoto', maxCount: 1 },
  { name: 'longShot', maxCount: 1 },
  { name: 'closeShot', maxCount: 1 },
  { name: 'otherPhotos', maxCount: 10 }
]), async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) {
      return res.status(404).json({ error: 'Space not found' });
    }

    // Update normal text fields
    for (const key in req.body) {
      space[key] = req.body[key];
    }

    // Update photos if new ones are uploaded
    if (req.files['mainPhoto']) {
      space.mainPhoto = req.files['mainPhoto'][0].filename;
    }
    if (req.files['longShot']) {
      space.longShot = req.files['longShot'][0].filename;
    }
    if (req.files['closeShot']) {
      space.closeShot = req.files['closeShot'][0].filename;
    }
    if (req.files['otherPhotos']) {
      space.otherPhotos = req.files['otherPhotos'].map(file => file.filename);
    }

    await space.save();
    res.json(space);
  } catch (error) {
    console.error('Error updating space:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

  
  // DELETE - DELETE /api/space/:id
  // router.delete('/:id', async (req, res) => {
  //   try {
  //     const deletedSpace = await Space.findByIdAndDelete(req.params.id);
  //     if (!deletedSpace) return res.status(404).json({ error: 'Space not found' });
  //     res.json({ message: 'Space deleted successfully', data: deletedSpace });
  //   } catch (error) {
  //     res.status(500).json({ error: 'Failed to delete space', details: error.message });
  //   }
  // });
  // DELETE /api/spaces/:id
router.delete('/:id', async (req, res) => {
  try {
    const space = await Space.findByIdAndDelete(req.params.id);
    if (!space) {
      return res.status(404).json({ error: 'Space not found' });
    }
    res.json({ message: 'Space deleted successfully' });
  } catch (error) {
    console.error('Error deleting space:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


export default router;
