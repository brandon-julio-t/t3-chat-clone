import { betterAuth } from "better-auth";
import { db } from "~/server/db";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { anonymous } from "better-auth/plugins";
import React from "react";
import { headers } from "next/headers";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),

  emailAndPassword: {
    enabled: true,
  },

  plugins: [
    anonymous({
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        await db.$transaction([
          db.conversationItem.updateMany({
            where: {
              userId: anonymousUser.user.id,
            },
            data: {
              userId: newUser.user.id,
            },
          }),

          db.conversation.updateMany({
            where: {
              userId: anonymousUser.user.id,
            },
            data: {
              userId: newUser.user.id,
            },
          }),
        ]);
      },
    }),
  ],
});

export const getSession = React.cache(async () => {
  return await auth.api.getSession({
    headers: await headers(),
  });
});
