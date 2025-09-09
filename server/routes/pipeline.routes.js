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
// import { assertUnitAvailableOrThrow } from '../controllers/pipeline.controller.js';
import Space from '../models/space.model.js';
router.get('/campaign/:campaignId', getPipelineByCampaignId);
const { Types } = mongoose;


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
// GET /api/pipeline/campaign/:campaignId/digital-status
// router.get('/campaign/:campaignId/digital-status', async (req, res) => {
//   try {
//     const { campaignId } = req.params;

//     // Only fetch allocations; no snapshot fallback here
//     const pipe = await Pipeline.findOne({ campaign: campaignId })
//       .populate('allocations.space', '_id') // optional
//       .lean();

//     if (!pipe) return res.json({});

//     const map = {};
//     for (const a of (pipe.allocations || [])) {
//       const spaceId =
//         a.space && typeof a.space === 'object' && a.space._id
//           ? String(a.space._id)
//           : String(a.space);
//       const units = Array.isArray(a.units) ? a.units : [];
//       if (units.length) map[spaceId] = units; // only campaign-owned units
//     }

//     return res.json(map);
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: 'Failed to fetch digital status' });
//   }
// });

router.get('/campaign/:campaignId/digital-status', async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Pull allocations + spaces in one shot
    const pipe = await Pipeline.findOne({ campaign: campaignId })
      .populate('allocations.space', '_id spaceType unit') // OK
      .populate({
        path: 'spaces',                // legacy flattened spaces array on Pipeline
        select: '_id spaceType digitalStatus' 
      })
      .lean();

    if (!pipe) return res.json({});

    const map = {};

    // Primary source: campaign-scoped units
    for (const a of (pipe.allocations || [])) {
      const units = Array.isArray(a.units) ? a.units : [];
      if (!units.length) continue;

      const spaceId =
        a.space && typeof a.space === 'object' && a.space._id
          ? String(a.space._id)
          : String(a.space);

      map[spaceId] = units;
    }

    // Optional fallback: if a space has no units in allocations yet,
    // use Space snapshot so the UI can still show status
    // (Remove this block if you ONLY want to use campaign-scoped data.)
    if (pipe.spaces?.length) {
      for (const s of pipe.spaces) {
        const sid = String(s._id);
        if (map[sid]) continue; // already have campaign-scoped units
        if (s.spaceType === 'DOOH' && Array.isArray(s.digitalStatus) && s.digitalStatus.length) {
          map[sid] = s.digitalStatus; // snapshot fallback
        }
      }
    }

    return res.json(map);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch digital status' });
  }
});


export async function findAvailableUnits({ campaignId, spaceId }) {
  const camp = await Campaign.findById(campaignId).lean();
  if (!camp) throw new Error('Campaign not found');

  const space = await Space.findById(spaceId).lean();
  if (!space) throw new Error('Space not found');

  const totalUnits = Math.max(1, Number(space.unit || 1));
  const curStart = camp.startDate || null; // 'YYYY-MM-DD'
  const curEnd = camp.endDate || null;
  const sid = new mongoose.Types.ObjectId(spaceId);

  // 1) Taken units from other pipelines (campaign-scoped truth)
  const others = await Pipeline.aggregate([
    { $match: { campaign: { $ne: camp._id } } },
    { $match: { 'allocations.space': sid } },
    { $unwind: '$allocations' },
    { $match: { 'allocations.space': sid } },
    { $unwind: { path: '$allocations.units', preserveNullAndEmptyArrays: false } },
    {
      $lookup: {
        from: 'campaigns',
        localField: 'campaign',
        foreignField: '_id',
        as: 'c'
      }
    },
    { $unwind: '$c' },
    // overlap: startA <= endB && startB <= endA (null = open range)
    {
      $match: {
        $expr: {
          $and: [
            { $or: [{ $eq: ['$c.startDate', null] }, { $eq: [curEnd, null] }, { $lte: ['$c.startDate', curEnd] }] },
            { $or: [{ $eq: ['$c.endDate', null] }, { $eq: [curStart, null] }, { $gte: ['$c.endDate', curStart] }] },
          ]
        }
      }
    },
    { $group: { _id: null, taken: { $addToSet: '$allocations.units.unitId' } } }
  ]);

  const takenFromPipelines = new Set(others?.[0]?.taken || []);

  // 2) ALSO treat Space snapshot as taken (for legacy writes)
  //    Any unit with confirmed OR isLive is physically occupied.
  const takenFromSnapshot = new Set(
    (Array.isArray(space.digitalStatus) ? space.digitalStatus : [])
      .filter(u => u && (u.confirmed === true || u.isLive === true))
      .map(u => Number(u.unitId))
      .filter(Number.isFinite)
  );

  // Union
  const taken = new Set([...takenFromPipelines, ...takenFromSnapshot]);

  const free = [];
  for (let u = 1; u <= totalUnits; u++) {
    if (!taken.has(u)) free.push(u);
  }

  return { totalUnits, free, taken: Array.from(taken).sort((a, b) => a - b) };
}
router.get('/campaign/:campaignId/availability/:spaceId', async (req, res) => {
  try {
    const { totalUnits, free, taken } = await findAvailableUnits(req.params);
    res.json({ totalUnits, free, taken });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to compute availability' });
  }
});



// router.put('/campaign/:campaignId/digital-status/:spaceId/:unitId', async (req, res) => {
//   const session = await mongoose.startSession();
//   try {
//     const { campaignId, spaceId, unitId } = req.params;
//     const patch = req.body || {};

//     await session.withTransaction(async () => {
//       // 1) Guard: unit not double-booked
//       await assertUnitAvailableOrThrow({ campaignId, spaceId, unitId });

