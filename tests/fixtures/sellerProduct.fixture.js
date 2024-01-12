import { faker } from "@faker-js/faker";
import Product from "@/models/product.model.js";

const productUnits = Product.schema.path("unit").enumValues;
export const categories = ["waterplant", "landplant", "tools", "fruit"];

function _chooseRandomPrice(min, max) {
  const randomDecimal = Math.random();
  // Scale the random decimal to the range between min and max
  const randomInRange = randomDecimal * (max - min) + min;

  // Round the result to avoid floating-point precision issues
  const randomPrice = randomInRange.toFixed(2);

  return randomPrice;
}

export const insertManyProducts = async (n, sellerId) => {
  const products = [];
  for (let i = 0; i < n; i++) {
    const basePrice = _chooseRandomPrice(1, 100);
    const unitPrice = (basePrice * 110) / 100;
    products.push({
      title: faker.commerce.productName(),
      slug: faker.string.uuid(),
      description: faker.commerce.productDescription(),
      basePrice,
      unitPrice,
      unit: faker.helpers.arrayElement(productUnits),
      availableStock: faker.number.int(100),
      imgCover: faker.airline.aircraftType(),
      media: [faker.airline.aircraftType()],
      categories: faker.helpers.arrayElements(categories, {
        min: 1,
        max: 3,
      }),
      sellerId,
    });
  }
  return await Product.insertMany(products);
};
