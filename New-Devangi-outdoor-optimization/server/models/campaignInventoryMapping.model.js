

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const DigitalStatusSchema = new Schema({
  unitId: { type: Number, required: true },     
  confirmed: { type: Boolean, default: false },
  completedAt: { type: String, default: '' },   
  assignedAgency: { type: String, default: '' },
  assignedPerson: { type: String, default: '' },
  isLive: { type: Boolean, default: false },
  liveCompletedAt: { type: String, default: '' }, 
  goLiveDate: { type: String, default: '' },
  note: { type: String, default: '' }
}, { _id: false });

// PrintingStatusSchema
const PrintingStatusSchema = new Schema({
  unitId:{type:Number},
  confirmed: { type: Boolean, default: false },
  printingDate: { type: String, default: '' },   
  assignedPerson: { type: String, default: '' },
  assignedAgency: { type: String, default: '' },
  note: { type: String, default: '' },
  completedAt: { type: String, default: '' },
  
  // Linking MountingStatus (this is the connection between the two schemas)
  mountingStatusId: { type: Schema.Types.ObjectId, ref: 'MountingStatus' }
});

// MountingStatusSchema
const MountingStatusSchema = new Schema({
  unitId:{type:Number},
  confirmed: { type: Boolean, default: false },
  mountingDate: { type: String, default: '' },   
  assignedPerson: { type: String, default: '' },
  assignedAgency: { type: String, default: '' },
  note: { type: String, default: '' },
  completedAt: { type: String, default: '' },

  // Linking PrintingStatus (this is the connection between the two schemas)
  printingStatusId: { type: Schema.Types.ObjectId, ref: 'PrintingStatus' }
});

// Define the campaignInventoryMapping schema
const campaignInventoryMappingSchema = new Schema({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  spaceId:    { type: Schema.Types.ObjectId, ref: 'Space', required: true, index: true },

  unitIds: { type: [Number], required: true, default: [1] },

  startDate: { type: String, required: true },
  endDate:   { type: String, required: true },

  displayCost: { type: Number, required: true },
  buyingPrice: { type: Number, default: 0 },
  sellingPrice:{ type: Number, default: 0 },
  invoiceNo:   { type: String, default: '' },
  printingCostPerSquareFeet: { type: Number, required: true },
  mountingCostPerSquareFeet: { type: Number, required: true },
  area:        { type: Number, required: true },

  printingConfirmedAt: { type: String },
  mountingConfirmedAt: { type: String },

  printingStatus: { type: [PrintingStatusSchema], default: [] },
  mountingStatus: { type: [MountingStatusSchema], default: [] },
  digitalStatus: { type: [DigitalStatusSchema], default: [] }
}, { timestamps: true });

// Validation for unitIds to be unique and positive integers
campaignInventoryMappingSchema.path('unitIds').validate(function (arr) {
  if (!Array.isArray(arr) || arr.length === 0) return false;
  if (!arr.every(n => Number.isInteger(n) && n >= 1)) return false;
  const s = new Set(arr);
  return s.size === arr.length;
}, 'unitIds must be a non-empty array of unique integers >= 1.');



campaignInventoryMappingSchema.pre('validate', function () {
  const uniqUnitIds = Array.isArray(this.unitIds) ? [...new Set(this.unitIds)] : [1];
  this.unitIds = uniqUnitIds; // Ensure unitIds are unique and sorted if needed

  // Helper to map existing statuses by unitId
  const mapStatusesByUnitId = (statusArray) => {
    const map = new Map();
    if (Array.isArray(statusArray)) {
      statusArray.forEach(s => {
        if (s && Number.isInteger(s.unitId)) {
          map.set(s.unitId, s);
        }
      });
    }
    return map;
  };

  const existingDigitalStatusMap = mapStatusesByUnitId(this.digitalStatus);
  const existingPrintingStatusMap = mapStatusesByUnitId(this.printingStatus);
  const existingMountingStatusMap = mapStatusesByUnitId(this.mountingStatus);

  this.digitalStatus = uniqUnitIds.map(id => existingDigitalStatusMap.get(id) || { unitId: id });
  this.printingStatus = uniqUnitIds.map(id => existingPrintingStatusMap.get(id) || { unitId: id });
  this.mountingStatus = uniqUnitIds.map(id => existingMountingStatusMap.get(id) || { unitId: id });

  // Now, explicitly handle the linking of PrintingStatus and MountingStatus using their _id fields
  // This needs to be done *after* all statuses for all unitIds are ensured to exist.
  // We need to iterate through the newly constructed printingStatus and mountingStatus arrays
  // and establish/re-establish the `ref` connections.

  // First, create a map of new/existing printing statuses by unitId (including their _ids if generated)
  const currentPrintingStatusMap = new Map();
  this.printingStatus.forEach(ps => currentPrintingStatusMap.set(ps.unitId, ps));

  const currentMountingStatusMap = new Map();
  this.mountingStatus.forEach(ms => currentMountingStatusMap.set(ms.unitId, ms));

  // Iterate through printing statuses to set mountingStatusId
  this.printingStatus.forEach(ps => {
    const correspondingMountingStatus = currentMountingStatusMap.get(ps.unitId);
    if (correspondingMountingStatus && correspondingMountingStatus._id) {
        ps.mountingStatusId = correspondingMountingStatus._id;
    } else {
        // If there's no corresponding mounting status or it's new without an _id yet,
        // you might want to clear or handle this differently. For now, we'll let it be
        // if the _id isn't present, as it will be generated on save.
        // A deeper link setup might require another save or a different approach
        // if you need these IDs to exist before the *first* save.
        ps.mountingStatusId = undefined; // Or new mongoose.Types.ObjectId() if you want to force creation
    }
  });

  // Iterate through mounting statuses to set printingStatusId
  this.mountingStatus.forEach(ms => {
    const correspondingPrintingStatus = currentPrintingStatusMap.get(ms.unitId);
    if (correspondingPrintingStatus && correspondingPrintingStatus._id) {
        ms.printingStatusId = correspondingPrintingStatus._id;
    } else {
        ms.printingStatusId = undefined;
    }
  });

});

// Indexes for efficient lookups
campaignInventoryMappingSchema.index({ campaignId: 1, spaceId: 1 }, { unique: true });
campaignInventoryMappingSchema.index({ spaceId: 1, startDate: 1, endDate: 1 });
campaignInventoryMappingSchema.index({ campaignId: 1, startDate: 1, endDate: 1 });
campaignInventoryMappingSchema.index({ spaceId: 1, unitIds: 1 });  
campaignInventoryMappingSchema.index({ 'digitalStatus.unitId': 1 });   

const CampaignInventoryMapping = model('CampaignInventoryMapping', campaignInventoryMappingSchema);
export default CampaignInventoryMapping;
