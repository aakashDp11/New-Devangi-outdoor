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
import CampaignInventoryMapping from '../models/campaignInventoryMapping.model.js';
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

// router.get('/campaign/:campaignId/digital-status', async (req, res) => {
//   try {
//     const { campaignId } = req.params;

//     // Pull allocations + spaces in one shot
//     const pipe = await Pipeline.findOne({ campaign: campaignId })
//       .populate('allocations.space', '_id spaceType unit') // OK
//       .populate({
//         path: 'spaces',                // legacy flattened spaces array on Pipeline
//         select: '_id spaceType digitalStatus' 
//       })
//       .lean();

//     if (!pipe) return res.json({});

//     const map = {};

//     // Primary source: campaign-scoped units
//     for (const a of (pipe.allocations || [])) {
//       const units = Array.isArray(a.units) ? a.units : [];
//       if (!units.length) continue;

//       const spaceId =
//         a.space && typeof a.space === 'object' && a.space._id
//           ? String(a.space._id)
//           : String(a.space);

//       map[spaceId] = units;
//     }

//     // Optional fallback: if a space has no units in allocations yet,
//     // use Space snapshot so the UI can still show status
//     // (Remove this block if you ONLY want to use campaign-scoped data.)
//     if (pipe.spaces?.length) {
//       for (const s of pipe.spaces) {
//         const sid = String(s._id);
//         if (map[sid]) continue; // already have campaign-scoped units
//         if (s.spaceType === 'DOOH' && Array.isArray(s.digitalStatus) && s.digitalStatus.length) {
//           map[sid] = s.digitalStatus; // snapshot fallback
//         }
//       }
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
    const { from, to } = req.query; // optional date overlap filters (YYYY-MM-DD)

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({ message: 'Invalid campaign ID' });
    }

    const match = { campaignId: new mongoose.Types.ObjectId(campaignId) };

    // Optional: restrict to mappings that overlap a given window
    if (from && to) {
      match.startDate = { $lte: to };
      match.endDate   = { $gte: from };
    }

    // Pull all mappings for the campaign
    const mappings = await CampaignInventoryMapping.find(match, {
      spaceId: 1,
      unitIds: 1,
      digitalStatus: 1
    })
    .populate({ path: 'spaceId', select: 'spaceType unit' })
    .lean();

    // Build the result in the same format as the old route
    const result = [];

    for (const m of mappings) {
      const space = m.spaceId;
      const isDOOH = space?.spaceType === 'DOOH';

      // Prefer stored per-unit digitalStatus; if missing, synthesize from unitIds
      let statuses = Array.isArray(m.digitalStatus) && m.digitalStatus.length
        ? m.digitalStatus
        : (Array.isArray(m.unitIds) ? m.unitIds.map(u => ({
            unitId: u,
            confirmed: false,
            isLive: false,
            goLiveDate: '',
            note: '',
            completedAt: '',
            liveCompletedAt: ''
          })) : [{ unitId: 1, confirmed: false, isLive: false, goLiveDate: '', note: '', completedAt: '', liveCompletedAt: '' }]);

      // For non-DOOH, force a single unit (1)
      if (!isDOOH) {
        const existing = statuses.find(s => s.unitId === 1);
        statuses = existing ? [existing] : [{
          unitId: 1,
          confirmed: false,
          isLive: false,
          goLiveDate: '',
          note: '',
          completedAt: '',
          liveCompletedAt: ''
        }];
      }

      // Flatten the result to match the previous response format
      console.log("M is",m);
      result.push(...statuses.map(s => ({
        _id: space._id,  // Include spaceId (_id of space document)
        spaceName: space.spaceName, // Include spaceName
        unitId: s.unitId,
        confirmed: s.confirmed,
        isLive: s.isLive,
        goLiveDate: s.goLiveDate || '',
        note: s.note || '',
        completedAt: s.completedAt || '',
        liveCompletedAt: s.liveCompletedAt || '',
        campaignId: campaignId
      })));
    }

    return res.json(result); // Return as an array like in the old response format
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Failed to fetch digital status' });
  }
});


