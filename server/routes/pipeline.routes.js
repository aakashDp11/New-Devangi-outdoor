import express from 'express';
import {
  createPipelineForBooking,
  getPipelineByBooking,
  updatePipelineStep,
  uploadStepFile,
  deletePipelineByBookingId
} from '../controllers/pipeline.controller.js';
import pipelineModel from '../models/pipeline.model.js';
import upload from '../middleware/multer.middleware.js';

const router = express.Router();
router.get('/', async (req, res) => {
  try {
    const pipelines = await pipelineModel.find().sort({ createdAt: -1 });
    res.json(pipelines);
  } catch (err) {
    console.error('Error fetching pipelines', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.post('/:id', createPipelineForBooking);
router.get('/:id', getPipelineByBooking);

// Text updates (e.g., bookingStatus, payment, etc.)
router.put('/:bookingId/:step', updatePipelineStep);

// File upload for artwork, po, or invoice
router.post('/:bookingId/:step/upload', upload.single('file'), uploadStepFile);
router.delete('/:bookingId', deletePipelineByBookingId);


export default router;
