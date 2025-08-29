import cron from 'node-cron';
import Space from '../models/space.model.js';
import Notification from '../models/notification.model.js';

/**
 * Parses a date string that could be in ISO format or DD-MM-YYYY format.
 * This makes the system resilient to the incorrect date format.
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
    // Note: JavaScript months are 0-indexed, so we subtract 1.
    // Using Date.UTC prevents local timezone issues during the initial parse.
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
  
  // Get today's date at midnight UTC
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // Get the target's date at midnight UTC
  const targetUTC = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));

  const diffTime = targetUTC - todayUTC;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export const startSpaceReminderJob = () => {
  // This schedule runs the job every 30 seconds for testing.
 cron.schedule('5 0 * * *', async () => {
    console.log('--- ✅ Space Reminder Job Started ---'); // Log when the job begins

    const reminderDays = [60, 30, 15, 10, 7, 5, 3, 1];

    try {
      // --- PRIORITY 3: EFFICIENT QUERY ---
      const today = new Date();
      const maxReminderDate = new Date();
      // Set the outer date boundary to 60 days from now (your longest reminder period)
      maxReminderDate.setUTCDate(today.getUTCDate() + Math.max(...reminderDays));

      // Fetch only the spaces that could possibly need a reminder.
      const spaces = await Space.find({
        'dates.1': { 
            $exists: true, 
            $ne: null,
            // Only get spaces expiring between the start of today and 60 days from now
            $gte: today.toISOString().split('T')[0], 
            $lte: maxReminderDate.toISOString()
        }
      });

      console.log(`[INFO] Found ${spaces.length} relevant spaces to check.`);

      if (spaces.length === 0) {
        console.log('[INFO] No spaces require a reminder check at this time. Job finished.');
        return;
      }

      for (const space of spaces) {
        console.log(`\n[PROCESS] Checking space: "${space.spaceName}" (ID: ${space._id})`);

        const targetDateValue = space.dates[1];
        
        // --- PRIORITY 1: CORRECT PARSING ---
        const targetDate = parseFlexibleDate(targetDateValue);

        if (!targetDate) {
          console.log(` -> [SKIP] ❌ Space has an invalid or unparseable date format: "${targetDateValue}"`);
          continue;
        }

        // --- PRIORITY 2: RELIABLE TIMEZONE LOGIC ---
        const daysLeft = daysUntilUTC(targetDate);
        
        console.log(` -> [CALC] Days until expiry: ${daysLeft}. (End date: ${targetDate.toISOString()})`);

        // --- Condition 1: Check if it's a reminder day ---
        if (!reminderDays.includes(daysLeft)) {
          console.log(` -> [SKIP] ❌ Days left (${daysLeft}) is not in the reminder list [${reminderDays.join(', ')}].`);
          continue;
        }
        
        console.log(` -> [PASS] ✅ Days left (${daysLeft}) is a valid reminder day.`);

        // --- Condition 2: Prevent duplicate notifications ---
        const existing = await Notification.findOne({
          spaceId: space._id,
          dueInDays: daysLeft,
          type: 'space_expiry_reminder'
        });

        if (existing) {
          console.log(` -> [SKIP] ❌ Notification for ${daysLeft} days has already been created.`);
          continue;
        }
        
        console.log(' -> [PASS] ✅ No duplicate notification found.');

        // --- All checks passed, create the notification ---
        console.log(' -> [CREATE] ✅ All conditions met. Creating notification...');
        const notification = new Notification({
          type: 'space_expiry_reminder',
          message: `Space "${space.spaceName}" is scheduled for an action in ${daysLeft} day(s).`,
          spaceId: space._id,
          spaceName: space.spaceName,
          dueInDays: daysLeft,
          read: false
        });

        await notification.save();
        console.log(` -> [SUCCESS] 🎉 Created and saved reminder for ${space.spaceName}.`);
      }

    } catch (error) {
      console.error('❌❌❌ Error running space reminder job:', error);
    } finally {
      console.log('\n--- 🏁 Space Reminder Job Finished ---'); // Log when the job is complete
    }
  });
};