// import mongoose from 'mongoose';

// const { Schema, model } = mongoose;

// // --- Subdocument schemas for space-specific statuses ---

// const PrintingStatusSchema = new Schema({
//     confirmed: { type: Boolean, default: false },
//     printingDate: { type: String, default: '' },
//     printingMaterial: { type: String, default: '' },
//     assignedPerson: { type: String, default: '' },
//     assignedAgency: { type: String, default: '' },
//     note: { type: String },
//     completedAt: { type: Date }
// }, { _id: false, timestamps: true });

// const MountingStatusSchema = new Schema({
//     confirmed: { type: Boolean, default: false },
//     mountingDate: { type: String, default: '' },
//     assignedPerson: { type: String, default: '' },
//     assignedAgency: { type: String, default: '' },
//     note: { type: String },
//     completedAt: { type: Date }
// }, { _id: false, timestamps: true });

// const DigitalStatusSchema = new Schema({
//     confirmed: { type: Boolean, default: false },
//     assignedAgency: { type: String, default: '' },
//     assignedPerson: { type: String }, // <-- ADD THIS LINE
//     isLive: { type: Boolean, default: false },
//     goLiveDate: { type: String, default: '' },
//     note: { type: String },
//     completedAt: { type: Date },      // For initial confirmation
//     liveCompletedAt: { type: Date } // For "Is Live" confirmation
// }, { _id: false, timestamps: true });

// // --- Main Space Schema ---

// const spaceSchema = new Schema({
//   spaceName: { type: String },
//   landlord: { type: String },
//   organization: { type: String },
//   peerMediaOwner: { type: String },
//   // --- MODIFICATION: Added 'Transit' to handle all space types from the form ---
//   spaceType: { type: String, enum: ['Billboard', 'DOOH', 'Gantry', 'Pole Kiosk', 'BQS', 'Miscellaneous', 'Transit'] },
//   transitType: { type: String },
//   transitLine: { type: String },
//   traded: { type: Boolean, default: false },
//   category: { type: String, enum: ['Retail', 'Transit'] },
//   industry: {
//     type: Schema.Types.ObjectId,
//     ref: 'Industry'
//   },
//   mediaType: { type: String, enum: ['Static', 'Digital', ""], default: "" },
  
//   // --- MODIFICATION: Added buyingPrice and sellingPrice for BQS spaces ---
//   price: { type: Number },
//   buyingPrice: { type: Number },
//   sellingPrice: { type: Number },

//   footfall: { type: Number },
//   audience: { type: [String] },
//   demographics: { type: String, enum: ['Urban', 'Rural'] },
//   description: { type: String },
//   illumination: { type: String, enum: ['Front Lit', 'Back Lit', 'Non Lit', 'Frontlit', 'Backlit', 'Nonlit'] },
//   unit: { type: Number, default: 1 },
  
//   // --- MODIFICATION: Made 'specification' optional by removing required: true ---
//   specification: { type: String, enum: ['LHS', 'RHS'] },

//   occupiedUnits: { type: Number, default: 0 },
//   width: { type: Number },
//   height: { type: Number },
//   additionalTags: { type: String },
//   previousBrands: { type: String },
//   tags: { type: String },
//   address: { type: String },
//   city: { type: String },
//   state: { type: String },
//   latitude: { type: String },
//   longitude: { type: String },
//   landmark: { type: String },
//   zone: { type: String },
//   ownershipType: { type: String },
//   tier: { type: String },
//   facing: { type: String },
//   faciaTowards: { type: String },
//   overlappingBooking: { type: Boolean, default: false },
//   mainPhoto: String,
//   inventory: { type: String },
//   longShot: { type: String },
//   closeShot: { type: String },
//   numberOfBookings: { type: Number, default: 0 },
//   totalBookingValue: { type: Number, default: 0 },
//   otherPhotos: [String],
//   isInventoryEnabled: { type: Boolean, default: true },
//   isUnderMaintenance: { type: Boolean, default: false },
//   availability: {
//     type: String,
//     default: 'Completely available',
//   },
//   dates: [{ type: String }],
//   campaignDates: [{
//     campaignId: { type: Schema.Types.ObjectId, ref: "Campaign" },
//     startDate: { type: String, },
//     endDate: { type: String, }
//   }],

//   // --- Replace existing status objects with new schemas ---
//   printingStatus: { type: PrintingStatusSchema, default: () => ({}) },
//   mountingStatus: { type: MountingStatusSchema, default: () => ({}) },
//   digitalStatus: { type: DigitalStatusSchema, default: () => ({}) },

