/**
 * @file product.service.js
 * @description This module provides functions to interact with product data in the application. It includes methods for creating, retrieving, updating, and deleting products.
 */
import mongoose from "mongoose";
import Product from "@/models/product.model.js";
import blurText from "@/utils/blurText.js";
import APIError from "@/utils/APIError.js";
import APIFeatures from "@/utils/APIFeatures.js";
import { deleteFile, getFileSignedUrl, uploadFile } from "@/config/s3.js";
import utils from "@/utils/utils.js";

/**
 * @typedef {Object} ProductInput
 * @property {string} title - The title of the product.
 * ß@property {string} description - The description of the product.
 * @property {number} unitPrice - The price of the product.
 * @property {number} unit - The unit of the product.
 */

/**
 * @namespace productService
 */

const productService = {
  /**
   * Get a list of all products.
   * @returns {Promise} A promise that resolves with an array of products or rejects with an error if no products are found.
   */
  async getAllProducts(queryStr) {
    const features = new APIFeatures(Product, queryStr)
      .search()
      .filter()
      .sort()
      .limitFields()
      .paginate();

    let products = await features.execute();
    products = products[0];

    if (products.length === 0) {
      throw new APIError({
        status: 404,
        message: "There is no document found.",
      });
    }
    return products;
  },

  /**
   * Get a product by its ID.
   * @param {string} productId - The ID of the product to retrieve.
   * @returns {Promise} A promise that resolves with the retrieved product or rejects with an error if not found.
   */
  async getProduct(productId) {
    const product = await Product.findOne({
      _id: productId,
      status: "Public",
    })
      .populate({
        path: "sellerId",
        select: "storeName",
      })
      .populate({
        path: "reviews.userId",
        select: "firstName createdAt",
      });

    product.reviews.map(
      (review) => (review.userId.firstName = blurText(review.userId.firstName))
    );

    if (!product) {
      throw new APIError({
        status: 404,
        message: "There is no document found with this ID.",
      });
    }

    const allFileUrls = [];
    allFileUrls.push(product.imgCover);
    product.media.map((each) => allFileUrls.push(each));

    const urls = await Promise.all(
      allFileUrls.map(async (each) => await getFileSignedUrl(each))
    );

    product._doc.signedImgCover = urls[0];
    product._doc.signedMedia = urls.slice(1);

    return product;
  },

  async getUserProducts() {
    let products = await Product.aggregate([
      { $sample: { size: 10 } },
      { $match: { status: "Public" } },
      {
        $facet: {
          metadata: [{ $count: "totalResults" }],
          docs: [{ $limit: 10 }],
        },
      },
      { $unwind: "$metadata" },
    ]);

    const { metadata, docs } = products[0];

    if (!docs || docs.length === 0) {
      throw new APIError({
        status: 404,
        message: "There is no document found.",
      });
    }
    await Promise.all(
      docs?.map(async (each) => {
        each.imgCover = await getFileSignedUrl(each.imgCover);
      })
    );

    return {
      metadata,
      docs,
    };
  },

  async getHotProducts(queryStr) {
    const filterQueryString = { ...queryStr, status: "Public" };
    const features = new APIFeatures(Product, filterQueryString)
      .search()
      .filter()
      .sort()
      .limitFields()
      .paginate();

    let products = await features.execute();
    products = products[0];

    if (!products)
      throw new APIError({
        status: 404,
        message: "There is no document found.",
      });

    await Promise.all(
      products?.docs.map(async (each) => {
        each.imgCover = await getFileSignedUrl(each.imgCover);
      })
    );

    return products;
  },

  async getTopProducts(queryStr) {
    const topProductsQuery = {
      ...queryStr,
      averageRating: { gte: "4.5" },
      soldAmount: { gte: "100" },
      status: "Public",
    };

    const features = new APIFeatures(Product, topProductsQuery)
      .search()
      .filter()
      .sort()
      .limitFields()
      .paginate();

    let products = await features.execute();
    products = products[0];

    if (!products)
      throw new APIError({
        status: 404,
        message: "There is no document found.",
      });

    await Promise.all(
      products?.docs.map(async (each) => {
        each.imgCover = await getFileSignedUrl(each.imgCover);
      })
    );

    return products;
  },

  async getProductsByCategories(queryStr) {
    if (queryStr.categories)
      queryStr.categories = queryStr.categories.split(",");

    const filterQueryString = { ...queryStr, status: "Public" };

    const features = new APIFeatures(Product, filterQueryString)
      .search()
      .filter()
      .sort()
      .limitFields()
      .paginate();

    let products = await features.execute();
    products = products[0];

    if (!products)
      throw new APIError({
        status: 404,
        message: "There is no document found.",
      });

    await Promise.all(
      products?.docs.map(async (each) => {
        each.imgCover = await getFileSignedUrl(each.imgCover);
      })
    );

    return products;
  },

  /**
   * Create product
   * @param {FileArray} imgCover
   * @param {FileArray} media
   * @param {ProductObject} productInput
   * @returns {Promise} - Promise that resolves new product document
   */
  async createProduct(imgCover, media, productInput) {
    const allFiles = [];
    try {
      // Check if seller has already had product with this title
      await Product.checkProductExists({
        sellerId: productInput.sellerId,
        title: productInput.title,
      });

      // prepare file names
      const imgCoverName = utils.generateFileName(
        "products-test",
        imgCover[0].originalname,
        imgCover[0].mimetype
      );

      allFiles.push({
        name: imgCoverName,
        buffer: imgCover[0].buffer,
        mimetype: imgCover[0].mimetype,
      });

      productInput.imgCover = imgCoverName;
      productInput.media = [];
      media.map((each) => {
        const eachName = utils.generateFileName(
          "products-test",
          each.originalname,
          each.mimetype
        );
        productInput.media.push(eachName);
        allFiles.push({
          name: eachName,
          buffer: each.buffer,
          mimetype: each.mimetype,
        });
      });

      // upload all files to S3
      const uploadPromises = allFiles.map((eachFile) =>
        uploadFile(eachFile.buffer, eachFile.name, eachFile.mimetype)
      );
      await Promise.all(uploadPromises);

      // save in Product model
      const newProduct = new Product(productInput);
      await newProduct.save();
      return newProduct;
    } catch (error) {
      // Delete uploaded files if error and available
      if (allFiles.length > 0) {
        const deletePromises = allFiles.map((eachFile) =>
          deleteFile(eachFile.name)
        );
        await Promise.all(deletePromises);
      }

      throw error;
    }
  },

  /**
   * Update product by Admin and Seller
   * @param {ProductObject} productInput
   * @param {FileArray} newImgCover
   * @param {FileArray} newMedia
   * @param {String} productId
   * @returns
   */
  async updateProduct(productInput, newImgCover, newMedia, productId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findOne({
        _id: productId,
        sellerId: productInput.sellerId,
      });

      if (!product) {
        throw new APIError({
          message: `Cannot find product with this ID: ${productId}`,
          status: 400,
        });
      }

      if (productInput.title) {
        await Product.checkProductExists({
          sellerId: product.sellerId,
          title: productInput.title,
        });
      }

      // Exclude media and imgCover from the fields to update
      const fieldsToUpdate = Object.keys(productInput).filter(
        (field) =>
          field !== "media" && field !== "imgCover" && field !== "categories"
      );

      fieldsToUpdate.forEach((field) => {
        product[field] = productInput[field];
      });

      const { media } = productInput;

      let deletedMedia;
      if (
        typeof media !== "undefined" &&
        media.length !== product.media.length
      ) {
        const filteredMedia = product.media.filter((item) =>
          media.includes(item)
        );
        deletedMedia = product.media.filter((item) => !media.includes(item));

        product.media = filteredMedia;
      }

      if (productInput?.categories?.length > 0) {
        product.categories = productInput.categories;
      }

      let imgCoverName;
      let previousImgCover;
      const newMediaNames = [];
      if (newImgCover) {
        imgCoverName = utils.generateFileName(
          "products-update/imageCover",
          newImgCover[0].originalname,
          newImgCover[0].mimetype
        );
        previousImgCover = product.imgCover;
        product.imgCover = imgCoverName;
      }

      if (newMedia) {
        const names = newMedia.map((each) => {
          return utils.generateFileName(
            "products-update/media",
            each.originalname,
            each.mimetype
          );
        });
        names.map((each) => {
          product.media.push(each);
          newMediaNames.push(each);
        });
      }

      await product.save({ session });

      if (newImgCover) {
        const imgCoverParams = {
          name: imgCoverName,
          buffer: newImgCover[0].buffer,
          mimetype: newImgCover[0].mimetype,
        };

        await uploadFile(
          imgCoverParams.buffer,
          imgCoverParams.name,
          imgCoverParams.mimetype
        );
      }

      if (newMedia) {
        const mediaParams = newMedia.map((each, index) => {
          return {
            name: newMediaNames[index],
            buffer: each.buffer,
            mimetype: each.mimetype,
          };
        });

        const uploadFilePromises = mediaParams.map((eachFile) =>
          uploadFile(eachFile.buffer, eachFile.name, eachFile.mimetype)
        );
        await Promise.all(uploadFilePromises);
      }
      await session.commitTransaction();

      // Delete files only if the transaction is successfully committed
      if (newImgCover) {
        // If delete operations fail, we can, later, manually delete the deleted files
        try {
          await deleteFile(previousImgCover);
        } catch (deleteError) {
          console.error(`Error deleting imgCover: ${deleteError.message}`);
        }
      }

      if (deletedMedia && deletedMedia.length > 0) {
        const deleteFilePromises = deletedMedia.map((item) => deleteFile(item));

        await Promise.all(deleteFilePromises);
      }
      return product;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },
};

export default productService;
