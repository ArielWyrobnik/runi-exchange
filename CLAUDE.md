# RUNI Market – Project Overview

## What Is This?
RUNI Market is a campus marketplace web application built exclusively for Reichman University students in Herzliya, Israel. Students buy and sell second-hand items within the university community; all transactions happen in person on campus — no payment processing. Anyone can browse listings without an account, but posting, messaging and watchlisting require a verified university account.

## Tech Stack
- **Frontend**: React 18 + TypeScript (strict mode ON) + Vite
- **Styling**: Tailwind CSS + shadcn/ui component library
- **Backend**: Supabase (project `ijyzspjvxffbuspdidkv`) — PostgreSQL, Auth, Storage, Realtime, Edge Functions
- **State**: TanStack React Query for server state
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form + Zod validation
- **Tests**: Vitest (`npx vitest run`); typecheck with `npx tsc -p tsconfig.app.json --noEmit`

## Hosting & Domain — LIVE at https://runimarket.org
- **Production is GitHub Pages, NOT Lovable.** `.github/workflows/deploy-pages.yml` builds on every push to `main` and deploys `dist/` to Pages. Custom domain `runimarket.org` is pinned by `public/CNAME` (survives redeploys); GitHub issued the TLS cert, **Enforce HTTPS** is on. `vite.config.ts` `base` is `/` everywhere now (the old `/runi-exchange/` subpath + `GITHUB_PAGES` build flag are gone since the custom domain serves from root).
- **Lovable is now only a live preview** the user watches while changes land; the public site is runimarket.org. The develop→merge-to-main flow still applies (main is what Pages deploys).
- **DNS is at Porkbun**: root `ALIAS`/A → GitHub Pages, `www` `CNAME` → `arielwyrobnik.github.io`. Resend email DNS (DKIM `resend._domainkey`, SPF/MX on `send`, `_dmarc`) also live here.
- **Supabase Auth URL config** (Site URL + Redirect URLs) must point at `https://runimarket.org/`. `useAuth` sets `emailRedirectTo` to `window.location.origin` + `BASE_URL`, so confirmation links return to whatever origin the user signed up on.

## Development Workflow (IMPORTANT)
- **`main` is deployed to runimarket.org via GitHub Actions** (see Hosting & Domain). Lovable also builds `main` for its preview. Migrations in `supabase/migrations/` are NOT auto-applied by either — see the ⚠️ note below.
- Established convention in this project: develop on the designated `claude/*` working branch, commit, push, then **merge into `main` and push main** so it deploys (the user has explicitly approved this flow).
- Always run typecheck + build + tests before pushing.
- The Supabase types file `src/integrations/supabase/types.ts` is normally generated; when a migration adds tables/functions, manually add matching types (done for watchlist, reports, user_roles, watch_count, is_admin, delete_own_account).
- **⚠️ Lovable deploy is unreliable for migrations + edge functions.** Pushing to `main` does NOT reliably (a) apply new SQL migrations or (b) redeploy Supabase **edge functions**. Real-world fallout this caused: the live DB was stuck at the initial 5 tables (no `user_roles`/`watchlist`/`reports`/`events`), and edge-fn code changes shipped but never deployed (stale function returned 401). Recovery playbook:
  - **Missing tables/policies/functions** → hand the user an **idempotent catch-up SQL** script (combine the unapplied migrations, `IF NOT EXISTS`/`ON CONFLICT DO NOTHING`/`CREATE OR REPLACE`) to paste into the Supabase SQL Editor.
  - **Stale edge function** → the user must redeploy it via the Supabase Dashboard → Edge Functions (or CLI); a git push alone won't do it.
  - **Prefer client-side over edge-fn** when admin RLS already allows the operation (see `useCreateEvent`, which inserts directly instead of relying on the edge fn being deployed).
- **Admin seeding gotcha**: the seed `INSERT` into `user_roles` only takes effect if the admin's `auth.users` row already exists. The original seed ran before the account was created, so `ariel.wyrobnik@post.runi.ac.il` was never made admin. Fixed with an idempotent re-seed migration (`20260620000000_reseed_admin.sql`, `SELECT … FROM auth.users WHERE email = … ON CONFLICT DO NOTHING`). Re-run it (or the catch-up SQL) any time the admin role goes missing.

