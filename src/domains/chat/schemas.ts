import { z } from "zod";

export const attachmentFileSchema = z.object({
  url: z.string().trim().min(1),
  contentType: z.string().trim().min(1),
});

export const sendMessageSchema = z.object({
  chatMode: z.enum(["chat", "image"]),

  chatApiKey: z.string().trim().min(1),
  chatModel: z.string().trim().min(1),

  imageApiKey: z.string().trim().min(1),
  imageModel: z.string().trim().min(1),

  conversationId: z.string().trim().min(1),

  aiAssistantId: z.string().trim().min(1),

  newChatId: z.string().trim().min(1),
  newChatContent: z.string().trim().min(1),

  attachmentFiles: z.array(attachmentFileSchema),
});