// export async function findAvailableUnits({ campaignId, spaceId }) {
//   const camp = await Campaign.findById(campaignId).lean();
//   if (!camp) throw new Error('Campaign not found');

//   const space = await Space.findById(spaceId).lean();
//   if (!space) throw new Error('Space not found');

//   const totalUnits = Math.max(1, Number(space.unit || 1));
//   const curStart = camp.startDate || null; // 'YYYY-MM-DD'
//   const curEnd = camp.endDate || null;
//   const sid = new mongoose.Types.ObjectId(spaceId);

//   // 1) Taken units from other pipelines (campaign-scoped truth)
//   const others = await Pipeline.aggregate([
//     { $match: { campaign: { $ne: camp._id } } },
//     { $match: { 'allocations.space': sid } },
//     { $unwind: '$allocations' },
//     { $match: { 'allocations.space': sid } },
//     { $unwind: { path: '$allocations.units', preserveNullAndEmptyArrays: false } },
//     {
//       $lookup: {
//         from: 'campaigns',
//         localField: 'campaign',
//         foreignField: '_id',
//         as: 'c'
//       }
//     },
//     { $unwind: '$c' },
//     // overlap: startA <= endB && startB <= endA (null = open range)
//     {
//       $match: {
//         $expr: {
//           $and: [
//             { $or: [{ $eq: ['$c.startDate', null] }, { $eq: [curEnd, null] }, { $lte: ['$c.startDate', curEnd] }] },
//             { $or: [{ $eq: ['$c.endDate', null] }, { $eq: [curStart, null] }, { $gte: ['$c.endDate', curStart] }] },
//           ]
//         }
//       }
//     },
//     { $group: { _id: null, taken: { $addToSet: '$allocations.units.unitId' } } }
//   ]);

//   const takenFromPipelines = new Set(others?.[0]?.taken || []);

//   // 2) ALSO treat Space snapshot as taken (for legacy writes)
//   //    Any unit with confirmed OR isLive is physically occupied.
//   const takenFromSnapshot = new Set(
//     (Array.isArray(space.digitalStatus) ? space.digitalStatus : [])
//       .filter(u => u && (u.confirmed === true || u.isLive === true))
//       .map(u => Number(u.unitId))
//       .filter(Number.isFinite)
//   );

//   // Union
//   const taken = new Set([...takenFromPipelines, ...takenFromSnapshot]);

//   const free = [];
//   for (let u = 1; u <= totalUnits; u++) {
//     if (!taken.has(u)) free.push(u);
//   }

//   return { totalUnits, free, taken: Array.from(taken).sort((a, b) => a - b) };
// }
// router.get('/campaign/:campaignId/availability/:spaceId', async (req, res) => {
//   try {
//     const { totalUnits, free, taken } = await findAvailableUnits(req.params);
//     res.json({ totalUnits, free, taken });
//   } catch (e) {
//     res.status(400).json({ message: e.message || 'Failed to compute availability' });
//   }
// });

// router.get('/campaign/:campaignId/availability/:spaceId', async (req, res) => {
//   try {
//     const { totalUnits, free, taken } = await findAvailableUnits(req.params);
//     res.json({ totalUnits, free, taken });
//   } catch (e) {
//     res.status(400).json({ message: e.message || 'Failed to compute availability' });
//   }
// });

router.get('/campaign/:campaignId/availability/:spaceId', async (req, res) => {
  try {
    const { totalUnits, free, taken } = await findAvailableUnits(req.params);
    res.json({ totalUnits, free, taken });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to compute availability' });
  }
});