// }, {
//   timestamps: true
// });

// // --- Middleware to automatically set timestamps for space statuses ---
// spaceSchema.pre('save', function(next) {
//   if (this.isModified('printingStatus.confirmed') && this.printingStatus.confirmed && !this.printingStatus.completedAt) {
//     this.printingStatus.completedAt = new Date();
//   }
//   if (this.isModified('mountingStatus.confirmed') && this.mountingStatus.confirmed && !this.mountingStatus.completedAt) {
//     this.mountingStatus.completedAt = new Date();
//   }
//   if (this.isModified('digitalStatus.confirmed') && this.digitalStatus.confirmed && !this.digitalStatus.completedAt) {
//     this.digitalStatus.completedAt = new Date();
//   }
//   if (this.isModified('digitalStatus.isLive') && this.digitalStatus.isLive && !this.digitalStatus.liveCompletedAt) {
//     this.digitalStatus.liveCompletedAt = new Date();
//   }
//   next();
// });

// const Space = model('Space', spaceSchema);

// export default Space;
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// --- Subdocument schemas ---

const PrintingStatusSchema = new Schema({
  confirmed: { type: Boolean, default: false },
  printingDate: { type: String, default: '' },
  printingMaterial: { type: String, default: '' },
  assignedPerson: { type: String, default: '' },
  assignedAgency: { type: String, default: '' },
  note: { type: String },
  completedAt: { type: Date }
}, { _id: false, timestamps: true });

const MountingStatusSchema = new Schema({
  confirmed: { type: Boolean, default: false },
  mountingDate: { type: String, default: '' },
  assignedPerson: { type: String, default: '' },
  assignedAgency: { type: String, default: '' },
  note: { type: String },
  completedAt: { type: Date }
}, { _id: false, timestamps: true });

const DigitalStatusSchema = new Schema({
  // PRESENT ONLY FOR DOOH (inside array)
  unitId: { type: Number, required: true }, // 1..unit
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', index: true, required: false },
  confirmed: { type: Boolean, default: false },
  assignedAgency: { type: String, default: '' },
  assignedPerson: { type: String, default: '' },
  isLive: { type: Boolean, default: false },
  goLiveDate: { type: String, default: '' },
  note: { type: String },
  completedAt: { type: Date },     // when 'confirmed' flips true
  liveCompletedAt: { type: Date }  // when 'isLive' flips true
}, { _id: true, timestamps: true });

const makeDigitalStatus = (unitId) => ({ unitId });
DigitalStatusSchema.index({ campaignId: 1, unitId: 1 });
// --- Main Space Schema ---

const spaceSchema = new Schema({
  spaceName: { type: String },
  landlord: { type: String },
  organization: { type: String },
  peerMediaOwner: { type: String },

  spaceType: { 
    type: String, 
    enum: ['Billboard', 'DOOH', 'Gantry', 'Pole Kiosk', 'BQS', 'Miscellaneous', 'Transit'] 
  },
  transitType: { type: String },
  transitLine: { type: String },

  traded: { type: Boolean, default: false },
  category: { type: String, enum: ['Retail', 'Transit'] },
  industry: { type: Schema.Types.ObjectId, ref: 'Industry' },
  mediaType: { type: String, enum: ['Static', 'Digital', ""], default: "" },

  price: { type: Number },
  buyingPrice: { type: Number },
  sellingPrice: { type: Number },

  footfall: { type: Number },
  audience: { type: [String] },
  demographics: { type: String, enum: ['Urban', 'Rural'] },
  description: { type: String },
  illumination: { type: String, enum: ['Front Lit', 'Back Lit', 'Non Lit', 'Frontlit', 'Backlit', 'Nonlit'] },

  unit: { type: Number, default: 1 },

  specification: { type: String, enum: ['LHS', 'RHS'] },

  occupiedUnits: { type: Number, default: 0 },
  width: { type: Number },
  height: { type: Number },
  additionalTags: { type: String },
  previousBrands: { type: String },
  tags: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  latitude: { type: String },
  longitude: { type: String },
  landmark: { type: String },
  zone: { type: String },
  ownershipType: { type: String },
  tier: { type: String },
  facing: { type: String },
  faciaTowards: { type: String },
  overlappingBooking: { type: Boolean, default: false },
  mainPhoto: String,
  inventory: { type: String },
  longShot: { type: String },
  closeShot: { type: String },
  numberOfBookings: { type: Number, default: 0 },
  totalBookingValue: { type: Number, default: 0 },
  otherPhotos: [String],
  isInventoryEnabled: { type: Boolean, default: true },
  isUnderMaintenance: { type: Boolean, default: false },
  availability: { type: String, default: 'Completely available' },

  dates: [{ type: String }],
  campaignDates: [{
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign" },
    startDate: { type: String },
    endDate: { type: String }
  }],

  printingStatus: { type: PrintingStatusSchema, default: () => ({}) },
  mountingStatus: { type: MountingStatusSchema, default: () => ({}) },

  // DIGITAL STATUS: only present for DOOH
  digitalStatus: { type: [DigitalStatusSchema],default: []  }

}, { timestamps: true });
// spaceSchema.index({ _id: 1, 'digitalStatus.unitId': 1, 'digitalStatus.campaignId': 1 });

