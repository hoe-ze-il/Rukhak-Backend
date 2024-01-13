import User from "@/models/user.model.js";
import Session from "@/models/session.model.js";
import Seller from "@/models/seller.model.js";
import APIError from "@/utils/APIError.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import Notification from "@/models/notification.model.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authService = {
  localHost: process.env.CLIENT_URL,
  productionURL: process.env.PRODUCTION_URL,
  setURL() {
    return (this.URL = this.productionURL || this.localHost);
  },
  signAccessToken(userId) {
    return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES,
    });
  },
  signRefreshToken(userId) {
    return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES,
    });
  },
  signup: {
    async signTokenForActivateAccount(data) {
      const { email } = data;
      return jwt
        .sign({ email }, process.env.ACCOUNT_ACTIVATION_TOKEN, {
          expiresIn: process.env.ACCOUNT_ACTICATION_TOKEN_EXPIRES,
        })
        .replaceAll(".", "RUKHAK2023"); // Prevent page not found on client side.
    },

    async createNewUser(resultSendEmail, data) {
      const { email, password, firstName, lastName } = data;

      if (!resultSendEmail) {
        throw new APIError({
          status: 500,
          message: "Internal server error",
        });
      }
      const user = await User.create({
        email,
        password: await bcrypt.hash(password, 12),
        firstName,
        lastName,
        accountVerify: false, // Account not yet activate
      });

      return user;
    },

    async createEmail(token, data) {
      const { email } = data;
      const activationLink = `${authService.setURL()}/auth/activate/${token}`;
      const emailTemplate = await fs.promises.readFile(
        path.join(__dirname, "..", "emails", "accountActivation.html"),
        "utf-8"
      );
      const emailData = {
        from: "rukhakshop <example@gmail.com>",
        to: email,
        subject: "Activate Your Account",
        html: emailTemplate.replace("${activationLink}", activationLink),
      };

      return emailData;
    },

    verifyResult(resultSendEmail) {
      if (!resultSendEmail) {
        throw new APIError({
          status: 500,
          message: "Internal server error.",
        });
      }
    },

    activateAccount(data) {
      const { token } = data;
      if (!token) {
        throw new APIError({
          status: 401,
          message: "Token is undefined! Please signup again.",
        });
      }
      return jwt.verify(
        token,
        process.env.ACCOUNT_ACTIVATION_TOKEN,
        async (err, decoded) => {
          if (err) {
            throw new APIError({
              status: 401,
              message: "Link Expired! Please signup again",
            });
          }

          const { email } = decoded;

          if (!email) {
            throw new APIError({
              status: 401,
              message:
                "Please sign up again! Make sure to fill in all required information.",
            });
          }

          const user = await User.findOne({ email });

          if (!user) {
            throw new APIError({
              status: 410,
              message: "Account activation expired. Please sign up again.",
            });
          }

          user.accountVerify = true;
          await user.save();

          return user;
        }
      );
    },
  },
  login: {
    async verifyUserByEmailAndPassword(data) {
      const { email, password } = data;
      const user = await User.findOne({ email }).select("+password");
      if (
        !user ||
        (user && user.signupMethod !== "email") ||
        !(await user.verifyPassword(password))
      ) {
        throw new APIError({
          status: 400,
          message: "Email or password is incorrected.", // For more secure and prevent malicious from knowing which field they input wrong.
        });
      } else if (user && user.accountVerify === false) {
        throw new APIError({
          status: 401,
          message: "Please activate your account first.",
        });
      }

      return user;
    },
  },
  googleSignIn: {
    async verifyIdToken(client, data) {
      const { credential } = data;
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const { email_verified, given_name, family_name, email } = payload;
      if (email_verified) {
        const user = await User.findOne({ email });
        if (user) {
          return user;
        }
        const newUser = new User({
          firstName: given_name,
          lastName: family_name,
          email,
          active: true,
          signupMethod: "google",
        });
        await newUser.save({ validateBeforeSave: false });
      }
      throw new APIError({
        status: 400,
        message:
          "Google login failed. Please try again later or choose another method.",
      });
    },
  },
  refreshToken: {
    checkCookie(cookies) {
      if (!cookies?.jwt) {
        throw new APIError({
          status: 401,
          message:
            "Unauthorized: Access is denied due to invalid credentials. Please login again.",
        });
      }
      return cookies?.jwt;
    },

    async verifySession(cookieRefreshToken) {
      const session = await Session.findOne({
        refreshToken: cookieRefreshToken,
      });
      if (!session) {
        throw new APIError({ status: 403, message: "Unauthorize" });
      }
      return session;
    },

    verifyRefreshToken(cookieRefreshToken, session) {
      return jwt.verify(
        cookieRefreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
          // error means refresh token may expired (required to log in again )
          if (err || session.userId.toString() !== decoded.userId) {
            await session.deleteOne();
            throw new APIError({ status: 403, message: "Unauthorize" });
          }

          const { userId } = decoded;
          const accessToken = authService.signAccessToken(userId);
          const refreshToken = authService.signRefreshToken(userId);
          session.accessToken = accessToken;
          session.refreshToken = refreshToken;
          await session.save();
          const data = { accessToken, refreshToken };
          return data;
        }
      );
    },

    async findUser(session) {
      const { userId } = session;
      const user = await User.findById(userId);
      if (!user) {
        throw new APIError({
          status: 404,
          message: "User not found.",
        });
      }
      return user;
    },
  },
  signupSeller: {
    async verifyUserById(req) {
      const user = await User.findById(req.user.id).select("+password");
      if (!user) {
        throw new APIError({
          status: 404,
          message: "User not found.",
        });
      }

      return user;
    },

    async createSeller(sellerData, user) {
      const {
        storeName,
        storeAddress,
        phoneNumber,
        storeLocation,
        dateOfBirth,
      } = sellerData;

      const seller = Seller.hydrate(user);

      // Update seller-specific fields
      seller.storeName = storeName;
      seller.storeAddress = storeAddress;
      seller.phoneNumber = phoneNumber;
      seller.storeLocation = storeLocation;
      seller.dateOfBirth = dateOfBirth;
      seller.role = "seller";

      await seller.save();

      // Insert notification
      await Notification.insertNotification(
        "6560669998161a8467e3705d",
        user.id,
        "Request to become seller",
        `Mr/Ms ${user.lastName} request to become seller`,
        "Activate Shop",
        user.id
      );

      return seller;
    },

    async verifySeller(sellerId) {
      const seller = await User.findById(sellerId);
      if (!seller) {
        throw new APIError({
          status: 404,
          message: `Document Not Found: User id ${sellerId}, does not exist in data base.`,
        });
      }
      return seller;
    },

    async updateSellerStatus(seller, action) {
      if (action === "approve") {
        seller.sellerStatus = "active";
        await seller.save();

        await Notification.insertNotification(
          seller.id,
          "6560669998161a8467e3705d",
          "Seller Activated",
          `Congratz Mr/Ms ${seller.lastName} to become ours seller `,
          "Shop Activated",
          seller.id
        );
      } else {
        seller.sellerStatus = "inactive";
        seller.role = "user";
        await seller.save();
      }
    },
  },
  forgotPassword: {
    async verifyUserByEmail(data) {
      const { email } = data;
      const user = await User.findOne({ email });
      if (!user) {
        throw new APIError({
          status: 404,
          message: "Email does not exist.",
        });
      }
      return user;
    },

    async createEmail(data, resetToken) {
      const { email } = data;
      const resetLink = `${authService.setURL()}/auth/reset-password/${resetToken}`;
      const emailTemplate = await fs.promises.readFile(
        path.join(__dirname, "..", "emails", "resetPassword.html"),
        "utf-8"
      );
      const emailData = {
        from: "rukhakshop <example@gmail.com>",
        to: email,
        subject: "Password Reset Request",
        html: emailTemplate.replace("${resetLink}", resetLink),
      };

      return emailData;
    },

    verifyResult(resultSendEmail) {
      if (!resultSendEmail) {
        throw new APIError({
          status: 500,
          message: "Internal server error. Unable to send email.",
        });
      }
    },

    hashToken(data) {
      const { resetToken } = data;
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      return hashedToken;
    },

    async verifyUserByToken(hashedToken) {
      const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordExpires: { $gt: Date.now() },
      });
      if (!user) {
        throw new APIError({
          status: 400,
          message: "Token is invalid or has expired, Please request again.",
        });
      }

      return user;
    },

    async createNewPassword(data, user) {
      const { newPassword } = data;
      user.password = await bcrypt.hash(newPassword, 12);
      user.forgotPasswordToken = undefined;
      user.forgotPasswordExpires = undefined;
      await user.save();
    },

    async deleteSession(refreshToken) {
      if (refreshToken) {
        await Session.deleteMany({ refreshToken: { $ne: refreshToken } });
      } else {
        await Session.deleteMany({ refreshToken });
      }
    },
  },
  twoFA: {
    async createEmail(user, OTP, data) {
      const email = data?.newEmail ? user.tempEmail : user.email;
      const emailTemplate = await fs.promises.readFile(
        path.join(__dirname, "..", "emails", "twoFA.html"),
        "utf-8"
      );
      const emailData = {
        from: "rukhakshop <noreply@rukhak.com>",
        to: email,
        subject: "Rukhak 2-Step Verification Code",
        html: emailTemplate.replaceAll("${OTP}", OTP),
      };

      return emailData;
    },

    verifyResult(resultSendEmail) {
      if (!resultSendEmail) {
        throw new APIError({
          status: 500,
          message: "Internal server error.",
        });
      }
    },
  },
  logOut: {
    checkJWT(res, cookies) {
      if (!cookies?.jwt) return res.status(204).send();
      return cookies.jwt;
    },

    async deleteSession(refreshToken) {
      await Session.findOneAndDelete({ refreshToken });
    },
  },
};

export default authService;
