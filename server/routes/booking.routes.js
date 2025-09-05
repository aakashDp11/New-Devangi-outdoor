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
import BookingCampaign from '../models/bookingCampaignMapping.model.js';
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
      sortKey = 'paymentDate',
      sortDirection = 'desc'
    } = req.query;

    const pipeline = [
      // 1. Join BookingCampaigns to get associated campaigns
      {
        $lookup: {
          from: 'bookingcampaigns', // Referencing the new BookingCampaign model
          localField: '_id', // Booking _id
          foreignField: 'bookingId', // Referencing bookingId in BookingCampaign model
          as: 'bookingCampaigns'
        }
      },
      // 2. Unwind the campaigns from BookingCampaigns
      { $unwind: '$bookingCampaigns' },

      // 3. Join Campaigns from the BookingCampaigns model
      {
        $lookup: {
          from: 'campaigns',
          localField: 'bookingCampaigns.campaignId', // Referencing campaignId in BookingCampaign model
          foreignField: '_id',
          as: 'campaignObjects'
        }
      },
      { $unwind: '$campaignObjects' },

      // 4. Join Pipelines from the Campaigns model
      {
        $lookup: {
          from: 'pipelines',
          localField: 'campaignObjects.pipeline',
          foreignField: '_id',
          as: 'pipelineDetails'
        }
      },
      { $unwind: '$pipelineDetails' },

      // 5. Unwind payments array from pipelineDetails
      { $unwind: '$pipelineDetails.payment.payments' },

      // 6. Apply Filters (clientName, bookingName, date filters)
      {
        $match: {
          ...(clientName && { clientName: new RegExp(clientName, 'i') }),
          ...(bookingName && { brandDisplayName: new RegExp(bookingName, 'i') }),

          // Payment date filter
          ...(paymentDate && {
            'pipelineDetails.payment.payments.date': {
              $gte: new Date(new Date(paymentDate).setHours(0, 0, 0, 0)),
              $lte: new Date(new Date(paymentDate).setHours(23, 59, 59, 999)),
            },
          }),

          // Date range filters
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

      // 7. Project the required fields
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

    // Sorting options
    const sortOptions = { [sortKey]: sortDirection === 'asc' ? 1 : -1 };

    // Paginated result pipeline
    const reportPipeline = [
      ...pipeline,
      { $sort: sortOptions },
      { $skip: skip },
      { $limit: limit },
    ];

    // Count pipeline for pagination
    const countPipeline = [...pipeline, { $count: 'totalCount' }];

    // Execute the aggregations
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










// export const getFilteredBookings = async (req, res) => {
//   try {
//     const page  = parseInt(req.query.page, 10)  || 1;
//     const limit = parseInt(req.query.limit, 10) || 10;
//     const skip  = (page - 1) * limit;

//     const search    = req.query.search || '';
//     const startDate = req.query.startDate;
//     const endDate   = req.query.endDate;

//     const searchRegex = new RegExp(search, 'i');

//     // ----- Build campaign-side filter (for date/name filters) -----
//     const campaignFilter = {};
//     if (startDate) campaignFilter.startDate = { $gte: startDate };
//     if (endDate)   campaignFilter.endDate   = { ...(campaignFilter.endDate || {}), $lte: endDate };
//     if (search)    campaignFilter.campaignName = searchRegex;

//     // ----- Build direct booking search conditions -----
//     const directBookingOr = [];
//     if (search) {
//       directBookingOr.push(
//         { companyName: searchRegex },
//         { clientName: searchRegex },
//         { brandDisplayName: searchRegex }
//       );
//     }

//     let finalBookingQuery = {};
//     let bookingIdFilterFromCampaigns = null;

//     // If any campaign filters were provided, constrain bookings by mapping table
//     if (Object.keys(campaignFilter).length > 0) {
//       const matchingCampaigns = await Campaign.find(campaignFilter)
//         .select('_id')
//         .lean();

//       const matchedCampaignIds = matchingCampaigns.map(c => c._id);
//       if (matchedCampaignIds.length === 0) {
//         // No campaigns -> no bookings when campaign filters applied
//         bookingIdFilterFromCampaigns = [];
//       } else {
//         const bcLinks = await BookingCampaign.find({ campaignId: { $in: matchedCampaignIds } })
//           .select('bookingId')
//           .lean();
//         bookingIdFilterFromCampaigns = bcLinks.map(x => x.bookingId);
//       }
//     }

//     // Combine booking filters
//     if (bookingIdFilterFromCampaigns !== null && directBookingOr.length > 0) {
//       finalBookingQuery = {
//         $or: [
//           { _id: { $in: bookingIdFilterFromCampaigns } },
//           { $or: directBookingOr },
//         ],
//       };
//     } else if (bookingIdFilterFromCampaigns !== null) {
//       finalBookingQuery = { _id: { $in: bookingIdFilterFromCampaigns } };
//     } else if (directBookingOr.length > 0) {
//       finalBookingQuery = { $or: directBookingOr };
//     } // else: no filters => get all

//     // ----- Count for pagination -----
//     const totalCount = await Booking.countDocuments(finalBookingQuery);

//     // ----- Page bookings -----
//     const bookings = await Booking.find(finalBookingQuery)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .lean(); // lean for speed; we’ll attach fields manually

//     if (bookings.length === 0) {
//       return res.status(200).json({
//         bookings: [],
//         pagination: {
//           totalCount,
//           currentPage: page,
//           totalPages: Math.ceil(totalCount / limit),
//         },
//       });
//     }

//     // ----- Find campaigns linked to these bookings via mapping table -----
//     const bookingIds = bookings.map(b => b._id);
//     const bcDocs = await BookingCampaign.find({ bookingId: { $in: bookingIds } })
//       .select('bookingId campaignId')
//       .lean();

//     const bookingIdToCampaignIds = new Map();  // bookingId -> Set(campaignId)
//     bcDocs.forEach(bc => {
//       const key = bc.bookingId.toString();
//       if (!bookingIdToCampaignIds.has(key)) bookingIdToCampaignIds.set(key, new Set());
//       bookingIdToCampaignIds.get(key).add(bc.campaignId.toString());
//     });

//     const allCampaignIds = Array.from(new Set(bcDocs.map(x => x.campaignId.toString()))).map(id => new mongoose.Types.ObjectId(id));

//     // ----- Load full campaign docs + populate spaces.id (Space) + pipeline -----
//     const campaigns = await Campaign.find({ _id: { $in: allCampaignIds } })
//       .populate({
//         path: 'pipeline',
//         model: 'Pipeline', // ensure your model name is 'Pipeline'
//       })
//       .populate({
//         path: 'spaces.id',
//         model: 'Space',    // ensure your model name is 'Space'
//       })
//       .lean();

//     // Build a map for quick lookup
//     const campaignById = new Map(campaigns.map(c => [c._id.toString(), c]));

//     // ----- Compute campaignDates for every involved space -----
//     // Gather all spaceIds that appear in these campaigns
//     const allSpaceIds = Array.from(new Set(
//       campaigns.flatMap(c => (c.spaces || []).map(s => s?.id?._id || s?.id)).filter(Boolean)
//     )).map(id => new mongoose.Types.ObjectId(id));

//     // Query ALL campaigns that include any of these spaces (to build the full timeline)
//     // We only need _id, startDate, endDate, spaces.id
//     const campaignsForSpaceTimeline = await Campaign.find({
//       'spaces.id': { $in: allSpaceIds },
//     })
//       .select('_id startDate endDate spaces.id')
//       .lean();

//     // Map: spaceId -> [{ campaignId, startDate, endDate }]
//     const spaceIdToCampaignDates = new Map();
//     campaignsForSpaceTimeline.forEach(c => {
//       (c.spaces || []).forEach(s => {
//         const sid = (s?.id?._id || s?.id)?.toString();
//         if (!sid) return;
//         if (!spaceIdToCampaignDates.has(sid)) spaceIdToCampaignDates.set(sid, []);
//         spaceIdToCampaignDates.get(sid).push({
//           campaignId: c._id,
//           startDate: c.startDate,
//           endDate: c.endDate,
//         });
//       });
//     });

//     // ----- Attach campaigns to each booking with campaignDates on each space -----
//     const bookingsWithCampaigns = bookings.map(b => {
//       const cids = Array.from(bookingIdToCampaignIds.get(b._id.toString()) || []);
//       const fullCampaigns = cids
//         .map(id => campaignById.get(id))
//         .filter(Boolean)
//         .map(c => {
//           // Clone shallowly to avoid mutating original
//           const copy = {
//             _id: c._id,
//             campaignName: c.campaignName || '',
//             description: c.description || '',
//             spaces: (c.spaces || []).map(s => {
//               // s.id may be object (populated) or ObjectId
//               const spaceDoc = s?.id && s.id._id ? s.id : null;
//               const sid = (spaceDoc?._id || s?.id)?.toString();
//               const campaignDates = sid ? (spaceIdToCampaignDates.get(sid) || []) : [];

//               return {
//                 id: spaceDoc || s.id,     // keep your structure; populated doc if available
//                 selectedUnits: s.selectedUnits,
//                 _id: s._id,
//                 campaignDates,            // <-- attach here
//               };
//             }),
//             industry: c.industry,
//             isFOC: c.isFOC,
//             startDate: c.startDate,
//             endDate: c.endDate,
//             inventoryCosts: c.inventoryCosts || [],
//             artwork: c.artwork || { confirmed: false },
//             createdAt: c.createdAt,
//             updatedAt: c.updatedAt,
//             __v: c.__v,
//             pipeline: c.pipeline || undefined,
//           };
//           return copy;
//         });

//       return {
//         ...b,
//         campaigns: fullCampaigns,
//       };
//     });

//     return res.status(200).json({
//       bookings: bookingsWithCampaigns,
//       pagination: {
//         totalCount,
//         currentPage: page,
//         totalPages: Math.ceil(totalCount / limit),
//       },
//     });
//   } catch (error) {
//     console.error('Error fetching filtered bookings:', error);
//     return res.status(500).json({ error: error.message || 'Failed to fetch filtered bookings' });
//   }
// };





export const getFilteredBookings = async (req, res) => {
  try {
    const page  = parseInt(req.query.page, 10)  || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip  = (page - 1) * limit;

    const search    = req.query.search || '';
    const startDate = req.query.startDate;
    const endDate   = req.query.endDate;

    const searchRegex = new RegExp(search, 'i');

    // ----- Build campaign-side filter (for date/name filters) -----
    const campaignFilter = {};
    if (startDate) campaignFilter.startDate = { $gte: startDate };
    if (endDate)   campaignFilter.endDate   = { ...(campaignFilter.endDate || {}), $lte: endDate };
    if (search)    campaignFilter.campaignName = searchRegex;

    // ----- Build direct booking search conditions -----
    const directBookingOr = [];
    if (search) {
      directBookingOr.push(
        { companyName: searchRegex },
        { clientName: searchRegex },
        { brandDisplayName: searchRegex }
      );
    }

    let finalBookingQuery = {};
    let bookingIdFilterFromCampaigns = null;

    // If any campaign filters were provided, constrain bookings by mapping table
    if (Object.keys(campaignFilter).length > 0) {
      const matchingCampaigns = await Campaign.find(campaignFilter)
        .select('_id')
        .lean();

      const matchedCampaignIds = matchingCampaigns.map(c => c._id);
      if (matchedCampaignIds.length === 0) {
        bookingIdFilterFromCampaigns = [];
      } else {
        const bcLinks = await BookingCampaign.find({ campaignId: { $in: matchedCampaignIds } })
          .select('bookingId')
          .lean();
        bookingIdFilterFromCampaigns = bcLinks.map(x => x.bookingId);
      }
    }

    // Combine booking filters
    if (bookingIdFilterFromCampaigns !== null && directBookingOr.length > 0) {
      finalBookingQuery = {
        $or: [
          { _id: { $in: bookingIdFilterFromCampaigns } },
          { $or: directBookingOr },
        ],
      };
    } else if (bookingIdFilterFromCampaigns !== null) {
      finalBookingQuery = { _id: { $in: bookingIdFilterFromCampaigns } };
    } else if (directBookingOr.length > 0) {
      finalBookingQuery = { $or: directBookingOr };
    }

    // ----- Count for pagination -----
    const totalCount = await Booking.countDocuments(finalBookingQuery);

    // ----- Page bookings -----
    const bookings = await Booking.find(finalBookingQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    if (bookings.length === 0) {
      return res.status(200).json({
        bookings: [],
        pagination: {
          totalCount,
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    }

    // ----- Find campaigns linked to these bookings via mapping table -----
    const bookingIds = bookings.map(b => b._id);
    const bcDocs = await BookingCampaign.find({ bookingId: { $in: bookingIds } })
      .select('bookingId campaignId')
      .lean();

    const bookingIdToCampaignIds = new Map();  // bookingId -> Set(campaignId)
    bcDocs.forEach(bc => {
      const key = bc.bookingId.toString();
      if (!bookingIdToCampaignIds.has(key)) bookingIdToCampaignIds.set(key, new Set());
      bookingIdToCampaignIds.get(key).add(bc.campaignId.toString());
    });

    const allCampaignIds = Array.from(new Set(bcDocs.map(x => x.campaignId.toString())))
      .map(id => new mongoose.Types.ObjectId(id));

    // ----- Load the campaigns (NO spaces returned), but we read spaces.id internally to compute timelines -----
    const campaigns = await Campaign.find({ _id: { $in: allCampaignIds } })
      .select('_id campaignName description industry isFOC startDate endDate  createdAt updatedAt __v')
      // .populate({ path: 'pipeline', model: 'Pipeline' })
      .lean();

    // Build quick lookup
    const campaignById = new Map(campaigns.map(c => [c._id.toString(), c]));

    // ----- Build spaceId -> [{_id,startDate,endDate}] map from ALL campaigns that use any of these spaces -----
    const allSpaceIds = Array.from(new Set(
      campaigns.flatMap(c => (c.spaces || []).map(s => s?.id)).filter(Boolean)
    )).map(id => new mongoose.Types.ObjectId(id));

    let spaceIdToCampaignDates = new Map();
    if (allSpaceIds.length > 0) {
      const campaignsForSpaceTimeline = await Campaign.find({
        'spaces.id': { $in: allSpaceIds },
      })
        .select('_id startDate endDate spaces.id')
        .lean();

      spaceIdToCampaignDates = new Map();
      campaignsForSpaceTimeline.forEach(c => {
        (c.spaces || []).forEach(s => {
          const sid = (s?.id)?.toString();
          if (!sid) return;
          if (!spaceIdToCampaignDates.has(sid)) spaceIdToCampaignDates.set(sid, []);
          spaceIdToCampaignDates.get(sid).push({
            _id: c._id,              // campaign id
            startDate: c.startDate,  // from Campaign
            endDate: c.endDate,      // from Campaign
          });
        });
      });

      // Dedupe + sort each space’s dates
      for (const [sid, arr] of spaceIdToCampaignDates.entries()) {
        const seen = new Set();
        const deduped = [];
        arr.forEach(d => {
          const key = `${d._id}-${d.startDate}-${d.endDate}`;
          if (!seen.has(key)) { seen.add(key); deduped.push(d); }
        });
        deduped.sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));
        spaceIdToCampaignDates.set(sid, deduped);
      }
    }

    // ----- For each campaign, compute its campaignDates by union of dates across its own spaces -----
    const computeCampaignDates = (c) => {
      const dates = [];
      const push = (d) => {
        const key = `${d._id}-${d.startDate}-${d.endDate}`;
        if (!seen.has(key)) { seen.add(key); dates.push(d); }
      };
      const seen = new Set();

      // Include this campaign’s own range
      if (c.startDate || c.endDate) {
        push({ _id: c._id, startDate: c.startDate, endDate: c.endDate });
      }

      // Include ranges of all other campaigns sharing any of the same spaces
      (c.spaces || []).forEach(s => {
        const sid = (s?.id)?.toString();
        if (!sid) return;
        const arr = spaceIdToCampaignDates.get(sid) || [];
        arr.forEach(push);
      });

      // Sort chronologically
      dates.sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));
      return dates;
    };

    // ----- Attach campaigns (without spaces) to each booking -----
    const bookingsWithCampaigns = bookings.map(b => {
      const cids = Array.from(bookingIdToCampaignIds.get(b._id.toString()) || []);
      const fullCampaigns = cids
        .map(id => campaignById.get(id))
        .filter(Boolean)
        .map(c => {
          return {
            _id: c._id,
            campaignName: c.campaignName || '',
            description: c.description || '',
            industry: c.industry,
            isFOC: c.isFOC,
            startDate: c.startDate,
            endDate: c.endDate,
            // inventoryCosts: c.inventoryCosts || [],
            // artwork: c.artwork || { confirmed: false },
            // pipeline: c.pipeline || undefined,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            __v: c.__v,
            // NEW: timeline at campaign level; NO space data returned
            campaignDates: computeCampaignDates(c),
          };
        });

      return {
        ...b,
        campaigns: fullCampaigns,
      };
    });

    // Strip any accidental spaces field if present (defensive)
    bookingsWithCampaigns.forEach(b => {
      (b.campaigns || []).forEach(c => { if ('spaces' in c) delete c.spaces; });
    });

    return res.status(200).json({
      bookings: bookingsWithCampaigns,
      pagination: {
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching filtered bookings:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch filtered bookings' });
  }
};

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
      sortKey = 'createdAt',
      sortDirection = 'desc'
    } = req.query;

    const searchRegex = search ? new RegExp(search, 'i') : null;
    const start = startDate ? new Date(startDate) : null;
    const endDt = endDate ? new Date(endDate) : null;
    if (endDt) endDt.setHours(23, 59, 59, 999);
    const sortOptions = { [sortKey]: sortDirection === 'asc' ? 1 : -1 };

    const pipeline = [];

    // Search on booking fields
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

    // Lookup BookingCampaigns for this booking
    pipeline.push({
      $lookup: {
        from: 'bookingcampaigns',
        localField: '_id',
        foreignField: 'bookingId',
        as: 'bookingCampaigns'
      }
    });

    // Populate the Campaigns
    pipeline.push({
      $lookup: {
        from: 'campaigns',
        localField: 'bookingCampaigns.campaignId',
        foreignField: '_id',
        as: 'campaigns'
      }
    });

    // Map campaigns to include startDateObj and endDateObj
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
                    $cond: [
                      { $and: [{ $ne: ['$$camp.startDate', null] }, { $ne: ['$$camp.startDate', ''] }] },
                      { $dateFromString: { dateString: '$$camp.startDate', format: '%Y-%m-%d', onError: null } },
                      null
                    ]
                  },
                  endDateObj: {
                    $cond: [
                      { $and: [{ $ne: ['$$camp.endDate', null] }, { $ne: ['$$camp.endDate', ''] }] },
                      { $dateFromString: { dateString: '$$camp.endDate', format: '%Y-%m-%d', onError: null } },
                      null
                    ]
                  }
                }
              ]
            }
          }
        }
      }
    });

    // Lookup pipeline details for payment summary
    pipeline.push({
      $lookup: {
        from: 'pipelines',
        localField: 'campaigns.pipeline',
        foreignField: '_id',
        as: 'pipelineDetails'
      }
    });

    // Compute payment summary and PO status
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
                    },
                    status: {
                      $switch: {
                        branches: [
                          {
                            case: { $gte: [{ $first: '$pipelineDetails.payment.totalPaid' }, { $first: '$pipelineDetails.payment.finalAmountWithGST' }] },
                            then: 'Paid'
                          },
                          {
                            case: { $gt: [{ $first: '$pipelineDetails.payment.totalPaid' }, 0] },
                            then: 'Partial'
                          }
                        ],
                        default: 'Unpaid'
                      }
                    }
                  },
                  poConfirmed: { $first: '$pipelineDetails.po.confirmed' }
                }
              ]
            }
          }
        }
      }
    });

    // Compute overall start and end dates
    pipeline.push({
      $addFields: {
        overallStartDate: { $min: '$campaigns.startDateObj' },
        overallEndDate: { $max: '$campaigns.endDateObj' }
      }
    });

    // Apply filters
    const filters = {};
    if (start && endDt) {
      filters.overallStartDate = { $lte: endDt };
      filters.overallEndDate = { $gte: start };
    } else if (start) {
      filters.overallEndDate = { $gte: start };
    } else if (endDt) {
      filters.overallStartDate = { $lte: endDt };
    }
    if (paymentStatus) filters['campaigns.paymentSummary.status'] = paymentStatus;
    if (poStatus === 'true' || poStatus === 'false') filters['campaigns.poConfirmed'] = poStatus === 'true';

    if (Object.keys(filters).length > 0) pipeline.push({ $match: filters });

    // Sort, paginate
    pipeline.push(
      { $sort: sortOptions },
      { $facet: { bookings: [{ $skip: skip }, { $limit: limit }], totalCount: [{ $count: 'count' }] } }
    );

    const result = await Booking.aggregate(pipeline);
    const bookings = result[0]?.bookings || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;

    return res.json({
      bookings,
      pagination: {
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        totalCount
      }
    });
  } catch (err) {
    console.error('Error in getAllBookings:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};


// export const getAllBookings = async (req, res) => {
// try {
// const page = parseInt(req.query.page) || 1;
// const limit = parseInt(req.query.limit) || 10;
// const skip = (page - 1) * limit;

// const {
// paymentStatus,
// poStatus,
// startDate,
// endDate,
// search,
// sortKey = 'createdAt',      // NEW
// sortDirection = 'desc'    // NEW
// } = req.query;
// const searchRegex = search ? new RegExp(search, 'i') : null;

// const start = startDate ? new Date(startDate) : null;
// const endDt = endDate ? new Date(endDate) : null;
// if (endDt) endDt.setHours(23, 59, 59, 999);

// const sortOptions = { [sortKey]: sortDirection === 'asc' ? 1 : -1 };


// const pipeline = [];

// if (searchRegex) {
//   pipeline.push({
//     $match: {
//       $or: [
//         { companyName: searchRegex },
//         { clientName: searchRegex },
//         { brandDisplayName: searchRegex }
//       ]
//     }
//   });
// }

// pipeline.push({
//   $lookup: {
//     from: 'campaigns',
//     localField: 'campaigns',
//     foreignField: '_id',
//     as: 'campaigns'
//   }
// });

// pipeline.push({
//     $addFields: {
//         campaigns: {
//             $map: {
//                 input: '$campaigns',
//                 as: 'camp',
//                 in: {
//                     $mergeObjects: [
//                         '$$camp',
//                         {
//                             startDateObj: {
//                                 $cond: {
//                                     if: { $and: [
//                                         { $ne: [{ $type: '$$camp.startDate' }, 'missing'] },
//                                         { $ne: ['$$camp.startDate', null] },
//                                         { $ne: ['$$camp.startDate', ""] }
//                                     ]},
//                                     then: {
//                                         $dateFromString: {
//                                             dateString: '$$camp.startDate',
//                                             format: '%Y-%m-%d',
//                                             onError: null
//                                         }
//                                     },
//                                     else: null
//                                 }
//                             },
//                             endDateObj: {
//                                 $cond: {
//                                     if: { $and: [
//                                         { $ne: [{ $type: '$$camp.endDate' }, 'missing'] },
//                                         { $ne: ['$$camp.endDate', null] },
//                                         { $ne: ['$$camp.endDate', ""] }
//                                     ]},
//                                     then: {
//                                         $dateFromString: {
//                                             dateString: '$$camp.endDate',
//                                             format: '%Y-%m-%d',
//                                             onError: null
//                                         }
//                                     },
//                                     else: null
//                                 }
//                             }
//                         }
//                     ]
//                 }
//             }
//         }
//     }
// });

// pipeline.push({
//   $lookup: {
//     from: 'pipelines',
//     localField: 'campaigns.pipeline',
//     foreignField: '_id',
//     as: 'pipelineDetails'
//   }
// });

// pipeline.push({
//   $addFields: {
//     campaigns: {
//       $map: {
//         input: '$campaigns',
//         as: 'camp',
//         in: {
//           $mergeObjects: [
//             '$$camp',
//             {
//               paymentSummary: {
//                 totalDue: {
//                   $ifNull: [
//                     {
//                       $first: {
//                         $map: {
//                           input: '$pipelineDetails',
//                           as: 'pipe',
//                           in: '$$pipe.payment.finalAmountWithGST'
//                         }
//                       }
//                     },
//                     0
//                   ]
//                 },
//                 totalPaid: {
//                   $ifNull: [
//                     {
//                       $first: {
//                         $map: {
//                           input: '$pipelineDetails',
//                           as: 'pipe',
//                           in: '$$pipe.payment.totalPaid'
//                         }
//                       }
//                     },
//                     0
//                   ]
//                 }
//               },
//               poConfirmed: {
//                 $first: {
//                   $map: {
//                     input: '$pipelineDetails',
//                     as: 'pipe',
//                     in: '$$pipe.po.confirmed'
//                   }
//                 }
//               }
//             }
//           ]
//         }
//       }
//     }
//   }
// });

// pipeline.push({
//   $addFields: {
//     campaigns: {
//       $map: {
//         input: '$campaigns',
//         as: 'camp',
//         in: {
//           $mergeObjects: [
//             '$$camp',
//             {
//               paymentSummary: {
//                 $mergeObjects: [
//                   '$$camp.paymentSummary',
//                   {
//                     status: {
//                       $switch: {
//                         branches: [
                         
//                           {
//                             case: {
//                               $gte: [
//                                 '$$camp.paymentSummary.totalPaid',
//                                 '$$camp.paymentSummary.totalDue'
//                               ]
//                             },
//                             then: 'Paid'
//                           },
//                           {
//                             case: {
//                               $gt: ['$$camp.paymentSummary.totalPaid', 0]
//                             },
//                             then: 'Partial'
//                           }
//                         ],
//                         default: 'Unpaid'
//                       }
//                     }
//                   }
//                 ]
//               }
//             }
//           ]
//         }
//       }
//     }
//   }
// });

// pipeline.push({
//   $addFields: {
//     overallStartDate: { $min: '$campaigns.startDateObj' },
//     overallEndDate: { $max: '$campaigns.endDateObj' }
//   }
// });

// const filters = {};
// if (start && endDt) {
//   filters.overallStartDate = { $lte: endDt };
//   filters.overallEndDate = { $gte: start };
// } else if (start) {
//   filters.overallEndDate = { $gte: start };
// } else if (endDt) {
//   filters.overallStartDate = { $lte: endDt };
// }

// if (paymentStatus) {
//   filters['campaigns.paymentSummary.status'] = paymentStatus;
// }

// if (poStatus === 'true' || poStatus === 'false') {
//   filters['campaigns.poConfirmed'] = poStatus === 'true';
// }

// if (Object.keys(filters).length > 0) {
//   pipeline.push({ $match: filters });
// }

// pipeline.push(
//   { $sort: sortOptions },
//   {
//     $facet: {
//       bookings: [{ $skip: skip }, { $limit: limit }],
//       totalCount: [{ $count: 'count' }]
//     }
//   }
// );

// const result = await Booking.aggregate(pipeline);

// const bookings = result[0].bookings || [];
// const totalCount = result[0].totalCount[0]?.count || 0;

// return res.json({
// bookings,
// pagination: {
// totalPages: Math.ceil(totalCount / limit),
// currentPage: page,
// totalCount: totalCount,
// }
// });
// } catch (err) {
// console.error('Error in getAllBookings:', err);
// res.status(500).json({ message: 'Server Error' });
// }
// };
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

// const booking = await Booking.findOne({ campaigns: id }).lean();
// if (!booking) {
//   return res.status(404).json({ error: 'Campaign is not linked to any booking' });
// }

return res.status(200).json(campaign);
} catch (error) {
console.error('Error fetching campaign by ID:', error);
return res.status(500).json({ error: 'Server error' });
}
};
// export const createBooking = async (req, res) => {
// console.log("BACKEND (LOG 1): Raw request body received:", JSON.stringify(req.body, null, 2));

