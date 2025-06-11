"use client";

import { useShape } from "@electric-sql/react";
import type { ConversationItem } from "@prisma/client";
import type { User } from "better-auth";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { matchBy, matchStream } from "@electric-sql/experimental";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { api, getBaseUrl } from "~/trpc/react";
import { ChatItem } from "./chat-item";
import React from "react";
import { ulid } from "ulid";

export const ChatDetailPageView = ({
  chatId,
  user,
  initialModel,
  initialApiKey,
}: {
  chatId: string;
  user: User | null;
  initialModel: string;
  initialApiKey: string;
}) => {
  const conversationItemsShape = useShape<ConversationItem>({
    url: `${getBaseUrl()}/api/electric-sql`,
    params: {
      table: `"ConversationItem"`,
      where: `"conversationId" = $1`,
      params: [chatId],
    },
  });

  const [conversationItems, dispatchConversationItems] = React.useOptimistic<
    ConversationItem[],
    { action: "add"; newItem: ConversationItem }
  >(conversationItemsShape?.data ?? [], (state, action) => {
    if (action.action === "add") {
      return state.some((item) => item.id === action.newItem.id)
        ? state
        : [...state, action.newItem];
    }

    return state;
  });

  const form = useForm({
    defaultValues: {
      apiKey: initialApiKey ?? "",
      model: initialModel,
      content: "",
    },
  });

  const triggerChatCompletionMutation =
    api.post.triggerChatCompletion.useMutation();

  const onSubmit = form.handleSubmit(async (data) => {
    const id = ulid();

    React.startTransition(async () => {
      dispatchConversationItems({
        action: "add",
        newItem: {
          id,
          content: data.content,
          role: "user",
          userId: user?.id ?? "",
          conversationId: chatId,
          isStreaming: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const createPromise = triggerChatCompletionMutation.mutateAsync({
        id,
        chatId,
        apiKey: data.apiKey,
        content: data.content,
        model: data.model,
      });

      const syncPromise = matchStream(
        conversationItemsShape.stream,
        ["insert"],
        matchBy("id", id),
      );

      await Promise.all([createPromise, syncPromise]);
    });

    form.resetField("content");
  });

  return (
    <main className="relative container mx-auto flex h-screen max-w-4xl flex-col gap-6 px-4 py-6">
      <section>
        <div className="flex flex-col gap-4 p-4">
          {conversationItems.map((conversationItem) => (
            <div key={conversationItem.id}>
              <ChatItem conversationItem={conversationItem} />
            </div>
          ))}
        </div>
      </section>

      <section className="sticky right-0 bottom-0 left-0 rounded-t-lg border p-4 backdrop-blur-2xl">
        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Type your message..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-4">
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input {...field} type="password" placeholder="API Key" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">Send</Button>
            </div>
          </form>
        </Form>
      </section>
    </main>
  );
};
