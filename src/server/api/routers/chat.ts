import { createLangDB } from "@langdb/vercel-provider";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { put } from "@vercel/blob";
import {
  experimental_generateImage,
  extractReasoningMiddleware,
  generateText,
  streamText,
  tool,
  wrapLanguageModel,
} from "ai";
import throttle from "lodash/throttle";
import { ulid } from "ulid";
import { z } from "zod";
import { buildConversationItemsTimeline } from "~/domains/chat/logics";
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
        const prev = await ctx.db.conversationItem.upsert({
          where: {
            id: input.previousConversationItemId ?? "",
            userId: ctx.session.user.id,
          },
          create: {
            id: ulid(),
            content: "",
            role: "user",
            userId: ctx.session.user.id,
            conversationId: conversation.id,
            isStreaming: false,
            attachments: [],
            isRoot: true,
            multiNextConversationItemIds: [input.newChatId],
            activeNextConversationItemId: input.newChatId,
          },
          update: {
            multiNextConversationItemIds: {
              push: input.newChatId,
            },
            activeNextConversationItemId: input.newChatId,
          },
        });

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
            previousConversationItemId: prev.id,
            multiNextConversationItemIds: [input.assistantChatId],
            activeNextConversationItemId: input.assistantChatId,
          },
        });
      })();

      const aiConversationItem = await ctx.db.conversationItem.create({
        select: { id: true, content: true, attachments: true },
        data: {
          id: input.assistantChatId,
          content: "",
          role: "assistant",
          userId: ctx.session.user.id,
          conversationId: conversation.id,
          isStreaming: true,
          attachments: [],
          previousConversationItemId: input.newChatId,
          multiNextConversationItemIds: [],
          activeNextConversationItemId: null,
        },
      });

      const openrouter = createOpenRouter({
        apiKey: input.chatApiKey,
      });

      const model = wrapLanguageModel({
        model: openrouter(input.chatModel),
        middleware: extractReasoningMiddleware({ tagName: "think" }),
      });

      if (false) {
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

            messages: buildConversationItemsTimeline({
              conversationItems: history,
            }).map((item) => {
              const { success, data } = z
                .array(attachmentFileSchema)
                .safeParse(item.attachments);

              return {
                role: item.role as "user" | "assistant",
                content: item.content,
                experimental_attachments: success ? data : undefined,
              };
            }),

            toolChoice:
              input.chatMode === "image"
                ? {
                    toolName: "generateImage",
                    type: "tool",
                  }
                : undefined,

            tools: {
              generateImage: tool({
                description: "Generate an image",
                parameters: z.object({
                  prompt: z
                    .string()
                    .describe("The prompt to generate the image from"),
                }),
                execute: async ({ prompt }) => {
                  const { images, warnings } = await experimental_generateImage(
                    {
                      model: createLangDB({
                        apiKey: input.imageApiKey,
                      }).imageModel(input.imageModel),
                      prompt,
                    },
                  );

                  if (warnings.length > 0) {
                    console.warn(warnings);
                  }

                  const imageUrls = await Promise.all(
                    images.map(async (image) => {
                      return await put(
                        `generateImage-${Date.now()}.png`,
                        Buffer.from(image.uint8Array),
                        {
                          access: "public",
                          addRandomSuffix: true,
                        },
                      );
                    }),
                  );

                  return {
                    images: imageUrls.map((image) => ({
                      url: image.url,
                    })),

                    prompt,
                  };
                },
              }),
            },

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

              if (chunk.chunk.type === "tool-result") {
                if (chunk.chunk.toolName === "generateImage") {
                  const { images } = chunk.chunk.result;

                  void (async () => {
                    const typedAttachments = images.map((image) => ({
                      url: image.url,
                      contentType: "image/png",
                    }));

                    await ctx.db.conversationItem.update({
                      where: { id: aiConversationItem.id },
                      data: { attachments: typedAttachments },
                    });
                  })();
                }
              }
            },

            onFinish: async (message) => {
              await ctx.db.conversationItem.update({
                select: { id: true },
                where: { id: aiConversationItem.id },
                data: {
                  content: message.text || undefined,
                  isStreaming: false,
                },
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
        if (conversation.title === DEFAULT_CONVERSATION_TITLE) {
          void (async () => {
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
          })();
        }
      }

      return aiConversationItem;
    }),

  updateActiveNextConversationItemId: protectedProcedure
    .input(
      z.object({
        conversationItemId: z.string(),
        newActiveNextConversationItemId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.conversationItem.update({
        where: {
          id: input.conversationItemId,
          userId: ctx.session.user.id,
        },
        data: {
          activeNextConversationItemId: input.newActiveNextConversationItemId,
        },
      });
    }),
});
