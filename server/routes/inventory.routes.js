import express from 'express';
import mongoose from 'mongoose';
import Booking from '../models/booking.model.js';
import Campaign from '../models/campaign.model.js';
import Pipeline from '../models/pipeline.model.js';
import Space from '../models/space.model.js';
import { authenticate } from '../middleware/authenticate.middleware.js';

const router = express.Router();


router.use(authenticate);



// 1. All Inventories Report with pagination and filtering (CORRECTED AND FINAL VERSION)
// router.get('/inventory-report', async (req, res) => {
//     try {
//         const {
//             page = 1,
//             limit = 10,
//             name = '',
//             type = '',
//             agency = '',
//             industry = '',
//             sortKey = 'revenue',      // Default sort key
//             sortDirection = 'desc'    // Default sort direction
//         } = req.query;

//         const skip = (parseInt(page) - 1) * parseInt(limit);
//         const lim = parseInt(limit);

//         const baseFilter = {};
//         if (name) baseFilter.spaceName = { $regex: name, $options: 'i' };
//         if (type) baseFilter.spaceType = { $regex: type, $options: 'i' };

//         const pipeline = [
//             { $match: baseFilter },
//             {
//                 $lookup: {
//                     from: 'bookings',
//                     let: { spaceId: '$_id' },
//                     pipeline: [
//                         { $lookup: { from: 'campaigns', localField: 'campaigns', foreignField: '_id', as: 'campaignData' } },
//                         { $unwind: '$campaignData' },
//                         { $match: { $expr: { $in: ['$$spaceId', '$campaignData.spaces.id'] } } },
//                         { $lookup: { from: 'pipelines', localField: 'campaignData.pipeline', foreignField: '_id', as: 'pipelineData' } },
//                         { $unwind: { path: '$pipelineData', preserveNullAndEmptyArrays: true } }
//                     ],
//                     as: 'bookingData'
//                 }
//             },
//             {
//                 $addFields: {
//                     bookingData: { $filter: { input: '$bookingData', as: 'b', cond: { $ne: ['$$b', null] } } },
//                     totalBookings: { $size: '$bookingData' },
//                     totalRevenue: { $sum: { $map: { input: '$bookingData', as: 'b', in: { $ifNull: ['$$b.pipelineData.payment.finalAmountWithGST', 0] } } } },
//                     lastBookedDate: { $max: '$bookingData.createdAt' },
//                     agency: { $first: '$bookingData.agencyName' },
//                     industry: { $first: '$bookingData.campaignData.industry' }
//                 }
//             }
//         ];

//         if (agency) {
//             pipeline.push({ $match: { agency: { $regex: agency, $options: 'i' } } });
//         }
//         if (industry) {
//             pipeline.push({ $match: { industry: { $regex: industry, $options: 'i' } } });
//         }

//         const countPipeline = [...pipeline, { $count: 'total' }];

//         // --- START OF CORRECTION ---
//         // 1. Map frontend sort keys to the actual field names available BEFORE projection
//         const sortKeyMap = {
//             name: 'spaceName',
//             type: 'spaceType',
//             agency: 'agency',
//             industry: 'industry',
//             bookings: 'totalBookings',
//             revenue: 'totalRevenue'
//         };

//         const backendSortKey = sortKeyMap[sortKey] || 'totalRevenue'; // Default to revenue
//         const sortOrder = sortDirection === 'asc' ? 1 : -1;
        
//         // 2. Add the dynamic sort stage HERE, before pagination and projection
//         pipeline.push({ $sort: { [backendSortKey]: sortOrder } });
//         // --- END OF CORRECTION ---

