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

