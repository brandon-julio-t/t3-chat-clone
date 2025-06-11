import { getSession } from "~/lib/auth";
import { ChatDetailPageView } from "./_components/page-view";
import { getChatApiKey, getChatModel } from "./server-actions";

const ChatDetailPage = async ({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) => {
  const { chatId } = await params;

  const session = await getSession();
  const model = await getChatModel();
  const apiKey = await getChatApiKey();

  return (
    <ChatDetailPageView
      chatId={chatId}
      user={session?.user ?? null}
      initialModel={model}
      initialApiKey={apiKey}
    />
  );
};

export default ChatDetailPage;
