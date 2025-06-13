import type { Conversation } from "@prisma/client";
import { Link2Icon, Loader2Icon, MoreVerticalIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { api, getBaseUrl } from "~/trpc/react";

export const ConversationItem = ({
  conversation,
}: {
  conversation: Conversation;
}) => {
  const pathname = usePathname();

  const isActive = pathname === `/chat/${conversation.id}`;

  const shareConversationMutation =
    api.conversation.shareConversation.useMutation({
      onSuccess: async (data) => {
        const href = `${getBaseUrl()}/chat/sharing/${data.id}`;
        try {
          await navigator.clipboard.writeText(href);
          toast.success("Chat link copied to clipboard");
        } catch {
          prompt(
            "Failed to copy link to clipboard, please copy manually",
            href,
          );
        }
      },
    });

  return (
    <SidebarMenuItem key={conversation.id}>
      <SidebarMenuButton isActive={isActive} asChild>
        <Link href={`/chat/${conversation.id}`} prefetch={true}>
          <span>{conversation.title}</span>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction disabled={shareConversationMutation.isPending}>
            {shareConversationMutation.isPending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <MoreVerticalIcon />
            )}
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right">
          <DropdownMenuItem
            onClick={() => {
              shareConversationMutation.mutate({
                conversationId: conversation.id,
              });
            }}
          >
            <Link2Icon />
            <span>Share</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};
