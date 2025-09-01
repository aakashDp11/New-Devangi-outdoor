// import serverlessExpress from '@vendia/serverless-express';
// import app, { initializeDatabase } from './app.js';


// let server;

// const bootstrap = async () => {
//   await initializeDatabase();
//   server = serverlessExpress({ app });
// };

// await bootstrap();

// export const handler = async (event, context) => {
//    console.log("Incoming path:", event.rawPath || event.path);
//   return server(event, context);
// };

import serverlessExpress from '@vendia/serverless-express';
import app, { initializeDatabase } from './app.js';
import { startCampaignReminderJob } from './cron/campaignReminderJob.js';
import { startSpaceReminderJob } from './cron/spaceReminderJob.js';
import { startAvailabilityUpdaterJob } from './cron/availabilityUpdater.js';

let server;
let ready = false;

async function bootstrap() {
  if (ready) return;
  await initializeDatabase();
  server = serverlessExpress({ app });
  ready = true;
}

export const handler = async (event, context) => {
  await bootstrap();

  // Detect EventBridge/Scheduler invocations
  const isCron =
    event?.jobType ||                       // our Scheduler payload
    event?.source === 'aws.events' ||
    event?.['detail-type'] === 'Scheduled Event';

  if (isCron) {
    console.log('EventBridge payload:', event);
    const jobType = event.jobType;

    switch (jobType) {
      case 'campaignReminder':
        console.log('🚀 Running Campaign Reminder Job');
        await startCampaignReminderJob();
        break;
      case 'spaceReminder':
        console.log('🚀 Running Space Reminder Job');
        await startSpaceReminderJob();
        break;
      case 'availabilityUpdater':
        console.log('🚀 Running Availability Updater Job');
        await startAvailabilityUpdaterJob();
        break;
      default:
        console.warn('⚠️ Unknown or missing jobType:', jobType);
        break;
    }
    return { statusCode: 200, body: 'Job executed' };
  }

  // Otherwise treat it as an API request to Express
  console.log('HTTP request to Express:', event.rawPath || event.path);
  return server(event, context);
};