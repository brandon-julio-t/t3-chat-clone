import { ulid } from "ulid";
import { z } from "zod";
import { buildConversationItemsTimeline } from "~/domains/chat/logics";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const conversationRouter = createTRPCRouter({
  shareConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const conversation = await ctx.db.conversation.findUniqueOrThrow({
        where: {
          id: input.conversationId,
          userId: ctx.session.user.id,
        },
        include: {
          conversationItems: true,
        },
      });

      const conversationItemsTimeline = buildConversationItemsTimeline({
        conversationItems: conversation.conversationItems,
      });

      return await ctx.db.conversationSharing.create({
        data: {
          id: ulid(),
          userId: ctx.session.user.id,
          conversationSharingItems: {
            createMany: {
              data: conversationItemsTimeline.map((conversationItem) => ({
                conversationItemId: conversationItem.id,
              })),
            },
          },
        },
      });
    }),
});
