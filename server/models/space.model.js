import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const spaceSchema = new Schema({
  spaceName: { type: String },
  landlord: { type: String },
  
  // FIX: Added the missing 'organization' field to match the form
  organization: { type: String },

  peerMediaOwner: { type: String },
  spaceType: { type: String, enum: ['Billboard', 'DOOH', 'Gantry', 'Pole Kiosk', 'BQS', 'Miscellaneous'] },
  traded: { type: Boolean, default: false },
  category: { type: String, enum: ['Retail', 'Transit'] },

  industry: {
    type: Schema.Types.ObjectId,
    ref: 'Industry'
  },

  mediaType: { type: String, enum: ['Static', 'Digital', ""], default: "" },
  price: { type: Number },
  footfall: { type: Number },
  audience: { type: String },
  demographics: { type: String, enum: ['Urban', 'Rural'] },
  description: { type: String },

  // FIX: Renamed from 'illuminations' to 'illumination' to match the form
  // Also ensured enum values match the frontend's expectation, including variations
  illumination: { type: String, enum: ['Front Lit', 'Back Lit', 'Non Lit', 'Frontlit', 'Backlit', 'Nonlit'] },

  unit: { type: Number, default: 1 },
  specification: { type: String, enum: ['LHS', 'RHS'], required: true },
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
  
  // FIX: Added the missing 'facing' field to match the form
  facing: { type: String },

  faciaTowards: { type: String },
  overlappingBooking: { type: Boolean, default: false },

  mainPhoto: String,
  inventory: { type: String },
  longShot: { type: String },
  closeShot: { type: String },

  printingStatus: {
    confirmed: { type: Boolean, default: false },
    printingDate: { type: String, default: '' },
    printingMaterial: { type: String, default: '' },
    assignedPerson: { type: String, default: '' },
    assignedAgency: { type: String, default: '' },
    note: { type: String }
  },
  numberOfBookings: { type: Number, default: 0 },
  totalBookingValue: { type: Number, default: 0 },
  mountingStatus: {
    confirmed: { type: Boolean, default: false },
    mountingDate: { type: String, default: '' },
    assignedPerson: { type: String, default: '' },
    assignedAgency: { type: String, default: '' },
    note: { type: String }
  },

  otherPhotos: [String],
  isInventoryEnabled: { type: Boolean, default: true },
  digitalStatus: {
    confirmed: { type: Boolean, default: false },
    assignedAgency: { type: String, default: '' },
    isLive: { type: Boolean, default: false },
    goLiveDate: { type: String, default: '' },
    note: { type: String }
  },

  availability: {
    type: String,
    default: 'Completely available',
  },

  // This correctly stores the dates from your controller
  dates: [{ type: String }],
  campaignDates: [{
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign" },
    startDate: { type: String, },
    endDate: { type: String, }
  }],
}, {
  timestamps: true
});

const Space = model('Space', spaceSchema);

export default Space;