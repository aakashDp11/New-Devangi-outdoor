


import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const campaignSchema = new Schema({
  campaignName: { type: String },
  description: { type: String },
  industry: { type: String, default: 'Other' },
  isFOC: { type: Boolean, default: false },
  tags:{String},
  artwork: {
    confirmed: { type: Boolean, default: false }, // Is artwork available
    documentUrl: { type: String },
    receivedDate: { type: String } // keep as string
  },

  pipeline: { type: Schema.Types.ObjectId, ref: 'Pipeline', unique: true, sparse: true },
  startDate: { type: String },
  endDate: { type: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true },                        // Change log timestamps
  toObject: { virtuals: true } 
});


campaignSchema.index({ startDate: 1, endDate: 1 });
// campaignSchema.index({ pipeline: 1 }, { unique: true, sparse: true });

const Campaign = model('Campaign', campaignSchema);
export default Campaign;