## Launch Feature Flags (`src/lib/constants.ts`)
Two deliberately-inverted launch flags gate not-ready features. All code stays in the repo; flip to `true` to re-enable.
- **`TICKETS_ENABLED = false`** — hides all of RUNI Tickets (see the RUNI Tickets section for the full list of hidden entry points).
- **`AUTO_TRANSLATE_ENABLED = false`** — disables listing auto-translation (see Auto-translation section). While false, `useListingTranslation` never fires and listings always show their original text.
- **`ACTIVE_CATEGORIES`** = `CATEGORIES` minus `Tickets` while tickets are off; drives the Sell/Edit/Browse category selects.
- **`CATEGORIES`**: Tickets, Furniture, Electronics, Dorm Accessories, Books & Study Materials, Clothes, Kitchen & Appliances, Sports & Outdoors, **Transportation**, Other. (`Transportation`, Hebrew תחבורה, added at launch — bikes/scooters are classic move-out sales.)
- **Homepage category tiles** (`src/pages/Index.tsx`): Furniture, Electronics, Dorm Accessories, Sports & Outdoors, Kitchen & Appliances, Transportation (bike icon). Grid is 5-col normally; 6-col when the Tickets tile returns. On mobile it's 2 columns (even fill).

## Seller Anonymity (launch growth tactic)
- **ListingDetail no longer shows the seller** — the "Posted by <name>" line + link to the seller profile was removed; it now shows only "Posted <relative time>" + watch count. Rationale: at launch the founder seeds many listings and doesn't want it obvious every item is from one person. The seller is only revealed once a buyer clicks **Contact Seller** (the chat shows the name). `postedBy` i18n key became `posted`.
- ⚠️ Partial hide: the `/seller/:id` `SellerProfile` page still exists and still aggregates a seller's active listings, and the Navbar still links the logged-in user to their **own** profile. There is just no in-app link to *other* sellers' profiles anymore. If full anonymity is ever needed, block `/seller/:id` for non-owners too.

