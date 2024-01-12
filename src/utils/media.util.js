import { deleteFile, getFileSignedUrl } from "@/config/s3.js";

const MediaUtil = {
  async cleanup(files) {
    if (files.length > 0) {
      await Promise.all(files.map(async (file) => await deleteFile(file.src)));
    }
  },

  async getMediaUrls(mediaFiles) {
    const mediaUrls = await Promise.all(
      mediaFiles.map(async (file) => {
        return { src: await getFileSignedUrl(file.src) };
      })
    );
    return mediaUrls;
  },
};

export default MediaUtil;
