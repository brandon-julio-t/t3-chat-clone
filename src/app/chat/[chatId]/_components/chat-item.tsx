import { type ConversationItem } from "@prisma/client";
import { Markdown } from "~/components/markdown";
import { cn } from "~/lib/utils";

export const ChatItem = ({
  conversationItem,
}: {
  conversationItem: ConversationItem;
}) => {
  const isUser = conversationItem.role === "user";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 text-sm",
        isUser &&
          "bg-primary text-primary-foreground ml-auto w-fit max-w-[75%] rounded-lg px-4 py-2.5",
      )}
    >
      <Markdown content={conversationItem.content} />
    </div>
  );
};
