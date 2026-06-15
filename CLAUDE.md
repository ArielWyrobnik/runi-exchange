# RUNI Market – Project Overview

## What Is This?
RUNI Market is a campus marketplace web application built exclusively for Reichman University students in Herzliya, Israel. Students buy and sell second-hand items within the university community; all transactions happen in person on campus — no payment processing. Anyone can browse listings without an account, but posting, messaging and watchlisting require a verified university account.

## Tech Stack
- **Frontend**: React 18 + TypeScript (strict mode ON) + Vite
- **Styling**: Tailwind CSS + shadcn/ui component library
- **Backend**: Supabase (via Lovable Cloud) — PostgreSQL, Auth, Storage, Realtime
- **State**: TanStack React Query for server state
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form + Zod validation
- **Tests**: Vitest (`npx vitest run`); typecheck with `npx tsc -p tsconfig.app.json --noEmit`

## Development Workflow (IMPORTANT)
- Lovable deploys **`main`**. Migrations in `supabase/migrations/` are applied to the live DB on deploy.
- Established convention in this project: develop on the designated `claude/*` working branch, commit, push, then **merge into `main` and push main** so the user sees changes in Lovable (the user has explicitly approved this flow).
- Always run typecheck + build + tests before pushing.
- The Supabase types file `src/integrations/supabase/types.ts` is normally generated; when a migration adds tables/functions, manually add matching types (done for watchlist, reports, user_roles, watch_count, is_admin, delete_own_account).

## Internationalization (EN/HE)
- Custom lightweight i18n in `src/i18n/` — `translations.ts` (flat key dictionaries `en`/`he`, typed so missing Hebrew keys fail compile) and `LanguageContext.tsx` (`useLanguage()` → `lang`, `setLang`, `t`, `tCategory`, `tCondition`). Persisted in localStorage.
- Hebrew switches the whole document to RTL (`dir` on `<html>`); use `rtl:` Tailwind variants for directional fixes; `ArrowRight/ArrowLeft` icons get `rtl:rotate-180`.
- Brand name: "RUNI Market" in English, **"רייכמן מרקט"** in Hebrew. Logo (star crescent) must stay LEFT of the brand text even in RTL (logo `<Link>` has `dir="ltr"`).
- Category/condition values are stored in English in the DB; `tCategory`/`tCondition` translate for display only.
- date-fns with `he` locale for relative times when Hebrew.
- A test (`src/test/i18n.test.ts`) enforces en/he key parity.

## Design System
- **Primary color**: HSL(226, 81%, 33%) — Reichman blue, RGB(16, 44, 151)
- **RUNI Market Navbar**: blue (`bg-primary`) with inverted (white) text/buttons; white search bar row below (eBay style); blue footer — blue frame around white content.
- **RUNI Tickets Navbar/Footer**: same Reichman blue (`bg-primary`) with white text/buttons; blue-tinted sub-bar (`bg-blue-50/60`) with quick links; shows "RUNI Tickets" branding. Uses `TicketsNavbar` + `TicketsLayout` components and `Footer variant="tickets"` (separate from the main `Navbar`/`Layout`; the variant now differs only in copy, not color).
- **Logo**: `src/assets/reichman-stars.png` — white star crescent on transparent background (extracted programmatically from the official wordmark; the bottom star group was repositioned to close the gap where the wordmark text sat). Blends seamlessly into the blue bar. On the Tickets navbar the same PNG is shown with `filter: brightness(0) invert(1)` to stay crisp white on blue.
- Mobile-first; mobile nav is a Sheet (hamburger).

## Pages & Routes (src/pages/)
| Route | Page | Auth |
|---|---|---|
| `/` | Index — compact hero, 3 info cards, Recent Listings (8 newest) | public |
| `/browse` | Browse — search (reads `?search=` from navbar, 300ms debounce), category/condition/price filters, sort (newest/price asc/desc), pagination (24 + Load more) | public |
| `/tickets` | Tickets — red-themed event overview grid (date, venue, offer count, lowest price); uses `TicketsLayout` | public |
| `/tickets/:id` | TicketEvent — event detail + StockX-style market view (lowest ask, highest bid), public offers and public bids; viewing is public, placing bids/selling tickets requires login | public view; actions require auth |
| `/listing/:id` | ListingDetail — gallery w/ thumbnails, badges, watch heart, watch count, posted-by (links to seller), Contact Seller (hidden when sold), Report dialog, Edit button for owner | public |
| `/listing/:id/edit` | EditListing — fields + photo add/remove (instant) | owner |
| `/sell` | Sell — create listing (zod, ≤3 photos) | protected |
| `/my-listings` | MyListings — status badge, Mark as Sold/Relist, Edit, Delete (confirm) | protected |
| `/watchlist` | Watchlist — saved listings grid | protected |
| `/seller/:id` | SellerProfile — avatar initial, member since, active listings; own profile: inline name edit (syncs profiles + auth metadata), Delete account | public |
| `/messages` | Messages — `?c=<id>` selects conversation (survives reloads; do NOT use router state, it gets lost in the Lovable preview). Viewport-pinned layout (`<Layout fullHeight>`): no page scroll, no footer; sidebar and thread scroll independently. Chat header: listing photo + title + price (links to listing), person name in gray below | protected |
| `/admin/reports` | AdminReports — open reports w/ dismiss + delete-listing | admin |
| `/admin/events` | AdminEvents — import an event from a go-out.co link (parse → review form → publish), list + delete events | admin |
| `/login`, `/signup` | Auth pages | public |

