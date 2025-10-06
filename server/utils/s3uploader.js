

import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import dotenv from 'dotenv';

// dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// const isAWSLambdaEnv=process.env.IS_AWS_LAMBDA_ENV;
// console.log("Lambda environment in s3uploader.js",isAWSLambdaEnv);
// if(!isAWSLambdaEnv){
// AWS.config.update({
//   region: 'ap-south-1',
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
// });
// }


// const s3 = new AWS.S3();
const s3 = new AWS.S3({ region: 'ap-south-1' });

export const uploadToS3 = async (localFilePath, s3Key) => {
  try {
    // ✅ Confirm file still exists
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`File does not exist at path: ${localFilePath}`);
    }

    const fileContent = fs.readFileSync(localFilePath);
    const contentType = mime.lookup(localFilePath) || 'application/octet-stream';

    const params = {
      Bucket: 'devangi-doa',
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
    
    };
    const data = await s3.upload(params).promise();
  

    // ✅ Only delete after successful upload
    const absolutePath = path.resolve(localFilePath);
    try {
      fs.unlinkSync(absolutePath);
      console.log("Deleted local file:", absolutePath);
    } catch (unlinkError) {
      console.warn(`Could not delete file ${absolutePath}`, unlinkError);
    }
    

    return data.Location;
  } catch (error) {
    console.error("S3 Upload Error:", error.message);
    throw error;
  }
};
