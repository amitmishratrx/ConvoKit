import type { ReactNode } from "react";
export interface User {
  id: string;
  name: string;
  avatar?: string;
  online?: boolean;
}
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: number;
  status?: "sending" | "sent" | "delivered" | "read" | "failed";
}
export interface Conversation {
  id: string;
  kind: "direct" | "group";
  title: string;
  memberIds: readonly string[];
  avatar?: string;
  lastMessage?: Message;
  unreadCount?: number;
}
export interface GroupInput {
  name: string;
  memberIds: string[];
}
export interface ConvoKitTheme {
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  outgoing: string;
  incoming: string;
}
export interface ConvoKitProps {
  currentUser: User;
  users: readonly User[];
  conversations: readonly Conversation[];
  /** Messages in any order. Prefer loading only the active conversation's recent page. */
  messages: readonly Message[];
  onSendMessage: (conversationId: string, text: string) => void | Promise<void>;
  onCreateGroup: (input: GroupInput) => string | Promise<string>;
  onStartDirect: (userId: string) => string | Promise<string>;
  onConversationOpen?: (conversationId: string) => void;
  onLoadEarlier?: (conversationId: string) => void;
  hasEarlierMessages?: boolean;
  loadingEarlier?: boolean;
  theme?: Partial<ConvoKitTheme>;
  renderMessage?: (message: Message, own: boolean) => ReactNode;
  renderAvatar?: (name: string, uri?: string) => ReactNode;
}
