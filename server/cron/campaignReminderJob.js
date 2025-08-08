import cron from 'node-cron';
import Campaign from '../models/campaign.model.js';
import Booking from '../models/booking.model.js';
import Notification from '../models/notification.model.js';

/**
 * Calculates the number of whole days from now until a target date.
 * @param {string | Date} dateValue The target date, either as a string or Date object.
 * @returns {number} The ceiling integer of days remaining.
 */
function daysUntil(dateValue) {
  const today = new Date();
  // Ensure we start with a clean time (midnight) for today
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateValue);
  // Ensure the target date is also at midnight for a consistent day count
  target.setHours(0, 0, 0, 0);

  const diffTime = target - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export const startCampaignReminderJob = () => {
  // This schedule runs the job every day at midnight.
  // We are temporarily changing the schedule to run every 30 seconds for testing
  cron.schedule('*/30 * * * * *', async () => {
    console.log('--- ✅ Campaign Reminder Job Started ---'); // Log when the job begins

    const reminderDays = [15, 10, 7, 5, 3, 2, 1];

    try {
      const campaigns = await Campaign.find({
        endDate: { $exists: true, $ne: null } // Optimization: Only fetch campaigns with an end date
      });

      console.log(`[INFO] Found ${campaigns.length} campaigns with an end date to check.`);

      if (campaigns.length === 0) {
        console.log('[INFO] No relevant campaigns to process. Job finished.');
        return;
      }

      for (const campaign of campaigns) {
        console.log(`\n[PROCESS] Checking campaign: "${campaign.campaignName}" (ID: ${campaign._id})`);

        // --- IMPROVEMENT: Convert to a Date object immediately ---
        const endDate = new Date(campaign.endDate);

        // --- IMPROVEMENT: Add a check for invalid date formats ---
        if (isNaN(endDate.getTime())) {
          console.log(` -> [SKIP] ❌ Campaign has an invalid date format for 'endDate': "${campaign.endDate}"`);
          continue;
        }

        const daysLeft = daysUntil(endDate);
        
        // --- This is now safe to call .toISOString() ---
        console.log(` -> [CALC] Days until expiry: ${daysLeft}. (End date: ${endDate.toISOString()})`);

        // --- Condition 1: Check if it's a reminder day ---
        if (!reminderDays.includes(daysLeft)) {
          console.log(` -> [SKIP] ❌ Days left (${daysLeft}) is not in the reminder list [${reminderDays.join(', ')}].`);
          continue;
        }

        // --- Condition 2: Check for a linked booking ---
        const booking = await Booking.findOne({ campaigns: campaign._id });
        if (!booking) {
          console.log(` -> [SKIP] ❌ No associated booking found for this campaign.`);
          continue;
        }
        console.log(` -> [PASS] ✅ Found associated booking for company: "${booking.companyName}"`);

        // --- Condition 3: Prevent duplicate notifications ---
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