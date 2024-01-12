import mongoose from "mongoose";

const idSchema = new mongoose.Schema(
  {
    year: Number,
    month: Number,
    week: Number,
    day: Number,
  },
  { _id: false }
); // _id is set to false as this is a subdocument

const aggregatedOrderSchema = new mongoose.Schema({
  _id: idSchema,
  productsSold: {
    type: Number,
    default: 0,
  },
  totalOrders: {
    type: Number,
    default: 0,
  },
  totalRevenue: {
    type: Number,
    default: 0,
  },
});

const AggregatedOrder = mongoose.model(
  // to get plural camel case collection name
  "AggregatedOrder",
  aggregatedOrderSchema,
  "aggregatedOrders"
);

export default AggregatedOrder;
