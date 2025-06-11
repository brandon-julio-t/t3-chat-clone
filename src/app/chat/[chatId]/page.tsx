import { getSession } from "~/lib/auth";

const ChatDetailPage = async ({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) => {
  const { chatId } = await params;

  const session = await getSession();

  return (
    <div>
      ChatDetailPage {chatId} {session?.user?.email}
    </div>
  );
};

export default ChatDetailPage;
