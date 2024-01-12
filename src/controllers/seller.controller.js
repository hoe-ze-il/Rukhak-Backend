import service from "@/services/seller.service.js";
import productService from "@/services/product.service.js";
import APIError from "@/utils/APIError.js";
import catchAsync from "@/utils/catchAsync.js";

const sellerController = {
  createProduct: catchAsync(async (req, res, next) => {
    if (!req.files.imgCover || !req.files.media)
      throw new APIError({
        status: 400,
        message: "imgCover and media are required",
      });

    req.body.sellerId = req.user.id;
    const newProduct = await productService.createProduct(
      req.files.imgCover,
      req.files.media,
      req.body
    );

    return res.status(201).json({
      status: "success",
      data: newProduct,
    });
  }),

  updateProduct: catchAsync(async (req, res, next) => {
    req.body.sellerId = req.user.id;
    const updatedProduct = await productService.updateProduct(
      req.body,
      req.files.imgCover,
      req.files.newMedia,
      req.params.id
    );

    return res.status(200).json({
      status: "success",
      data: updatedProduct,
    });
  }),

  getOwnProducts: catchAsync(async (req, res, next) => {
    req.query.sellerId = req.user.id;
    const products = await service.getOwnProducts(req.query);

    return res.json({
      status: "success",
      data: products,
    });
  }),

  getOwnProductDetail: catchAsync(async (req, res, next) => {
    const product = await service.getOwnProductDetail(
      req.params.id,
      req.user.id
    );

    return res.json({
      status: "success",
      data: product,
    });
  }),

  deleteProduct: catchAsync(async (req, res, next) => {
    const deleteResult = await service.deleteProduct(
      req.params.id,
      req.user.id
    );

    if (deleteResult.modifiedCount == 0)
      return res
        .status(404)
        .json({ status: "fail", message: "no file deleted" });

    return res.status(204).json({
      message: "Data deleted",
    });
  }),
};

export default sellerController;
