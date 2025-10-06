// // cron/availabilityUpdater.js

// import cron from 'node-cron';
// import Campaign from '../models/campaign.model.js';
// import Space from '../models/space.model.js';

// /**
//  * Frees up occupied units for campaigns that ended yesterday.
//  * This runs first to release inventory back into the available pool.
//  */
// const freeUpUnitsFromEndedCampaigns = async () => {
//     try {
//         const yesterday = new Date();
//         yesterday.setDate(yesterday.getDate() - 1);
//         const yesterdayString = yesterday.toISOString().split('T')[0];

//         // Find campaigns that officially ended yesterday
//         const endedCampaigns = await Campaign.find({ endDate: yesterdayString });

//         if (endedCampaigns.length === 0) {
//             console.log(`[INFO] No campaigns ended on ${yesterdayString}. No units to free up.`);
//             return;
//         }

//         console.log(`[PROCESS] Found ${endedCampaigns.length} campaigns that ended on ${yesterdayString}.`);

//         const spaceUnitUpdates = {};
//         endedCampaigns.forEach(campaign => {
//             (campaign.spaces || []).forEach(space => {
//                 if (space && space.id) {
//                     const spaceId = space.id.toString();
//                     // Each space in a campaign is assumed to be 1 unit
//                     spaceUnitUpdates[spaceId] = (spaceUnitUpdates[spaceId] || 0) + 1;
//                 }
//             });
//         });

//         const bulkOps = Object.keys(spaceUnitUpdates).map(spaceId => ({
//             updateOne: {
//                 filter: { _id: spaceId },
//                 // DECREMENT the occupiedUnits count
//                 update: { $inc: { occupiedUnits: -spaceUnitUpdates[spaceId] } }
//             }
//         }));

//         if (bulkOps.length > 0) {
//             const result = await Space.bulkWrite(bulkOps);
//             console.log(` -> [SUCCESS] 🎉 Successfully freed up units for ${result.modifiedCount} spaces.`);
//         } else {
//             console.log('[INFO] No space units needed to be updated from ended campaigns.');
//         }

//     } catch (error) {
//         console.error('❌ Error freeing up units from ended campaigns:', error);
//     }
// };

// /**
//  * Occupies units for campaigns that are scheduled to start today.
//  * This runs second to reserve inventory for new campaigns.
//  */
// const occupyUnitsForStartingCampaigns = async () => {
//     try {
//         const today = new Date();
//         const todayString = today.toISOString().split('T')[0];

//         // Find campaigns that officially start today
//         const startingCampaigns = await Campaign.find({ startDate: todayString });

//         if (startingCampaigns.length === 0) {
//             console.log(`[INFO] No campaigns are starting on ${todayString}. No units to occupy.`);
//             return;
//         }

//         console.log(`[PROCESS] Found ${startingCampaigns.length} campaigns starting on ${todayString}.`);

//         const spaceUnitUpdates = {};
//         startingCampaigns.forEach(campaign => {
//             (campaign.spaces || []).forEach(space => {
//                 if (space && space.id) {
//                     const spaceId = space.id.toString();
//                     spaceUnitUpdates[spaceId] = (spaceUnitUpdates[spaceId] || 0) + 1;
//                 }
//             });
//         });

//         const bulkOps = Object.keys(spaceUnitUpdates).map(spaceId => ({
//             updateOne: {
//                 filter: { _id: spaceId },
//                 // INCREMENT the occupiedUnits count
//                 update: { $inc: { occupiedUnits: spaceUnitUpdates[spaceId] } }
//             }
//         }));

//         if (bulkOps.length > 0) {
//             const result = await Space.bulkWrite(bulkOps);
//             console.log(` -> [SUCCESS] 🎉 Successfully occupied units for ${result.modifiedCount} spaces.`);
//         } else {
//             console.log('[INFO] No space units needed to be updated for starting campaigns.');
//         }

//     } catch (error)
//     {
//         console.error('❌ Error occupying units for starting campaigns:', error);
//     }
// };


