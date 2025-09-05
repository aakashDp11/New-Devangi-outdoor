// const { Schema, model } = mongoose;

// const campaignSchema = new Schema({

//   campaignName: { type: String },
//   campaignImages: [String],
//   description: { type: String },

//   spaces: [{
//     id: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
//     selectedUnits: { type: Number, required: true, min: 1 }
//   }]
// ,  
//   campaignImages: [String],



// }, {
//   timestamps: true
// });

// const Campaign = model('Campaign', bookingSchema);

// export default Booking;

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const campaignSchema = new Schema({
  campaignName: { type: String },
  description: { type: String },
  spaces: [{
    id: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
    selectedUnits: { type: Number, required: true, min: 1 }
  }],
  industry: {
    type: String,
    default: 'Other',
  
  },
   isFOC: {
    type: Boolean,
    default: false,
  },
  artwork: {
    confirmed: { type: Boolean, default: false },
    documentUrl: { type: String },
    recievedDate: { type: String }
  },
  inventoryCosts: [{
    id: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
    displayCost: { type: Number, required: true },
    buyingPrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    invoiceNo: { type: String, default: '' }, // <-- ADD THIS LINE
    printingcostpersquareFeet: { type: Number, required: true },
    mountingcostpersquareFeet: { type: Number, required: true },
    area: { type: Number, required: true }
  }],
  pipeline: { type: Schema.Types.ObjectId, ref: 'Pipeline', unique: true, sparse: true },
  startDate: { type: String, },
  endDate: { type: String, }
}, {
  timestamps: true
});
campaignSchema.index({ startDate: 1, endDate: 1 });



// Membership + time window (availability/performance lookups)
campaignSchema.index({ 'spaces.id': 1, startDate: 1, endDate: 1 });
const Campaign = model('Campaign', campaignSchema);

export default Campaign;
