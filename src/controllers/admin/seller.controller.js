import catchAsync from "@/utils/catchAsync.js";
import sellerServiceAdmin from "@/services/admin/seller.service.js";

const sellerControllerAdmin = {
  searchSeller: catchAsync(async (req, res, next) => {
    const sellers = await sellerServiceAdmin.searchSeller(req.query);
    return res.status(200).json({
      status: "success",
      data: sellers,
    });
  }),

  updateSellerStatus: catchAsync(async (req, res, next) => {
    const seller = await sellerServiceAdmin.updateSellerStatus(
      req.params.sellerId,
      req.body.sellerStatus
    );
    return res.status(200).json({
      status: "success",
      data: seller,
    });
  }),
};

export default sellerControllerAdmin;
