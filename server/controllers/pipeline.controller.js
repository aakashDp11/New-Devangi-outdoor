import Pipeline from '../models/pipeline.model.js';
import Campaign from '../models/campaign.model.js';
import Space from '../models/space.model.js';
import { uploadToS3 } from '../utils/s3uploader.js';
/**
 * Get pipeline by Campaign ID
 */
// export const getPipelineByCampaignId = async (req, res) => {
//   const { campaignId } = req.params;
//   try {
//     const pipeline = await Pipeline.findOne({ campaign: campaignId }).populate('spaces');
//     if (!pipeline) {
//       return res.status(404).json({ error: 'Pipeline not found' });
//     }
//     res.json(pipeline);
//   } catch (error) {
//     res.status(500).json({ error: error.message || 'Failed to fetch pipeline' });
//   }
// };

export const getPipelineByCampaignId = async (req, res) => {
  const { campaignId } = req.params;
  try {
    const pipeline = await Pipeline.findOne({ campaign: campaignId })
      .populate('spaces')
      .populate({
        path: 'campaign',
        select: 'inventoryCosts', // only fetch inventoryCosts field
      });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    res.json(pipeline);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch pipeline' });
  }
};


export const createPipelineForCampaign = async (req, res) => {
  const { campaignId } = req.params;
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    let existingPipeline = await Pipeline.findOne({ campaign: campaignId });
    if (existingPipeline) {
      if (!campaign.pipeline) {
        campaign.pipeline = existingPipeline._id;
        await campaign.save();
      }
      return res.status(200).json(existingPipeline);
    }

    const newPipeline = new Pipeline({
      campaign: campaignId,
      spaces: campaign.spaces.map(s => s.id),

      artwork: {
        confirmed: false,
        documentUrl: '',
        recievedDate: '', // optional: fix to "receivedDate" in model if needed
      },

      bookingStatus: {
        confirmed: false,
        reference: '',
        bookingDate: '',
        estimateDocument: '',
      },

      po: {
        confirmed: false,
        documentUrl: '',
        poNumber: '',
        poDate: '',
        poValue: 0,
      },

      invoice: {
        invoiceNumber: '',
        documentUrl: '',
        invoiceDate: '',
        invoiceValue: 0,
      },

      cashMemo: {
        reference: '',
        value: 0,
        documentUrl: '',
      },

      creditNote: {
        reference: '',
        value: 0,
        documentUrl: '',
      },

      payment: {
        mountingAmount: 0,
        printingAmount: 0,
        displayAmount: 0,
        totalAmount: 0,
        gstValue: 0,
        finalAmountWithGST: 0,
        modeOfPayment: undefined,
        cashMemoNo: 0,
        payments: [],
        totalPaid: 0,
        paymentDue: 0,
      },
    });

    await newPipeline.save();

    campaign.pipeline = newPipeline._id;
    await campaign.save();

    res.status(201).json(newPipeline);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create pipeline' });
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (req, res) => {
  console.log("Booking files recieved are", req.file);
  if (!req.file || !req.file.path) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // ✅ Upload file to S3
  let fileUrl = '';
  try {
    fileUrl = await uploadToS3(req.file.path, req.file.filename);
  } catch (uploadErr) {
    console.error('S3 upload failed:', uploadErr);
    return res.status(500).json({ error: 'Failed to upload artwork to S3' });
  }
  const { campaignId } = req.params;
  const { confirmed, reference, bookingDate, estimateDocument } = req.body;
  console.log("One for booking status")
  try {
    const pipeline = await Pipeline.findOneAndUpdate(
      { campaign: campaignId },
      { bookingStatus: { confirmed, reference, bookingDate, estimateDocument: fileUrl } },
      { new: true }
    );
    res.json(pipeline);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update booking status' });
  }
};

/**
 * Confirm Artwork
 */

export const confirmArtwork = async (req, res) => {
  const { campaignId } = req.params;
  const { receivedDate } = req.body;

  try {
    const updateData = {
      'artwork.confirmed': true,
      ...(receivedDate && { 'artwork.receivedDate': receivedDate }),
    };

    const pipeline = await Pipeline.findOneAndUpdate(
      { campaign: campaignId },
      updateData,
      { new: true }
    );

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    res.status(200).json(pipeline);
  } catch (error) {
    console.error('Error confirming artwork:', error);
    res.status(500).json({ error: error.message || 'Failed to confirm artwork' });
  }
};

/**
 * Confirm Printing Status
 */

// export const confirmPrintingStatus = async (req, res) => {
//   const { campaignId } = req.params;
//   const { printingDate } = req.body;

//   try {
//     const updateData = {
//       'printingStatus.confirmed': true,
//       ...(printingDate && { 'printingStatus.printingDate': printingDate }),
//     };

//     const pipeline = await Pipeline.findOneAndUpdate(
//       { campaign: campaignId },
//       updateData,
//       { new: true }
//     );

//     if (!pipeline) {
//       return res.status(404).json({ error: 'Pipeline not found' });
//     }

//     res.status(200).json(pipeline);
//   } catch (error) {
//     console.error('Error confirming printing status:', error);
//     res.status(500).json({ error: error.message || 'Failed to confirm printing status' });
//   }
// };



export const confirmPrintingStatus = async (req, res) => {
  const { spaceId } = req.params;
  const {
    confirmed,
    printingDate,
    assignedPerson,
    assignedAgency,
    printingMaterial,
    note
  } = req.body;
  console.log("Payload recieved in backend is", req.body);
  try {
    const updateData = {
      'printingStatus.confirmed': confirmed ?? true,
      ...(printingDate && { 'printingStatus.printingDate': printingDate }),
      ...(assignedPerson && { 'printingStatus.assignedPerson': assignedPerson }),
      ...(assignedAgency && { 'printingStatus.assignedAgency': assignedAgency }),
      ...(printingMaterial && { 'printingStatus.printingMaterial': printingMaterial }),
      ...(note && { 'printingStatus.note': note }),
    };

    const updatedSpace = await Space.findByIdAndUpdate(
      spaceId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedSpace) {
      return res.status(404).json({ error: 'Space not found' });
    }

    res.status(200).json(updatedSpace);
  } catch (error) {
    console.error('Error confirming printing status:', error);
    res.status(500).json({ error: error.message || 'Failed to confirm printing status' });
  }
};

/**
 * Confirm Mounting Status
 */
// export const confirmMountingStatus = async (req, res) => {
//   const { campaignId } = req.params;
//   try {
//     const pipeline = await Pipeline.findOneAndUpdate(
//       { campaign: campaignId },
//       { 'mountingStatus.confirmed': true },
//       { new: true }
//     );
//     res.json(pipeline);
//   } catch (error) {
//     res.status(500).json({ error: error.message || 'Failed to confirm mounting status' });
//   }
// };

export const confirmMountingStatus = async (req, res) => {
  const { spaceId } = req.params;
  const {
    confirmed,
    receivedDate,
    assignedPerson,
    assignedAgency,
    note
  } = req.body;

  try {
    const updateData = {
      'mountingStatus.confirmed': confirmed ?? true,
      ...(receivedDate && { 'mountingStatus.mountingDate': receivedDate }),
      ...(assignedPerson && { 'mountingStatus.assignedPerson': assignedPerson }),
      ...(assignedAgency && { 'mountingStatus.assignedAgency': assignedAgency }),
      ...(note && { 'mountingStatus.note': note }),
    };

    const updatedSpace = await Space.findByIdAndUpdate(
      spaceId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedSpace) {
      return res.status(404).json({ error: 'Space not found' });
    }

    res.status(200).json(updatedSpace);
  } catch (error) {
    console.error('Error confirming mounting status:', error);
    res.status(500).json({ error: error.message || 'Failed to confirm mounting status' });
  }
};
// export const uploadInvoice = async (req, res) => {
//   try {
//     const campaignId = req.params.campaignId;

//     if (!req.file || !req.file.path) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }

//     // ✅ Upload to S3
//     let fileUrl = '';
//     try {
//       fileUrl = await uploadToS3(req.file.path, req.file.filename);
//     } catch (uploadErr) {
//       console.error('S3 upload failed:', uploadErr);
//       return res.status(500).json({ error: 'Failed to upload invoice to S3' });
//     }

//     // ✅ Update pipeline document with invoice URL
//     const pipeline = await Pipeline.findOneAndUpdate(
//       { campaign: campaignId },
//       { 'invoice.documentUrl': fileUrl },
//       { new: true }
//     );

//     if (!pipeline) {
//       return res.status(404).json({ error: 'Pipeline not found for this campaign' });
//     }

//     res.status(200).json(pipeline);
//   } catch (err) {
//     console.error('Invoice upload failed:', err);
//     res.status(500).json({ error: 'Server error during invoice upload' });
//   }
// };

// export const uploadInvoice = async (req, res) => {
//   try {
//     const campaignId = req.params.campaignId;
//     const files = req.files;
//     console.log("Incoming request body:", req.body);
//     console.log("Incoming files:", req.files);

//     // Find the pipeline by campaign ID
//     const pipeline = await Pipeline.findOne({ campaign: campaignId });
//     if (!pipeline) {
//       return res.status(404).json({ error: 'Pipeline not found for this campaign' });
//     }

//     // If no files are provided, skip the update and send a response
//     if (!files || files.length === 0) {
//       console.log('No invoice files uploaded – skipping update');
//       return res.status(200).json({ message: 'No invoice files provided, nothing updated.' });
//     }

//     // Ensure the invoice array exists
//     if (!Array.isArray(pipeline.invoice)) {
//       pipeline.invoice = [];
//     }

//     // Convert body data to arrays in case they are single values
//     const numbers = Array.isArray(req.body.invoiceNumber) ? req.body.invoiceNumber : [req.body.invoiceNumber];
//     const dates = Array.isArray(req.body.invoiceDate) ? req.body.invoiceDate : [req.body.invoiceDate];
//     const values = Array.isArray(req.body.invoiceValue) ? req.body.invoiceValue : [req.body.invoiceValue];

//     // Process each file and associate it with corresponding invoice data
//     for (let i = 0; i < files.length; i++) {
//       const fileUrl = await uploadToS3(files[i].path, files[i].filename);

//       // Validate and ensure that no empty data is being inserted
//       const invoiceData = {
//         invoiceNumber: numbers[i] || 'Default Invoice Number',
//         invoiceDate: dates[i] || 'Default Date',
//         invoiceValue: values[i] || 0,
//         documentUrl: fileUrl || 'default-url',  // Ensure a default URL is used if no file URL is provided
//       };

//       // Only push the invoice if it's valid (i.e., it has some non-default data)
//       if (invoiceData.invoiceNumber && invoiceData.invoiceDate && invoiceData.invoiceValue != 0) {
//         pipeline.invoice.push(invoiceData);
//       }
//     }

//     // Save the updated pipeline data
//     await pipeline.save();
//     res.status(200).json(pipeline);
//   } catch (err) {
//     console.error('Invoice upload failed:', err);
//     res.status(500).json({ error: 'Server error during invoice upload' });
//   }
// };


// export const uploadInvoice = async (req, res) => {
//   try {
//     const campaignId = req.params.campaignId;
//     const files = req.files;
//     console.log("Incoming request body:", req.body);
//     console.log("Incoming files:", req.files);

//     // Find the pipeline by campaign ID
//     const pipeline = await Pipeline.findOne({ campaign: campaignId });
    
//     if (!pipeline) {
//       console.log(`Pipeline with campaignId: ${campaignId} not found`);
//       return res.status(404).json({ error: 'Pipeline not found for this campaign' });
//     }

//     // If no files are provided, skip the update and send a response
//     if (!files || files.length === 0) {
//       console.log('No invoice files uploaded – skipping update');
//       return res.status(200).json({ message: 'No invoice files provided, nothing updated.' });
//     }

//     // Ensure the invoice array exists
//     if (!Array.isArray(pipeline.invoice)) {
//       pipeline.invoice = [];
//     }

//     // Convert body data to arrays in case they are single values
//     const numbers = Array.isArray(req.body.invoiceNumber) ? req.body.invoiceNumber : [req.body.invoiceNumber];
//     const dates = Array.isArray(req.body.invoiceDate) ? req.body.invoiceDate : [req.body.invoiceDate];
//     const values = Array.isArray(req.body.invoiceValue) ? req.body.invoiceValue : [req.body.invoiceValue];
// console.log("Numbers are",numbers);
// console.log("Dates are",dates);
// console.log("Values are",values);
//     // Ensure that the number of invoices matches the number of files
//     if (files.length !== numbers.length || files.length !== dates.length || files.length !== values.length) {
//       return res.status(400).json({ error: 'Mismatch between number of files and invoice data' });
//     }

//     // Process each file and associate it with corresponding invoice data
//     for (let i = 0; i < files.length; i++) {
//       const fileUrl = await uploadToS3(files[i].path, files[i].filename);

//       // Validate and ensure that no empty data is being inserted
//       const invoiceData = {
//         invoiceNumber: numbers[i] || 'Default Invoice Number',
//         invoiceDate: dates[i] || 'Default Date',
//         invoiceValue: values[i] || 0,
//         documentUrl: fileUrl || 'default-url',  // Ensure a default URL is used if no file URL is provided
//       };

//       console.log("Invoice Data being added:", invoiceData);

//       // Only push the invoice if it's valid (i.e., it has some non-default data)
//       if (invoiceData.invoiceNumber && invoiceData.invoiceDate && invoiceData.invoiceValue !== 0) {
//         pipeline.invoice.push(invoiceData);
//       } else {
//         console.log("Skipping invalid invoice data:", invoiceData);
//       }
//     }

//     // Save the updated pipeline data
//     try {
//       await pipeline.save();
//       console.log("Pipeline saved successfully:", pipeline);
//       res.status(200).json(pipeline);
//     } catch (err) {
//       console.error("Error while saving pipeline:", err);
//       res.status(500).json({ error: 'Error while saving pipeline to database' });
//     }

//   } catch (err) {
//     console.error('Invoice upload failed:', err);
//     res.status(500).json({ error: 'Server error during invoice upload' });
//   }
// };

export const uploadInvoice = async (req, res) => {
  try {
    const campaignId = req.params.campaignId;
    const files = req.files;
    console.log("Incoming request body:", req.body);
    console.log("Incoming files:", req.files);

    // Find the pipeline by campaign ID
    const pipeline = await Pipeline.findOne({ campaign: campaignId });
    
    if (!pipeline) {
      console.log(`Pipeline with campaignId: ${campaignId} not found`);
      return res.status(404).json({ error: 'Pipeline not found for this campaign' });
    }

    // If no files are provided, skip the update and send a response
    if (!files || files.length === 0) {
      console.log('No invoice files uploaded – skipping update');
      return res.status(200).json({ message: 'No invoice files provided, nothing updated.' });
    }

    // Ensure the invoice array exists
    if (!Array.isArray(pipeline.invoice)) {
      pipeline.invoice = [];
    }

    // Convert body data to arrays in case they are single values
    const numbers = Array.isArray(req.body.invoiceNumber) ? req.body.invoiceNumber : [req.body.invoiceNumber];
    const dates = Array.isArray(req.body.invoiceDate) ? req.body.invoiceDate : [req.body.invoiceDate];
    const values = Array.isArray(req.body.invoiceValue) ? req.body.invoiceValue : [req.body.invoiceValue];

    // Log the data
    console.log("Numbers are", numbers);
    console.log("Dates are", dates);
    console.log("Values are", values);

    // Only use the last value from each array
    const lastInvoiceNumber = numbers[numbers.length - 1];
    const lastInvoiceDate = dates[dates.length - 1];
    const lastInvoiceValue = values[values.length - 1];

    console.log("Using the last values - Invoice Number:", lastInvoiceNumber, "Invoice Date:", lastInvoiceDate, "Invoice Value:", lastInvoiceValue);

    // Ensure that the number of invoices matches the number of files
    if (files.length !== 1) {
      return res.status(400).json({ error: 'Expecting exactly one file for the last invoice data' });
    }

    // Process the file and associate it with the corresponding invoice data
    const fileUrl = await uploadToS3(files[0].path, files[0].filename);

    // Validate and ensure that no empty data is being inserted
    const invoiceData = {
      invoiceNumber: lastInvoiceNumber || 'Default Invoice Number',
      invoiceDate: lastInvoiceDate || 'Default Date',
      invoiceValue: lastInvoiceValue || 0,
      documentUrl: fileUrl || 'default-url',  // Ensure a default URL is used if no file URL is provided
    };

    console.log("Invoice Data being added:", invoiceData);

    // Only push the invoice if it's valid (i.e., it has some non-default data)
    if (invoiceData.invoiceNumber && invoiceData.invoiceDate && invoiceData.invoiceValue !== 0) {
      pipeline.invoice.push(invoiceData);
    } else {
      console.log("Skipping invalid invoice data:", invoiceData);
    }

    // Save the updated pipeline data
    try {
      await pipeline.save();
      console.log("Pipeline saved successfully:", pipeline);
      res.status(200).json(pipeline);
    } catch (err) {
      console.error("Error while saving pipeline:", err);
      res.status(500).json({ error: 'Error while saving pipeline to database' });
    }

  } catch (err) {
    console.error('Invoice upload failed:', err);
    res.status(500).json({ error: 'Server error during invoice upload' });
  }
};




// export const uploadCashMemo = async (req, res) => {
//   try {
//     const campaignId = req.params.campaignId;

//     if (!req.file || !req.file.path) {
//       return res.status(400).json({ error: 'No file uploaded for cash memo' });
//     }

//     // Upload to S3
//     let fileUrl = '';
//     try {
//       fileUrl = await uploadToS3(req.file.path, req.file.filename);  // Assuming uploadToS3 is implemented
//     } catch (uploadErr) {
//       console.error('S3 upload failed for cash memo:', uploadErr);
//       return res.status(500).json({ error: 'Failed to upload cash memo to S3' });
//     }

//     // Update pipeline with new cash memo details
//     const pipeline = await Pipeline.findOne({ campaign: campaignId });
//     if (!pipeline) {
//       return res.status(404).json({ error: 'Pipeline not found for this campaign' });
//     }

//     pipeline.cashMemo.push({
//       reference: req.body.reference,
//       value: req.body.value,
//       documentUrl: fileUrl,
//     });

//     await pipeline.save();
//     res.status(200).json(pipeline);
//   } catch (err) {
//     console.error('Cash memo upload failed:', err);
//     res.status(500).json({ error: 'Server error during cash memo upload' });
//   }
// };



// export const uploadCreditNote = async (req, res) => {
//   try {
//     const campaignId = req.params.campaignId;

//     if (!req.file || !req.file.path) {
//       return res.status(400).json({ error: 'No file uploaded for credit note' });
//     }

//     // Upload to S3
//     let fileUrl = '';
//     try {
//       fileUrl = await uploadToS3(req.file.path, req.file.filename);
//     } catch (uploadErr) {
//       console.error('S3 upload for credit note failed:', uploadErr);
//       return res.status(500).json({ error: 'Failed to upload credit note to S3' });
//     }

//     // Update pipeline document
//     const pipeline = await Pipeline.findOneAndUpdate(
//       { campaign: campaignId },
//       { 'creditNote.documentUrl': fileUrl },
//       { new: true }
//     );

//     if (!pipeline) {
//       return res.status(404).json({ error: 'Pipeline not found for this campaign' });
//     }

//     res.status(200).json(pipeline);
//   } catch (err) {
//     console.error('Credit note upload failed:', err);
//     res.status(500).json({ error: 'Server error during credit note upload' });
//   }
// };
// export const uploadCashMemo = async (req, res) => {
//   try {
//     const campaignId = req.params.campaignId;
//     const files = req.files;
//     console.log("Incoming request body for cash memo:", req.body);
//     console.log("Incoming files cash memo:", req.files);

//     const pipeline = await Pipeline.findOne({ campaign: campaignId });
//     if (!pipeline) {
//       return res.status(404).json({ error: 'Pipeline not found for this campaign' });
//     }

//     if (!files || files.length === 0) {
//       console.log('No cash memo files uploaded – skipping update');
//       return res.status(200).json({ message: 'No cash memo files provided, nothing updated.' });
//     }

//     if (!Array.isArray(pipeline.cashMemo)) {
//       pipeline.cashMemo = [];
//     }

//     const references = Array.isArray(req.body.reference) ? req.body.reference : [req.body.reference];
//     const values = Array.isArray(req.body.value) ? req.body.value : [req.body.value];

//     for (let i = 0; i < files.length; i++) {
//       const fileUrl = await uploadToS3(files[i].path, files[i].filename);

//       pipeline.cashMemo.push({
//         reference: references[i] || '',
//         value: values[i] || 0,
//         documentUrl: fileUrl,
//       });
//     }

//     await pipeline.save();
//     res.status(200).json(pipeline);
//   } catch (err) {
//     console.error('Cash memo upload failed:', err);
//     res.status(500).json({ error: 'Server error during cash memo upload' });
//   }
// };

export const uploadCashMemo = async (req, res) => {
  try {
    const campaignId = req.params.campaignId;
    const files = req.files;
    console.log("Incoming request body for cash memo:", req.body);
    console.log("Incoming files cash memo:", req.files);

    const pipeline = await Pipeline.findOne({ campaign: campaignId });
    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found for this campaign' });
    }

    if (!files || files.length === 0) {
      console.log('No cash memo files uploaded – skipping update');
      return res.status(200).json({ message: 'No cash memo files provided, nothing updated.' });
    }

    if (!Array.isArray(pipeline.cashMemo)) {
      pipeline.cashMemo = [];
    }

    // Accessing only the last value from the reference and value arrays
    const references = Array.isArray(req.body.reference) ? req.body.reference : [req.body.reference];
    const values = Array.isArray(req.body.value) ? req.body.value : [req.body.value];

    // Get last item in the arrays
    const lastReference = references[references.length - 1];
    const lastValue = values[values.length - 1];

    console.log("Using the last values for cash memo - Reference:", lastReference, "Value:", lastValue);

    // Ensure the number of files matches the number of cash memo entries
    if (files.length !== 1) {
      return res.status(400).json({ error: 'Expecting exactly one file for the last cash memo data' });
    }

    // Process the file and associate it with the corresponding cash memo data
    const fileUrl = await uploadToS3(files[0].path, files[0].filename);

    // Validate and ensure that no empty data is being inserted
    const cashMemoData = {
      reference: lastReference || 'Default Reference',
      value: lastValue || 0,
      documentUrl: fileUrl || 'default-url',  // Ensure a default URL is used if no file URL is provided
    };

    console.log("Cash Memo Data being added:", cashMemoData);

    // Only push the cash memo if it's valid (i.e., it has some non-default data)
    if (cashMemoData.reference && cashMemoData.value !== 0) {
      pipeline.cashMemo.push(cashMemoData);
    } else {
      console.log("Skipping invalid cash memo data:", cashMemoData);
    }

    // Save the updated pipeline data
    try {
      await pipeline.save();
      console.log("Pipeline saved successfully:", pipeline);
      res.status(200).json(pipeline);
    } catch (err) {
      console.error("Error while saving pipeline:", err);
      res.status(500).json({ error: 'Error while saving pipeline to database' });
    }

  } catch (err) {
    console.error('Cash memo upload failed:', err);
    res.status(500).json({ error: 'Server error during cash memo upload' });
  }
};

