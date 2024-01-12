import sendEmailWithNodemailer from "@/utils/email.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getFileSignedUrl } from "../config/s3.js";
import Product from "@/models/product.model.js";
import APIError from "./APIError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readFileAsync = async (filePath) =>
  await fs.promises.readFile(filePath, "utf-8");

const getEmailTemplate = async (templateName) => {
  const templateContent = await readFileAsync(
    path.join(__dirname, "..", "emails", `${templateName}.html`)
  );
  return templateContent;
};

const getOrderDetails = async (cartItem) => {
  const product = await Product.findById(cartItem.productId);
  const url = await getFileSignedUrl(product.imgCover);
  return {
    ...cartItem,
    productTitle: product.title,
    itemPrice: product.unitPrice,
    totalPrice: product.unitPrice * cartItem.quantity,
    sellerId: product.sellerId,
    url,
    productDes: product.description,
  };
};

const getEmailSubjectAndBody = async (
  status,
  order,
  cartItemsHTML,
  cancelRow,
  address
) => {
  switch (status) {
    case "approved":
      return [
        "Order Approved",
        await getEmailTemplate("orderApproved").then((template) =>
          template.replace("${orderId}", order.tracking_number)
        ),
      ];

    case "shipped":
      return ["Order Shipped", "Your Order has been shipped."];

    case "cancelled":
      return [
        "Order Cancelled",
        await getEmailTemplate("orderCancelled").then((template) =>
          template
            .replace("${CancelledRow}", `<ul>${cancelRow}</ul>`)
            .replace("${orderId}", order.tracking_number)
            .replace("${total}", order.totalPrice)
            .replace("${payment}", order.paymentMethod)
        ),
      ];

    case "delivered":
      return [
        "Order Delivered",
        await getEmailTemplate("orderDelivered").then((template) =>
          template
            .replace("${user}", order.userId.firstName)
            .replace("${userEmail}", order.userId.email)
            .replace("${cartItemsWithDetails}", `<ul>${cartItemsHTML}</ul>`)
            .replace("${total}", order.totalPrice)
            .replace("${totall}", order.totalPrice)
            .replace("${payment}", order.paymentMethod)
            .replace("${orderId}", order.tracking_number)
            .replace("${adress}", address.addressLine)
            .replace("${phoneNumber}", address.phoneNumber)
        ),
      ];

    case "refunded":
      return ["Order Refunded", "Your Order has been refunded."];

    default:
      throw new APIError({ status: 400, message: "Invalid status value." });
  }
};

const sendEmail = async (status, mailOptions) => {
  if (
    ["approved", "shipped", "cancelled", "delivered", "refunded"].includes(
      status
    )
  ) {
    try {
      const emailSent = await sendEmailWithNodemailer(mailOptions);
      if (!emailSent) {
        throw new APIError({ status: 500, message: "Failed to send email." });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      throw new APIError({ status: 500, message: "Failed to send email." });
    }
  }
};

export {
  readFileAsync,
  getEmailTemplate,
  getOrderDetails,
  getEmailSubjectAndBody,
  sendEmail,
};
