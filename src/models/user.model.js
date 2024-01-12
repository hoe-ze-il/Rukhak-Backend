import mongoose from "mongoose";
import validator from "validator";
import slugify from "slugify";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import otpGenerator from "otp-generator";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      match: /^[a-zA-Z ]+$/, // Include atleast one string
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      match: /^[a-zA-Z ]+$/,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
      validate: validator.isEmail,
    },
    profilePicture: String,
    slug: {
      type: String,
      unique: true,
    },
    reasonDeleteAccount: [String],
    password: {
      type: String,
      required: true,
      validate: {
        validator(val) {
          return validator.isStrongPassword(val, {
            minSymbols: 1,
            minUppercase: 1,
            minLength: 8,
            minNumbers: 1,
            minLowercase: 1,
          });
        },
      },
    },
    role: {
      type: String,
      enum: ["user", "seller", "admin"],
      default: "user",
    },
    signupMethod: {
      type: String,
      enum: ["email", "google", "facebook"],
      default: "email",
    },
    forgotPasswordToken: String,
    forgotPasswordExpires: Date,
    passwordChangeAt: Date,
    accountVerify: {
      type: Boolean,
      default: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    enable2FA: {
      type: Boolean,
      default: false,
    },
    OTP: String,
    OTPExpires: Date,
    tempEmail: {
      type: String,
      lowercase: true,
      uniqure: true,
      trim: true,
      validate: validator.isEmail,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create an index for email field for fast searching.
userSchema.index({ email: 1 });

// Auto delete document if user not activate their account for 10 minutes.
userSchema.index(
  { updatedAt: 1 },
  {
    expireAfterSeconds: 10 * 60,
    partialFilterExpression: { accountVerify: false },
  }
);

// Virtual populate
userSchema.virtual("sessions", {
  ref: "Session",
  foreignField: "userId",
  localField: "_id",
});

userSchema.virtual("addresses", {
  ref: "Address",
  foreignField: "userId",
  localField: "_id",
});

userSchema.pre("save", async function (next) {
  if (this.isModified("firstName") || this.isModified("lastName")) {
    const fullName = `${this.firstName} ${this.lastName}`;
    this.slug = slugify(fullName + "-" + Date.now(), {
      lower: true,
      strict: true,
    });
  }
  if (this.isModified("storeName")) {
    this.storeAndSellerName = `${this.storeName} ${this.firstName} ${this.lastName}`;
  }
  if (this.email === this.tempEmail) {
    this.tempEmail = undefined;
  }
  next();
});

// All mongoose method start with find will not search for user's active equal to false
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// Methods
userSchema.methods.verifyPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.forgotPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.forgotPasswordExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.methods.createOTPToken = async function () {
  const OTP = otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const salt = await bcrypt.genSalt(10);
  this.OTP = await bcrypt.hash(OTP, salt);
  this.OTPExpires = Date.now() + 10 * 60 * 1000;
  return OTP;
};

userSchema.methods.slugEmailBeforeDelete = function (email) {
  const slugEmail = `${email}-${Date.now()}-${crypto
    .randomBytes(32)
    .toString("hex")}`;
  return slugEmail;
};

const User = mongoose.model("User", userSchema);
export default User;