// export const uploadCreditNote = async (req, res) => {
//   try {
//     const campaignId = req.params.campaignId;
//     const files = req.files;

//     const pipeline = await Pipeline.findOne({ campaign: campaignId });
//     if (!pipeline) {
//       return res.status(404).json({ error: 'Pipeline not found for this campaign' });
//     }

//     // Gracefully exit if nothing to do
//     if (!files || files.length === 0) {
//       console.log('No credit note files uploaded – skipping update');
//       return res.status(200).json({ message: 'No credit note files provided, nothing updated.' });
//     }

//     if (!Array.isArray(pipeline.creditNote)) {
//       pipeline.creditNote = [];
//     }

//     const references = Array.isArray(req.body.reference) ? req.body.reference : [req.body.reference];
//     const values = Array.isArray(req.body.value) ? req.body.value : [req.body.value];

//     for (let i = 0; i < files.length; i++) {
//       const fileUrl = await uploadToS3(files[i].path, files[i].filename);

//       pipeline.creditNote.push({
//         reference: references[i] || '',
//         value: values[i] || 0,
//         documentUrl: fileUrl,
//       });
//     }

//     await pipeline.save();
//     res.status(200).json(pipeline);
//   } catch (err) {
//     console.error('Credit note upload failed:', err);
//     res.status(500).json({ error: 'Server error during credit note upload' });
//   }
// };


