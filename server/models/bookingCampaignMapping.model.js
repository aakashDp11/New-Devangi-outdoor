const bookingCampaignSchema = new Schema({
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  
    // Optional: metadata specific to this booking-campaign link
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  });
  
  bookingCampaignSchema.index({ bookingId: 1, campaignId: 1 }, { unique: true });
  
  const BookingCampaign = model('BookingCampaign', bookingCampaignSchema);
  