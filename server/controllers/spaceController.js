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
    const price = parseFloat(body.price);
    const footfall = parseInt(body.footfall);
    let unit = parseInt(body.unit, 10);
    if (isNaN(unit)) {
      unit = 1;
    }

    const maxUnitMap = {
      Billboard: 1,
      DOOH: 10,
      'Pole kiosk': 10,
      Gantry: 1,
      BQS: 1,
      Miscellaneous: 1,
    };

    const allowedUnit = maxUnitMap[body.spaceType];
    if (allowedUnit !== undefined && unit > allowedUnit) {
      return res.status(400).json({
        error: `Unit exceeds limit. Max allowed units for ${body.spaceType} is ${allowedUnit}.`,
      });
    }

    // ✅ Safe upload helper
    // const safeUpload = async (file) => {
    //   if (file && file.path) {
    //     console.log("Uploading:", file.path);
    //     return await uploadToS3(file.path, file.filename);
    //   }
    //   return null;
    // };
    // const safeUpload = async (file) => {
    //   if (file && file.path) {
    //     console.log("Uploading:", file.path);
    
    //     // Move the file to the /tmp directory temporarily before uploading to S3
    //     // const tmpPath = path.join('/tmp', file.filename);
    //     const tmpPath = path.join(__dirname, '../tmp', file.filename); // matches multer

    
    //     // Use fs.promises to handle file copy asynchronously
    //     await fs.promises.copyFile(file.path, tmpPath);
    
    //     // Now, upload the file to S3
    //     return await uploadToS3(tmpPath, file.filename);
    //   }
    //   return null;
    // };
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

    const space = new Space({
      isInventoryEnabled: true,
      ...body,
      price,
      footfall,
      unit,
      traded: body.traded === 'true',
      mainPhoto: mainPhotoUrl,
      longShot: longShotUrl,
      closeShot: closeShotUrl,
      otherPhotos: otherPhotosUrls,
      dates: [body.startDate, body.endDate],
    });

    const saved = await space.save();
    console.log("✅ Saved Space:", saved); // <-- Add this
    res.status(201).json({ message: 'Space created', data: saved });
  } catch (error) {
    console.error("Create Space Error:", error.message);
    res.status(500).json({ error: 'Failed to create space', details: error.message });
  }
};
