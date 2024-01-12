import APIError from "@/utils/APIError.js";
import catchAsync from "@/utils/catchAsync.js";
import adminService from "@/services/admin/product.service.js";
import productService from "@/services/product.service.js";

const productControllerAdmin = {
  createProduct: catchAsync(async (req, res, next) => {
    if (!req.files.imgCover || !req.files.media) {
      throw new APIError({
        status: 400,
        message: "imgCover and media are required",
      });
    }

    const product = await productService.createProduct(
      req.files.imgCover,
      req.files.media,
      req.body
    );

    return res.status(201).json({
      status: "success",
      data: product,
    });
  }),

  getProducts: catchAsync(async (req, res, next) => {
    const products = await adminService.getProducts(req.query);

    return res.json({
      status: "success",
      data: products,
    });
  }),

  getProductById: catchAsync(async (req, res, next) => {
    const product = await adminService.getProductById(req.params.id);
    return res.status(200).json({
      status: "success",
      data: product,
    });
  }),

  updateProduct: catchAsync(async (req, res, next) => {
    const product = await productService.updateProduct(
      req.body,
      req.files.imgCover,
      req.files.newMedia,
      req.params.id
    );

    return res.status(200).json({
      status: "success",
      data: product,
    });
  }),
};

export default productControllerAdmin;
