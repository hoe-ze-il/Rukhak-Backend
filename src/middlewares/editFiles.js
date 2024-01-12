import { productMediaUpload } from "../config/multer.js";

export const editProductMedia = productMediaUpload.fields([
  { name: "imgCover", maxCount: 1 },
  { name: "newMedia" },
]);
