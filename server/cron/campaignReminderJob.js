import cron from 'node-cron';
import Campaign from '../models/campaign.model.js';
import Booking from '../models/booking.model.js';
import Notification from '../models/notification.model.js';

function daysUntil(dateStr) {
  const today = new Date();
  const target = new Date(dateStr);
  const diffTime = target - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export const startCampaignReminderJob = () => {
  // This schedule runs the job every day at midnight.
  // For testing, you could temporarily change it to '*/30 * * * * *' to run every 30 seconds.
// We are temporarily changing the schedule to run every 30 seconds for testing
cron.schedule('*/30 * * * * *', async () => {     console.log('--- ✅ Campaign Reminder Job Started ---'); // Log when the job begins

    const reminderDays = [15, 10, 7, 5, 3, 2, 1];

    try {
      const campaigns = await Campaign.find();
      console.log(`[INFO] Found ${campaigns.length} total campaigns to check.`); // Log how many campaigns were fetched

      if (campaigns.length === 0) {
        console.log('[INFO] No campaigns in the database. Job finished.');
        return;
      }

      for (const campaign of campaigns) {
        console.log(`\n[PROCESS] Checking campaign: "${campaign.campaignName}" (ID: ${campaign._id})`);

        // --- Condition 1: Check for an end date ---
        if (!campaign.endDate) {
          console.log(` -> [SKIP] ❌ Campaign has no 'endDate' field.`);
          continue;
        }

        const daysLeft = daysUntil(campaign.endDate);
        console.log(` -> [CALC] Days until expiry: ${daysLeft}. (End date: ${campaign.endDate.toISOString()})`);

        // --- Condition 2: Check if it's a reminder day ---
        if (!reminderDays.includes(daysLeft)) {
          console.log(` -> [SKIP] ❌ Days left (${daysLeft}) is not in the reminder list [${reminderDays.join(', ')}].`);
          continue;
        }

        // --- Condition 3: Check for a linked booking ---
        const booking = await Booking.findOne({ campaigns: campaign._id });
        if (!booking) {
          console.log(` -> [SKIP] ❌ No associated booking found for this campaign.`);
          continue;
        }
        console.log(` -> [PASS] ✅ Found associated booking for company: "${booking.companyName}"`);

        // --- Condition 4: Prevent duplicate notifications ---
        const existing = await Notification.findOne({
          campaignId: campaign._id,
          dueInDays: daysLeft
        });

        if (existing) {
          console.log(` -> [SKIP] ❌ Notification for ${daysLeft} days has already been created.`);
          continue;
        }
        console.log(' -> [PASS] ✅ No duplicate notification found.');


        // --- All checks passed, create the notification ---
        console.log(' -> [CREATE] ✅ All conditions met. Creating notification...');
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
        console.log(` -> [SUCCESS] 🎉 Created and saved reminder for ${campaign.campaignName}.`);
      }

    } catch (error) {
      console.error('❌❌❌ Error running campaign reminder job:', error);
    } finally {
        console.log('\n--- 🏁 Campaign Reminder Job Finished ---'); // Log when the job is complete
    }
  });
};