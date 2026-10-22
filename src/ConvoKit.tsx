import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  conversationMessages,
  listConversations,
  validateGroup,
} from "./model";
import { darkTheme, lightTheme } from "./theme";
import { styles } from "./styles";
import type { Conversation, ConvoKitProps, Message } from "./types";

type Route =
  | { screen: "home" }
  | { screen: "thread"; id: string }
  | { screen: "create" }
  | { screen: "contacts" };
const time = (value: number) =>
  new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
const Bubble = memo(function Bubble({
  message,
  own,
  sender,
  color,
  textColor,
}: {
  message: Message;
  own: boolean;
  sender?: string;
  color: string;
  textColor: string;
}) {
  return (
    <View
      style={[
        styles.bubble,
        { alignSelf: own ? "flex-end" : "flex-start", backgroundColor: color },
      ]}
    >
      {!own && sender ? <Text style={styles.sender}>{sender}</Text> : null}
      <Text
        selectable
        style={{
          color: own ? "#FFF" : textColor,
          fontSize: 16,
          lineHeight: 23,
        }}
      >
        {message.text}
      </Text>
      <Text style={[styles.timestamp, { color: own ? "#DEE5FF" : "#7B879A" }]}>
        {time(message.createdAt)}
        {own
          ? `  ${
              message.status === "read"
                ? "✓✓"
                : message.status === "failed"
                ? "Failed"
                : message.status === "sending"
                ? "◷"
                : "✓"
            }`
          : ""}
      </Text>
    </View>
  );
});

