import cron from 'node-cron';
import Campaign from '../models/campign.model.js';
import Booking from '../models/booking.model.js';
import Notification from '../models/notification.model.js';

function daysUntil(dateStr) {
  const today = new Date();
  const target = new Date(dateStr);
  const diffTime = target - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export const startCampaignReminderJob = () => {
  cron.schedule('0 0 * * *', async () => {
    const reminderDays = [15, 10, 7, 3, 2, 1];

    try {
      const campaigns = await Campaign.find();

      for (const campaign of campaigns) {
        if (!campaign.endDate) continue;

        const daysLeft = daysUntil(campaign.endDate);
        if (!reminderDays.includes(daysLeft)) continue;

        const booking = await Booking.findOne({ campaigns: campaign._id });

        if (!booking) continue;

        // Check if notification already exists for this campaign and dueInDays
        const existing = await Notification.findOne({
          campaignId: campaign._id,
          dueInDays: daysLeft
        });

        if (existing) continue;

        const notification = new Notification({
          type: 'campaign_expiry_reminder',
          message: `Campaign "${campaign.campaignName}" for company "${booking.companyName}" will end in ${daysLeft} day(s).`,
          campaignId: campaign._id,
          bookingId: booking._id,
          campaignName: campaign.campaignName,
          companyName: booking.companyName,
          dueInDays: daysLeft,
          read: false
        });

        await notification.save();
        console.log(`Created reminder for ${campaign.campaignName}, ${daysLeft} days before end`);
      }

    } catch (error) {
      console.error('Error running campaign reminder job:', error);
    }
  });
};
