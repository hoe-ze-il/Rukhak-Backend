import cron from "node-cron";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

// eslint-disable-next-line prefer-destructuring
const MONGO_URI_DEV = process.env.MONGO_URI_DEV;
const client = new MongoClient(MONGO_URI_DEV);

Date.prototype.getISOWeek = function () {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return weekNumber;
};

const ordersGrouping = [
  {
    $group: {
      _id: {
        year: {
          $year: "$createdAt",
        },
        month: {
          $month: "$createdAt",
        },
        week: {
          $week: "$createdAt",
        },
        day: {
          $dayOfMonth: "$createdAt",
        },
      },
      productsSold: {
        $sum: "$cartItems.quantity",
      },
      totalOrders: {
        $sum: 1,
      },
      totalRevenue: {
        $sum: "$totalPrice",
      },
    },
  },
];

async function connectToDB() {
  await client.connect();
  return client.db("rukhak");
}

const defaultOrderData = {
  productsSold: 0,
  totalOrders: 0,
  totalRevenue: 0,
};

const aggregateOrders = async () => {
  try {
    const database = await connectToDB();

    const referenceDate = new Date(2023, 11, 26);

    // create a date template collection with documents for each day starting from the referenceDate
    const currentDate = new Date();
    const dateTemplate = [];

    for (
      let date = new Date(referenceDate);
      date <= currentDate;
      date.setDate(date.getDate() + 1)
    ) {
      dateTemplate.push({
        _id: {
          year: date.getFullYear(),
          month: date.getMonth() + 1, // months are 0-based
          week: date.getISOWeek(),
          day: date.getDate(),
        },
        ...defaultOrderData,
      });
    }

    await database.collection("aggregatedOrders").insertMany(dateTemplate);

    const aggregationPipeline = [
      {
        $unwind: "$cartItems",
      },
      ...ordersGrouping,
      // merge the actual data with the aggregatedOrders
      {
        $merge: {
          into: "aggregatedOrders",
          on: "_id",
          whenMatched: "replace",
          whenNotMatched: "discard",
        },
      },
    ];

    await database
      .collection("orders")
      .aggregate(aggregationPipeline)
      .toArray();
    console.log("Success");
  } catch (err) {
    console.log("Error in aggregateOrders: ", err);
  } finally {
    await client.close();
  }
};

const dailyDataAggregation = async () => {
  try {
    const database = await connectToDB();
    const collection = database.collection("orders");

    // const today = new Date(2023, 11, 29, 0, 0, 0, 0);
    const today = new Date(new Date().setHours(0, 0, 0, 0));

    const aggregationPipeline = [
      {
        $unwind: "$cartItems",
      },
      {
        $match: {
          createdAt: {
            $gte: today,
          },
        },
      },
      ...ordersGrouping,
    ];

    const result = await collection.aggregate(aggregationPipeline).toArray();
    if (result.length === 0) {
      await database.collection("aggregatedOrders").insertOne({
        _id: {
          year: today.getFullYear(),
          month: today.getMonth() + 1, // Months are 0-based, so add 1
          week: today.getISOWeek(),
          day: today.getDate(),
        },
        ...defaultOrderData,
      });
    } else {
      await database.collection("aggregatedOrders").insertOne(result[0]);
    }
    console.log("Successfully add new data: ", result);
  } catch (err) {
    console.log("Error in dailyDataAggregation:  ", err);
  } finally {
    await client.close();
  }
};

cron.schedule("*/10 * * * * *", async () => {
  await dailyDataAggregation();
});

// aggregateOrders();
