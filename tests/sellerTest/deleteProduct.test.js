import { setupTestDB } from "../utils/setupTestDB.js";
import request from "supertest";
import app from "../../src/app.js";
import { insertOneUser, login } from "../fixtures/user.fixture.js";
import { insertOneSeller } from "../fixtures/sellerAccount.fixture.js";
import { insertManyProducts } from "../fixtures/sellerProduct.fixture.js";
import Product from "../../src/models/product.model.js";

setupTestDB();

const baseAPI = "/api/v1/seller/products";

describe("Delete a product", () => {
  describe("Given no auth", () => {
    it("must return 401 unauthorized", async () => {
      const res = await request(app).delete(
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
        .delete(`${baseAPI}/655f1035c84f800a020137cf`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("Given one seller delete OTHER seller's product", () => {
    it("must return 404 not found", async () => {
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
        .delete(`${baseAPI}/${seller2Prods[0].id}`)
        .set("Authorization", `Bearer ${accessToken1}`);

      const seller2Product = await Product.findById(seller2Prods[0].id);

      expect(res.status).toBe(404);
      expect(seller2Product.status).toBe("public");
    });
  });

  describe("Given a correct product ID", () => {
    it("must return 204 no content", async () => {
      // Insert testing seller
      const seller = await insertOneSeller("active");

      // Login to one of the active sellers
      const accessToken = await login({
        email: seller.email,
        password: "Password@123",
      });

      // insert test products
      const product = await insertManyProducts(1, seller.id);

      const res = await request(app)
        .delete(`${baseAPI}/${product[0].id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      const deletedProduct = await Product.findById(product[0].id);

      expect(res.status).toBe(204);
      expect(deletedProduct.status).toBe("deleted");
    });
  });
});
