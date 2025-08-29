import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const campaignInventoryMappingSchema = new Schema({
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    spaceId: { type: Schema.Types.ObjectId, ref: 'Space' },
    selectedUnits: { type: Number, required: true },
    // Additional fields such as costs, dates, etc.
  });
  
  const CampaignInventoryMapping = model('CampaignInventoryMapping', campaignInventoryMappingSchema);
  