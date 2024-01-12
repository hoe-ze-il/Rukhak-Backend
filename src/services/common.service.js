// Import necessary modules
import mongoose from "mongoose";
import APIError from "@/utils/APIError.js";
import MediaUtil from "@/utils/media.util.js";
import APIFeatures from "@/utils/APIFeatures.js";

/**
 * Creates a service for CRUD operations on a given Mongoose model.
 * @param {mongoose.Model} Model - The Mongoose model for which the service is created.
 * @returns {Object} - The service object with CRUD methods.
 */
const createService = (Model) => {
  // Service object containing CRUD methods
  const service = {
    /**
     * Retrieves all items from the database based on optional query parameters.
     * @param {string} queryString - The optional query string for filtering, sorting, and pagination.
     * @returns {Promise<Array>} - A promise resolving to an array of retrieved items.
     */
    async getAll(queryString, populateField) {
      // Create API features based on query parameters
      const features = new APIFeatures(Model, queryString)
        .search()
        .filter()
        .sort()
        .limitFields()
        .paginate();

      // Execute features and return items
      let [items] = await features.execute();
      if (!items) {
        throw new APIError({ status: 404, message: "No ducuments Found" });
      }
      if (populateField) {
        items.docs = await Model.populate(items.docs, {
          path: populateField,
          select: [
            "firstName",
            "lastName",
            "imageURL",
            "storeName",
            "role",
            "email",
          ],
        });
      }
      // items.docs.map(async (item) => {
      //   if (item.author.profilePicture) {
      //     console.log(item.author.profilePicture);
      //   }
      // });
      // items.docs = await Promise.all(
      //   items.docs.map(async (item) => {
      //     if (item.author.profilePicture) {
      //       item.author.profilePicture = await MediaUtil.getMediaUrls(
      //         "profilePictures/1f2b5de5342cd3ae499493a2daa7bd0a_Plants_seller.jpeg"
      //       );
      //       console.log(item.author.profilePicture);
      //     }
      //     console.log("after", item);
      //   })
      // );

      items.docs.media = await Promise.all(
        items?.docs.map(async (item) => {
          const { media } = item;

          if (!media.isEmpty) {
            item.media = await MediaUtil.getMediaUrls(media);
          }
        })
      );
      return items;
    },

    /**
     * Retrieves a single item by its ID.
     * @param {string} id - The ID of the item to retrieve.
     * @returns {Promise<Object>} - A promise resolving to the retrieved item.
     * @throws {APIError} - Throws a 404 error if the item is not found.
     */
    async get(id) {
      // Find item by ID
      const item = await Model.findById(id);
      if (!item) {
        // Throw a 404 error if the item is not found
        throw new APIError({
          status: 404,
          message: `No ${Model.modelName} Found with this ID`,
        });
      }

      return item;
    },

    /**
     * Creates a new item in the database.
     * @param {Object} itemBody - The data for the new item.
     * @returns {Promise<Object>} - A promise resolving to the newly created item.
     * @throws {APIError} - Throws an error if the creation fails.
     */
    async create(itemBody) {
      try {
        // Create a new item using the provided model
        const newItem = await Model.create(itemBody);
        return newItem;
      } catch (error) {
        throw new APIError({ status: 400, message: error.message });
      }
    },

    /**
     * Updates an existing item in the database by its ID.
     * @param {string} id - The ID of the item to update.
     * @param {Object} itemBody - The data with which to update the item.
     * @returns {Promise<Object>} - A promise resolving to the updated item.
     * @throws {APIError} - Throws an error if the update fails.
     */
    async update(id, itemBody) {
      // Start a Mongoose session for the transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Find the item by ID within the session
        const item = await Model.findById(id).session(session);
        if (!item) {
          // Throw a 404 error if the item is not found
          throw new APIError({
            status: 404,
            message: `No ${Model.modelName} Found with this ID`,
          });
        }

        // Exclude 'media' from the fields to update
        const fieldsToUpdate = Object.keys(itemBody).filter(
          (field) => field !== "media"
        );

        // Update fields other than 'media'
        fieldsToUpdate.forEach((field) => {
          item[field] = itemBody[field];
        });

        // Handle media updates (additions and deletions)
        const { media } = itemBody;
        if (media) {
          let deletedMedia = [];
          if (media.length !== item.media.length) {
            const filteredMedia = item.media.filter((item) =>
              media.includes(item)
            );
            deletedMedia = item.media.filter((item) => !media.includes(item));
            item.media = filteredMedia;
          }

          if (media && media.length > 0) {
            item.media = item.media.concat(
              await MediaUtil.processMediaFiles(media)
            );
          }

          if (deletedMedia.length > 0) {
            await MediaUtil.cleanup(deletedMedia);
          }
        }

        // Save the updated item within the session
        await item.save({ session });
        await session.commitTransaction();
        return item;
      } catch (error) {
        // Handle errors, abort transaction, and throw APIError
        await session.abortTransaction();
        throw new APIError({
          status: 500,
          message: "Something went wrong! Cannot update the item.",
        });
      } finally {
        // End the session
        session.endSession();
      }
    },

    /**
     * Deletes an item from the database by its ID.
     * @param {string} id - The ID of the item to delete.
     * @returns {Promise<null>} - A promise indicating successful deletion.
     * @throws {APIError} - Throws a 404 error if the item is not found.
     */
    async delete(id) {
      // Find and delete the item by ID
      const item = await Model.findByIdAndDelete(id);
      await MediaUtil.cleanup(item.media);
      if (!item) {
        // Throw a 404 error if the item is not found
        throw new APIError({
          status: 404,
          message: `No ${Model.modelName} Found with this ID`,
        });
      }
      return null; // Indicate successful deletion
    },
  };

  return service; // Return the service object
};

export default createService;
