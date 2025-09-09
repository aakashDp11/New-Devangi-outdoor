import express from 'express';
import mongoose from 'mongoose';
import Booking from '../models/booking.model.js';
import Campaign from '../models/campaign.model.js';
import Pipeline from '../models/pipeline.model.js';
import Space from '../models/space.model.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import CampaignInventoryMapping from '../models/campaignInventoryMapping.model.js';
const router = express.Router();


router.use(authenticate);



  
router.get('/inventory-report', async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        name = '',
        type = '',
        agency = '',
        industry = '',
        sortKey = 'revenue',
        sortDirection = 'desc'
      } = req.query;
  
      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const lim = parseInt(limit, 10);
      const sortOrder = (String(sortDirection).toLowerCase() === 'asc') ? 1 : -1;
  
      const sortKeyMap = {
        name: 'spaceName',
        type: 'spaceType',
        agency: 'agency',
        industry: 'industry',
        bookings: 'totalBookings',
        revenue: 'totalRevenue'
      };
      const backendSortKey = sortKeyMap[sortKey] || 'totalRevenue';
  
      const baseFilter = {};
      if (name) baseFilter.spaceName = { $regex: name, $options: 'i' };
      if (type) baseFilter.spaceType = { $regex: type, $options: 'i' };
  
      const pipeline = [
        { $match: baseFilter },
  
        // Get all mappings for this space
        {
          $lookup: {
            from: 'campaigninventorymappings',
            localField: '_id',
            foreignField: 'spaceId',
            as: 'mappings'
          }
        },
  
        // Unwind mappings so we can join further (keep spaces with no mappings too)
        { $unwind: { path: '$mappings', preserveNullAndEmptyArrays: true } },
  
        // Lookup BookingCampaign rows for each mapping.campaignId
        {
          $lookup: {
            from: 'bookingcampaigns',
            localField: 'mappings.campaignId',
            foreignField: 'campaignId',
            as: 'bc'
          }
        },
        { $unwind: { path: '$bc', preserveNullAndEmptyArrays: true } },
  
        // Lookup Booking for agencyName (optional)
        {
          $lookup: {
            from: 'bookings',
            localField: 'bc.bookingId',
            foreignField: '_id',
            as: 'booking'
          }
        },
        { $unwind: { path: '$booking', preserveNullAndEmptyArrays: true } },
  
        // Lookup Campaign for industry (optional; you can skip if you don't need it)
        {
          $lookup: {
            from: 'campaigns',
            localField: 'mappings.campaignId',
            foreignField: '_id',
            as: 'campaignDoc'
          }
        },
        { $unwind: { path: '$campaignDoc', preserveNullAndEmptyArrays: true } },
  
        // Lookup Pipeline to get revenue snapshot
        {
          $lookup: {
            from: 'pipelines',
            localField: 'campaignDoc.pipeline',
            foreignField: '_id',
            as: 'pipelineDoc'
          }
        },
        { $unwind: { path: '$pipelineDoc', preserveNullAndEmptyArrays: true } },
  
        // Shape a flat row per (space x mapping x booking)
        {
          $project: {
            _id: 1,
            spaceName: 1,
            spaceType: 1,
            category: 1,
            mediaType: 1,
            city: 1,
            state: 1,
            price: 1,
  
            agency: '$booking.agencyName',
            industryVal: '$campaignDoc.industry',
            bookingCreatedAt: '$booking.createdAt',
            revenueVal: { $ifNull: ['$pipelineDoc.payment.finalAmountWithGST', 0] }
          }
        },
  
        // Group back per space to aggregate metrics
        {
          $group: {
            _id: '$_id',
            spaceName: { $first: '$spaceName' },
            spaceType: { $first: '$spaceType' },
            category:  { $first: '$category' },
            mediaType: { $first: '$mediaType' },
            city:      { $first: '$city' },
            state:     { $first: '$state' },
            price:     { $first: '$price' },
  
            // Collect arrays to compute derived fields
            agencies:       { $addToSet: '$agency' },
            industries:     { $addToSet: '$industryVal' },
            bookingDates:   { $push: '$bookingCreatedAt' },
            revenueList:    { $push: '$revenueVal' }
          }
        },
  
        // Compute derived values (filter out nulls)
        {
          $addFields: {
            agencies:    { $filter: { input: '$agencies', as: 'a', cond: { $ne: ['$$a', null] } } },
            industries:  { $filter: { input: '$industries', as: 'i', cond: { $ne: ['$$i', null] } } },
            totalBookings: {
              $size: {
                $filter: { input: '$bookingDates', as: 'd', cond: { $ne: ['$$d', null] } }
              }
            },
            totalRevenue: {
              $sum: {
                $map: { input: '$revenueList', as: 'r', in: { $ifNull: ['$$r', 0] } }
              }
            },
            lastBookedDate: { $max: '$bookingDates' },
            // pick a single agency/industry for display (first non-null)
            agency: {
              $cond: [
                { $gt: [{ $size: '$agencies' }, 0] },
                { $arrayElemAt: ['$agencies', 0] },
                null
              ]
            },
            industry: {
              $cond: [
                { $gt: [{ $size: '$industries' }, 0] },
                { $arrayElemAt: ['$industries', 0] },
                null
              ]
            }
          }
        },
  
        // Facet for pagination + total count with post-derivation filters
        {
          $facet: {
            data: [
              ...(agency ? [{ $match: { agency: { $regex: agency, $options: 'i' } } }] : []),
              ...(industry ? [{ $match: { industry: { $regex: industry, $options: 'i' } } }] : []),
              { $sort: { [backendSortKey]: sortOrder, _id: 1 } },
              { $skip: skip },
              { $limit: lim },
              {
                $project: {
                  _id: 0,
                  id: { $toString: '$_id' },
                  name: '$spaceName',
                  type: { $ifNull: ['$spaceType', null] },
                  agency: { $ifNull: ['$agency', null] },
                  industry: { $ifNull: ['$industry', null] },
                  bookings: { $ifNull: ['$totalBookings', 0] },
                  revenue: { $ifNull: ['$totalRevenue', 0] },
                  lastBookedDate: { $ifNull: ['$lastBookedDate', null] },
                  category: { $ifNull: ['$category', null] },
                  mediaType: { $ifNull: ['$mediaType', null] },
                  city: { $ifNull: ['$city', null] },
                  state: { $ifNull: ['$state', null] },
                  price: { $ifNull: ['$price', null] }
                }
              }
            ],
            meta: [
              ...(agency ? [{ $match: { agency: { $regex: agency, $options: 'i' } } }] : []),
              ...(industry ? [{ $match: { industry: { $regex: industry, $options: 'i' } } }] : []),
              { $count: 'total' }
            ]
          }
        },
  
        { $project: {
          data: 1,
          totalCount: { $ifNull: [{ $arrayElemAt: ['$meta.total', 0] }, 0] }
        } }
      ];
  
      const result = await Space.aggregate(pipeline).option({ allowDiskUse: true });
      const items = result[0]?.data || [];
      const totalCount = result[0]?.totalCount || 0;
      const totalPages = Math.ceil(totalCount / lim);
  
      return res.json({
        success: true,
        data: items,
        pagination: {
          currentPage: parseInt(page, 10),
          totalPages,
          totalCount
        }
      });
    } catch (err) {
      console.error('Inventory Report Error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
      });
    }
  });
  


