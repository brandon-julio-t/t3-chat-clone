import { z } from "zod";

export const attachmentFileSchema = z.object({
  url: z.string().trim().min(1),
  contentType: z.string().trim().min(1),
});

export const sendMessageSchema = z.object({
  apiKey: z.string().trim().min(1),
  chatModel: z.string().trim().min(1),
  conversationId: z.string().trim().min(1),
  newChatId: z.string().trim().min(1),
  newChatContent: z.string().trim().min(1),
  attachmentFiles: z.array(attachmentFileSchema),
});
