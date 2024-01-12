import Order from "@/models/order.model.js";
import APIError from "@/utils/APIError.js";
import sendEmailWithNodemailer from "@/utils/email.js";
import User from "@/models/user.model.js";
import Notification from "@/models/notification.model.js";
import {
  cancelledRow,
  generateCartItemHTML,
  generateCartItemHTMLRow,
} from "@/utils/emailTemplate.js";
import mongoose from "mongoose";
import Address from "@/models/address.model.js";
import { dialogflowService } from "@/utils/dialogflow.js";
import dotenv from "dotenv";
import {
  getEmailTemplate,
  getOrderDetails,
  getEmailSubjectAndBody,
  sendEmail,
} from "@/utils/emailHelper.js";
import { getFileSignedUrl } from "@/config/s3.js";
dotenv.config();
const orderService = {
  getAllOrders: async () => {
    const orders = await Order.find({}).populate("cartItems.productId");
    if (!orders)
      throw new APIError({ status: 404, message: "Order not found." });
    return orders;
  },
  getOrder: async (orderId) => {
    const order = await Order.findById(orderId)
      .populate({
        path: "userId",
        select: ["phoneNumber", "firstName", "email"],
      })
      .populate({
        path: "cartItems.productId",
        select: ["imgCover", "categories", "title", "unit"],
      })
      .populate({
        path: "shipping.address",
      });
    if (!order)
      throw new APIError({ status: 404, message: "Order not found." });
    for (const cartItem of order.cartItems) {
      if (cartItem.productId.imgCover) {
        cartItem.productId.imgCover = await getFileSignedUrl(
          cartItem.productId.imgCover
        );
      }
    }
    return order;
  },
  ChartOrder: async (userId) => {
    const order = await orderService.getSellerOrder();
    const orders = order.docs.filter((order) =>
      order.sellerId.some((id) => id.toString() === userId.sellerId)
    );
    const monthlyWeeks = {};
    const yearlyMonths = {};
    if (!orders) {
      throw new APIError({ status: 404, message: "Order not found." });
    }
    for (const order of orders) {
      const createdAt = new Date(order.createAt);
      const monthStartDate = new Date(
        createdAt.getFullYear(),
        createdAt.getMonth(),
        1
      );
      const weekNumber = Math.floor((createdAt.getDate() - 1) / 7) + 1;
      const monthlyKey = `${monthStartDate.toISOString()}_Week${weekNumber}`;
      if (!monthlyWeeks[monthlyKey]) {
        monthlyWeeks[monthlyKey] = {
          startDate: monthStartDate.toISOString(),
          weekNumber,
          count: 1,
        };
      } else {
        monthlyWeeks[monthlyKey].count++;
      }
      const yearlyKey = `${createdAt.getFullYear()}_${
        createdAt.getMonth() + 1
      }`;
      if (!yearlyMonths[yearlyKey]) {
        yearlyMonths[yearlyKey] = {
          year: createdAt.getFullYear(),
          month: createdAt.getMonth() + 1,
          count: 1,
        };
      } else {
        yearlyMonths[yearlyKey].count++;
      }
    }
    const monthlyWeeksArray = Object.values(monthlyWeeks);
    const yearlyMonthsArray = Object.values(yearlyMonths);
    return { monthly: monthlyWeeksArray, yearly: yearlyMonthsArray };
  },
  updateOrder: async (orderId, orderBody) => {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(orderId).populate("userId");
        if (!order) {
          throw new APIError({ status: 404, message: "Order not found." });
        }
        order.set(orderBody);
        const address = await Address.findById(order.shipping.address);
        console.log(address);
        const cartItemsWithDetails = await Promise.all(
          order.cartItems.map(getOrderDetails)
        );
        const cartItemsHTML = cartItemsWithDetails
          .map(generateCartItemHTMLRow)
          .join("");
        const { status } = order.shipping;
        const cancelRow = cartItemsWithDetails.map(cancelledRow).join("");
        const [emailSubject, emailBody] = await getEmailSubjectAndBody(
          status,
          order,
          cartItemsHTML,
          cancelRow,
          address
        );
        const mailOptions = {
          from: process.env.EMAIL_FROM,
          to: order.userId.email,
          subject: emailSubject,
          html: emailBody,
        };
        if (status === "approved") {
          await order.cutStock();
        }
        console.log(order);
        await order.save(session);
        await sendEmail(status, mailOptions);
      });
    } catch (error) {
      console.error(error);
      throw new APIError({ status: 500, message: error.message });
    } finally {
      session.endSession();
    }
  },
  userUpdateOrder: async (orderId, orderBody) => {
    const order = await Order.findById(orderId);
    if (!order)
      throw new APIError({ status: 404, message: "Order not found." });
    if (
      orderBody.shipping.status === "cancelled" &&
      order.shipping.status === "pending"
    ) {
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { "shipping.status": "cancelled" },
        { new: true }
      );
      if (!updatedOrder) {
        throw new APIError({ status: 404, message: "Order not found." });
      }
      const cartItemsWithDetails = await Promise.all(
        updatedOrder.cartItems.map(getOrderDetails)
      );
      const cartItemsHTML = cartItemsWithDetails
        .map(generateCartItemHTMLRow)
        .join("");
      const cancelRow = cartItemsWithDetails.map(cancelledRow).join("");
      const { status } = updatedOrder.shipping;
      const seller = await User.findById(cartItemsWithDetails[0]?.sellerId);
      const address = await Address.findById(updatedOrder.shipping.address);
      const [emailSubject, emailBody] = await getEmailSubjectAndBody(
        status,
        updatedOrder,
        seller,
        address,
        cartItemsHTML,
        cancelRow
      );
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: seller.email,
        subject: emailSubject,
        html: emailBody,
      };
      await sendEmail(status, mailOptions);
      return updatedOrder;
    } else {
      throw new APIError({
        status: 403,
        message: "You don't have permission to perform this action.",
      });
    }
  },
  getUserOrder: async (userId) => {
    let orders = await orderService.getAllOrders();
    console.log(orders);
    if (orders) {
      orders = await Promise.all(
        orders.map(async (order) => {
          if (order.cartItems) {
            order.cartItems = await Promise.all(
              order.cartItems.map(async (item) => {
                if (item.productId.imgCover) {
                  item.productId.imgCover = await getFileSignedUrl(
                    item.productId.imgCover
                  );
                }
                return item;
              })
            );
          }
          return order;
        })
      );
    }
    const userOrders = orders.filter(
      (order) => order.userId.toString() === userId.userId
    );
    return userOrders;
  },
  getSellerOrder: async () => {
    try {
      const orders = await Order.find({}).populate("cartItems.productId", [
        "sellerId",
        "title",
      ]);
      const sellerOrders = [];
      if (!orders || orders.length === 0) {
        return {
          message: "Seller orders not found.",
          results: 0,
          docs: [],
        };
      }
      for (const order of orders) {
        if (order.cartItems && order.cartItems.length > 0) {
          const uniqueSellerIds = new Set(
            order.cartItems.map((item) => item.productId.sellerId)
          );
          const title = new Set(
            order.cartItems.map((item) => item.productId.title)
          );
          const sellerOrder = {
            orderId: order._id,
            paymentMethod: order.paymentMethod,
            Orders: order.cartItems.map((item) => ({
              productId: item.productId._id,
              quantity: item.quantity,
              itemPrice: item.itemPrice,
              _id: item._id,
            })),
            shipping: order.shipping,
            createAt: order.createdAt,
            sellerId: [...uniqueSellerIds],
            title: [...title],
          };
          sellerOrders.push(sellerOrder);
        }
      }
      return {
        message: "Data Retrieved",
        results: sellerOrders.length,
        docs: sellerOrders,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  getSellerOrderById: async (userId) => {
    const sellerOrders = await orderService.getSellerOrder();
    const filteredOrders = sellerOrders.docs.filter((order) =>
      order.sellerId.some((id) => id.toString() === userId.sellerId)
    );
    // Remove sellerId from each order
    const ordersWithoutSellerId = filteredOrders.map((order) => {
      const { sellerId, ...orderWithoutSellerId } = order;
      return orderWithoutSellerId;
    });
    return {
      message: "Filtered Data Retrieved",
      results: ordersWithoutSellerId.length,
      docs: ordersWithoutSellerId,
    };
  },
  deleteOrder: async (orderId) => {
    const order = await Order.findByIdAndDelete(orderId);
    if (!order)
      throw new APIError({ status: 404, message: "Order not found." });
    return order;
  },
  createOrder: async (orderBody) => {
    const cartItemsWithDetails = await Promise.all(
      orderBody.cartItems.map(getOrderDetails)
    );
    const totalPrice = cartItemsWithDetails.reduce(
      (total, cartItem) => total + cartItem.quantity * cartItem.itemPrice,
      0
    );
    orderBody.totalPrice = totalPrice.toFixed(2);
    const [seller, user] = await Promise.all([
      User.findById(cartItemsWithDetails[0]?.sellerId),
      User.findById(orderBody.userId),
    ]);
    const [emailConfirmation, emailNotifySeller] = await Promise.all([
      getEmailTemplate("confirmationOrder"),
      getEmailTemplate("orderNotifySeller"),
    ]);
    const cartItemsHTML = cartItemsWithDetails
      .map(generateCartItemHTML)
      .join("");

    const order = await Order.create(orderBody);
    dialogflowService.addEntityValues(process.env.UNQILD, [
      order.tracking_number,
    ]);
    const mailOptionsUser = {
      from: process.env.EMAIL_FROM,
      to: user?.email,
      subject: "Order Confirmation",
      html: emailConfirmation
        .replace("${cartItemsWithDetails}", `<ul>${cartItemsHTML}</ul>`)
        .replace("${totalPrice}", totalPrice.toFixed(2)),
    };
    const mailOptionSeller = {
      from: process.env.EMAIL_FROM,
      to: seller?.email,
      subject: "New Order Arrived",
      html: emailNotifySeller
        .replace("${cartItemsWithDetails}", `<ul>${cartItemsHTML}</ul>`)
        .replace("${totalPrice}", totalPrice.toFixed(2))
        .replace("${orderId}", order._id),
    };
    if (user && seller && order.isPaid) {
      const [emailUser, emailSeller] = await Promise.all([
        sendEmailWithNodemailer(mailOptionsUser),
        sendEmailWithNodemailer(mailOptionSeller),
      ]);
      await Notification.insertNotification(
        seller._id,
        new mongoose.Types.ObjectId(),
        "Order Notification",
        "Got new order",
        "Product order",
        order._id
      );
      if (!emailUser || !emailSeller) {
        throw new APIError({
          status: 500,
          message: "Failed to send email to user or seller.",
        });
      }
    }
    return order;
  },
};
export default orderService;