## Key Components & Hooks
- `Layout` (`fullHeight` prop pins to viewport, hides footer), `Navbar` (lang toggle EN/עברית, unread badge on Messages — realtime, admin Reports + Events links, user name links to own profile), `Footer` (`variant="market" | "tickets"`; no logo; tickets variant differs only in copy — both use the same Reichman-blue styling).
- `TicketsLayout` + `TicketsNavbar` — blue-themed layout for all `/tickets/*` routes (same Reichman blue as RUNI Market); brand shows "RUNI Tickets"; no search bar (events are browsed, not searched); layout renders `Footer variant="tickets"`.
- `ListingCard`: image, heart toggle (top corner, hidden on own listings), title, price ₪, badges, relative upload time + watch count.
- `hooks/useListings.ts`: `useListings(filters{search,category,condition,priceMin/Max,sort,limit})`, `useListing(id)`, `useMyListings`, `useCreateListing`, `useUpdateListing`, `useSetListingStatus`, `useDeleteListing` (also removes storage files), `useAddListingImages`, `useDeleteListingImage`. Shared `uploadListingImages` compresses via `lib/image.ts` (max 1200px, JPEG 80%).
- `hooks/useMessages.ts`: `useConversations` (single batched messages query → latest_message + unread_count per convo), `useMessages` (realtime INSERT subscription), `useUnreadCount` (global badge, realtime), `useMarkConversationRead` (marks incoming read when chat open), `useSendMessage`, `useCreateConversation` (dedupes existing).
- `hooks/useWatchlist.ts`: `useWatchlistIds` (Set for heart state), `useWatchlist`, `useToggleWatchlist` (invalidates listing queries — watch_count lives on listings).
- `hooks/useReports.ts`: `useIsAdmin`, `useReports`, `useSubmitReport`, `useDismissReport`.
- `hooks/useTicketEvents.ts`: DB-backed (Supabase `events`). `useTicketEvents` (public, only `ends_at > now()`), `useTicketEvent(id)`, `useAdminEvents` (all events, admin), `useParseEvent` (calls `import-event` edge fn, action `parse`), `useCreateEvent` (action `create`), `useDeleteEvent`. `data/ticketEvents.ts` keeps the `TicketEvent`/`TicketOffer`/`TicketBid` types, `mapEventRow` (row→UI), and `lowestOfferPrice`; offers/bids are still UI-local scaffold (no tables yet) so imported events start empty.
- `lib/eventTime.ts` (pure, tested): `suggestEndsAt` (evening start → next-day 04:00; after-midnight → same-day 04:00; daytime → +4h), `toDatetimeLocal`/`fromDatetimeLocal` for `<input type="datetime-local">`.
- Edge function `supabase/functions/import-event`: admin-only (verifies JWT + `user_roles`). `action:"parse"` fetches a go-out.co link server-side and extracts title/description/venue/start/end/image from OpenGraph + JSON-LD (schema.org/Event), returns fields (no DB write). `action:"create"` downloads the cover image into the `event-images` bucket and inserts the `events` row. Host is restricted to `go-out.co`.
- `hooks/useAuth.tsx`: signUp restricted to `@post.runi.ac.il` (normalized lowercase), signIn refuses unverified emails (defense in depth).
- ChatWindow scrolls only its own list (`scrollTop`), never `scrollIntoView` (that scrolled the whole page).

## Database (supabase/migrations/ — chronological)
Tables: `profiles`, `listings` (+`watch_count`), `listing_images`, `conversations`, `messages`, `watchlist`, `reports`, `user_roles`, `events`.

