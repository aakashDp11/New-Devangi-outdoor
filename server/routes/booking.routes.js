import express from 'express';
import Booking from '../models/booking.model.js';
import Space from '../models/space.model.js';
import upload from '../middleware/multer.middleware.js';
import pipelineModel from '../models/pipeline.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';
import Campaign from '../models/campaign.model.js';
import { uploadToS3 } from '../utils/s3uploader.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
const router = express.Router();
export const updateCampaign = async (req, res) => {
const { id } = req.params;
const { campaignName, description, startDate, endDate, industry, isFOC } = req.body;
try {
const updated = await Campaign.findByIdAndUpdate(
id,
{
...(campaignName && { campaignName }),
...(description && { description }),
...(startDate && { startDate }),
...(endDate && { endDate }),
...(industry && { industry }),
...(isFOC !== undefined && { isFOC }),
},
{ new: true }
);

if (!updated) {
  return res.status(404).json({ message: "Campaign not found" });
}

res.status(200).json(updated);
} catch (err) {
console.error("Error updating campaign:", err);
res.status(500).json({ message: "Internal server error" });
}
};
export const getPaymentReport = async (req, res) => {
try {
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;

const {
clientName,
bookingName,
startDate,
endDate,
paymentDate,
sortKey = 'paymentDate',      // NEW
sortDirection = 'desc'    // NEW
} = req.query;

const pipeline = [
  // 1. Join Campaigns
  {
    $lookup: {
      from: 'campaigns',
      localField: 'campaigns',
      foreignField: '_id',
      as: 'campaignObjects',
    },
  },
  // 2. Unwind campaigns
  { $unwind: '$campaignObjects' },

  // 3. Join Pipelines
  {
    $lookup: {
      from: 'pipelines',
      localField: 'campaignObjects.pipeline',
      foreignField: '_id',
      as: 'pipelineDetails',
    },
  },
  // 4. Unwind pipelineDetails
  { $unwind: '$pipelineDetails' },

  // 5. Unwind payments array
  { $unwind: '$pipelineDetails.payment.payments' },

  // 6. Filtering Logic (clientName, bookingName, date filters)
  {
    $match: {
      ...(clientName && { clientName: new RegExp(clientName, 'i') }),
      ...(bookingName && { brandDisplayName: new RegExp(bookingName, 'i') }),

      // 🔷 Specific payment date (highest priority)
      ...(paymentDate && {
        'pipelineDetails.payment.payments.date': {
          $gte: new Date(new Date(paymentDate).setHours(0, 0, 0, 0)),
          $lte: new Date(new Date(paymentDate).setHours(23, 59, 59, 999)),
        },
      }),

      // 🔷 Open-ended date filters (only if paymentDate is not provided)
      ...(startDate && !endDate && !paymentDate && {
        'pipelineDetails.payment.payments.date': {
          $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        },
      }),
      ...(endDate && !startDate && !paymentDate && {
        'pipelineDetails.payment.payments.date': {
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
        },
      }),
      ...(startDate && endDate && !paymentDate && {
        'pipelineDetails.payment.payments.date': {
          $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
        },
      }),
    },
  },

  // 7. Project desired fields
  {
    $project: {
      _id: 0,
      bookingName: '$brandDisplayName',
      clientName: '$clientName',
      amount: '$pipelineDetails.payment.payments.amount',
      paymentDate: '$pipelineDetails.payment.payments.date',
      mode: '$pipelineDetails.payment.payments.modeOfPayment',
      referenceNumber: '$pipelineDetails.payment.payments.referenceNumber',
      documentUrl: '$pipelineDetails.payment.payments.documentUrl',
    },
  },
];
const sortOptions = { [sortKey]: sortDirection === 'asc' ? 1 : -1 };

// Paginated result pipeline
const reportPipeline = [
  ...pipeline,
  { $sort: sortOptions },
  { $skip: skip },
  { $limit: limit },
];

const countPipeline = [...pipeline, { $count: 'totalCount' }];

const [payments, total] = await Promise.all([
  Booking.aggregate(reportPipeline),
  Booking.aggregate(countPipeline),
]);

const totalCount = total[0]?.totalCount || 0;

res.status(200).json({
  payments,
  pagination: {
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
  },
});
} catch (error) {
console.error('Error fetching payment report:', error);
res.status(500).json({ error: 'Failed to fetch payment report' });
}
};
// EndPoint for Booking Dashboard Page.
export const getFilteredBookings = async (req, res) => {
try {

const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;


const search = req.query.search || '';
const startDate = req.query.startDate;
const endDate = req.query.endDate;

const searchRegex = new RegExp(search, 'i');

let bookingQueryConditions = [];


let campaignIdsToMatch = [];
const campaignFilterConditions = {};

if (startDate) {
  campaignFilterConditions.startDate = { $gte: startDate };
}
if (endDate) {
  campaignFilterConditions.endDate = { $lte: endDate };
}
if (search) {

  campaignFilterConditions.campaignName = searchRegex;
}

// If any campaign-related filter is present, query the Campaign model first
if (Object.keys(campaignFilterConditions).length > 0) {
  const matchingCampaigns = await Campaign.find(campaignFilterConditions).select('_id').lean();
  campaignIdsToMatch = matchingCampaigns.map(c => c._id);

  if (campaignIdsToMatch.length === 0 && (startDate || endDate || search)) {
    bookingQueryConditions.push({ campaigns: { $in: [new mongoose.Types.ObjectId()] } });
  } else if (campaignIdsToMatch.length > 0) {
    bookingQueryConditions.push({ campaigns: { $in: campaignIdsToMatch } });
  }
}


const directBookingSearchConditions = [];
if (search) {
  directBookingSearchConditions.push(
    { companyName: searchRegex },
    { clientName: searchRegex },
    { brandDisplayName: searchRegex }
  );
}


let finalBookingQuery = {};

if (bookingQueryConditions.length > 0 && directBookingSearchConditions.length > 0) {
  finalBookingQuery.$or = [
    ...bookingQueryConditions,
    { $or: directBookingSearchConditions }
  ];
} else if (bookingQueryConditions.length > 0) {
  finalBookingQuery = bookingQueryConditions[0];
} else if (directBookingSearchConditions.length > 0) {
  finalBookingQuery.$or = directBookingSearchConditions;
}

const totalCount = await Booking.countDocuments(finalBookingQuery);

const bookings = await Booking.find(finalBookingQuery)
  .populate({
    path: 'campaigns',
    populate: [
      {
        path: 'spaces.id',
        model: 'Space',
      },
      {
        path: 'pipeline',
        model: 'Pipeline',
        options: { strictPopulate: false },
      },
    ],
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .lean(false);

return res.status(200).json({
  bookings,
  pagination: {
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
  },
});
} catch (error) {
console.error('Error fetching filtered bookings:', error);
return res
.status(500)
.json({ error: error.message || 'Failed to fetch filtered bookings' });
}
};
// --- START: CORRECTED FUNCTION ---
// Booking Report Endpoint (FIXED and more robust)
export const getAllBookings = async (req, res) => {
try {
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;

const {
paymentStatus,
poStatus,
startDate,
endDate,
search,
sortKey = 'createdAt',      // NEW
sortDirection = 'desc'    // NEW
} = req.query;
const searchRegex = search ? new RegExp(search, 'i') : null;

const start = startDate ? new Date(startDate) : null;
const endDt = endDate ? new Date(endDate) : null;
if (endDt) endDt.setHours(23, 59, 59, 999);

const sortOptions = { [sortKey]: sortDirection === 'asc' ? 1 : -1 };


const pipeline = [];

if (searchRegex) {
  pipeline.push({
    $match: {
      $or: [
        { companyName: searchRegex },
        { clientName: searchRegex },
        { brandDisplayName: searchRegex }
      ]
    }
  });
}

pipeline.push({
  $lookup: {
    from: 'campaigns',
    localField: 'campaigns',
    foreignField: '_id',
    as: 'campaigns'
  }
});

pipeline.push({
    $addFields: {
        campaigns: {
            $map: {
                input: '$campaigns',
                as: 'camp',
                in: {
                    $mergeObjects: [
                        '$$camp',
                        {
                            startDateObj: {
                                $cond: {
                                    if: { $and: [
                                        { $ne: [{ $type: '$$camp.startDate' }, 'missing'] },
                                        { $ne: ['$$camp.startDate', null] },
                                        { $ne: ['$$camp.startDate', ""] }
                                    ]},
                                    then: {
                                        $dateFromString: {
                                            dateString: '$$camp.startDate',
                                            format: '%Y-%m-%d',
                                            onError: null
                                        }
                                    },
                                    else: null
                                }
                            },
                            endDateObj: {
                                $cond: {
                                    if: { $and: [
                                        { $ne: [{ $type: '$$camp.endDate' }, 'missing'] },
                                        { $ne: ['$$camp.endDate', null] },
                                        { $ne: ['$$camp.endDate', ""] }
                                    ]},
                                    then: {
                                        $dateFromString: {
                                            dateString: '$$camp.endDate',
                                            format: '%Y-%m-%d',
                                            onError: null
                                        }
                                    },
                                    else: null
                                }
                            }
                        }
                    ]
                }
            }
        }
    }
});

pipeline.push({
  $lookup: {
    from: 'pipelines',
    localField: 'campaigns.pipeline',
    foreignField: '_id',
    as: 'pipelineDetails'
  }
});

pipeline.push({
  $addFields: {
    campaigns: {
      $map: {
        input: '$campaigns',
        as: 'camp',
        in: {
          $mergeObjects: [
            '$$camp',
            {
              paymentSummary: {
                totalDue: {
                  $ifNull: [
                    {
                      $first: {
                        $map: {
                          input: '$pipelineDetails',
                          as: 'pipe',
                          in: '$$pipe.payment.finalAmountWithGST'
                        }
                      }
                    },
                    0
                  ]
                },
                totalPaid: {
                  $ifNull: [
                    {
                      $first: {
                        $map: {
                          input: '$pipelineDetails',
                          as: 'pipe',
                          in: '$$pipe.payment.totalPaid'
                        }
                      }
                    },
                    0
                  ]
                }
              },
              poConfirmed: {
                $first: {
                  $map: {
                    input: '$pipelineDetails',
                    as: 'pipe',
                    in: '$$pipe.po.confirmed'
                  }
                }
              }
            }
          ]
        }
      }
    }
  }
});

pipeline.push({
  $addFields: {
    campaigns: {
      $map: {
        input: '$campaigns',
        as: 'camp',
        in: {
          $mergeObjects: [
            '$$camp',
            {
              paymentSummary: {
                $mergeObjects: [
                  '$$camp.paymentSummary',
                  {
                    status: {
                      $switch: {
                        branches: [
                         
                          {
                            case: {
                              $gte: [
                                '$$camp.paymentSummary.totalPaid',
                                '$$camp.paymentSummary.totalDue'
                              ]
                            },
                            then: 'Paid'
                          },
                          {
                            case: {
                              $gt: ['$$camp.paymentSummary.totalPaid', 0]
                            },
                            then: 'Partial'
                          }
                        ],
                        default: 'Unpaid'
                      }
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    }
  }
});

pipeline.push({
  $addFields: {
    overallStartDate: { $min: '$campaigns.startDateObj' },
    overallEndDate: { $max: '$campaigns.endDateObj' }
  }
});

const filters = {};
if (start && endDt) {
  filters.overallStartDate = { $lte: endDt };
  filters.overallEndDate = { $gte: start };
} else if (start) {
  filters.overallEndDate = { $gte: start };
} else if (endDt) {
  filters.overallStartDate = { $lte: endDt };
}

if (paymentStatus) {
  filters['campaigns.paymentSummary.status'] = paymentStatus;
}

if (poStatus === 'true' || poStatus === 'false') {
  filters['campaigns.poConfirmed'] = poStatus === 'true';
}

if (Object.keys(filters).length > 0) {
  pipeline.push({ $match: filters });
}

pipeline.push(
  { $sort: sortOptions },
  {
    $facet: {
      bookings: [{ $skip: skip }, { $limit: limit }],
      totalCount: [{ $count: 'count' }]
    }
  }
);

const result = await Booking.aggregate(pipeline);

const bookings = result[0].bookings || [];
const totalCount = result[0].totalCount[0]?.count || 0;

return res.json({
bookings,
pagination: {
totalPages: Math.ceil(totalCount / limit),
currentPage: page,
totalCount: totalCount,
}
});
} catch (err) {
console.error('Error in getAllBookings:', err);
res.status(500).json({ message: 'Server Error' });
}
};
// --- END: CORRECTED FUNCTION ---
export const getCampaignById = async (req, res) => {
try {
const { id } = req.params;
console.log('id of campaign is', id);

if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({ error: 'Invalid campaign ID' });
}

const campaign = await Campaign.findById(id).lean();
if (!campaign) {
  return res.status(404).json({ error: 'Campaign not found' });
}

const booking = await Booking.findOne({ campaigns: id }).lean();
if (!booking) {
  return res.status(404).json({ error: 'Campaign is not linked to any booking' });
}

return res.status(200).json(campaign);
} catch (error) {
console.error('Error fetching campaign by ID:', error);
return res.status(500).json({ error: 'Server error' });
}
};
export const createBooking = async (req, res) => {
console.log("BACKEND (LOG 1): Raw request body received:", JSON.stringify(req.body, null, 2));

const session = await mongoose.startSession();
session.startTransaction();

try {
  const {
    companyName,
    clientName,
    clientEmail,
    clientPan,
    clientGst,
    clientContact,
    brandName,
    clientType,
    bookingMode,
    bookingSource,
    agencyName,
    campaigns = [],
    user: userId,
    isFOCBooking = false,
  } = req.body;

  if (!companyName) throw new Error('Company Name is required');
  if (!userId) throw new Error('Assigned User is required');
  if (!clientType) throw new Error('Client Type is required');
  if (!bookingMode) throw new Error('Booking Mode/Type is required');
  if (!bookingSource) throw new Error('Booking Source is required');
  if (bookingSource === "Agency" && !agencyName) throw new Error('Agency name is required when the booking source is Agency!');

  const user = await User.findById(userId);
  if (!user) throw new Error('Invalid user assigned to booking');

  const parsedCampaigns = typeof campaigns === 'string' ? JSON.parse(campaigns) : campaigns;
  
  console.log("BACKEND (LOG 2): Parsed campaigns array:", JSON.stringify(parsedCampaigns, null, 2));

  let companyLogo = '';
  if (req.file?.path) {
    try {
      companyLogo = await uploadToS3(req.file.path, req.file.filename);
    } catch (uploadErr) {
      throw new Error(`Logo upload failed: ${uploadErr.message}`);
    }
  }

  const newBooking = new Booking({
    companyName,
    clientName,
    clientEmail,
    clientPanNumber: clientPan,
    clientGstNumber: clientGst,
    clientContactNumber: clientContact,
    brandDisplayName: brandName,
    clientType,
    companyLogo,
    isFOCBooking,
    bookingMode,
    bookingSource,
    agencyName: agencyName ?? null,
    campaigns: [],
    user: userId
  });

  await newBooking.save({ session });

  const createdCampaigns = [];

  for (const campaignData of parsedCampaigns) {
    const {
      campaignName,
      industry,
      description,
      selectedSpaces = [],
      campaignImages = [],
      startDate,
      endDate,
      isFOC
    } = campaignData;

    const campaignToCreate = {
      campaignName,
      description,
      industry,
      campaignImages,
      isFOC,
      spaces: selectedSpaces.map(s => ({
        id: s.id,
        selectedUnits: s.selectedUnits
      })),
      startDate,
      endDate
    };

    console.log("BACKEND (LOG 3): Object being saved to Campaign collection:", JSON.stringify(campaignToCreate, null, 2));
    
    const newCampaign = new Campaign(campaignToCreate);

    for (const selected of selectedSpaces) {
      const space = await Space.findById(selected.id).session(session);
      if (!space) throw new Error(`Space not found: ${selected.id}`);
      const availableUnitsBeforeBooking = space.unit - space.occupiedUnits;
      if (selected.selectedUnits > availableUnitsBeforeBooking) {
        if (!space.overlappingBooking) {
          space.overlappingBooking = true;
          console.warn(`Proceeding with overlapping booking for space: ${space.spaceName}`);
        } else {
          throw new Error(`Not enough units for space: ${space.spaceName} and overlapping is not allowed`);
        }
      }
      space.occupiedUnits += selected.selectedUnits;
      const isDOOH = space.spaceType === 'DOOH';
      const allUnitsBooked = space.occupiedUnits >= space.unit;
      const noUnitsBooked = space.occupiedUnits === 0;
      if (isDOOH) {
        space.availability = allUnitsBooked ? 'Completely booked' : noUnitsBooked ? 'Completely available' : 'Partialy available';
      } else {
        if (space.overlappingBooking) {
          space.availability = 'Overlapping booking';
        } else {
          space.availability = allUnitsBooked ? 'Booked' : 'Available';
        }
      }
      if (!Array.isArray(space.campaignDates)) {
        space.campaignDates = [];
      }
      for (let i = 0; i < selected.selectedUnits; i++) {
        space.campaignDates.push({
          campaignId: newCampaign._id,
          startDate,
          endDate,
        });
      }
      space.numberOfBookings += 1;
      await space.save({ session });
    }
    
    await newCampaign.save({ session });
    createdCampaigns.push(newCampaign._id);
  }

  newBooking.campaigns = createdCampaigns;
  await newBooking.save({ session });

  await session.commitTransaction();
  session.endSession();

  return res.status(201).json({
    message: 'Booking created successfully',
    bookingId: newBooking._id
  });

} catch (error) {
  await session.abortTransaction();
  session.endSession();
  console.error("Booking creation error:", error);
  return res.status(500).json({ error: error.message || 'Failed to create booking' });
}
};
export const updateBooking = async (req, res) => {
const { id: bookingId } = req.params;
const {
companyName,
clientName,
clientEmail,
clientPanNumber,
clientGstNumber,
clientContactNumber,
brandDisplayName,
clientType,
campaigns = []
} = req.body;
const session = await mongoose.startSession();
session.startTransaction();
try {
const booking = await Booking.findById(bookingId).session(session);
if (!booking) {
throw new Error('Booking not found');
}

Object.assign(booking, {
  companyName,
  clientName,
  clientEmail,
  clientPanNumber,
  clientGstNumber,
  clientContactNumber,
  brandDisplayName,
  clientType
});

for (const updatedCampaign of campaigns) {
  const campaign = await Campaign.findById(updatedCampaign._id).session(session);
  if (!campaign) continue;

  campaign.campaignName = updatedCampaign.campaignName;
  campaign.description = updatedCampaign.description;

  for (const updatedSpace of updatedCampaign.selectedSpaces) {
    const space = await Space.findById(updatedSpace.id).session(session);
    if (!space) throw new Error(`Space not found: ${updatedSpace.id}`);

    const existingSelection = campaign.spaces.find(s => s.id.equals(updatedSpace.id));
    const previousUnits = existingSelection ? existingSelection.selectedUnits : 0;
    const delta = updatedSpace.selectedUnits - previousUnits;

    if (delta > 0 && space.occupiedUnits + delta > space.unit) {
      throw new Error(`Not enough available units for space: ${space.spaceName}`);
    }

    space.occupiedUnits += delta;

    if (space.occupiedUnits >= space.unit) {
      space.availability = 'Completely booked';
    } else if (space.occupiedUnits === 0) {
      space.availability = 'Completely available';
    } else {
      space.availability = 'Partialy available';
    }

    await space.save({ session });

    if (existingSelection) {
      existingSelection.selectedUnits = updatedSpace.selectedUnits;
    } else {
      campaign.spaces.push({ id: updatedSpace.id, selectedUnits: updatedSpace.selectedUnits });
    }
  }

  await campaign.save({ session });
}

await booking.save({ session });

await session.commitTransaction();
session.endSession();

return res.status(200).json({ message: 'Booking updated successfully' });
} catch (error) {
await session.abortTransaction();
session.endSession();
console.error(error);
return res.status(500).json({ error: error.message || 'Failed to update booking' });
}
};
export const deleteBooking = async (req, res) => {
const { id: bookingId } = req.params;
const session = await mongoose.startSession();
session.startTransaction();
try {
const booking = await Booking.findById(bookingId).populate('campaigns').session(session);
if (!booking) {
throw new Error('Booking not found');
}

for (const campaign of booking.campaigns) {
  for (const selected of campaign.spaces) {
    const space = await Space.findById(selected.id).session(session);
    if (!space) continue;

    space.occupiedUnits = Math.max(0, space.occupiedUnits - selected.selectedUnits);

    if (space.occupiedUnits >= space.unit) {
      space.availability = 'Completely booked';
    } else if (space.occupiedUnits === 0) {
      space.availability = 'Completely available';
    } else {
      space.availability = 'Partialy available';
    }
    space.numberOfBookings = Math.max(0, space.numberOfBookings - 1);
    await space.save({ session });
  }

  await Campaign.findByIdAndDelete(campaign._id).session(session);
}

await Booking.findByIdAndDelete(bookingId).session(session);

await session.commitTransaction();
session.endSession();

return res.status(200).json({ message: 'Booking deleted successfully' });
} catch (error) {
await session.abortTransaction();
session.endSession();
console.error(error);
return res.status(500).json({ error: error.message || 'Failed to delete booking' });
}
};
export const getBookingById = async (req, res) => {
const { id: bookingId } = req.params;
try {
const booking = await Booking.findById(bookingId).populate('user')
.populate({
path: 'campaigns',
populate: [
{
path: 'spaces.id',
model: 'Space'
},
{
path: 'pipeline',
model: 'Pipeline'
}
]
});

if (!booking) {
  return res.status(404).json({ error: 'Booking not found' });
}

return res.status(200).json(booking);
} catch (error) {
console.error(error);
return res.status(500).json({ error: error.message || 'Failed to fetch booking' });
}
};
// export const getAllBookings1 = async (req, res) => {
// try {
// const page = parseInt(req.query.page) || 1;
// const limit = parseInt(req.query.limit) || 10;
// const skip = (page - 1) * limit;
// const search = req.query.search || '';
// const { sortKey = 'createdAt', sortDirection = 'desc' } = req.query;

// const searchFilter = {
//   $or: [
//     { companyName: { $regex: search, $options: 'i' } },
//     { clientName: { $regex: search, $options: 'i' } },
//     { brandDisplayName: { $regex: search, $options: 'i' } }
//   ]
// };

// const projection = {
//   _id: 1,
//   companyName: 1,
//   clientName: 1,
//   brandDisplayName: 1,
//   clientType: 1,
//   createdAt: 1,
//   campaigns: 1
// };

// const totalCount = await Booking.countDocuments(searchFilter);
// const sortOptions = { [sortKey]: sortDirection === 'asc' ? 1 : -1 };

// const bookings = await Booking.find(searchFilter, projection)
//   .skip(skip)
//   .limit(limit)
//   .sort(sortOptions).populate({
//     path: 'campaigns',
//     select: 'campaignName startDate endDate industry',
//     populate: [
//       {
//         path: 'spaces.id',
//         model: 'Space',
//         select: 'spaceName'
//       },
//       {
//         path: 'pipeline',
//         model: 'Pipeline',
//         options: { strictPopulate: false }
//       }
//     ]
//   })


// return res.status(200).json({
//   bookings,
//   totalCount,
//   currentPage: page,
//   totalPages: Math.ceil(totalCount / limit)
// });
// } catch (error) {
// console.error(error);
// return res.status(500).json({ error: error.message || 'Failed to fetch bookings' });
// }
// };


export const getAllBookings1 = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const search       = req.query.search || '';
    const { sortKey = 'createdAt', sortDirection = 'desc' } = req.query;

    const sortOptions = { [sortKey]: sortDirection === 'asc' ? 1 : -1 };

    // 🔍 Search filter
    const searchMatch = search
      ? {
          $or: [
            { companyName: { $regex: search, $options: 'i' } },
            { clientName: { $regex: search, $options: 'i' } },
            { brandDisplayName: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const pipeline = [
      { $match: searchMatch },

      // Join campaigns
      {
        $lookup: {
          from: 'campaigns',
          localField: 'campaigns',
          foreignField: '_id',
          as: 'campaigns'
        }
      },

      // Join spaces inside each campaign
      {
        $lookup: {
          from: 'spaces',
          localField: 'campaigns.spaces.id',
          foreignField: '_id',
          as: 'spaces'
        }
      },

      // Join pipelines
      {
        $lookup: {
          from: 'pipelines',
          localField: 'campaigns.pipeline',
          foreignField: '_id',
          as: 'pipelines'
        }
      },

      // Keep only the fields you actually need
      {
        $project: {
          companyName: 1,
          clientName: 1,
          brandDisplayName: 1,
          clientType: 1,
          createdAt: 1,
          campaigns: {
            campaignName: 1,
            startDate: 1,
            endDate: 1,
            industry: 1,
            pipeline: 1,
            spaces: 1
          },
          // flatten lookups
          spaces: { spaceName: 1 },
          pipelines: {
            payment: 1,
            po: 1,
            bookingStatus: 1
          }
        }
      },

      { $sort: sortOptions },

      {
        $facet: {
          bookings: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }]
        }
      }
    ];

    const result = await Booking.aggregate(pipeline).option({ allowDiskUse: true });

    const bookings   = result[0]?.bookings || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;

    return res.status(200).json({
      bookings,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Error in getAllBookings1 (agg optimized):', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch bookings' });
  }
};

// export const getBookingDashboardStats = async (req, res) => {
// try {
// const bookings = await Booking.find({}, { createdAt: 1, campaigns: 1 , clientName: 1 , companyName: 1 })
// .populate({
// path: 'campaigns',
// select: 'pipeline spaces isFOC campaignName startDate endDate',
// populate: [
// {
// path: 'pipeline',
// select: 'payment bookingStatus artwork po invoice'
// },
// {
// path: 'spaces.id',
// select: 'printingStatus mountingStatus'
// }
// ]
// });

// const bookingStats = [];

// bookings.forEach((booking) => {
//   const createdAt = booking.createdAt;

//   booking.campaigns?.forEach((campaign) => {
//     const pipeline = campaign.pipeline || {};
//     const spaces = campaign.spaces || [];

//     const payment = pipeline.payment || {};
//     const bookingStatus = pipeline.bookingStatus || {};
//     const artwork = pipeline.artwork || {};
//     const po = pipeline.po || {};
//     const invoice = pipeline.invoice || {};

//     console.log('INSPECTING INVOICE OBJECT:', JSON.stringify(invoice, null, 2));


//     const isInvoiceReceived = (invoice && (
//     (Array.isArray(invoice) && invoice.length > 0) || 
//     (typeof invoice === 'object' && !Array.isArray(invoice) && invoice.invoiceNumber)
//   ));

//     const statusSummary = {
//       createdAt,
//       totalPaid: payment.totalPaid || 0,
//       paymentDue: payment.paymentDue || 0,
//       bookingConfirmed: !!bookingStatus.confirmed,
//       artworkReceived: !!artwork.confirmed,
//       poReceived: !!po.documentUrl,
//       invoiceReceived: isInvoiceReceived,
//       invoices: (Array.isArray(invoice) ? invoice : []).map(inv => ({
//         documentName: inv.invoiceNumber || 'Invoice Document', // Renames the key
//         fileUrl: inv.documentUrl                             // This key already matches
//       })),      
//       printingStatus: 0,
//       mountingStatus: 0,
//       isFOC: campaign.isFOC,
//       campaignName: campaign.campaignName,
//       clientName: booking.clientName,
//       startDate: campaign.startDate,
//       endDate: campaign.endDate,
//       bookingId: booking._id,
//       campaignId: campaign._id,
//       companyName: booking.companyName, 
//     };

//     spaces.forEach((space) => {
//       const s = space?.id || {};
//       if (s.printingStatus?.confirmed) statusSummary.printingStatus++;
//       if (s.mountingStatus?.confirmed) statusSummary.mountingStatus++;
//     });

//     bookingStats.push(statusSummary);
//   });
// });

// return res.status(200).json({ bookingStats });
// } catch (error) {
// console.error('Error in booking dashboard stats:', error);
// res.status(500).json({ error: 'Failed to generate booking dashboard stats' });
// }
// };

export const getBookingDashboardStats = async (req, res) => {
  try {
    const pipeline = [
      {
        $lookup: {
          from: "campaigns",
          localField: "campaigns",
          foreignField: "_id",
          as: "campaigns"
        }
      },
      { $unwind: { path: "$campaigns", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "pipelines",
          localField: "campaigns.pipeline",
          foreignField: "_id",
          as: "pipeline"
        }
      },
      { $unwind: { path: "$pipeline", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "spaces",
          localField: "campaigns.spaces.id",
          foreignField: "_id",
          as: "spaces"
        }
      },

      // 🔒 Normalize everything into arrays
      {
        $addFields: {
          safeSpaces: {
            $cond: [
              { $isArray: "$spaces" },
              "$spaces",
              { $cond: [{ $gt: ["$spaces", null] }, ["$spaces"], []] }
            ]
          },
          safeInvoices: {
            $cond: [
              { $isArray: "$pipeline.invoice" },
              "$pipeline.invoice",
              { $cond: [{ $gt: ["$pipeline.invoice", null] }, ["$pipeline.invoice"], []] }
            ]
          }
        }
      },

      {
        $project: {
          createdAt: 1,
          companyName: 1,
          clientName: 1,
          campaignId: "$campaigns._id",
          campaignName: "$campaigns.campaignName",
          startDate: "$campaigns.startDate",
          endDate: "$campaigns.endDate",
          isFOC: "$campaigns.isFOC",

          totalPaid: { $ifNull: ["$pipeline.payment.totalPaid", 0] },
          paymentDue: { $ifNull: ["$pipeline.payment.paymentDue", 0] },
          bookingConfirmed: { $ifNull: ["$pipeline.bookingStatus.confirmed", false] },
          artworkReceived: { $ifNull: ["$pipeline.artwork.confirmed", false] },
          poReceived: { $ifNull: ["$pipeline.po.documentUrl", false] },

          invoiceReceived: {
            $cond: [{ $gt: [{ $size: "$safeInvoices" }, 0] }, true, false]
          },

          invoices: {
            $map: {
              input: "$safeInvoices",
              as: "inv",
              in: {
                documentName: { $ifNull: ["$$inv.invoiceNumber", "Invoice Document"] },
                fileUrl: "$$inv.documentUrl"
              }
            }
          },

          printingStatus: {
            $size: {
              $filter: {
                input: "$safeSpaces",
                as: "s",
                cond: { $eq: ["$$s.printingStatus.confirmed", true] }
              }
            }
          },

          mountingStatus: {
            $size: {
              $filter: {
                input: "$safeSpaces",
                as: "s",
                cond: { $eq: ["$$s.mountingStatus.confirmed", true] }
              }
            }
          }
        }
      }
    ];

    const bookingStats = await Booking.aggregate(pipeline);
    return res.status(200).json({ bookingStats });
  } catch (error) {
    console.error("Error in booking dashboard stats:", error);
    res.status(500).json({ error: error.message || "Failed to generate booking dashboard stats" });
  }
};






router.get('/dashboard-stats', authenticate, getBookingDashboardStats);
router.get('/campaign/:id', getCampaignById);
router.patch('/campaign/:id', updateCampaign);
router.post('/:bookingId/campaigns', async (req, res) => {
const session = await mongoose.startSession();
session.startTransaction();
try {
const { bookingId } = req.params;
const campaignData = req.body;

const [newCampaign] = await Campaign.create([campaignData], { session });

if (!newCampaign || !newCampaign._id) {
  throw new Error('Campaign creation failed');
}

await Booking.findByIdAndUpdate(
  bookingId,
  { $push: { campaigns: newCampaign._id } },
  { new: true, session }
);

for (const { id: spaceId, selectedUnits } of newCampaign.spaces) {
  console.log("id of campaign is", newCampaign._id);

  const space = await Space.findById(spaceId).session(session);
  if (!space) throw new Error(`Space not found: ${spaceId}`);

  const availableUnits = space.unit - space.occupiedUnits;
  if (selectedUnits > availableUnits && !space.overlappingBooking) {
    space.overlappingBooking = true;
  }

  space.occupiedUnits += selectedUnits;

  const isDOOH = space.spaceType === 'DOOH';
  const allUnitsBooked = space.occupiedUnits >= space.unit;
  const noUnitsBooked = space.occupiedUnits === 0;

  space.availability = isDOOH
    ? allUnitsBooked
      ? 'Completely booked'
      : noUnitsBooked
        ? 'Completely available'
        : 'Partialy available'
    : space.overlappingBooking
      ? 'Overlapping booking'
      : allUnitsBooked
        ? 'Booked'
        : 'Available';

  if (!Array.isArray(space.campaignDates)) {
    space.campaignDates = [];
  }

  for (let i = 0; i < selectedUnits; i++) {
    space.campaignDates.push({
      campaignId: newCampaign._id,
      startDate: newCampaign.startDate,
      endDate: newCampaign.endDate,
    });
  }

  space.numberOfBookings += 1;
  await space.save({ session });
}

await session.commitTransaction();
session.endSession();

res.status(201).json({ message: 'Campaign created and linked', campaign: newCampaign });
} catch (err) {
await session.abortTransaction();
session.endSession();
console.error('Error creating campaign:', err);
res.status(500).json({ message: err.message || 'Failed to create and link campaign' });
}
});
router.get('/', authenticate, getAllBookings);
router.get('/optimized', authenticate, getAllBookings1);
router.get('/filter-by-date', authenticate, getFilteredBookings);
router.post('/', upload.single('companyLogo'),
createBooking
);
router.get('/payment-report', getPaymentReport);
router.get('/:id', getBookingById);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);
export default router;
