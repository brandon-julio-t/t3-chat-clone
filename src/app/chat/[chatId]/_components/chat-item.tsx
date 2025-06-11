import { type ConversationItem } from "@prisma/client";
import { FileIcon } from "lucide-react";
import { z } from "zod";
import { attachmentFileSchema } from "~/app/domains/chat/schemas";
import { Markdown } from "~/components/markdown";
import { cn } from "~/lib/utils";

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
            "bg-primary text-primary-foreground ml-auto w-fit max-w-[75%] rounded-lg px-4 py-2.5",
        )}
      >
        <Markdown content={conversationItem.content} />
      </div>

      {attachmentFilesParseResult.success && (
        <section className="flex flex-row justify-end gap-4 overflow-x-auto py-4">
          {attachmentFilesParseResult.data.map((attachment) => (
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
          ))}
        </section>
      )}
    </div>
  );
};
