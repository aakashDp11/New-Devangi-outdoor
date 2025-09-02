import express from 'express';
import Space from '../models/space.model.js';
import upload from '../middleware/multer.middleware.js';
import { createSpace } from '../controllers/spaceController.js';
import excelUpload from '../middleware/excelUpload.middleware.js';
import Campaign from '../models/campaign.model.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import * as XLSX from 'xlsx';
import { uploadToS3 } from '../utils/s3uploader.js';

const router = express.Router();

const cpUpload = upload.fields([
  { name: 'mainPhoto', maxCount: 1 },
  { name: 'longShot', maxCount: 1 },
  { name: 'closeShot', maxCount: 1 },
  { name: 'otherPhotos', maxCount: 10 },
]);


router.post('/create', cpUpload, createSpace)

function parseDate(dateString) {
  const [day, month, year] = dateString.split('-').map(Number);
  return new Date(2000 + year, month - 1, day); // year is like 25 => 2025
}
router.get('/active-spaces', async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: 'Both from and to dates are required in YYYY-MM-DD format.' });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1); // include full day

    const campaigns = await Campaign.find({
      createdAt: {
        $gte: fromDate,
        $lt: toDate
      }
    });

    const bookedSpaceIds = new Set();
    campaigns.forEach(campaign => {
      (campaign.spaces || []).forEach(space => {
        if (space?.id) {
          bookedSpaceIds.add(String(space.id));
        }
      });
    });

    res.json({ bookedSpaceIds: [...bookedSpaceIds] });
  } catch (error) {
    console.error('Error fetching active campaign spaces:', error);
    res.status(500).json({ error: 'Server error while fetching active campaign spaces.' });
  }
});
router.get('/available', async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    const requestedStart = new Date(start);
    const requestedEnd = new Date(end);

    const allSpaces = await Space.find();

    const availableSpaces = allSpaces.filter(space => {
      if (!space.dates || space.dates.length < 2) return false;

      const [spaceStartStr, spaceEndStr] = space.dates;

      const [day1, month1, year1] = spaceStartStr.split('-').map(Number);
      const [day2, month2, year2] = spaceEndStr.split('-').map(Number);

      const spaceStart = new Date(2000 + year1, month1 - 1, day1);
      const spaceEnd = new Date(2000 + year2, month2 - 1, day2);

      return spaceStart <= requestedStart && spaceEnd >= requestedEnd;
    });

    res.json(availableSpaces);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available spaces', details: error.message });
  }
});

const ENUMS = {
  spaceType: ['Billboard', 'DOOH', 'Gantry', 'Pole Kiosk' , 'BQS', 'DigitalBQS', 'Miscellaneous' , 'Transit'],
  category: ['Retail', 'Transit'],
  mediaType: ['Static', 'Digital'],
  audience: ['Youth', 'Working Professionals'], // Add specific audience enums if applicable
  demographics: ['Urban', 'Rural'],
  illumination: ['Front Lit', 'Back Lit', 'Non Lit', 'Frontlit', 'Backlit', 'Nonlit'], 
  availability: ['Completely available', 'Partially available', 'Completely booked'],
  zone: ['East', 'West', 'North', 'South'],
  ownershipType: ['Owned', 'Leased', 'Traded'],
  tier: ['Tier 1', 'Tier 2'],
};

const MODEL_KEYS = [
  'spaceName', 'landlord', 'organization', 'peerMediaOwner', 'spaceType', 'traded', 'category',
  'mediaType', 'price', 'footfall', 'audience', 'demographics', 'description',
  'illumination', 'unit', 'occupiedUnits', 'width', 'height', 'additionalTags',
  'previousBrands', 'tags', 'address', 'city', 'state', 'latitude', 'longitude',
  'landmark', 'zone', 'ownershipType', 'tier', 'facing', 'faciaTowards', 'overlappingBooking',
  'availability', 'dates' , 'transitType', 'transitLine'
];

const normalizedMap = {};
MODEL_KEYS.forEach(key => {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  normalizedMap[normalized] = key;
});

const parseNumber = (val) => {
  const n = Number(val);
  return isNaN(n) ? undefined : n;
};