// const session = await mongoose.startSession();
// session.startTransaction();

// try {
//   const {
//     companyName,
//     clientName,
//     clientEmail,
//     clientPan,
//     clientGst,
//     clientContact,
//     brandName,
//     clientType,
//     bookingMode,
//     bookingSource,
//     agencyName,
//     campaigns = [],
//     user: userId,
//     isFOCBooking = false,
//   } = req.body;

//   if (!companyName) throw new Error('Company Name is required');
//   if (!userId) throw new Error('Assigned User is required');
//   if (!clientType) throw new Error('Client Type is required');
//   if (!bookingMode) throw new Error('Booking Mode/Type is required');
//   if (!bookingSource) throw new Error('Booking Source is required');
//   if (bookingSource === "Agency" && !agencyName) throw new Error('Agency name is required when the booking source is Agency!');

//   const user = await User.findById(userId);
//   if (!user) throw new Error('Invalid user assigned to booking');

//   const parsedCampaigns = typeof campaigns === 'string' ? JSON.parse(campaigns) : campaigns;
  
//   console.log("BACKEND (LOG 2): Parsed campaigns array:", JSON.stringify(parsedCampaigns, null, 2));

//   let companyLogo = '';
//   if (req.file?.path) {
//     try {
//       companyLogo = await uploadToS3(req.file.path, req.file.filename);
//     } catch (uploadErr) {
//       throw new Error(`Logo upload failed: ${uploadErr.message}`);
//     }
//   }

