import { type ConversationItem } from "@prisma/client";
import { DownloadIcon, FileIcon } from "lucide-react";
import { z } from "zod";
import { attachmentFileSchema } from "~/domains/chat/schemas";
import { Markdown } from "~/components/markdown";
import { TextShimmer } from "~/components/text-shimmer";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

export const ChatItem = ({
  conversationItem,
}: {
  conversationItem: ConversationItem;
}) => {
  const isUser = conversationItem.role === "user";

  const attachmentFilesParseResult = z
    .array(attachmentFileSchema)
    .safeParse(conversationItem.attachments);

  return (
    <div>
      <div
        className={cn(
          "flex flex-col gap-2 text-sm",
          isUser &&
            "bg-primary text-primary-foreground ml-auto w-fit max-w-[75%] rounded-lg px-3 py-2",
        )}
      >
        <Markdown content={conversationItem.content} />

        {conversationItem.isStreaming && (
          <div>
            <TextShimmer className="text-sm leading-relaxed" duration={1.2}>
              Thinking...
            </TextShimmer>
          </div>
        )}
      </div>

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
