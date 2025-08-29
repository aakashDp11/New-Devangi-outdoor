import Pipeline from '../models/pipeline.model.js';
import Campaign from '../models/campaign.model.js';
import Space from '../models/space.model.js';
import { uploadToS3 } from '../utils/s3uploader.js';

export const getPipelineByCampaignId = async (req, res) => {
  const { campaignId } = req.params;
  try {
    const pipeline = await Pipeline.findOne({ campaign: campaignId })
      .populate('spaces')
      .populate({
        path: 'campaign',
        select: 'inventoryCosts isFOC',
      });
    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    res.json(pipeline);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch pipeline' });
  }
};

export const createPipelineForCampaign = async (req, res) => {
  const { campaignId } = req.params;
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    let existingPipeline = await Pipeline.findOne({ campaign: campaignId });
    if (existingPipeline) {
      if (!campaign.pipeline) {
        campaign.pipeline = existingPipeline._id;
        await campaign.save();
      }
      return res.status(200).json(existingPipeline);
    }
    const newPipeline = new Pipeline({
      campaign: campaignId,
      spaces: campaign.spaces.map(s => s.id),
    });
    await newPipeline.save();
    campaign.pipeline = newPipeline._id;
    await campaign.save();
    res.status(201).json(newPipeline);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create pipeline' });
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

export const deletePipelineAndCleanup = async (req, res) => {
  const { campaignId } = req.params;
  try {
    const pipeline = await Pipeline.findOne({ campaign: campaignId });
    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    if (Array.isArray(pipeline.spaces)) {
      await Promise.all(
        pipeline.spaces.map(async (spaceId) => {
          await Space.findByIdAndUpdate(spaceId, {
            $set: {
              'printingStatus.confirmed': false, 'mountingStatus.confirmed': false,
              'digitalStatus.confirmed': false, 'digitalStatus.isLive': false,
              // Also clear timestamps when resetting
              'printingStatus.completedAt': null, 'mountingStatus.completedAt': null,
              'digitalStatus.completedAt': null, 'digitalStatus.liveCompletedAt': null,
            }
          });
        })
      );
    }
    await Pipeline.deleteOne({ _id: pipeline._id });
    return res.status(200).json({ message: 'Pipeline and associated space statuses deleted successfully' });
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