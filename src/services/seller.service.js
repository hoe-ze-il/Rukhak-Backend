/**
 * @file product.service.js
 * @description This module provides functions to interact with product data in the application. It includes methods for creating, retrieving, updating, and deleting products.
 */
import Product from "../models/product.model.js";
import APIError from "../utils/APIError.js";
import APIFeatures from "../utils/APIFeatures.js";
import utils from "../utils/utils.js";
import { getFileSignedUrl } from "../config/s3.js";

/**
 * @typedef {Object} ProductInput
 * @property {string} title - The title of the product.
 * @property {string} description - The description of the product.
 * @property {number} unitPrice - The price of the product.
 * @property {number} unit - The unit of the product.
 */

/**
 * @namespace productService
 */

const sellerService = {
  /**
   * Get a list of all products of a seller.
   * @param {ReqQueryObj} queryStr
   * @returns {Promise} A promise that resolves with an object of products and pagination or rejects with an error if no products are found.
   */
  async getOwnProducts(queryStr) {
    if (queryStr.categories)
      queryStr.categories = queryStr.categories.split(",");
    const features = new APIFeatures(Product, queryStr)
      .search()
      .filter()
      .filterDeleteStatus(false)
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

    // get signed URL if imgCover is availble
    await Promise.all(
      products.docs.map(async (each) => {
        if (each.imgCover)
          each.imgCover = await getFileSignedUrl(each.imgCover);
      })
    );

    // get more metadata for pagination
    products.metadata = utils.getPaginateMetadata(products.metadata, queryStr);

    return products;
  },

  /**
   * Get own product detail (for seller)
   * @param {string} productId - The ID of the product to retrieve.
   * @param {string} ownerId
   * @returns {Promise} A promise that resolves with the retrieved product or rejects with an error if not found.
   */
  async getOwnProductDetail(productId, ownerId) {
    let product = await Product.findOne({
      _id: productId,
      sellerId: ownerId,
      status: { $ne: "deleted" },
    }).select("-__v");
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

  /**
   * Delete a product by its ID and owner.
   * @param {String} productId - The ID of the product to delete.
   * @param {String} sellerId
   * @returns {Promise} A promise that resolves with the deleted product or rejects with an error if not found.
   */
  async deleteProduct(productId, sellerId) {
    const deleteStatus = await Product.updateOne(
      {
        _id: productId,
        sellerId,
        status: { $ne: "deleted" },
      },
      { status: "deleted" }
    );

    return deleteStatus;
  },
};

export default sellerService;
