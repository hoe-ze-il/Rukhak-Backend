import { setupTestDB } from "../utils/setupTestDB.js";
import request from "supertest";
import app from "../../src/app.js";
import { faker } from "@faker-js/faker";
import {
  insertOneSeller,
  loginAsSeller,
} from "../fixtures/sellerAccount.fixture.js";
import { insertOneUser } from "../fixtures/user.fixture.js";

setupTestDB();

const baseAPI = "/api/v1/seller/products";

describe("Create one product", () => {
  describe("Given no credential", () => {
    it("must return 401 unauthorized", async () => {
      const res = await request(app).post(baseAPI);
      expect(res.status).toBe(401);
    });
  });

  describe("Given a 'user' role", () => {
    it("must return 403 forbidden", async () => {
      // Insert testing user
      const user = await insertOneUser();

      // Login
      const userToken = await loginAsSeller({
        email: user.email,
        password: "Password@123",
      });

      const res = await request(app)
        .post(baseAPI)
        .set("Authorization", `Bearer ${userToken}`)
        .field("title", "")
        .field("description", faker.lorem.paragraph())
        .field("basePrice", 57.27)
        .field("unit", "kg")
        .field("availableStock", 12)
        .field("categories", "garden,land");

      expect(res.status).toBe(403);
    });
  });

  describe("Given no title", () => {
    it("must show 400 bad request", async () => {
      // Insert testing seller
      const seller = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await loginAsSeller({
        email: seller.email,
        password: "Password@123",
      });

      const res = await request(app)
        .post(baseAPI)
        .set("Authorization", `Bearer ${accessToken}`)
        .field("title", "")
        .field("description", faker.lorem.paragraph())
        .field("basePrice", 57.27)
        .field("unit", "kg")
        .field("availableStock", 12)
        .field("categories", "garden,land");

      expect(res.status).toBe(400);
      expect(res.body.errors[0].path).toBe("title");
    });
  });

  describe("Given no description", () => {
    it("must show 400 bad request", async () => {
      // Insert testing seller
      const seller = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await loginAsSeller({
        email: seller.email,
        password: "Password@123",
      });

      const res = await request(app)
        .post(baseAPI)
        .set("Authorization", `Bearer ${accessToken}`)
        .field("title", "a test product")
        .field("description", "")
        .field("basePrice", 57.27)
        .field("unit", "kg")
        .field("availableStock", 12)
        .field("categories", "garden,land");

      expect(res.status).toBe(400);
      expect(res.body.errors[0].path).toBe("description");
    });
  });

  describe("Given no basePrice", () => {
    it("must show 400 bad request", async () => {
      // Insert testing seller
      const seller = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await loginAsSeller({
        email: seller.email,
        password: "Password@123",
      });

      const res = await request(app)
        .post(baseAPI)
        .set("Authorization", `Bearer ${accessToken}`)
        .field("title", "a test product")
        .field("description", faker.lorem.paragraph())
        // .field("basePrice", 57.27)
        .field("unit", "kg")
        .field("availableStock", 12)
        .field("categories", "garden,land");

      expect(res.status).toBe(400);
      expect(res.body.errors[0].path).toBe("basePrice");
    });
  });

  describe("Given negative basePrice", () => {
    it("must show 400 bad request", async () => {
      // Insert testing seller
      const seller = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await loginAsSeller({
        email: seller.email,
        password: "Password@123",
      });

      const res = await request(app)
        .post(baseAPI)
        .set("Authorization", `Bearer ${accessToken}`)
        .field("title", "a test product")
        .field("description", faker.lorem.paragraph())
        .field("basePrice", -57.27)
        .field("unit", "kg")
        .field("availableStock", 12)
        .field("categories", "garden,land");

      expect(res.status).toBe(400);
      expect(res.body.errors[0].path).toBe("basePrice");
    });
  });

  describe("Given no availableStock", () => {
    it("must show 400 bad request", async () => {
      // Insert testing seller
      const seller = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await loginAsSeller({
        email: seller.email,
        password: "Password@123",
      });

      const res = await request(app)
        .post(baseAPI)
        .set("Authorization", `Bearer ${accessToken}`)
        .field("title", "a test product")
        .field("description", faker.lorem.paragraph())
        .field("basePrice", 57.27)
        .field("unit", "kg")
        // .field("availableStock", 12)
        .field("categories", "garden,land");

      expect(res.status).toBe(400);
      expect(res.body.errors[0].path).toBe("availableStock");
    });
  });

  describe("Given negative availableStock", () => {
    it("must show 400 bad request", async () => {
      // Insert testing seller
      const seller = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await loginAsSeller({
        email: seller.email,
        password: "Password@123",
      });

      const res = await request(app)
        .post(baseAPI)
        .set("Authorization", `Bearer ${accessToken}`)
        .field("title", "a test product")
        .field("description", faker.lorem.paragraph())
        .field("basePrice", 57.27)
        .field("unit", "kg")
        .field("availableStock", -12)
        .field("categories", "garden,land");

      expect(res.status).toBe(400);
      expect(res.body.errors[0].path).toBe("availableStock");
    });
  });

  describe("Given no categories", () => {
    it("must show 400 bad request", async () => {
      // Insert testing seller
      const seller = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await loginAsSeller({
        email: seller.email,
        password: "Password@123",
      });

      const res = await request(app)
        .post(baseAPI)
        .set("Authorization", `Bearer ${accessToken}`)
        .field("title", faker.commerce.productName())
        .field("description", faker.lorem.paragraph())
        .field("basePrice", 57.27)
        .field("unit", "kg")
        .field("availableStock", 12);

      expect(res.status).toBe(400);
      expect(res.body.errors[0].path).toBe("categories");
    });
  });

  describe("Given no imgCover", () => {
    it("must show 400 bad request", async () => {
      const fakeFileBuffer = Buffer.from("fake file content");

      // Insert testing seller
      const seller = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await loginAsSeller({
        email: seller.email,
        password: "Password@123",
      });

      const res = await request(app)
        .post(baseAPI)
        .set("Authorization", `Bearer ${accessToken}`)
        .field("title", faker.commerce.productName())
        .field("description", faker.lorem.paragraph())
        .field("basePrice", 57.27)
        .field("unit", "kg")
        .field("availableStock", 12)
        .field("categories", "garden")
        .attach("imgCover", "")
        .attach("media", fakeFileBuffer, "fakefile.jpg");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("imgCover and media are required");
    });
  });

  describe("Given no media", () => {
    it("must show 400 bad request", async () => {
      const fakeFileBuffer = Buffer.from("fake file content");

      // Insert testing seller
      const seller = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await loginAsSeller({
        email: seller.email,
        password: "Password@123",
      });

      const res = await request(app)
        .post(baseAPI)
        .set("Authorization", `Bearer ${accessToken}`)
        .field("title", faker.commerce.productName())
        .field("description", faker.lorem.paragraph())
        .field("basePrice", 57.27)
        .field("unit", "kg")
        .field("availableStock", 12)
        .field("categories", "garden")
        .attach("imgCover", fakeFileBuffer, "fakefile.jpg");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("imgCover and media are required");
    });
  });

  describe("Given imgCover as mp4", () => {
    it("must show 400 bad request", async () => {
      const fakeFileBuffer = Buffer.from("fake file content");

      // Insert testing seller
      const seller = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await loginAsSeller({
        email: seller.email,
        password: "Password@123",
      });

      const res = await request(app)
        .post(baseAPI)
        .set("Authorization", `Bearer ${accessToken}`)
        .field("title", faker.commerce.productName())
        .field("description", faker.lorem.paragraph())
        .field("basePrice", 57.27)
        .field("unit", "kg")
        .field("availableStock", 12)
        .field("categories", "garden")
        .attach("imgCover", fakeFileBuffer, "fakefile.mp4");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("File must be in png or jpg.");
    });
  });

  describe("Given media as non images", () => {
    it("must show 400 bad request", async () => {
      const fakeFileBuffer = Buffer.from("fake file content");

      // Insert testing seller
      const seller = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await loginAsSeller({
        email: seller.email,
        password: "Password@123",
      });

      const res = await request(app)
        .post(baseAPI)
        .set("Authorization", `Bearer ${accessToken}`)
        .field("title", faker.commerce.productName())
        .field("description", faker.lorem.paragraph())
        .field("basePrice", 57.27)
        .field("unit", "kg")
        .field("availableStock", 12)
        .field("categories", "garden")
        .attach("imgCover", fakeFileBuffer, "fakefile.jpeg")
        .attach("media", fakeFileBuffer, "fakefile.mp4")
        .attach("media", fakeFileBuffer, "fakefile.txt");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("File must be in png or jpg.");
    });
  });

  describe("Given more than 1 imgCover", () => {
    it("must show 400 bad request", async () => {
      const fakeFileBuffer = Buffer.from("fake file content");

      // Insert testing seller
      const seller = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await loginAsSeller({
        email: seller.email,
        password: "Password@123",
      });

      const res = await request(app)
        .post(baseAPI)
        .set("Authorization", `Bearer ${accessToken}`)
        .field("title", faker.commerce.productName())
        .field("description", faker.lorem.paragraph())
        .field("basePrice", 57.27)
        .field("unit", "kg")
        .field("availableStock", 12)
        .field("categories", "garden")
        .attach("imgCover", fakeFileBuffer, "fakefile.jpeg")
        .attach("imgCover", fakeFileBuffer, "fakefile.jpeg")
        .attach("media", fakeFileBuffer, "fakefile.mp4")
        .attach("media", fakeFileBuffer, "fakefile.txt");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Unexpected field");
    });
  });

  describe("Given more than 3 media images", () => {
    it("must show 400 bad request", async () => {
      const fakeFileBuffer = Buffer.from("fake file content");

      // Insert testing seller
      const seller = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await loginAsSeller({
        email: seller.email,
        password: "Password@123",
      });

      const res = await request(app)
        .post(baseAPI)
        .set("Authorization", `Bearer ${accessToken}`)
        .field("title", faker.commerce.productName())
        .field("description", faker.lorem.paragraph())
        .field("basePrice", 57.27)
        .field("unit", "kg")
        .field("availableStock", 12)
        .field("categories", "garden")
        .attach("imgCover", fakeFileBuffer, "fakefile.jpeg")
        .attach("media", fakeFileBuffer, "fakefile.png")
        .attach("media", fakeFileBuffer, "fakefile.png")
        .attach("media", fakeFileBuffer, "fakefile.png")
        .attach("media", fakeFileBuffer, "fakefile.png");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Unexpected field");
    });
  });

  // describe.skip("Given full product detail", () => {
  //   it("must show 201 created", async () => {
  //     // TODO: learn how to mock named export
  //     const fakeFileBuffer = Buffer.from("fake file content");

  //     const res = await request(app)
  //       .post(baseAPI)
  //       .field("title", faker.commerce.productName())
  //       .field("description", faker.lorem.paragraph())
  //       .field("basePrice", 57.27)
  //       .field("unit", "kg")
  //       .field("availableStock", 12)
  //       .field("categories", "garden")
  //       .attach("imgCover", fakeFileBuffer, "fakefile.jpeg")
  //       .attach("media", fakeFileBuffer, "fakefile.png")
  //       .attach("media", fakeFileBuffer, "fakefile.png");

  //     expect(s3Module.uploadFile).toHaveBeenCalled();
  //   });
  // });
});
