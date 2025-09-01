// jobs.js
import { startCampaignReminderJob } from './cron/campaignReminderJob.js';
import { startSpaceReminderJob } from './cron/spaceReminderJob.js';
import { startAvailabilityUpdaterJob } from './cron/availabilityUpdater.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let isDbConnected = false;
// async function connectDb() {
//   if (!isDbConnected) {
//     await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     isDbConnected = true;
//   }
// }

// export const campaignReminderHandler = async () => {
//   await connectDb();
//   await startCampaignReminderJob();
//   return { statusCode: 200, body: 'Campaign Reminder executed' };
// };

// export const spaceReminderHandler = async () => {
//   await connectDb();
//   await startSpaceReminderJob();
//   return { statusCode: 200, body: 'Space Reminder executed' };
// };

// export const availabilityUpdaterHandler = async () => {
//   await connectDb();
//   await startAvailabilityUpdaterJob();
//   return { statusCode: 200, body: 'Availability Updater executed' };
// };
export const cronHandler = async (event) => {
    try {
      await connectDb();
  
      switch (event.jobType) {
        case "campaignReminder":
          console.log("Running Campaign Reminder Job");
          await startCampaignReminderJob();
          break;
  
        case "spaceReminder":
          console.log("Running Space Reminder Job");
          await startSpaceReminderJob();
          break;
  
        case "availabilityUpdater":
          console.log("Running Availability Updater Job");
          await startAvailabilityUpdaterJob();
          break;
  
        default:
          console.log("⚠️ Unknown jobType:", event.jobType);
      }
  
      return { statusCode: 200, body: "Job executed" };
    } catch (err) {
      console.error("❌ Job failed:", err);
      return { statusCode: 500, body: "Job failed" };
    }
  };