//   const newBooking = new Booking({
//     companyName,
//     clientName,
//     clientEmail,
//     clientPanNumber: clientPan,
//     clientGstNumber: clientGst,
//     clientContactNumber: clientContact,
//     brandDisplayName: brandName,
//     clientType,
//     companyLogo,
//     isFOCBooking,
//     bookingMode,
//     bookingSource,
//     agencyName: agencyName ?? null,
//     campaigns: [],
//     user: userId
//   });

//   await newBooking.save({ session });

//   const createdCampaigns = [];

//   for (const campaignData of parsedCampaigns) {
//     const {
//       campaignName,
//       industry,
//       description,
//       selectedSpaces = [],
//       campaignImages = [],
//       startDate,
//       endDate,
//       isFOC
//     } = campaignData;

//     const campaignToCreate = {
//       campaignName,
//       description,
//       industry,
//       campaignImages,
//       isFOC,
//       spaces: selectedSpaces.map(s => ({
//         id: s.id,
//         selectedUnits: s.selectedUnits
//       })),
//       startDate,
//       endDate
//     };

//     console.log("BACKEND (LOG 3): Object being saved to Campaign collection:", JSON.stringify(campaignToCreate, null, 2));
    
//     const newCampaign = new Campaign(campaignToCreate);

//     for (const selected of selectedSpaces) {
//       const space = await Space.findById(selected.id).session(session);
//       if (!space) throw new Error(`Space not found: ${selected.id}`);
//       const availableUnitsBeforeBooking = space.unit - space.occupiedUnits;
//       if (selected.selectedUnits > availableUnitsBeforeBooking) {
//         if (!space.overlappingBooking) {
//           space.overlappingBooking = true;
//           console.warn(`Proceeding with overlapping booking for space: ${space.spaceName}`);
//         } else {
//           throw new Error(`Not enough units for space: ${space.spaceName} and overlapping is not allowed`);
//         }
//       }
//       space.occupiedUnits += selected.selectedUnits;
//       const isDOOH = space.spaceType === 'DOOH';
//       const allUnitsBooked = space.occupiedUnits >= space.unit;
//       const noUnitsBooked = space.occupiedUnits === 0;
//       if (isDOOH) {
//         space.availability = allUnitsBooked ? 'Completely booked' : noUnitsBooked ? 'Completely available' : 'Partialy available';
//       } else {
//         if (space.overlappingBooking) {
//           space.availability = 'Overlapping booking';
//         } else {
//           space.availability = allUnitsBooked ? 'Booked' : 'Available';
//         }
//       }
//       if (!Array.isArray(space.campaignDates)) {
//         space.campaignDates = [];
//       }
//       for (let i = 0; i < selected.selectedUnits; i++) {
//         space.campaignDates.push({
//           campaignId: newCampaign._id,
//           startDate,
//           endDate,
//         });
//       }
//       space.numberOfBookings += 1;
//       await space.save({ session });
//     }
    