export const uploadCreditNote = async (req, res) => {
  try {
    const campaignId = req.params.campaignId;
    const files = req.files;

    console.log("Incoming request body for credit note:", req.body);
    console.log("Incoming files credit note:", req.files);

    // Find the pipeline by campaign ID
    const pipeline = await Pipeline.findOne({ campaign: campaignId });
    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found for this campaign' });
    }

    // Gracefully exit if nothing to do
    if (!files || files.length === 0) {
      console.log('No credit note files uploaded – skipping update');
      return res.status(200).json({ message: 'No credit note files provided, nothing updated.' });
    }

    if (!Array.isArray(pipeline.creditNote)) {
      pipeline.creditNote = [];
    }

    // Access only the last value from the reference and value arrays
    const references = Array.isArray(req.body.reference) ? req.body.reference : [req.body.reference];
    const values = Array.isArray(req.body.value) ? req.body.value : [req.body.value];

    // Get the last entry from each array
    const lastReference = references[references.length - 1];
    const lastValue = values[values.length - 1];

    console.log("Using the last values for credit note - Reference:", lastReference, "Value:", lastValue);

    // Ensure the number of files matches the number of credit note entries
    if (files.length !== 1) {
      return res.status(400).json({ error: 'Expecting exactly one file for the last credit note data' });
    }

    // Process the file and associate it with the corresponding credit note data
    const fileUrl = await uploadToS3(files[0].path, files[0].filename);

    // Validate and ensure that no empty data is being inserted
    const creditNoteData = {
      reference: lastReference || 'Default Reference',
      value: lastValue || 0,
      documentUrl: fileUrl || 'default-url',  // Ensure a default URL is used if no file URL is provided
    };

    console.log("Credit Note Data being added:", creditNoteData);

    // Only push the credit note if it's valid (i.e., it has some non-default data)
    if (creditNoteData.reference && creditNoteData.value !== 0) {
      pipeline.creditNote.push(creditNoteData);
    } else {
      console.log("Skipping invalid credit note data:", creditNoteData);
    }

    // Save the updated pipeline data
    try {
      await pipeline.save();
      console.log("Pipeline saved successfully:", pipeline);
      res.status(200).json(pipeline);
    } catch (err) {
      console.error("Error while saving pipeline:", err);
      res.status(500).json({ error: 'Error while saving pipeline to database' });
    }

  } catch (err) {
    console.error('Credit note upload failed:', err);
    res.status(500).json({ error: 'Server error during credit note upload' });
  }
};


