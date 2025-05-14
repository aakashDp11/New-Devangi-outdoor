import Space from "../models/space.model.js";

// export const createSpace = async (req, res) => {
//   try {
//     const {
//       body,
//       files: { mainPhoto, longShot, closeShot, otherPhotos },
//     } = req;
//     // console.log("BODY:", req.body);
//     // console.log("FILES:", req.files);
    
//     const space = new Space({
//       ...body,
//       price: parseFloat(body.price),
//       footfall: parseInt(body.footfall),
//       mainPhoto: mainPhoto?.[0]?.filename,
//       longShot: longShot?.[0]?.filename,
//       closeShot: closeShot?.[0]?.filename,
//       otherPhotos: otherPhotos?.map((f) => f.filename) || [],
//     });
//     console.log("SPACE TO SAVE:", space);
//     const saved = await space.save();
//     console.log("Done file saved");
//     res.status(201).json({ message: 'Space created', data: saved });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to create space', details: error.message });
//   }
// };

export const createSpace = async (req, res) => {
    try {
      const {
        body,
        files: { mainPhoto, longShot, closeShot, otherPhotos },
      } = req;
  
      // Convert to numbers
      const price = parseFloat(body.price);
      const footfall = parseInt(body.footfall);
      const unit = parseInt(body.unit);
  
      // Backend validation: Enforce unit limits
      const maxUnitMap = {
        Billboard: 2,
        DOOH: 10,
        'Pole kiosk': 10,
        Gantry: 1,
      };
      const allowedUnit = maxUnitMap[body.spaceType];
      if (allowedUnit !== undefined && unit > allowedUnit) {
        return res.status(400).json({
          error: `Unit exceeds limit. Max allowed units for ${body.spaceType} is ${allowedUnit}.`,
        });
      }
  
      const space = new Space({
        ...body,
        price,
        footfall,
        unit,
        traded: body.traded === 'true', // Convert from string to boolean
        mainPhoto: mainPhoto?.[0]?.filename,
        longShot: longShot?.[0]?.filename,
        closeShot: closeShot?.[0]?.filename,
        otherPhotos: otherPhotos?.map((f) => f.filename) || [],
      });
  
      const saved = await space.save();
      res.status(201).json({ message: 'Space created', data: saved });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create space', details: error.message });
    }
  };