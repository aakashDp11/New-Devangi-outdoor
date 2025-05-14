// import multer from "multer";

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, "../server/uploads");
//     },
//     filename: function (req, file, cb) {
//       cb(null, `${Date.now()}-${file.originalname}`);
//     },
//   });
//   const upload = multer({ storage });
//   export default upload;

import multer from "multer";
import path from "path";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../server/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and WEBP images are allowed"));
    }
  };
const upload = multer({
  storage,
  limits: {
    fieldSize: 5 * 1024 * 1024, // 5 MB per field (increase as needed)
    fileSize: 10 * 1024 * 1024, // 10 MB per file
    files: 10, // Max 10 files
    fields: 50, // Max 50 non-file fields
  },
  fileFilter
});

export default upload;
