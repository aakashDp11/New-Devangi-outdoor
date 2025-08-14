import express from 'express';
import {
  getPipelineByCampaignId,
  createPipelineForCampaign,
  updateBookingStatus,
  confirmArtwork,
  confirmPrintingStatus,
  confirmMountingStatus, uploadInvoice, updateInvoice, uploadCashMemo, uploadCreditNote, updatePayment, uploadPoDocument, confirmPoStatus, deletePipelineAndCleanup
} from '../controllers/pipeline.controller.js';
import upload from '../middleware/multer.middleware.js';
import { uploadToS3 } from '../utils/s3uploader.js';
import Campaign from '../models/campaign.model.js';
const router = express.Router();
import Pipeline from '../models/pipeline.model.js';
import ChangeLog from '../models/changelog.model.js';
import Booking from '../models/booking.model.js';
import moment from 'moment';
import mongoose from 'mongoose';


router.get('/campaign/:campaignId', getPipelineByCampaignId);

// router.get('/finance', async (req, res) => {
//   try {
//     const pipelines = await Pipeline.find({}).select('po invoice createdAt');

//     const grouped = {};

//     pipelines.forEach((p) => {
//       const createdAt = moment(p.createdAt);
//       const year = createdAt.year();
//       const month = createdAt.format('MMMM');

//       if (!grouped[year]) grouped[year] = {};
//       if (!grouped[year][month]) grouped[year][month] = { purchaseOrders: [], invoices: [] };

//       if (p.po?.documentUrl) {
//         grouped[year][month].purchaseOrders.push({
//           documentName: p.po.reference || 'PO Document',
//           fileUrl: p.po.documentUrl,
//         });
//       }

//       if (p.invoice?.invoiceNumber) {
//         grouped[year][month].invoices.push({
//           documentName: 'Invoice Document',         //p.invoice.invoiceNumber
//           fileUrl: p.invoice.documentUrl || null,
//         });
//       }
//     });

