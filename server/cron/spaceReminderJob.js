import cron from 'node-cron';
import Space from '../models/space.model.js';
import Notification from '../models/notification.model.js';

function daysUntil(dateStr) {
  const today = new Date();
  const target = new Date(dateStr);
  const diffTime = target - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export const startSpaceReminderJob = () => {
  cron.schedule('*/30 * * * * *', async ()  => { // every day at 1:00 AM
    const reminderDays = [60, 30, 15, 10, 7, 5, 3, 1];

    try {
      const spaces = await Space.find();

      for (const space of spaces) {
        if (!Array.isArray(space.dates) || space.dates.length < 2) continue;

        const targetDate = space.dates[1];
        if (!targetDate) continue;

        const daysLeft = daysUntil(targetDate);
        if (!reminderDays.includes(daysLeft)) continue;

        // Prevent duplicate notifications
        const existing = await Notification.findOne({
          spaceId: space._id,
          dueInDays: daysLeft,
          type: 'space_expiry_reminder'
        });

        if (existing) continue;

        const notification = new Notification({
          type: 'space_expiry_reminder',
          message: `Space "${space.spaceName}" is scheduled for an action in ${daysLeft} day(s).`,
          spaceId: space._id,
          spaceName: space.spaceName,
          dueInDays: daysLeft,
          read: false
        });

        await notification.save();
        console.log(`Notification: ${space.spaceName} – ${daysLeft} days left until ${targetDate}`);
      }
    } catch (error) {
      console.error('Error in space reminder job:', error);
    }
  });
};