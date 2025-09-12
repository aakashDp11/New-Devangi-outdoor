import Pipeline from '../models/pipeline.model.js';
import Campaign from '../models/campaign.model.js';
import Space from '../models/space.model.js';
import mongoose from 'mongoose';
import { uploadToS3 } from '../utils/s3uploader.js';
import CampaignInventoryMapping from '../models/campaignInventoryMapping.model.js';
const { Types } = mongoose;



export const getPipelineByCampaignId = async (req, res) => {
  const { campaignId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }

    // 1) Load pipeline (with payment/artwork/bookingStatus/po/invoice/etc.) and campaign header
    const pipeline = await Pipeline.findOne({ campaign: campaignId }).lean();
    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });

    const campaign = await Campaign.findById(campaignId).lean();
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    // 2) Load mappings for this campaign
    const mappings = await CampaignInventoryMapping.find({ campaignId }, {
      spaceId: 1,
      displayCost: 1, buyingPrice: 1, sellingPrice: 1, invoiceNo: 1,
      printingCostPerSquareFeet: 1, mountingCostPerSquareFeet: 1, area: 1,
      startDate: 1, endDate: 1, unitIds: 1,
      digitalStatus: 1,
      createdAt: 1, updatedAt: 1
    }).lean();

    const spaceIds = [...new Set(mappings.map(m => String(m.spaceId)))].map(id => new mongoose.Types.ObjectId(id));

    // 3) Load the Space docs we need to show in `spaces[]`
    const spaces = await Space.find({ _id: { $in: spaceIds } }).lean();
    const spaceMap = Object.fromEntries(spaces.map(s => [s._id.toString(), s]));

    // 4) (Optional but matches your sample): for each space, include all campaign windows (`campaignDates`)
    const allWindows = await CampaignInventoryMapping.find(
      { spaceId: { $in: spaceIds } },
      { spaceId: 1, campaignId: 1, startDate: 1, endDate: 1 }
    ).lean();

    const windowsBySpace = allWindows.reduce((acc, w) => {
      const key = w.spaceId.toString();
      (acc[key] ||= []).push({
        campaignId: w.campaignId?.toString(),
        startDate: w.startDate,
        endDate: w.endDate,
        _id: new mongoose.Types.ObjectId() // legacy array element id
      });
      return acc;
    }, {});

    // 5) Build legacy `inventoryCosts[]` from mappings
    const inventoryCosts = mappings.map(m => ({
      id: m.spaceId.toString(),
      displayCost: m.displayCost ?? 0,
      buyingPrice: m.buyingPrice ?? 0,
      sellingPrice: m.sellingPrice ?? 0,
      invoiceNo: m.invoiceNo ?? '',
      // NOTE: legacy key names preserved below:
      printingcostpersquareFeet: m.printingCostPerSquareFeet ?? 0,
      mountingcostpersquareFeet: m.mountingCostPerSquareFeet ?? 0,
      area: m.area ?? 0,
      _id: new mongoose.Types.ObjectId()
    }));

    // 6) Build `spaces[]` in the legacy shape from Space docs, plus synthesized fields
    const spacesResponse = mappings.map(m => {
      const s = spaceMap[m.spaceId.toString()];
      // Synthesize a single-space digitalStatus summary from per-unit statuses
      const ds = Array.isArray(m.digitalStatus) ? m.digitalStatus : [];
      const anyLive = ds.some(u => u?.isLive);
      const allConfirmed = ds.length > 0 ? ds.every(u => u?.confirmed) : false;
      const firstGoLive = ds.map(u => u?.goLiveDate).filter(Boolean).sort()[0] || '';
      const firstAssignedAgency = ds.map(u => u?.assignedAgency).filter(Boolean)[0] || '';

      // NOTE: your current Space model no longer has campaignDates/digitalStatus,
      // so we attach them at response-time for backward compatibility.
      const legacyDigitalStatus = {
        confirmed: allConfirmed,
        assignedAgency: firstAssignedAgency || '',
        isLive: anyLive,
        goLiveDate: firstGoLive,
        createdAt: (m.createdAt ?? s?.createdAt)?.toString?.() || (m.createdAt || ''),
        updatedAt: (m.updatedAt ?? s?.updatedAt)?.toString?.() || (m.updatedAt || '')
      };

      const legacyCampaignDates = windowsBySpace[m.spaceId.toString()] || [{
        campaignId: campaignId,
        startDate: m.startDate,
        endDate: m.endDate,
        _id: new mongoose.Types.ObjectId()
      }];

      // Pick fields to match your sample closely
      return {
        _id: s?._id,
        spaceName: s?.spaceName,
        landlord: s?.landlord,
        peerMediaOwner: s?.peerMediaOwner,
        spaceType: s?.spaceType,
        traded: !!s?.traded,
        category: s?.category,
        mediaType: s?.mediaType ?? '',
        price: s?.price ?? null,
        footfall: s?.footfall ?? null,
        audience: Array.isArray(s?.audience) ? s.audience : [],
        demographics: s?.demographics,
        description: s?.description ?? '',
        unit: s?.unit ?? 1,
        specification: s?.specification,
        occupiedUnits: s?.occupiedUnits ?? 0,
        width: s?.width ?? null,
        height: s?.height ?? null,
        additionalTags: s?.additionalTags,
        previousBrands: s?.previousBrands ?? '',
        tags: s?.tags ?? '',
        address: s?.address,
        city: s?.city,
        state: s?.state,
        latitude: s?.latitude,
        longitude: s?.longitude,
        landmark: s?.landmark,
        zone: s?.zone,
        ownershipType: s?.ownershipType,
        tier: s?.tier,
        faciaTowards: s?.faciaTowards,
        overlappingBooking: !!s?.overlappingBooking,
        mainPhoto: s?.mainPhoto ?? null,
        longShot: s?.longShot ?? null,
        closeShot: s?.closeShot ?? null,
        printingStatus: s?.printingStatus ?? {
          confirmed: false, printingDate: '', printingMaterial: '',
          assignedPerson: '', assignedAgency: ''
        },
        numberOfBookings: s?.numberOfBookings ?? 0,
        totalBookingValue: s?.totalBookingValue ?? 0,
        mountingStatus: s?.mountingStatus ?? {
          confirmed: false, mountingDate: '',
          assignedPerson: '', assignedAgency: ''
        },
        otherPhotos: Array.isArray(s?.otherPhotos) ? s.otherPhotos : [],
        digitalStatus: legacyDigitalStatus,          // synthesized from mapping.digitalStatus
        availability: s?.availability,
        dates: Array.isArray(s?.dates) ? s.dates : [],
        campaignDates: legacyCampaignDates,          // synthesized from mappings across campaigns
        createdAt: s?.createdAt,
        updatedAt: s?.updatedAt,
        __v: s?.__v,
        isInventoryEnabled: s?.isInventoryEnabled
      };
    });

    // 7) Assemble final legacy response
    return res.json({
      // pipeline top-level fields first (payment, etc.)
      payment: pipeline.payment ?? { payments: [] },
      _id: pipeline._id,
      campaign: {
        _id: campaign._id,
        isFOC: !!campaign.isFOC,
        // legacy inventoryCosts list
        inventoryCosts
      },
      spaces: spacesResponse,
      // forward pipeline subdocs as-is (aligns with your sample keys)
      artwork: pipeline.artwork ?? { confirmed: false },
      bookingStatus: pipeline.bookingStatus ?? {},
      po: pipeline.po ?? {},
      invoice: pipeline.invoice ?? [],
      cashMemo: pipeline.cashMemo ?? [],
      creditNote: pipeline.creditNote ?? [],
      createdAt: pipeline.createdAt,
      updatedAt: pipeline.updatedAt,
      __v: pipeline.__v
    });
  } catch (error) {
    console.error('getPipelineByCampaignId error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch pipeline' });
  }
};