Key server-side rules (all enforced by migrations, not just frontend):
- **Signup domain**: trigger on `auth.users` rejects non-`@post.runi.ac.il` emails (insert + email change).
- **Public read**: active listings, their images, and profiles of active sellers are readable by anon; sellers/conversation participants/admins see more. Writes require auth.
- **Validation CHECKs**: message 1–2000 chars; listing title ≤100, description ≤2000, price 0–1,000,000; profile name ≤100.
- **Message integrity**: trigger freezes content/sender/conversation/created_at on UPDATE; `is_read` can only go false→true.
- **watch_count**: maintained by triggers on watchlist insert/delete.
- **Limits**: max 20 active listings/user, max 3 images/listing (triggers).
- **Roles**: `user_roles` has no client write policies (no self-promotion); `is_admin(uid)` SECURITY DEFINER. Seed admin: `ariel.wyrobnik@post.runi.ac.il`. Admins can SELECT/DELETE any listing and read/delete reports.
- **Account deletion**: `delete_own_account()` RPC (SECURITY DEFINER, deletes own auth.users row, cascades).
- **Storage**: `listing-images` public bucket; per-user folder (`<uid>/...`) for insert/update/delete; bucket-wide listing/enumeration policy removed; trigger functions' EXECUTE revoked from client roles; GraphQL endpoint revoked.
- **Storage cleanup**: AFTER DELETE trigger `delete_listing_image_object` on `listing_images` (SECURITY DEFINER) removes the matching `storage.objects` row whenever an image row is deleted — covers admin deletes and account-deletion cascades where the owner-folder RLS policy blocks the client `remove()`. Idempotent with the eager client-side removal in `useDeleteListing`/`useDeleteListingImage`.
- **Events (RUNI Tickets)**: `events` table (`title`, `description`, `venue`, `emoji`, `image_url`, `starts_at`, `ends_at`, `source_url`, `created_by`). Public SELECT is just `ends_at > now()` — deliberately **no `is_admin()`** in this anon-facing policy (anon lacks EXECUTE on the SECURITY DEFINER fn and it isn't inlinable; same lesson as the listings fix). INSERT/UPDATE/DELETE are admin-only (`is_admin`, only ever hit by authenticated, which retains EXECUTE). Ended events are purged within minutes so admins don't need a "see ended" SELECT branch. **Auto-deletion**: a `pg_cron` job (`purge-expired-ticket-events`, every 15 min) hard-deletes rows past `ends_at`; the RLS predicate already hides them instantly, so the UI behaves correctly even if pg_cron is unavailable (wrapped in a defensive `DO`/exception block). `event-images` public bucket holds cover images (written only by the `import-event` edge fn via service role); AFTER DELETE trigger `delete_event_image_object` frees the storage object on event delete/purge.
- Realtime publication includes `messages` (RLS-filtered delivery).

## Security Status
Lovable security scan addressed (see migrations `*_security_hardening.sql`, `*_public_read_listings.sql`). Remaining accepted/manual items:
- **Leaked password protection**: Supabase Dashboard → Auth → Attack Protection (likely Pro-plan only; org is on Free tier — accepted).
- Realtime "any user can subscribe" finding = false positive (postgres_changes respects RLS).
- Raw Supabase error messages shown in toasts (accepted for now).
- "Confirm email" is ON in the Supabase dashboard (required — signIn also checks client-side).

## RUNI Tickets (separate sub-product, same Reichman-blue theme)
Ticket exchange for RUNI campus events. Shares the marketplace's Reichman-blue identity (it used to be red; switched to blue for brand consistency — `TicketsNavbar`/`TicketsLayout`/`Footer variant="tickets"` are all blue now).
- **Events are real DB rows** (`events` table) — admin-curated, **imported from an external link** (e.g. go-out.co) and **auto-expiring** at `ends_at`. The admin pastes a link on `/admin/events`; the `import-event` edge fn parses the page (OpenGraph + JSON-LD) and pre-fills a review form (title, venue, start/end, cover image), the admin checks/adjusts (esp. the end time) and publishes; the cover image is copied into the `event-images` bucket. Hooks/edge fn details under Key Components & Hooks; table/cron/storage details under Database.
- **Auto-deletion**: an event disappears the moment `ends_at` passes (RLS predicate) and is hard-deleted by `pg_cron` shortly after (e.g. a Fri 22:00→Sat 04:00 party is gone at Sat 04:00).
- **Ticket offers/bids are still UI-local scaffold** — no `ticket_offers`/`ticket_bids` tables yet, so a freshly imported event starts with empty offers/bids. **Market view** (`src/pages/TicketEvent.tsx`): shows lowest ask, highest bid, sorted public sell offers and buy bids. Signed-in users can add a local/public bid in the scaffold UI; anonymous visitors see read-only market data plus login/signup CTA. Bids use the authenticated user's `full_name`/email, not a free-text buyer name. Future ticket-selling UI must be auth-gated too.
- **Next steps not yet built**: `ticket_offers`/`ticket_bids` DB tables + persistent ticket-posting/bid flows for students; parser currently scoped to `go-out.co` only.
- `src/lib/email.ts` (pure email helpers) and `src/lib/conversations.ts` (pure aggregation) are testable pure functions extracted from hooks.

## Known Open Items / Next Ideas
- **Email notifications for new messages** — deliberately not built: needs an external provider (e.g. Resend) API key + Supabase Edge Function. User would need to create the account first.
- No reviews/ratings. Marketplace item offers/bidding remain intentionally out of scope; RUNI Tickets now has a scaffolded public bid/ask market view only.
- ~23 unit tests (email domain rule in `src/lib/email.ts`, conversation aggregation in `src/lib/conversations.ts`, i18n parity, storage path helper, event end-time/`datetime-local` helpers in `src/lib/eventTime.ts`); no E2E yet.

## Constraints
- English + Hebrew interface (full parity enforced by test)
- No payment processing
- Email restricted to `@post.runi.ac.il`
- Max 3 photos per listing (DB-enforced)
- Student-run side project — not an official university initiative