## Auto-translation (`translate-listing`) — DISABLED for launch
- Listing titles/descriptions can auto-translate EN↔HE: `useListingTranslation` (`src/hooks/useListingTranslation.ts`) detects when the display language differs from the text and calls the `translate-listing` edge fn, which caches results in the `listing_translations` table (cleared by trigger when a seller edits title/description). Rendered by `ListingCard` + `ListingDetail`.
- **Gated off via `AUTO_TRANSLATE_ENABLED = false`** — needs the `translate-listing` edge fn deployed + `OPENAI_API_KEY` secret, out of scope for v1. The hook falls back to original text, so nothing breaks. Flip the flag + deploy the fn to enable. (Table migration `20260611193000_add_listing_translations.sql`; setup notes in README.)

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
- **Favicon + social image**: `public/favicon.ico` (multi-size) and `public/og-image.png` (512×512) are the star crescent on a Reichman-blue tile, generated from `reichman-stars.png`. `index.html` carries full OpenGraph + Twitter (`summary_large_image`) meta + canonical, all pointing at `https://runimarket.org/og-image.png`, so shared links preview with the brand. (Replaced the Lovable template's default heart favicon.)
- Mobile-first; mobile nav is a Sheet (hamburger). Search inputs (`Browse`, `Navbar`) set `enterKeyHint="search"` and blur on Enter/submit so the iOS keyboard dismisses (live search has nothing to "submit").

## Pages & Routes (src/pages/)
| Route | Page | Auth |
|---|---|---|
| `/` | Index — compact hero, 3 info cards, Recent Listings (8 newest) | public |
| `/browse` | Browse — search (reads `?search=` from navbar, 300ms debounce), category/condition/pickup/price filters, sort (newest/price asc/desc), pagination (24 + Load more) | public |
| `/tickets` | Tickets — blue-themed event overview grid; uses `TicketsLayout`. **DISABLED (`TICKETS_ENABLED=false`) → NotFound** | public |
| `/tickets/:id` | TicketEvent — event detail + StockX-style market view. **DISABLED → NotFound** | public view; actions require auth |
| `/listing/:id` | ListingDetail — gallery w/ thumbnails, badges, watch heart, watch count, **"Posted <time>" (seller name hidden — see Seller Anonymity)**, Contact Seller (hidden when sold), Report dialog, Edit button for owner | public |
| `/listing/:id/edit` | EditListing — fields + photo add/remove (instant) | owner |
| `/sell` | Sell — create listing (zod, ≤3 photos, required on/off-campus handover) | protected |
| `/my-listings` | MyListings — status badge, Mark as Sold/Relist, Edit, Delete (confirm) | protected |
| `/watchlist` | Watchlist — saved listings grid | protected |
| `/seller/:id` | SellerProfile — avatar initial, member since, active listings; own profile: inline name edit (syncs profiles + auth metadata), Delete account. (No in-app link from other listings anymore — see Seller Anonymity) | public |
| `/messages` | Messages — `?c=<id>` selects conversation (survives reloads; do NOT use router state, it gets lost in the Lovable preview). Viewport-pinned layout (`<Layout fullHeight>`): no page scroll, no footer; sidebar and thread scroll independently. Chat header: listing photo + title + price (links to listing), person name in gray below | protected |
| `/admin/reports` | AdminReports — open reports w/ dismiss + delete-listing | admin |
| `/admin/events` | AdminEvents — import an event from a go-out.co link (parse → review form → publish), list + delete events. **DISABLED → NotFound** | admin |
| `/login`, `/signup` | Auth pages | public |

## Key Components & Hooks
- `Layout` (`fullHeight` prop pins to viewport, hides footer), `Navbar` (lang toggle EN/עברית, unread badge on Messages — realtime, admin Reports + Events links, user name links to own profile), `Footer` (`variant="market" | "tickets"`; no logo; tickets variant differs only in copy — both use the same Reichman-blue styling).
- `TicketsLayout` + `TicketsNavbar` — blue-themed layout for all `/tickets/*` routes (same Reichman blue as RUNI Market); brand shows "RUNI Tickets"; no search bar (events are browsed, not searched); layout renders `Footer variant="tickets"`. `TicketsNavbar` shows a **"Manage Events"** admin link (→ `/admin/events`, gated on `useIsAdmin`) in both the desktop nav and the mobile Sheet; `/tickets` itself also has an admin-only "Add event" button.
- `ListingCard`: image, heart toggle (top corner, hidden on own listings), title, price ₪, badges, relative upload time + watch count.
- `hooks/useListings.ts`: `useListings(filters{search,category,condition,pickup,priceMin/Max,sort,limit})`, `useListing(id)`, `useMyListings`, `useCreateListing`, `useUpdateListing`, `useSetListingStatus`, `useDeleteListing` (also removes storage files), `useAddListingImages`, `useDeleteListingImage`. Shared `uploadListingImages` compresses via `lib/image.ts` (max 1200px, JPEG 80%). Create/update map the form's camelCase `pickupLocation` → the `pickup_location` column.
- **Pickup / handover location** (`lib/pickup.ts`, pure + tested): every listing carries `pickup_location` ∈ `{on_campus, off_campus}` (stored English, translated for display via `pickupLabelKey` → a `t()` key). The Sell/Edit forms require an explicit choice; ListingDetail, ListingCard and MyListings show it with a `MapPin` badge/line; Browse filters on it. Helps carless dorm students find items they can actually collect on campus.
- `hooks/useMessages.ts`: `useConversations` (single batched messages query → latest_message + unread_count per convo), `useMessages` (realtime INSERT subscription), `useUnreadCount` (global badge, realtime), `useMarkConversationRead` (marks incoming read when chat open), `useSendMessage` (inserts the message, returns its id, then **fire-and-forget invokes the `notify-message` edge fn** for the recipient email — see Email section), `useCreateConversation` (dedupes existing).
- `hooks/useWatchlist.ts`: `useWatchlistIds` (Set for heart state), `useWatchlist`, `useToggleWatchlist` (invalidates listing queries — watch_count lives on listings).
- `hooks/useReports.ts`: `useIsAdmin`, `useReports`, `useSubmitReport`, `useDismissReport`.
- `hooks/useTicketEvents.ts`: DB-backed (Supabase `events`). `useTicketEvents` (public, only `ends_at > now()`), `useTicketEvent(id)`, `useAdminEvents` (all events, admin), `useParseEvent` (calls `import-event` edge fn, action `parse`), `useCreateEvent`, `useDeleteEvent`. **`useCreateEvent` inserts directly via the Supabase client** (admin RLS allows it) rather than calling the edge fn — the cover image is already copied into the `event-images` bucket during the `parse` step, so the review form previews and stores the stable bucket URL. This keeps the create path working even if Lovable hasn't (re)deployed the edge fn. `data/ticketEvents.ts` keeps the `TicketEvent`/`TicketOffer`/`TicketBid` types, `mapEventRow` (row→UI), and `lowestOfferPrice`; offers/bids are still UI-local scaffold (no tables yet) so imported events start empty.
- `lib/eventTime.ts` (pure, tested): `suggestEndsAt` (evening start → next-day 04:00; after-midnight → same-day 04:00; daytime → +4h), `toDatetimeLocal`/`fromDatetimeLocal` for `<input type="datetime-local">`.
- Edge function `supabase/functions/import-event`: admin-only. **Auth uses the standard user-client pattern** — it builds a client with the request's `Authorization` header + the anon key and calls `getUser()` on that (NOT `admin.auth.getUser(jwt)`, which broke and returned 401 on newer supabase-js); a separate service-role client does the DB/storage work. Service key read from `SUPABASE_SERVICE_ROLE_KEY`. `action:"parse"` fetches a go-out.co link server-side, extracts title/description/venue/start/end/image from OpenGraph + JSON-LD (schema.org/Event), **copies the cover image into the `event-images` bucket** (via `copyCoverImage`, sending a `Referer`/`Origin` + `Sec-Fetch-*` headers to satisfy go-out's CDN hotlink protection) and returns the fields with the stable bucket URL (no DB write). `copyCoverImage` **returns `null` on any failure** (bad status, non-image content-type, oversized, upload error) so the UI falls back to the emoji placeholder instead of storing a hotlink-protected URL that renders as a broken icon. `action:"create"` also exists (downloads image + inserts the row) but the client no longer uses it. Host is restricted to `go-out.co`.
- `hooks/useAuth.tsx`: signUp restricted to `@post.runi.ac.il` (normalized lowercase), signIn refuses unverified emails (defense in depth).
- ChatWindow scrolls only its own list (`scrollTop`), never `scrollIntoView` (that scrolled the whole page).

