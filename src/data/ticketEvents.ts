/**
 * RUNI Tickets — scaffold data layer.
 *
 * Events are admin-curated and tickets are offered against an event. The
 * full feature will live in dedicated Supabase tables (`events` and
 * `ticket_offers`, separate from `listings`). For now this module returns
 * static curated data with the same shape, so the pages can be built and
 * the data source swapped for real queries later without touching the UI.
 */

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
  /** Decorative — stands in for an event image in the scaffold. */
  emoji: string;
  description: string;
  venue: string;
  /** ISO date string. */
  date: string;
  offers: TicketOffer[];
}

export const TICKET_EVENTS: TicketEvent[] = [
  {
    id: "summer-beach-bash",
    title: "Summer Beach Bash",
    emoji: "🏖️",
    description:
      "The end-of-semester open-air party on Herzliya beach. Live DJ sets, food trucks and the whole campus in one place.",
    venue: "Herzliya Beach",
    date: "2026-06-20",
    offers: [
      { id: "o1", sellerName: "Maya Cohen", price: 80, quantity: 2, note: "Early-bird tickets, can meet on campus." },
      { id: "o2", sellerName: "Daniel Levi", price: 95, quantity: 1 },
      { id: "o3", sellerName: "Noa Friedman", price: 110, quantity: 4, note: "Group of 4, selling together." },
    ],
  },
  {
    id: "faculty-cup-final",
    title: "Faculty Cup Final",
    emoji: "⚽",
    description:
      "The annual inter-faculty football final. Computer Science defends the title against Business.",
    venue: "RUNI Sports Hall",
    date: "2026-06-27",
    offers: [
      { id: "o4", sellerName: "Itay Bar", price: 30, quantity: 2 },
      { id: "o5", sellerName: "Shira Azulay", price: 25, quantity: 1, note: "Can't make it anymore, cheap." },
    ],
  },
  {
    id: "graduation-gala",
    title: "Graduation Gala",
    emoji: "🎓",
    description:
      "Black-tie celebration for the graduating class. Dinner, awards and an after-party.",
    venue: "Ivcher Auditorium",
    date: "2026-07-04",
    offers: [
      { id: "o6", sellerName: "Tom Shapira", price: 200, quantity: 1 },
    ],
  },
  {
    id: "welcome-week-2026",
    title: "Welcome Week Kickoff",
    emoji: "🎉",
    description:
      "Kick off the new academic year. Meet your cohort, clubs fair and an evening concert.",
    venue: "Main Campus Plaza",
    date: "2026-09-01",
    offers: [],
  },
];

/** Lowest ticket price across an event's offers, or null if none. */
export const lowestOfferPrice = (event: TicketEvent): number | null =>
  event.offers.length ? Math.min(...event.offers.map((o) => o.price)) : null;
