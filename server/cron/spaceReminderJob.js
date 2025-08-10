import cron from 'node-cron';
import Space from '../models/space.model.js';
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

export const startSpaceReminderJob = () => {
  // This schedule runs the job every 30 seconds for testing.
  cron.schedule('*/30 * * * * *', async () => {
    console.log('--- ✅ Space Reminder Job Started ---'); // Log when the job begins

    const reminderDays = [60, 30, 15, 10, 7, 5, 3, 1];

    try {
      // Fetch all spaces to check them.
      const spaces = await Space.find({
        'dates.1': { $exists: true, $ne: null } // Optimization: Only fetch spaces with a target date
      });

      console.log(`[INFO] Found ${spaces.length} spaces with a target date to check.`);

      if (spaces.length === 0) {
        console.log('[INFO] No relevant spaces to process. Job finished.');
        return;
      }

      for (const space of spaces) {
        console.log(`\n[PROCESS] Checking space: "${space.spaceName}" (ID: ${space._id})`);

        // --- IMPROVEMENT: Directly access the assured target date ---
        const targetDateValue = space.dates[1];
        const targetDate = new Date(targetDateValue);

        // --- IMPROVEMENT: Add a check for invalid date formats ---
        if (isNaN(targetDate.getTime())) {
          console.log(` -> [SKIP] ❌ Space has an invalid date format for its target date: "${targetDateValue}"`);
          continue;
        }

        const daysLeft = daysUntil(targetDate);
        
        // --- This is now safe to call .toISOString() ---
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