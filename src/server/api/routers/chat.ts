import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  extractReasoningMiddleware,
  generateText,
  streamText,
  wrapLanguageModel,
} from "ai";
import throttle from "lodash/throttle";
import { z } from "zod";
import {
  attachmentFileSchema,
  sendMessageSchema,
} from "~/domains/chat/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const DEFAULT_CONVERSATION_TITLE = "New Chat";

export const chatRouter = createTRPCRouter({
  sendMessage: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ input, ctx }) => {
      const conversation = await ctx.db.conversation.upsert({
        select: {
          id: true,
          title: true,
        },
        where: {
          id: input.conversationId,
        },
        update: {},
        create: {
          id: input.conversationId,
          userId: ctx.session.user.id,
          title: DEFAULT_CONVERSATION_TITLE,
        },
      });

      void (async () => {
        await ctx.db.conversationItem.create({
          select: { id: true },
          data: {
            id: input.newChatId,
            content: input.newChatContent,
            role: "user",
            userId: ctx.session.user.id,
            conversationId: conversation.id,
            isStreaming: false,
            attachments: input.attachmentFiles,
          },
        });
      })();

      const aiConversationItem = await ctx.db.conversationItem.create({
        select: { id: true, content: true, attachments: true },
        data: {
          id: input.aiAssistantId,
          content: "",
          role: "assistant",
          userId: ctx.session.user.id,
          conversationId: conversation.id,
          isStreaming: true,
          attachments: [],
        },
      });

      const openrouter = createOpenRouter({
        apiKey: input.apiKey,
      });

      const model = wrapLanguageModel({
        model: openrouter(input.chatModel),
        middleware: extractReasoningMiddleware({ tagName: "think" }),
      });

      // AI reply "streaming" section
      {
        const history = await ctx.db.conversationItem.findMany({
          where: {
            id: { not: aiConversationItem.id },
            conversationId: input.conversationId,
            userId: ctx.session.user.id,
          },
        });

        let strBuilder = "";
        let isUpdating = false;

        const writeChunkToDb = throttle(async () => {
          if (isUpdating) {
            return;
          }

          isUpdating = true;

          console.log(`-`.repeat(8), `{ write:start }`, `-`.repeat(8));

          await ctx.db.conversationItem.update({
            select: { id: true },
            where: { id: aiConversationItem.id },
            data: { content: strBuilder },
          });

          console.log(`-`.repeat(8), `{ write:done }`, `-`.repeat(8));

          isUpdating = false;
        }, 7);

        const onError = async (error: unknown) => {
          console.error(error);

          let errorMessage = "Unknown error";
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === "string") {
            errorMessage = error;
          }

          await ctx.db.conversationItem.update({
            where: { id: aiConversationItem.id },
            data: { content: `[Error]: ${errorMessage}`, isStreaming: false },
          });
        };

        const stream = streamText({
          model,

          messages: history.map((item) => {
            const { success, data } = z
              .array(attachmentFileSchema)
              .safeParse(item.attachments);

            return {
              role: item.role as "user" | "assistant",
              content: item.content,
              experimental_attachments: success ? data : undefined,
            };
          }),

          onChunk: (chunk) => {
            console.log(`-`.repeat(8), `{ chunk }`, `-`.repeat(8));
            console.log(chunk);

            if (chunk.chunk.type === "text-delta") {
              strBuilder += chunk.chunk.textDelta;
              void writeChunkToDb();
            }

            if (chunk.chunk.type === "reasoning") {
              strBuilder += chunk.chunk.textDelta;
              void writeChunkToDb();
            }
          },

          onFinish: async (message) => {
            let finalMessage = message.text;

            if (!finalMessage) {
              finalMessage = "[Error]: empty response from model";
            }

            await ctx.db.conversationItem.update({
              select: { id: true },
              where: { id: aiConversationItem.id },
              data: { content: finalMessage, isStreaming: false },
            });
          },

          onError,
        });

        void stream.consumeStream({
          onError: (error) => {
            void onError(error);
          },
        });
      }

      // conversation title setter
      {
        void (async () => {
          if (conversation.title === DEFAULT_CONVERSATION_TITLE) {
            const response = await generateText({
              model,
              prompt: `
              You are a helpful assistant that generates a title for a conversation.
              The beginning message is: ${input.newChatContent}
              The title must be no more than 3 words.
              Your response must be the title directly without any unnecessary words.
            `.trim(),
            });

            await ctx.db.conversation.update({
              select: { id: true },
              where: { id: input.conversationId },
              data: { title: response.text },
            });
          }
        })();
      }

      return aiConversationItem;
    }),
});
