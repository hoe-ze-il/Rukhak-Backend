/**
 * @file This file is used to filter and validate file before we call S3 functions to upload/delete
 */

import multer from "multer";
import APIError from "../utils/APIError.js";
import multerS3 from "multer-s3";
import s3Client from "./s3.js";

const productMediaStorage = multer.memoryStorage();

// Multer File Filter config
const productMediaFilter = (req, file, cb) => {
  if (["png", "jpg", "jpeg"].includes(file.mimetype.split("/")[1]))
    cb(null, true);
  else
    cb(
      new APIError({ status: 400, message: "File must be in png or jpg." }),
      false
    );
};

// Create the Multer middleware
export const productMediaUpload = multer({
  storage: productMediaStorage,
  fileFilter: productMediaFilter,
  // limits: {
  //   fileSize: 1000000, //1MB ~ 1million bytes
  // },
});

// Config s3 as storage of multer directly
export const mediaUpload = (bucket, subdir) =>
  multer({
    storage: multerS3({
      s3: s3Client,
      bucket,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        cb(
          null,
          `${subdir}/media/${Date.now().toString()}${file.originalname}`
        );
      },
    }),
  }).array("media");