## Database (supabase/migrations/ — chronological)
Tables: `profiles`, `listings` (+`watch_count`, +`pickup_location`), `listing_images`, `conversations`, `messages`, `watchlist`, `reports`, `user_roles`, `events`.

Key server-side rules (all enforced by migrations, not just frontend):
- **Signup domain**: trigger on `auth.users` rejects non-`@post.runi.ac.il` emails (insert + email change).
- **Public read**: active listings, their images, and profiles of active sellers are readable by anon; sellers/conversation participants/admins see more. Writes require auth.
- **Validation CHECKs**: message 1–2000 chars; listing title ≤100, description ≤2000, price 0–1,000,000, `pickup_location` ∈ {`on_campus`,`off_campus`} (NOT NULL, default `on_campus` backfills pre-existing rows); profile name ≤100.
- **Message integrity**: trigger freezes content/sender/conversation/created_at on UPDATE; `is_read` can only go false→true.
- **watch_count**: maintained by triggers on watchlist insert/delete.
- **Limits**: max 20 active listings/user, max 3 images/listing (triggers).
- **Roles**: `user_roles` has no client write policies (no self-promotion); `is_admin(uid)` SECURITY DEFINER. Seed admin: `ariel.wyrobnik@post.runi.ac.il`. Admins can SELECT/DELETE any listing and read/delete reports.
- **Account deletion**: `delete_own_account()` RPC (SECURITY DEFINER, deletes own auth.users row, cascades).
- **Storage**: `listing-images` public bucket; per-user folder (`<uid>/...`) for insert/update/delete; bucket-wide listing/enumeration policy removed; trigger functions' EXECUTE revoked from client roles; GraphQL endpoint revoked.
- **Storage cleanup**: AFTER DELETE trigger `delete_listing_image_object` on `listing_images` (SECURITY DEFINER) removes the matching `storage.objects` row whenever an image row is deleted — covers admin deletes and account-deletion cascades where the owner-folder RLS policy blocks the client `remove()`. Idempotent with the eager client-side removal in `useDeleteListing`/`useDeleteListingImage`. **⚠️ Supabase now blocks direct DML on `storage.objects`** ("Use the Storage API instead"), which made these triggers abort the parent delete (users couldn't delete listings). Fixed in `20260718200000_storage_cleanup_best_effort.sql`: both trigger fns (`delete_listing_image_object`, `delete_event_image_object`) swallow storage-delete errors so the row delete always proceeds; orphaned objects on admin/cascade deletes are accepted.
- **Events (RUNI Tickets)**: `events` table (`title`, `description`, `venue`, `emoji`, `image_url`, `starts_at`, `ends_at`, `source_url`, `created_by`). Public SELECT is just `ends_at > now()` — deliberately **no `is_admin()`** in this anon-facing policy (anon lacks EXECUTE on the SECURITY DEFINER fn and it isn't inlinable; same lesson as the listings fix). INSERT/UPDATE/DELETE are admin-only (`is_admin`, only ever hit by authenticated, which retains EXECUTE). Ended events are purged within minutes so admins don't need a "see ended" SELECT branch. **Auto-deletion**: a `pg_cron` job (`purge-expired-ticket-events`, every 15 min) hard-deletes rows past `ends_at`; the RLS predicate already hides them instantly, so the UI behaves correctly even if pg_cron is unavailable (wrapped in a defensive `DO`/exception block). `event-images` public bucket holds cover images (written only by the `import-event` edge fn via service role); AFTER DELETE trigger `delete_event_image_object` frees the storage object on event delete/purge.
- Realtime publication includes `messages` (RLS-filtered delivery).

## Security Status
Lovable security scan addressed (see migrations `*_security_hardening.sql`, `*_public_read_listings.sql`). Remaining accepted/manual items:
- **Leaked password protection**: Supabase Dashboard → Auth → Attack Protection (likely Pro-plan only; org is on Free tier — accepted).
- Realtime "any user can subscribe" finding = false positive (postgres_changes respects RLS).
- Raw Supabase error messages shown in toasts (accepted for now).
- "Confirm email" is ON in the Supabase dashboard (required — signIn also checks client-side).

## RUNI Tickets (separate sub-product, same Reichman-blue theme)
**⚠️ Currently DISABLED for launch** via `TICKETS_ENABLED = false` in `src/lib/constants.ts`. All code stays in the repo; the flag hides every entry point: `/tickets`, `/tickets/:id` and `/admin/events` routes (direct URLs → NotFound), the homepage Tickets tile (grid falls back to 4 columns), the special Tickets item in the Browse category dropdown (a `?category=Tickets` URL just clears the filter instead of redirecting), the "Tickets" option in Sell/Edit category selects (`ACTIVE_CATEGORIES` = `CATEGORIES` minus Tickets while disabled), and the admin Events links in the Navbar. Flip the flag to `true` to bring it all back.
Ticket exchange for RUNI campus events. Shares the marketplace's Reichman-blue identity (it used to be red; switched to blue for brand consistency — `TicketsNavbar`/`TicketsLayout`/`Footer variant="tickets"` are all blue now).
- **Events are real DB rows** (`events` table) — admin-curated, **imported from an external link** (e.g. go-out.co) and **auto-expiring** at `ends_at`. The admin pastes a link on `/admin/events`; the `import-event` edge fn parses the page (OpenGraph + JSON-LD), **copies the cover image into the `event-images` bucket during parse**, and pre-fills a review form (title, venue, start/end, cover image preview = the stable bucket URL); the admin checks/adjusts (esp. the end time) and publishes via a **direct client insert** (admin RLS). If the image copy fails (go-out CDN hotlink protection), `image_url` is stored as `null` and the UI shows the emoji placeholder — never a broken image icon. Hooks/edge fn details under Key Components & Hooks; table/cron/storage details under Database.
- **Auto-deletion**: an event disappears the moment `ends_at` passes (RLS predicate) and is hard-deleted by `pg_cron` shortly after (e.g. a Fri 22:00→Sat 04:00 party is gone at Sat 04:00).
- **Ticket offers/bids are still UI-local scaffold** — no `ticket_offers`/`ticket_bids` tables yet, so a freshly imported event starts with empty offers/bids. **Market view** (`src/pages/TicketEvent.tsx`): shows lowest ask, highest bid, sorted public sell offers and buy bids. Signed-in users can add a local/public bid in the scaffold UI; anonymous visitors see read-only market data plus login/signup CTA. Bids use the authenticated user's `full_name`/email, not a free-text buyer name. Future ticket-selling UI must be auth-gated too.
- **Next steps not yet built**: `ticket_offers`/`ticket_bids` DB tables + persistent ticket-posting/bid flows for students; parser currently scoped to `go-out.co` only.
- `src/lib/email.ts` (pure email helpers) and `src/lib/conversations.ts` (pure aggregation) are testable pure functions extracted from hooks.

## Email (Resend) — LIVE
- **Provider**: Resend, sending from the **verified** domain `runimarket.org` (DKIM/SPF/DMARC DNS at Porkbun). Free tier is plenty for transactional volume.
- **Auth emails via Custom SMTP**: Supabase → Project Settings → Auth → SMTP is set to `smtp.resend.com:465`, user `resend`, password = Resend API key, sender `noreply@runimarket.org` / "RUNI Market". This replaces Supabase's built-in sender (which is rate-limited to a few/hour — would have choked on launch-day signup bursts). `supabase/templates/confirm-signup.html` is the branded "Confirm signup" template (blue header, og-image logo, EN+HE) — pasted into Dashboard → Auth → Email Templates. Only "Confirm signup" is branded; other auth templates (reset password, magic link) are still default.
- **New-message notifications**: edge fn `supabase/functions/notify-message` — **deployed & live**. User-JWT auth pattern like `import-event`; service role for DB + `auth.admin.getUserById` for the recipient email. The branded blue HTML (EN+HE, sender name, listing title, message preview, "Open chat" CTA to `runimarket.org/messages?c=<id>`) is **built in code** (`buildEmailHtml`), not a dashboard template. Invoked **fire-and-forget from `useSendMessage`** after the insert (`.catch(() => {})` — chat never blocks/fails on it). Anti-burst rule: skips the email if the recipient already has an **older unread** message in the conversation (one email per unread burst). Secrets: `RESEND_API_KEY` (set), `NOTIFY_FROM_EMAIL` (optional, default `RUNI Market <notifications@runimarket.org>`). Sender content is HTML-escaped; preview truncated to 160 chars.
- ⚠️ Deploy reminder: pushing to main does NOT deploy edge fns — if `notify-message` code changes, redeploy it via Dashboard/CLI. All three edge fns (`import-event`, `translate-listing`, `notify-message`) currently show as deployed.

## Known Open Items / Next Ideas
- No reviews/ratings. Marketplace item offers/bidding remain intentionally out of scope; RUNI Tickets now has a scaffolded public bid/ask market view only.
- ~26 unit tests (email domain rule in `src/lib/email.ts`, conversation aggregation in `src/lib/conversations.ts`, i18n parity, storage path helper, event end-time/`datetime-local` helpers in `src/lib/eventTime.ts`, pickup-location labels in `src/lib/pickup.ts`); no E2E yet.

## Constraints
- English + Hebrew interface (full parity enforced by test)
- No payment processing
- Email restricted to `@post.runi.ac.il`
- Max 3 photos per listing (DB-enforced)
- Student-run side project — not an official university initiative
