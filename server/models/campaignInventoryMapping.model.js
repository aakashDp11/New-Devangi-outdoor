

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// Per-campaign, per-unit digital status (replaces old Space.digitalStatus)
const DigitalStatusSchema = new Schema({
  unitId: { type: Number, required: true },     // 1..Space.unit
  confirmed: { type: Boolean, default: false },
  completedAt: { type: String, default: '' },   // when confirmed flips true
  assignedAgency: { type: String, default: '' },
  assignedPerson: { type: String, default: '' },
  isLive: { type: Boolean, default: false },
  liveCompletedAt: { type: String, default: '' } ,// when isLive flips true
  goLiveDate: { type: String, default: '' },
  note: { type: String, default: '' }
}, { _id: false });

const campaignInventoryMappingSchema = new Schema({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  spaceId:    { type: Schema.Types.ObjectId, ref: 'Space',     required: true, index: true },

  // Which physical units of this space are reserved by this campaign
  unitIds: { type: [Number], required: true, default: [1] }, // DOOH: e.g. [1,2]; non-DOOH: [1]

  // Optional per-space window (kept as strings per your constraint)
  startDate: { type: String, required: true },
  endDate:   { type: String, required: true },

  // Per-space financials for this campaign
  displayCost: { type: Number, required: true },
  buyingPrice: { type: Number, default: 0 },
  sellingPrice:{ type: Number, default: 0 },
  invoiceNo:   { type: String, default: '' },            // For traded-inv
  printingCostPerSquareFeet: { type: Number, },
  mountingCostPerSquareFeet: { type: Number, },
  area:        { type: Number, required: true },

  // Optional per-link summaries
  printingConfirmedAt: { type: String },
  mountingConfirmedAt: { type: String },

  // Campaign-scoped per-unit status (this is your digitalStatus)
  digitalStatus: { type: [DigitalStatusSchema], default: [] }
}, { timestamps: true });

/* ---------- Validation & alignment ---------- */

// unitIds: non-empty, unique, positive integers
campaignInventoryMappingSchema.path('unitIds').validate(function (arr) {
  if (!Array.isArray(arr) || arr.length === 0) return false;
  if (!arr.every(n => Number.isInteger(n) && n >= 1)) return false;
  const s = new Set(arr);
  return s.size === arr.length;
}, 'unitIds must be a non-empty array of unique integers >= 1.');

// Align digitalStatus entries to unitIds (ensure exactly one per selected unit)
campaignInventoryMappingSchema.pre('validate', function () {
  const uniq = Array.isArray(this.unitIds) ? [...new Set(this.unitIds)] : [1];
  this.unitIds = uniq;

  const byId = new Map();
  if (Array.isArray(this.digitalStatus)) {
    for (const ds of this.digitalStatus) {
      if (ds && Number.isInteger(ds.unitId)) byId.set(ds.unitId, ds);
    }
  }
  this.digitalStatus = uniq.map(id => byId.get(id) || { unitId: id });
});

// Ensure unitIds are valid for the space, and force [1] for non-DOOH
campaignInventoryMappingSchema.pre('validate', async function () {
  const Space = this.model('Space');
  const space = await Space.findById(this.spaceId).lean();
  if (!space) return; // let other validations handle missing space

  const maxUnits = Math.max(1, Number(space.unit || 1));

  if (space.spaceType !== 'DOOH') {
    this.unitIds = [1];
    const current = this.digitalStatus?.find(x => x.unitId === 1) || { unitId: 1 };
    this.digitalStatus = [current];
    return;
  }

  if (this.unitIds.some(u => u < 1 || u > maxUnits)) {
    throw new Error(`Some unitIds are out of range 1..${maxUnits} for this space`);
  }
});

/* ---------- Indexes ---------- */
campaignInventoryMappingSchema.index({ campaignId: 1, spaceId: 1 }, { unique: true });
campaignInventoryMappingSchema.index({ spaceId: 1, startDate: 1, endDate: 1 });
campaignInventoryMappingSchema.index({ campaignId: 1, startDate: 1, endDate: 1 });
campaignInventoryMappingSchema.index({ spaceId: 1, unitIds: 1 });          // multikey
campaignInventoryMappingSchema.index({ 'digitalStatus.unitId': 1 });       // per-unit lookups

const CampaignInventoryMapping = model('CampaignInventoryMapping', campaignInventoryMappingSchema);
export default CampaignInventoryMapping;
