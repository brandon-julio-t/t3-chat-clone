"use client";

import { matchBy, matchStream } from "@electric-sql/experimental";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ConversationItem } from "@prisma/client";
import type { User } from "better-auth";
import {
  BrushIcon,
  CommandIcon,
  CornerDownLeftIcon,
  FileIcon,
  SendIcon,
  Settings2Icon,
  TextIcon,
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
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { AI_MODELS } from "~/domains/chat/constants";
import { buildConversationItemsTimeline } from "~/domains/chat/logics";
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
  chatApiKey,
  imageApiKey,
}: {
  chatId: string;
  user: User | null;
  initialModel: string;
  chatApiKey: string;
  imageApiKey: string;
}) => {
  const [chatModelId, _setChatModelId] = React.useState(initialModel);
  const setChatModelId = React.useCallback((value: string) => {
    _setChatModelId(value);
    void saveChatModel(value);
  }, []);

  const selectedModel = React.useMemo(() => {
    return AI_MODELS.find((model) => model.value === chatModelId);
  }, [chatModelId]);

  const conversationItemsShape = useElectricShape<ConversationItem>({
    params: {
      table: `"ConversationItem"`,
      where: `"conversationId" = $1`,
      params: [chatId],
    },
  });

  const [optimisticConversationItems, updateOptimisticConversationItems] =
    React.useOptimistic<
      ConversationItem[],
      { action: "insert" | "update"; newItem: ConversationItem }
    >(conversationItemsShape?.data ?? [], (state, action) => {
      if (action.action === "insert") {
        return state.some((item) => item.id === action.newItem.id)
          ? state
          : [...state, action.newItem];
      }

      if (action.action === "update") {
        return state.map((item) =>
          item.id === action.newItem.id ? { ...item, ...action.newItem } : item,
        );
      }

      return state;
    });

  const conversationItems = React.useMemo(() => {
    return buildConversationItemsTimeline({
      conversationItems: optimisticConversationItems,
    });
  }, [optimisticConversationItems]);

  const form = useForm({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: {
      chatMode: "chat",
      useWeb: false,
      chatApiKey: chatApiKey,
      chatModel: chatModelId,
      imageApiKey: imageApiKey,
      imageModel: "openai/dall-e-3",
      conversationId: chatId,
      newChatId: ulid(),
      assistantChatId: ulid(),
      newChatContent: "",
      attachmentFiles: [],
      previousConversationItemId: undefined,
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
      let previousConversationItemId = data.previousConversationItemId;

      if (typeof previousConversationItemId === "undefined") {
        previousConversationItemId = conversationItems.at(-1)?.id ?? null;
      }

      const userConversationItemId = createUlid();
      const assistantConversationItemId = createUlid();

      React.startTransition(async () => {
        updateOptimisticConversationItems({
          action: "insert",
          newItem: {
            id: userConversationItemId,
            content: data.newChatContent,
            role: "user",
            userId: user?.id ?? "",
            conversationId: chatId,
            isStreaming: false,
            attachments: data.attachmentFiles,
            createdAt: new Date(),
            updatedAt: new Date(),
            isRoot: false,
            previousConversationItemId,
            multiNextConversationItemIds: [assistantConversationItemId],
            activeNextConversationItemId: assistantConversationItemId,
          },
        });

        updateOptimisticConversationItems({
          action: "insert",
          newItem: {
            id: assistantConversationItemId,
            content: "",
            role: "assistant",
            userId: user?.id ?? "",
            conversationId: chatId,
            isStreaming: true,
            attachments: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            isRoot: false,
            previousConversationItemId: userConversationItemId,
            multiNextConversationItemIds: [],
            activeNextConversationItemId: null,
          },
        });

        let chatMode = data.chatMode;
        if (!imageApiKey) {
          chatMode = "chat";
        }

        await Promise.all([
          sendMessageMutation.mutateAsync({
            chatMode,
            useWeb: data.useWeb,

            chatApiKey: data.chatApiKey,
            chatModel: chatModelId,

            imageApiKey: data.imageApiKey,
            imageModel: data.imageModel,

            conversationId: chatId,
            attachmentFiles: data.attachmentFiles,

            previousConversationItemId,

            newChatId: userConversationItemId,
            newChatContent: data.newChatContent,

            assistantChatId: assistantConversationItemId,
          }),

          matchStream(
            conversationItemsShape.stream,
            ["insert"],
            matchBy("id", userConversationItemId),
          ),

          matchStream(
            conversationItemsShape.stream,
            ["insert"],
            matchBy("id", assistantConversationItemId),
          ),
        ]);
      });

      form.reset();
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
        {conversationItemsShape.isLoading ? (
          <>{/*  */}</>
        ) : conversationItems.length <= 0 ? (
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
        ) : (
          <div className="flex flex-col pt-6">
            {conversationItems.map((conversationItem) => (
              <div key={conversationItem.id}>
                <ChatItem
                  conversationItems={conversationItems}
                  conversationItem={conversationItem}
                  updateOptimisticConversationItems={
                    updateOptimisticConversationItems
                  }
                  conversationItemsShape={conversationItemsShape}
                  onEditSubmitted={async ({
                    conversationItemId,
                    newContent,
                  }) => {
                    const updatedConversationItem = conversationItems.find(
                      (item) => item.id === conversationItemId,
                    );

                    form.setValue(
                      "previousConversationItemId",
                      updatedConversationItem?.previousConversationItemId,
                    );

                    form.setValue("newChatContent", newContent);

                    await onSubmit();
                  }}
                />
              </div>
            ))}
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

        <div className="bg-background/50 rounded-t-lg border p-4 backdrop-blur-2xl">
          <Form {...form}>
            <form onSubmit={onSubmit} className="flex flex-col">
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

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="secondary" size="icon" className="my-2">
                    <Settings2Icon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start">
                  <div className="flex flex-col gap-4">
                    <FormField
                      control={form.control}
                      name="chatMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Tabs
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <TabsList className="overflow-x-auto">
                                <TabsTrigger value="chat">
                                  <TextIcon /> <span>Chat</span>
                                </TabsTrigger>
                                <TabsTrigger value="image">
                                  <BrushIcon /> <span>Image</span>
                                </TabsTrigger>
                              </TabsList>
                            </Tabs>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="useWeb"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Use Web</FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-2">
                <ModelSelector
                  modelId={chatModelId}
                  setModelId={setChatModelId}
                />

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
