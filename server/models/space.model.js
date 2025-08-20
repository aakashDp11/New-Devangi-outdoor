import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// --- Subdocument schemas for space-specific statuses ---

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
    confirmed: { type: Boolean, default: false },
    assignedAgency: { type: String, default: '' },
    assignedPerson: { type: String }, // <-- ADD THIS LINE
    isLive: { type: Boolean, default: false },
    goLiveDate: { type: String, default: '' },
    note: { type: String },
    completedAt: { type: Date },      // For initial confirmation
    liveCompletedAt: { type: Date } // For "Is Live" confirmation
}, { _id: false, timestamps: true });

// --- Main Space Schema ---

const spaceSchema = new Schema({
  spaceName: { type: String },
  landlord: { type: String },
  organization: { type: String },
  peerMediaOwner: { type: String },
  // --- MODIFICATION: Added 'Transit' to handle all space types from the form ---
  spaceType: { type: String, enum: ['Billboard', 'DOOH', 'Gantry', 'Pole Kiosk', 'BQS', 'Miscellaneous', 'Transit'] },
  transitType: { type: String },
  transitLine: { type: String },
  traded: { type: Boolean, default: false },
  category: { type: String, enum: ['Retail', 'Transit'] },
  industry: {
    type: Schema.Types.ObjectId,
    ref: 'Industry'
  },
  mediaType: { type: String, enum: ['Static', 'Digital', ""], default: "" },
  
  // --- MODIFICATION: Added buyingPrice and sellingPrice for BQS spaces ---
  price: { type: Number },
  buyingPrice: { type: Number },
  sellingPrice: { type: Number },

  footfall: { type: Number },
  audience: { type: [String] },
  demographics: { type: String, enum: ['Urban', 'Rural'] },
  description: { type: String },
  illumination: { type: String, enum: ['Front Lit', 'Back Lit', 'Non Lit', 'Frontlit', 'Backlit', 'Nonlit'] },
  unit: { type: Number, default: 1 },
  
  // --- MODIFICATION: Made 'specification' optional by removing required: true ---
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
  availability: {
    type: String,
    default: 'Completely available',
  },
  dates: [{ type: String }],
  campaignDates: [{
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign" },
    startDate: { type: String, },
    endDate: { type: String, }
  }],

  // --- Replace existing status objects with new schemas ---
  printingStatus: { type: PrintingStatusSchema, default: () => ({}) },
  mountingStatus: { type: MountingStatusSchema, default: () => ({}) },
  digitalStatus: { type: DigitalStatusSchema, default: () => ({}) },

}, {
  timestamps: true
});

// --- Middleware to automatically set timestamps for space statuses ---
spaceSchema.pre('save', function(next) {
  if (this.isModified('printingStatus.confirmed') && this.printingStatus.confirmed && !this.printingStatus.completedAt) {
    this.printingStatus.completedAt = new Date();
  }
  if (this.isModified('mountingStatus.confirmed') && this.mountingStatus.confirmed && !this.mountingStatus.completedAt) {
    this.mountingStatus.completedAt = new Date();
  }
  if (this.isModified('digitalStatus.confirmed') && this.digitalStatus.confirmed && !this.digitalStatus.completedAt) {
    this.digitalStatus.completedAt = new Date();
  }
  if (this.isModified('digitalStatus.isLive') && this.digitalStatus.isLive && !this.digitalStatus.liveCompletedAt) {
    this.digitalStatus.liveCompletedAt = new Date();
  }
  next();
});

const Space = model('Space', spaceSchema);

export default Space;