// export const getPipelineByCampaignId = async (req, res) => {
//   const { campaignId } = req.params;
//   try {
//     if (!mongoose.Types.ObjectId.isValid(campaignId)) {
//       return res.status(400).json({ error: 'Invalid campaign ID' });
//     }

//     // 1) Load pipeline (with payment/artwork/bookingStatus/po/invoice/etc.) and campaign header
//     const pipeline = await Pipeline.findOne({ campaign: campaignId }).lean();
//     if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });

//     const campaign = await Campaign.findById(campaignId).lean();
//     if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

//     // 2) Load mappings for this campaign (from the CampaignInventoryMapping model)
//     const mappings = await CampaignInventoryMapping.find({ campaignId }, {
//       spaceId: 1,
//       displayCost: 1, buyingPrice: 1, sellingPrice: 1, invoiceNo: 1,
//       printingCostPerSquareFeet: 1, mountingCostPerSquareFeet: 1, area: 1,
//       digitalStatus: 1, // Ensure digitalStatus is included
//       startDate: 1, endDate: 1, unitIds: 1,
//       createdAt: 1, updatedAt: 1
//     }).lean();

//     const spaceIds = [...new Set(mappings.map(m => String(m.spaceId)))].map(id => new mongoose.Types.ObjectId(id));

//     // 3) Load the Space docs we need to show in `spaces[]`
//     const spaces = await Space.find({ _id: { $in: spaceIds } }).lean();
//     const spaceMap = Object.fromEntries(spaces.map(s => [s._id.toString(), s]));

//     // 4) (Optional but matches your sample): for each space, include all campaign windows (`campaignDates`)
//     const allWindows = await CampaignInventoryMapping.find(
//       { spaceId: { $in: spaceIds } },
//       { spaceId: 1, campaignId: 1, startDate: 1, endDate: 1 }
//     ).lean();

