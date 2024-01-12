import Seller from "@/models/seller.model.js";
import APIError from "@/utils/APIError.js";
import APIFeatures from "@/utils/APIFeatures.js";
import { createRegexFilters } from "@/utils/regexFilters.js";
import utils from "@/utils/utils.js";

const sellerServiceAdmin = {
  async searchSeller(queryStr) {
    const searchPipeline = [
      {
        $match: {},
      },
    ];
    if (queryStr.q) {
      const regexFilters = createRegexFilters(queryStr.q, "storeAndSellerName");
      searchPipeline[0].$match.$and = searchPipeline[0].$match.$and || [];
      searchPipeline[0].$match.$and.push(...regexFilters);
    }

    queryStr.fields = "-password";

    const features = new APIFeatures(Seller, queryStr, true, searchPipeline)
      .search()
      .filter()
      .sort()
      .limitFields()
      .paginate();

    let sellers = await features.execute();
    sellers = sellers[0];
    if (sellers) {
      sellers.metadata = utils.getPaginateMetadata(sellers.metadata, queryStr);
    }
    return sellers ?? [];
  },
  async updateSellerStatus(sellerId, sellerStatus) {
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      throw new APIError({
        status: 404,
        message: "Cannot find seller with this ID",
      });
    }

    seller.sellerStatus = sellerStatus;
    // I set validateBeforeSave to false because seller data are synthesized, not real data
    await seller.save({ validateBeforeSave: false });
    return seller;
  },
};

export default sellerServiceAdmin;
