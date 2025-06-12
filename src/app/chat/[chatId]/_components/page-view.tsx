"use client";

import { matchBy, matchStream } from "@electric-sql/experimental";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ConversationItem } from "@prisma/client";
import type { User } from "better-auth";
import {
  CommandIcon,
  CornerDownLeftIcon,
  FileIcon,
  SendIcon,
  XIcon,
} from "lucide-react";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { monotonicFactory, ulid } from "ulid";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { Textarea } from "~/components/ui/textarea";
import { AI_MODELS } from "~/domains/chat/constants";
import { sendMessageSchema } from "~/domains/chat/schemas";
import { useElectricShape } from "~/domains/electric-sql/hooks";
import { api } from "~/trpc/react";
import { saveChatModel } from "../server-actions/chat-model";
import { ChatItem } from "./chat-item";
import { InputAttachment } from "./input-attachment";
import { ModelSelector } from "./model-selector";

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
  const [modelId, _setModelId] = React.useState(initialModel);
  const setModelId = React.useCallback((value: string) => {
    _setModelId(value);
    void saveChatModel(value);
  }, []);

  const selectedModel = React.useMemo(() => {
    return AI_MODELS.find((model) => model.value === modelId);
  }, [modelId]);

  const conversationItemsShape = useElectricShape<ConversationItem>({
    params: {
      table: `"ConversationItem"`,
      where: `"conversationId" = $1`,
      params: [chatId],
    },
  });

  const [_conversationItems, dispatchConversationItems] = React.useOptimistic<
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

  const conversationItems = React.useMemo(
    () => _conversationItems.toSorted((a, b) => a.id.localeCompare(b.id)),
    [_conversationItems],
  );

  const form = useForm({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: {
      apiKey,
      chatModel: modelId,
      conversationId: chatId,
      newChatId: ulid(),
      aiAssistantId: ulid(),
      newChatContent: "",
      attachmentFiles: [],
    },
  });

  const attatchmentFilesFieldArray = useFieldArray({
    control: form.control,
    name: "attachmentFiles",
  });

  const sendMessageMutation = api.chat.sendMessage.useMutation({
    onError: (error) => {
      console.error(error);
      toast.error("Error sending message", {
        description: error.message ?? "Unknown error",
      });
    },
  });

  const createUlid = React.useMemo(() => monotonicFactory(), []);

  const onSubmit = form.handleSubmit(
    async (data) => {
      const id = createUlid();
      const aiAssistantId = createUlid();

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

        dispatchConversationItems({
          action: "add",
          newItem: {
            id: aiAssistantId,
            content: "",
            role: "assistant",
            userId: user?.id ?? "",
            conversationId: chatId,
            isStreaming: true,
            attachments: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        await Promise.all([
          sendMessageMutation.mutateAsync({
            newChatId: id,
            aiAssistantId,
            conversationId: chatId,
            apiKey: data.apiKey,
            newChatContent: data.newChatContent,
            chatModel: modelId,
            attachmentFiles: data.attachmentFiles,
          }),

          matchStream(
            conversationItemsShape.stream,
            ["insert"],
            matchBy("id", id),
          ),

          matchStream(
            conversationItemsShape.stream,
            ["insert"],
            matchBy("id", aiAssistantId),
          ),
        ]);
      });

      form.resetField("newChatContent");
      attatchmentFilesFieldArray.replace([]);
    },
    (error) => {
      console.error(error);

      let firstError = "Unknown error";

      for (const err of Object.values(error)) {
        firstError = err.message ?? firstError;
        break;
      }

      toast.error("Failed to submit form", {
        description: firstError,
      });
    },
  );

  React.useEffect(
    function listenCmdEnter() {
      const handleCmdEnter = (e: KeyboardEvent) => {
        if (e.key === "Enter" && e.metaKey) {
          void onSubmit();
        }
      };

      window.addEventListener("keydown", handleCmdEnter);

      return () => {
        window.removeEventListener("keydown", handleCmdEnter);
      };
    },
    [onSubmit],
  );

  return (
    <main className="relative container mx-auto flex min-h-svh max-w-4xl flex-col">
      <section className="flex-1 px-4">
        {conversationItems.length > 0 ? (
          <div className="flex flex-col gap-4 p-4">
            {conversationItems.map((conversationItem) => (
              <div key={conversationItem.id}>
                <ChatItem conversationItem={conversationItem} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            {user?.name && (
              <h2 className="text-2xl font-bold">
                How can I help you, {user.name}?
              </h2>
            )}
            <div className="flex flex-col gap-0.5">
              {[
                "Write a poem",
                "What is ligma?",
                "Write todo app",
                "Write react todo app",
                "Write react todo app with tailwindcss and shadcn/ui",
              ].map((question) => (
                <Button
                  key={question}
                  variant="ghost"
                  onClick={async () => {
                    form.setValue("newChatContent", question);
                    await onSubmit();
                  }}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="sticky right-0 bottom-0 left-0 px-2">
        {attatchmentFilesFieldArray.fields.length > 0 && (
          <div className="flex flex-row gap-4 overflow-x-auto py-4">
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
          </div>
        )}

        <div className="rounded-t-lg border p-4 backdrop-blur-2xl">
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
                        className="resize-none rounded-none border-none p-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
                        placeholder="Type your message..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2">
                <ModelSelector modelId={modelId} setModelId={setModelId} />

                <InputAttachment
                  setAttachmentFiles={attatchmentFilesFieldArray.append}
                  modelModalities={selectedModel?.modalities ?? []}
                />

                <div className="flex-1" />

                <Button type="submit" className="gap-0">
                  <SendIcon className="sm:hidden" />

                  <span className="hidden sm:block">Send</span>
                  <CommandIcon className="mr-1 ml-2 hidden size-(--text-xs) sm:block" />
                  <CornerDownLeftIcon className="hidden size-(--text-xs) sm:block" />
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </section>
    </main>
  );
};