//     const windowsBySpace = allWindows.reduce((acc, w) => {
//       const key = w.spaceId.toString();
//       (acc[key] ||= []).push({
//         campaignId: w.campaignId?.toString(),
//         startDate: w.startDate,
//         endDate: w.endDate,
//         _id: new mongoose.Types.ObjectId() // legacy array element id
//       });
//       return acc;
//     }, {});
// console.log("Mappings are",mappings);
//     // 5) Build legacy `inventoryCosts[]` from mappings
//     const inventoryCosts = mappings.map(m => ({
//       id: m.spaceId.toString(),
//       displayCost: m.displayCost ?? 0,
//       buyingPrice: m.buyingPrice ?? 0,
//       sellingPrice: m.sellingPrice ?? 0,
//       invoiceNo: m.invoiceNo ?? '',
//       // Legacy key names preserved:
//       printingcostpersquareFeet: m.printingCostPerSquareFeet ?? 0,
//       mountingcostpersquareFeet: m.mountingCostPerSquareFeet ?? 0,
//       area: m.area ?? 0,
//       digitalStatus: m.digitalStatus ?? [], // Include digitalStatus array
//       _id: new mongoose.Types.ObjectId()
//     }));

//     // 6) Build `spaces[]` in the legacy shape from Space docs, plus synthesized fields
//     const spacesResponse = mappings.map(m => {
//       const s = spaceMap[m.spaceId.toString()];
//       if (!s) return null; // early exit if no corresponding space

//       const ds = m.digitalStatus || []; // Simplify digitalStatus handling
//       const anyLive = ds.some(u => u?.isLive);
//       const allConfirmed = ds.length > 0 ? ds.every(u => u?.confirmed) : false;
//       const firstGoLive = ds.map(u => u?.goLiveDate).filter(Boolean).sort()[0] || '';
//       const firstAssignedAgency = ds.map(u => u?.assignedAgency).filter(Boolean)[0] || '';

//       const legacyDigitalStatus = {
//         confirmed: allConfirmed,
//         assignedAgency: firstAssignedAgency || '',
//         isLive: anyLive,
//         goLiveDate: firstGoLive,
//         createdAt: (m.createdAt ?? s?.createdAt)?.toString?.() || (m.createdAt || ''),
//         updatedAt: (m.updatedAt ?? s?.updatedAt)?.toString?.() || (m.updatedAt || '')
//       };

//       const legacyCampaignDates = windowsBySpace[m.spaceId.toString()] || [{
//         campaignId: campaignId,
//         startDate: m.startDate,
//         endDate: m.endDate,
//         _id: new mongoose.Types.ObjectId()
//       }];

//       return {
//         _id: s?._id,
//         spaceName: s?.spaceName,
//         landlord: s?.landlord,
//         peerMediaOwner: s?.peerMediaOwner,
//         spaceType: s?.spaceType,
//         traded: !!s?.traded,
//         category: s?.category,
//         mediaType: s?.mediaType ?? '',
//         price: s?.price ?? null,
//         footfall: s?.footfall ?? null,
//         audience: Array.isArray(s?.audience) ? s.audience : [],
//         demographics: s?.demographics,
//         description: s?.description ?? '',
//         unit: s?.unit ?? 1,
//         specification: s?.specification,
//         occupiedUnits: s?.occupiedUnits ?? 0,
//         width: s?.width ?? null,
//         height: s?.height ?? null,
//         additionalTags: s?.additionalTags,
//         previousBrands: s?.previousBrands ?? '',
//         tags: s?.tags ?? '',
//         address: s?.address,
//         city: s?.city,
//         state: s?.state,
//         latitude: s?.latitude,
//         longitude: s?.longitude,
//         landmark: s?.landmark,
//         zone: s?.zone,
//         ownershipType: s?.ownershipType,
//         tier: s?.tier,
//         faciaTowards: s?.faciaTowards,
//         overlappingBooking: !!s?.overlappingBooking,
//         mainPhoto: s?.mainPhoto ?? null,
//         longShot: s?.longShot ?? null,
//         closeShot: s?.closeShot ?? null,
//         printingStatus: s?.printingStatus ?? {
//           confirmed: false, printingDate: '', printingMaterial: '',
//           assignedPerson: '', assignedAgency: ''
//         },
//         numberOfBookings: s?.numberOfBookings ?? 0,
//         totalBookingValue: s?.totalBookingValue ?? 0,
//         mountingStatus: s?.mountingStatus ?? {
//           confirmed: false, mountingDate: '',
//           assignedPerson: '', assignedAgency: ''
//         },
//         otherPhotos: Array.isArray(s?.otherPhotos) ? s.otherPhotos : [],
//         digitalStatus: legacyDigitalStatus, // Synthesized from mapping.digitalStatus
//         availability: s?.availability,
//         dates: Array.isArray(s?.dates) ? s.dates : [],
//         campaignDates: legacyCampaignDates, // Synthesized from mappings across campaigns
//         createdAt: s?.createdAt,
//         updatedAt: s?.updatedAt,
//         __v: s?.__v,
//         isInventoryEnabled: s?.isInventoryEnabled
//       };
//     }).filter(Boolean); // Remove any null spaces

