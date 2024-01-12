import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();

const { AWS_BUCKET_NAME, AWS_BUCKET_REGION, AWS_ACCESS_KEY, AWS_SECRET_KEY } =
  process.env;

const s3Client = new S3Client({
  region: AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY,
  },
});

/**
 * function to upload file to S3
 * @param {Buffer} fileBuffer
 * @param {String} fileName
 * @param {String} mimetype
 * @returns {Promise} Promise that resolves the upload process
 */
export async function uploadFile(fileBuffer, fileName, mimetype) {
  const uploadParams = {
    Bucket: AWS_BUCKET_NAME,
    Body: fileBuffer,
    Key: fileName,
    ContentType: mimetype,
  };

  return await s3Client.send(new PutObjectCommand(uploadParams));
}

/**
 * Function to delete a file from S3 bucket
 * @param {String} fileName
 * @returns {Promise} Promise that resolves the deletion process
 */
export async function deleteFile(fileName) {
  const deleteParams = {
    Bucket: AWS_BUCKET_NAME,
    Key: fileName,
  };
  try{
    await s3Client.send(new DeleteObjectCommand(deleteParams));
  }catch(err){
    console.log(err)
  }
}

/**
 * Function to get signed URL
 * @param {String} fileName
 * @param {Number} duration - in seconds
 */
export async function getFileSignedUrl(fileName, duration = 3600) {
  const params = {
    Bucket: AWS_BUCKET_NAME,
    Key: fileName,
  };

  const command = new GetObjectCommand(params);
  const url = await getSignedUrl(s3Client, command, { expiresIn: duration });

  return url;
}

export default s3Client;
