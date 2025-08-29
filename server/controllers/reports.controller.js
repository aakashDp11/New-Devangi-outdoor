import Campaign from '../models/campaign.model.js';
import Booking from '../models/booking.model.js';
import Space from '../models/space.model.js';
import mongoose from 'mongoose';

/**
 * Controller to generate a Trade Margin Report with advanced filtering, sorting, and pagination.
 * This function uses a MongoDB Aggregation Pipeline to correctly join and filter
 * data across the Campaign, Booking, and Space collections.
 */
export const getTradeMarginReport = async (req, res) => {
  console.log("--- Generating Trade Margin Report using Aggregation Pipeline ---");
  try {
    // Step 1: Extract filter and pagination parameters from the request query
    const {
      page = 1,
      limit = 10,
      booking,
      agency,
      inventory,
      inventoryType,
      startDate,
      endDate,
      all,
      // MODIFIED: Destructure sorting params with defaults
      sortKey: frontendSortKey = 'date',
      sortDirection = 'desc',
    } = req.query;

    console.log("Received Filters:", req.query);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // NEW: Add dynamic sorting logic block
    // This maps frontend keys to backend fields before the final projection
    const sortKeyMap = {
        inventory: 'spaceInfo.spaceName',
        inventoryType: 'spaceInfo.spaceType',
        booking: 'campaignName',
        tradeMargin: 'matchedCost.calculatedMargin',
        invoiceNo: 'matchedCost.invoiceNo', // <-- ADD THIS LINE
        date: 'startDate',
    };
    const backendSortKey = sortKeyMap[frontendSortKey] || 'startDate';
    const sortDirectionValue = sortDirection === 'asc' ? 1 : -1;
    const sortStage = { $sort: { [backendSortKey]: sortDirectionValue } };
    console.log("Applying Sort:", sortStage);


    // Step 2: Dynamically build the aggregation pipeline (Existing logic unchanged)
    const pipeline = [];

    // --- Stage 1: Initial match on non-date Campaign fields (Existing logic unchanged) ---
    const initialCampaignMatch = { "inventoryCosts.0": { "$exists": true } };
    if (booking) {
      initialCampaignMatch.campaignName = { $regex: new RegExp(booking, 'i') };
    }
    pipeline.push({ $match: initialCampaignMatch });


    // --- Date filter stage (Existing logic unchanged) ---
    if (startDate && endDate) {
      const parsedStartDate = new Date(startDate);
      const nextDay = new Date(endDate);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      pipeline.push({
        $match: {
          $expr: {
            $and: [
              { $gte: [{ $toDate: "$startDate" }, parsedStartDate] },
              { $lt: [{ $toDate: "$startDate" }, nextDay] }
            ]
          }
        }
      });
      console.log('Querying with robust date conversion:', { $gte: parsedStartDate.toISOString(), $lt: nextDay.toISOString() });
    }
    
    // --- Stages 3-8 (Existing logic unchanged) ---
    pipeline.push({
      $lookup: { from: "bookings", localField: "_id", foreignField: "campaigns", as: "bookingInfo" }
    });
    pipeline.push({ $unwind: { path: "$bookingInfo", preserveNullAndEmptyArrays: true } });

    if (agency) {
      pipeline.push({ $match: { "bookingInfo.companyName": { $regex: new RegExp(agency, 'i') } } });
    }

    pipeline.push({ $unwind: "$spaces" });

    pipeline.push({
      $lookup: { from: "spaces", localField: "spaces.id", foreignField: "_id", as: "spaceInfo" }
    });
    pipeline.push({ $unwind: { path: "$spaceInfo", preserveNullAndEmptyArrays: true } });

    const inventoryMatch = {};
    if (inventory) {
      inventoryMatch["spaceInfo.spaceName"] = { $regex: new RegExp(inventory, 'i') };
    }
    if (inventoryType) {
      inventoryMatch["spaceInfo.spaceType"] = { $regex: new RegExp(inventoryType, 'i') };
    }
    if (Object.keys(inventoryMatch).length > 0) {
      pipeline.push({ $match: inventoryMatch });
    }

    pipeline.push({
      $addFields: {
        matchedCost: {
          $first: { $filter: { input: "$inventoryCosts", as: "cost", cond: { $eq: ["$$cost.id", "$spaceInfo._id"] } } }
        }
      }
    });

    pipeline.push({
      $addFields: {
        "matchedCost.calculatedMargin": {
          $subtract: [ { $ifNull: ["$matchedCost.sellingPrice", 0] }, { $ifNull: ["$matchedCost.buyingPrice", 0] } ]
        }
      }
    });

    pipeline.push({ $match: { "matchedCost.calculatedMargin": { $gt: 0 } } });

    // --- Stage 9: Use $facet for efficient pagination ---
    // MODIFIED: Replaced hardcoded sort with the dynamic sortStage variable
    const facetPipeline = {
      metadata: [{ $count: "total" }],
      data: [
        sortStage, // Apply dynamic sorting here
      ]
    };

    // Conditionally apply pagination (Existing logic unchanged)
    if (all !== 'true') {
        facetPipeline.data.push({ $skip: skip });
        facetPipeline.data.push({ $limit: parseInt(limit) });
    }

    // Final projection (Existing logic unchanged)
    facetPipeline.data.push({
        $project: {
          _id: 0,
          id: { $concat: [{ $toString: "$_id" }, "-", { $toString: "$spaceInfo._id" }] },
          date: "$startDate",
          booking: "$campaignName",
          agency: { $ifNull: ["$bookingInfo.companyName", "N/A"] },
          inventory: { $ifNull: ["$spaceInfo.spaceName", "N/A"] },
          inventoryType: { $ifNull: ["$spaceInfo.spaceType", "N/A"] },
          invoiceNo: { $ifNull: ["$matchedCost.invoiceNo", "N/A"] }, // <-- ADD THIS LINE
          tradeMargin: "$matchedCost.calculatedMargin"
        }
    });
    
    pipeline.push({ $facet: facetPipeline });

    // --- Execute the pipeline (Existing logic unchanged) ---
    const result = await Campaign.aggregate(pipeline);

    const reportData = result[0].data;
    const totalCount = result[0].metadata[0]?.total || 0;
    const totalPages = all === 'true' ? 1 : Math.ceil(totalCount / parseInt(limit));

    console.log(`Aggregation successful. Returning ${reportData.length} rows. Total matching docs: ${totalCount}.`);

    // MODIFIED: Add totalCount to the pagination object in the response
    res.status(200).json({
      tradeMargins: reportData,
      pagination: {
        totalPages,
        currentPage: all === 'true' ? 1 : parseInt(page),
        totalCount: totalCount, // Added this required field
      },
    });

  } catch (err) {
    console.error("--- FATAL ERROR Generating Trade Margin Report ---", err);
    res.status(500).json({ message: "Server error while generating report." });
  }
};