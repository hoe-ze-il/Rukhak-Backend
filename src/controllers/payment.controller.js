import paymentService from "@/services/payment.service.js";

const createPayment = async function (req, res) {
  try {
    const approvalUrl = await paymentService.createPayment(req.body);
    res.redirect(approvalUrl);
  } catch (error) {
    res.status(500).send(error);
  }
};

const executePayment = async function (req, res) {
  try {
    const payment = await paymentService.executePayment(
      req.query.paymentId,
      req.query.PayerID
    );
    res.send(payment);
  } catch (error) {
    res.status(500).send(error);
  }
};

export default { createPayment, executePayment };