//       // 2) Update Pipeline (authoritative)
//       const pipe = await Pipeline.findOne({ campaign: campaignId }).session(session);
//       if (!pipe) throw new Error('Pipeline not found');

//       pipe.upsertUnitStatus(spaceId, Number(unitId), patch);
//       await pipe.save({ session });

//       // 3) Mirror into Space snapshot (optional but requested)
//       const space = await Space.findById(spaceId).session(session);
//       if (space && space.spaceType === 'DOOH') {
//         // Ensure an entry exists for this unit (Space has hooks that re-shape on save)
//         if (!Array.isArray(space.digitalStatus)) space.digitalStatus = [];
//         let entry = space.digitalStatus.find(u => Number(u.unitId) === Number(unitId));
//         if (!entry) {
//           // stub – Space hooks will rebuild/validate 1..unit on save
//           space.digitalStatus.push({ unitId: Number(unitId) });
//           entry = space.digitalStatus.find(u => Number(u.unitId) === Number(unitId));
//         }

//         // Mirror only the snapshot fields you care about
//         if (typeof patch.confirmed === 'boolean') entry.confirmed = patch.confirmed;
//         if (typeof patch.isLive === 'boolean') entry.isLive = patch.isLive;
//         if (typeof patch.assignedAgency === 'string') entry.assignedAgency = patch.assignedAgency;
//         if (typeof patch.assignedPerson === 'string') entry.assignedPerson = patch.assignedPerson;
//         if (typeof patch.goLiveDate === 'string') entry.goLiveDate = patch.goLiveDate;
//         if (typeof patch.note === 'string') entry.note = patch.note;

//         // Let Space's pre('save') set completedAt/liveCompletedAt
//         space.markModified('digitalStatus');
//         await space.save({ session });
//       }
//     });

//     // 4) Return the pipeline view (what the FE expects)
//     const updated = await Pipeline.findOne({ campaign: req.params.campaignId });
//     const alloc = updated.getAllocation(req.params.spaceId);
//     return res.json({ spaceId: req.params.spaceId, units: alloc?.units || [] });
//   } catch (e) {
//     console.error(e);
//     res.status(400).json({ message: e.message || 'Failed to update digital status' });
//   } finally {
//     session.endSession();
//   }
// });
// 1) helper: ignore entries without campaignId
async function assertUnitAvailableOrThrow({ campaignObjId, spaceObjId, unitNum, session }) {
  const conflict = await Space.findOne(
    {
      _id: spaceObjId,
      digitalStatus: {
        $elemMatch: {
          unitId: unitNum,
          campaignId: { $exists: true, $ne: campaignObjId } // <— key change
        }
      }
    },
    { _id: 1 }
  ).session(session).lean();

  if (conflict) throw new Error(`Unit ${unitNum} is already allocated to another campaign.`);
}

// routes/pipeline.js
router.put('/campaign/:campaignId/digital-status/:spaceId/:unitId', async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { campaignId, spaceId, unitId } = req.params;
    console.log('campaignId recieved', campaignId);
    const campaignObjId = new mongoose.Types.ObjectId(campaignId);
    const spaceObjId = new mongoose.Types.ObjectId(spaceId);
    const unitNum = Number(unitId);
    const patch = req.body || {};

    await session.withTransaction(async () => {
      // 1) Load space
      const space = await Space.findById(spaceObjId).session(session);
      if (!space) throw new Error('Space not found');
      if (space.spaceType !== 'DOOH') throw new Error('Digital status only applies to DOOH spaces');

      if (!Array.isArray(space.digitalStatus)) space.digitalStatus = [];

      // 2) Conflict: is this unit owned by a different campaign?
      const conflict = space.digitalStatus.find(
        r => Number(r.unitId) === unitNum &&
             r.campaignId && String(r.campaignId) !== String(campaignObjId)
      );
      if (conflict) {
        throw new Error(`Unit ${unitNum} is already allocated to another campaign.`);
      }

      // 3) Find row for this (unit, campaign) or create one
      let row = space.digitalStatus.find(
        r => Number(r.unitId) === unitNum &&
             String(r.campaignId || '') === String(campaignObjId)
      );
      if (!row) {
        row = space.digitalStatus.create({ unitId: unitNum, campaignId: campaignObjId });
        space.digitalStatus.push(row);
      }
      row.campaignId = campaignObjId;
      // 4) Apply updates
      if (typeof patch.confirmed === 'boolean') row.confirmed = patch.confirmed;
      if (typeof patch.isLive === 'boolean') row.isLive = patch.isLive;
      if (typeof patch.goLiveDate === 'string') row.goLiveDate = patch.goLiveDate || '';
      if (typeof patch.assignedPerson === 'string') row.assignedPerson = patch.assignedPerson || '';
      if (typeof patch.assignedAgency === 'string') row.assignedAgency = patch.assignedAgency || '';
      if (typeof patch.note === 'string') row.note = patch.note || '';

      if (row.confirmed && !row.completedAt) row.completedAt = new Date();
      if (row.isLive && !row.liveCompletedAt) row.liveCompletedAt = new Date();

      // 5) Save space (timestamps handled by schema)
      space.markModified('digitalStatus');
      await space.save({ session });

      // 6) Update Pipeline (campaign-scoped, your helper)
      const pipe = await Pipeline.findOne({ campaign: campaignObjId }).session(session);
      if (!pipe) throw new Error('Pipeline not found');
      pipe.upsertUnitStatus(String(spaceObjId), unitNum, patch);
      await pipe.save({ session });
    });

    const updated = await Pipeline.findOne({ campaign: campaignId });
    const alloc = updated.getAllocation(spaceId);
    res.json({ spaceId, units: alloc?.units || [] });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message || 'Failed to update digital status' });
  } finally {
    session.endSession();
  }
});


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
