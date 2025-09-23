

// import mongoose from 'mongoose';

// const { Schema, model } = mongoose;

// // Per-campaign, per-unit digital status (replaces old Space.digitalStatus)
// const DigitalStatusSchema = new Schema({
//   unitId: { type: Number, required: true },     // 1..Space.unit
//   confirmed: { type: Boolean, default: false },
//   completedAt: { type: String, default: '' },   // when confirmed flips true
//   assignedAgency: { type: String, default: '' },
//   assignedPerson: { type: String, default: '' },
//   isLive: { type: Boolean, default: false },
//   liveCompletedAt: { type: String, default: '' } ,// when isLive flips true
//   goLiveDate: { type: String, default: '' },
//   note: { type: String, default: '' }
// }, { _id: false });

// const campaignInventoryMappingSchema = new Schema({
//   campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
//   spaceId:    { type: Schema.Types.ObjectId, ref: 'Space',     required: true, index: true },

//   // Which physical units of this space are reserved by this campaign
//   unitIds: { type: [Number], required: true, default: [1] }, // DOOH: e.g. [1,2]; non-DOOH: [1]

//   // Optional per-space window (kept as strings per your constraint)
//   startDate: { type: String, required: true },
//   endDate:   { type: String, required: true },

//   // Per-space financials for this campaign
//   displayCost: { type: Number, required: true },
//   buyingPrice: { type: Number, default: 0 },
//   sellingPrice:{ type: Number, default: 0 },
//   invoiceNo:   { type: String, default: '' },            // For traded-inv
//   printingCostPerSquareFeet: { type: Number, },
//   mountingCostPerSquareFeet: { type: Number, },
//   area:        { type: Number, required: true },

//   // Optional per-link summaries
//   printingConfirmedAt: { type: String },
//   mountingConfirmedAt: { type: String },

//   // Campaign-scoped per-unit status (this is your digitalStatus)
//   digitalStatus: { type: [DigitalStatusSchema], default: [] }
// }, { timestamps: true });

// /* ---------- Validation & alignment ---------- */

// // unitIds: non-empty, unique, positive integers
// campaignInventoryMappingSchema.path('unitIds').validate(function (arr) {
//   if (!Array.isArray(arr) || arr.length === 0) return false;
//   if (!arr.every(n => Number.isInteger(n) && n >= 1)) return false;
//   const s = new Set(arr);
//   return s.size === arr.length;
// }, 'unitIds must be a non-empty array of unique integers >= 1.');

// // Align digitalStatus entries to unitIds (ensure exactly one per selected unit)
// campaignInventoryMappingSchema.pre('validate', function () {
//   const uniq = Array.isArray(this.unitIds) ? [...new Set(this.unitIds)] : [1];
//   this.unitIds = uniq;

//   const byId = new Map();
//   if (Array.isArray(this.digitalStatus)) {
//     for (const ds of this.digitalStatus) {
//       if (ds && Number.isInteger(ds.unitId)) byId.set(ds.unitId, ds);
//     }
//   }
//   this.digitalStatus = uniq.map(id => byId.get(id) || { unitId: id });
// });

// // Ensure unitIds are valid for the space, and force [1] for non-DOOH
// campaignInventoryMappingSchema.pre('validate', async function () {
//   const Space = this.model('Space');
//   const space = await Space.findById(this.spaceId).lean();
//   if (!space) return; // let other validations handle missing space

//   const maxUnits = Math.max(1, Number(space.unit || 1));

//   if (space.spaceType !== 'DOOH') {
//     this.unitIds = [1];
//     const current = this.digitalStatus?.find(x => x.unitId === 1) || { unitId: 1 };
//     this.digitalStatus = [current];
//     return;
//   }

//   if (this.unitIds.some(u => u < 1 || u > maxUnits)) {
//     throw new Error(`Some unitIds are out of range 1..${maxUnits} for this space`);
//   }
// });

// /* ---------- Indexes ---------- */
// campaignInventoryMappingSchema.index({ campaignId: 1, spaceId: 1 }, { unique: true });
// campaignInventoryMappingSchema.index({ spaceId: 1, startDate: 1, endDate: 1 });
// campaignInventoryMappingSchema.index({ campaignId: 1, startDate: 1, endDate: 1 });
// campaignInventoryMappingSchema.index({ spaceId: 1, unitIds: 1 });          // multikey
// campaignInventoryMappingSchema.index({ 'digitalStatus.unitId': 1 });       // per-unit lookups

// const CampaignInventoryMapping = model('CampaignInventoryMapping', campaignInventoryMappingSchema);
// export default CampaignInventoryMapping;

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

// Pre-validation hook to align digital, printing, and mounting statuses to unitIds
// Pre-validation hook to align digital, printing, and mounting statuses to unitIds


// Pre-validation hook to align digital, printing, and mounting statuses to unitIds
// campaignInventoryMappingSchema.pre('validate', function () {
//   const uniq = Array.isArray(this.unitIds) ? [...new Set(this.unitIds)] : [1];
//   this.unitIds = uniq;

//   const byId = new Map();

//   // Align digital status to unitIds (only unitIds from digitalStatus are needed)
//   if (Array.isArray(this.digitalStatus)) {
//     for (const ds of this.digitalStatus) {
//       if (ds && Number.isInteger(ds.unitId)) byId.set(ds.unitId, ds);
//     }
//   }

//   // Create new digital status entries for missing units
//   this.digitalStatus = uniq.map(id => byId.get(id) || { unitId: id });

//   // PrintingStatus and MountingStatus no longer require unitId, but we maintain their relationship.
//   // Align printingStatus to unitIds (using unitIds from digitalStatus as the reference)
//   if (Array.isArray(this.printingStatus)) {
//     for (const ps of this.printingStatus) {
//       if (ps && ps.mountingStatusId) {
//         // Ensure the relationship between PrintingStatus and MountingStatus is maintained
//         const mountingStatus = this.mountingStatus.find(ms => ms._id.equals(ps.mountingStatusId));
//         if (mountingStatus) {
//           // Mounting status is connected to the printing status by the mountingStatusId
//           ps.mountingStatusId = mountingStatus._id;
//         }
//       }
//       byId.set(ps.unitId, ps);  // Keeping the existing logic to handle ids
//     }
//   }

//   // Align mountingStatus to unitIds (using unitIds from digitalStatus as the reference)
//   if (Array.isArray(this.mountingStatus)) {
//     for (const ms of this.mountingStatus) {
//       if (ms && ms.printingStatusId) {
//         // Ensure the relationship between MountingStatus and PrintingStatus is maintained
//         const printingStatus = this.printingStatus.find(ps => ps._id.equals(ms.printingStatusId));
//         if (printingStatus) {
//           // Printing status is connected to the mounting status by the printingStatusId
//           ms.printingStatusId = printingStatus._id;
//         }
//       }
//       byId.set(ms.unitId, ms);  // Keeping the existing logic to handle ids
//     }
//   }

//   // Create new status entries for missing units (printing and mounting statuses)
//   this.printingStatus = uniq.map(id => byId.get(id) || { unitId: id });
//   this.mountingStatus = uniq.map(id => byId.get(id) || { unitId: id });
// });

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
