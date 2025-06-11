import { z } from "zod";

export const sendMessageSchema = z.object({
  apiKey: z.string(),
  chatModel: z.string(),
  conversationId: z.string(),
  newChatId: z.string(),
  newChatContent: z.string(),
});
