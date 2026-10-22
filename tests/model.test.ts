import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  validateGroup,
  listConversations,
  conversationMessages,
} from "../src/model";
test("group membership is unique and includes current user", () =>
  assert.deepEqual(
    validateGroup({ name: " Team ", memberIds: ["me", "a", "a"] }, "me"),
    { name: "Team", memberIds: ["me", "a"] }
  ));
test("invalid groups are rejected", () => {
  assert.throws(() => validateGroup({ name: " ", memberIds: ["a"] }, "me"));
  assert.throws(() => validateGroup({ name: "Team", memberIds: ["me"] }, "me"));
});
test("no arbitrary group size limit", () =>
  assert.equal(
    validateGroup(
      {
        name: "Community",
        memberIds: Array.from({ length: 2000 }, (_, i) => String(i)),
      },
      "me"
    ).memberIds.length,
    2001
  ));
test("search filters by tab", () =>
  assert.equal(
    listConversations(
      [
        { id: "1", kind: "direct", title: "Maya", memberIds: [] },
        { id: "2", kind: "group", title: "Maya team", memberIds: [] },
      ],
      "direct",
      " MAYA "
    ).length,
    1
  ));
test("messages are scoped and ordered without mutation", () => {
  const items = [
    { id: "a", conversationId: "1", senderId: "me", text: "a", createdAt: 1 },
    { id: "b", conversationId: "2", senderId: "me", text: "b", createdAt: 3 },
    { id: "c", conversationId: "1", senderId: "me", text: "c", createdAt: 2 },
  ];
  assert.deepEqual(
    conversationMessages(items, "1").map((m) => m.id),
    ["c", "a"]
  );
  assert.equal(items[0].id, "a");
});
