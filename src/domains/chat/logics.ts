import type { ConversationItem } from "@prisma/client";

export interface BuildConversationItemsTimelineParams {
  conversationItems: ConversationItem[];
}

export function buildConversationItemsTimeline({
  conversationItems,
}: BuildConversationItemsTimelineParams) {
  const conversationItemTimeline: typeof conversationItems = [];

  let curr = conversationItems.find((x) => x.isRoot);
  while (curr) {
    conversationItemTimeline.push(curr);

    const next = conversationItems.find(
      (x) => x.id === curr?.activeNextConversationItemId,
    );
    curr = next;
  }

  if (conversationItemTimeline.length <= 0) {
    // if nothing is built, it means the conversation array is old version, i.e. without the linked list
    // so just return the original conversation items to at least display something
    return conversationItems;
  }

  return conversationItemTimeline.toSorted((a, b) => a.id.localeCompare(b.id));
}
