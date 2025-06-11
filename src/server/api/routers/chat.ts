import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  extractReasoningMiddleware,
  generateText,
  streamText,
  wrapLanguageModel,
} from "ai";
import throttle from "lodash/throttle";
import { ulid } from "ulid";
import { z } from "zod";
import { attachmentFileSchema, sendMessageSchema } from "~/app/domains/chat";
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
        select: { id: true },
        data: {
          id: ulid(),
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
          orderBy: {
            id: "asc",
          },
        });

        let strBuilder = "";

        const writeChunkToDb = throttle(async () => {
          await ctx.db.conversationItem.update({
            where: { id: aiConversationItem.id },
            data: { content: strBuilder },
          });
        }, 150);

        console.log(
          input.chatModel,
          JSON.stringify(
            history.map((item) => {
              const { success, data } = z
                .array(attachmentFileSchema)
                .safeParse(item.attachments);

              return {
                role: item.role as "user" | "assistant",
                content: item.content,
                experimental_attachments: success ? data : undefined,
              };
            }),
            null,
            2,
          ),
        );

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
            await ctx.db.conversationItem.update({
              where: { id: aiConversationItem.id },
              data: { content: message.text, isStreaming: false },
            });
          },

          onError: (error) => {
            console.error(error);
          },
        });

        void stream.consumeStream({
          onError: (error) => {
            console.error(error);
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
              Your response must be a single sentence that captures the essence of the conversation and nothing else.
            `.trim(),
            });

            await ctx.db.conversation.update({
              where: { id: input.conversationId },
              data: { title: response.text },
            });
          }
        })();
      }

      return aiConversationItem;
    }),
});
