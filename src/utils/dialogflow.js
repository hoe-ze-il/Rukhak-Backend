import BotService from "@/services/bot.service.js";

export const dialogflowService = BotService(
  process.env.GOOGLE_PROJECT_ID,
  process.env.DIALOGFLOW_SESSION_ID,
  process.env.DIALOGFLOW_SESSION_LANGUAGE_CODE
);
