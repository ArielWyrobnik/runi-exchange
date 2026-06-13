/** Pure aggregation behind useConversations: fold a flat list of messages
 *  into each conversation's latest message + unread count, then sort by
 *  most-recent activity. Kept out of the hook so it can be unit-tested. */

export interface ConversationSummaryTarget {
  id: string;
  created_at: string;
  latest_message?: { content: string; created_at: string } | null;
  unread_count: number;
}

export interface MessageSummaryInput {
  conversation_id: string;
  content: string;
  created_at: string;
  sender_id: string;
  is_read: boolean;
}

/**
 * Mutates and returns `convos`: sets `latest_message`/`unread_count` from
 * `messages`, then sorts newest-activity first. Unread excludes the
 * current user's own and already-read messages. Conversations with no
 * messages fall back to their `created_at` for ordering.
 */
export const summarizeConversations = <C extends ConversationSummaryTarget>(
  convos: C[],
  messages: MessageSummaryInput[],
  currentUserId: string
): C[] => {
  for (const c of convos) {
    c.latest_message = null;
    c.unread_count = 0;
  }

  const byId = new Map(convos.map((c) => [c.id, c]));
  for (const m of messages) {
    const c = byId.get(m.conversation_id);
    if (!c) continue;
    if (
      !c.latest_message ||
      new Date(m.created_at) > new Date(c.latest_message.created_at)
    ) {
      c.latest_message = { content: m.content, created_at: m.created_at };
    }
    if (!m.is_read && m.sender_id !== currentUserId) {
      c.unread_count++;
    }
  }

  return convos.sort((a, b) => {
    const aTime = a.latest_message?.created_at ?? a.created_at;
    const bTime = b.latest_message?.created_at ?? b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
};
