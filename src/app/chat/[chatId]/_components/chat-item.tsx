import { type ConversationItem } from "@prisma/client";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileIcon,
  PenIcon,
  XIcon,
} from "lucide-react";
import { z } from "zod";
import { attachmentFileSchema } from "~/domains/chat/schemas";
import { Markdown } from "~/components/markdown";
import { TextShimmer } from "~/components/text-shimmer";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import React from "react";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

export const ChatItem = ({
  conversationItems,
  conversationItem,
  updateOptimisticConversationItems,
  onEditSubmitted,
}: {
  conversationItems: ConversationItem[];
  conversationItem: ConversationItem;
  updateOptimisticConversationItems: (action: {
    action: "insert" | "update";
    newItem: ConversationItem;
  }) => void;
  onEditSubmitted: ({
    conversationItemId,
    newContent,
  }: {
    conversationItemId: string;
    newContent: string;
  }) => void;
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draftContent, setDraftContent] = React.useState(
    conversationItem.content,
  );

  const previousConversationItem = conversationItems.find(
    (item) => item.id === conversationItem.previousConversationItemId,
  );

  const currentIndex = previousConversationItem?.activeNextConversationItemId
    ? previousConversationItem?.multiNextConversationItemIds.indexOf(
        previousConversationItem?.activeNextConversationItemId,
      )
    : 0;

  const isUser = conversationItem.role === "user";

  const attachmentFilesParseResult = z
    .array(attachmentFileSchema)
    .safeParse(conversationItem.attachments);

  const updateActiveNextConversationItemIdMutation =
    api.chat.updateActiveNextConversationItemId.useMutation({});

  return (
    <div className="flex flex-col gap-0.5">
      <section
        className={cn(
          "flex flex-col gap-2 text-sm",
          isUser &&
            "bg-primary text-primary-foreground ml-auto w-fit max-w-[75%] rounded-lg px-3 py-2",
        )}
      >
        {isEditing ? (
          <Textarea
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            className="bg-background text-foreground resize-none"
          />
        ) : (
          <Markdown content={conversationItem.content} />
        )}

        {conversationItem.isStreaming && (
          <div>
            <TextShimmer className="text-sm leading-relaxed" duration={1.2}>
              Thinking...
            </TextShimmer>
          </div>
        )}
      </section>

      {isUser && (
        <section>
          {previousConversationItem &&
            previousConversationItem.multiNextConversationItemIds.length >
              1 && (
              <div className="flex flex-row items-center justify-end gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentIndex <= 0}
                  onClick={() => {
                    const newActiveNextConversationItemId =
                      previousConversationItem.multiNextConversationItemIds[
                        currentIndex - 1
                      ];

                    if (!newActiveNextConversationItemId) return;

                    React.startTransition(async () => {
                      if (!previousConversationItem) return;

                      updateOptimisticConversationItems({
                        action: "update",
                        newItem: {
                          ...previousConversationItem,
                          activeNextConversationItemId:
                            newActiveNextConversationItemId,
                        },
                      });

                      await updateActiveNextConversationItemIdMutation.mutateAsync(
                        {
                          conversationItemId: previousConversationItem.id,
                          newActiveNextConversationItemId,
                        },
                      );
                    });
                  }}
                >
                  <ChevronLeftIcon />
                </Button>
                <div className="text-muted-foreground text-sm">
                  {currentIndex + 1} /{" "}
                  {previousConversationItem.multiNextConversationItemIds.length}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={
                    currentIndex + 1 >=
                    previousConversationItem.multiNextConversationItemIds.length
                  }
                  onClick={() => {
                    const newActiveNextConversationItemId =
                      previousConversationItem.multiNextConversationItemIds[
                        currentIndex + 1
                      ];

                    if (!newActiveNextConversationItemId) return;

                    React.startTransition(async () => {
                      if (!previousConversationItem) return;

                      updateOptimisticConversationItems({
                        action: "update",
                        newItem: {
                          ...previousConversationItem,
                          activeNextConversationItemId:
                            newActiveNextConversationItemId,
                        },
                      });

                      await updateActiveNextConversationItemIdMutation.mutateAsync(
                        {
                          conversationItemId: previousConversationItem.id,
                          newActiveNextConversationItemId,
                        },
                      );
                    });
                  }}
                >
                  <ChevronRightIcon />
                </Button>
              </div>
            )}

          <div className="flex flex-row justify-end gap-0.5">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsEditing(false);

                    setDraftContent(conversationItem.content);
                  }}
                >
                  <XIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsEditing(false);

                    onEditSubmitted({
                      conversationItemId: conversationItem.id,
                      newContent: draftContent,
                    });
                  }}
                >
                  <CheckIcon />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                >
                  <PenIcon />
                </Button>
              </>
            )}
          </div>
        </section>
      )}

      {attachmentFilesParseResult.success && (
        <section
          className={cn(
            "flex flex-row gap-4 overflow-x-auto py-4",
            isUser ? "justify-end" : "justify-start",
          )}
        >
          {attachmentFilesParseResult.data.map((attachment) => {
            if (isUser) {
              return (
                <div key={attachment.url}>
                  {attachment.contentType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={attachment.url}
                      className="size-12 overflow-hidden rounded-md"
                      alt="Attachment"
                    />
                  ) : (
                    <FileIcon className="size-12 overflow-hidden rounded-md" />
                  )}
                </div>
              );
            }

            return (
              <div key={attachment.url} className="flex flex-col gap-2">
                {attachment.contentType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={attachment.url}
                    className="size-96 overflow-hidden rounded-md"
                    alt="Attachment"
                  />
                ) : (
                  <FileIcon className="size-96 overflow-hidden rounded-md" />
                )}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    window.open(attachment.url, "_blank");
                  }}
                >
                  <DownloadIcon />
                </Button>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
};
