// import mongoose from 'mongoose';

// const { Schema, model } = mongoose;

// const bookingSchema = new Schema({
//   companyName: { type: String, required: true },
//   clientName: { type: String },
//   clientEmail: {
//     type: String,
//     match: [/.+\@.+\..+/, 'Please enter a valid email address']
//   },
//   clientPanNumber: { type: String },
//   clientGstNumber: { type: String },
//   clientContactNumber: { type: Number },
//   brandDisplayName: { type: String },
//   clientType: { type: String },
//   campaignName: { type: String },
//   industry: {
//     type: String,
//     enum: ['Automotive', 'Clothing & Apparel', 'Ecommerce', 'EdTech', 'Entertainment', 'FMCG']
//   },
//   description: { type: String },
//   // spaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Space' }],
//   campaigns:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign',required: true }],
//   spaces: [{
//     id: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
//     selectedUnits: { type: Number, required: true, min: 1 }
//   }]
// ,  
//   campaignImages: [String],

  

// }, {
//   timestamps: true
// });

// const Booking = model('Booking', bookingSchema);

// export default Booking;
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const bookingSchema = new Schema({
  companyName: { type: String, required: true },
  clientName: { type: String },
  clientEmail: {
    type: String,
    match: [/.+\@.+\..+/, 'Please enter a valid email address']
  },
  clientPanNumber: { type: String },
  clientGstNumber: { type: String },
  clientContactNumber: { type: Number },
  brandDisplayName: { type: String },
  clientType: { type: String },

  industry: {
    type: String,
    enum: ['Automotive', 'Clothing & Apparel', 'Ecommerce', 'EdTech', 'Entertainment', 'FMCG']
  },

   campaignImages: [String],
  campaigns: [{ type: Schema.Types.ObjectId, ref: 'Campaign' }],  // ✅ One booking → many campaigns
  companyLogo: String,
}, {
  timestamps: true
});

const Booking = model('Booking', bookingSchema);

export default Booking;
