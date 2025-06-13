import { z } from "zod";

export const attachmentFileSchema = z.object({
  url: z.string().trim().min(1),
  contentType: z.string().trim().min(1),
});

export const sendMessageSchema = z.object({
  chatMode: z.enum(["chat", "image"]),
  useWeb: z.boolean(),

  chatApiKey: z.string().trim().min(1),
  chatModel: z.string().trim().min(1),

  imageApiKey: z.string().trim(),
  imageModel: z.string().trim().min(1),

  conversationId: z.string().trim().min(1),

  previousConversationItemId: z.string().trim().nullish(),

  newChatId: z.string().trim().min(1),
  newChatContent: z.string().trim().min(1),

  assistantChatId: z.string().trim().min(1),

  attachmentFiles: z.array(attachmentFileSchema),
});
