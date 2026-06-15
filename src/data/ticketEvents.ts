/**
 * RUNI Tickets — event types + DB row mapping.
 *
 * Events live in the Supabase `events` table (admin-curated, imported from
 * external links such as go-out.co and auto-expiring at `ends_at`). Ticket
 * offers and buy bids are still a UI-local scaffold — there are no
 * `ticket_offers` / `ticket_bids` tables yet — so a freshly imported event
 * starts with empty offers/bids until that backend is built.
 */
import type { Database } from "@/integrations/supabase/types";

export type EventRow = Database["public"]["Tables"]["events"]["Row"];

export interface TicketBid {
  id: string;
  /** Maps to a profiles row (buyer_id) once wired to the backend. */
  buyerName: string;
  price: number;
  quantity: number;
  note?: string;
}

export interface TicketOffer {
  id: string;
  /** Maps to a profiles row (seller_id) once wired to the backend. */
  sellerName: string;
  price: number;
  quantity: number;
  note?: string;
}

export interface TicketEvent {
  id: string;
  title: string;
  /** Decorative fallback shown when there is no cover image. */
  emoji: string;
  description: string;
  venue: string;
  /** ISO timestamp of when the event starts. */
  date: string;
  /** ISO timestamp of when the event ends (drives auto-deletion). */
  endsAt: string;
  /** Cover image URL (Supabase storage), or null → fall back to emoji. */
  imageUrl: string | null;
  /** Original import link (e.g. go-out.co), if any. */
  sourceUrl: string | null;
  offers: TicketOffer[];
  bids: TicketBid[];
}

/** Map a raw `events` row to the shape the Tickets UI consumes. */
export const mapEventRow = (row: EventRow): TicketEvent => ({
  id: row.id,
  title: row.title,
  emoji: row.emoji || "🎟️",
  description: row.description ?? "",
  venue: row.venue ?? "",
  date: row.starts_at,
  endsAt: row.ends_at,
  imageUrl: row.image_url,
  sourceUrl: row.source_url,
  offers: [],
  bids: [],
});

/** Lowest ticket price across an event's offers, or null if none. */
export const lowestOfferPrice = (event: TicketEvent): number | null =>
  event.offers.length ? Math.min(...event.offers.map((o) => o.price)) : null;
