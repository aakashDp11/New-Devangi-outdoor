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
  campaignName: { type: String },
  campaignImages: [String],
  industry: {
    type: String,
    enum: ['Automotive', 'Clothing & Apparel', 'Ecommerce', 'EdTech', 'Entertainment', 'FMCG']
  },
  description: { type: String },
  // spaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Space' }],
  spaces: [{
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
    selectedUnits: { type: Number, required: true, min: 1 }
  }]
,  
  campaignImages: [String],
  pipeline: {
    type: Map,
    of: new Schema({
      status: { type: String, enum: ['pending', 'in_progress', 'done'], default: 'pending' },
      updatedAt: { type: Date },
      data: { type: Schema.Types.Mixed } // Store payment, artwork info etc.
    }, { _id: false })
  },
  

}, {
  timestamps: true
});

const Booking = model('Booking', bookingSchema);

export default Booking;