// 2. Enhanced Top/Bottom 10 Inventories Analytics
router.get('/inventory-analytics', async (req, res) => {
    try {
        const {
            type = 'top', // top or bottom
            filterType = 'revenue', // revenue, bookings, industry, type, agency
            filterValue = '', // value for industry, type, agency filters
            limit = 10,
            startDate,
            endDate
        } = req.query;

        // Determine metric to sort by
        const metric = ['revenue', 'bookings'].includes(filterType)
            ? (filterType === 'revenue' ? 'totalRevenue' : 'totalBookings')
            : 'totalRevenue';

        // Build booking date filter
        const bookingFilter = {};
        if (startDate || endDate) {
            bookingFilter.createdAt = {};
            if (startDate) bookingFilter.createdAt.$gte = new Date(startDate);
            if (endDate) bookingFilter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
        }

        const pipeline = [
            { $match: bookingFilter },
            {
                $lookup: {
                    from: 'campaigns',
                    localField: 'campaigns',
                    foreignField: '_id',
                    as: 'campaignData'
                }
            },
            { $unwind: '$campaignData' },
            { $unwind: '$campaignData.spaces' },
            {
                $lookup: {
                    from: 'spaces',
                    localField: 'campaignData.spaces.id',
                    foreignField: '_id',
                    as: 'spaceData'
                }
            },
            { $unwind: '$spaceData' },
            {
                $lookup: {
                    from: 'pipelines',
                    localField: 'campaignData.pipeline',
                    foreignField: '_id',
                    as: 'pipelineData'
                }
            },
            { $unwind: { path: '$pipelineData', preserveNullAndEmptyArrays: true } },
        ];

        // Apply filter on agency/type/industry (from Booking + Space)
        if (filterValue && ['industry', 'type', 'agency'].includes(filterType)) {
            const filterField = filterType === 'type'
                ? 'spaceData.spaceType'
                : filterType === 'industry'
                    ? 'industry' // from Booking
                    : 'agencyName'; // from Booking

            pipeline.push({
                $match: {
                    [filterField]: new RegExp(filterValue, 'i')
                }
            });
        }

        // Group by Space
        pipeline.push(
            {
                $group: {
                    _id: '$spaceData._id',
                    name: { $first: '$spaceData.spaceName' },
                    type: { $first: '$spaceData.spaceType' },
                    category: { $first: '$spaceData.category' },
                    mediaType: { $first: '$spaceData.mediaType' },
                    city: { $first: '$spaceData.city' },
                    state: { $first: '$spaceData.state' },
                    agency: { $first: '$agencyName' }, // from Booking
                    industry: { $first: '$industry' }, // from Booking
                    totalBookings: { $sum: 1 },
                    totalRevenue: { $sum: '$pipelineData.payment.finalAmountWithGST' },
                    totalUnitsBooked: { $sum: '$campaignData.spaces.selectedUnits' },
                    averageRevenuePerBooking: { $avg: '$pipelineData.payment.finalAmountWithGST' }
                }
            },
            {
                $sort: {
                    [metric]: type === 'bottom' ? 1 : -1
                }
            },
            {
                $limit: parseInt(limit)
            },
            {
                $project: {
                    id: { $toString: '$_id' },
                    name: 1,
                    type: 1,
                    agency: 1,
                    industry: 1,
                    bookings: '$totalBookings',
                    revenue: '$totalRevenue',
                    metric: `$${metric}` // dynamically named field for charts
                }
            }
        );

        const data = await Booking.aggregate(pipeline);

        // Format for frontend chart usage
        const chartData = {
            y: data.map(d => d.name),
            x: data.map(d => d.metric),
            metric: filterType === 'bookings' ? 'bookings' : 'revenue'
        };

        res.json({
            success: true,
            data,
            chartData,
            filters: {
                type,
                filterType,
                filterValue,
                startDate,
                endDate,
                metric
            }
        });

    } catch (error) {
        console.error('Inventory Analytics Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// router.get('/inventory-performance', async (req, res) => {
//     try {
//       const {
//         type = 'top',
//         metric = 'totalRevenue',
//         limit = 10,
//         startDate,
//         endDate
//       } = req.query;
  
//       const bookingFilter = {};
//       if (startDate || endDate) {
//         bookingFilter.createdAt = {};
//         if (startDate) bookingFilter.createdAt.$gte = new Date(startDate);
//         if (endDate) bookingFilter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
//       }
  
//       const pipeline = [
//         { $match: bookingFilter },
  
//         // Lookup BookingCampaigns
//         {
//           $lookup: {
//             from: 'bookingcampaigns',
//             localField: '_id',
//             foreignField: 'bookingId',
//             as: 'bookingCampaigns'
//           }
//         },
//         { $unwind: '$bookingCampaigns' },
  
//         // Lookup Campaigns
//         {
//           $lookup: {
//             from: 'campaigns',
//             localField: 'bookingCampaigns.campaignId',
//             foreignField: '_id',
//             as: 'campaignData'
//           }
//         },
//         { $unwind: '$campaignData' },
  
//         // Unwind spaces in campaign
//         { $unwind: '$campaignData.spaces' },
  
//         // Lookup Space details
//         {
//           $lookup: {
//             from: 'spaces',
//             localField: 'campaignData.spaces.id',
//             foreignField: '_id',
//             as: 'spaceData'
//           }
//         },
//         { $unwind: '$spaceData' },
  
//         // Lookup Pipeline details
//         {
//           $lookup: {
//             from: 'pipelines',
//             localField: 'campaignData.pipeline',
//             foreignField: '_id',
//             as: 'pipelineData'
//           }
//         },
//         { $unwind: '$pipelineData' },
  
//         // Group by space
//         {
//           $group: {
//             _id: '$spaceData._id',
//             spaceName: { $first: '$spaceData.spaceName' },
//             spaceType: { $first: '$spaceData.spaceType' },
//             city: { $first: '$spaceData.city' },
//             state: { $first: '$spaceData.state' },
//             totalBookings: { $sum: 1 },
//             totalRevenue: { $sum: '$pipelineData.payment.finalAmountWithGST' }
//           }
//         },
  
//         // Sort and limit
//         {
//           $sort: { [metric]: type === 'bottom' ? 1 : -1 }
//         },
//         { $limit: parseInt(limit) }
//       ];
  
//       const data = await Booking.aggregate(pipeline);
  
//       res.json({
//         success: true,
//         data,
//         filters: { type, metric, startDate, endDate }
//       });
  
//     } catch (error) {
//       console.error('Inventory Performance Error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Internal server error',
//         error: error.message
//       });
//     }
//   });
  
// router.get('/inventory-performance', async (req, res) => {
//     try {
//         const {
//             type = 'top', // top or bottom
//             metric = 'totalRevenue', // or totalBookings
//             limit = 10,
//             startDate,
//             endDate
//         } = req.query;

//         const bookingFilter = {};
//         if (startDate || endDate) {
//             bookingFilter.createdAt = {};
//             if (startDate) bookingFilter.createdAt.$gte = new Date(startDate);
//             if (endDate) bookingFilter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
//         }

//         const pipeline = [
//             { $match: bookingFilter },
//             {
//                 $lookup: {
//                     from: 'campaigns',
//                     localField: 'campaigns',
//                     foreignField: '_id',
//                     as: 'campaignData'
//                 }
//             },
//             { $unwind: '$campaignData' },
//             { $unwind: '$campaignData.spaces' },
//             {
//                 $lookup: {
//                     from: 'spaces',
//                     localField: 'campaignData.spaces.id',
//                     foreignField: '_id',
//                     as: 'spaceData'
//                 }
//             },
//             { $unwind: '$spaceData' },
//             {
//                 $lookup: {
//                     from: 'pipelines',
//                     localField: 'campaignData.pipeline',
//                     foreignField: '_id',
//                     as: 'pipelineData'
//                 }
//             },
//             { $unwind: '$pipelineData' },
//             {
//                 $group: {
//                     _id: '$spaceData._id',
//                     spaceName: { $first: '$spaceData.spaceName' },
//                     spaceType: { $first: '$spaceData.spaceType' },
//                     city: { $first: '$spaceData.city' },
//                     state: { $first: '$spaceData.state' },
//                     totalBookings: { $sum: 1 },
//                     totalRevenue: { $sum: '$pipelineData.payment.finalAmountWithGST' }
//                 }
//             },
//             {
//                 $sort: {
//                     [metric]: type === 'bottom' ? 1 : -1
//                 }
//             },
//             {
//                 $limit: parseInt(limit)
//             }
//         ];

//         const data = await Booking.aggregate(pipeline);

//         res.json({
//             success: true,
//             data,
//             filters: { type, metric, startDate, endDate }
//         });

//     } catch (error) {
//         console.error('Inventory Performance Error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: error.message
//         });
//     }
// });


// 3. Get filter options for dropdowns
router.get('/inventory-performance', async (req, res) => {
    try {
      const {
        type = 'top',                 // 'top' | 'bottom'
        metric = 'totalRevenue',      // 'totalRevenue' | 'totalBookings'
        limit = 10,
        startDate,
        endDate
      } = req.query;
  
      // Booking date filter (createdAt)
      const bookingFilter = {};
      if (startDate || endDate) {
        bookingFilter.createdAt = {};
        if (startDate) bookingFilter.createdAt.$gte = new Date(startDate);
        if (endDate)   bookingFilter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
  
      const sortOrder = type === 'bottom' ? 1 : -1;
      const lim = parseInt(limit, 10) || 10;
  
      const pipeline = [
        // Start from bookings (for date filter & agency/source attribution if needed later)
        { $match: bookingFilter },
  
        // Booking -> BookingCampaign (which campaigns were in this booking)
        {
          $lookup: {
            from: 'bookingcampaigns',
            localField: '_id',
            foreignField: 'bookingId',
            as: 'bookingCampaigns'
          }
        },
        { $unwind: '$bookingCampaigns' },
  
        // Bring in the Campaign header (for pipeline id)
        {
          $lookup: {
            from: 'campaigns',
            localField: 'bookingCampaigns.campaignId',
            foreignField: '_id',
            as: 'campaignData'
          }
        },
        { $unwind: '$campaignData' },
  
        // NEW: Campaign -> CampaignInventoryMappings (spaces linked to the campaign)
        {
          $lookup: {
            from: 'campaigninventorymappings',
            localField: 'campaignData._id',
            foreignField: 'campaignId',
            as: 'mappings'
          }
        },
        { $unwind: '$mappings' }, // one row per (booking x campaign x mapping(space))
  
        // Space details
        {
          $lookup: {
            from: 'spaces',
            localField: 'mappings.spaceId',
            foreignField: '_id',
            as: 'spaceData'
          }
        },
        { $unwind: '$spaceData' },
  
        // Pipeline (for revenue snapshot)
        {
          $lookup: {
            from: 'pipelines',
            localField: 'campaignData.pipeline',
            foreignField: '_id',
            as: 'pipelineData'
          }
        },
        { $unwind: { path: '$pipelineData', preserveNullAndEmptyArrays: true } },
  
        // Shape flat record: per (space) occurrence, carry revenue
        {
          $project: {
            spaceId: '$spaceData._id',
            spaceName: '$spaceData.spaceName',
            spaceType: '$spaceData.spaceType',
            city: '$spaceData.city',
            state: '$spaceData.state',
            // If pipeline missing, treat revenue as 0
            revenueVal: { $ifNull: ['$pipelineData.payment.finalAmountWithGST', 0] }
          }
        },
  
        // Aggregate by space
        {
          $group: {
            _id: '$spaceId',
            spaceName: { $first: '$spaceName' },
            spaceType: { $first: '$spaceType' },
            city: { $first: '$city' },
            state: { $first: '$state' },
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: '$revenueVal' }
          }
        },
  
        // Sort + limit
        { $sort: { [metric]: sortOrder, _id: 1 } },
        { $limit: lim }
      ];
  
      const data = await Booking.aggregate(pipeline);
      return res.json({
        success: true,
        data,
        filters: { type, metric, startDate, endDate }
      });
    } catch (error) {
      console.error('Inventory Performance Error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  });
  
router.get('/inventory-filters', async (req, res) => {
    try {
        // Get unique values for filter dropdowns
        const [types, agencies, industries] = await Promise.all([
            Space.distinct('spaceType'),
            // Replace with actual agency collection/field
            Promise.resolve(['Creative Solutions', 'Media Masters', 'AdVantage', 'Digital Wave', 'SkyHigh Ads']),
            // Replace with actual industry collection/field  
            Promise.resolve(['Technology', 'Retail', 'Automotive', 'FMCG', 'Healthcare', 'Entertainment', 'Finance', 'Fashion', 'Electronics', 'Travel'])
        ]);

        res.json({
            success: true,
            filters: {
                types: types.filter(Boolean),
                agencies: agencies.filter(Boolean),
                industries: industries.filter(Boolean)
            }
        });

    } catch (error) {
        console.error('Get Filters Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

export default router;