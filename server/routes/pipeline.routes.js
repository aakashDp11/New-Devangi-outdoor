import express from 'express';
import {
  getPipelineByCampaignId,
  createPipelineForCampaign,
  updateBookingStatus,
  confirmArtwork,
  confirmPrintingStatus,
  confirmMountingStatus,uploadInvoice,updateInvoice,updatePayment,uploadPoDocument,confirmPoStatus,deletePipelineAndCleanup
} from '../controllers/pipeline.controller.js';
import upload from '../middleware/multer.middleware.js';
import Campaign from '../models/campign.model.js';
const router = express.Router();
import Pipeline from '../models/pipeline.model.js';
router.get('/campaign/:campaignId', getPipelineByCampaignId);
// router.get('/campaign/:campaignId', async (req, res) => {
//   try {
//     const campaign = await Campaign.findById(req.params.campaignId)
//       .populate('spaces.id');  // ✅ Ensure spaces are populated

//     if (!campaign) {
//       return res.status(404).json({ error: 'Campaign not found' });
//     }

//     res.json(campaign);
//   } catch (error) {
//     console.error('Error fetching campaign:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

router.post('/campaign/:campaignId', createPipelineForCampaign);

router.put('/campaign/:campaignId/bookingStatus', updateBookingStatus);
router.put('/campaign/:campaignId/artwork', confirmArtwork);
router.post('/campaign/:campaignId/artwork/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`; // Adjust path if needed

    // ✅ Save the document URL to pipeline.artwork.documentUrl
    const pipeline = await Pipeline.findOneAndUpdate(
      { campaign: req.params.campaignId },
      { 'artwork.documentUrl': fileUrl },
      { new: true }
    );

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found for the campaign' });
    }

    res.status(200).json({ message: 'Artwork uploaded', documentUrl: fileUrl, pipeline });
  } catch (error) {
    console.error('Artwork upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload artwork' });
  }
});
router.put('/campaign/:campaignId/printingStatus', confirmPrintingStatus);
router.put('/campaign/:campaignId/mountingStatus', confirmMountingStatus);
router.post('/campaign/:campaignId/invoice/upload', upload.single('file'), uploadInvoice);
router.put('/campaign/:campaignId/invoice', updateInvoice);

// Payment Route
router.put('/campaign/:campaignId/payment', updatePayment);
// PO Document Upload and Confirmation
router.post('/campaign/:campaignId/po/upload', upload.single('file'), uploadPoDocument);
router.put('/campaign/:campaignId/po', confirmPoStatus);
router.delete('/campaign/:campaignId', deletePipelineAndCleanup);


export default router;
