import { SessionsClient, EntityTypesClient } from "@google-cloud/dialogflow";
import APIError from "@/utils/APIError.js";
import Order from "@/models/order.model.js";

function BotService(projectId, sessionId, languageCode) {
  const sessionClient = new SessionsClient();
  const sessionPath = sessionClient.projectAgentSessionPath(
    projectId,
    sessionId
  );
  const entityTypesClient = new EntityTypesClient();
  let isTrackOrder = false;
  let isOrder = false;

  async function getOrderStatusByShippingId(trackNumber) {
    try {
      const order = await Order.findOne({
        tracking_number: trackNumber,
      });

      if (order) {
        return order.shipping.status;
      } else {
        return "NoFound";
      }
    } catch (error) {
      console.error(error);
      throw new APIError({ status: 500, message: "Internal server error" });
    }
  }

  async function detectTextIntent(text) {
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text,
          languageCode: languageCode,
        },
      },
    };
    try {
      const [response] = await sessionClient.detectIntent(request);
      return response.queryResult;
    } catch (error) {
      console.error("Error detecting text intent:", error);
      throw new APIError({ status: 500, message: "Internal server error" });
    }
  }

  async function addEntityValues(entityTypeName, newValues) {
    try {
      const [existingEntityType] = await entityTypesClient.getEntityType({
        name: `projects/${projectId}/locations/global/agent/entityTypes/${entityTypeName}`,
      });

      if (!existingEntityType) {
        throw new Error(`Entity type ${entityTypeName} not found.`);
      }

      const updatedEntityType = {
        ...existingEntityType,
        entities: [
          ...(existingEntityType.entities || []),
          ...newValues.map((value) => ({ value })),
        ],
      };

      await entityTypesClient.updateEntityType({
        entityType: updatedEntityType,
        updateMask: {
          paths: ["entities"],
        },
      });
    } catch (error) {
      console.error(`Error adding entity values: ${error.message}`);
    }
  }

  return {
    isTrackOrder,
    isOrder,
    getOrderStatusByShippingId,
    detectTextIntent,
    addEntityValues,
  };
}
export default BotService;
