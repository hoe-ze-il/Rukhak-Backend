/**
 * Inspiration from: https://github.com/bradtraversy/proshop-v2/blob/main/backend/config/db.js
 */

import mongoose from "mongoose";
import Product from "../models/product.model.js";
import { request } from "urllib";
import dotenv from "dotenv";

dotenv.config();

const ATLAS_API_BASE_URL = process.env.MONGO_ATLAS_API_BASE_URL;
const ATLAS_PROJECT_ID = process.env.MONGO_ATLAS_PROJECT_ID;
const ATLAS_CLUSTER_NAME = process.env.MONGO_ATLAS_CLUSTER;
const ATLAS_CLUSTER_API_URL = `${ATLAS_API_BASE_URL}/groups/${ATLAS_PROJECT_ID}/clusters/${ATLAS_CLUSTER_NAME}`;
const ATLAS_SEARCH_INDEX_API_URL = `${ATLAS_CLUSTER_API_URL}/fts/indexes`;

const ATLAS_API_PUBLIC_KEY = process.env.MONGO_ATLAS_PUBLIC_KEY;
const ATLAS_API_PRIVATE_KEY = process.env.MONGO_ATLAS_PRIVATE_KEY;
const DIGEST_AUTH = `${ATLAS_API_PUBLIC_KEY}:${ATLAS_API_PRIVATE_KEY}`;

const PRODUCT_SEARCH_INDEX_NAME = "product-search";

const ATLAS_DATABASE = process.env.MONGO_ATLAS_DATABASE;
const ATLAS_COLLECTION = Product.collection.name;

const _findIndexByName = async (indexName) => {
  const allIndexesResponse = await request(
    `${ATLAS_SEARCH_INDEX_API_URL}/${ATLAS_DATABASE}/${ATLAS_COLLECTION}`,
    {
      dataType: "json",
      contentType: "application/json",
      method: "GET",
      digestAuth: DIGEST_AUTH,
    }
  );

  return allIndexesResponse.data.find((i) => i.name === indexName);
};

const _addProductSearchIndex = async () => {
  const productSearchIndex = await _findIndexByName(PRODUCT_SEARCH_INDEX_NAME);
  if (!productSearchIndex) {
    await request(ATLAS_SEARCH_INDEX_API_URL, {
      data: {
        name: PRODUCT_SEARCH_INDEX_NAME,
        database: ATLAS_DATABASE,
        collectionName: ATLAS_COLLECTION,
        mappings: {
          dynamic: false,
          fields: {
            title: {
              type: "string",
              analyzer: "lucene.standard",
            },
            description: {
              type: "string",
              analyzer: "lucene.standard",
            },
          },
        },
      },
      dataType: "json",
      contentType: "application/json",
      method: "POST",
      digestAuth: DIGEST_AUTH,
    });
  }
};

/**
 * Function to connect App with MongoDB and other configs
 * @param {Bool} isProduction
 */
const connectDB = async (isProduction) => {
  try {
    const MONGO_URI = isProduction
      ? process.env.MONGO_URI_PROD
      : process.env.MONGO_URI_DEV;

    await mongoose.connect(MONGO_URI, {});
    console.log("Successfully connected to MongoDB...");

    await _addProductSearchIndex();
    console.log("Successfully add searchIndex to Atlas...");
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

export default connectDB;
