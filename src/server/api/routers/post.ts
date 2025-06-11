import throttle from "lodash/throttle";
import { ulid } from "ulid";
import { z } from "zod";
import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  triggerChatCompletion: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string(),
        chatId: z.string(),
        apiKey: z.string(),
        model: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, chatId, apiKey, content, model } = input;

      await ctx.db.conversationItem.create({
        data: {
          id,
          content,
          role: "user",
          user: {
            connect: {
              id: ctx.session.user.id,
            },
          },
          conversation: {
            connectOrCreate: {
              where: {
                id: chatId,
              },
              create: {
                id: chatId,
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
                id: chatId,
              },
              create: {
                id: chatId,
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
          conversationId: chatId,
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
        model: openrouter(model),

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
