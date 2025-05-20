import Pipeline from '../models/pipeline.model.js';
import Campaign from '../models/campign.model.js';
import Space from '../models/space.model.js';

/**
 * Get pipeline by Campaign ID
 */
export const getPipelineByCampaignId = async (req, res) => {
  const { campaignId } = req.params;
  try {
    const pipeline = await Pipeline.findOne({ campaign: campaignId }).populate('spaces');
    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    res.json(pipeline);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch pipeline' });
  }
};

/**
 * Create pipeline for Campaign (if not exists)
 */
export const createPipelineForCampaign = async (req, res) => {
  const { campaignId } = req.params;
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Check if already exists
    let existingPipeline = await Pipeline.findOne({ campaign: campaignId });
    if (existingPipeline) {
      return res.status(200).json(existingPipeline);
    }

    // Initialize pipeline with Campaign's spaces (optional - can be empty initially if you want)
     const newPipeline = new Pipeline({
      campaign: campaignId,
      spaces: campaign.spaces.map(s => s.id),
      bookingStatus: { confirmed: false, reference: '' },
      po: { confirmed: false, documentUrl: '' },
      artwork: { confirmed: false, documentUrl: '' },
      invoice: { invoiceNumber: '', documentUrl: '' },
      payment: { payments: [], totalAmount: 0, totalPaid: 0, paymentDue: 0 },  
    });

    await newPipeline.save();
    res.status(201).json(newPipeline);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create pipeline' });
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (req, res) => {
  const { campaignId } = req.params;
  const { confirmed, reference } = req.body;

  try {
    const pipeline = await Pipeline.findOneAndUpdate(
      { campaign: campaignId },
      { bookingStatus: { confirmed, reference } },
      { new: true }
    );
    res.json(pipeline);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update booking status' });
  }
};

/**
 * Confirm Artwork
 */
export const confirmArtwork = async (req, res) => {
  const { campaignId } = req.params;
  try {
    const pipeline = await Pipeline.findOneAndUpdate(
      { campaign: campaignId },
      { 'artwork.confirmed': true },
      { new: true }
    );
    res.json(pipeline);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to confirm artwork' });
  }
};

/**
 * Confirm Printing Status
 */
export const confirmPrintingStatus = async (req, res) => {
  const { campaignId } = req.params;
  try {
    const pipeline = await Pipeline.findOneAndUpdate(
      { campaign: campaignId },
      { 'printingStatus.confirmed': true },
      { new: true }
    );
    res.json(pipeline);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to confirm printing status' });
  }
};

/**
 * Confirm Mounting Status
 */
export const confirmMountingStatus = async (req, res) => {
  const { campaignId } = req.params;
  try {
    const pipeline = await Pipeline.findOneAndUpdate(
      { campaign: campaignId },
      { 'mountingStatus.confirmed': true },
      { new: true }
    );
    res.json(pipeline);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to confirm mounting status' });
  }
};

export const uploadInvoice = async (req, res) => {
  try {
    const campaignId = req.params.campaignId;
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const pipeline = await Pipeline.findOneAndUpdate(
      { campaign: campaignId },
      { 'invoice.documentUrl': `/uploads/${req.file.filename}` },
      { new: true }
    );

    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });

    res.status(200).json(pipeline);
  } catch (err) {
    console.error('Invoice upload failed:', err);
    res.status(500).json({ error: 'Server error during invoice upload' });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const { invoiceNumber } = req.body;
    const campaignId = req.params.campaignId;

    const pipeline = await Pipeline.findOneAndUpdate(
      { campaign: campaignId },
      { 'invoice.invoiceNumber': invoiceNumber },
      { new: true }
    );

    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });

    res.status(200).json(pipeline);
  } catch (err) {
    console.error('Error updating invoice number:', err);
    res.status(500).json({ error: 'Server error during invoice update' });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const campaignId = req.params.campaignId;
    const {
      totalAmount,
      modeOfPayment,
      payments = [],
      totalPaid,
      paymentDue
    } = req.body;

    const pipeline = await Pipeline.findOneAndUpdate(
      { campaign: campaignId },
      {
        payment: {
          totalAmount,
          modeOfPayment,
          payments,
          totalPaid,
          paymentDue
        }
      },
      { new: true }
    );

    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });

    res.status(200).json(pipeline);
  } catch (err) {
    console.error('Error updating payment:', err);
    res.status(500).json({ error: 'Server error during payment update' });
  }
};

export const uploadPoDocument = async (req, res) => {
  try {
    const campaignId = req.params.campaignId;
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const pipeline = await Pipeline.findOneAndUpdate(
      { campaign: campaignId },
      { 'po.documentUrl': `/uploads/${req.file.filename}` },
      { new: true }
    );

    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });

    res.status(200).json(pipeline);
  } catch (err) {
    console.error('Error uploading PO document:', err);
    res.status(500).json({ error: 'Server error during PO upload' });
  }
};

// ✅ Confirm PO received (updates po.confirmed: true)
export const confirmPoStatus = async (req, res) => {
  try {
    const campaignId = req.params.campaignId;
    const { confirmed } = req.body;

    const pipeline = await Pipeline.findOneAndUpdate(
      { campaign: campaignId },
      { 'po.confirmed': confirmed === true || confirmed === 'true' },
      { new: true }
    );

    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });

    res.status(200).json(pipeline);
  } catch (err) {
    console.error('Error confirming PO status:', err);
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

    // Optional cleanup: reset statuses in each space
    if (Array.isArray(pipeline.spaces)) {
      await Promise.all(
        pipeline.spaces.map(async (spaceId) => {
          await Space.findByIdAndUpdate(spaceId, {
            $set: {
              'printingStatus.confirmed': false,
              'mountingStatus.confirmed': false
            }
          });
        })
      );
    }

    // Delete pipeline
    await Pipeline.deleteOne({ _id: pipeline._id });

    return res.status(200).json({ message: 'Pipeline and associated space statuses deleted successfully' });
  } catch (err) {
    console.error('Error deleting pipeline:', err);
    return res.status(500).json({ error: 'Server error during pipeline deletion' });
  }
};