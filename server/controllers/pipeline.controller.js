import Pipeline from '../models/pipeline.model.js';

export const createPipelineForBooking = async (req, res) => {
  try {
    // console.log("create Pipeline");
    const { id } = req.params;
    console.log("create pipleine",id);
    const newPipeline = new Pipeline({ booking: id });
    await newPipeline.save();
    res.status(201).json(newPipeline);
  } catch (err) {
    res.status(500).json({ message: 'Error creating pipeline', error: err.message });
  }
};

export const getPipelineByBooking = async (req, res) => {
    console.log("getPipeline");
  try {
    const pipeline = await Pipeline.findOne({ booking: req.params.id });
    if (!pipeline) return res.status(404).json({ message: 'Pipeline not found' });
    res.json(pipeline);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pipeline', error: err.message });
  }
};

// export const updatePipelineStep = async (req, res) => {
//   const { bookingId, step } = req.params;
//   const updateData = req.body;

//   try {
//     const pipeline = await Pipeline.findOneAndUpdate(
//       { booking: bookingId },
//       { $set: { [step]: updateData } },
//       { new: true, runValidators: true }
//     );

//     if (!pipeline) return res.status(404).json({ message: 'Pipeline not found' });

//     res.json(pipeline);
//   } catch (err) {
//     res.status(500).json({ message: `Error updating step: ${step}`, error: err.message });
//   }
// };
export const updatePipelineStep = async (req, res) => {
    const { bookingId, step } = req.params;
    const updateData = req.body;
  
    try {
      const setObj = {};
  
      // For nested objects like invoice, po, artwork — do a field-wise set
      if (['invoice', 'po', 'artwork'].includes(step) && typeof updateData === 'object') {
        for (const key in updateData) {
          setObj[`${step}.${key}`] = updateData[key];
        }
      } else {
        // For flat fields like bookingStatus or printingStatus
        setObj[step] = updateData;
      }
  
      const pipeline = await Pipeline.findOneAndUpdate(
        { booking: bookingId },
        { $set: setObj },
        { new: true, runValidators: true }
      );
  
      if (!pipeline) return res.status(404).json({ message: 'Pipeline not found' });
  
      res.json(pipeline);
    } catch (err) {
      res.status(500).json({ message: `Error updating step: ${step}`, error: err.message });
    }
  };
  
  export const deletePipelineByBookingId = async (req, res) => {
    const { bookingId } = req.params;
  
    try {
      const deleted = await Pipeline.findOneAndDelete({ booking: bookingId });
      if (!deleted) {
        return res.status(404).json({ message: 'Pipeline not found' });
      }
      res.status(200).json({ message: 'Pipeline deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Failed to delete pipeline', error: err.message });
    }
  };
  

// export const uploadStepFile = async (req, res) => {
//     const { bookingId, step } = req.params;
//     const file = req.file;
  
//     if (!file) {
//       return res.status(400).json({ message: 'No file uploaded' });
//     }
  
//     const fileUrl = `/uploads/${file.filename}`; // Relative URL for frontend use
  
//     const fieldMap = {
//       artwork: 'artwork.documentUrl',
//       po: 'po.documentUrl',
//       invoice: 'invoice.documentUrl',
//     };
  
//     const targetField = fieldMap[step];
//     if (!targetField) {
//       return res.status(400).json({ message: 'Invalid step for upload' });
//     }
  
//     try {
//       const update = {};
//       console.log('Uploading file to field:', targetField);
//       console.log('File URL:', fileUrl);
//       const stepUpdate = {};

// if (step === 'invoice') {
//   stepUpdate['invoice.documentUrl'] = fileUrl;
// } else if (step === 'po') {
//   stepUpdate['po.documentUrl'] = fileUrl;
// } else if (step === 'artwork') {
//   stepUpdate['artwork.documentUrl'] = fileUrl;
// } else {
//   return res.status(400).json({ message: 'Invalid step' });
// }
      
//       const pipeline = await Pipeline.findOneAndUpdate(
//         { booking: bookingId },
//         { $set: update },
//         { new: true }
//       );
  
//       if (!pipeline) return res.status(404).json({ message: 'Pipeline not found' });
  
//       res.status(200).json({ message: 'File uploaded successfully', fileUrl, pipeline });
//     } catch (err) {
//       res.status(500).json({ message: 'Upload failed', error: err.message });
//     }
//   };
  

export const uploadStepFile = async (req, res) => {
    const { bookingId, step } = req.params;
    const file = req.file;
  
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
  
    const fileUrl = `/uploads/${file.filename}`;
  
    // Ensure only allowed fields are touched
    const stepFieldMap = {
      artwork: 'artwork.documentUrl',
      po: 'po.documentUrl',
      invoice: 'invoice.documentUrl',
    };
  
    const targetField = stepFieldMap[step];
  
    if (!targetField) {
      return res.status(400).json({ message: 'Invalid step for upload' });
    }
  
    try {
      // 👇 this ensures deep update without overwriting other invoice fields
      const update = {};
      update[targetField] = fileUrl;
  
      const pipeline = await Pipeline.findOneAndUpdate(
        { booking: bookingId },
        { $set: update },
        { new: true }
      );
  
      if (!pipeline) {
        return res.status(404).json({ message: 'Pipeline not found' });
      }
  
      return res.status(200).json({
        message: 'File uploaded successfully',
        fileUrl,
        pipeline,
      });
    } catch (err) {
      return res.status(500).json({ message: 'Upload failed', error: err.message });
    }
  };
  