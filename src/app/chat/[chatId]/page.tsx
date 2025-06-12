import { getSession } from "~/lib/auth";
import { ChatDetailPageView } from "./_components/page-view";
import { getChatApiKey, getImageApiKey } from "./server-actions/chat-api-key";
import { getChatModel } from "./server-actions/chat-model";
import { ApiKeyOnboarding } from "./_components/api-key-onboarding";

const ChatDetailPage = async ({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) => {
  const chatApiKey = await getChatApiKey();
  const imageApiKey = await getImageApiKey();
  if (!chatApiKey) {
    return (
      <main className="container mx-auto grid min-h-svh max-w-lg place-items-center px-4">
        <div className="flex flex-col gap-6">
          <ApiKeyOnboarding
            initialChatApiKey={chatApiKey}
            initialImageApiKey={imageApiKey}
          />
          <section>
            <p className="text-muted-foreground text-sm">
              You can update this later in the settings page that can be
              accessed from the sidebar footer (bottom left of the screen).
            </p>
          </section>
        </div>
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
      chatApiKey={chatApiKey}
      imageApiKey={imageApiKey}
    />
  );
};

export default ChatDetailPage;