//     // 7) Assemble final legacy response
//     return res.json({
//       // pipeline top-level fields first (payment, etc.)
//       payment: pipeline.payment ?? { payments: [] },
//       _id: pipeline._id,
//       campaign: {
//         _id: campaign._id,
//         isFOC: !!campaign.isFOC,
//         inventoryCosts // Populated from CampaignInventoryMapping
//       },
//       spaces: spacesResponse,
//       artwork: pipeline.artwork ?? { confirmed: false },
//       bookingStatus: pipeline.bookingStatus ?? {},
//       po: pipeline.po ?? {},
//       invoice: pipeline.invoice ?? [],
//       cashMemo: pipeline.cashMemo ?? [],
//       creditNote: pipeline.creditNote ?? [],
//       createdAt: pipeline.createdAt,
//       updatedAt: pipeline.updatedAt,
//       __v: pipeline.__v
//     });
//   } catch (error) {
//     console.error('getPipelineByCampaignId error:', error);
//     return res.status(500).json({ error: error.message || 'Failed to fetch pipeline' });
//   }
// };


export const createPipelineForCampaign = async (req, res) => {
  const { campaignId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }

    // 1) Load campaign header
    const campaign = await Campaign.findById(campaignId).lean();
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    // 2) Collect spaces from mappings (dedupe)
    const mappings = await CampaignInventoryMapping.find(
      { campaignId },
      { spaceId: 1 }
    ).lean();

    const spaceIdStrings = [...new Set(mappings.map(m => String(m.spaceId)))];
    const spaceIds = spaceIdStrings.map(id => new mongoose.Types.ObjectId(id));

    // 3) ONE atomic upsert (prevents E11000 under concurrency)
    // - If pipeline exists: add any missing spaces
    // - If not: create it with spaces
    const pipeline = await Pipeline.findOneAndUpdate(
      { campaign: campaignId },
      {
        $setOnInsert: { campaign: campaignId },
        ...(spaceIds.length
          ? { $addToSet: { spaces: { $each: spaceIds } } }
          : {}), // skip if no spaces
      },
      { upsert: true, new: true }  // <- atomic
    );

    // 4) Ensure Campaign.pipeline is linked
    if (!campaign.pipeline || String(campaign.pipeline) !== String(pipeline._id)) {
      await Campaign.updateOne(
        { _id: campaignId },
        { $set: { pipeline: pipeline._id } }
      );
    }

    return res.status(201).json(pipeline);
  } catch (err) {
    // If a race still slipped through, recover by reading the winner
    if (err?.code === 11000) {
      const existing = await Pipeline.findOne({ campaign: campaignId });
      if (existing) {
        // Optionally merge spaces now that we have the winner
        const mappings = await CampaignInventoryMapping.find(
          { campaignId },
          { spaceId: 1 }
        ).lean();
        const spaceIdStrings = [...new Set(mappings.map(m => String(m.spaceId)))];
        const spaceIds = spaceIdStrings.map(id => new mongoose.Types.ObjectId(id));
        if (spaceIds.length) {
          await Pipeline.updateOne(
            { _id: existing._id },
            { $addToSet: { spaces: { $each: spaceIds } } }
          );
        }
        // Link campaign → pipeline
        await Campaign.updateOne(
          { _id: campaignId },
          { $set: { pipeline: existing._id } }
        );
        return res.status(200).json(await Pipeline.findById(existing._id));
      }
    }

    console.error('createPipelineForCampaign error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create pipeline' });
  }
};
export const updateBookingStatus = async (req, res) => {
  const { campaignId } = req.params;
  const { confirmed, reference, bookingDate } = req.body;
  
  try {
    const pipeline = await Pipeline.findOne({ campaign: campaignId });
    if (!pipeline) {
        return res.status(404).json({ error: 'Pipeline not found' });
    }

    let fileUrl = pipeline.bookingStatus.estimateDocument; // Keep existing URL by default

    if (req.file && req.file.path) {
      try {
        fileUrl = await uploadToS3(req.file.path, req.file.filename);
      } catch (uploadErr) {
        console.error('S3 upload failed:', uploadErr);
        return res.status(500).json({ error: 'Failed to upload document to S3' });
      }
    }

    pipeline.bookingStatus.confirmed = confirmed;
    pipeline.bookingStatus.reference = reference;
    pipeline.bookingStatus.bookingDate = bookingDate;
    pipeline.bookingStatus.estimateDocument = fileUrl;

    // MODIFICATION: Explicitly set the timestamp on every successful update
    pipeline.bookingStatus.completedAt = new Date();

    await pipeline.save();
    res.json(pipeline);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update booking status' });
  }
};

