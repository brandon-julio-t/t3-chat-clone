import { getSession } from "~/lib/auth";
import {
  getChatApiKey,
  getImageApiKey,
} from "./[chatId]/server-actions/chat-api-key";
import { ChatLayoutView } from "./_components/layout-view";
import { cookies } from "next/headers";

const ChatLayout = async ({ children }: { children: React.ReactNode }) => {
  const [cookieStore, session, chatApiKey, imageApiKey] = await Promise.all([
    cookies(),
    getSession(),
    getChatApiKey(),
    getImageApiKey(),
  ]);

  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <ChatLayoutView
      user={session?.user ?? null}
      initialChatApiKey={chatApiKey}
      initialImageApiKey={imageApiKey}
      defaultOpenSidebar={defaultOpen}
    >
      {children}
    </ChatLayoutView>
  );
};

export default ChatLayout;