//         // Add pagination and the final projection
//         pipeline.push(
//             { $skip: skip },
//             { $limit: lim },
//             {
//                 $project: {
//                     _id: 0, // Exclude original _id to avoid conflicts
//                     id: { $toString: '$_id' },
//                     name: '$spaceName',
//                     type: { $ifNull: ['$spaceType', null] },
//                     agency: { $ifNull: ['$agency', null] },
//                     industry: { $ifNull: ['$industry', null] },
//                     bookings: { $ifNull: ['$totalBookings', 0] },
//                     revenue: { $ifNull: ['$totalRevenue', 0] },
//                     lastBookedDate: { $ifNull: ['$lastBookedDate', null] },
//                     category: { $ifNull: ['$category', null] },
//                     mediaType: { $ifNull: ['$mediaType', null] },
//                     city: { $ifNull: ['$city', null] },
//                     state: { $ifNull: ['$state', null] },
//                     price: { $ifNull: ['$price', null] }
//                 }
//             }
//         );

//         const [items, countRes] = await Promise.all([
//             Space.aggregate(pipeline),
//             Space.aggregate(countPipeline)
//         ]);

//         const totalCount = countRes[0]?.total || 0;
//         const totalPages = Math.ceil(totalCount / lim);

//         res.json({
//             success: true,
//             data: items,
//             pagination: {
//                 currentPage: parseInt(page),
//                 totalPages,
//                 totalCount: totalCount, // Correctly named 'totalCount'
//             }
//         });
//     } catch (err) {
//         console.error('Inventory Report Error:', err);
//         res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: err.message
//         });
//     }
// });

// GET /inventory-report
// Query params: page, limit, name, type, agency, industry, sortKey, sortDirection


