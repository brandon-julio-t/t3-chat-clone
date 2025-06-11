import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import throttle from "lodash/throttle";
import { ulid } from "ulid";
import { sendMessageSchema } from "~/app/domains/chat";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const chatRouter = createTRPCRouter({
  sendMessage: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ input, ctx }) => {
      const { apiKey, chatModel, conversationId, newChatId, newChatContent } =
        input;

      await ctx.db.conversationItem.create({
        data: {
          id: newChatId,
          content: newChatContent,
          role: "user",
          user: {
            connect: {
              id: ctx.session.user.id,
            },
          },
          conversation: {
            connectOrCreate: {
              where: {
                id: conversationId,
              },
              create: {
                id: conversationId,
                user: {
                  connect: {
                    id: ctx.session.user.id,
                  },
                },
                title: "New Chat",
              },
            },
          },
          isStreaming: false,
        },
      });

      const conversationItem = await ctx.db.conversationItem.create({
        data: {
          id: ulid(),
          content: "",
          role: "assistant",
          user: {
            connect: {
              id: ctx.session.user.id,
            },
          },
          conversation: {
            connectOrCreate: {
              where: {
                id: conversationId,
              },
              create: {
                id: conversationId,
                user: {
                  connect: {
                    id: ctx.session.user.id,
                  },
                },
                title: "New Chat",
              },
            },
          },
          isStreaming: true,
        },
      });

      const history = await ctx.db.conversationItem.findMany({
        where: {
          conversationId: conversationId,
          userId: ctx.session.user.id,
        },
      });

      const openrouter = createOpenRouter({
        apiKey,
      });

      let strBuilder = "";

      const writeChunkToDb = throttle(async () => {
        console.log(
          new Date(),
          "------------------------------- { write } -------------------------------",
        );
        await ctx.db.conversationItem.update({
          where: { id: conversationItem.id },
          data: { content: strBuilder },
        });
      }, 150);

      const stream = streamText({
        model: openrouter(chatModel),

        messages: history.map((item) => ({
          role: item.role as "user" | "assistant",
          content: item.content,
        })),

        onChunk: (chunk) => {
          if (chunk.chunk.type === "text-delta") {
            strBuilder += chunk.chunk.textDelta;

            void writeChunkToDb();
          }
        },

        onFinish: async (message) => {
          await ctx.db.conversationItem.update({
            where: { id: conversationItem.id },
            data: { content: message.text, isStreaming: false },
          });
        },
      });

      void stream.consumeStream();

      return conversationItem;
    }),
});
