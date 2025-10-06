import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const bookingCampaignSchema = new Schema({
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  
    // Optional: metadata specific to this booking-campaign link
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },  //No need to have this
    createdAt: { type: Date, default: Date.now }
  });
  
  bookingCampaignSchema.index({ bookingId: 1, campaignId: 1 }, { unique: true });

  // Fast joins from either side + recency scans
  bookingCampaignSchema.index({ bookingId: 1 });
  bookingCampaignSchema.index({ campaignId: 1 });
  bookingCampaignSchema.index({ createdAt: -1 });
  
  const BookingCampaign = model('BookingCampaign', bookingCampaignSchema);
  
  export default BookingCampaign;