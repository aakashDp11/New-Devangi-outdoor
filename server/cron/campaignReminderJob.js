import cron from 'node-cron';
import Campaign from '../models/campaign.model.js';
import Booking from '../models/booking.model.js';
import Notification from '../models/notification.model.js';

/**
 * Parses a date string that could be in ISO format or DD-MM-YYYY format.
 * This is a defensive measure to ensure date parsing is always robust.
 * @param {string} dateString The date string to parse.
 * @returns {Date | null} A valid Date object or null if parsing fails.
 */
function parseFlexibleDate(dateString) {
  // First, try the standard ISO format which new Date() handles well.
  let date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // If that fails, try parsing the "DD-MM-YYYY" format.
  const parts = String(dateString).match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (parts) {
    // parts are [full_match, DD, MM, YYYY]
    return new Date(Date.UTC(parts[3], parts[2] - 1, parts[1]));
  }

  // If neither format works, return null.
  return null;
}

/**
 * Calculates the number of whole days from now (UTC) until a target date (UTC).
 * This is the most reliable way to count days, avoiding timezone issues.
 * @param {Date} targetDate A valid Date object.
 * @returns {number} The ceiling integer of days remaining.
 */
function daysUntilUTC(targetDate) {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const targetUTC = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));

  const diffTime = targetUTC - todayUTC;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export const startCampaignReminderJob = () => {
  // This schedule runs the job every 30 seconds for testing.
  cron.schedule('*/30 * * * * *', async () => {
    console.log('--- ✅ Campaign Reminder Job Started ---'); // Log when the job begins

    const reminderDays = [15, 10, 7, 5, 3, 2, 1];

    try {
      // --- EFFICIENT QUERY ---
      const today = new Date();
      const maxReminderDate = new Date();
      // Set the outer date boundary to 15 days from now (the longest reminder period)
      maxReminderDate.setUTCDate(today.getUTCDate() + Math.max(...reminderDays));

      // Fetch only the campaigns that could possibly need a reminder.
      const campaigns = await Campaign.find({
        endDate: {
            $exists: true,
            $ne: null,
            // Only get campaigns ending between the start of today and 15 days from now
            $gte: today.toISOString().split('T')[0],
            $lte: maxReminderDate.toISOString()
        }
      });

      console.log(`[INFO] Found ${campaigns.length} relevant campaigns to check.`);

      if (campaigns.length === 0) {
        console.log('[INFO] No campaigns require a reminder check at this time. Job finished.');
        return;
      }

      for (const campaign of campaigns) {
        console.log(`\n[PROCESS] Checking campaign: "${campaign.campaignName}" (ID: ${campaign._id})`);

        // --- CORRECT PARSING ---
        const endDate = parseFlexibleDate(campaign.endDate);

        if (!endDate) {
          console.log(` -> [SKIP] ❌ Campaign has an invalid or unparseable date format for 'endDate': "${campaign.endDate}"`);
          continue;
        }

        // --- RELIABLE TIMEZONE LOGIC ---
        const daysLeft = daysUntilUTC(endDate);

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