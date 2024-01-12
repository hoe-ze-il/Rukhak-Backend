/**
 * @fileoverview I test API fetures but using aggregate pipeline instead
 */

import mongoose from "mongoose";

class APIFeatures {
  constructor(model, queryStr, isAdmin = false, searchPipeline) {
    this.model = model;
    this.aggPipe = [];
    this.queryStr = queryStr;
    this.isAdmin = isAdmin;
    this.searchPipeline = searchPipeline;
  }

  search() {
    const searchTerm = this.queryStr.q;
    if (this.isAdmin && searchTerm) {
      // when admin is true, use regex-based search

      if (this.searchPipeline) {
        this.aggPipe.push(...this.searchPipeline);
      }
    } else if (searchTerm) {
      this.aggPipe.push({
        $search: {
          index: "product-search",
          compound: {
            should: [
              {
                text: {
                  query: searchTerm,
                  path: "title",
                  score: { boost: { value: 3 } },
                  fuzzy: {},
                },
              },
              {
                text: {
                  query: searchTerm,
                  path: "description",
                  fuzzy: {},
                },
              },
            ],
          },
        },
      });
    }

    return this;
  }

  filter() {
    let queryObj = { ...this.queryStr };
    const dateRelatedFields = ["createdAt", "updatedAt"];
    const excludedFields = ["page", "sort", "limit", "fields", "q"];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    queryObj = JSON.parse(queryStr);

    Object.keys(queryObj).forEach((eachKey) => {
      // Convert $gte value to Number()
      for (const key in queryObj[eachKey])
        if (/\b(gte|gt|lte|lt)\b/g.test(key)) {
          if (!dateRelatedFields.includes(eachKey)) {
            queryObj[eachKey][key] = Number(queryObj[eachKey][key]);
          } else {
            queryObj[eachKey][key] = new Date(queryObj[eachKey][key]);
          }
        }

      if (queryObj[eachKey] === "true" || queryObj[eachKey] === "false") {
        queryObj[eachKey] = queryObj[eachKey] === "true";
      }

      if (Array.isArray(queryObj[eachKey])) {
        queryObj[eachKey] = { $all: queryObj[eachKey] };
      }
      // // Convert to $elemMatch to match each element regardless of order
      // if (Array.isArray(queryObj[eachKey]))
      //   queryObj[eachKey] = { $elemMatch: { $in: [...queryObj[eachKey]] } };

      // Convert sellerId to ObjectId (if not, it cannot filter it)
      if (eachKey == "sellerId")
        queryObj[eachKey] = new mongoose.Types.ObjectId(queryObj[eachKey]);
    });

    this.aggPipe.push({ $match: queryObj });

    return this;
  }

  filterDeleteStatus(seeDeleted = false) {
    if (!seeDeleted)
      this.aggPipe.push({ $match: { status: { $ne: "deleted" } } });

    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(",");
      const sortObj = {};
      sortBy.forEach((item) => {
        if (item.startsWith("-")) sortObj[item.slice(1)] = -1;
        else sortObj[item] = 1;
      });

      this.aggPipe.push({ $sort: sortObj });
    } else if (this.queryStr.q) {
      return this;
    } else {
      this.aggPipe.push({ $sort: { createdAt: -1 } });
    }

    return this;
  }

  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(",");
      const fieldObj = {};
      fields.forEach((item) => {
        if (item.startsWith("-")) fieldObj[item.slice(1)] = 0;
        else fieldObj[item] = 1;
      });
      this.aggPipe.push({ $project: fieldObj });
    } else {
      this.aggPipe.push({ $project: { __v: 0 } });
    }

    return this;
  }

  paginate() {
    const page = Number(this.queryStr.page) || 1;
    const limit = Number(this.queryStr.limit || process.env.PAGE_LIMIT_DEFAULT);
    const skip = (page - 1) * limit;

    this.aggPipe.push({
      $facet: {
        metadata: [{ $count: "totalResults" }],
        docs: [{ $skip: skip }, { $limit: limit }],
      },
    });

    this.aggPipe.push({ $unwind: "$metadata" });

    return this;
  }

  async execute() {
    return await this.model.aggregate(this.aggPipe);
  }
}

export default APIFeatures;
