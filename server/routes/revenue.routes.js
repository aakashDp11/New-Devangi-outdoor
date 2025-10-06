import express from 'express';
import Pipeline from '../models/pipeline.model.js';
import { authenticate } from '../middleware/authenticate.middleware.js';

const router = express.Router();

router.use(authenticate);
router.get('/by-agency', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const paymentDateMatch = {};
        if (startDate || endDate) {
            paymentDateMatch['payment.payments.date'] = {};
            if (startDate) paymentDateMatch['payment.payments.date'].$gte = new Date(startDate);
            if (endDate) paymentDateMatch['payment.payments.date'].$lte = new Date(endDate);
        }

        const matchStage = (startDate || endDate) ? [{ $match: paymentDateMatch }] : [];

        // 1. Agency vs Direct
        const agencyVsDirect = await Pipeline.aggregate([
            { $unwind: '$payment.payments' },
            ...matchStage,
            {
                $lookup: {
                    from: 'campaigns',
                    localField: 'campaign',
                    foreignField: '_id',
                    as: 'campaignData'
                }
            },
            { $unwind: '$campaignData' },
            {
                $lookup: {
                    from: 'bookings',
                    localField: 'campaignData._id',
                    foreignField: 'campaigns',
                    as: 'bookingData'
                }
            },
            { $unwind: '$bookingData' },
            {
                $project: {
                    isAgency: {
                        $cond: [{ $ifNull: ['$bookingData.agencyName', false] }, 'Agency', 'Direct']
                    },
                    revenue: '$payment.payments.amount'
                }
            },
            {
                $group: {
                    _id: '$isAgency',
                    totalRevenue: { $sum: '$revenue' }
                }
            }
        ]);

        // 2. Revenue by Agency Name
        const revenueByAgency = await Pipeline.aggregate([
            { $unwind: '$payment.payments' },
            ...matchStage,
            {
                $lookup: {
                    from: 'campaigns',
                    localField: 'campaign',
                    foreignField: '_id',
                    as: 'campaignData'
                }
            },
            { $unwind: '$campaignData' },
            {
                $lookup: {
                    from: 'bookings',
                    localField: 'campaignData._id',
                    foreignField: 'campaigns',
                    as: 'bookingData'
                }
            },
            { $unwind: '$bookingData' },
            {
                $match: {
                    'bookingData.agencyName': { $ne: null }
                }
            },
            {
                $group: {
                    _id: '$bookingData.agencyName',
                    totalRevenue: { $sum: '$payment.payments.amount' }
                }
            }
        ]);

        const totalRevenue = agencyVsDirect.reduce((sum, item) => sum + item.totalRevenue, 0);

        res.json({
            success: true,
            summary: { totalRevenue },
            agencyVsDirectRevenue: agencyVsDirect,
            revenueByAgencyName: revenueByAgency
        });
    } catch (error) {
        console.error('Error in /revenue/by-agency:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

router.get('/by-industry', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const paymentDateMatch = {};
        if (startDate || endDate) {
            paymentDateMatch['payment.payments.date'] = {};
            if (startDate) paymentDateMatch['payment.payments.date'].$gte = new Date(startDate);
            if (endDate) paymentDateMatch['payment.payments.date'].$lte = new Date(endDate);
        }

        const matchStage = (startDate || endDate) ? [{ $match: paymentDateMatch }] : [];

        const revenueByIndustry = await Pipeline.aggregate([
            { $unwind: '$payment.payments' },
            ...matchStage,
            {
                $lookup: {
                    from: 'campaigns',
                    localField: 'campaign',
                    foreignField: '_id',
                    as: 'campaignData'
                }
            },
            { $unwind: '$campaignData' },
            {
                $group: {
                    _id: '$campaignData.industry',
                    totalRevenue: { $sum: '$payment.payments.amount' }
                }
            }
        ]);

        const totalRevenue = revenueByIndustry.reduce((sum, item) => sum + item.totalRevenue, 0);

        res.json({
            success: true,
            summary: { totalRevenue },
            revenueByIndustry
        });
    } catch (error) {
        console.error('Error in /revenue/by-industry:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

export default router;