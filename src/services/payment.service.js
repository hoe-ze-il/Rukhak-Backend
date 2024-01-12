import dotenv from "dotenv";
import paypal from "paypal-rest-sdk";

dotenv.config();

paypal.configure({
  mode: "sandbox",
  client_id: "CLIENT_ID",
  client_secret: "CLIENT_SECRET",
});

const createPayment = function (paymentData) {
  return new Promise((resolve, reject) => {
    const payment = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: "http://localhost:5173/success",
        cancel_url: "http://localhost:5173/cancel",
      },
      transactions: [
        {
          amount: {
            currency: "USD",
            total: paymentData.totalPrice,
          },
          description: paymentData.description,
        },
      ],
    };

    paypal.payment.create(payment, function (error, payment) {
      if (error) {
        reject(error);
      } else {
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === "approval_url") {
            resolve(payment.links[i].href);
          }
        }
      }
    });
  });
};

const executePayment = function (paymentId, payerId) {
  return new Promise((resolve, reject) => {
    const execute_payment_json = {
      payer_id: payerId,
      transactions: [
        {
          amount: {
            currency: "USD",
            total: paymentId.totalPrice,
          },
        },
      ],
    };

    paypal.payment.execute(
      paymentId,
      execute_payment_json,
      function (error, payment) {
        if (error) {
          reject(error);
        } else {
          resolve(payment);
        }
      }
    );
  });
};

export default { createPayment, executePayment };
