

# Implementation Plan: Auth, Browse, Sell, and Messages

This is a large feature set touching database, storage, auth, and four new pages. Here is the full plan.

---

## 1. Database Migration (Single SQL Migration)

Create all tables, helper functions, RLS policies, storage bucket, and auto-profile trigger in one migration.

### Tables
- **profiles** — `id uuid PK` (references `auth.users(id)` ON DELETE CASCADE), `full_name text NOT NULL`, `avatar_url text`, `created_at timestamptz`, `updated_at timestamptz`
- **listings** — `id uuid PK`, `seller_id uuid FK→profiles NOT NULL`, `title text NOT NULL`, `description text NOT NULL`, `price numeric NOT NULL CHECK >= 0`, `category text NOT NULL`, `condition text NOT NULL`, `status text DEFAULT 'active'`, `created_at`, `updated_at`
- **listing_images** — `id uuid PK`, `listing_id uuid FK→listings ON DELETE CASCADE`, `image_url text NOT NULL`, `display_order int`, `created_at`
- **conversations** — `id uuid PK`, `listing_id uuid FK→listings`, `buyer_id uuid FK→profiles`, `seller_id uuid FK→profiles`, `created_at`. Unique constraint on `(listing_id, buyer_id, seller_id)`
- **messages** — `id uuid PK`, `conversation_id uuid FK→conversations ON DELETE CASCADE`, `sender_id uuid FK→profiles`, `content text NOT NULL`, `is_read boolean DEFAULT false`, `created_at`

### Trigger: Auto-create profile on signup
A function `handle_new_user()` that inserts into `profiles` using `auth.users` metadata (`full_name`). Triggered on `INSERT` on `auth.users`.

### Helper Functions (SECURITY DEFINER)
- `is_conversation_participant(conv_id uuid)` — returns true if `auth.uid()` is `buyer_id` or `seller_id` of the conversation.

### RLS Policies
- **profiles**: SELECT for all authenticated; INSERT/UPDATE only own row
- **listings**: SELECT for all authenticated; INSERT only where `seller_id = auth.uid()`; UPDATE/DELETE only own
- **listing_images**: SELECT for all authenticated; INSERT/DELETE only for images on own listings
- **conversations**: SELECT only if participant; INSERT only if `buyer_id = auth.uid()`
- **messages**: SELECT only if participant of conversation; INSERT only if `sender_id = auth.uid()` AND participant

### Storage
- Create `listing-images` bucket (public) with RLS policies allowing authenticated users to upload to their own folder (`auth.uid()/`) and anyone to read.

### Realtime
- Enable realtime on the `messages` table for live chat.

---

## 2. Auth Context & Hook (`src/hooks/useAuth.tsx`)

Create an `AuthProvider` context that:
- Listens to `onAuthStateChange` (set up BEFORE calling `getSession`)
- Exposes `user`, `session`, `loading`, `signUp`, `signIn`, `signOut`
- `signUp` validates email domain client-side before calling `supabase.auth.signUp` with `full_name` in metadata
- `signOut` redirects to `/`
- Wrap the app with `<AuthProvider>` in `App.tsx`

---

## 3. Protected Route Component (`src/components/ProtectedRoute.tsx`)

A wrapper component that:
- Shows a loading spinner while auth is being checked
- Redirects to `/login` if user is not authenticated
- Renders children if authenticated

---

## 4. Update Navbar

- Import `useAuth` hook
- If logged in: show user's name/avatar and a "Log out" button instead of "Log in / Sign up"
- Update the "Sell" link to point to `/sell`

---

## 5. New Pages

### Login Page (`src/pages/Login.tsx`)
- Email + password form
- Link to signup
- On success, redirect to `/browse`
- Error handling with toast

### Signup Page (`src/pages/Signup.tsx`)
- Full name + email + password form
- Client-side validation: email must end with `@post.runi.ac.il`
- Clear error message for non-RUNI emails
- On success, show "Check your email for confirmation" message

### Browse Page (`src/pages/Browse.tsx`)
- Search bar at top (searches `title` and `description` via Supabase `ilike` or `textSearch`)
- Filter bar: Category dropdown, Condition dropdown, Price min/max inputs
- Fetches listings from Supabase `listings` table joined with `listing_images` (first image) and `profiles` (seller name)
- Displays a responsive grid of `ListingCard` components
- Empty state: "No listings yet -- be the first to sell something!"
- Uses `@tanstack/react-query` for data fetching

