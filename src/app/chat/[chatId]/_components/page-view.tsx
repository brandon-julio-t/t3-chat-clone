"use client";

import { matchBy, matchStream } from "@electric-sql/experimental";
import { useShape } from "@electric-sql/react";
import type { ConversationItem } from "@prisma/client";
import type { User } from "better-auth";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { ulid } from "ulid";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { Textarea } from "~/components/ui/textarea";
import { api, getBaseUrl } from "~/trpc/react";
import { ChatItem } from "./chat-item";
import { sendMessageSchema } from "~/app/domains/chat";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputAttachment } from "./input-attachment";
import { FileIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

export const ChatDetailPageView = ({
  chatId,
  user,
  initialModel,
  apiKey,
}: {
  chatId: string;
  user: User | null;
  initialModel: string;
  apiKey: string;
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
    resolver: zodResolver(sendMessageSchema),
    defaultValues: {
      apiKey,
      chatModel: initialModel,
      conversationId: chatId,
      newChatId: ulid(),
      newChatContent: "",
      attachmentFiles: [],
    },
  });

  const attatchmentFilesFieldArray = useFieldArray({
    control: form.control,
    name: "attachmentFiles",
  });

  const triggerChatCompletionMutation = api.chat.sendMessage.useMutation();

  const onSubmit = form.handleSubmit(
    async (data) => {
      const id = ulid();

      React.startTransition(async () => {
        dispatchConversationItems({
          action: "add",
          newItem: {
            id,
            content: data.newChatContent,
            role: "user",
            userId: user?.id ?? "",
            conversationId: chatId,
            isStreaming: false,
            attachments: data.attachmentFiles,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        const createPromise = triggerChatCompletionMutation.mutateAsync({
          newChatId: id,
          conversationId: chatId,
          apiKey: data.apiKey,
          newChatContent: data.newChatContent,
          chatModel: data.chatModel,
          attachmentFiles: data.attachmentFiles,
        });

        const syncPromise = matchStream(
          conversationItemsShape.stream,
          ["insert"],
          matchBy("id", id),
        );

        await Promise.all([createPromise, syncPromise]);
      });

      form.resetField("newChatContent");
      attatchmentFilesFieldArray.replace([]);
    },
    (err) => {
      let firstError = "Unknown error";

      for (const error of Object.values(err)) {
        firstError = error.message ?? firstError;
        break;
      }

      toast.error("Failed to submit form", {
        description: firstError,
      });
    },
  );

  return (
    <main className="relative container mx-auto flex min-h-svh max-w-4xl flex-col px-4">
      <section className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {conversationItems.map((conversationItem) => (
            <div key={conversationItem.id}>
              <ChatItem conversationItem={conversationItem} />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-row gap-4 overflow-x-auto py-4">
        {attatchmentFilesFieldArray.fields.map((field, index) => (
          <div key={field.id} className="group relative shrink-0">
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-0 right-0 flex size-6 translate-x-1/2 -translate-y-1/2 rounded-full group-hover:flex"
              onClick={() => {
                attatchmentFilesFieldArray.remove(index);
              }}
            >
              <XIcon />
            </Button>

            {field.contentType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={field.url}
                className="size-12 overflow-hidden rounded-md"
                alt="Attachment"
              />
            ) : (
              <FileIcon className="size-12 overflow-hidden rounded-md" />
            )}
          </div>
        ))}
      </section>

      <section className="sticky right-0 bottom-0 left-0 rounded-t-lg border p-4 backdrop-blur-2xl">
        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="newChatContent"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="resize-none border-none shadow-none dark:bg-transparent"
                      placeholder="Type your message..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2">
              <InputAttachment
                setAttachmentFiles={attatchmentFilesFieldArray.append}
              />

              <div className="flex-1" />

              <Button type="submit">Send</Button>
            </div>
          </form>
        </Form>
      </section>
    </main>
  );
};