async function findAvailableUnits({ campaignId, spaceId }) {
  if (!mongoose.Types.ObjectId.isValid(campaignId) || !mongoose.Types.ObjectId.isValid(spaceId)) {
    throw new Error('Invalid campaign/space id');
  }

  // Load campaign and space data
  const [camp, space] = await Promise.all([
    Campaign.findById(campaignId).lean(),
    Space.findById(spaceId).lean()
  ]);
  
  if (!camp) throw new Error('Campaign not found');
  if (!space) throw new Error('Space not found');

  // Define physical units (DOOH vs non-DOOH logic)
  const isDOOH = space.spaceType === 'DOOH';
  const totalUnits = isDOOH ? Math.max(1, Number(space.unit || 1)) : 1;

  // Define the current date range for the campaign
  const curStart = camp.startDate || '0001-01-01';
  const curEnd = camp.endDate || '9999-12-31';
  console.log('Space ID:', space._id);
  console.log('Campaign ID:', camp._id);


  // Fetch all `CampaignInventoryMapping` entries for this space that overlap with the current campaign date range
  // const mappings = await CampaignInventoryMapping.find(
  //   {
  //     spaceId: space._id,
  //     campaignId: { $ne: camp._id }, // Ensure we're looking at other campaigns
  //     // startDate: { $lte: curEnd },
  //     // endDate: { $gte: curStart }
  //   },
  //   { unitIds: 1, digitalStatus: 1 } // Only fetch unitIds and digitalStatus
  // ).lean();
  const mappings = await CampaignInventoryMapping.find({
    campaignId: campaignId,
    spaceId: spaceId,
     startDate: { $lte: curEnd },
  endDate: { $gte: curStart }
  }).lean();
  console.log(mappings);
  
  console.log('Mappings:', mappings);  // Log the fetched mappings

  // Prepare a set of taken units from the overlapping campaigns and digital status
  const takenSet = new Set();

  if (isDOOH) {
    // For DOOH, we have multiple units, so we collect the unitIds that are already taken
    for (const m of mappings) {
      console.log('Mapping UnitIds:', m.unitIds);  // Debug: Log the unitIds

      // Mark units from `unitIds`
      for (const u of (m.unitIds || [])) {
        const unitNum = Number(u);
        if (unitNum >= 1 && unitNum <= totalUnits) {
          takenSet.add(unitNum);
        }
      }

      // Debug: Log digitalStatus for the current mapping
      console.log('Mapping Digital Status:', m.digitalStatus);

      // Mark units from `digitalStatus`
      if (Array.isArray(m.digitalStatus)) {
        for (const ds of m.digitalStatus) {
          if (ds?.unitId && ds?.confirmed) {
            console.log('Taking unit from digitalStatus:', ds.unitId);  // Debug: Log taken units
            takenSet.add(ds.unitId);
          }
        }
      }
    }
  } else {
    // For non-DOOH, we just have a single unit (unit 1) so we check if any campaigns overlap
    if (mappings.length > 0) takenSet.add(1);
  }

  // Now calculate the free units (those not in the takenSet)
  const free = [];
  for (let u = 1; u <= totalUnits; u++) {
    if (!takenSet.has(u)) free.push(u);
  }

  console.log('Taken Units:', Array.from(takenSet)); // Debug: Log the taken units
  console.log('Free Units:', free); // Debug: Log the free units

  return { totalUnits, free, taken: Array.from(takenSet).sort((a, b) => a - b) };
}







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


// router.put('/campaign/:campaignId/digital-status/:spaceId/:unitId', async (req, res) => {
//   const session = await mongoose.startSession();
//   try {
//     const { campaignId, spaceId, unitId } = req.params;
//     const unitNum = Number(unitId);
//     const patch = req.body || {};

//     if (!mongoose.Types.ObjectId.isValid(campaignId) ||
//         !mongoose.Types.ObjectId.isValid(spaceId) ||
//         !Number.isInteger(unitNum) || unitNum < 1) {
//       return res.status(400).json({ message: 'Invalid campaign/space/unit' });
//     }

//     await session.withTransaction(async () => {
//       // 1) Validate space and unit bounds
//       const space = await Space.findById(spaceId).session(session);
//       if (!space) throw new Error('Space not found');