export const updateInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      invoiceDate,
      invoiceValue,
      cashMemoRef,
      cashMemoValue,
      creditNoteRef,
      creditNoteValue
    } = req.body;

    const campaignId = req.params.campaignId;

    const updateData = {
      ...(invoiceNumber && { 'invoice.invoiceNumber': invoiceNumber }),
      ...(invoiceDate && { 'invoice.invoiceDate': invoiceDate }),
      ...(invoiceValue && { 'invoice.invoiceValue': invoiceValue }),
      ...(cashMemoRef && { 'cashMemo.reference': cashMemoRef }),
      ...(cashMemoValue && { 'cashMemo.value': cashMemoValue }),
      ...(creditNoteRef && { 'creditNote.reference': creditNoteRef }),
      ...(creditNoteValue && { 'creditNote.value': creditNoteValue }),
    };


    const pipeline = await Pipeline.findOneAndUpdate(
      { campaign: campaignId },
      { $set: updateData }, // ✅ important
      { new: true }
    );

    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });

    res.status(200).json(pipeline);
  } catch (err) {
    console.error('Error updating invoice details:', err);
    res.status(500).json({ error: 'Server error during invoice update' });
  }
};





export const updatePayment = async (req, res) => {
  try {
    const campaignId = req.params.campaignId;
    const {
      totalAmount,
      payments = [],
      totalPaid,
      paymentDue,
      gstValue,
      finalAmountWithGST,
      displayAmount,
      printingAmount,
      mountingAmount
    } = req.body;

    const pipeline = await Pipeline.findOneAndUpdate(
      { campaign: campaignId },
      {
        payment: {
          displayAmount,
          printingAmount,
          mountingAmount,
          totalAmount,
          gstValue,
          finalAmountWithGST,
          payments,
          totalPaid,
          paymentDue
        }
      },
      { new: true }
    );

    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });

    res.status(200).json(pipeline);
  } catch (err) {
    console.error('Error updating payment:', err);
    res.status(500).json({ error: 'Server error during payment update' });
  }
};