//     await newCampaign.save({ session });
//     createdCampaigns.push(newCampaign._id);
//   }

//   newBooking.campaigns = createdCampaigns;
//   await newBooking.save({ session });

//   await session.commitTransaction();
//   session.endSession();

//   return res.status(201).json({
//     message: 'Booking created successfully',
//     bookingId: newBooking._id
//   });

// } catch (error) {
//   await session.abortTransaction();
//   session.endSession();
//   console.error("Booking creation error:", error);
//   return res.status(500).json({ error: error.message || 'Failed to create booking' });
// }
// };

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

    // Create the booking first
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
      user: userId
    });

    await newBooking.save({ session });

    // Loop through campaigns and create them
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
        spaces: selectedSpaces.map(s => ({ id: s.id, selectedUnits: s.selectedUnits })),
        startDate,
        endDate
      };

      const newCampaign = new Campaign(campaignToCreate);
      await newCampaign.save({ session });

      // Create BookingCampaign link
      const newBookingCampaign = new BookingCampaign({
        bookingId: newBooking._id,
        campaignId: newCampaign._id
      });
      await newBookingCampaign.save({ session });

      // Update Space availability and campaign dates
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
          space.availability = allUnitsBooked ? 'Completely booked' : noUnitsBooked ? 'Completely available' : 'Partially available';
        } else {
          if (space.overlappingBooking) {
            space.availability = 'Overlapping booking';
          } else {
            space.availability = allUnitsBooked ? 'Booked' : 'Available';
          }
        }

        if (!Array.isArray(space.campaignDates)) space.campaignDates = [];

        for (let i = 0; i < selected.selectedUnits; i++) {
          space.campaignDates.push({
            campaignId: newCampaign._id,
            startDate,
            endDate
          });
        }

        space.numberOfBookings += 1;
        await space.save({ session });
      }
    }

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
// export const deleteBooking = async (req, res) => {
// const { id: bookingId } = req.params;
// const session = await mongoose.startSession();
// session.startTransaction();
// try {
// const booking = await Booking.findById(bookingId).populate('campaigns').session(session);
// if (!booking) {
// throw new Error('Booking not found');
// }