//       const isDOOH = space.spaceType === 'DOOH';
//       const maxUnits = Math.max(1, Number(space.unit || 1));
//       if (!isDOOH && unitNum !== 1) throw new Error('Non-DOOH spaces only support unit 1');
//       if (unitNum > maxUnits) throw new Error(`unitId out of range 1..${maxUnits}`);

//       // 2) Load mapping (campaign ↔ space)
//       const mapping = await CampaignInventoryMapping.findOne({
//         campaignId,
//         spaceId
//       }).session(session);

//       if (!mapping) throw new Error('No mapping for this campaign and space');

//       // Ensure this unit is actually allocated to the campaign
//       if (!Array.isArray(mapping.unitIds) || !mapping.unitIds.includes(unitNum)) {
//         throw new Error(`Unit ${unitNum} is not allocated to this campaign for the given space`);
//       }

//       // 3) Upsert per-unit digital status
//       if (!Array.isArray(mapping.digitalStatus)) mapping.digitalStatus = [];
//       let row = mapping.digitalStatus.find(d => Number(d.unitId) === unitNum);
//       if (!row) {
//         row = { unitId: unitNum };
//         mapping.digitalStatus.push(row);
//       }

//       if (typeof patch.confirmed === 'boolean') row.confirmed = patch.confirmed;
//       if (typeof patch.isLive === 'boolean')     row.isLive   = patch.isLive;
//       if (typeof patch.goLiveDate === 'string')  row.goLiveDate = patch.goLiveDate || '';
//       if (typeof patch.assignedPerson === 'string') row.assignedPerson = patch.assignedPerson || '';
//       if (typeof patch.assignedAgency === 'string') row.assignedAgency = patch.assignedAgency || '';
//       if (typeof patch.note === 'string')        row.note = patch.note || '';

//       // Timestamps as strings (per your constraint)
//       if (row.confirmed && !row.completedAt)       row.completedAt = new Date().toISOString();
//       if (row.isLive && !row.liveCompletedAt)      row.liveCompletedAt = new Date().toISOString();

//       await mapping.save({ session });

//       // 4) Return the full per-unit status list for this space in this campaign
//       const digitalStatus = mapping.digitalStatus
//         .map(s => ({
//           unitId: Number(s.unitId),
//           confirmed: !!s.confirmed,
//           isLive: !!s.isLive,
//           goLiveDate: s.goLiveDate || '',
//           note: s.note || '',
//           assignedPerson: s.assignedPerson || '',
//           assignedAgency: s.assignedAgency || '',
//           completedAt: s.completedAt || '',
//           liveCompletedAt: s.liveCompletedAt || ''
//         }))
//         .sort((a, b) => a.unitId - b.unitId);

//       res.json({
//         campaignId: String(mapping.campaignId),
//         spaceId: String(mapping.spaceId),
//         digitalStatus
//       });
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(400).json({ message: e.message || 'Failed to update digital status' });
//   } finally {
//     session.endSession();
//   }
// });

