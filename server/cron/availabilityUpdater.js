// cron/availabilityUpdater.js

import cron from 'node-cron';
import Campaign from '../models/campaign.model.js';
import Space from '../models/space.model.js';

/**
 * Frees up occupied units for campaigns that ended yesterday.
 * This runs first to release inventory back into the available pool.
 */
const freeUpUnitsFromEndedCampaigns = async () => {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];

        // Find campaigns that officially ended yesterday
        const endedCampaigns = await Campaign.find({ endDate: yesterdayString });

        if (endedCampaigns.length === 0) {
            console.log(`[INFO] No campaigns ended on ${yesterdayString}. No units to free up.`);
            return;
        }

        console.log(`[PROCESS] Found ${endedCampaigns.length} campaigns that ended on ${yesterdayString}.`);

        const spaceUnitUpdates = {};
        endedCampaigns.forEach(campaign => {
            (campaign.spaces || []).forEach(space => {
                if (space && space.id) {
                    const spaceId = space.id.toString();
                    // Each space in a campaign is assumed to be 1 unit
                    spaceUnitUpdates[spaceId] = (spaceUnitUpdates[spaceId] || 0) + 1;
                }
            });
        });

        const bulkOps = Object.keys(spaceUnitUpdates).map(spaceId => ({
            updateOne: {
                filter: { _id: spaceId },
                // DECREMENT the occupiedUnits count
                update: { $inc: { occupiedUnits: -spaceUnitUpdates[spaceId] } }
            }
        }));

        if (bulkOps.length > 0) {
            const result = await Space.bulkWrite(bulkOps);
            console.log(` -> [SUCCESS] 🎉 Successfully freed up units for ${result.modifiedCount} spaces.`);
        } else {
            console.log('[INFO] No space units needed to be updated from ended campaigns.');
        }

    } catch (error) {
        console.error('❌ Error freeing up units from ended campaigns:', error);
    }
};

/**
 * Occupies units for campaigns that are scheduled to start today.
 * This runs second to reserve inventory for new campaigns.
 */
const occupyUnitsForStartingCampaigns = async () => {
    try {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];

        // Find campaigns that officially start today
        const startingCampaigns = await Campaign.find({ startDate: todayString });

        if (startingCampaigns.length === 0) {
            console.log(`[INFO] No campaigns are starting on ${todayString}. No units to occupy.`);
            return;
        }

        console.log(`[PROCESS] Found ${startingCampaigns.length} campaigns starting on ${todayString}.`);

        const spaceUnitUpdates = {};
        startingCampaigns.forEach(campaign => {
            (campaign.spaces || []).forEach(space => {
                if (space && space.id) {
                    const spaceId = space.id.toString();
                    spaceUnitUpdates[spaceId] = (spaceUnitUpdates[spaceId] || 0) + 1;
                }
            });
        });

        const bulkOps = Object.keys(spaceUnitUpdates).map(spaceId => ({
            updateOne: {
                filter: { _id: spaceId },
                // INCREMENT the occupiedUnits count
                update: { $inc: { occupiedUnits: spaceUnitUpdates[spaceId] } }
            }
        }));

        if (bulkOps.length > 0) {
            const result = await Space.bulkWrite(bulkOps);
            console.log(` -> [SUCCESS] 🎉 Successfully occupied units for ${result.modifiedCount} spaces.`);
        } else {
            console.log('[INFO] No space units needed to be updated for starting campaigns.');
        }

    } catch (error)
    {
        console.error('❌ Error occupying units for starting campaigns:', error);
    }
};


export const startAvailabilityUpdaterJob = () => {
    // Schedule the combined job to run once per day, a few minutes after midnight.
    // Cron format: 'minute hour day-of-month month day-of-week'
    // '5 0 * * *' means "at 00:05 (5 minutes past midnight) every day".
    cron.schedule('5 0 * * *', async () => { 
        console.log('\n--- ✅ Availability Updater Job Started ---');
        
        // Run the functions in sequence to ensure a clear process
        await freeUpUnitsFromEndedCampaigns();
        await occupyUnitsForStartingCampaigns();
        
        console.log('--- 🏁 Availability Updater Job Finished ---\n');
    }, {
        timezone: "UTC" 
    });

    console.log('✔ Cron job for daily space availability has been scheduled.');
};