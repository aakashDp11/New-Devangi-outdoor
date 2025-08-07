import Campaign from '../models/campaign.model.js';
import Booking from '../models/booking.model.js';
import Space from '../models/space.model.js';
import mongoose from 'mongoose'; // It's good practice to import mongoose for potential advanced operations

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
      booking, // Corresponds to campaignName
      agency, // Corresponds to companyName in Booking
      inventory, // Corresponds to spaceName in Space
      inventoryType, // Corresponds to spaceType in Space
      startDate,
      endDate,
    } = req.query;

    console.log("Received Filters:", req.query); // This already logs the raw query
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Step 2: Dynamically build the aggregation pipeline
    const pipeline = [];

    // --- Stage 1: Initial match on Campaign fields ---
    // Start by filtering campaigns based on direct properties.
    const initialCampaignMatch = { "inventoryCosts.0": { "$exists": true } }; // Ensure campaign has at least one inventory cost item
    if (booking) {
      initialCampaignMatch.campaignName = { $regex: new RegExp(booking, 'i') };
    }

    // --- MODIFICATION START ---
    // Added detailed logging for the date filter
    if (startDate && endDate) {
      console.log(`Raw startDate from query: ${startDate}, Raw endDate from query: ${endDate}`);

      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);

      console.log('Parsed Start Date (on server):', parsedStartDate.toISOString());
      console.log('Parsed End Date (on server):', parsedEndDate.toISOString());

      // It's often better to set the end date to the very end of the day
      // to ensure you include all records from that day.
      const endOfDay = new Date(endDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      console.log('Adjusted End Date for query:', endOfDay.toISOString());

      initialCampaignMatch.startDate = { $gte: parsedStartDate, $lte: endOfDay };
    }
    // --- MODIFICATION END ---

    pipeline.push({ $match: initialCampaignMatch });

    // --- Stage 2: Join with Bookings to get Agency Info ---
    // A "reverse lookup" to find which Booking a Campaign belongs to.
    pipeline.push({
      $lookup: {
        from: "bookings", // The actual name of your bookings collection in the DB (usually plural and lowercase)
        localField: "_id",
        foreignField: "campaigns",
        as: "bookingInfo"
      }
    });
    // Unwind the result, but keep campaigns that may not have a booking
    pipeline.push({ $unwind: { path: "$bookingInfo", preserveNullAndEmptyArrays: true } });

    // --- Stage 3: Filter by Agency (if provided) ---
    // Now that we have the booking info, we can filter by agency name.
    if (agency) {
      pipeline.push({ $match: { "bookingInfo.companyName": { $regex: new RegExp(agency, 'i') } } });
    }

    // --- Stage 4: Unwind arrays to work with individual spaces ---
    // This creates a separate document for each space within a campaign.
    pipeline.push({ $unwind: "$spaces" });

    // --- Stage 5: Join with Spaces to get Inventory details ---
    pipeline.push({
      $lookup: {
        from: "spaces", // The actual name of your spaces collection in the DB
        localField: "spaces.id",
        foreignField: "_id",
        as: "spaceInfo"
      }
    });
    // Unwind the result, but keep rows for campaigns even if the space is not found (data integrity)
    pipeline.push({ $unwind: { path: "$spaceInfo", preserveNullAndEmptyArrays: true } });

    // --- Stage 6: Filter by Inventory and Inventory Type (if provided) ---
    // Now we can filter on the detailed space information.
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

    // --- Stage 7: Find the specific Trade Margin for the matched space ---
    // For each row, find the cost item that corresponds to the now-unwound space
   // --- Stage 7: Find the specific cost details for the matched space ---
pipeline.push({
  $addFields: {
    matchedCost: {
      $first: {
        $filter: {
          input: "$inventoryCosts",
          as: "cost",
          cond: { $eq: ["$$cost.id", "$spaceInfo._id"] }
        }
      }
    }
  }
});

// --- NEW Stage 7.5: Calculate the trade margin on-the-fly ---
// --- NEW Stage 7.5: Calculate the trade margin on-the-fly ---
pipeline.push({
  $addFields: {
    "matchedCost.calculatedMargin": {
      $subtract: [
        // Use the CORRECT field names: sellingPrice and buyingPrice
        { $ifNull: ["$matchedCost.sellingPrice", 0] },
        { $ifNull: ["$matchedCost.buyingPrice", 0] }
      ]
    }
  }
});

// --- Stage 8: Filter using the NEW calculated margin ---
pipeline.push({ $match: { "matchedCost.calculatedMargin": { $gt: 0 } } });

    // --- Stage 9: Use $facet for efficient pagination ---
    // This powerful stage allows us to get both paginated data and the total count in one go.
    pipeline.push({
      $facet: {
        // Pipeline for getting the total count of documents that match all filters
        metadata: [{ $count: "total" }],
        // Pipeline for getting the actual data for the current page
        data: [
          { $sort: { startDate: -1 } },
          { $skip: skip },
          { $limit: parseInt(limit) },
          // Project the final, clean structure for the report
          {
            $project: {
              _id: 0,
              id: { $concat: [{ $toString: "$_id" }, "-", { $toString: "$spaceInfo._id" }] },
              date: "$startDate",
              booking: "$campaignName",
              agency: { $ifNull: ["$bookingInfo.companyName", "N/A"] },
              inventory: { $ifNull: ["$spaceInfo.spaceName", "N/A"] },
              inventoryType: { $ifNull: ["$spaceInfo.spaceType", "N/A"] },
              // ... inside $project
              tradeMargin: "$matchedCost.calculatedMargin"
            }
          }
        ]
      }
    });

    // --- Execute the pipeline ---
    const result = await Campaign.aggregate(pipeline);

    const reportData = result[0].data;
    const totalCount = result[0].metadata[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    console.log(`Aggregation successful. Returning ${reportData.length} rows for page ${page}. Total matching docs: ${totalCount}.`);

    // --- Step 10: Respond with the final data and pagination info ---
    res.status(200).json({
      tradeMargins: reportData,
      pagination: {
        totalPages,
        currentPage: parseInt(page),
      },
    });

  } catch (err) {
    console.error("--- FATAL ERROR Generating Trade Margin Report ---", err);
    res.status(500).json({ message: "Server error while generating report." });
  }
};