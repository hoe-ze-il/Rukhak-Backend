import { BetaAnalyticsDataClient } from "@google-analytics/data";
import AggregatedOrder from "@/models/aggregatedOrder.model.js";
import dotenv from "dotenv";
import Order from "@/models/order.model.js";
import User from "@/models/user.model.js";
import Product from "@/models/product.model.js";
dotenv.config();

const GA_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDj3ruMxzEoN1mF\nv/fx93HMEmJuVy8DEYRqFOIol2il8DtcSxnc1u5cYoSsjnSsDwq1r5JIsFF6hSDG\nmggtVDGvcrrpAU4R8PRsCaGimis38QmZDJhWtLyF9P/S5+iqtzCdyFpvNXB/5gX5\nin0J3rZcrMCDQMvlCCuTjktwgwsXnSdxRw5yWZO4f8xOL1USz6FEOOxQWiSN6r3y\n+9ZA7yIBQ5GM9aTzKPFcL088AdF+W6qPVboXH18+CnG0LPLxp0ul++1AKE/W3mcc\n9z1+poyNCpXRRYEanuSV8wpnjSlaL9z/BvFV59OkUtLFN1KJyt0r9PLjG75x64fu\nWCFExqJLAgMBAAECggEACVkLR5iqTxSKMx7vbHkyrWT5rb4c2xreXD20E2c2r0v+\nG2inTHRyvc5609taNO6/CToFHb9B8G1CrXMHL9ja2vAxc7qOedTxKfdxLor1h+t2\n8dTe8PukGji1P/EsjchLEcX008gU7+I/T3/bZkrBH2ck1J2VX7VomDqHpLtzeonv\njg/oyjv+1MFk8A4EZQftQi25xJHnhiVugPtxeRPOtUss9Hi3fVkJC9z2chKw8ZOu\n6zH41zgU2gXeBTQDMIke/0XlaTl2BcX+bhiDftnVO+LxGqrYSGuwCJX4gcf82k7c\nuMg4SJuCY12XYi2fQQtr+0OBEFANAckccdMgVI5kgQKBgQD6+pPFJZ80lUNrCHUA\nGao2ojTiuHJFR23SID/BgBZREp67BUCnSd06khUlqHu/TXP/zn32p1pXAyKf8KUM\n2KXGqux9InnGSHp7K1zyoaQ6zaIj00KGlUMWqUDPqHviHKe+jl9pVbbSo8CLI/iV\nwpfLMZhxarwBL3h5atgE60JKgQKBgQDobcz2WV16WMafH3QcmSImxz+aWQs80xXI\ngS73/qp22BZ1uX2r6JE8J8AmVdsBjK9wldBJAznQLtbdtQ3iVPcW9rC5SAT5Upch\nfyc1vL7lLPE68cfZ+lbz2AhxVM1TZoDtSue0Gq6x+zGDHe+FP68j0GsLFMM20u9k\ngPhoLOKOywKBgQCBi/3icTzwQ2t9P+xElPrLIIbz0AkLwYbqQ0MlehwK1PWhy2BH\n+VR7+xN3ULQvVqddjxRt0IxNBY1FyU0oiFtpZKiVHsqEkrzF/ugHRXAj+iiLHWzl\nUv5CIDMX/PuVBv1+2rZdBKVNrMCiEXsqsjrv4zWwtUs9wWcKJSBDybt6AQKBgQCN\nYPyjfIhXu1hVwhQmsR8M53XQtQkY3m0JoUqonsehsp82zLWcs8JkDOncZ6znrGOq\n3/Xp84RfFZ6tDUx8t6H03elxSlV8MrirL2TyUvTrAgNaD2e5N4VcnbPE/AhJCrix\nnjaCXxiUOm9LihH/w1UNO+FgxChaWMQ1Jh3zgBnvMQKBgHFoWOzT18U0J1JusZ1B\n0eM9C+Ry039xLWk2rwp7c86IOdK+6UWTnWS8hJzHYGZd56hO5QminHkcy6nZR+7D\nPJQKN0XhlLYG/ko0DNVclK4Z353dbuIJ062lDO04SLJyqG2BaK48zkZAyNePHSEM\ncEOS03GnUiXEUfKZn56/wJBr\n-----END PRIVATE KEY-----\n"

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA_CLIENT_EMAIL,
    // private_key: process.env.GA_PRIVATE_KEY?.replace(/\n/gm, "\n"),
    private_key: GA_PRIVATE_KEY
  },
});

// const propertyId = process.GA_PROPERTY_ID;
const propertyId = 418845032

async function getActiveUsers() {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [
      {
        startDate: `30daysAgo`, //👈  e.g. "7daysAgo" or "30daysAgo"
        endDate: "today",
      },
    ],
    dimensions: [
      {
        name: "date",
      },
    ],
    metrics: [
      {
        name: "activeUsers",
      },
    ],
  });

  function compareDates(a, b) {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB;
  }

  const results = [];
  response.rows.forEach((row) => {
    results.push({
      date: convertDateFormat(row.dimensionValues[0].value),
      count: parseInt(row.metricValues[0].value),
    });
  });

  function convertDateFormat(dateString) {
    const year = dateString.slice(0, 4);
    const month = dateString.slice(4, 6);
    const day = dateString.slice(6, 8);
    return `${year}-${month}-${day}`;
  }

  function fillMissingDates(data) {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const allDates = [];
    let currentDate = new Date(thirtyDaysAgo);

    while (currentDate <= today) {
      const formattedDate = currentDate.toISOString().slice(0, 10);
      allDates.push(formattedDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create a new array with missing dates filled in with a count of 0
    const newData = allDates.map((date) => {
      const existingEntry = data.find((entry) => entry.date === date);
      return existingEntry ? existingEntry : { date, count: 0 };
    });

    return newData;
  }

  const sortedResults = results.sort(compareDates);
  const processedResult = fillMissingDates(sortedResults);

  return processedResult;
}

async function getAggregatedOrders(previousNthDay) {
  let dateNthDaysAgo = new Date();
  dateNthDaysAgo.setDate(dateNthDaysAgo.getDate() - previousNthDay);

  // convert to a format that can be compared with _id date format
  const year = dateNthDaysAgo.getFullYear();
  const month = dateNthDaysAgo.getMonth() + 1;
  const day = dateNthDaysAgo.getDate();

  const aggregatedOrders = await AggregatedOrder.find({
    $or: [
      {
        "_id.year": year,
        "_id.month": { $gte: month },
        "_id.day": { $gte: day },
      },
      {
        "_id.year": { $gt: year },
      },
    ],
  });

  return aggregatedOrders;
}

const analyticReportsService = {
  async getAnalyticData() {
    const activeUsers = await getActiveUsers();
    const aggregatedOrders = await getAggregatedOrders(7);
    const totalRevenue = await Order.getTotalRevenue();
    const totalAccounts = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const aggregatedData = { totalAccounts, totalProducts, totalRevenue };

    const result = { activeUsers, aggregatedOrders, aggregatedData };
    return result;
  },
};

export default analyticReportsService;
