"use client";

import { useShape } from "@electric-sql/react";
import type { Conversation } from "@prisma/client";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "~/components/ui/sidebar";
import { getBaseUrl } from "~/trpc/react";

export const ChatLayoutView = ({ children }: { children: React.ReactNode }) => {
  const conversationsShape = useShape<Conversation>({
    url: `${getBaseUrl()}/api/electric-sql`,
    params: {
      table: `"Conversation"`,
    },
  });

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>{/* ... */}</SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/chat">
                      <PlusIcon />
                      <span>New Chat</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {conversationsShape.data.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton asChild>
                      <Link href={`/chat/${conversation.id}`}>
                        <span>{conversation.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>{/* ... */}</SidebarFooter>
      </Sidebar>

      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
};