router.put('/campaign/:campaignId/digital-status/:spaceId/:unitId', async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { campaignId, spaceId, unitId } = req.params;
    const patch = req.body || {};

    const campaignObjId = new mongoose.Types.ObjectId(campaignId);
    const spaceObjId = new mongoose.Types.ObjectId(spaceId);
    const unitNum = Number(unitId);

    await session.withTransaction(async () => {
      // 1) Load the campaign and space
      const campaign = await Campaign.findById(campaignObjId).session(session);
      if (!campaign) throw new Error('Campaign not found');

      const space = await Space.findById(spaceObjId).session(session);
      if (!space) throw new Error('Space not found');

      // 2) Find the mapping for this campaign/space
      const mapping = await CampaignInventoryMapping.findOne({
        campaignId: campaignObjId,
        spaceId: spaceObjId
      }).session(session);

      if (!mapping) throw new Error('No mapping found for this campaign and space');

      // 3) Check if this unitId is part of the allocated unitIds
      if (!mapping.unitIds.includes(unitNum)) {
        throw new Error(`Unit ${unitNum} is not allocated to this space in this campaign`);
      }

      // 4) Update the digital status
      let statusRow = mapping.digitalStatus.find(status => status.unitId === unitNum);
      if (!statusRow) {
        statusRow = { unitId: unitNum };  // If not found, create a new entry
        mapping.digitalStatus.push(statusRow);
      }

      // Apply patch updates
      if (typeof patch.confirmed === 'boolean') statusRow.confirmed = patch.confirmed;
      if (typeof patch.isLive === 'boolean') statusRow.isLive = patch.isLive;
      if (typeof patch.goLiveDate === 'string') statusRow.goLiveDate = patch.goLiveDate || '';
      if (typeof patch.assignedPerson === 'string') statusRow.assignedPerson = patch.assignedPerson || '';
      if (typeof patch.assignedAgency === 'string') statusRow.assignedAgency = patch.assignedAgency || '';
      if (typeof patch.note === 'string') statusRow.note = patch.note || '';

      // Timestamps when confirmed or isLive
      if (statusRow.confirmed && !statusRow.completedAt) statusRow.completedAt = new Date().toISOString();
      if (statusRow.isLive && !statusRow.liveCompletedAt) statusRow.liveCompletedAt = new Date().toISOString();

      // 5) Save the mapping (updates digital status)
      await mapping.save({ session });

      // 6) Respond with updated status
      res.json({
        campaignId: mapping.campaignId,
        spaceId: mapping.spaceId,
        unitId: statusRow.unitId,
        digitalStatus: statusRow
      });
    });
  } catch (e) {
    console.error('Error updating digital status:', e);
    res.status(400).json({ message: e.message || 'Failed to update digital status' });
  } finally {
    session.endSession();
  }
});







// router.put('/campaign/:id/update-costs', async (req, res) => {
//   try {
//     const { inventoryCosts } = req.body;

//     // 1. Update campaign inventoryCosts
//     const campaign = await Campaign.findById(req.params.id);
//     if (!campaign) {
//       return res.status(404).json({ error: 'Campaign not found' });
//     }

//     // Update the inventoryCosts in the campaign
//     for (const cost of inventoryCosts) {
//       // Check if the cost belongs to an existing space and update accordingly
//       const campaignInventoryMapping = await CampaignInventoryMapping.findOneAndUpdate(
//         { campaignId: campaign._id, spaceId: cost.spaceId },
//         {
//           $set: {
//             displayCost: cost.displayCost,
//             buyingPrice: cost.buyingPrice,
//             sellingPrice: cost.sellingPrice,
//             printingCostPerSquareFeet: cost.printingcostpersquareFeet,
//             mountingCostPerSquareFeet: cost.mountingcostpersquareFeet,
//             area: cost.area
//           }
//         },
//         { new: true }
//       );
//       if (!campaignInventoryMapping) {
//         // If the mapping doesn't exist, you might want to create it or handle the error accordingly.
//         console.log(`No inventory mapping found for space ${cost.spaceId} in campaign ${campaign._id}`);
//       }
//     }

//     // 2. Calculate totalAmount from inventoryCosts
//     let totalAmount = 0;
//     let totalPrintingAmount = 0;
//     let totalMountingAmount = 0;
//     let totalDisplayAmount = 0;

//     for (const cost of inventoryCosts) {
//       const display = cost.displayCost || 0;
//       const printing = cost.printingcostpersquareFeet > 0
//         ? (cost.printingcostpersquareFeet * cost.area)
//         : 0;
//       const mounting = cost.mountingcostpersquareFeet > 0
//         ? (cost.mountingcostpersquareFeet * cost.area)
//         : 0;

//       // Add each amount to the respective totals
//       totalDisplayAmount += display;
//       totalPrintingAmount += printing;
//       totalMountingAmount += mounting;