const enumFix = (val, validValues) => {
  if (!val) return undefined;
  const normalized = val.toString().toLowerCase().trim();
  return validValues.find(v => v.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized.replace(/[^a-z0-9]/g, ''));
};


router.post('/upload-excel', excelUpload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No Excel file uploaded.' });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const createdSpaces = [];
    const failedRows = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const formattedRow = {};

      for (const [header, value] of Object.entries(row)) {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
        const modelKey = normalizedMap[normalizedHeader];
        if (!modelKey) continue;

        if (['price', 'footfall', 'unit', 'occupiedUnits', 'width', 'height'].includes(modelKey)) {
          formattedRow[modelKey] = parseNumber(value);
        } else if (modelKey === 'dates') {
          formattedRow[modelKey] = typeof value === 'string'
            ? value.split(',').map(d => d.trim())
            : [];
        } else if (modelKey === 'traded' || modelKey === 'overlappingBooking') {
          formattedRow[modelKey] = value?.toString().toLowerCase() === 'true';
        } else if (ENUMS[modelKey]) {
          formattedRow[modelKey] = enumFix(value, ENUMS[modelKey]);
        } else {
          formattedRow[modelKey] = value?.toString().trim();
        }
      }

      if (!formattedRow.spaceName) {
        formattedRow.spaceName = `Unnamed Space ${i + 1}`;
      }

      try {
        const space = new Space(formattedRow);
        await space.save();
        createdSpaces.push(space);
      } catch (err) {
        console.warn(`Row ${i + 2} skipped:`, err.message);
        failedRows.push({ row: i + 2, error: err.message });
      }
    }

    return res.status(207).json({
      message: 'Upload complete with flexible column and enum handling',
      createdCount: createdSpaces.length,
      skippedCount: failedRows.length,
      failedRows
    });

  } catch (error) {
    console.error('Excel upload error:', error);
    return res.status(500).json({
      error: 'Something went wrong during Excel processing.',
      details: error.message
    });
  }
});

router.get('/selectcampaignSpaces', async (req, res) => {
  try {
    const spaces = await Space.find({}, {
      spaceName: 1,
      faciaTowards: 1,
      city: 1,
      category: 1,
      spaceType: 1,
      unit: 1,
      occupiedUnits: 1,
      ownershipType: 1,
      specification: 1,
      price: 1,
      traded: 1,
      overlappingBooking: 1,
      dates: 1,
      mainPhoto: 1,
      campaignDates: 1,
      width: 1,
      height: 1,
      transitType: 1,
      transitLine: 1,
    });

    res.json(spaces);
  } catch (error) {
    console.error('Error fetching optimized spaces:', error);
    res.status(500).json({ error: 'Failed to fetch space data' });
  }
});

router.patch('/:id/toggle-inventory', async (req, res) => {
try {
const space = await Space.findById(req.params.id);
if (!space) return res.status(404).json({ message: 'Space not found' });

space.isInventoryEnabled = !space.isInventoryEnabled;
await space.save();

res.json({ isInventoryEnabled: space.isInventoryEnabled });
} catch (err) {
console.error('Error toggling inventory:', err);
res.status(500).json({ message: 'Server error' });
}
});