// export const startAvailabilityUpdaterJob = () => {
//     // Schedule the combined job to run once per day, a few minutes after midnight.
//     // Cron format: 'minute hour day-of-month month day-of-week'
//     // '5 0 * * *' means "at 00:05 (5 minutes past midnight) every day".
//     cron.schedule('5 0 * * *', async () => { 
//         console.log('\n--- ✅ Availability Updater Job Started ---');
        
//         // Run the functions in sequence to ensure a clear process
//         await freeUpUnitsFromEndedCampaigns();
//         await occupyUnitsForStartingCampaigns();
        
//         console.log('--- 🏁 Availability Updater Job Finished ---\n');
//     }, {
//         timezone: "UTC" 
//     });

//     console.log('✔ Cron job for daily space availability has been scheduled.');
// };


import cron from 'node-cron';
import mongoose from 'mongoose';
import Campaign from '../models/campaign.model.js';
import Space from '../models/space.model.js';

const IST_OFFSET_MIN = 330; // +05:30
const todayIST_YMD = () => {
  const now = new Date();
  const ist = new Date(now.getTime() + (IST_OFFSET_MIN - now.getTimezoneOffset()) * 60000);
  ist.setHours(0, 0, 0, 0);
  return ist.toISOString().slice(0, 10); // "YYYY-MM-DD"
};
const parseDMY = (s) => { const [dd, mm, yyyy] = s.split('-').map(Number); return new Date(yyyy, mm - 1, dd); };
const inRange = (d, s, e) => d >= s && d <= e;

async function recomputeAvailabilityForToday() {
  const todayStr = todayIST_YMD();
  const today = new Date(todayStr); // midnight local

  // 1) Build a map: spaceId -> activeCampaignCountToday
  const activeCounts = new Map();

  const pipeline = [
    { $match: { startDate: { $lte: todayStr }, endDate: { $gte: todayStr } } },
    { $unwind: '$spaces' },
    // if your field is different (e.g., spaces is array of ObjectIds), adjust path below
    { $group: { _id: '$spaces.id', count: { $sum: 1 } } },
  ];

  const agg = await Campaign.aggregate(pipeline);
  for (const row of agg) {
    if (!row._id) continue;
    activeCounts.set(String(row._id), row.count);
  }

  // 2) Stream spaces and compute updates
  const cursor = Space.find({}, { _id: 1, dates: 1 }).cursor();
  const ops = [];
  let processed = 0;

  for await (const sp of cursor) {
    processed++;

    const life = Array.isArray(sp.dates) && sp.dates.length === 2
      ? { start: parseDMY(sp.dates[0]), end: parseDMY(sp.dates[1]) }
      : null;

    let count = 0;
    if (life && inRange(today, life.start, life.end)) {
      count = activeCounts.get(String(sp._id)) || 0;
    } else {
      count = 0; // outside lifespan ⇒ treat as free
    }

    let availability = 'completely available';
    let overlappingBooking = false;

    if (count === 1) availability = 'booked';
    else if (count > 1) { availability = 'overlapping booking'; overlappingBooking = true; }

    ops.push({
      updateOne: {
        filter: { _id: sp._id },
        update: {
          $set: {
            occupiedUnits: count,
            availability,
            overlappingBooking,
          }
        }
      }
    });

    if (ops.length >= 1000) {
      await Space.bulkWrite(ops, { ordered: false });
      ops.length = 0;
    }
  }

  if (ops.length) await Space.bulkWrite(ops, { ordered: false });

  console.log(`[availability] ${todayStr} processed=${processed} spaces; activeSpaces=${activeCounts.size}`);
}

export const startAvailabilityUpdaterJob = () => {
  // Run daily at 00:05 IST
  cron.schedule('5 0 * * *', async () => {
    console.log('\n--- ✅ Availability Updater (IST) START ---');
    try {
      await recomputeAvailabilityForToday();
      console.log('--- 🏁 Availability Updater DONE ---\n');
    } catch (e) {
      console.error('❌ Availability Updater failed:', e);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('✔ Cron job for daily availability scheduled at 00:05 IST.');
};
