import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapEventRow, type TicketEvent } from "@/data/ticketEvents";

/**
 * RUNI Tickets data hooks, backed by the Supabase `events` table.
 *
 * Public reads only return events that have not ended yet (RLS enforces the
 * same predicate). Admin import/management goes through the `import-event`
 * edge function (parse + create) and direct deletes.
 */

export const useTicketEvents = () =>
  useQuery({
    queryKey: ["ticket-events"],
    queryFn: async (): Promise<TicketEvent[]> => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gt("ends_at", new Date().toISOString())
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapEventRow);
    },
  });

export const useTicketEvent = (id: string | undefined) =>
  useQuery({
    queryKey: ["ticket-event", id],
    enabled: !!id,
    queryFn: async (): Promise<TicketEvent | null> => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data ? mapEventRow(data) : null;
    },
  });

/** All events including ended ones — admin management view. */
export const useAdminEvents = (enabled: boolean) =>
  useQuery({
    queryKey: ["admin-events"],
    enabled,
    queryFn: async (): Promise<TicketEvent[]> => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapEventRow);
    },
  });

export interface ParsedEventData {
  title: string;
  description: string;
  venue: string;
  startsAt: string | null;
  endsAt: string | null;
  imageUrl: string | null;
  sourceUrl: string;
}

export interface CreateEventInput {
  title: string;
  description: string;
  venue: string;
  emoji: string;
  startsAt: string;
  endsAt: string;
  sourceUrl: string;
  imageUrl: string | null;
}

/** Read our `{ error }` JSON out of a non-2xx edge function response. */
const functionErrorMessage = async (error: unknown, fallback: string): Promise<string> => {
  const context = (error as { context?: Response })?.context;
  if (context && typeof context.json === "function") {
    try {
      const body = await context.json();
      if (body?.error) return String(body.error);
    } catch {
      // fall through to the generic message
    }
  }
  return (error as Error)?.message ?? fallback;
};

/** Parse an external event link (go-out.co) server-side. Admin only. */
export const useParseEvent = () =>
  useMutation({
    mutationFn: async (url: string): Promise<ParsedEventData> => {
      const { data, error } = await supabase.functions.invoke<ParsedEventData>("import-event", {
        body: { action: "parse", url },
      });
      if (error) throw new Error(await functionErrorMessage(error, "Failed to import the link"));
      if (!data) throw new Error("No data returned from import");
      return data;
    },
  });

/** Copy the cover image into storage and create the event. Admin only. */
export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const { data, error } = await supabase.functions.invoke("import-event", {
        body: { action: "create", ...input },
      });
      if (error) throw new Error(await functionErrorMessage(error, "Failed to create the event"));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
  });
};
