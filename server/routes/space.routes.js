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
  spaceType: ['Billboard', 'DOOH', 'Gantry', 'Pole Kiosk' , 'BQS', 'Miscellaneous'],
  category: ['Retail', 'Transit'],
  mediaType: ['Static', 'Digital'],
  audience: ['Youth', 'Working Professionals'], // Add specific audience enums if applicable
  demographics: ['Urban', 'Rural'],
  // FIX: Renamed from 'illuminations' to 'illumination'
  illumination: ['Front Lit', 'Back Lit', 'Non Lit', 'Frontlit', 'Backlit', 'Nonlit'], 
  availability: ['Completely available', 'Partially available', 'Completely booked'],
  zone: ['East', 'West', 'North', 'South'],
  ownershipType: ['Owned', 'Leased', 'Traded'], // Renamed from 'ownership' to 'ownershipType'
  tier: ['Tier 1', 'Tier 2'],
  // FIX: Added 'facing' if it's an enum, otherwise it's just a string
  // If facing has specific allowed values like 'North', 'South' etc., add them here.
  // For now, assuming it's a general string based on model.
};

// FIX: Updated MODEL_KEYS to match the schema (organization, illumination, facing)
const MODEL_KEYS = [
  'spaceName', 'landlord', 'organization', 'peerMediaOwner', 'spaceType', 'traded', 'category',
  'mediaType', 'price', 'footfall', 'audience', 'demographics', 'description',
  'illumination', 'unit', 'occupiedUnits', 'width', 'height', 'additionalTags',
  'previousBrands', 'tags', 'address', 'city', 'state', 'latitude', 'longitude',
  'landmark', 'zone', 'ownershipType', 'tier', 'facing', 'faciaTowards', 'overlappingBooking',
  'availability', 'dates'
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
        } else if (ENUMS[modelKey]) { // This will now correctly check for 'illumination'
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
    const availability = req.query.availability || '';
    const spaceType = req.query.spaceType || '';
    const ownershipType = req.query.ownershipType || '';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const projection = {
      spaceName: 1, address: 1, city: 1, state: 1, zone: 1, spaceType: 1, unit: 1,
      occupiedUnits: 1, availability: 1, footfall: 1, audience: 1, demographics: 1,
      dates: 1, tags: 1, mainPhoto: 1, overlappingBooking: 1, ownershipType: 1,
      createdAt: 1, campaignDates: 1, specification: 1
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

    if (spaceType) filters.spaceType = spaceType;
    if (ownershipType) filters.ownershipType = ownershipType;

    const rawData = await Space.find(filters, projection).sort({ createdAt: -1 });
    const totalFiltered = rawData.length;

    const filtered = rawData.filter((item) => {
      const totalUnits = item.unit || 0;
      const occupied = item.occupiedUnits || 0;
      let computedAvailability = 'Completely available';
      if (item.overlappingBooking) computedAvailability = 'Overlapping booking';
      else if (totalUnits === occupied && occupied !== 0) computedAvailability = 'Completely booked';
      else if (occupied > 0 && occupied < totalUnits) computedAvailability = 'Partially available';

      if (availability && computedAvailability !== availability) return false;

      if (startDate && endDate && item.dates?.length >= 2) {
        const [d1, m1, y1] = item.dates[0].split('-');
        const [d2, m2, y2] = item.dates[1].split('-');
        const invStart = new Date(`${y1}-${m1}-${d1}`);
        const invEnd = new Date(`${y2}-${m2}-${d2}`);
        const selectedStart = new Date(startDate);
        const selectedEnd = new Date(endDate);

        const inRange = selectedStart >= invStart && selectedEnd <= invEnd;

        const overlapWithCampaign = (item.campaignDates || []).some(c => {
          const campStart = new Date(c.startDate);
          const campEnd = new Date(c.endDate);
          return selectedStart <= campEnd && selectedEnd >= campStart;
        });

        if (!inRange || overlapWithCampaign) return false;
      }

      return true;
    });

    const paginated = filtered.slice(skip, skip + limit);
    res.json({ spaces: paginated, totalCount: filtered.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch spaces', details: error.message });
  }
});

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


// --- FIX: This is the complete, corrected PUT route handler ---
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
            'mediaType', 'illumination', 'price', 'footfall', 'audience', 
            'demographics', 'width', 'height', 'address', 'city', 'state', 
            'latitude', 'longitude', 'zone', 'tier', 'facing', 'faciaTowards',
            'tags', 'previousBrands', 'additionalTags', 'description', 
            'unit', 'dates', 'occupiedUnits'
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                // Special handling for dates if they come as a comma-separated string
                if (field === 'dates' && typeof req.body[field] === 'string') {
                    updateData[field] = req.body[field].split(',').map(d => d.trim());
                } else if (field === 'unit' || field === 'occupiedUnits' || field === 'price' || field === 'footfall' || field === 'width' || field === 'height') {
                    // Convert numbers
                    updateData[field] = parseFloat(req.body[field]);
                    if (isNaN(updateData[field])) {
                        delete updateData[field]; // Remove if not a valid number
                    }
                } else {
                    updateData[field] = req.body[field];
                }
            }
        }
        
        const uploadAndReturnUrl = async (file) => {
            if (!file) return null;
            const localPath = file.path;
            const s3Key = `spaces/${id}/${file.filename}`; // Or a more structured path if needed
            return await uploadToS3(localPath, s3Key);
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
            const existingSpace = await Space.findById(id).select('otherPhotos');
            // Append new photos to existing ones
            updateData.otherPhotos = [...(existingSpace.otherPhotos || []), ...newPhotoUrls];
        }

        const updatedSpace = await Space.findByIdAndUpdate(
            id,
            { $set: updateData },
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
// --- End of corrected PUT route handler ---


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

router.delete('/:id', async (req, res) => {
  try {
    const space = await Space.findByIdAndDelete(req.params.id);
    if (!space) return res.status(404).json({ error: 'Space not found' });
    res.json({ message: 'Space deleted successfully' });
  } catch (error) {
    console.error('Error deleting space:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;