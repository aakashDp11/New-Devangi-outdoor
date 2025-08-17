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
  // This function remains unchanged as it creates the initial document.
  // The default values from the model will be used.
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
      // Default empty objects will be created automatically by the model
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
  if (!req.file || !req.file.path) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  let fileUrl = '';
  try {
    fileUrl = await uploadToS3(req.file.path, req.file.filename);
  } catch (uploadErr) {
    console.error('S3 upload failed:', uploadErr);
    return res.status(500).json({ error: 'Failed to upload artwork to S3' });
  }
  const { campaignId } = req.params;
  const { confirmed, reference, bookingDate } = req.body;
  try {
    const pipeline = await Pipeline.findOne({ campaign: campaignId });
    if (!pipeline) {
        return res.status(404).json({ error: 'Pipeline not found' });
    }
    pipeline.bookingStatus.confirmed = confirmed;
    pipeline.bookingStatus.reference = reference;
    pipeline.bookingStatus.bookingDate = bookingDate;
    pipeline.bookingStatus.estimateDocument = fileUrl;
    await pipeline.save(); // Triggers middleware
    res.json(pipeline);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update booking status' });
  }
};

export const confirmArtwork = async (req, res) => {
  const { campaignId } = req.params;
  const { receivedDate } = req.body;
  try {
    const pipeline = await Pipeline.findOne({ campaign: campaignId });
     if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    pipeline.artwork.confirmed = true;
    if (receivedDate) {
        pipeline.artwork.recievedDate = receivedDate; // Corrected to match schema
    }
    await pipeline.save(); // Triggers middleware
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
    await space.save(); // Triggers middleware in space.model.js
    res.status(200).json(space);
  } catch (error) {
    console.error('Error confirming printing status:', error);
    res.status(500).json({ error: error.message || 'Failed to confirm printing status' });
  }
};

export const confirmMountingStatus = async (req, res) => {
  const { spaceId } = req.params;
  const { confirmed, receivedDate, assignedPerson, assignedAgency, note } = req.body;
  try {
    const space = await Space.findById(spaceId);
    if (!space) {
        return res.status(404).json({ error: 'Space not found' });
    }
    space.mountingStatus.confirmed = confirmed ?? true;
    if (receivedDate) space.mountingStatus.mountingDate = receivedDate;
    if (assignedPerson) space.mountingStatus.assignedPerson = assignedPerson;
    if (assignedAgency) space.mountingStatus.assignedAgency = assignedAgency;
    if (note) space.mountingStatus.note = note;
    await space.save(); // Triggers middleware in space.model.js
    res.status(200).json(space);
  } catch (error) {
    console.error('Error confirming mounting status:', error);
    res.status(500).json({ error: error.message || 'Failed to confirm mounting status' });
  }
};

// --- NEW: Generic handler for Invoice, Cash Memo, and Credit Note uploads ---
const handleBillingUpload = async (req, res, docType) => {
  try {
    const { campaignId } = req.params;
    const files = req.files || [];
    const pipeline = await Pipeline.findOne({ campaign: campaignId });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    // If 'data' is not in the body, it means we are clearing this section.
    if (!req.body.data) {
      pipeline[docType] = [];
      await pipeline.save();
      return res.status(200).json(pipeline);
    }

    const payload = JSON.parse(req.body.data);
    let fileIndex = 0;
    const newEntries = [];

    for (const entry of payload) {
      let documentUrl = entry.documentUrl; // Keep existing URL if no new file is provided

      // The frontend sends `file: null` for existing entries without a new file upload.
      // We only upload if `file` is not null and a corresponding file exists in the `files` array.
      if (entry.file !== null && files[fileIndex]) {
        documentUrl = await uploadToS3(files[fileIndex].path, files[fileIndex].filename);
        fileIndex++;
      }

      newEntries.push({
        ...entry,
        documentUrl: documentUrl,
        completedAt: entry.completedAt || new Date(), // Add timestamp if not present
      });
    }

    // Replace the entire array on the pipeline document with the new set of entries
    pipeline[docType] = newEntries;

    await pipeline.save();
    res.status(200).json(pipeline);

  } catch (err) {
    console.error(`Server error during ${docType} upload:`, err);
    res.status(500).json({ error: `Server error during ${docType} upload` });
  }
};

