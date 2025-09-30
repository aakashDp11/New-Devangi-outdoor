import Space from "../models/space.model.js";
import { uploadToS3 } from "../utils/s3uploader.js";
import path from 'path';
import fs from 'fs';

import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const createSpace = async (req, res) => {
  try {
    const { body, files } = req;
    console.log("Incoming Space body is", body);

    // --- MODIFICATION: Create a payload object and parse all numeric fields ---
    const payload = { ...body };

    if (payload.price) payload.price = parseFloat(payload.price);
    if (payload.buyingPrice) payload.buyingPrice = parseFloat(payload.buyingPrice);
    if (payload.sellingPrice) payload.sellingPrice = parseFloat(payload.sellingPrice);
    if (payload.footfall) payload.footfall = parseInt(payload.footfall, 10);
    
    const unit = parseInt(payload.unit, 10);
    payload.unit = isNaN(unit) ? 1 : unit; // Default to 1 if unit is not a valid number
    // --- END MODIFICATION ---

    const maxUnitMap = {
      Billboard: 1,
      DOOH: 10,
      'Pole kiosk': 1,
      Gantry: 1,
      BQS: 1,
      DigitalBQS:1,
      Transit: 1, // Add Transit with a unit limit
      Miscellaneous: 1,
    };

    const allowedUnit = maxUnitMap[body.spaceType];
    if (allowedUnit !== undefined && payload.unit > allowedUnit) { // Use payload.unit for check
      return res.status(400).json({
        error: `Unit exceeds limit. Max allowed units for ${body.spaceType} is ${allowedUnit}.`,
      });
    }

    const safeUpload = async (file) => {
      if (file && file.path) {
        console.log("Uploading original multer file:", file.path);
        const uploadedUrl = await uploadToS3(file.path, file.filename);
        return uploadedUrl;
      }
      return null;
    };
    
    const mainPhotoUrl = await safeUpload(files?.mainPhoto?.[0]);
    const longShotUrl = await safeUpload(files?.longShot?.[0]);
    const closeShotUrl = await safeUpload(files?.closeShot?.[0]);

    const otherPhotos = files?.otherPhotos || [];
    const otherPhotosUrls = await Promise.all(
      otherPhotos.map((file) => safeUpload(file))
    );

    // --- MODIFICATION: Use the processed 'payload' object instead of 'body' ---
    const space = new Space({
      isInventoryEnabled: true,
      ...payload, // Use the payload with correctly typed numbers
      traded: body.traded === 'true',
      mainPhoto: mainPhotoUrl,
      longShot: longShotUrl,
      closeShot: closeShotUrl,
      otherPhotos: otherPhotosUrls,
      dates: [body.startDate, body.endDate],
    });
    // --- END MODIFICATION ---

    const saved = await space.save();
    console.log("✅ Saved Space:", saved);
    res.status(201).json({ message: 'Space created', data: saved });
  } catch (error) {
    console.error("Create Space Error:", error.message);
    res.status(500).json({ error: 'Failed to create space', details: error.message });
  }
};