export const confirmArtwork = async (req, res) => {
  const { campaignId } = req.params;
  const { receivedDate, documentUrl } = req.body;
  try {
    const pipeline = await Pipeline.findOne({ campaign: campaignId });
     if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    pipeline.artwork.confirmed = true;
    if (receivedDate) {
        pipeline.artwork.recievedDate = receivedDate;
    }
    if (documentUrl) {
        pipeline.artwork.documentUrl = documentUrl;
    }

    // MODIFICATION: Explicitly set the timestamp on every successful update
    pipeline.artwork.completedAt = new Date();

    await pipeline.save();
    res.status(200).json(pipeline);
  } catch (error) {
    console.error('Error confirming artwork:', error);
    res.status(500).json({ error: error.message || 'Failed to confirm artwork' });
  }
};

export const confirmPrintingStatus = async (req, res) => {
  const { spaceId } = req.params;
  const { confirmed, printingDate, assignedPerson, assignedAgency, printingMaterial, note } = req.body;
  try {
    const space = await Space.findById(spaceId);
    if (!space) {
        return res.status(404).json({ error: 'Space not found' });
    }
    space.printingStatus.confirmed = confirmed ?? true;
    if (printingDate) space.printingStatus.printingDate = printingDate;
    if (assignedPerson) space.printingStatus.assignedPerson = assignedPerson;
    if (assignedAgency) space.printingStatus.assignedAgency = assignedAgency;
    if (printingMaterial) space.printingStatus.printingMaterial = printingMaterial;
    if (note) space.printingStatus.note = note;

    // MODIFICATION: Explicitly set the timestamp on every successful update for Space subdocuments
    space.printingStatus.completedAt = new Date();

    await space.save();
    res.status(200).json(space);
  } catch (error) {
    console.error('Error confirming printing status:', error);
    res.status(500).json({ error: error.message || 'Failed to confirm printing status' });
  }
};

export const confirmMountingStatus = async (req, res) => {
  const { spaceId } = req.params;
  const { confirmed, mountingDate, assignedPerson, assignedAgency, note } = req.body;
  try {
    const space = await Space.findById(spaceId);
    if (!space) {
        return res.status(404).json({ error: 'Space not found' });
    }
    space.mountingStatus.confirmed = confirmed ?? true;
    if (mountingDate) space.mountingStatus.mountingDate = mountingDate;
    if (assignedPerson) space.mountingStatus.assignedPerson = assignedPerson;
    if (assignedAgency) space.mountingStatus.assignedAgency = assignedAgency;
    if (note) space.mountingStatus.note = note;

    // MODIFICATION: Explicitly set the timestamp on every successful update for Space subdocuments
    space.mountingStatus.completedAt = new Date();

    await space.save();
    res.status(200).json(space);
  } catch (error) {
    console.error('Error confirming mounting status:', error);
    res.status(500).json({ error: error.message || 'Failed to confirm mounting status' });
  }
};

const handleBillingUpload = async (req, res, docType) => {
  try {
    const { campaignId } = req.params;
    const files = req.files || [];
    const pipeline = await Pipeline.findOne({ campaign: campaignId });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    if (!req.body.data) {
      pipeline[docType] = [];
      await pipeline.save();
      return res.status(200).json(pipeline);
    }

    const payload = JSON.parse(req.body.data);
    let fileIndex = 0;
    const newEntries = [];

    for (const entry of payload) {
      let documentUrl = entry.documentUrl;

      if (entry.file !== null && files[fileIndex]) {
        documentUrl = await uploadToS3(files[fileIndex].path, files[fileIndex].filename);
        fileIndex++;
      }

      newEntries.push({
        ...entry,
        documentUrl: documentUrl,
        // MODIFICATION: Ensure every invoice item gets a fresh timestamp on save
        completedAt: new Date(),
      });
    }

    pipeline[docType] = newEntries;
    await pipeline.save();
    res.status(200).json(pipeline);

  } catch (err) {
    console.error(`Server error during ${docType} upload:`, err);
    res.status(500).json({ error: `Server error during ${docType} upload` });
  }
};

export const uploadInvoice = async (req, res) => {
  await handleBillingUpload(req, res, 'invoice');
};

export const uploadCashMemo = async (req, res) => {
  await handleBillingUpload(req, res, 'cashMemo');
};

export const uploadCreditNote = async (req, res) => {
  await handleBillingUpload(req, res, 'creditNote');
};

export const updateInvoice = async (req, res) => {
    try {
        const { campaignId } = req.params;
        // This function seems complex and might be replaced by the handleBillingUpload logic.
        // If it's still used, it needs the timestamp update logic.
        const pipeline = await Pipeline.findOne({ campaign: campaignId });
        if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
        
        // Complex logic here...
        // For each updated invoice item:
        // pipeline.invoice[i].completedAt = new Date();

        await pipeline.save();
        res.status(200).json(pipeline);
    } catch (err) {
        res.status(500).json({ error: 'Server error during invoice update' });
    }
};

