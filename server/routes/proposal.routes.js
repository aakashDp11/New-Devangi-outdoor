import express from 'express';
import Proposal from '../models/proposal.model.js';
import Campaign from '../models/campaign.model.js';
import mongoose from 'mongoose';

const router = express.Router();

// Controller function for the new Proposal Report (Corrected and Final Version)
export const getProposalReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      person,
      industry,
      inventoryType,
      clientType, // <<< READ clientType
      bookingSource,
      page = 1,
      limit = 10
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const pipeline = [];

    // --- 1. Initial Match Stage ---
    const initialMatch = {};

    if (startDate && endDate) {
      initialMatch.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    } else if (startDate) {
      initialMatch.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      initialMatch.createdAt = { $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
    }

    if (person) {
      initialMatch.$or = [
          { companyName: { $regex: person, $options: 'i' } },
          { clientName: { $regex: person, $options: 'i' } }
      ];
    }
    if (industry) {
      initialMatch.industry = industry;
    }
    
    // --- THIS LOGIC IS REPLACED ---
    if (clientType) {
      initialMatch.clientType = clientType;
    }

    if (bookingSource) {
      initialMatch.bookingSource = bookingSource;
    }

    if (Object.keys(initialMatch).length > 0) {
      pipeline.push({ $match: initialMatch });
    }

    // --- 2. Lookup Stage to join with Space collection ---
    pipeline.push({
      $lookup: {
        from: 'spaces',
        localField: 'spaces',
        foreignField: '_id',
        as: 'spaceDetails'
      }
    });

    // --- 3. Secondary Match for Inventory Type ---
    if (inventoryType) {
      pipeline.push({
        $match: {
          'spaceDetails.spaceType': inventoryType
        }
      });
    }
    
    // --- 4. Add a $project stage to explicitly define the output ---
    pipeline.push({
        $project: {
            companyName: 1,
            clientName: 1,
            industry: 1,
            clientType: 1,
            bookingSource: 1,
            createdAt: 1,
            spaceDetails: 1
        }
    });

    // --- 5. Facet Stage for Pagination and Total Count ---
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip }, 
            { $limit: parseInt(limit) }
        ]
      }
    });

    // --- Execute Aggregation ---
    const result = await Proposal.aggregate(pipeline);
    
    // --- Safe Data Handling ---
    const proposals = result[0]?.data || [];
    const totalCount = result[0]?.metadata[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.status(200).json({
      proposals,
      pagination: {
        totalCount,
        currentPage: parseInt(page),
        totalPages
      }
    });

  } catch (error) {
    console.error('CRITICAL ERROR in getProposalReport:', error); 
    res.status(500).json({ error: 'Failed to fetch proposal report', details: error.message });
  }
};


// Create Proposal
router.post('/', async (req, res) => {
  try {
    const {
      companyName,
      clientName,
      clientEmail,
      clientPanNumber,
      clientGstNumber,
      clientContactNumber,
      brandDisplayName,
      clientType,
      bookingSource,
      industry,
      description,
      spaces,
      campaigns
    } = req.body;

    const spaceIds = campaigns[0]?.selectedSpaces?.map(space => space.id) || [];
    
    const proposal = new Proposal({
      companyName,
      clientName,
      clientEmail,
      clientPanNumber,
      clientGstNumber,
      clientContactNumber,
      brandDisplayName,
      clientType,
      bookingSource,
      industry,
      description,
      spaces: spaceIds
    });

    await proposal.save();

    res.status(201).json(proposal);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// Get All Proposals
router.get('/', async (req, res) => {
  try {
    const proposals = await Proposal.find().populate('spaces');
    res.json(proposals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET THE NEW PROPOSAL REPORT
router.get('/proposalreport', getProposalReport);


// Get Single Proposal
router.get('/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate('spaces');
    if (!proposal) {
        return res.status(404).json({ error: 'Proposal not found' });
    }
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch proposal' });
  }
});


// Update Proposal
router.put('/:id', async (req, res) => {
  try {
    const updatedProposal = await Proposal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedProposal) {
        return res.status(404).json({ error: 'Proposal not found' });
    }
    res.json(updatedProposal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update proposal' });
  }
});


// Delete Proposal
router.delete('/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findByIdAndDelete(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Proposal deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;