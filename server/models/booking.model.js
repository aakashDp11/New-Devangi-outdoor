
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const bookingSchema = new Schema({
  companyName: { type: String, required: true },
  clientName: { type: String },
  clientEmail: {
    type: String,
    match: [/.+\@.+\..+/, 'Please enter a valid email address'],
  },
  clientPanNumber: { type: String },
  clientGstNumber: { type: String },
  clientContactNumber: { type: Number },
  brandDisplayName: { type: String },
  clientType: { type: String },
  bookingMode: { type: String },
  bookingSource: { type: String },
  agencyName: { type: String },
  reminderTimeline: { type: Number },
  isFOCBooking: { type: Boolean, default: false },
  industry: {
    type: String,
    default: 'Other',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // optional: if every booking must have a user
  },
  campaignImages: [String],
  companyLogo: String,
  // Add the bookingCampaigns field here
  bookingCampaigns: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'BookingCampaign' },
  ],
}, {
  timestamps: true
});

bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ clientName: 1 });
bookingSchema.index({ companyName: 1 });
bookingSchema.index({ campaigns: 1 });

const Booking = model('Booking', bookingSchema);

export default Booking;