// for (const campaign of booking.campaigns) {
//   for (const selected of campaign.spaces) {
//     const space = await Space.findById(selected.id).session(session);
//     if (!space) continue;

//     space.occupiedUnits = Math.max(0, space.occupiedUnits - selected.selectedUnits);

//     if (space.occupiedUnits >= space.unit) {
//       space.availability = 'Completely booked';
//     } else if (space.occupiedUnits === 0) {
//       space.availability = 'Completely available';
//     } else {
//       space.availability = 'Partialy available';
//     }
//     space.numberOfBookings = Math.max(0, space.numberOfBookings - 1);
//     await space.save({ session });
//   }

//   await Campaign.findByIdAndDelete(campaign._id).session(session);
// }

// await Booking.findByIdAndDelete(bookingId).session(session);

// await session.commitTransaction();
// session.endSession();

// return res.status(200).json({ message: 'Booking deleted successfully' });
// } catch (error) {
// await session.abortTransaction();
// session.endSession();
// console.error(error);
// return res.status(500).json({ error: error.message || 'Failed to delete booking' });
// }
// };
export const deleteBooking = async (req, res) => {
  const { id: bookingId } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Fetch booking
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) throw new Error('Booking not found');

    // 2️⃣ Fetch all BookingCampaigns linked to this booking
    const bookingCampaigns = await BookingCampaign.find({ bookingId })
      .populate('campaignId')
      .session(session);

    // 3️⃣ Loop through each BookingCampaign
    for (const bc of bookingCampaigns) {
      const campaign = bc.campaignId;
      if (!campaign) continue;

      // 4️⃣ Update spaces
      for (const selected of campaign.spaces) {
        const space = await Space.findById(selected.id).session(session);
        if (!space) continue;

        // Reduce occupied units
        space.occupiedUnits = Math.max(0, space.occupiedUnits - selected.selectedUnits);

        // Update availability based on type
        const isDOOH = space.spaceType === 'DOOH';
        const allUnitsBooked = space.occupiedUnits >= space.unit;
        const noUnitsBooked = space.occupiedUnits === 0;

        if (isDOOH) {
          space.availability = allUnitsBooked
            ? 'Completely booked'
            : noUnitsBooked
            ? 'Completely available'
            : 'Partialy available';
        } else {
          if (space.overlappingBooking) {
            space.availability = 'Overlapping booking';
          } else {
            space.availability = allUnitsBooked ? 'Booked' : 'Available';
          }
        }

        // Decrement number of bookings
        space.numberOfBookings = Math.max(0, space.numberOfBookings - 1);

        await space.save({ session });
      }

      // 5️⃣ Delete the Campaign
      await Campaign.findByIdAndDelete(campaign._id).session(session);

      // 6️⃣ Delete the BookingCampaign
      await BookingCampaign.findByIdAndDelete(bc._id).session(session);
    }

    // 7️⃣ Delete the Booking itself
    await Booking.findByIdAndDelete(bookingId).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Booking deletion error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete booking' });
  }
};
export const getBookingById = async (req, res) => {
  const { id: bookingId } = req.params;

  try {
    // Step 1: Fetch the booking by ID, populate the 'user' field
    const booking = await Booking.findById(bookingId).populate('user');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Step 2: Fetch related BookingCampaigns for this booking
    const bookingCampaigns = await BookingCampaign.find({ bookingId }).populate({
      path: 'campaignId',
      model: 'Campaign',
      select: '_id campaignName startDate endDate industry isFOC',  // Populate Campaign details
    })
    // .populate({
    //   path: 'pipeline',
    //   model: 'Pipeline',
    //   select: 'payment bookingStatus artwork po invoice',  // Populate Pipeline details
    //   strictPopulate: false,  // Allow populating even if not strictly defined in schema
    // });

    // Step 3: Prepare the response data exactly as the previous structure
    const result = {
      _id:bookingId,
      companyName: booking.companyName,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientContactNumber: booking.clientContactNumber,
      clientPanNumber: booking.clientPanNumber,
      brandDisplayName: booking.brandDisplayName,
      clientGstNumber: booking.clientGstNumber,
      bookingSource: booking.bookingSource,
      bookingMode: booking.bookingMode,
      clientType: booking.clientType,
      createdAt: booking.createdAt,
      campaigns: bookingCampaigns.map(bc => ({
        _id: bc.campaignId._id,
        campaignName: bc.campaignId.campaignName,
        startDate: bc.campaignId.startDate,
        endDate: bc.campaignId.endDate,
        industry: bc.campaignId.industry,
        isFOC: bc.campaignId.isFOC,
        // pipeline: bc.pipeline,  // Include the entire pipeline for each campaign
      }))
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Failed to fetch booking' });
  }
};

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

      // Join BookingCampaignMapping to find associated campaigns for the booking
      {
        $lookup: {
          from: 'bookingcampaignmappings', // New model to map bookings to campaigns
          localField: '_id', // Booking ID
          foreignField: 'bookingId', // Referencing the bookingId field in the new model
          as: 'campaignMappings'
        }
      },

      // Unwind the campaignMappings to get the campaign IDs
      { $unwind: '$campaignMappings' },

      // Join campaigns based on the campaignId from the mapping model
      {
        $lookup: {
          from: 'campaigns',
          localField: 'campaignMappings.campaignId', // Reference to the campaignId in BookingCampaignMapping
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


// export const getAllBookings1 = async (req, res) => {
//   try {
//     const page  = parseInt(req.query.page)  || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip  = (page - 1) * limit;

//     const search       = req.query.search || '';
//     const { sortKey = 'createdAt', sortDirection = 'desc' } = req.query;

//     const sortOptions = { [sortKey]: sortDirection === 'asc' ? 1 : -1 };

//     // 🔍 Search filter
//     const searchMatch = search
//       ? {
//           $or: [
//             { companyName: { $regex: search, $options: 'i' } },
//             { clientName: { $regex: search, $options: 'i' } },
//             { brandDisplayName: { $regex: search, $options: 'i' } }
//           ]
//         }
//       : {};

//     const pipeline = [
//       { $match: searchMatch },

//       // Join campaigns
//       {
//         $lookup: {
//           from: 'campaigns',
//           localField: 'campaigns',
//           foreignField: '_id',
//           as: 'campaigns'
//         }
//       },

//       // Join spaces inside each campaign
//       {
//         $lookup: {
//           from: 'spaces',
//           localField: 'campaigns.spaces.id',
//           foreignField: '_id',
//           as: 'spaces'
//         }
//       },

//       // Join pipelines
//       {
//         $lookup: {
//           from: 'pipelines',
//           localField: 'campaigns.pipeline',
//           foreignField: '_id',
//           as: 'pipelines'
//         }
//       },

//       // Keep only the fields you actually need
//       {
//         $project: {
//           companyName: 1,
//           clientName: 1,
//           brandDisplayName: 1,
//           clientType: 1,
//           createdAt: 1,
//           campaigns: {
//             campaignName: 1,
//             startDate: 1,
//             endDate: 1,
//             industry: 1,
//             pipeline: 1,
//             spaces: 1
//           },
//           // flatten lookups
//           spaces: { spaceName: 1 },
//           pipelines: {
//             payment: 1,
//             po: 1,
//             bookingStatus: 1
//           }
//         }
//       },

//       { $sort: sortOptions },

//       {
//         $facet: {
//           bookings: [{ $skip: skip }, { $limit: limit }],
//           totalCount: [{ $count: 'count' }]
//         }
//       }
//     ];

//     const result = await Booking.aggregate(pipeline).option({ allowDiskUse: true });

//     const bookings   = result[0]?.bookings || [];
//     const totalCount = result[0]?.totalCount[0]?.count || 0;

//     return res.status(200).json({
//       bookings,
//       totalCount,
//       currentPage: page,
//       totalPages: Math.ceil(totalCount / limit)
//     });
//   } catch (error) {
//     console.error('Error in getAllBookings1 (agg optimized):', error);
//     return res.status(500).json({ error: error.message || 'Failed to fetch bookings' });
//   }
// };


// export const getBookingDashboardStats = async (req, res) => {
//   try {
//     const pipeline = [
//       {
//         $lookup: {
//           from: "campaigns",
//           localField: "campaigns",
//           foreignField: "_id",
//           as: "campaigns"
//         }
//       },
//       { $unwind: { path: "$campaigns", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "pipelines",
//           localField: "campaigns.pipeline",
//           foreignField: "_id",
//           as: "pipeline"
//         }
//       },
//       { $unwind: { path: "$pipeline", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "spaces",
//           localField: "campaigns.spaces.id",
//           foreignField: "_id",
//           as: "spaces"
//         }
//       },

//       // 🔒 Normalize everything into arrays
//       {
//         $addFields: {
//           safeSpaces: {
//             $cond: [
//               { $isArray: "$spaces" },
//               "$spaces",
//               { $cond: [{ $gt: ["$spaces", null] }, ["$spaces"], []] }
//             ]
//           },
//           safeInvoices: {
//             $cond: [
//               { $isArray: "$pipeline.invoice" },
//               "$pipeline.invoice",
//               { $cond: [{ $gt: ["$pipeline.invoice", null] }, ["$pipeline.invoice"], []] }
//             ]
//           }
//         }
//       },

//       {
//         $project: {
//           createdAt: 1,
//           companyName: 1,
//           clientName: 1,
//           campaignId: "$campaigns._id",
//           campaignName: "$campaigns.campaignName",
//           startDate: "$campaigns.startDate",
//           endDate: "$campaigns.endDate",
//           isFOC: "$campaigns.isFOC",

//           totalPaid: { $ifNull: ["$pipeline.payment.totalPaid", 0] },
//           paymentDue: { $ifNull: ["$pipeline.payment.paymentDue", 0] },
//           bookingConfirmed: { $ifNull: ["$pipeline.bookingStatus.confirmed", false] },
//           artworkReceived: { $ifNull: ["$pipeline.artwork.confirmed", false] },
//           poReceived: { $ifNull: ["$pipeline.po.documentUrl", false] },

//           invoiceReceived: {
//             $cond: [{ $gt: [{ $size: "$safeInvoices" }, 0] }, true, false]
//           },

//           invoices: {
//             $map: {
//               input: "$safeInvoices",
//               as: "inv",
//               in: {
//                 documentName: { $ifNull: ["$$inv.invoiceNumber", "Invoice Document"] },
//                 fileUrl: "$$inv.documentUrl"
//               }
//             }
//           },

//           printingStatus: {
//             $size: {
//               $filter: {
//                 input: "$safeSpaces",
//                 as: "s",
//                 cond: { $eq: ["$$s.printingStatus.confirmed", true] }
//               }
//             }
//           },

//           mountingStatus: {
//             $size: {
//               $filter: {
//                 input: "$safeSpaces",
//                 as: "s",
//                 cond: { $eq: ["$$s.mountingStatus.confirmed", true] }
//               }
//             }
//           }
//         }
//       }
//     ];

//     const bookingStats = await Booking.aggregate(pipeline);
//     return res.status(200).json({ bookingStats });
//   } catch (error) {
//     console.error("Error in booking dashboard stats:", error);
//     res.status(500).json({ error: error.message || "Failed to generate booking dashboard stats" });
//   }
// };

export const getBookingDashboardStats = async (req, res) => {
  try {
    const pipeline = [
      // 1. Lookup to get BookingCampaigns (mapping between bookings and campaigns)
      {
        $lookup: {
          from: "bookingcampaigns", // BookingCampaign collection
          localField: "_id",         // Booking's _id
          foreignField: "bookingId", // Mapping with the bookingId field in BookingCampaign
          as: "bookingCampaigns"
        }
      },
      
      // 2. Unwind the bookingCampaigns
      { $unwind: { path: "$bookingCampaigns", preserveNullAndEmptyArrays: true } },

      // 3. Lookup to get the campaigns from the campaign collection
      {
        $lookup: {
          from: "campaigns",   // Campaign collection
          localField: "bookingCampaigns.campaignId", // Referencing campaignId in BookingCampaign
          foreignField: "_id", // Matching with campaign's _id
          as: "campaigns"
        }
      },

      // 4. Unwind the campaigns
      { $unwind: { path: "$campaigns", preserveNullAndEmptyArrays: true } },

      // 5. Lookup to get the pipeline associated with each campaign
      {
        $lookup: {
          from: "pipelines",
          localField: "campaigns.pipeline",
          foreignField: "_id",
          as: "pipeline"
        }
      },

      // 6. Unwind pipeline (as there will be only one pipeline per campaign)
      { $unwind: { path: "$pipeline", preserveNullAndEmptyArrays: true } },

      // 7. Lookup to get the spaces associated with the campaign
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

    // Step 8: Execute the aggregation pipeline
    const bookingStats = await Booking.aggregate(pipeline);

    // Step 9: Return the results
    return res.status(200).json({ bookingStats });
  } catch (error) {
    console.error("Error in booking dashboard stats:", error);
    res.status(500).json({ error: error.message || "Failed to generate booking dashboard stats" });
  }
};


router.get('/inventories-for-selection', authenticate, async (req, res) => {
  try {
      const inventories = await Space.find({}, '_id spaceName city address spaceType availability ownershipType').lean();
      res.status(200).json(inventories);
  } catch (error){
      console.error('Error fetching inventories for selection:', error);
      res.status(500).json({ message: 'Server error, could not fetch inventories list.' });
  }
});

router.get('/dashboard-stats', authenticate, getBookingDashboardStats);
router.get('/campaign/:id', getCampaignById);
router.patch('/campaign/:id', updateCampaign);
router.post('/:bookingId/campaigns', async (req, res) => {
const session = await mongoose.startSession();
session.startTransaction();
try {
const { bookingId } = req.params;
console.log("Booking id",bookingId);
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