// GET /inventory-report
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
  
      const baseFilter = {};
      if (name) baseFilter.spaceName = { $regex: name, $options: 'i' };
      if (type) baseFilter.spaceType = { $regex: type, $options: 'i' };
  
      const pipeline = [
        { $match: baseFilter },
        {
          $lookup: {
            from: 'campaigns',
            let: { spaceId: '$_id' },
            pipeline: [
              { $match: { $expr: { $in: ['$$spaceId', '$spaces.id'] } } },
              { $project: { _id: 1, pipeline: 1, industry: 1, createdAt: 1 } },
  
              { // BookingCampaign links for this campaign
                $lookup: {
                  from: 'bookingcampaigns',
                  localField: '_id',
                  foreignField: 'campaignId',
                  as: 'bc'
                }
              },
              { $unwind: { path: '$bc', preserveNullAndEmptyArrays: true } },
  
              { // Pull the Booking (agencyName, createdAt)
                $lookup: {
                  from: 'bookings',
                  localField: 'bc.bookingId',
                  foreignField: '_id',
                  as: 'booking'
                }
              },
              { $unwind: { path: '$booking', preserveNullAndEmptyArrays: true } }, // <-- FIXED
  
              { // Pipeline for revenue
                $lookup: {
                  from: 'pipelines',
                  localField: 'pipeline',
                  foreignField: '_id',
                  as: 'pipelineDoc'
                }
              },
              { $unwind: { path: '$pipelineDoc', preserveNullAndEmptyArrays: true } }, // <-- FIXED
  
              {
                $project: {
                  _id: 0,
                  campaignId: '$_id',
                  industry: '$industry',
                  agency: '$booking.agencyName',
                  bookingCreatedAt: '$booking.createdAt',
                  revenue: { $ifNull: ['$pipelineDoc.payment.finalAmountWithGST', 0] }
                }
              }
            ],
            as: 'bookingData'
          }
        },
        {
          $addFields: {
            bookingData: {
              $filter: {
                input: '$bookingData',
                as: 'b',
                cond: { $ne: ['$$b.agency', null] }
              }
            }
          }
        },
        {
          $addFields: {
            totalBookings: { $size: '$bookingData' },
            totalRevenue: {
              $sum: {
                $map: {
                  input: '$bookingData',
                  as: 'b',
                  in: { $ifNull: ['$$b.revenue', 0] }
                }
              }
            },
            lastBookedDate: { $max: '$bookingData.bookingCreatedAt' },
            agency: {
              $let: {
                vars: {
                  nonNullAgencies: {
                    $filter: { input: '$bookingData', as: 'b', cond: { $ne: ['$$b.agency', null] } }
                  }
                },
                in: { $ifNull: [{ $first: '$$nonNullAgencies.agency' }, null] }
              }
            },
            industry: {
              $let: {
                vars: {
                  nonNullIndustries: {
                    $filter: { input: '$bookingData', as: 'b', cond: { $ne: ['$$b.industry', null] } }
                  }
                },
                in: { $ifNull: [{ $first: '$$nonNullIndustries.industry' }, null] }
              }
            }
          }
        }
      ];
  
      if (agency) pipeline.push({ $match: { agency: { $regex: agency, $options: 'i' } } });
      if (industry) pipeline.push({ $match: { industry: { $regex: industry, $options: 'i' } } });
  
      const sortKeyMap = {
        name: 'spaceName',
        type: 'spaceType',
        agency: 'agency',
        industry: 'industry',
        bookings: 'totalBookings',
        revenue: 'totalRevenue'
      };
      const backendSortKey = sortKeyMap[sortKey] || 'totalRevenue';
      const sortOrder = (String(sortDirection).toLowerCase() === 'asc') ? 1 : -1;
  
      pipeline.push({ $sort: { [backendSortKey]: sortOrder, _id: 1 } });
  
      const countPipeline = pipeline
        .filter(stage => !stage.$sort) // remove sort for count
        .concat([{ $count: 'total' }]);
  
      pipeline.push(
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
      );
  
      const [items, countRes] = await Promise.all([
        Space.aggregate(pipeline),
        Space.aggregate(countPipeline)
      ]);
  
      const totalCount = countRes[0]?.total || 0;
      const totalPages = Math.ceil(totalCount / lim);
  
      res.json({
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

router.get('/inventory-performance', async (req, res) => {
    try {
      const {
        type = 'top',
        metric = 'totalRevenue',
        limit = 10,
        startDate,
        endDate
      } = req.query;
  
      const bookingFilter = {};
      if (startDate || endDate) {
        bookingFilter.createdAt = {};
        if (startDate) bookingFilter.createdAt.$gte = new Date(startDate);
        if (endDate) bookingFilter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
  
      const pipeline = [
        { $match: bookingFilter },
  
        // Lookup BookingCampaigns
        {
          $lookup: {
            from: 'bookingcampaigns',
            localField: '_id',
            foreignField: 'bookingId',
            as: 'bookingCampaigns'
          }
        },
        { $unwind: '$bookingCampaigns' },
  
        // Lookup Campaigns
        {
          $lookup: {
            from: 'campaigns',
            localField: 'bookingCampaigns.campaignId',
            foreignField: '_id',
            as: 'campaignData'
          }
        },
        { $unwind: '$campaignData' },
  
        // Unwind spaces in campaign
        { $unwind: '$campaignData.spaces' },
  
        // Lookup Space details
        {
          $lookup: {
            from: 'spaces',
            localField: 'campaignData.spaces.id',
            foreignField: '_id',
            as: 'spaceData'
          }
        },
        { $unwind: '$spaceData' },
  
        // Lookup Pipeline details
        {
          $lookup: {
            from: 'pipelines',
            localField: 'campaignData.pipeline',
            foreignField: '_id',
            as: 'pipelineData'
          }
        },
        { $unwind: '$pipelineData' },
  
        // Group by space
        {
          $group: {
            _id: '$spaceData._id',
            spaceName: { $first: '$spaceData.spaceName' },
            spaceType: { $first: '$spaceData.spaceType' },
            city: { $first: '$spaceData.city' },
            state: { $first: '$spaceData.state' },
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: '$pipelineData.payment.finalAmountWithGST' }
          }
        },
  
        // Sort and limit
        {
          $sort: { [metric]: type === 'bottom' ? 1 : -1 }
        },
        { $limit: parseInt(limit) }
      ];
  
      const data = await Booking.aggregate(pipeline);
  
      res.json({
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