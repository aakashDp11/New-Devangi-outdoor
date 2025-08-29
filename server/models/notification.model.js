import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const notificationSchema = new Schema({
    type: { type: String, required: true },  // e.g., "campaign_expiry_reminder"
    message: { type: String },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    campaignName: { type: String, ref: 'Campaign' },
    companyName:{ type: String, ref: 'Booking' },
    dueInDays: { type: Number }, // 15, 10, 7, ...
    spaceId: { type: Schema.Types.ObjectId, ref: 'Space' },
spaceName: { type: String },
    read: { type: Boolean, default: false },
  }, { timestamps: true });

const Notification = model('Notification', notificationSchema);

export default Notification;