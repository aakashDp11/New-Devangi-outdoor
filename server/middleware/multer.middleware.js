

// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import { fileURLToPath } from "url";
// import { dirname } from "path";

// // Get current file path context
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // ✅ ABSOLUTE PATH to /uploads
// const uploadPath = path.join(__dirname, "../uploads");

// // ✅ Ensure uploads folder exists
// if (!fs.existsSync(uploadPath)) {
//   fs.mkdirSync(uploadPath, { recursive: true });
// }

// // ✅ Optional: Restrict file types
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png|webp/;
//   const ext = path.extname(file.originalname).toLowerCase();
//   if (allowedTypes.test(ext)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only JPG, PNG, and WEBP images are allowed"));
//   }
// };

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadPath); // ✅ Absolute path
//   },
//   filename: function (req, file, cb) {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// const upload = multer({
//   storage,
//   limits: {
//     fieldSize: 5 * 1024 * 1024,
//     fileSize: 10 * 1024 * 1024,
//     files: 10,
//     fields: 50,
//   },
//   // fileFilter,
// });

// export default upload;

import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const isAWSLambdaEnv=process.env.IS_AWS_LAMBDA_ENV;
console.log("Lambda environment in s3uploader.js",isAWSLambdaEnv);
// Get current file path context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ For Lambda, write to the /tmp directory
const uploadPath = '/tmp';

//  const uploadPath = path.join(__dirname, "../tmp"); // Lambda's writable directory

// const uploadPath = process.env.IS_LAMBDA === 'true'
//   ? '/tmp'
//   : path.join(__dirname, '../tmp');

console.log('Upload path:', uploadPath);

// ✅ Ensure uploads folder exists (for local development; Lambda doesn't require this)
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// ✅ Optional: Restrict file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, and WEBP images are allowed"));
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath); // ✅ Use /tmp directory for Lambda
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fieldSize: 5 * 1024 * 1024,
    fileSize: 10 * 1024 * 1024,
    files: 10,
    fields: 50,
  },
  fileFilter, // Ensure file types are validated if needed
});

export default upload;


