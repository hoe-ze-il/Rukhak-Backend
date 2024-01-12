import catchAsync from "@/utils/catchAsync.js";
import analyticReportsService from "@/services/admin/analyticReports.service.js";

const analyticReportsController = {
  getActiveUsers: catchAsync(async (req, res, next) => {
    const data = await analyticReportsService.getAnalyticData();
    res.status(200).json({
      status: "success",
      data,
    });
  }),
};

export default analyticReportsController;