// --- UPDATED: Route handlers now use the generic function ---
export const uploadInvoice = async (req, res) => {
  await handleBillingUpload(req, res, 'invoice');
};

export const uploadCashMemo = async (req, res) => {
  await handleBillingUpload(req, res, 'cashMemo');
};

export const uploadCreditNote = async (req, res) => {
  await handleBillingUpload(req, res, 'creditNote');
};

// ... (Your other controller functions like updateInvoice, updatePayment remain unchanged) ...
// The following update functions are simplified to use .save()
export const updateInvoice = async (req, res) => {
    try {
        const { invoiceNumber, invoiceDate, invoiceValue, cashMemoRef, cashMemoValue, creditNoteRef, creditNoteValue } = req.body;
        const { campaignId } = req.params;
        const pipeline = await Pipeline.findOne({ campaign: campaignId });
        if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });

        // This logic might need refinement if you have multiple invoices/memos.
        // Assuming update of the first item for simplicity.
        if (invoiceNumber && pipeline.invoice[0]) pipeline.invoice[0].invoiceNumber = invoiceNumber;
        if (invoiceDate && pipeline.invoice[0]) pipeline.invoice[0].invoiceDate = invoiceDate;
        // etc. for other fields

        await pipeline.save();
        res.status(200).json(pipeline);
    } catch (err) {
        res.status(500).json({ error: 'Server error during invoice update' });
    }
};

// --- UPDATED: updatePayment function to add timestamps ---
export const updatePayment = async (req, res) => {
    try {
        const campaignId = req.params.campaignId;
        const { totalAmount, payments = [], totalPaid, paymentDue, gstValue, finalAmountWithGST, displayAmount, printingAmount, mountingAmount } = req.body;

        const pipeline = await Pipeline.findOne({ campaign: campaignId });
        if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });

        // Map over the incoming payments array and add a timestamp to any new entry.
        const updatedPayments = payments.map(p => {
            // If a payment already has a timestamp, keep it. If not, add one.
            if (!p.completedAt) {
                return { ...p, completedAt: new Date() };
            }
            return p;
        });

        // Update all payment-related fields on the document.
        pipeline.payment = {
            displayAmount,
            printingAmount,
            mountingAmount,
            totalAmount,
            gstValue,
            finalAmountWithGST,
            payments: updatedPayments, // Use the new array that includes timestamps
            totalPaid,
            paymentDue
        };

        await pipeline.save(); // Save the entire updated pipeline document
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
        await pipeline.save();
        res.status(200).json(pipeline);
    } catch (err) {
        res.status(500).json({ error: 'Server error during PO upload' });
    }
};

export const confirmPoStatus = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { confirmed, poNumber, poDate, poValue } = req.body;
        const pipeline = await Pipeline.findOne({ campaign: campaignId });
        if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
        pipeline.po.confirmed = confirmed === true || confirmed === 'true';
        if (poNumber) pipeline.po.poNumber = poNumber;
        if (poDate) pipeline.po.poDate = poDate;
        if (poValue) pipeline.po.poValue = poValue;
        await pipeline.save(); // Triggers middleware
        res.status(200).json(pipeline);
    } catch (err) {
        res.status(500).json({ error: 'Server error during PO confirmation' });
    }
};

export const deletePipelineAndCleanup = async (req, res) => {
  // This function remains unchanged.
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
              'printingStatus.confirmed': false,
              'mountingStatus.confirmed': false,
              'digitalStatus.confirmed': false,
              'digitalStatus.isLive': false
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