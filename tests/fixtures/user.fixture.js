import { faker } from "@faker-js/faker";
import User from "../../src/models/user.model";
import request from "supertest";
import app from "../../src/app";
import bcrypt from "bcryptjs";

export const login = async ({ email, password }) => {
  const res = await request(app).post("/api/v1/auth/login/email").send({
    email,
    password,
  });

  return res.body.data.user.accessToken;
};

export const insertOneUser = async () => {
  return await User.create({
    firstName: faker.person.firstName().replace(/\W/g, ""),
    lastName: faker.person.lastName().replace(/\W/g, ""),
    email: faker.person.firstName() + faker.string.nanoid() + "@test.com",
    password: await bcrypt.hash("Password@123", 12),
    slug: faker.string.uuid(),
    role: "user",
  });
};