// --- Helpers ---

/**
 * For DOOH, ensure digitalStatus has one item per unitId in 1..unit.
 * Preserve existing entries by unitId when resizing.
 * For non-DOOH, remove digitalStatus completely.
 */
function ensureDigitalStatus(doc) {
  if (doc.spaceType === 'DOOH') {
    const desired = Math.max(1, Number(doc.unit || 1));

    const existingById = new Map();
    if (Array.isArray(doc.digitalStatus)) {
      for (const item of doc.digitalStatus) {
        if (item && typeof item.unitId === 'number') {
          existingById.set(item.unitId, item);
        }
      }
    }

    const rebuilt = [];
    for (let id = 1; id <= desired; id++) {
      rebuilt.push(existingById.get(id) ?? makeDigitalStatus(id));
    }
    doc.digitalStatus = rebuilt;
  } else {
    doc.digitalStatus = undefined; // remove for non-DOOH
  }
}

function updateDigitalStatusTimestamps(d) {
  if (d.confirmed && !d.completedAt) d.completedAt = new Date();
  if (d.isLive && !d.liveCompletedAt) d.liveCompletedAt = new Date();
}

// --- Hooks ---

// Keep digitalStatus shape aligned before validation
spaceSchema.pre('validate', function(next) {
  ensureDigitalStatus(this);
  next();
});

// Timestamps for printing/mounting and each digital unit
spaceSchema.pre('save', function(next) {
  // printing
  if (this.isModified('printingStatus.confirmed') &&
      this.printingStatus?.confirmed &&
      !this.printingStatus.completedAt) {
    this.printingStatus.completedAt = new Date();
  }

  // mounting
  if (this.isModified('mountingStatus.confirmed') &&
      this.mountingStatus?.confirmed &&
      !this.mountingStatus.completedAt) {
    this.mountingStatus.completedAt = new Date();
  }

  // digital (only DOOH)
  if (this.spaceType === 'DOOH' && Array.isArray(this.digitalStatus)) {
    // re-align in case unit/spaceType changed
    if (this.isModified('unit') || this.isModified('spaceType') || this.isModified('digitalStatus')) {
      ensureDigitalStatus(this);
    }
    this.digitalStatus.forEach(updateDigitalStatusTimestamps);
  }

  next();
});

// --- Field-level validation for digitalStatus (only DOOH) ---
spaceSchema.path('digitalStatus').validate(function(value) {
  if (this.spaceType !== 'DOOH') return true; // not applicable

  const desired = Math.max(1, Number(this.unit || 1));
  if (!Array.isArray(value)) return false;
  if (value.length !== desired) return false;

  const ids = value.map(v => v?.unitId).filter(n => typeof n === 'number');
  if (ids.length !== desired) return false;

  // must be exactly {1..desired}, unique and no gaps
  const set = new Set(ids);
  if (set.size !== desired) return false;
  for (let i = 1; i <= desired; i++) if (!set.has(i)) return false;

  return true;
}, 'digitalStatus must contain one entry per unitId in the range 1..unit, unique and contiguous, for DOOH spaces.');

// --- Convenience instance method ---
spaceSchema.methods.getDigitalStatusByUnitId = function(unitId) {
  if (this.spaceType !== 'DOOH' || !Array.isArray(this.digitalStatus)) return undefined;
  return this.digitalStatus.find(d => d.unitId === Number(unitId));
};

const Space = model('Space', spaceSchema);

export default Space;
