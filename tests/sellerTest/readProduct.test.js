import { setupTestDB } from "../utils/setupTestDB.js";
import request from "supertest";
import app from "@/app.js";
import {
  categories,
  insertManyProducts,
} from "../fixtures/sellerProduct.fixture.js";

import {
  insertOneSeller,
  loginAsSeller,
} from "../fixtures/sellerAccount.fixture.js";

import { insertOneUser } from "../fixtures/user.fixture.js";

import dotenv from "dotenv";
import Product from "@/models/product.model.js";

dotenv.config();

setupTestDB();

const baseAPI = "/api/v1/seller/products";

describe("Get own products (GET /seller/products)", () => {
  describe("Given not found endpoints", () => {
    it("must return 404", async () => {
      const res = await request(app).get("/api/v1/seller/productss");
      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Not found");
    });
  });

  describe("Given no authentication", () => {
    it("must return 401 unauthorized", async () => {
      const res = await request(app).get(baseAPI);

      expect(res.status).toBe(401);
    });
  });

  describe("Given 'user' role", () => {
    it("must return 403 forbidden", async () => {
      // Insert testing user
      const user = await insertOneUser();

      // Login to user account
      const userToken = await loginAsSeller({
        email: user.email,
        password: "Password@123",
      });

      const res = await request(app)
        .get(baseAPI)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("Given various sellers", () => {
    it("must only show products of the authenticated user not others", async () => {
      // Insert testing seller
      const seller1 = await insertOneSeller("active");
      const seller2 = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await loginAsSeller({
        email: seller1.email,
        password: "Password@123",
      });

      // insert test products
      await Promise.all([
        insertManyProducts(10, seller1.id),
        insertManyProducts(8, seller2.id),
      ]);

      const res = await request(app)
        .get(baseAPI)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      res.body.data.data.forEach((eachProduct) =>
        expect(eachProduct.sellerId).toBe(seller1.id)
      );
    });
  });

  describe("Given no query string", () => {
    const NUM_PRODUCTS = 400;

    it(`must limit to ${process.env.PAGE_LIMIT_DEFAULT}`, async () => {
      // Insert testing seller
      const seller = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await loginAsSeller({
        email: seller.email,
        password: "Password@123",
      });

      await insertManyProducts(NUM_PRODUCTS, seller.id);

      const res = await request(app)
        .get(baseAPI)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.metadata).toEqual({
        totalResults: NUM_PRODUCTS,
        currentPage: 1,
        totalPages: Number(NUM_PRODUCTS / process.env.PAGE_LIMIT_DEFAULT),
        limit: Number(process.env.PAGE_LIMIT_DEFAULT),
      });
      expect(res.body.data.data.length).toEqual(
        Number(process.env.PAGE_LIMIT_DEFAULT)
      );
    });
  });

  describe("Given unitPrice query", () => {
    describe("Given unitPrice from 4 to 7", () => {
      it("must show result from 4 to 7", async () => {
        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await loginAsSeller({
          email: seller.email,
          password: "Password@123",
        });

        await insertManyProducts(100, seller.id);

        const res = await request(app)
          .get(`${baseAPI}?unitPrice[gte]=4&unitPrice[lte]=7`)
          .set("Authorization", `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        res.body.data.data.forEach((each) => {
          expect(each.unitPrice >= 4).toBe(true);
          expect(each.unitPrice <= 7).toBe(true);
        });
      });
    });

    describe("Given unitPrice[gte] is negative number", () => {
      it("must respond 400 bad request", async () => {
        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await loginAsSeller({
          email: seller.email,
          password: "Password@123",
        });

        await insertManyProducts(100, seller.id);

        const res = await request(app)
          .get(`${baseAPI}?unitPrice[gte]=-4000&unitPrice[lte]=-9000`)
          .set("Authorization", `Bearer ${accessToken}`);

        expect(res.status).toBe(400);
        expect(res.body.errors[0].path).toEqual("unitPrice.gte");
        expect(res.body.errors[1].path).toEqual("unitPrice.lte");
      });
    });
  });

  describe("Given availableStock query", () => {
    describe("Given availableStock from 0 to 12", () => {
      it("must show results from 0 to 12", async () => {
        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await loginAsSeller({
          email: seller.email,
          password: "Password@123",
        });

        await insertManyProducts(100, seller.id);

        const res = await request(app)
          .get(`${baseAPI}?availableStock[gte]=0&availableStock[lte]=12`)
          .set("Authorization", `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        res.body.data.data.forEach((each) => {
          expect(each.availableStock >= 0).toBe(true);
          expect(each.availableStock <= 12).toBe(true);
        });
      });
    });

    describe("Given availableStock as not integer", () => {
      it("must return 400 bad request", async () => {
        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await loginAsSeller({
          email: seller.email,
          password: "Password@123",
        });

        await insertManyProducts(10, seller.id);

        const res = await request(app)
          .get(
            `${baseAPI}?availableStock[gte]=tothemoon&availableStock[lte]=12`
          )
          .set("Authorization", `Bearer ${accessToken}`);

        expect(res.status).toBe(400);
        expect(res.body.errors[0].path).toEqual("availableStock.gte");
      });
    });
  });

  describe("Given categories query", () => {
    describe(`Given categories=${categories[0]}`, () => {
      it(`must show results that has categories=${categories[0]}`, async () => {
        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await loginAsSeller({
          email: seller.email,
          password: "Password@123",
        });

        await insertManyProducts(150, seller.id);

        const res = await request(app)
          .get(`${baseAPI}?categories=${categories[0]}`)
          .set("Authorization", `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        res.body.data.data.forEach((each) => {
          expect(each.categories.includes(categories[0])).toBe(true);
        });
      });
    });

    describe(`Given categories= ${categories[0]}, ${categories[2]}`, () => {
      it(`must show results that has categories= ${categories[0]}, ${categories[2]}`, async () => {
        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await loginAsSeller({
          email: seller.email,
          password: "Password@123",
        });

        await insertManyProducts(150, seller.id);

        const res = await request(app)
          .get(`${baseAPI}?categories=${categories[0]},${categories[2]}`)
          .set("Authorization", `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        res.body.data.data.forEach((each) => {
          expect(
            each.categories.includes(categories[2]) ||
              each.categories.includes(categories[0])
          ).toBe(true);
        });
      });
    });
  });

  describe("Given field limits query", () => {
    describe("Given fields=title, description", () => {
      it("must show only _id, title, description", async () => {
        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await loginAsSeller({
          email: seller.email,
          password: "Password@123",
        });

        await insertManyProducts(150, seller.id);

        const res = await request(app)
          .get(`${baseAPI}?fields=title,description`)
          .set("Authorization", `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        res.body.data.data.forEach((each) => {
          expect(Object.keys(each)).toEqual(["_id", "title", "description"]);
        });
      });
    });
  });

  describe("Given limit query", () => {
    describe("Given limit=10", () => {
      it("must show only 10 results", async () => {
        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await loginAsSeller({
          email: seller.email,
          password: "Password@123",
        });

        await insertManyProducts(150, seller.id);

        const res = await request(app)
          .get(`${baseAPI}?limit=10`)
          .set("Authorization", `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.data.length).toBe(10);
      });
    });
  });

  describe("Given search query (ie. q)", () => {
    describe("Given search query = plast sues", () => {
      it("must show results related to 'plast sues'", async () => {
        const searchTerm = "plast sues";

        // Insert testing seller
        const seller = await insertOneSeller("active");

        // Login to one of the active sellers
        const accessToken = await loginAsSeller({
          email: seller.email,
          password: "Password@123",
        });

        await insertManyProducts(150, seller.id);

        // Why: to make AtlasSearch finish indexing before searching
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const products = await Product.aggregate([
          {
            $search: {
              index: "product-search",
              compound: {
                should: [
                  {
                    text: {
                      query: searchTerm,
                      path: "title",
                      score: { boost: { value: 3 } },
                      fuzzy: {},
                    },
                  },
                  {
                    text: {
                      query: searchTerm,
                      path: "description",
                      fuzzy: {},
                    },
                  },
                ],
              },
            },
          },
          { $limit: 5 },
          { $project: { title: 1 } },
        ]).exec();

        const res = await request(app)
          .get(`${baseAPI}?q=${searchTerm}&limit=5&fields=title`)
          .set("Authorization", `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        for (let i = 0; i < products.length; i++) {
          expect(res.body.data.data[i].title).toBe(products[i].title);
        }
      });
    });
  });

  describe("Given imgCover field", () => {
    it("must generate signed url for it", async () => {
      // Insert testing seller
      const seller = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await loginAsSeller({
        email: seller.email,
        password: "Password@123",
      });

      await insertManyProducts(10, seller.id);

      const res = await request(app)
        .get(`${baseAPI}?fields=title,imgCover,media&limit=4`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data.length).toBe(4);
      res.body.data.data.forEach((item) => {
        expect(item.imgCover.includes("X-Amz-Signature=")).toBe(true);
        item.media.forEach((eachMedia) =>
          expect(eachMedia.includes("X-Amz-Signature=")).toBe(false)
        );
      });
    });
  });
});

describe("Get own product detail", () => {
  describe("Given 'user' role", () => {
    it("must return 403 forbidden", async () => {
      // Insert testing user
      const user = await insertOneUser();

      // Login to user account
      const userToken = await loginAsSeller({
        email: user.email,
        password: "Password@123",
      });

      const res = await request(app)
        .get(`${baseAPI}/655f1035c84f800a020137cf`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("Given not available product ID", () => {
    it("must show 404 not found", async () => {
      // Insert testing seller
      const seller = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await loginAsSeller({
        email: seller.email,
        password: "Password@123",
      });

      const res = await request(app)
        .get(`${baseAPI}/655f1035c84f800a020137cf`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("There is no document found with this ID.");
    });
  });

  describe("Given a valid product ID", () => {
    it("must return result with signed URL", async () => {
      // Insert testing seller
      const seller = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await loginAsSeller({
        email: seller.email,
        password: "Password@123",
      });

      const dummyProduct = await insertManyProducts(1, seller.id);

      const res = await request(app)
        .get(`${baseAPI}/${dummyProduct[0].id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      const { signedImgCover } = res.body.data;
      const mediaUrl = res.body.data.signedMedia[0];

      expect(res.status).toBe(200);
      expect(signedImgCover.includes("X-Amz-Signature=")).toBe(true);
      expect(mediaUrl.includes("X-Amz-Signature=")).toBe(true);
    });
  });

  describe("Given product ID of OTHER seller", () => {
    it("must return 404 not found", async () => {
      // Insert testing sellers
      const seller1 = await insertOneSeller("active");
      const seller2 = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken1 = await loginAsSeller({
        email: seller1.email,
        password: "Password@123",
      });

      // insert test products
      await insertManyProducts(1, seller1.id);
      const productOfSeller2 = await insertManyProducts(1, seller2.id);

      const res = await request(app)
        .get(`${baseAPI}/${productOfSeller2[0].id}`)
        .set("Authorization", `Bearer ${accessToken1}`);

      expect(res.status).toBe(404);
    });
  });
});
