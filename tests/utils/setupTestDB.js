import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const setupTestDB = () => {
  beforeAll(async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI_TEST);
      console.log("============ Connected to test DB ============");
    } catch (error) {
      console.log("============ DB error: ", error);
    }
  });

  // Clean up database before each test
  beforeEach(async () => {
    await Promise.all(
      Object.values(mongoose.connection.collections).map(
        async (collection) => await collection.deleteMany()
      )
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    console.log("============ Disconnected from test DB ============");
  });
};