export const updatePayment = async (req, res) => {
    try {
        const campaignId = req.params.campaignId;
        const { payments = [], ...otherPaymentData } = req.body;

        const pipeline = await Pipeline.findOne({ campaign: campaignId });
        if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
        
        // MODIFICATION: Ensure every payment record has an updated timestamp
        const updatedPayments = payments.map(p => ({
            ...p,
            completedAt: new Date() // Set a fresh timestamp for every saved record
        }));
        
        pipeline.payment = {
            ...pipeline.payment,
            ...otherPaymentData,
            payments: updatedPayments,
        };
        
        await pipeline.save();
        res.status(200).json(pipeline);

    } catch (err) {
        console.error('Server error during payment update:', err);
        res.status(500).json({ error: 'Server error during payment update' });
    }
};

export const uploadPoDocument = async (req, res) => {
    try {
        const { campaignId } = req.params;
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const fileUrl = await uploadToS3(req.file.path, req.file.filename);
        const pipeline = await Pipeline.findOne({ campaign: campaignId });
        if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
        
        pipeline.po.documentUrl = fileUrl;
        
        // Even a simple file upload should update the timestamp if it's part of a stage
        pipeline.po.completedAt = new Date();

        await pipeline.save();
        res.status(200).json(pipeline);
    } catch (err) {
        res.status(500).json({ error: 'Server error during PO upload' });
    }
};

export const confirmPoStatus = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { confirmed, poNumber, poDate, poValue, documentUrl } = req.body;
        const pipeline = await Pipeline.findOne({ campaign: campaignId });
        if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
        
        pipeline.po.confirmed = confirmed === true || confirmed === 'true';
        if (poNumber) pipeline.po.poNumber = poNumber;
        if (poDate) pipeline.po.poDate = poDate;
        if (poValue) pipeline.po.poValue = poValue;
        if (documentUrl) pipeline.po.documentUrl = documentUrl;

        // MODIFICATION: Explicitly set the timestamp on every successful update
        pipeline.po.completedAt = new Date();

        await pipeline.save();
        res.status(200).json(pipeline);
    } catch (err) {
        res.status(500).json({ error: 'Server error during PO confirmation' });
    }
};




//   const { campaignId } = req.params;

//   try {
//     const pipeline = await Pipeline.findOne({ campaign: campaignId });
//     if (!pipeline) {
//       return res.status(404).json({ error: 'Pipeline not found' });
//     }

//     // collect impacted spaces (from allocations is most precise)
//     const spaceIds = Array.isArray(pipeline.allocations)
//       ? pipeline.allocations.map(a => a.space).filter(Boolean)
//       : (Array.isArray(pipeline.spaces) ? pipeline.spaces : []);

//     if (spaceIds.length > 0) {
//       const campId = Types.ObjectId.createFromHexString(String(campaignId));

//       // 1) UNSET problematic fields on ONLY the matching digitalStatus elements
//       await Space.updateMany(
//         { _id: { $in: spaceIds } },
//         {
//           $unset: {
//             'digitalStatus.$[d].isLive': 1,
//             'digitalStatus.$[d].completedAt': 1,
//             'digitalStatus.$[d].liveCompletedAt': 1,
//           }
//         },
//         {
//           arrayFilters: [{ 'd.campaignId': campId }]
//         }
//       );

//       // 2) RESET booleans + clear other stage flags for ONLY matching digitalStatus elements
//       await Space.updateMany(
//         { _id: { $in: spaceIds } },
//         {
//           $set: {
//             // printing/mounting are global per-space (not per-unit); reset safely
//             'printingStatus.confirmed': false,
//             'printingStatus.completedAt': null,
//             'mountingStatus.confirmed': false,
//             'mountingStatus.completedAt': null,

//             // per-unit digital flags for the campaign we’re deleting
//             'digitalStatus.$[d].confirmed': false,
//             'digitalStatus.$[d].isLive': false,
//             'digitalStatus.$[d].note': null,
//             'digitalStatus.$[d].assignedAgency': '',
//             'digitalStatus.$[d].assignedPerson': '',
//             'digitalStatus.$[d].goLiveDate': '',
//           }
//         },
//         {
//           arrayFilters: [{ 'd.campaignId': campId }]
//         }
//       );
//     }

//     // Finally, remove the pipeline itself
//     await Pipeline.deleteOne({ _id: pipeline._id });

//     return res
//       .status(200)
//       .json({ message: 'Pipeline and associated space statuses deleted successfully' });
//   } catch (err) {
//     console.error('Error deleting pipeline:', err);
//     return res.status(500).json({ error: 'Server error during pipeline deletion' });
//   }
// };
// export const deletePipelineAndCleanup = async (req, res) => {
//   const { campaignId } = req.params;

//   try {
//     const pipeline = await Pipeline.findOne({ campaign: campaignId });
//     if (!pipeline) {
//       return res.status(404).json({ error: 'Pipeline not found' });
//     }

//     const campId = Types.ObjectId.createFromHexString(String(campaignId));

//     // Prefer allocations for exact unit-level info; fall back to spaces if needed
//     const allocations = Array.isArray(pipeline.allocations) ? pipeline.allocations : [];
//     const bulkOps = [];

//     // 1) For each space in allocations, free the exact unitIds for this campaign
//     for (const alloc of allocations) {
//       if (!alloc?.space) continue;
//       const spaceId = alloc.space;
//       const unitIds = (alloc.units || []).map(u => Number(u.unitId)).filter(Number.isInteger);

