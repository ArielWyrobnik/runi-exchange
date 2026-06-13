import { useQuery } from "@tanstack/react-query";
import { TICKET_EVENTS, type TicketEvent } from "@/data/ticketEvents";

/**
 * Scaffold hooks for RUNI Tickets. They resolve the static curated data
 * today but keep the React Query shape, so swapping in Supabase queries
 * against the future `events` / `ticket_offers` tables is a one-file change.
 */

export const useTicketEvents = () =>
  useQuery({
    queryKey: ["ticket-events"],
    queryFn: async (): Promise<TicketEvent[]> => TICKET_EVENTS,
  });

export const useTicketEvent = (id: string | undefined) =>
  useQuery({
    queryKey: ["ticket-event", id],
    enabled: !!id,
    queryFn: async (): Promise<TicketEvent | null> =>
      TICKET_EVENTS.find((event) => event.id === id) ?? null,
  });
