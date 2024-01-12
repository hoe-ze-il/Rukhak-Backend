import { faker } from "@faker-js/faker";
import Seller from "../../src/models/seller.model";
import request from "supertest";
import app from "../../src/app";
import bcrypt from "bcryptjs";

export const loginAsSeller = async ({ email, password }) => {
  const res = await request(app).post("/api/v1/auth/login/email").send({
    email,
    password,
  });

  return res.body.data.user.accessToken;
};

export const insertOneSeller = async (sellerStatus) => {
  return await Seller.create({
    firstName: faker.person.firstName().replace(/\W/g, ""),
    lastName: faker.person.lastName().replace(/\W/g, ""),
    storeName: faker.company.name(),
    email: faker.person.firstName() + faker.string.nanoid() + "@test.com",
    password: await bcrypt.hash("Password@123", 12),
    dateOfBirth: "2023-01-12",
    storeAddress: "ggwp addresss",
    storeLocation: [0, 0],
    phoneNumber: "4352384298",
    sellerStatus,
    slug: faker.string.uuid(),
    role: "seller",
  });
};

export const insertManySellers = async (n) => {
  faker.seed(123);

  const sellers = [];
  for (let i = 0; i < n; i++)
    sellers.push({
      firstName: faker.person.firstName(),
      lastName: faker.person.firstName(),
      storeName: faker.company.name(),
      email: faker.person.firstName() + faker.string.nanoid() + "@test.com",
      password: await bcrypt.hash("password", 12),
      dateOfBirth: "2023-01-12",
      storeAddress: "ggwp addresss",
      storeLocation: [0, 0],
      phoneNumber: "4352384298",
      sellerStatus: faker.helpers.arrayElement([
        "pending",
        "active",
        "inactive",
      ]),
      slug: faker.string.uuid(),
      role: "seller",
    });

  return await Seller.insertMany(sellers);
};