//       // Base amount (without GST)
//       const base = display + printing + mounting;
//       // Add GST (if applicable)
//       const withGST = base * 1.18; // Assuming GST is 18%
//       totalAmount += withGST;
//     }

//     // 3. Update payment.totalAmount in the related pipeline
//     const pipeline = await Pipeline.findOneAndUpdate(
//       { campaign: req.params.id },
//       {
//         'payment.totalAmount': Math.round(totalAmount), // round the total amount
//         'payment.printingAmount': Math.round(totalPrintingAmount), // total printing amount
//         'payment.mountingAmount': Math.round(totalMountingAmount), // total mounting amount
//         'payment.displayAmount': Math.round(totalDisplayAmount), // total display amount
//         'payment.gstValue': Math.round(totalAmount - (totalAmount / 1.18)), // GST calculation
//         'payment.finalAmountWithGST': Math.round(totalAmount), // final amount with GST
//       },
//       { new: true }
//     );

//     if (!pipeline) {
//       return res.status(404).json({ error: 'Pipeline not found' });
//     }

//     res.json({ campaign, pipeline });
//   } catch (err) {
//     console.error('Update failed:', err);
//     res.status(500).json({ error: err.message });
//   }
// });

router.put('/campaign/:id/update-costs', async (req, res) => {
  try {
    const { inventoryCosts } = req.body;

    // 1. Update campaign inventoryCosts
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Variables to store the total costs
    let totalAmount = 0;
    let totalPrintingAmount = 0;
    let totalMountingAmount = 0;
    let totalDisplayAmount = 0;

    // Loop through the inventoryCosts to update individual space costs
    for (const cost of inventoryCosts) {
      // Update the inventory costs in the CampaignInventoryMapping
      const campaignInventoryMapping = await CampaignInventoryMapping.findOneAndUpdate(
        { campaignId: campaign._id, spaceId: cost.spaceId },
        {
          $set: {
            displayCost: cost.displayCost,
            buyingPrice: cost.buyingPrice,
            sellingPrice: cost.sellingPrice,
            printingCostPerSquareFeet: cost.printingcostpersquareFeet,
            mountingCostPerSquareFeet: cost.mountingcostpersquareFeet,
            area: cost.area
          }
        },
        { new: true }
      );

      if (!campaignInventoryMapping) {
        // If the mapping doesn't exist, log or handle accordingly
        console.log(`No inventory mapping found for space ${cost.spaceId} in campaign ${campaign._id}`);
      }

      // 2. Calculate costs for this individual space
      const display = cost.displayCost || 0;
      const printing = cost.printingcostpersquareFeet > 0
        ? (cost.printingcostpersquareFeet * cost.area)
        : 0;
      const mounting = cost.mountingcostpersquareFeet > 0
        ? (cost.mountingcostpersquareFeet * cost.area)
        : 0;

      // Add this space's costs to the total accumulators
      totalDisplayAmount += display;
      totalPrintingAmount += printing;
      totalMountingAmount += mounting;

      // Base amount (without GST)
      const base = display + printing + mounting;
      // Add GST (if applicable)
      const withGST = base * 1.18; // Assuming GST is 18%
      totalAmount += withGST;
    }

    // 3. After all spaces have been updated, update the payment.totalAmount in the related pipeline
    const pipeline = await Pipeline.findOneAndUpdate(
      { campaign: req.params.id },
      {
        'payment.totalAmount': Math.round(totalAmount), // round the total amount
        'payment.printingAmount': Math.round(totalPrintingAmount), // total printing amount
        'payment.mountingAmount': Math.round(totalMountingAmount), // total mounting amount
        'payment.displayAmount': Math.round(totalDisplayAmount), // total display amount
        'payment.gstValue': Math.round(totalAmount - (totalAmount / 1.18)), // GST calculation
        'payment.finalAmountWithGST': Math.round(totalAmount), // final amount with GST
      },
      { new: true }
    );

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    res.json({ campaign, pipeline });
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
