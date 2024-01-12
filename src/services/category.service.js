import Category from "@/models/category.model.js";
import APIError from "@/utils/APIError.js";

const categoryService = {
  async getAllCategory() {
    const category = await Category.aggregate([
      { $sample: { size: 10 } },
      {
        $facet: {
          metadata: [{ $count: "totalResults" }],
          data: [{ $limit: 10 }],
        },
      },
      { $unwind: "$metadata" },
    ]);

    if (category.length === 0) {
      throw new APIError({
        status: 404,
        message: "There are no categories found.",
      });
    }

    return {
      metadata: category[0].metadata,
      data: category[0].data,
    };
  },
};

export default categoryService;
