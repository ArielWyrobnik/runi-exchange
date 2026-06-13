import { describe, it, expect } from "vitest";
import {
  summarizeConversations,
  type ConversationSummaryTarget,
  type MessageSummaryInput,
} from "@/lib/conversations";

const ME = "me";

const convo = (id: string, created_at: string): ConversationSummaryTarget => ({
  id,
  created_at,
  unread_count: 0,
});

const msg = (
  conversation_id: string,
  created_at: string,
  sender_id: string,
  is_read: boolean,
  content = "hi"
): MessageSummaryInput => ({ conversation_id, created_at, sender_id, is_read, content });

describe("summarizeConversations", () => {
  it("picks the most recent message as latest_message", () => {
    const convos = [convo("a", "2026-01-01T00:00:00Z")];
    const messages = [
      msg("a", "2026-01-02T10:00:00Z", "other", true, "older"),
      msg("a", "2026-01-03T10:00:00Z", "other", true, "newest"),
    ];
    const [a] = summarizeConversations(convos, messages, ME);
    expect(a.latest_message).toEqual({ content: "newest", created_at: "2026-01-03T10:00:00Z" });
  });

  it("counts only unread messages from the other party", () => {
    const convos = [convo("a", "2026-01-01T00:00:00Z")];
    const messages = [
      msg("a", "2026-01-02T00:00:00Z", "other", false), // counts
      msg("a", "2026-01-02T00:01:00Z", "other", true), // read → ignored
      msg("a", "2026-01-02T00:02:00Z", ME, false), // own → ignored
    ];
    const [a] = summarizeConversations(convos, messages, ME);
    expect(a.unread_count).toBe(1);
  });

  it("orders conversations by latest activity, newest first", () => {
    const convos = [
      convo("old", "2026-01-01T00:00:00Z"),
      convo("new", "2026-01-01T00:00:00Z"),
    ];
    const messages = [
      msg("old", "2026-01-02T00:00:00Z", "other", true),
      msg("new", "2026-01-05T00:00:00Z", "other", true),
    ];
    const result = summarizeConversations(convos, messages, ME);
    expect(result.map((c) => c.id)).toEqual(["new", "old"]);
  });

  it("falls back to created_at for conversations with no messages", () => {
    const convos = [
      convo("withMsg", "2026-01-01T00:00:00Z"),
      convo("empty", "2026-01-10T00:00:00Z"),
    ];
    const messages = [msg("withMsg", "2026-01-02T00:00:00Z", "other", false)];
    const result = summarizeConversations(convos, messages, ME);
    // empty convo created later sorts ahead of the older convo's message
    expect(result.map((c) => c.id)).toEqual(["empty", "withMsg"]);
    const empty = result.find((c) => c.id === "empty")!;
    expect(empty.latest_message).toBeNull();
    expect(empty.unread_count).toBe(0);
  });

  it("ignores messages that reference an unknown conversation", () => {
    const convos = [convo("a", "2026-01-01T00:00:00Z")];
    const messages = [msg("ghost", "2026-01-09T00:00:00Z", "other", false)];
    const [a] = summarizeConversations(convos, messages, ME);
    expect(a.latest_message).toBeNull();
    expect(a.unread_count).toBe(0);
  });
});