export const uploadPoDocument = async (req, res) => {
  try {
    const campaignId = req.params.campaignId;

    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // ✅ Upload to S3
    let fileUrl = '';
    try {
      fileUrl = await uploadToS3(req.file.path, req.file.filename); // returns public S3 URL
    } catch (uploadErr) {
      console.error('S3 upload failed:', uploadErr);
      return res.status(500).json({ error: 'Failed to upload PO document to S3' });
    }

    // ✅ Save public S3 URL to pipeline.po.documentUrl
    const pipeline = await Pipeline.findOneAndUpdate(
      { campaign: campaignId },
      { 'po.documentUrl': fileUrl },
      { new: true }
    );

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    res.status(200).json(pipeline);
  } catch (err) {
    console.error('Error uploading PO document:', err);
    res.status(500).json({ error: 'Server error during PO upload' });
  }
};

// ✅ Confirm PO received (updates po.confirmed: true)

export const confirmPoStatus = async (req, res) => {
  try {
    const campaignId = req.params.campaignId;
    const {
      confirmed,
      poNumber,
      poDate,
      poValue
    } = req.body;

    const updateData = {
      'po.confirmed': confirmed === true || confirmed === 'true',
      ...(poNumber && { 'po.poNumber': poNumber }),
      ...(poDate && { 'po.poDate': poDate }),
      ...(poValue && { 'po.poValue': poValue }),
    };

    const pipeline = await Pipeline.findOneAndUpdate(
      { campaign: campaignId },
      updateData,
      { new: true }
    );

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    res.status(200).json(pipeline);
  } catch (err) {
    console.error('Error confirming PO status:', err);
    res.status(500).json({ error: 'Server error during PO confirmation' });
  }
};


