import Campaign from '../models/campaign.model.js';
import Booking from '../models/booking.model.js';
import Space from '../models/space.model.js';
import mongoose from 'mongoose';

/**
 * Controller to generate a Trade Margin Report with advanced filtering and pagination.
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
    } = req.query;

    console.log("Received Filters:", req.query);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Step 2: Dynamically build the aggregation pipeline
    const pipeline = [];

    // --- Stage 1: Initial match on non-date Campaign fields ---
    const initialCampaignMatch = { "inventoryCosts.0": { "$exists": true } };
    if (booking) {
      initialCampaignMatch.campaignName = { $regex: new RegExp(booking, 'i') };
    }
    pipeline.push({ $match: initialCampaignMatch });


    // --- FINAL FIX: Apply date filter in a separate stage with data type conversion ---
    // This is the most robust way to handle dates that might be stored as strings.
    if (startDate && endDate) {
      const parsedStartDate = new Date(startDate);
      const nextDay = new Date(endDate);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      pipeline.push({
        $match: {
          $expr: { // Use $expr to allow aggregation expressions inside $match
            $and: [
              { $gte: [{ $toDate: "$startDate" }, parsedStartDate] }, // Convert field to date before comparing
              { $lt: [{ $toDate: "$startDate" }, nextDay] }             // Convert field to date before comparing
            ]
          }
        }
      });
      console.log('Querying with robust date conversion:', { $gte: parsedStartDate.toISOString(), $lt: nextDay.toISOString() });
    }
    // --- END OF FINAL FIX ---


    // --- Stages 3-8 (No changes needed in this logic) ---
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
    const facetPipeline = {
      metadata: [{ $count: "total" }],
      data: [
        { $sort: { startDate: -1 } },
      ]
    };

    // Conditionally apply pagination
    if (all !== 'true') {
        facetPipeline.data.push({ $skip: skip });
        facetPipeline.data.push({ $limit: parseInt(limit) });
    }

    // Add the final projection to the data pipeline inside the facet
    facetPipeline.data.push({
        $project: {
          _id: 0,
          id: { $concat: [{ $toString: "$_id" }, "-", { $toString: "$spaceInfo._id" }] },
          date: "$startDate",
          booking: "$campaignName",
          agency: { $ifNull: ["$bookingInfo.companyName", "N/A"] },
          inventory: { $ifNull: ["$spaceInfo.spaceName", "N/A"] },
          inventoryType: { $ifNull: ["$spaceInfo.spaceType", "N/A"] },
          tradeMargin: "$matchedCost.calculatedMargin"
        }
    });
    
    pipeline.push({ $facet: facetPipeline });

    // --- Execute the pipeline ---
    const result = await Campaign.aggregate(pipeline);

    const reportData = result[0].data;
    const totalCount = result[0].metadata[0]?.total || 0;
    const totalPages = all === 'true' ? 1 : Math.ceil(totalCount / parseInt(limit));

    console.log(`Aggregation successful. Returning ${reportData.length} rows. Total matching docs: ${totalCount}.`);

    res.status(200).json({
      tradeMargins: reportData,
      pagination: {
        totalPages,
        currentPage: all === 'true' ? 1 : parseInt(page),
      },
    });

  } catch (err) {
    console.error("--- FATAL ERROR Generating Trade Margin Report ---", err);
    res.status(500).json({ message: "Server error while generating report." });
  }
};