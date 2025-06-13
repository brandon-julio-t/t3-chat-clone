import { db } from "~/server/db";
import { ChatSharingDetailPageView } from "./_components/page-view";

const ChatSharingDetailPage = async ({
  params,
}: {
  params: Promise<{ chatCharingId: string }>;
}) => {
  const { chatCharingId } = await params;

  const conversationSharing = await db.conversationSharing.findUniqueOrThrow({
    where: {
      id: chatCharingId,
    },
    include: {
      conversationSharingItems: {
        include: {
          conversationItem: true,
        },
      },
    },
  });

  return (
    <ChatSharingDetailPageView conversationSharing={conversationSharing} />
  );
};

export default ChatSharingDetailPage;
