# ConvoKit

A small, controlled React Native chat UI for direct messages and group conversations. Built with TypeScript, React Native 0.88.0 and React 19.3.0. No backend SDK, navigation framework or database is bundled into the library.

## Features

- Chats and Groups tabs with search, unread badges and recent-message previews.
- Direct conversations, contact picker, group naming and multi-person selection.
- Thread navigation with a back button and Android hardware back support. Returning restores the selected tab and search; each thread retains its draft while mounted.
- Virtualized, inverted message lists; older-message pagination callbacks; memoized message bubbles.
- Light/dark palettes, theme overrides, avatar and message rendering hooks.
- Async action errors, double-submission protection, keyboard avoidance and accessible controls.
- Runnable Android/iOS example with local persistence and sample contacts.

## Run the example

Requirements: Node 22.13+ (Node 24 recommended), **JDK 21**, Android Studio and the SDK/NDK requested by the generated Android project. For iOS, use macOS, Xcode and CocoaPods.

```sh
cd example
npm ci
npm start
# In another terminal:
npm run android
# iOS, on macOS:
bundle install
cd ios && bundle exec pod install && cd ..
npm run ios
```

Android uses a Java/Kotlin 21 toolchain and the generated Gradle 9.4.1 wrapper. Set `JAVA_HOME` to your JDK 21 installation. Android generates a local debug signing key; no signing key is committed. Configure a private release key before distribution.

## Use in an application

The npm package name is reserved in this repository's configuration; it has not been published. Build a local package first:

```sh
npm ci
npm pack
# In your application:
npm install /path/to/amitmishratrx-convokit-0.1.0.tgz react-native-safe-area-context
```

Wrap the UI in `SafeAreaProvider` and provide your application's state and actions:

```tsx
import { ConvoKit } from "@amitmishratrx/convokit";
import { SafeAreaProvider } from "react-native-safe-area-context";

<SafeAreaProvider>
  <ConvoKit
    currentUser={currentUser}
    users={contacts}
    conversations={conversations}
    messages={messages}
    onSendMessage={sendMessage}
    onStartDirect={startDirect}
    onCreateGroup={createGroup}
    onConversationOpen={markReadAndLoadMessages}
  />
</SafeAreaProvider>;
```

`onStartDirect(userId)` and `onCreateGroup({name, memberIds})` return the conversation ID (or a Promise). Update controlled conversation state before resolving. Group input includes the current user exactly once and selected people once each. There is no hardcoded group size limit; use server pagination/search for very large directories.

`onSendMessage(conversationId, text)` resolves when the host accepts a message. Reject to display an error and retain the draft. Assign stable message IDs in the host; use server idempotency keys for retries. `onConversationOpen` can mark messages read and fetch the initial page. `onLoadEarlier`, `hasEarlierMessages` and `loadingEarlier` support history pagination. Merge incoming pages by ID before passing them back.

`theme` overrides the exported `lightTheme`/`darkTheme`; `renderMessage(message, own)` and `renderAvatar(name, uri)` replace default presentation. Full contracts are exported from `src/types.ts`.

## Data and transport

The example is a **local UI demonstration**, not a messaging server. Sending updates local state and AsyncStorage; it does not deliver to another device or simulate replies. Connect the callbacks to your WebSocket/API and SQLite repository for actual communication. Authentication, authorization, message delivery/read receipts, durable outbox, encryption, attachments, push notifications and server-side membership rules belong to that integration. The UI displays the message status supplied by the host.

The library uses no native modules beyond its safe-area peer. It owns its internal list/thread route, so it can be mounted inside your application's navigation screen. It does not provide native interactive swipe-back transitions.

## Development

```sh
npm ci
npm run typecheck
npm test
npm run build
npm pack --dry-run
cd example
npm ci
npm run typecheck
npm test -- --runInBand
```

`src/` is the published library; `example/` is a standalone native app; `tests/` covers data invariants. CI checks library builds and a Java 21 Android debug build. Keep generated artifacts, dependencies and credentials out of source control.

MIT licensed. Contributions should include focused tests for behavior changes and keep storage/transport dependencies out of the UI package.
