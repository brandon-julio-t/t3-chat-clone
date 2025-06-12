import { getSession } from "~/lib/auth";
import { ChatDetailPageView } from "./_components/page-view";
import { getChatApiKey } from "./server-actions/chat-api-key";
import { getChatModel } from "./server-actions/chat-model";
import { ApiKeyOnboarding } from "./_components/api-key-onboarding";

const ChatDetailPage = async ({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) => {
  const apiKey = await getChatApiKey();
  if (!apiKey) {
    return (
      <main className="container mx-auto flex min-h-svh max-w-lg flex-col px-4">
        <ApiKeyOnboarding />
      </main>
    );
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
