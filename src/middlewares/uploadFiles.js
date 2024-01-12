import { productMediaUpload } from "../config/multer.js";

export const uploadProductMedia = productMediaUpload.fields([
  { name: "imgCover", maxCount: 1 },
  { name: "media", maxCount: 3 },
  { name: "profilePicture", maxCount: 1 },
]);
