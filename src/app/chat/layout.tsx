import { getSession } from "~/lib/auth";
import { ChatLayoutView } from "./_components/layout-view";
import {
  getChatApiKey,
  getImageApiKey,
} from "./[chatId]/server-actions/chat-api-key";

const ChatLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getSession();
  const chatApiKey = await getChatApiKey();
  const imageApiKey = await getImageApiKey();

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