router.patch('/:id/toggle-inventory', async (req, res) => {
    try {
        const space = await Space.findById(req.params.id);
        if (!space) return res.status(404).json({ message: 'Space not found' });

        space.isInventoryEnabled = !space.isInventoryEnabled;
        await space.save();

        res.json({ isInventoryEnabled: space.isInventoryEnabled });
    } catch (err) {
        console.error('Error toggling inventory:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- ADD THIS NEW ROUTE HANDLER BELOW ---
router.patch('/:id/toggle-maintenance', async (req, res) => {
    try {
        const space = await Space.findById(req.params.id);
        if (!space) {
            return res.status(404).json({ message: 'Space not found' });
        }

        // Toggle the maintenance status
        space.isUnderMaintenance = !space.isUnderMaintenance;

        // Save the change to the database
        const updatedSpace = await space.save();

        // Send back the updated space data
        res.status(200).json(updatedSpace);
    } catch (err) {
        console.error('Error toggling maintenance status:', err);
        res.status(500).json({ message: 'Server error while updating maintenance status' });
    }
});
// --- END OF NEW CODE ---

router.get('/', authenticate, async (req, res) => {
  try {
    const spaces = await Space.find();
    res.json(spaces);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch spaces', details: error.message });
  }
});

router.get('/listInventory', authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const search = req.query.search || '';
        const region = req.query.region || '';
        const requestedAvailabilityFilter = req.query.availability || '';
        const spaceType = req.query.spaceType || '';
        const ownershipType = req.query.ownershipType || '';
        const requestedStartDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const requestedEndDate = req.query.endDate ? new Date(req.query.endDate) : null;

        // Normalize requested dates to start/end of day for accurate comparison
        if (requestedStartDate) requestedStartDate.setHours(0, 0, 0, 0);
        if (requestedEndDate) requestedEndDate.setHours(23, 59, 59, 999);

        const projection = {
            spaceName: 1, address: 1, city: 1, state: 1, zone: 1, spaceType: 1, unit: 1,
            footfall: 1, audience: 1, demographics: 1, dates: 1, tags: 1, mainPhoto: 1,
            ownershipType: 1, createdAt: 1, campaignDates: 1, specification: 1,
            latitude: 1, longitude: 1, inventoryId: 1
        };

        const filters = {};

        if (search) {
            filters.$or = [
                { spaceName: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
                { state: { $regex: search, $options: 'i' } },
                { zone: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
            ];
        }
        if (region) {
            filters.$and = filters.$and || [];
            filters.$and.push({
                $or: [
                    { city: { $regex: region, $options: 'i' } },
                    { state: { $regex: region, $options: 'i' } },
                    { zone: { $regex: region, $options: 'i' } },
                ],
            });
        }
        if (spaceType) {
            filters.spaceType = spaceType;
        }
        if (ownershipType) {
            filters.ownershipType = ownershipType;
        }

        const rawData = await Space.find(filters, projection).sort({ createdAt: -1 }).lean();

        const filteredAndProcessed = rawData.map(item => {
            const totalUnits = item.unit || 0;

            // Determine the relevant date range for availability calculation
            const evaluationStartDate = requestedStartDate || new Date();
            const evaluationEndDate = requestedEndDate || new Date();

            evaluationStartDate.setHours(0, 0, 0, 0);
            evaluationEndDate.setHours(23, 59, 59, 999);

            let unitsBookedInPeriod = 0;
            let hasInternalOverlappingCampaigns = false; // Flag for 'Overlapping booking'

            const relevantCampaigns = (item.campaignDates || []).filter(c => {
                const campStart = new Date(c.startDate);
                const campEnd = new Date(c.endDate);
                campStart.setHours(0, 0, 0, 0);
                campEnd.setHours(23, 59, 59, 999);

                // Check if campaign overlaps with the evaluation period
                return evaluationStartDate <= campEnd && evaluationEndDate >= campStart;
            });

            // --- Logic for "OVERLAPPING BOOKING" ---
            // Check for internal overlaps within the relevant campaigns for the current space
            if (relevantCampaigns.length > 1) { // Need at least two campaigns to have a conflict
                for (let i = 0; i < relevantCampaigns.length; i++) {
                    for (let j = i + 1; j < relevantCampaigns.length; j++) {
                        const camp1Start = new Date(relevantCampaigns[i].startDate);
                        const camp1End = new Date(relevantCampaigns[i].endDate);
                        const camp2Start = new Date(relevantCampaigns[j].startDate);
                        const camp2End = new Date(relevantCampaigns[j].endDate);

                        camp1Start.setHours(0, 0, 0, 0); camp1End.setHours(23, 59, 59, 999);
                        camp2Start.setHours(0, 0, 0, 0); camp2End.setHours(23, 59, 59, 999);

                        // Check if campaign1 and campaign2 overlap with each other
                        if (camp1Start <= camp2End && camp2Start <= camp1End) {
                            let maxUnitsBookedOnAnyDay = 0;
                            // Determine the start and end of the overlap between camp1 and camp2
                            const currentDayInOverlap = new Date(Math.max(camp1Start.getTime(), camp2Start.getTime()));
                            const endOfCombinedOverlap = new Date(Math.min(camp1End.getTime(), camp2End.getTime()));

                            // Iterate day by day within the overlap of camp1 and camp2
                            while (currentDayInOverlap <= endOfCombinedOverlap) {
                                let unitsForDay = 0;
                                // Sum units from ALL relevant campaigns that are active on currentDayInOverlap
                                relevantCampaigns.forEach(rc => {
                                    const rcStart = new Date(rc.startDate);
                                    const rcEnd = new Date(rc.endDate);
                                    rcStart.setHours(0, 0, 0, 0); rcEnd.setHours(23, 59, 59, 999);

                                    if (currentDayInOverlap >= rcStart && currentDayInOverlap <= rcEnd) {
                                        unitsForDay += rc.units || 1;
                                    }
                                });
                                maxUnitsBookedOnAnyDay = Math.max(maxUnitsBookedOnAnyDay, unitsForDay);
                                currentDayInOverlap.setDate(currentDayInOverlap.getDate() + 1); // Move to next day
                            }

                            if (maxUnitsBookedOnAnyDay > totalUnits) {
                                hasInternalOverlappingCampaigns = true;
                                break; // Found an overlap conflict, no need to check further for this space
                            }
                        }
                    }
                    if (hasInternalOverlappingCampaigns) break;
                }
            }
            // --- END LOGIC FOR "OVERLAPPING BOOKING" ---

            // Calculate total units booked across the *entire evaluation period* (requested or current date)
            relevantCampaigns.forEach(c => {
                unitsBookedInPeriod += c.units || 1;
            });


            // Check if the space's general availability range (item.dates) covers the requested period
            // If requested dates are outside the space's overall availability, it's marked as unavailable.
            // This check should happen BEFORE availability determination based on units.
            let isOutsideGeneralAvailability = false;
            if (requestedStartDate && requestedEndDate) {
                if (item.dates?.length >= 2) {
                    const [d1, m1, y1] = item.dates[0].split('-');
                    const [d2, m2, y2] = item.dates[1].split('-');
                    const invStart = new Date(`${y1}-${m1}-${d1}`);
                    const invEnd = new Date(`${y2}-${m2}-${d2}`);
                    invStart.setHours(0, 0, 0, 0);
                    invEnd.setHours(23, 59, 59, 999);

                    if (!(requestedStartDate >= invStart && requestedEndDate <= invEnd)) {
                        isOutsideGeneralAvailability = true;
                    }
                } else {
                    // If no general availability dates are defined, assume it can be booked
                    // Or, if you want to be strict, mark as unavailable if dates are requested but no general range.
                    // For now, it won't trigger `isOutsideGeneralAvailability`.
                }
            }


            // --- Compute Availability based on YOUR DEFINED CONDITIONS ---
            let computedAvailabilityStatus;

            // 1. If no campaigns are there for selected dates - Completely available
            //    This means unitsBookedInPeriod is 0 AND there are no general availability issues.
            if (!isOutsideGeneralAvailability && relevantCampaigns.length === 0) {
                computedAvailabilityStatus = 'Completely available';
            }
            // 2. If campaigns are present for selected dates and dates conflict - Overlapping Booking
            else if (hasInternalOverlappingCampaigns) {
                computedAvailabilityStatus = 'Overlapping booking';
            }
            // 3. If campaigns are present for selected dates and 0 < Occupied Units < Total Units - Partially available
            //    This implies no conflicts, and not completely booked.
            else if (relevantCampaigns.length > 0 && unitsBookedInPeriod > 0 && unitsBookedInPeriod < totalUnits) {
                computedAvailabilityStatus = 'Partially available';
            }
            // 4. If campaigns are present for selected dates and dates do not conflict - Completely Booked
            //    This also catches the 'isOutsideGeneralAvailability' case as a form of being "booked" or unavailable.
            else { // This will catch isOutsideGeneralAvailability, or totalUnits <= unitsBookedInPeriod when no overlap
                computedAvailabilityStatus = 'Completely booked';
            }

            return { ...item, computedAvailabilityStatus, unitsBookedInPeriod };
        }).filter(item => {
            // Apply the availability filter based on the computed status for the period
            if (requestedAvailabilityFilter && item.computedAvailabilityStatus !== requestedAvailabilityFilter) {
                return false;
            }
            return true;
        });

        const totalFilteredCount = filteredAndProcessed.length;
        const paginated = filteredAndProcessed.slice(skip, skip + limit);

        const responseSpaces = paginated.map(item => ({
            ...item,
            availability: item.computedAvailabilityStatus,
            computedAvailabilityStatus: undefined, // Clear internal fields
            unitsBookedInPeriod: undefined
        }));

        res.json({ spaces: responseSpaces, totalCount: totalFilteredCount });

    } catch (error) {
        console.error("Error in listInventory:", error);
        res.status(500).json({ error: 'Failed to fetch spaces', details: error.message });
    }
});
router.get('/map-locations', authenticate, async (req, res) => {
    try {
        const { search, region, availability, spaceType, ownershipType, startDate, endDate } = req.query;

        const matchStage = {
            latitude: { $exists: true, $ne: null, $ne: '' },
            longitude: { $exists: true, $ne: null, $ne: '' }
        };

        if (search) {
            matchStage.$or = [
                { spaceName: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
            ];
        }

        if (region) {
            matchStage.$or = (matchStage.$or || []).concat([
              { city: { $regex: region, $options: 'i' } },
              { state: { $regex: region, $options: 'i' } },
              { zone: { $regex: region, $options: 'i' } },
            ]);
        }

        if (spaceType) matchStage.spaceType = spaceType;
        if (ownershipType) matchStage.ownershipType = ownershipType;

        // ===== UNIFIED AVAILABILITY LOGIC (Same logic as /listInventory) =====
        const checkStartDate = startDate ? new Date(startDate) : new Date();
        const checkEndDate = endDate ? new Date(endDate) : new Date();

        if (!startDate) checkStartDate.setHours(0, 0, 0, 0);
        if (!endDate) checkEndDate.setHours(23, 59, 59, 999);

        let pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: 'campaigns',
                    let: { spaceId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $in: ['$$spaceId', '$spaces.id'] },
                                        { $lte: [ { $toDate: '$startDate' }, checkEndDate ] },
                                        { $gte: [ { $toDate: '$endDate' }, checkStartDate ] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'conflictingCampaigns'
                }
            },
            { $addFields: { unitsBookedInPeriod: { $size: '$conflictingCampaigns' } } },
            {
                $addFields: {
                    availability: {
                        $let: {
                            vars: {
                                total: { $ifNull: ['$unit', 1] },
                                booked: '$unitsBookedInPeriod'
                            },
                            in: {
                                $switch: {
                                    branches: [
                                        { case: { $eq: ['$$booked', 0] }, then: 'Completely available' },
                                        { case: { $gte: ['$$booked', '$$total'] }, then: 'Completely booked' },
                                        {
                                            case: { $gt: ['$$booked', 0] },
                                            then: startDate ? 'Overlapping booking' : 'Partially available'
                                        }
                                    ],
                                    default: 'Completely available'
                                }
                            }
                        }
                    }
                }
            }
        ];
        
        if (availability) {
            pipeline.push({ $match: { availability: availability } });
        }

        pipeline.push({
            $project: {
                spaceName: 1,
                latitude: 1,
                longitude: 1,
                availability: 1
            }
        });

        const mapSpaces = await Space.aggregate(pipeline);
        res.json(mapSpaces);

    } catch (error) {
        console.error('Error fetching map locations:', error);
        res.status(500).json({ error: 'Failed to fetch map data' });
    }
});
// ===================================================================
// ============= END: UNIFIED /map-locations ROUTE ===================
// ======================================================================================================================


router.get('/dashboard-stats', async (req, res) => {
  try {
    const spaces = await Space.find({}, {
      spaceType: 1, unit: 1, occupiedUnits: 1, overlappingBooking: 1,
      ownershipType: 1, traded: 1
    });

    let totalUnits = 0, bookedUnits = 0, available = 0, booked = 0, overlapping = 0;
    let doohCompletelyAvailable = 0, doohPartiallyAvailable = 0, doohCompletelyBooked = 0;
    let tradedCount = 0, ownedCount = 0, leasedCount = 0;

    spaces.forEach(space => {
      const units = space.unit || 0;
      const occupied = space.occupiedUnits || 0;

      if (space.spaceType === 'DOOH') {
        totalUnits += units;
        bookedUnits += occupied;
        if (occupied === 0) doohCompletelyAvailable++;
        else if (occupied < units) doohPartiallyAvailable++;
        else if (occupied === units) doohCompletelyBooked++;
      } else {
        if (occupied === 0) available++;
        else if (space.overlappingBooking) overlapping++;
        else booked++;
      }

      if (space.ownershipType === 'Traded') tradedCount++;
      else if (space.ownershipType === 'Owned') ownedCount++;
      else if (space.ownershipType === 'Leased') leasedCount++;
    });

    const dashboardStats = {
      doohUtilization: { totalUnits, bookedUnits, freeUnits: totalUnits - bookedUnits },
      staticAvailability: { available, booked, overlapping },
      doohAvailabilityStatus: {
        completelyAvailable: doohCompletelyAvailable,
        partiallyAvailable: doohPartiallyAvailable,
        completelyBooked: doohCompletelyBooked
      },
      ownershipDistribution: { traded: tradedCount, owned: ownedCount, leased: leasedCount }
    };
    res.json(dashboardStats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to compute dashboard stats', details: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) return res.status(404).json({ error: 'Space not found' });
    res.json(space);
  } catch (error) {
    console.error('Error fetching space by ID:', error);
    res.status(500).json({ error: 'Failed to fetch space', details: error.message });
  }
});

router.put('/:id/add-tag', async (req, res) => {
  const { tag } = req.body;
  try {
    const space = await Space.findById(req.params.id);
    if (!space) return res.status(404).json({ message: 'Not found' });

    space.tags = space.tags ? `${space.tags}, ${tag}` : tag;
    await space.save();
    res.status(200).json(space);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/remove-tag', async (req, res) => {
  const { tag } = req.body;
  try {
    const space = await Space.findById(req.params.id);
    if (!space) return res.status(404).json({ message: 'Not found' });

    const tagList = (space.tags || '').split(',').map(t => t.trim()).filter(t => t && t !== tag);
    space.tags = tagList.join(', ');
    await space.save();
    res.status(200).json(space);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


router.put('/:id', upload.fields([
    { name: 'mainPhoto', maxCount: 1 },
    { name: 'longShot', maxCount: 1 },
    { name: 'closeShot', maxCount: 1 },
    { name: 'otherPhotos', maxCount: 10 }
]), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {};

        const allowedFields = [
            'spaceName', 'landlord', 'organization', 'peerMediaOwner', 
            'ownershipType', 'spaceType', 'category', 'specification', 
            'mediaType', 'illumination', 'price', 'buyingPrice' , 'sellingPrice' , 'footfall', 'audience', 
            'demographics', 'width', 'height', 'address', 'city', 'state', 
            'latitude', 'longitude', 'zone', 'tier', 'facing', 'faciaTowards',
            'tags', 'previousBrands', 'additionalTags', 'description', 
            'unit', 'dates', 'occupiedUnits' , 'transitType', 'transitLine'
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                const value = req.body[field];

                if (['unit', 'occupiedUnits', 'price', 'buyingPrice', 'sellingPrice', 'footfall', 'width', 'height'].includes(field)) {
                    const num = parseFloat(value);
                    if (!isNaN(num)) {
                       updateData[field] = num;
                    }
                } 
                else if (field === 'audience' || field === 'dates') {
                    updateData[field] = Array.isArray(value) ? value : value.split(',').map(item => item.trim());
                } 
                else {
                    updateData[field] = value;
                }
            }
        }
        
        const uploadAndReturnUrl = async (file) => {
            if (!file) return null;
            return await uploadToS3(file.path, file.filename);
        };

        if (req.files['mainPhoto']) {
            updateData.mainPhoto = await uploadAndReturnUrl(req.files['mainPhoto'][0]);
        }
        if (req.files['longShot']) {
            updateData.longShot = await uploadAndReturnUrl(req.files['longShot'][0]);
        }
        if (req.files['closeShot']) {
            updateData.closeShot = await uploadAndReturnUrl(req.files['closeShot'][0]);
        }
        if (req.files['otherPhotos']?.length > 0) {
            const uploads = req.files['otherPhotos'].map(file => uploadAndReturnUrl(file));
            const newPhotoUrls = await Promise.all(uploads);
            updateData.$push = { otherPhotos: { $each: newPhotoUrls } };
        }

        const updatedSpace = await Space.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedSpace) {
            return res.status(404).json({ error: 'Space not found' });
        }

        res.json(updatedSpace);

    } catch (error) {
        console.error('Error updating space:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});


router.put('/:id/printingStatus', async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const { confirmed, printingDate, assignedPerson, assignedAgency, printingMaterial, note } = req.body;

    if (confirmed !== undefined) space.printingStatus.confirmed = confirmed;
    if (printingDate !== undefined) space.printingStatus.printingDate = printingDate;
    if (assignedPerson !== undefined) space.printingStatus.assignedPerson = assignedPerson;
    if (assignedAgency !== undefined) space.printingStatus.assignedAgency = assignedAgency;
    if (printingMaterial !== undefined) space.printingStatus.printingMaterial = printingMaterial;
    if (note !== undefined) space.printingStatus.note = note;

    await space.save();
    res.json(space);
  } catch (error) {
    console.error('Error updating printing status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/digitalStatus', async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const { confirmed, isLive, goLiveDate, assignedPerson, assignedAgency, note } = req.body;

    if (!space.digitalStatus) space.digitalStatus = {};

    if (confirmed !== undefined) space.digitalStatus.confirmed = confirmed;
    if (isLive !== undefined) space.digitalStatus.isLive = isLive;
    if (goLiveDate !== undefined) space.digitalStatus.goLiveDate = goLiveDate;
    if (assignedPerson !== undefined) space.digitalStatus.assignedPerson = assignedPerson;
    if (assignedAgency !== undefined) space.digitalStatus.assignedAgency = assignedAgency;
    if (note !== undefined) space.digitalStatus.note = note;

    await space.save();
    res.json(space);
  } catch (error) {
    console.error('Error updating digital status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/mountingStatus', async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const { confirmed, receivedDate, assignedPerson, assignedAgency, note } = req.body;

    if (confirmed !== undefined) space.mountingStatus.confirmed = confirmed;
    if (receivedDate !== undefined) space.mountingStatus.mountingDate = receivedDate;
    if (assignedPerson !== undefined) space.mountingStatus.assignedPerson = assignedPerson;
    if (assignedAgency !== undefined) space.mountingStatus.assignedAgency = assignedAgency;
    if (note !== undefined) space.mountingStatus.note = note;

    await space.save();
    res.json(space);
  } catch (error) {
    console.error('Error updating mounting status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== THIS IS THE CORRECTED CODE FOR Space.routes.js =====

router.delete('/:id', async (req, res) => {
  try {
    const spaceId = req.params.id;

    // First, check if the space actually exists before trying to delete
    const space = await Space.findById(spaceId);
    if (!space) {
      return res.status(404).json({ error: 'Space not found' });
    }

    // --- THIS IS THE CRUCIAL NEW STEP ---
    // Find all campaigns that reference this spaceId and pull the reference from their 'spaces' array.
    await Campaign.updateMany(
      { 'spaces.id': spaceId }, // Find campaigns where a space object has this ID
      { $pull: { spaces: { id: spaceId } } } // Remove that object from the array
    );
    // --- END OF NEW STEP ---

    // Now, it's safe to delete the actual space document
    await Space.findByIdAndDelete(spaceId);

    res.json({ message: 'Space deleted and all campaign references were cleaned successfully' });

  } catch (error) {
    console.error('Error deleting space:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

export default router;