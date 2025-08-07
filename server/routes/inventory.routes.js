import express from 'express';
import mongoose from 'mongoose';
import Booking from '../models/booking.model.js';
import Campaign from '../models/campaign.model.js';
import Pipeline from '../models/pipeline.model.js';
import Space from '../models/space.model.js';
import { authenticate } from '../middleware/authenticate.middleware.js';

const router = express.Router();


router.use(authenticate);



// 1. All Inventories Report with pagination and filtering
// routes/inventory.js (or wherever your router lives)
router.get('/inventory-report', async (req, res) => {
    try {

        const {
            page = 1,
            limit = 10,
            name = '',
            type = '',
            agency = '',
            industry = ''
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const lim = parseInt(limit);

        // ───────────────────────────────────────── 2. BASE FILTER (on Space itself)
        const baseFilter = {};
        if (name) baseFilter.spaceName = { $regex: name, $options: 'i' };
        if (type) baseFilter.spaceType = { $regex: type, $options: 'i' };

        // ───────────────────────────────────────── 3. AGGREGATION PIPELINE
        const pipeline = [
            { $match: baseFilter },

            // --- Bring in bookings + campaign + pipeline data -----------------------
            {
                $lookup: {
                    from: 'bookings',
                    let: { spaceId: '$_id' },
                    pipeline: [
                        {
                            $lookup: {
                                from: 'campaigns',
                                localField: 'campaigns',
                                foreignField: '_id',
                                as: 'campaignData'
                            }
                        },
                        { $unwind: '$campaignData' },

                        // keep only bookings that reference this space
                        {
                            $match: {
                                $expr: { $in: ['$$spaceId', '$campaignData.spaces.id'] }
                            }
                        },

                        // Pull the pipeline (payments etc.) for each campaign -------------
                        {
                            $lookup: {
                                from: 'pipelines',
                                localField: 'campaignData.pipeline',
                                foreignField: '_id',
                                as: 'pipelineData'
                            }
                        },
                        {
                            $unwind: {
                                path: '$pipelineData',
                                preserveNullAndEmptyArrays: true     // OK if a campaign has no pipeline yet
                            }
                        }
                    ],
                    as: 'bookingData'
                }
            },

            // --- Compute totals & flat fields --------------------------------------
            {
                $addFields: {
                    /* Protect against null/undefined booking entries */
                    bookingData: {
                        $filter: { input: '$bookingData', as: 'b', cond: { $ne: ['$$b', null] } }
                    },

                    totalBookings: { $size: '$bookingData' },

                    totalRevenue: {
                        $sum: {
                            $map: {
                                input: '$bookingData',
                                as: 'b',
                                in: { $ifNull: ['$$b.pipelineData.payment.finalAmountWithGST', 0] }
                            }
                        }
                    },

                    lastBookedDate: { $max: '$bookingData.createdAt' },

                    /* First agency / industry we bump into (you can tweak if you need all of them) */
                    agency: { $first: '$bookingData.agencyName' },
                    industry: { $first: '$bookingData.campaignData.industry' }
                }
            }
        ];

        // ───────────────────────────────────────── 4. FILTER ON COMPUTED FIELDS
        if (agency) {
            pipeline.push({ $match: { agency: { $regex: agency, $options: 'i' } } });
        }
        if (industry) {
            pipeline.push({ $match: { industry: { $regex: industry, $options: 'i' } } });
        }

        // ───────────────────────────────────────── 5. CLONE FOR COUNT
        const countPipeline = [...pipeline, { $count: 'total' }];

        // ───────────────────────────────────────── 6. PROJECTION + PAGINATION
        pipeline.push(
            {
                $project: {
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
            },
            { $sort: { name: 1 } },
            { $skip: skip },
            { $limit: lim }
        );

        // ───────────────────────────────────────── 7. RUN BOTH AGGREGATIONS
        const [items, countRes] = await Promise.all([
            Space.aggregate(pipeline),
            Space.aggregate(countPipeline)
        ]);

        const totalItems = countRes[0]?.total || 0;
        const totalPages = Math.ceil(totalItems / lim);

        // ───────────────────────────────────────── 8. RESPONSE
        res.json({
            success: true,
            data: items,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems,
                itemsPerPage: lim
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
            type = 'top', // top or bottom
            metric = 'totalRevenue', // or totalBookings
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
            { $unwind: '$pipelineData' },
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
            {
                $sort: {
                    [metric]: type === 'bottom' ? 1 : -1
                }
            },
            {
                $limit: parseInt(limit)
            }
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