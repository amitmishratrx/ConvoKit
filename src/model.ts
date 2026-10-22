import type { Conversation, GroupInput, Message } from "./types";
export function validateGroup(
  input: GroupInput,
  currentUserId: string
): GroupInput {
  const name = input.name.trim();
  const memberIds = [...new Set(input.memberIds)].filter(
    (id) => id !== currentUserId
  );
  if (!name) throw new Error("Give your group a name.");
  if (!memberIds.length) throw new Error("Select at least one person.");
  return { name, memberIds: [currentUserId, ...memberIds] };
}
export function listConversations(
  items: readonly Conversation[],
  kind: Conversation["kind"],
  query: string
) {
  const normalized = query.trim().toLocaleLowerCase();
  return items
    .filter(
      (item) =>
        item.kind === kind &&
        item.title.toLocaleLowerCase().includes(normalized)
    )
    .sort(
      (a, b) =>
        (b.lastMessage?.createdAt ?? 0) - (a.lastMessage?.createdAt ?? 0)
    );
}
export function conversationMessages(messages: readonly Message[], id: string) {
  return messages
    .filter((message) => message.conversationId === id)
    .sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id));
}
