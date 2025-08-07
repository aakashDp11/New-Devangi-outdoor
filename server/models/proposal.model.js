import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const ProposalSchema = new mongoose.Schema({
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
  description: { type: String },
  spaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Space' }],

  // --- THIS IS THE FIX ---
  // The enum list has been updated to match every possible value from your frontend form,
  // which will resolve the "not a valid enum value" error.
  industry: {
    type: String,
    enum: [
      'Tourism',
      'Retail',
      'Real Estate',
      'Other',
      'Movie',
      'Media and Entertainment',
      'FMCG',
      'Finance',
      'Financial Services',
      'Healthcare',
      'Hospitality',
      'IT Industry',
      'Automobile',
      'Clothing & Apparel',
      'Ecommerce',
      'Edtech',
      'Entertainment'
    ]
  }

}, {
  timestamps: true
});

const Proposal = mongoose.model('Proposal', ProposalSchema);
export default Proposal;