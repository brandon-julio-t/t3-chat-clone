import type { ConversationItem } from "@prisma/client";

export interface BuildConversationItemsTimelineParams {
  conversationItems: ConversationItem[];
}

export function buildConversationItemsTimeline({
  conversationItems,
}: BuildConversationItemsTimelineParams) {
  const hashMap = conversationItems.reduce<Record<string, ConversationItem>>(
    (hashMap, item) => {
      hashMap[item.id] = item;
      return hashMap;
    },
    {},
  );

  const conversationItemTimeline: typeof conversationItems = [];

  let curr = conversationItems.find((x) => x.isRoot);
  while (curr) {
    if (!curr.isRoot) {
      conversationItemTimeline.push(curr);
    }
    const next = hashMap[curr?.activeNextConversationItemId ?? ""];
    curr = next;
  }

  if (conversationItemTimeline.length <= 0) {
    // if nothing is built, it means the conversation array is old version, i.e. without the linked list
    // so just return the original conversation items to at least display something
    return conversationItems.toSorted((a, b) => a.id.localeCompare(b.id));
  }

  return conversationItemTimeline;
}