//     res.json(grouped);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to fetch finance data' });
//   }
// });


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

      // Handle PO
      if (p.po?.documentUrl) {
        grouped[year][month].purchaseOrders.push({
          documentName: p.po.poNumber || 'PO Document',
          fileUrl: p.po.documentUrl,
        });
      }

      // Handle Invoices (array)
      if (Array.isArray(p.invoice) && p.invoice.length > 0) {
        p.invoice.forEach((inv, i) => {
          if (inv.documentUrl) {
            grouped[year][month].invoices.push({
              documentName: inv.invoiceNumber || `Invoice Document ${i + 1}`,
              fileUrl: inv.documentUrl,
            });
          }
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

router.put('/campaign/:campaignId/bookingStatus', upload.single('file'), updateBookingStatus);
router.put('/campaign/:campaignId/artwork', confirmArtwork);

router.post('/campaign/:campaignId/artwork/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // ✅ Upload file to S3
    let fileUrl = '';
    try {
      fileUrl = await uploadToS3(req.file.path, req.file.filename);
    } catch (uploadErr) {
      console.error('S3 upload failed:', uploadErr);
      return res.status(500).json({ error: 'Failed to upload artwork to S3' });
    }

    // ✅ Update pipeline document
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
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);




router.post('/change-Log', async (req, res) => {
  console.log('Received test request body:', req.body);
  const { campaignId, userId, userEmail, userName, changeType, previousValue, newValue } = req.body;

  // Ensure campaignId and userId are valid ObjectIds
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    console.log('Invalid campaignId:', campaignId);  // Log invalid campaignId
    return res.status(400).send({ message: 'Invalid campaignId' });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.log('Invalid userId:', userId);  // Log invalid userId
    return res.status(400).send({ message: 'Invalid userId' });
  }

  try {
    // No need to explicitly cast here if you've already validated
    const changeLog = new ChangeLog({
      campaignId: new mongoose.Types.ObjectId(campaignId),  // Cast to ObjectId
      userId: new mongoose.Types.ObjectId(userId),  // Cast to ObjectId
      userEmail,
      userName,
      changeType,
      previousValue,
      newValue,
    });

    await changeLog.save();
    res.status(201).send({ message: 'Change log saved successfully' });
  } catch (err) {
    console.error('Error saving change log:', err);
    res.status(500).send({ message: 'Error saving change log' });
  }
});

// Activites Tab Endpoint.
// Activities Tab Endpoint (Upgraded with Aggregation Pipeline for Sorting and Performance)
router.get('/change-Log', async (req, res) => {
  try {
    // 1. Get parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { 
      startDate, 
      endDate, 
      search = '',
      sortKey = 'createdAt',
      sortDirection = 'desc'
    } = req.query;

    const searchRegex = new RegExp(search, 'i');

    // 2. Build the main aggregation pipeline
    const pipeline = [];
    
    // --- Date Filtering Stage ---
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    
    if (Object.keys(dateFilter).length > 0) {
      pipeline.push({ $match: { createdAt: dateFilter } });
    }

    // --- Join with Users and Campaigns ---
    pipeline.push({ $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'userInfo' } });
    pipeline.push({ $lookup: { from: 'campaigns', localField: 'campaignId', foreignField: '_id', as: 'campaignInfo' } });
    
    // Deconstruct the joined arrays
    pipeline.push({ $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } });
    pipeline.push({ $unwind: { path: '$campaignInfo', preserveNullAndEmptyArrays: true } });

    // --- Search Filtering Stage (on populated fields) ---
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'userInfo.name': searchRegex },
            { 'userEmail': searchRegex },
            { 'campaignInfo.campaignName': searchRegex },
            { 'changeType': searchRegex },
          ],
        },
      });
    }

    // --- Facet for efficient counting and pagination ---
    const countPipeline = [...pipeline, { $count: 'total' }];

    // --- Prepare main data pipeline with sorting and pagination ---
    
    // Map frontend sort keys to backend field names
    const sortKeyMap = {
      campaignName: 'campaignInfo.campaignName',
      userName: 'userInfo.name',
      changeType: 'changeType',
      createdAt: 'createdAt'
    };
    
    const backendSortKey = sortKeyMap[sortKey] || 'createdAt';
    const sortOrder = sortDirection === 'asc' ? 1 : -1;

    pipeline.push({ $sort: { [backendSortKey]: sortOrder } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
    
    // Final projection to shape the output
    pipeline.push({
      $project: {
        _id: 1,
        changeType: 1,
        previousValue: 1,
        newValue: 1,
        createdAt: 1,
        userName: '$userInfo.name',
        userEmail: '$userEmail', // Use the original field as it's reliable
        campaignId: {
          _id: '$campaignInfo._id',
          campaignName: '$campaignInfo.campaignName',
        },
      },
    });

    // 3. Execute both queries in parallel
    const [changelogs, countResult] = await Promise.all([
      ChangeLog.aggregate(pipeline),
      ChangeLog.aggregate(countPipeline),
    ]);

    const totalCount = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // 4. Send the structured response
    res.json({
      changelogs,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
      },
    });
  } catch (error) {
    console.error('Error fetching changelogs:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.put('/campaign/:campaignId/mountingStatus', confirmMountingStatus);
router.post('/campaign/:campaignId/invoice/upload', upload.array('files'), uploadInvoice);
router.post('/campaign/:campaignId/cash-memo/upload', upload.array('files'), uploadCashMemo);
router.post('/campaign/:campaignId/credit-note/upload', upload.array('files'), uploadCreditNote)
router.put('/campaign/:campaignId/invoice', updateInvoice);

// Payment Route

router.put('/campaign/:id/update-costs', async (req, res) => {
  try {
    const { inventoryCosts } = req.body;

    // Update campaign inventoryCosts
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { inventoryCosts },
      { new: true }
    );


    let totalAmount = 0;

    for (const cost of inventoryCosts) {
      const display = cost.displayCost || 0;
      const printing = (cost.printingcostpersquareFeet || 0) * (cost.area || 0);
      const mounting = (cost.mountingcostpersquareFeet || 0) * (cost.area || 0);
      const base = display + printing + mounting;
      // const withGST = base * 1.18;
      totalAmount += base;
    }

    // Update payment.totalAmount in related pipeline
    await Pipeline.findOneAndUpdate(
      { campaign: req.params.id },
      { 'payment.totalAmount': Math.round(totalAmount) }, // round if needed
      { new: true }
    );

    res.json({ campaign });
  } catch (err) {
    console.error('Update failed:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/campaign/:campaignId/payment', updatePayment);

router.post(
  '/campaign/:campaignId/payment/upload',
  upload.single('file'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
      const fileUrl = await uploadToS3(req.file.path, req.file.filename);

      // Just return the S3 file URL to the frontend
      return res.status(200).json({ documentUrl: fileUrl });
    } catch (uploadErr) {
      console.error('S3 upload failed:', uploadErr);
      return res.status(500).json({ error: 'Failed to upload payment document to S3' });
    }
  }
);

// PO Document Upload and Confirmation
router.post('/campaign/:campaignId/po/upload', upload.single('file'), uploadPoDocument);
router.put('/campaign/:campaignId/po', confirmPoStatus);
router.delete('/campaign/:campaignId', deletePipelineAndCleanup);


export default router;