//       if (unitIds.length === 0) continue;

//       // a) UNSET + RESET only matching digitalStatus elements for this campaign + unitIds
//       bulkOps.push({
//         updateOne: {
//           filter: { _id: spaceId, spaceType: 'DOOH' },
//           update: {
//             $unset: {
//               'digitalStatus.$[d].isLive': 1,
//               'digitalStatus.$[d].completedAt': 1,
//               'digitalStatus.$[d].liveCompletedAt': 1,
//               'digitalStatus.$[d].campaignId': 1   // free the unit
//             },
//             $set: {
//               'digitalStatus.$[d].confirmed': false,
//               'digitalStatus.$[d].note': null,
//               'digitalStatus.$[d].assignedAgency': '',
//               'digitalStatus.$[d].assignedPerson': '',
//               'digitalStatus.$[d].goLiveDate': ''
//             },
//             $inc: {
//               // decrease occupied units by the number this pipeline had booked
//               occupiedUnits: -unitIds.length
//             },
//             $pull: {
//               // remove campaignDates entry for this campaign
//               campaignDates: { campaignId: campId }
//             }
//           },
//           arrayFilters: [
//             { 'd.campaignId': campId, 'd.unitId': { $in: unitIds } }
//           ]
//         }
//       });
//     }

//     // If there were no allocations (legacy data), fall back to flatten `spaces`:
//     if (bulkOps.length === 0 && Array.isArray(pipeline.spaces) && pipeline.spaces.length) {
//       // We don't know which unitIds to free—so just clear campaign-scoped entries
//       bulkOps.push({
//         updateMany: {
//           filter: { _id: { $in: pipeline.spaces }, spaceType: 'DOOH' },
//           update: {
//             $unset: {
//               'digitalStatus.$[d].isLive': 1,
//               'digitalStatus.$[d].completedAt': 1,
//               'digitalStatus.$[d].liveCompletedAt': 1,
//               'digitalStatus.$[d].campaignId': 1
//             },
//             $set: {
//               'digitalStatus.$[d].confirmed': false,
//               'digitalStatus.$[d].note': null,
//               'digitalStatus.$[d].assignedAgency': '',
//               'digitalStatus.$[d].assignedPerson': '',
//               'digitalStatus.$[d].goLiveDate': ''
//             },
//             $pull: {
//               campaignDates: { campaignId: campId }
//             }
//           },
//           arrayFilters: [{ 'd.campaignId': campId }]
//         }
//       });
//     }

//     if (bulkOps.length) {
//       await Space.bulkWrite(bulkOps);
//       // clamp occupiedUnits >= 0 (in case of inconsistencies)
//       const impactedSpaceIds = allocations.map(a => a.space).filter(Boolean);
//       const clampFilter = impactedSpaceIds.length
//         ? { _id: { $in: impactedSpaceIds }, occupiedUnits: { $lt: 0 } }
//         : { occupiedUnits: { $lt: 0 } };

//       await Space.updateMany(clampFilter, { $set: { occupiedUnits: 0 } });

//       // recompute availability based on occupiedUnits vs unit
//       const availFilter = impactedSpaceIds.length
//         ? { _id: { $in: impactedSpaceIds } }
//         : {};

//       await Space.updateMany(
//         availFilter,
//         [
//           {
//             $set: {
//               availability: {
//                 $switch: {
//                   branches: [
//                     { case: { $eq: ['$occupiedUnits', 0] }, then: 'Completely available' },
//                     { case: { $lt: ['$occupiedUnits', '$unit'] }, then: 'Partially available' }
//                   ],
//                   default: 'Completely occupied'
//                 }
//               }
//             }
//           }
//         ]
//       );
//     }

//     // 2) As before: remove Pipeline
//     await Pipeline.deleteOne({ _id: pipeline._id });

//     return res.status(200).json({ message: 'Pipeline deleted & DOOH units freed' });
//   } catch (err) {
//     console.error('Error deleting pipeline:', err);
//     return res.status(500).json({ error: 'Server error during pipeline deletion' });
//   }
// };

