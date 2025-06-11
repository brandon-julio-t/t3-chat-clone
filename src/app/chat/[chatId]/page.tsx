import { getSession } from "~/lib/auth";
import { ChatDetailPageView } from "./_components/page-view";
import { getChatApiKey, getChatModel } from "./server-actions";
import { ApiKeyOnboarding } from "./_components/api-key-onboarding";

const ChatDetailPage = async ({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) => {
  const apiKey = await getChatApiKey();
  if (!apiKey) {
    return <ApiKeyOnboarding />;
  }

  const { chatId } = await params;
  const session = await getSession();
  const model = await getChatModel();

  return (
    <ChatDetailPageView
      chatId={chatId}
      user={session?.user ?? null}
      initialModel={model}
      apiKey={apiKey}
    />
  );
};

export default ChatDetailPage;
