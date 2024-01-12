import { setupTestDB } from "../utils/setupTestDB.js";
import request from "supertest";
import app from "../../src/app.js";
import { insertOneUser, login } from "../fixtures/user.fixture.js";
import { insertOneSeller } from "../fixtures/sellerAccount.fixture.js";
import { insertManyProducts } from "../fixtures/sellerProduct.fixture.js";
import utils from "../../src/utils/utils.js";

setupTestDB();

const baseAPI = "/api/v1/seller/products";

describe("Update a product", () => {
  describe("Given no auth", () => {
    it("must return 401 unauthorized", async () => {
      const res = await request(app).patch(
        `${baseAPI}/655f1035c84f800a020137cf`
      );

      expect(res.status).toBe(401);
    });
  });

  describe("Given 'user' role", () => {
    it("must return 403 forbidden", async () => {
      // Insert testing user
      const user = await insertOneUser();

      // Login
      const userToken = await login({
        email: user.email,
        password: "Password@123",
      });

      const res = await request(app)
        .patch(`${baseAPI}/655f1035c84f800a020137cf`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("Given one seller update OTHER seller's product", () => {
    it("must show 404 not found", async () => {
      // Insert testing seller
      const seller1 = await insertOneSeller("active");
      const seller2 = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken1 = await login({
        email: seller1.email,
        password: "Password@123",
      });

      // insert test products
      const [seller1Prods, seller2Prods] = await Promise.all([
        insertManyProducts(1, seller1.id),
        insertManyProducts(2, seller2.id),
      ]);

      const res = await request(app)
        .patch(`${baseAPI}/${seller2Prods[1].id}`)
        .set("Authorization", `Bearer ${accessToken1}`);

      expect(res.status).toBe(404);
    });
  });

  describe("Given no update data", () => {
    it("must return 200 OK and without updating anything", async () => {
      // Insert testing seller
      const seller = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await login({
        email: seller.email,
        password: "Password@123",
      });

      // insert test product
      const product = await insertManyProducts(1, seller.id);

      const res = await request(app)
        .patch(`${baseAPI}/${product[0].id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      const updatedRes = res.body.data;

      expect(res.status).toBe(200);

      // Expect the data is intact
      Object.keys(updatedRes).forEach((eachKey) => {
        if (!["createdAt", "updatedAt"].includes(eachKey))
          expect(String(updatedRes[eachKey])).toBe(String(product[0][eachKey]));
      });
    });
  });

  describe("Given forbidden fields", () => {
    describe("Given new sellerId", () => {
      it("must not update sellerId", async () => {
        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await login({
          email: seller.email,
          password: "Password@123",
        });

        // insert test product
        const product = await insertManyProducts(1, seller.id);

        const res = await request(app)
          .patch(`${baseAPI}/${product[0].id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .field("sellerId", "655f1035c84f800a020137cf");

        const updatedProduct = res.body.data;

        expect(res.status).toBe(200);
        expect(updatedProduct.sellerId).toBe(String(product[0].sellerId));
      });
    });

    describe("Given new soldAmount", () => {
      it("must not update soldAmount", async () => {
        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await login({
          email: seller.email,
          password: "Password@123",
        });

        // insert test product
        const product = await insertManyProducts(1, seller.id);

        const res = await request(app)
          .patch(`${baseAPI}/${product[0].id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .field("soldAmount", 999);

        const updatedProduct = res.body.data;

        expect(res.status).toBe(200);
        expect(updatedProduct.soldAmount).toBe(product[0].soldAmount);
      });
    });

    describe("Given new averageRating", () => {
      it("must not update averageRating", async () => {
        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await login({
          email: seller.email,
          password: "Password@123",
        });

        // insert test product
        const product = await insertManyProducts(1, seller.id);

        const res = await request(app)
          .patch(`${baseAPI}/${product[0].id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .field("averageRating", 5);

        const updatedProduct = res.body.data;

        expect(res.status).toBe(200);
        expect(updatedProduct.averageRating).toBe(product[0].averageRating);
      });
    });
  });

  describe("Given normal data", () => {
    describe("Give new title and description", () => {
      it("must update the title and description", async () => {
        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await login({
          email: seller.email,
          password: "Password@123",
        });

        // insert test product
        const product = await insertManyProducts(1, seller.id);

        const newTitle = "updated title";
        const newDesc = "a whole new description is here";
        const res = await request(app)
          .patch(`${baseAPI}/${product[0].id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .field("title", newTitle)
          .field("description", newDesc);
        const updatedProduct = res.body.data;

        expect(res.status).toBe(200);
        expect(updatedProduct.title).toBe(newTitle);
        expect(updatedProduct.description).toBe(newDesc);

        // Expect other fields from 'title' and 'description' to be intact
        Object.keys(updatedProduct).forEach((eachKey) => {
          if (
            !["createdAt", "updatedAt", "title", "description"].includes(
              eachKey
            )
          )
            expect(String(updatedProduct[eachKey])).toBe(
              String(product[0][eachKey])
            );
        });
      });
    });

    describe("Given new basePrice", () => {
      it("must update basePrice and new unitPrice", async () => {
        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await login({
          email: seller.email,
          password: "Password@123",
        });

        // insert test product
        const product = await insertManyProducts(1, seller.id);

        const newBasePrice = 56;
        const res = await request(app)
          .patch(`${baseAPI}/${product[0].id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .field("basePrice", newBasePrice);

        const updatedProduct = res.body.data;

        expect(res.status).toBe(200);
        expect(updatedProduct.basePrice).toBe(newBasePrice);
        expect(updatedProduct.unitPrice).toBe(
          utils.calculateUnitPrice(newBasePrice)
        );
      });
    });
  });

  describe("Given updating files", () => {
    // Add 2 more media
    describe("Given 2 new media", () => {
      it("must add the 2 new media to db", async () => {
        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await login({
          email: seller.email,
          password: "Password@123",
        });

        // insert test product
        const product = await insertManyProducts(1, seller.id);

        // new dummy file
        const dummyBuffer = Buffer.from("media content");

        const res = await request(app)
          .patch(`${baseAPI}/${product[0].id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .field("media", dummyBuffer, "media1.jpeg")
          .field("media", dummyBuffer, "media2.jpeg");

        const updatedProduct = res.body.data;

        expect(res.status).toBe(200);
        expect(updatedProduct.media[0]).toBe(product[0].media[0]);
        expect(updatedProduct.media[1].includes("media1.jpeg")).toBe(true);
        expect(updatedProduct.media[2].includes("media2.jpeg")).toBe(true);
      });
    });

    // Add 2 and delete 1 media
    describe("Given 2 new media but delete 1 old", () => {
      it("must update accordingly", async () => {
        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await login({
          email: seller.email,
          password: "Password@123",
        });

        // insert test product
        const product = await insertManyProducts(1, seller.id);

        // new dummy file
        const dummyBuffer = Buffer.from("media content");

        const res = await request(app)
          .patch(`${baseAPI}/${product[0].id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .field("title", "new product")
          .field("removedMedia", product[0].media[0])
          .field("media", dummyBuffer, "media3.jpeg")
          .field("media", dummyBuffer, "media4.jpeg");

        const updatedProduct = res.body.data;

        expect(res.status).toBe(200);
        expect(updatedProduct.title).toBe("new product");
        expect(updatedProduct.media.includes(product[0].media[0])).toBe(false);
        expect(updatedProduct.media[0].includes("media3.jpeg")).toBe(true);
        expect(updatedProduct.media[1].includes("media4.jpeg")).toBe(true);
      });
    });

    // Add 2 and delete random filename
    describe("Given 2 new media and remove unavailable filename", () => {
      it("must 2 new more media and remove nothing", async () => {
        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await login({
          email: seller.email,
          password: "Password@123",
        });

        // insert test product
        const product = await insertManyProducts(1, seller.id);

        // new dummy file
        const dummyBuffer = Buffer.from("media content");

        const res = await request(app)
          .patch(`${baseAPI}/${product[0].id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .field("removedMedia", "random file name")
          .field("media", dummyBuffer, "media5.jpeg")
          .field("media", dummyBuffer, "media6.jpeg");
        const updatedProduct = res.body.data;

        expect(res.status).toBe(200);
        expect(updatedProduct.media[0]).toBe(product[0].media[0]);
        expect(updatedProduct.media[1].includes("media5.jpeg")).toBe(true);
        expect(updatedProduct.media[2].includes("media6.jpeg")).toBe(true);
      });
    });

    // No add and delete all media
    describe("Given no new media and delete all existing", () => {
      it("must throw 400 bad request", async () => {
        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await login({
          email: seller.email,
          password: "Password@123",
        });

        // insert test product
        const product = await insertManyProducts(1, seller.id);

        const allExistingFileNames = product[0].media.join(",");

        const res = await request(app)
          .patch(`${baseAPI}/${product[0].id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .field("removedMedia", allExistingFileNames);

        expect(res.status).toBe(400);
      });
    });

    // Make media becomes more than 3
    describe("Given 3 more media", () => {
      it("must throw 400 bad request", async () => {
        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await login({
          email: seller.email,
          password: "Password@123",
        });

        // insert test product
        const product = await insertManyProducts(1, seller.id);

        // new dummy file
        const dummyBuffer = Buffer.from("media content");

        const res = await request(app)
          .patch(`${baseAPI}/${product[0].id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .field("removedMedia", "random file name")
          .field("media", dummyBuffer, "media7.jpeg")
          .field("media", dummyBuffer, "media8.jpeg")
          .field("media", dummyBuffer, "media9.jpeg");

        expect(res.status).toBe(400);
      });
    });

    describe("Given new imgCover, 2 new media and delete 1 old media", () => {
      it("must update imgCover and media accordingly", async () => {
        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await login({
          email: seller.email,
          password: "Password@123",
        });

        // insert test product
        const product = await insertManyProducts(1, seller.id);

        // new dummy file
        const dummyBuffer = Buffer.from("file content");
        const res = await request(app)
          .patch(`${baseAPI}/${product[0].id}`)
          .set("Authorization", `Bearer ${accessToken}`)
          .field("imgCover", dummyBuffer, "imgCover1.jpeg")
          .field("media", dummyBuffer, "media10.jpeg")
          .field("media", dummyBuffer, "media11.jpeg")
          .field("removedMedia", product[0].media[0]);

        const updatedProduct = res.body.data;

        expect(res.status).toBe(200);
        expect(updatedProduct.imgCover.includes("imgCover1.jpeg")).toBe(true);
        expect(updatedProduct.media.includes(product[0].media[0])).toBe(false);
        expect(updatedProduct.media[0].includes("media10.jpeg")).toBe(true);
        expect(updatedProduct.media[1].includes("media11.jpeg")).toBe(true);
      });
    });
  });
});
