import mongoose from "mongoose";

const conversionRateSchema = new mongoose.Schema({
  totalVisitors: Number,
  totalPurchases: Number,
  conversionRate: Number,
});

const averageOrderValueSchema = new mongoose.Schema({
  totalOrders: Number,
  totalOrdersValue: Number,
  averageOrderValue: Number,
});

const metricSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  conversionRate: conversionRateSchema,
  averageOrderValue: averageOrderValueSchema,
});

const Metric = mongoose.model("Metric", metricSchema);
export default Metric;
