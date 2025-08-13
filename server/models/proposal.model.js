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
  clientType: { 
    type: String,
    enum: ["Corporate", "Agency", "Direct", "Government"] // <<< IMPROVEMENT
  },
  bookingSource: { 
    type: String, 
    required: true, 
    enum: ['Direct', 'Agency'] 
  },
  description: { type: String },
  spaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Space' }],
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