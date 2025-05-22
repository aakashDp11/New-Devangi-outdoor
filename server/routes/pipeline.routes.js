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
import moment from 'moment';
router.get('/campaign/:campaignId', getPipelineByCampaignId);
router.get('/finance', async (req, res) => {
  try {
    const pipelines = await Pipeline.find({}).select('po invoice createdAt');

    const grouped = {};

    pipelines.forEach((p) => {
      const createdAt = moment(p.createdAt);
      const year = createdAt.year();
      const month = createdAt.format('MMMM');

      if (!grouped[year]) grouped[year] = {};
      if (!grouped[year][month]) grouped[year][month] = { purchaseOrders: [], invoices: [] };

      if (p.po?.documentUrl) {
        grouped[year][month].purchaseOrders.push({
          documentName: p.po.reference || 'PO Document',
          fileUrl: p.po.documentUrl,
        });
      }

      if (p.invoice?.invoiceNumber) {
        grouped[year][month].invoices.push({
          documentName: p.invoice.invoiceNumber,
          fileUrl: p.invoice.documentUrl || null,
        });
      }
    });

    res.json(grouped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch finance data' });
  }
});

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
