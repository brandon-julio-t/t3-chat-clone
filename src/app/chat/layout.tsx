import { ChatLayoutView } from "./_components/layout-view";

const ChatLayout = async ({ children }: { children: React.ReactNode }) => {
  return <ChatLayoutView>{children}</ChatLayoutView>;
};

export default ChatLayout;
