import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConvoKit, type Conversation, type Message, type User } from '../src';
const me: User = { id: 'me', name: 'Alex Morgan' };
const users: User[] = [
  me,
  { id: 'maya', name: 'Maya Chen', online: true },
  { id: 'james', name: 'James Wilson' },
  { id: 'sofia', name: 'Sofia Patel', online: true },
  { id: 'noah', name: 'Noah Williams' },
];
const initialMessages: Message[] = [
  {
    id: 'm1',
    conversationId: 'maya',
    senderId: 'maya',
    text: 'Hey! Did you get a chance to look at the new designs?',
    createdAt: Date.now() - 600000,
    status: 'read',
  },
  {
    id: 'm2',
    conversationId: 'maya',
    senderId: 'me',
    text: 'Just went through them. The new direction looks great 🙌',
    createdAt: Date.now() - 500000,
    status: 'read',
  },
  {
    id: 'm3',
    conversationId: 'maya',
    senderId: 'maya',
    text: 'Amazing. Let’s catch up tomorrow!',
    createdAt: Date.now() - 400000,
    status: 'delivered',
  },
  {
    id: 'm4',
    conversationId: 'weekend',
    senderId: 'sofia',
    text: 'Coffee, a long walk, and absolutely no plans ☕',
    createdAt: Date.now() - 200000,
    status: 'sent',
  },
];
const initialConversations: Conversation[] = [
  {
    id: 'maya',
    kind: 'direct',
    title: 'Maya Chen',
    memberIds: ['me', 'maya'],
    unreadCount: 2,
  },
  {
    id: 'james',
    kind: 'direct',
    title: 'James Wilson',
    memberIds: ['me', 'james'],
  },
  {
    id: 'sofia',
    kind: 'direct',
    title: 'Sofia Patel',
    memberIds: ['me', 'sofia'],
  },
  {
    id: 'weekend',
    kind: 'group',
    title: 'The weekend crew',
    memberIds: ['me', 'maya', 'sofia', 'noah'],
  },
];
let sequence = 0;
const id = () => `${Date.now().toString(36)}-${++sequence}`;
export default function App() {
  const [messages, setMessages] = useState(initialMessages);
  const [items, setItems] = useState(initialConversations);
  const [ready, setReady] = useState(false);
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem('convokit.demo.v1')
      .then(raw => {
        if (!raw) return;
        const data = JSON.parse(raw);
        if (
          mounted &&
          Array.isArray(data.messages) &&
          Array.isArray(data.conversations)
        ) {
          setMessages(data.messages);
          setItems(data.conversations);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (ready)
      writes.current = writes.current
        .catch(() => {})
        .then(() =>
          AsyncStorage.setItem(
            'convokit.demo.v1',
            JSON.stringify({ messages, conversations: items }),
          ),
        );
  }, [messages, items, ready]);
  const conversations = items.map(c => ({
    ...c,
    lastMessage: messages
      .filter(m => m.conversationId === c.id)
      .sort((a, b) => b.createdAt - a.createdAt)[0],
  }));
  return (
    <SafeAreaProvider>
      {!ready ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : (
        <ConvoKit
          currentUser={me}
          users={users}
          conversations={conversations}
          messages={messages}
          onSendMessage={(conversationId, text) =>
            setMessages(old => [
              ...old,
              {
                id: id(),
                conversationId,
                senderId: me.id,
                text,
                createdAt: Date.now(),
                status: 'sent',
              },
            ])
          }
          onCreateGroup={input => {
            const groupId = id();
            setItems(old => [
              ...old,
              {
                id: groupId,
                kind: 'group',
                title: input.name,
                memberIds: input.memberIds,
              },
            ]);
            return groupId;
          }}
          onStartDirect={userId => {
            const existing = items.find(
              c => c.kind === 'direct' && c.memberIds.includes(userId),
            );
            if (existing) return existing.id;
            const conversationId = id();
            setItems(old => [
              ...old,
              {
                id: conversationId,
                kind: 'direct',
                title: users.find(u => u.id === userId)!.name,
                memberIds: [me.id, userId],
              },
            ]);
            return conversationId;
          }}
          onConversationOpen={conversationId =>
            setItems(old =>
              old.map(c =>
                c.id === conversationId ? { ...c, unreadCount: 0 } : c,
              ),
            )
          }
        />
      )}
    </SafeAreaProvider>
  );
}