export const deletePipelineAndCleanup = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const pipeline = await Pipeline.findOne({ campaign: campaignId });
    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    const campId = Types.ObjectId.createFromHexString(String(campaignId));

    // Prefer allocations for exact unit-level info; fall back to spaces if needed
    const allocations = Array.isArray(pipeline.allocations) ? pipeline.allocations : [];
    const bulkOps = [];

    // 1) For each space in allocations, free the exact unitIds for this campaign
    for (const alloc of allocations) {
      if (!alloc?.space) continue;
      const spaceId = alloc.space;
      const unitIds = (alloc.units || []).map(u => Number(u.unitId)).filter(Number.isInteger);

      if (unitIds.length === 0) continue;

      // a) UNSET + RESET only matching digitalStatus elements for this campaign + unitIds
      bulkOps.push({
        updateOne: {
          filter: { spaceId: spaceId, campaignId: campId }, // Find the correct CampaignInventoryMapping
          update: {
            $unset: {
              'digitalStatus.$[d].isLive': 1,
              'digitalStatus.$[d].completedAt': 1,
              'digitalStatus.$[d].liveCompletedAt': 1,
              'digitalStatus.$[d].campaignId': 1   // free the unit
            },
            $set: {
              'digitalStatus.$[d].confirmed': false,
              'digitalStatus.$[d].note': null,
              'digitalStatus.$[d].assignedAgency': '',
              'digitalStatus.$[d].assignedPerson': '',
              'digitalStatus.$[d].goLiveDate': ''
            },
            $inc: {
              // decrease occupied units by the number this pipeline had booked
              occupiedUnits: -unitIds.length
            },
            $pull: {
              // remove campaignDates entry for this campaign
              campaignDates: { campaignId: campId }
            }
          },
          arrayFilters: [
            { 'd.campaignId': campId, 'd.unitId': { $in: unitIds } }
          ]
        }
      });
    }

    // If there were no allocations (legacy data), fall back to flatten `spaces`:
    if (bulkOps.length === 0 && Array.isArray(pipeline.spaces) && pipeline.spaces.length) {
      // We don't know which unitIds to free—so just clear campaign-scoped entries
      bulkOps.push({
        updateMany: {
          filter: { spaceId: { $in: pipeline.spaces }, campaignId: campId }, // Update CampaignInventoryMapping
          update: {
            $unset: {
              'digitalStatus.$[d].isLive': 1,
              'digitalStatus.$[d].completedAt': 1,
              'digitalStatus.$[d].liveCompletedAt': 1,
              'digitalStatus.$[d].campaignId': 1
            },
            $set: {
              'digitalStatus.$[d].confirmed': false,
              'digitalStatus.$[d].note': null,
              'digitalStatus.$[d].assignedAgency': '',
              'digitalStatus.$[d].assignedPerson': '',
              'digitalStatus.$[d].goLiveDate': ''
            },
            $pull: {
              campaignDates: { campaignId: campId }
            }
          },
          arrayFilters: [{ 'd.campaignId': campId }]
        }
      });
    }

    if (bulkOps.length) {
      await CampaignInventoryMapping.bulkWrite(bulkOps); // Update CampaignInventoryMapping instead of Space
      // Update Space fields
      const impactedSpaceIds = allocations.map(a => a.space).filter(Boolean);
      const clampFilter = impactedSpaceIds.length
        ? { _id: { $in: impactedSpaceIds }, occupiedUnits: { $lt: 0 } }
        : { occupiedUnits: { $lt: 0 } };

      await Space.updateMany(clampFilter, { $set: { occupiedUnits: 0 } });

      // recompute availability based on occupiedUnits vs unit
      const availFilter = impactedSpaceIds.length
        ? { _id: { $in: impactedSpaceIds } }
        : {};

      await Space.updateMany(
        availFilter,
        [
          {
            $set: {
              availability: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$occupiedUnits', 0] }, then: 'Completely available' },
                    { case: { $lt: ['$occupiedUnits', '$unit'] }, then: 'Partially available' }
                  ],
                  default: 'Completely occupied'
                }
              }
            }
          }
        ]
      );
    }

    // 2) As before: remove Pipeline
    await Pipeline.deleteOne({ _id: pipeline._id });

    return res.status(200).json({ message: 'Pipeline deleted & DOOH units freed' });
  } catch (err) {
    console.error('Error deleting pipeline:', err);
    return res.status(500).json({ error: 'Server error during pipeline deletion' });
  }
};


export async function assertUnitAvailableOrThrow({ campaignId, spaceId, unitId }) {
  const cur = await Campaign.findById(campaignId).lean();
  if (!cur) throw new Error('Campaign not found');

  // Using campaign dates as the booking window
  const curStart = cur.startDate || null;
  const curEnd = cur.endDate || null;

  // Pipelines for other campaigns that reference this unit
  const others = await Pipeline.aggregate([
    { $match: { campaign: { $ne: cur._id } } },
    { $match: { 'allocations.space': spaceId, 'allocations.units.unitId': Number(unitId) } },
    {
      $lookup: {
        from: 'campaigns',
        localField: 'campaign',
        foreignField: '_id',
        as: 'c'
      }
    },
    { $unwind: '$c' },
    // Overlap check (treat missing dates as open range)
    {
      $match: {
        $expr: {
          $and: [
            // startA <= endB AND startB <= endA
            { $or: [ { $eq: ['$c.startDate', null] }, { $eq: [curEnd, null] }, { $lte: ['$c.startDate', curEnd] } ] },
            { $or: [ { $eq: ['$c.endDate', null] }, { $eq: [curStart, null] }, { $gte: ['$c.endDate', curStart] } ] },
          ]
        }
      }
    }
  ]);

  if (others.length > 0) {
    throw new Error('Unit already allocated to another campaign in overlapping dates.');
  }
}