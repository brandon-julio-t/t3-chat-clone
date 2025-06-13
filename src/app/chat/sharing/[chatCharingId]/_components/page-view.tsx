"use client";

import { DownloadIcon, FileIcon } from "lucide-react";
import { z } from "zod";
import { Markdown } from "~/components/markdown";
import { Button } from "~/components/ui/button";
import { attachmentFileSchema } from "~/domains/chat/schemas";
import { cn } from "~/lib/utils";

import {
  type ConversationItem,
  type ConversationSharing,
  type ConversationSharingItem,
} from "@prisma/client";

export const ChatSharingDetailPageView = ({
  conversationSharing,
}: {
  conversationSharing: ConversationSharing & {
    conversationSharingItems: (ConversationSharingItem & {
      conversationItem: ConversationItem;
    })[];
  };
}) => {
  return (
    <main className="container mx-auto max-w-4xl pt-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Chat Sharing</h1>
      </div>

      <div className="flex flex-col gap-4">
        {conversationSharing.conversationSharingItems
          .map((x) => x.conversationItem)
          .map((conversationItem) => {
            const isUser = conversationItem.role === "user";

            const attachmentFilesParseResult = z
              .array(attachmentFileSchema)
              .safeParse(conversationItem.attachments);

            return (
              <div key={conversationItem.id} className="flex flex-col gap-0.5">
                <section
                  className={cn(
                    "flex flex-col gap-2 text-sm",
                    isUser &&
                      "bg-primary text-primary-foreground ml-auto w-fit max-w-[75%] rounded-lg px-3 py-2",
                  )}
                >
                  <Markdown content={conversationItem.content} />
                </section>

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
                        <div
                          key={attachment.url}
                          className="flex flex-col gap-2"
                        >
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
          })}
      </div>
    </main>
  );
};
