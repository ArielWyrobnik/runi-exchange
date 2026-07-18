/** Application-wide constants for RUNI Market */

export const CATEGORIES = [
  "Tickets",
  "Furniture",
  "Electronics",
  "Dorm Accessories",
  "Books & Study Materials",
  "Clothes",
  "Kitchen & Appliances",
  "Sports & Outdoors",
  "Other",
] as const;

export const CONDITIONS = [
  "New",
  "Like New",
  "Good",
  "Fair",
  "Poor",
] as const;

export const LISTING_STATUSES = ["active", "sold"] as const;

export const MAX_LISTING_IMAGES = 3;

export const ALLOWED_EMAIL_DOMAIN = "@post.runi.ac.il";

export type Category = (typeof CATEGORIES)[number];
export type Condition = (typeof CONDITIONS)[number];
export type ListingStatus = (typeof LISTING_STATUSES)[number];

/**
 * RUNI Tickets is still under construction. While false, every entry point
 * (routes, homepage tile, browse category, admin events links) is hidden;
 * the tickets code itself stays in the repo, ready to be re-enabled.
 */
export const TICKETS_ENABLED = false;

/** Categories selectable in the UI — "Tickets" only while RUNI Tickets is live. */
export const ACTIVE_CATEGORIES: readonly Category[] = TICKETS_ENABLED
  ? CATEGORIES
  : CATEGORIES.filter((c) => c !== "Tickets");
