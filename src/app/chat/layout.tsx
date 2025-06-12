import { getSession } from "~/lib/auth";
import { ChatLayoutView } from "./_components/layout-view";

const ChatLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getSession();

  return (
    <ChatLayoutView user={session?.user ?? null}>{children}</ChatLayoutView>
  );
};

export default ChatLayout;
