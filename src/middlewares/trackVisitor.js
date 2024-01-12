import Visitor from "../models/visitor.model.js";
import jwt from "jsonwebtoken";
import catchAsync from "../utils/catchAsync.js";

const trackVisitor = catchAsync(async (req, res, next) => {
  const ipAddress = req.ip;
  let userId;
  const authHeader = req.headers.authentication || req.headers.Authentication;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    const decoded = await promisify(jwt.verify)(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );
    ({ userId } = decoded.userId);
  } else {
    userId = null;
  }

  const newVisitor = new Visitor({
    userId: userId,
    ipAddress: ipAddress,
    visitDate: new Date(),
  });
  await newVisitor.save();
  next();
});

export default trackVisitor;