/** Controlled chat UI. Mount inside SafeAreaProvider. Data and transport stay in the host app. */
export function ConvoKit(props: ConvoKitProps) {
  const scheme = useColorScheme();
  const t = { ...(scheme === "dark" ? darkTheme : lightTheme), ...props.theme };
  const [route, setRoute] = useState<Route>({ screen: "home" });
  const [tab, setTab] = useState<"direct" | "group">("direct");
  const [query, setQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const back = useCallback(() => {
    setRoute({ screen: "home" });
    setError("");
  }, []);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (route.screen === "home") return false;
      back();
      return true;
    });
    return () => sub.remove();
  }, [route.screen, back]);
  const active =
    route.screen === "thread"
      ? props.conversations.find((c) => c.id === route.id)
      : undefined;
  const activeId = active?.id;
  const messages = useMemo(
    () => conversationMessages(props.messages, activeId ?? ""),
    [props.messages, activeId]
  );
  const conversations = useMemo(
    () => listConversations(props.conversations, tab, query),
    [props.conversations, tab, query]
  );
  const people = useMemo(
    () =>
      props.users.filter(
        (user) =>
          user.id !== props.currentUser.id &&
          user.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
      ),
    [props.users, props.currentUser.id, query]
  );
  const names = useMemo(
    () => new Map(props.users.map((user) => [user.id, user.name])),
    [props.users]
  );
  const open = (id: string) => {
    setError("");
    setRoute({ screen: "thread", id });
    props.onConversationOpen?.(id);
  };
  const action = async (run: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await run();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };
  const avatar = (name: string, uri?: string) =>
    props.renderAvatar?.(name, uri) ??
    (uri ? (
      <Image source={{ uri }} style={styles.avatar} />
    ) : (
      <View style={[styles.avatar, { backgroundColor: "#E8EDFF" }]}>
        <Text style={styles.initial}>
          {name
            .split(" ")
            .slice(0, 2)
            .map((n) => n[0])
            .join("")
            .toUpperCase()}
        </Text>
      </View>
    ));
  const button = (label: string, onPress: () => void, disabled = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: t.primary,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
  const inputStyle = [
    styles.input,
    { backgroundColor: t.surface, color: t.text, borderColor: t.border },
  ];
  const renderConversation = ({ item }: { item: Conversation }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title}`}
      onPress={() => open(item.id)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? t.background : t.surface,
          borderBottomColor: t.border,
        },
      ]}
    >
      {avatar(item.title, item.avatar)}
      <View style={styles.grow}>
        <View style={styles.between}>
          <Text
            numberOfLines={1}
            style={[styles.rowTitle, { color: t.text, flex: 1 }]}
          >
            {item.title}
          </Text>
          <Text style={{ color: t.muted, fontSize: 11 }}>
            {item.lastMessage ? time(item.lastMessage.createdAt) : ""}
          </Text>
        </View>
        <View style={styles.between}>
          <Text numberOfLines={1} style={[styles.preview, { color: t.muted }]}>
            {item.lastMessage?.text ??
              (item.kind === "group"
                ? `${item.memberIds.length} members · Say hello`
                : "Start a conversation")}
          </Text>
          {!!item.unreadCount && (
            <View style={[styles.badge, { backgroundColor: t.primary }]}>
              <Text style={styles.badgeText}>
                {item.unreadCount > 99 ? "99+" : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: t.background }}
      edges={["top", "bottom"]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: t.surface, borderBottomColor: t.border },
        ]}
      >
        {route.screen !== "home" && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to conversations"
            hitSlop={12}
            onPress={back}
          >
            <Text style={{ fontSize: 30, color: t.primary }}>‹</Text>
          </Pressable>
        )}
        <View style={styles.grow}>
          <Text style={[styles.title, { color: t.text }]}>
            {route.screen === "home"
              ? "Conversations"
              : route.screen === "create"
              ? "New group"
              : route.screen === "contacts"
              ? "New message"
              : active?.title ?? "Conversation unavailable"}
          </Text>
          <Text style={{ color: t.muted, fontSize: 12, marginTop: 4 }}>
            {route.screen === "home"
              ? "Good conversations start here"
              : active?.kind === "group"
              ? `${active.memberIds.length} members`
              : route.screen === "thread"
              ? "Direct message"
              : "Bring your people together"}
          </Text>
        </View>
        {route.screen === "home" && (
          <View style={styles.brand}>
            <Text style={styles.brandText}>C</Text>
          </View>
        )}
      </View>
      {!!error && (
        <View accessibilityRole="alert" style={styles.error}>
          <Text style={{ color: "#AE2636" }}>{error}</Text>
        </View>
      )}
      {route.screen === "home" ? (
        <View style={styles.grow}>
          <View style={styles.topArea}>
            <View
              accessibilityRole="tablist"
              style={[styles.tabs, { backgroundColor: t.border }]}
            >
              {(["direct", "group"] as const).map((kind) => (
                <Pressable
                  key={kind}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === kind }}
                  onPress={() => setTab(kind)}
                  style={[
                    styles.tab,
                    {
                      backgroundColor: tab === kind ? t.surface : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontWeight: "700",
                      color: tab === kind ? t.primary : t.muted,
                    }}
                  >
                    {kind === "direct" ? "Chats" : "Groups"}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              accessibilityLabel="Search conversations"
              placeholder="Search conversations"
              placeholderTextColor={t.muted}
              value={query}
              onChangeText={setQuery}
              style={inputStyle}
            />
          </View>
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={7}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={[styles.emptyTitle, { color: t.text }]}>
                  A little quiet here
                </Text>
                <Text style={{ color: t.muted, textAlign: "center" }}>
                  Start a chat or bring everyone into a group.
                </Text>
              </View>
            }
          />
          <View style={styles.footer}>
            {button(
              tab === "direct" ? "＋  New message" : "＋  Create group",
              () => {
                setQuery("");
                setSelected(new Set());
                setGroupName("");
                setRoute({ screen: tab === "direct" ? "contacts" : "create" });
              }
            )}
          </View>
        </View>
      ) : route.screen === "contacts" || route.screen === "create" ? (
        <View style={styles.grow}>
          <View style={styles.topArea}>
            {route.screen === "create" && (
              <>
                <TextInput
                  accessibilityLabel="Group name"
                  maxLength={100}
                  placeholder="Group name"
                  placeholderTextColor={t.muted}
                  value={groupName}
                  onChangeText={setGroupName}
                  style={inputStyle}
                />
                <Text style={{ color: t.muted }}>
                  {selected.size} selected · No member limit imposed by the UI
                </Text>
              </>
            )}
            <TextInput
              accessibilityLabel="Search people"
              placeholder="Search people"
              placeholderTextColor={t.muted}
              value={query}
              onChangeText={setQuery}
              style={inputStyle}
            />
          </View>
          <FlatList
            data={people}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={[styles.empty, { color: t.muted }]}>
                No people found.
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable
                disabled={busy}
                accessibilityRole={
                  route.screen === "create" ? "checkbox" : "button"
                }
                accessibilityState={{
                  checked: selected.has(item.id),
                  disabled: busy,
                }}
                accessibilityLabel={item.name}
                onPress={() => {
                  if (route.screen === "contacts") {
                    void action(async () =>
                      open(await props.onStartDirect(item.id))
                    );
                  } else {
                    setSelected((old) => {
                      const next = new Set(old);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    });
                  }
                }}
                style={[
                  styles.row,
                  { backgroundColor: t.surface, borderBottomColor: t.border },
                ]}
              >
                {avatar(item.name, item.avatar)}
                <View style={styles.grow}>
                  <Text style={[styles.rowTitle, { color: t.text }]}>
                    {item.name}
                  </Text>
                  <Text style={{ color: t.muted, marginTop: 4 }}>
                    {item.online ? "Online" : "Available to chat"}
                  </Text>
                </View>
                {route.screen === "create" && (
                  <Text style={{ fontSize: 24, color: t.primary }}>
                    {selected.has(item.id) ? "●" : "○"}
                  </Text>
                )}
              </Pressable>
            )}
          />
          {route.screen === "create" && (
            <View style={styles.footer}>
              {button(
                busy ? "Creating…" : "Create group",
                () => {
                  void action(async () => {
                    const input = validateGroup(
                      { name: groupName, memberIds: [...selected] },
                      props.currentUser.id
                    );
                    const id = await props.onCreateGroup(input);
                    setTab("group");
                    open(id);
                  });
                },
                busy || !groupName.trim() || !selected.size
              )}
            </View>
          )}
        </View>
      ) : active ? (
        <KeyboardAvoidingView
          style={styles.grow}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <FlatList
            inverted
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            initialNumToRender={20}
            maxToRenderPerBatch={15}
            windowSize={9}
            keyboardShouldPersistTaps="handled"
            onEndReached={() => {
              if (props.hasEarlierMessages && !props.loadingEarlier)
                props.onLoadEarlier?.(active.id);
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              props.loadingEarlier ? (
                <ActivityIndicator color={t.primary} />
              ) : undefined
            }
            ListEmptyComponent={
              <View style={{ transform: [{ scaleY: -1 }], padding: 30 }}>
                <Text style={{ textAlign: "center", color: t.muted }}>
                  Say hello. This is the beginning of your conversation.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const own = item.senderId === props.currentUser.id;
              return (
                <>
                  {props.renderMessage ? (
                    props.renderMessage(item, own)
                  ) : (
                    <Bubble
                      message={item}
                      own={own}
                      sender={
                        active.kind === "group"
                          ? names.get(item.senderId)
                          : undefined
                      }
                      color={own ? t.outgoing : t.incoming}
                      textColor={t.text}
                    />
                  )}
                </>
              );
            }}
          />
          <View
            style={[
              styles.composer,
              { backgroundColor: t.surface, borderTopColor: t.border },
            ]}
          >
            <TextInput
              accessibilityLabel="Message"
              placeholder="Write a message…"
              placeholderTextColor={t.muted}
              multiline
              maxLength={10000}
              value={drafts[active.id] ?? ""}
              onChangeText={(value) =>
                setDrafts((old) => ({ ...old, [active.id]: value }))
              }
              style={[
                styles.messageInput,
                { color: t.text, backgroundColor: t.background },
              ]}
            />
            {button(
              busy ? "…" : "Send",
              () => {
                const text = (drafts[active.id] ?? "").trim();
                if (!text) return;
                void action(async () => {
                  await props.onSendMessage(active.id, text);
                  setDrafts((old) => ({
                    ...old,
                    [active.id]:
                      old[active.id] === drafts[active.id]
                        ? ""
                        : old[active.id] ?? "",
                  }));
                });
              },
              busy || !(drafts[active.id] ?? "").trim()
            )}
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.empty}>
          <Text style={{ color: t.text }}>
            This conversation is no longer available.
          </Text>
          {button("Back to conversations", back)}
        </View>
      )}
    </SafeAreaView>
  );
}
