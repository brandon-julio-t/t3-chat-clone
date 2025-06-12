import { getSession } from "~/lib/auth";
import {
  getChatApiKey,
  getImageApiKey,
} from "./[chatId]/server-actions/chat-api-key";
import { ChatLayoutView } from "./_components/layout-view";

const ChatLayout = async ({ children }: { children: React.ReactNode }) => {
  const [session, chatApiKey, imageApiKey] = await Promise.all([
    getSession(),
    getChatApiKey(),
    getImageApiKey(),
  ]);

  return (
    <ChatLayoutView
      user={session?.user ?? null}
      initialChatApiKey={chatApiKey}
      initialImageApiKey={imageApiKey}
    >
      {children}
    </ChatLayoutView>
  );
};

export default ChatLayout;