export const deletePipelineAndCleanup = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const pipeline = await Pipeline.findOne({ campaign: campaignId });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    // Reset statuses in each space including DOOH nodes
    if (Array.isArray(pipeline.spaces)) {
      await Promise.all(
        pipeline.spaces.map(async (spaceId) => {
          await Space.findByIdAndUpdate(spaceId, {
            $set: {
              'printingStatus.confirmed': false,
              'mountingStatus.confirmed': false,
              'digitalStatus.confirmed': false,
              'digitalStatus.isLive': false
            }
          });
        })
      );
    }

    // Delete pipeline
    await Pipeline.deleteOne({ _id: pipeline._id });

    return res.status(200).json({ message: 'Pipeline and associated space statuses deleted successfully' });
  } catch (err) {
    console.error('Error deleting pipeline:', err);
    return res.status(500).json({ error: 'Server error during pipeline deletion' });
  }
};


// export const deletePipelineAndCleanup = async (req, res) => {
//   const { campaignId } = req.params;

//   try {
//     const pipeline = await Pipeline.findOne({ campaign: campaignId });

//     if (!pipeline) {
//       return res.status(404).json({ error: 'Pipeline not found' });
//     }

//     // Optional cleanup: reset statuses in each space
//     if (Array.isArray(pipeline.spaces)) {
//       await Promise.all(
//         pipeline.spaces.map(async (spaceId) => {
//           await Space.findByIdAndUpdate(spaceId, {
//             $set: {
//               'printingStatus.confirmed': false,
//               'mountingStatus.confirmed': false
//             }
//           });
//         })
//       );
//     }

//     // Delete pipeline
//     await Pipeline.deleteOne({ _id: pipeline._id });

//     return res.status(200).json({ message: 'Pipeline and associated space statuses deleted successfully' });
//   } catch (err) {
//     console.error('Error deleting pipeline:', err);
//     return res.status(500).json({ error: 'Server error during pipeline deletion' });
//   }
// };