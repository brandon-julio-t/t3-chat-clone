"use client";

import type { Conversation } from "@prisma/client";
import type { User } from "better-auth";
import {
  ChevronsUpDown,
  KeyIcon,
  LogInIcon,
  LogOutIcon,
  PlusIcon,
  UserPlusIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { ModeToggle } from "~/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { useElectricShape } from "~/domains/electric-sql/hooks";
import { useIsMobile } from "~/hooks/use-mobile";
import { authClient } from "~/lib/auth-client";
import { ApiKeyOnboarding } from "../[chatId]/_components/api-key-onboarding";

export const ChatLayoutView = ({
  children,
  user,
  initialChatApiKey,
  initialImageApiKey,
}: {
  children: React.ReactNode;
  user: (User & { isAnonymous?: boolean | null }) | null;
  initialChatApiKey: string;
  initialImageApiKey: string;
}) => {
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();

  const conversationsShape = useElectricShape<Conversation>({
    params: {
      table: `"Conversation"`,
    },
  });

  const conversations = React.useMemo(
    () => conversationsShape.data.sort((a, b) => b.id.localeCompare(a.id)),
    [conversationsShape.data],
  );

  const [open, setOpen] = React.useState(false);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <div className="grid flex-1 text-center text-sm leading-tight">
                  <span className="truncate font-medium">T3 Chat (Clone)</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="lg"
                    variant="primary"
                    className="justify-center"
                    asChild
                  >
                    <Link href="/chat">
                      <PlusIcon className="-ml-4" />
                      <span>New Chat</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {conversations.map((conversation) => {
                  const isActive = pathname === `/chat/${conversation.id}`;

                  return (
                  <SidebarMenuItem key={conversation.id}>
                      <SidebarMenuButton isActive={isActive} asChild>
                        <Link href={`/chat/${conversation.id}`} prefetch={true}>
                        <span>{conversation.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={`https://avatar.vercel.sh/${user?.id}`}
                        alt={user?.name ?? ""}
                      />
                      <AvatarFallback className="rounded-lg">
                        {user?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user?.name}</span>
                      <span className="truncate text-xs">{user?.email}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src={`https://avatar.vercel.sh/${user?.id}`}
                          alt={user?.name ?? ""}
                        />
                        <AvatarFallback className="rounded-lg">
                          {user?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                          {user?.name}
                        </span>
                        <span className="truncate text-xs">{user?.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => setOpen(true)}>
                    <KeyIcon />
                    <span>Bring Your Own Keys (BYOK)</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {user?.isAnonymous ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/auth/sign-in">
                          <LogInIcon />
                          <span>Sign in</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/auth/sign-up">
                          <UserPlusIcon />
                          <span>Sign up</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem
                        onClick={async () => {
                          await authClient.signOut();
                          router.refresh();
                        }}
                      >
                        <LogOutIcon />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>OpenRouter API Key</DialogTitle>
            <DialogDescription>
              You can update your OpenRouter API key here.
            </DialogDescription>
          </DialogHeader>

          <ApiKeyOnboarding
            initialChatApiKey={initialChatApiKey}
            initialImageApiKey={initialImageApiKey}
            onSuccess={() => {
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <SidebarInset className="relative">
        <section className="sticky top-0 z-10 -mb-14 flex items-center justify-between">
          <div className="rounded-br-lg p-2 backdrop-blur-2xl">
            <SidebarTrigger className="size-9" />
          </div>
          <div className="rounded-bl-lg p-2 backdrop-blur-2xl">
            <ModeToggle variant="ghost" />
          </div>
        </section>

        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};
