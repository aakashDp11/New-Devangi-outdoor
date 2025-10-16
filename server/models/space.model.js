

import mongoose from 'mongoose';

const { Schema, model } = mongoose;



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
  mediaType: { type: String, enum: ['Static', 'Digital', ''], default: '' },

  price: { type: Number },
  buyingPrice: { type: Number },
  sellingPrice: { type: Number },

  footfall: { type: Number },
  audience: { type: [String] },
  demographics: { type: String, enum: ['Urban', 'Rural'] },
  description: { type: String },
  illumination: {
    type: String,
    enum: ['Front Lit', 'Back Lit', 'Non Lit', 'Frontlit', 'Backlit', 'Nonlit']
  },

  unit: { type: Number, default: 1, min: 1 }, // physical units (DOOH >=1, others 1)

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

  dates: [{ type: String }], // optional freeform date tags

}, { timestamps: true });

// --- Indexes ---
spaceSchema.index({ spaceName: 1 });
spaceSchema.index({ category: 1 });
spaceSchema.index({ tags: 1 });
spaceSchema.index({ city: 1 });
spaceSchema.index({ city: 1, spaceType: 1 });
spaceSchema.index({ category: 1, mediaType: 1 });
spaceSchema.index({ isInventoryEnabled: 1 }, { partialFilterExpression: { isInventoryEnabled: true } });

const Space = model('Space', spaceSchema);
export default Space;
