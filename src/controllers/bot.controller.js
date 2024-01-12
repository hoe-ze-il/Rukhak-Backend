import dotenv from "dotenv";
import { dialogflowService } from "@/utils/dialogflow.js";
dotenv.config();

export default async function handleTextQuery(req, res) {
  const { text } = req.body;

  try {
    const result = await dialogflowService.detectTextIntent(text);
    const intentName = result.intent.displayName;

    switch (intentName) {
      case "add.order":
        if (!dialogflowService.isOrder) {
          result.fulfillmentText =
            "please create order before add product to cart . Example: create order ...";
        } else {
          result.fulfillmentText = result.fulfillmentText;
        }

        break;
      case "create.order":
        dialogflowService.isOrder = true;
        break;
      case "track.order":
        dialogflowService.isTrackOrder = true;
        break;
      case "order.id":
        if (!dialogflowService.isTrackOrder) {
          result.fulfillmentText = "Please start tracking an order first.";
        } else {
          const trackId = result.parameters.fields.id.stringValue;
          const shipping =
            await dialogflowService.getOrderStatusByShippingId(trackId);

          if (shipping === "NoFound") {
            result.fulfillmentText = "Sorry, we can't find your ShippingId";
          } else {
            result.fulfillmentText = `Thank you! Here is your status: ${shipping}`;
          }

          dialogflowService.isTrackOrder = false;
        }

        break;
      case "order.remove":
        result.fulfillmentText = result.fulfillmentText;
        break;
      case "order.completed":
        dialogflowService.isOrder = false;
        result.fulfillmentText = "Do you want to checkout ?";
        break;
      default:
    }

    res.send(result);
  } catch (error) {
    console.error("Error processing text query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
