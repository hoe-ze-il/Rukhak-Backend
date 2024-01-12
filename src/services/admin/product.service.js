import Product from "@/models/product.model.js";
import APIError from "@/utils/APIError.js";
import utils from "@/utils/utils.js";
import { getFileSignedUrl } from "@/config/s3.js";
import APIFeatures from "@/utils/APIFeatures.js";
import { createRegexFilters } from "@/utils/regexFilters.js";

const productServiceAdmin = {
  async getProducts(queryStr) {
    if (queryStr.categories)
      queryStr.categories = queryStr.categories.split(",");

    const searchPipeline = [
      {
        $match: {},
      },
    ];

    if (queryStr.q) {
      const regexFilters = createRegexFilters(queryStr.q, "title");
      searchPipeline[0].$match.$and = searchPipeline[0].$match.$and || [];
      searchPipeline[0].$match.$and.push(...regexFilters);
    }
    const features = new APIFeatures(Product, queryStr, true, searchPipeline)
      .search()
      .filter()
      .sort()
      .limitFields()
      .paginate();

    let products = await features.execute();
    products = products[0];

    if (!products) {
      throw new APIError({
        status: 404,
        message: "There is no document found.",
      });
    }

    products.metadata = utils.getPaginateMetadata(products.metadata, queryStr);

    return products;
  },

  async getProductById(productId) {
    const product = await Product.findById(productId).populate("sellerId");
    if (!product) {
      throw new APIError({
        status: 404,
        message: `Cannot find product with this ID ${productId}`,
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
};

export default productServiceAdmin;
