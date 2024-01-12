/**
 * @fileoverview Use this file to create dummy data for development/testing purposes
 */

import { faker } from "@faker-js/faker";
import mongoose from "mongoose";
import Product from "@/models/product.model.js";
import dotenv from "dotenv";
import { categories } from "../fixtures/sellerProduct.fixture.js";
import Category from "@/models/category.model.js";
import Seller from "@/models/seller.model.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI_DEV).then(() => {
  console.log("DB connection open for seeding...");
});

function generateSeedSellers(n) {
  let sellers = [];
  for (let i = 0; i < n; i++) {
    const email = faker.person.firstName() + faker.string.nanoid() + "@gg.com";
    const firstName = faker.person.firstName();
    const lastName = faker.person.firstName();
    const storeName = faker.company.name();
    const seller = new Seller({
      firstName,
      lastName,
      email,
      password: faker.string.alphanumeric(8) + faker.string.nanoid(),
      role: "seller",
      phoneNumber: faker.phone.number(),
      storeName,
      storeAndSellerName: storeName + " " + firstName + " " + lastName,
      sellerStatus: faker.helpers.arrayElement([
        "pending",
        "active",
        "inactive",
      ]),
      slug: faker.string.uuid(),
    });
    sellers.push(seller);
  }

  return sellers;
}

function generateSeedCategories() {
  return [
    { name: "garden", description: "Lorem ipsum 1", icon: "icon1.svg" },
    { name: "water", description: "Lorem ipsum 2", icon: "icon2.svg" },
    { name: "land", description: "Lorem ipsum 3", icon: "icon3.svg" },
    { name: "tools", description: "Lorem ipsum 4", icon: "icon4.svg" },
  ];
}

function generateSeedProducts(n) {
  const productUnits = Product.schema.path("unit").enumValues;
  const productStatuses = Product.schema.path("status").enumValues;

  let products = [];

  function chooseRandomPrice(min, max) {
    const randomDecimal = Math.random();
    // Scale the random decimal to the range between min and max
    const randomInRange = randomDecimal * (max - min) + min;

    // Round the result to avoid floating-point precision issues
    const randomPrice = randomInRange.toFixed(2);

    return randomPrice;
  }

  for (let i = 0; i < n; i++) {
    const title = faker.commerce.productName();
    const slug = title + faker.string.uuid();
    const basePrice = chooseRandomPrice(1, 100);
    const unitPrice = (basePrice * 110) / 100;

    const product = new Product({
      title,
      slug,
      description: faker.commerce.productDescription(),
      unit: faker.helpers.arrayElement(productUnits),
      basePrice,
      unitPrice,
      availableStock: faker.number.int(100),
      imgCover: faker.airline.aircraftType(),
      media: [faker.airline.aircraftType()],
      categories: faker.helpers.arrayElements(categories, {
        min: 1,
        max: 3,
      }),
      status: faker.helpers.arrayElement(productStatuses),
    });
    products.push(product);
  }

  return products;
}

async function seedDB() {
  try {
    // const seedSellers = generateSeedSellers(50);
    // await Seller.deleteMany();
    // await Seller.insertMany(seedSellers);

    const seedCategories = generateSeedCategories();
    await Category.deleteMany();
    await Category.insertMany(seedCategories);

    const seedProducts = generateSeedProducts(1000);
    await Product.deleteMany();
    await Product.insertMany(seedProducts);
  } catch (error) {
    console.log("Error:", error.message);
  }
}

seedDB()
  .then(() => {
    return mongoose.connection.close();
  })
  .then(() => {
    console.log("DB seeding done. Closed DB connection...");
  });
