import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ConversationWithDetails {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  listings: {
    title: string;
    price: number;
    listing_images: { image_url: string; display_order: number }[];
  } | null;
  buyer: { full_name: string } | null;
  seller: { full_name: string } | null;
  latest_message?: { content: string; created_at: string } | null;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, listings(title, price, listing_images(image_url, display_order)), buyer:profiles!conversations_buyer_id_fkey(full_name), seller:profiles!conversations_seller_id_fkey(full_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const convos = data as ConversationWithDetails[];

      // One query for all conversations: derive latest message and
      // unread count client-side instead of N+1 round trips
      if (convos.length > 0) {
        const { data: msgs, error: msgsError } = await supabase
          .from("messages")
          .select("conversation_id, content, created_at, sender_id, is_read")
          .in("conversation_id", convos.map((c) => c.id))
          .order("created_at", { ascending: false });
        if (msgsError) throw msgsError;

        for (const c of convos) {
          c.latest_message = null;
          c.unread_count = 0;
        }
        const byId = new Map(convos.map((c) => [c.id, c]));
        for (const m of msgs ?? []) {
          const c = byId.get(m.conversation_id);
          if (!c) continue;
          if (!c.latest_message) {
            c.latest_message = { content: m.content, created_at: m.created_at };
          }
          if (!m.is_read && m.sender_id !== user!.id) {
            c.unread_count++;
          }
        }
      }

      // Sort by latest message
      convos.sort((a, b) => {
        const aTime = a.latest_message?.created_at ?? a.created_at;
        const bTime = b.latest_message?.created_at ?? b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      return convos;
    },
  });
};

export const useMessages = (conversationId: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
  });
};

/** Total unread messages across all conversations — drives the navbar
 *  badge. Realtime keeps it fresh; RLS limits events to own chats. */
export const useUnreadCount = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`messages:unread:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["unread-count"] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["unread-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false)
        .neq("sender_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });
};

/** Mark all incoming messages of a conversation as read once they are
 *  on screen. */
export const useMarkConversationRead = (
  conversationId: string,
  messages: Message[] | undefined
) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || !messages) return;
    const hasUnread = messages.some((m) => m.sender_id !== user.id && !m.is_read);
    if (!hasUnread) return;

    supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .eq("is_read", false)
      .then(({ error }) => {
        if (!error) {
          queryClient.invalidateQueries({ queryKey: ["unread-count"] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        }
      });
  }, [user, messages, conversationId, queryClient]);
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["messages", vars.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useCreateConversation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingId, sellerId }: { listingId: string; sellerId: string }) => {
      if (!user) throw new Error("Must be logged in");

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("listing_id", listingId)
        .eq("buyer_id", user.id)
        .eq("seller_id", sellerId)
        .maybeSingle();

      if (existing) return existing;

      const { data, error } = await supabase
        .from("conversations")
        .insert({ listing_id: listingId, buyer_id: user.id, seller_id: sellerId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};
