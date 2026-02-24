
# RUNI Market – Campus Marketplace for Reichman University

## Overview
A web marketplace exclusively for Reichman University students to buy and sell second-hand items within their campus community in Herzliya, Israel. Think eBay, but just for your university.

---

## Phase 1: Foundation & Setup

### Documentation Files
Create four documentation files at the project root:
- **CLAUDE.md** – Project overview, tech stack, architecture summary, current status, design system, and constraints
- **architecture.md** – Database schema, component structure, authentication flow, real-time features
- **decisions.md** – Technology and design decision log with rationale
- **progress.md** – Completed, in-progress, and upcoming work tracker

### Design System
- **Primary color**: RGB(16, 44, 151) – Reichman University blue
- **Clean white backgrounds** with the blue as accent
- **Mobile-first responsive layout** – premium marketplace feel
- **Reichman University logo** in top-left navigation (from provided URL)

### Supabase Backend Setup
- **Database tables**: profiles, listings, listing_images, conversations, messages
- **Authentication**: Email/password signup restricted to `@post.runi.ac.il` domain
- **Storage**: Public bucket for listing images (max 3 per listing)
- **RLS policies**: Users can only edit their own data; all authenticated users can browse listings
- **Auto-profile creation**: Database trigger creates a profile row on signup

### Layout Components
- **Navbar**: Reichman logo (top-left), navigation links (Browse, Sell, Messages), user avatar/auth buttons
- **Footer**: Simple footer with links
- **Responsive Layout**: Mobile hamburger menu, desktop horizontal nav

---

## Phase 2: Authentication

### Signup Page
- Email field with validation that it ends with `@post.runi.ac.il`
- Password field with strength requirements
- Full name field
- Clear error message if non-Reichman email is used
- Email confirmation flow

### Login Page
- Email and password fields
- "Forgot password" link with reset flow
- Redirect to homepage after login

### Protected Routes
- Unauthenticated users can browse listings but cannot create listings, message sellers, or access profile

---

## Phase 3: Listings

### Create Listing Page
- Form with: title, description, price (₪), category dropdown, condition dropdown
- Photo upload area supporting up to 3 images with drag-and-drop
- Preview before publishing
- Categories: Furniture, Electronics, Books & Study Materials, Clothes, Kitchen & Appliances, Sports & Outdoors, Other
- Conditions: New, Like New, Good, Fair, Poor

### Homepage
- Hero section welcoming students to RUNI Market
- Grid of recent listings (most recently posted)
- Category quick-filter chips
- Search bar prominently placed

### Browse Page
- Search by keyword
- Filter sidebar/drawer: category, price range (min/max), condition
- Sort by: newest, price low-to-high, price high-to-low
- Responsive grid of listing cards (image, title, price, condition badge)

### Listing Detail Page
- Image carousel/gallery for listing photos
- Title, price, description, condition, category
- Seller info card (name, member since)
- "Contact Seller" button (opens messaging)
- "Mark as Sold" button (visible only to the listing owner)

### Edit Listing
- Same form as create, pre-populated with existing data
- Option to delete listing

---

## Phase 4: User Profile

### Profile Page
- User info header (name, email, member since)
- Tabs: "Active Listings" and "Sold Items"
- Listing cards in grid layout
- Edit profile option (name, avatar)

---

## Phase 5: Messaging

### Conversations List
- List of all conversations, grouped by listing
- Shows other party's name, listing title, last message preview, timestamp
- Unread message indicator (badge)

### Chat Window
- Real-time message thread between buyer and seller
- Linked to a specific listing (shown at top of chat)
- Text input with send button
- Messages appear instantly via Supabase Realtime subscriptions
- Read receipts (messages marked as read when viewed)

---

## Phase 6: Polish & Quality

- Loading skeletons for all data-fetching states
- Empty states with friendly illustrations/messages
- Error handling with toast notifications
- Mobile responsiveness fine-tuning across all pages
- Image lazy loading and pagination for listings
- Clean, well-commented code throughout for future AI-assisted development