### Sell Page (`src/pages/Sell.tsx`)
- Wrapped in `ProtectedRoute`
- Form with react-hook-form + zod validation: title, description, price (₪), category dropdown, condition dropdown
- Image upload component: up to 3 images, uploads to `listing-images` bucket under `{user_id}/{listing_id}/`
- On submit: create listing in DB, upload images, create `listing_images` rows, redirect to `/listing/{id}`

### Messages Page (`src/pages/Messages.tsx`)
- Wrapped in `ProtectedRoute`
- Left panel: list of conversations fetched from `conversations` joined with `profiles` and latest message
- Right panel: chat thread for selected conversation
- Real-time subscription on `messages` table filtered by `conversation_id`
- Send message form at the bottom
- Mark messages as read when conversation is opened
- Empty state if no conversations

---

## 6. Supporting Components

### `ListingCard` (`src/components/listings/ListingCard.tsx`)
- Card with image thumbnail, title, price (₪), condition badge, category label
- Links to `/listing/{id}`

### `ImageUpload` (`src/components/listings/ImageUpload.tsx`)
- Drag-and-drop or click to upload
- Preview thumbnails
- Remove button on each image
- Max 3 images enforced

### `ConversationList` (`src/components/messaging/ConversationList.tsx`)
- List items showing other party's name, listing title, last message preview, timestamp

### `ChatWindow` (`src/components/messaging/ChatWindow.tsx`)
- Scrollable message list with sender alignment (own messages right, other left)
- Text input + send button
- Realtime subscription for new messages

---

## 7. Hooks

### `useListings` (`src/hooks/useListings.ts`)
- `useListings(filters)` — fetches listings with filters (category, condition, price range, search query)
- `useCreateListing()` — mutation to create a listing + upload images

### `useMessages` (`src/hooks/useMessages.ts`)
- `useConversations()` — fetches user's conversations
- `useMessages(conversationId)` — fetches messages + realtime subscription
- `useSendMessage()` — mutation to send a message
- `useCreateConversation()` — finds or creates a conversation for a listing

---

## 8. Route Updates (`App.tsx`)

Add routes:
- `/login` → Login page
- `/signup` → Signup page
- `/browse` → Browse page
- `/sell` → Sell page (protected)
- `/messages` → Messages page (protected)
- `/listing/:id` → Listing detail (placeholder for now)

---

## 9. Documentation Updates

Update `progress.md`, `CLAUDE.md`, and `architecture.md` to reflect completed Phase 1-2 work and in-progress Phase 3-5.

---

## Technical Details

### SQL Migration (key parts)

```text
profiles
  id uuid PK → auth.users(id) ON DELETE CASCADE
  full_name text NOT NULL
  avatar_url text
  created_at/updated_at timestamptz DEFAULT now()

listings
  id uuid PK DEFAULT gen_random_uuid()
  seller_id uuid FK → profiles(id) NOT NULL
  title, description text NOT NULL
  price numeric NOT NULL CHECK (price >= 0)
  category, condition, status text NOT NULL
  created_at/updated_at timestamptz DEFAULT now()

listing_images
  listing_id FK → listings(id) ON DELETE CASCADE

conversations
  UNIQUE(listing_id, buyer_id, seller_id)

Trigger: handle_new_user() on auth.users AFTER INSERT
  → INSERT INTO profiles(id, full_name)
  → VALUES(NEW.id, NEW.raw_user_meta_data->>'full_name')
```

### File Structure (new files)

```text
src/
├── hooks/
│   ├── useAuth.tsx        (AuthProvider + context)
│   ├── useListings.ts     (query/mutation hooks)
│   └── useMessages.ts     (query/mutation/realtime hooks)
├── components/
│   ├── ProtectedRoute.tsx
│   ├── listings/
│   │   ├── ListingCard.tsx
│   │   └── ImageUpload.tsx
│   └── messaging/
│       ├── ConversationList.tsx
│       └── ChatWindow.tsx
├── pages/
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Browse.tsx
│   ├── Sell.tsx
│   └── Messages.tsx
```

### Implementation Order
1. Database migration (all tables + RLS + storage + trigger)
2. Auth hook + provider + wrap App
3. Login + Signup pages
4. Update Navbar for auth state
5. ProtectedRoute component
6. Browse page + ListingCard + useListings hook
7. Sell page + ImageUpload + create listing mutation
8. Messages page + ConversationList + ChatWindow + useMessages hook
9. Route registration in App.tsx
10. Documentation updates

