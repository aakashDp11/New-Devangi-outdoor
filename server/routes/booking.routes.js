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
  const { campaignName, description, startDate, endDate, industry } = req.body;

  try {
    const updated = await Campaign.findByIdAndUpdate(
      id,
      {
        ...(campaignName && { campaignName }),
        ...(description && { description }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(industry && { industry }),
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

    const { clientName, bookingName, startDate, endDate, paymentDate } = req.query;

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

    // Paginated result pipeline
    const reportPipeline = [
      ...pipeline,
      { $sort: { paymentDate: -1 } },
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

      // If no campaigns match the date/campaignName criteria, and these filters were active,
      // then no bookings will match via this path.
      // We don't return early here, as bookings might still match via direct booking fields search.
      if (campaignIdsToMatch.length === 0 && (startDate || endDate || search)) {
        // If date or campaignName search was active but yielded no campaigns,
        // we can add a condition that ensures no bookings are returned via campaign matching.
        bookingQueryConditions.push({ campaigns: { $in: [new mongoose.Types.ObjectId()] } }); // Match nothing
      } else if (campaignIdsToMatch.length > 0) {
        // If campaigns matched, add a condition to find bookings associated with these campaigns
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
      // If both campaign-related and direct booking search conditions exist,
      // we need to find bookings that match EITHER the campaign criteria OR the direct booking search criteria.
      finalBookingQuery.$or = [
        ...bookingQueryConditions, // This will typically be one condition: { campaigns: { $in: [...] } }
        { $or: directBookingSearchConditions } // This will combine the direct booking field searches
      ];
    } else if (bookingQueryConditions.length > 0) {
      // Only campaign-related filters are active
      finalBookingQuery = bookingQueryConditions[0]; // Assuming it's a single condition like { campaigns: { $in: [...] } }
    } else if (directBookingSearchConditions.length > 0) {
      // Only direct booking field search is active
      finalBookingQuery.$or = directBookingSearchConditions;
    }

    const totalCount = await Booking.countDocuments(finalBookingQuery);

    // Fetch the bookings, applying the filter, sorting, skipping, and limiting.
    const bookings = await Booking.find(finalBookingQuery)
      .populate({
        path: 'campaigns',
        populate: [
          {
            path: 'spaces.id',
            model: 'Space', // Ensure 'Space' model is correctly defined and imported
          },
          {
            path: 'pipeline',
            model: 'Pipeline', // Ensure 'Pipeline' model is correctly defined and imported
            options: { strictPopulate: false },
          },
        ],
      })
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .skip(skip) // Apply pagination skip
      .limit(limit) // Apply pagination limit
      .lean(false); // Keep lean(false) to allow Mongoose document methods/virtuals if needed

    // 3. Send the response with bookings and pagination metadata.
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

    const { paymentStatus, poStatus, startDate, endDate, search } = req.query;
    const searchRegex = search ? new RegExp(search, 'i') : null;

    const start = startDate ? new Date(startDate) : null;
    const endDt = endDate ? new Date(endDate) : null;
    if (endDt) endDt.setHours(23, 59, 59, 999);

    const pipeline = [];

    // Search by text fields
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

    // Lookup campaigns
    pipeline.push({
      $lookup: {
        from: 'campaigns',
        localField: 'campaigns',
        foreignField: '_id',
        as: 'campaigns'
      }
    });

    // Safely convert campaign dates to Date objects
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
                                // Only convert if startDate is a non-empty string
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
                                                onError: null // Return null on error
                                            }
                                        },
                                        else: null // Return null if field is missing or empty
                                    }
                                },
                                // Only convert if endDate is a non-empty string
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
                                                onError: null // Return null on error
                                            }
                                        },
                                        else: null // Return null if field is missing or empty
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        }
    });

    // Lookup pipelines
    pipeline.push({
      $lookup: {
        from: 'pipelines',
        localField: 'campaigns.pipeline',
        foreignField: '_id',
        as: 'pipelineDetails'
      }
    });

    // Add payment and PO status
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

    // Add status for payment
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
                                case: { $lte: ['$$camp.paymentSummary.totalDue', 0] },
                                then: 'Not Applicable'
                              },
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

    // Compute overall start/end
    pipeline.push({
      $addFields: {
        overallStartDate: { $min: '$campaigns.startDateObj' },
        overallEndDate: { $max: '$campaigns.endDateObj' }
      }
    });

    // Date filtering
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
      { $sort: { createdAt: -1 } },
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
      totalPages: Math.ceil(totalCount / limit), // Corrected to match frontend
      currentPage: page,
      totalCount: totalCount,
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

    // Optional: validate campaign exists first
    const campaign = await Campaign.findById(id).lean();
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Ensure campaign is associated with a booking
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
  console.log("Create booking data is", req.body);
  console.log("Uploaded file info:", req.file);

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
      bookingMode, // Booking Type
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

    // ✅ Validate user exists
    const user = await User.findById(userId);
    if (!user) throw new Error('Invalid user assigned to booking');

    const parsedCampaigns = typeof campaigns === 'string' ? JSON.parse(campaigns) : campaigns;

    // ✅ Handle logo upload
    let companyLogo = '';
    if (req.file?.path) {
      try {
        companyLogo = await uploadToS3(req.file.path, req.file.filename);
      } catch (uploadErr) {
        throw new Error(`Logo upload failed: ${uploadErr.message}`);
      }
    }

    // ✅ Create Booking
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
      console.log("Received Campaign Data:", JSON.stringify(campaignData, null, 2));
      const {
        campaignName,
        industry,
        description,
        selectedSpaces = [],
        campaignImages = [],
        startDate,
        endDate
      } = campaignData;
      const newCampaign = new Campaign({
        campaignName,
        description,
        industry,
        campaignImages,
        spaces: selectedSpaces.map(s => ({
          id: s.id,
          selectedUnits: s.selectedUnits
        })),
        startDate,
        endDate
      });
      for (const selected of selectedSpaces) {
        const space = await Space.findById(selected.id).session(session);
        if (!space) throw new Error(`Space not found: ${selected.id}`);

        const availableUnitsBeforeBooking = space.unit - space.occupiedUnits;

        // Overlapping booking check
        if (selected.selectedUnits > availableUnitsBeforeBooking) {
          if (!space.overlappingBooking) {
            space.overlappingBooking = true;
            console.warn(`Proceeding with overlapping booking for space: ${space.spaceName}`);
          } else {
            throw new Error(`Not enough units for space: ${space.spaceName} and overlapping is not allowed`);
          }
        }

        space.occupiedUnits += selected.selectedUnits;

        // Custom availability logic
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
            space.availability = allUnitsBooked
              ? 'Booked'
              : 'Available';
          }
        }

        // Add campaign date entries
        if (!Array.isArray(space.campaignDates)) {
          space.campaignDates = [];
        }

        for (let i = 0; i < selected.selectedUnits; i++) {
          // space.campaignDates.push({ startDate, endDate });
          space.campaignDates.push({
            campaignId: newCampaign._id,
            startDate,
            endDate,
          });
        }

        space.numberOfBookings += 1;
        await space.save({ session });
      }

      // ✅ Create Campaign
      

      await newCampaign.save({ session });
      console.log("New campaign created:", newCampaign);
      createdCampaigns.push(newCampaign._id);
    }

    // ✅ Link campaigns to booking
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

    // ✅ Update basic info
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

    // ✅ Update campaigns
    for (const updatedCampaign of campaigns) {
      const campaign = await Campaign.findById(updatedCampaign._id).session(session);
      if (!campaign) continue;

      // ✅ Update Campaign info
      campaign.campaignName = updatedCampaign.campaignName;
      campaign.description = updatedCampaign.description;

      // ✅ Re-adjust spaces inventory (delta logic)
      for (const updatedSpace of updatedCampaign.selectedSpaces) {
        const space = await Space.findById(updatedSpace.id).session(session);
        if (!space) throw new Error(`Space not found: ${updatedSpace.id}`);

        const existingSelection = campaign.spaces.find(s => s.id.equals(updatedSpace.id));
        const previousUnits = existingSelection ? existingSelection.selectedUnits : 0;
        const delta = updatedSpace.selectedUnits - previousUnits;

        // Validate available units
        if (delta > 0 && space.occupiedUnits + delta > space.unit) {
          throw new Error(`Not enough available units for space: ${space.spaceName}`);
        }

        // Update space occupiedUnits
        space.occupiedUnits += delta;

        // Update space availability
        if (space.occupiedUnits >= space.unit) {
          space.availability = 'Completely booked';
        } else if (space.occupiedUnits === 0) {
          space.availability = 'Completely available';
        } else {
          space.availability = 'Partialy available';
        }

        await space.save({ session });

        // Update campaign's space selection
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

    // ✅ Revert space inventories
    for (const campaign of booking.campaigns) {
      for (const selected of campaign.spaces) {
        const space = await Space.findById(selected.id).session(session);
        if (!space) continue;

        space.occupiedUnits = Math.max(0, space.occupiedUnits - selected.selectedUnits);

        // Update availability
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

      // ✅ Delete Campaign
      await Campaign.findByIdAndDelete(campaign._id).session(session);
    }

    // ✅ Delete Booking
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
            path: 'spaces.id', // populate Space inside Campaign
            model: 'Space'
          },
          {
            path: 'pipeline', // populate Pipeline inside Campaign
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

export const getAllBookings1 = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build search filter
    const searchFilter = {
      $or: [
        { companyName: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { brandDisplayName: { $regex: search, $options: 'i' } }
      ]
    };

    // Projection: only required fields
    const projection = {
      _id: 1,
      companyName: 1,
      clientName: 1,
      brandDisplayName: 1,
      clientType: 1,
      createdAt: 1,
      // companyLogo: 1,
      campaigns: 1
    };

    const totalCount = await Booking.countDocuments(searchFilter);

    const bookings = await Booking.find(searchFilter, projection)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }).populate({
        path: 'campaigns',
        select: 'campaignName startDate endDate industry', // Include startDate and endDate
        populate: [
          {
            path: 'spaces.id',
            model: 'Space',
            select: 'spaceName'
          },
          {
            path: 'pipeline',
            model: 'Pipeline',
            options: { strictPopulate: false }
          }
        ]
      })


    return res.status(200).json({
      bookings,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Failed to fetch bookings' });
  }
};

export const getBookingDashboardStats = async (req, res) => {
  try {
    const bookings = await Booking.find({}, { createdAt: 1, campaigns: 1 })
      .populate({
        path: 'campaigns',
        select: 'pipeline spaces',
        populate: [
          {
            path: 'pipeline',
            select: 'payment bookingStatus artwork po invoice'
          },
          {
            path: 'spaces.id',
            select: 'printingStatus mountingStatus'
          }
        ]
      });

    const bookingStats = [];

    bookings.forEach((booking) => {
      const createdAt = booking.createdAt;

      booking.campaigns?.forEach((campaign) => {
        const pipeline = campaign.pipeline || {};
        const spaces = campaign.spaces || [];

        const payment = pipeline.payment || {};
        const bookingStatus = pipeline.bookingStatus || {};
        const artwork = pipeline.artwork || {};
        const po = pipeline.po || {};
        const invoice = pipeline.invoice || {};

        const statusSummary = {
          createdAt,
          totalPaid: payment.totalPaid || 0,
          paymentDue: payment.paymentDue || 0,
          bookingConfirmed: !!bookingStatus.confirmed,
          artworkReceived: !!artwork.confirmed,
          poReceived: !!po.documentUrl,
          invoiceReceived: !!invoice.invoiceNumber,
          printingStatus: 0,
          mountingStatus: 0,
        };

        spaces.forEach((space) => {
          const s = space?.id || {};
          if (s.printingStatus?.confirmed) statusSummary.printingStatus++;
          if (s.mountingStatus?.confirmed) statusSummary.mountingStatus++;
        });

        bookingStats.push(statusSummary);
      });
    });

    return res.status(200).json({ bookingStats });
  } catch (error) {
    console.error('Error in booking dashboard stats:', error);
    res.status(500).json({ error: 'Failed to generate booking dashboard stats' });
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

    // Step 1: Create the campaign FIRST
    const [newCampaign] = await Campaign.create([campaignData], { session });

    if (!newCampaign || !newCampaign._id) {
      throw new Error('Campaign creation failed');
    }

    // Step 2: Link to booking
    await Booking.findByIdAndUpdate(
      bookingId,
      { $push: { campaigns: newCampaign._id } },
      { new: true, session }
    );

    // Step 3: Update related spaces
    for (const { id: spaceId, selectedUnits } of newCampaign.spaces) {
      console.log("id of campaign is", newCampaign._id); // ✅ Now this will print the correct ID

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
          campaignId: newCampaign._id, // ✅ Now it's valid
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
router.post('/', upload.single('companyLogo'),  // Limit to 10 images
  createBooking
);
router.get('/payment-report', getPaymentReport);


// READ ONE - GET /api/bookings/:id
router.get('/:id', getBookingById);

// UPDATE - PUT /api/bookings/:id
router.put('/:id', updateBooking);

// DELETE - DELETE /api/bookings/:id
router.delete('/:id', deleteBooking);

export default router;