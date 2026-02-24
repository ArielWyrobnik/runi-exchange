# RUNI Market – Technical Architecture

## Database Schema

### profiles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | References auth.users(id), ON DELETE CASCADE |
| full_name | text | Required |
| avatar_url | text | Nullable |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### listings
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Default gen_random_uuid() |
| seller_id | uuid (FK) | References profiles(id), NOT NULL |
| title | text | NOT NULL |
| description | text | NOT NULL |
| price | numeric | NOT NULL, >= 0 |
| category | text | NOT NULL, one of predefined categories |
| condition | text | NOT NULL, one of predefined conditions |
| status | text | 'active' or 'sold', default 'active' |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### listing_images
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Default gen_random_uuid() |
| listing_id | uuid (FK) | References listings(id), ON DELETE CASCADE |
| image_url | text | NOT NULL |
| display_order | int | For ordering images |
| created_at | timestamptz | Default now() |

### conversations
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Default gen_random_uuid() |
| listing_id | uuid (FK) | References listings(id) |
| buyer_id | uuid (FK) | References profiles(id) |
| seller_id | uuid (FK) | References profiles(id) |
| created_at | timestamptz | Default now() |

### messages
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Default gen_random_uuid() |
| conversation_id | uuid (FK) | References conversations(id), ON DELETE CASCADE |
| sender_id | uuid (FK) | References profiles(id) |
| content | text | NOT NULL |
| is_read | boolean | Default false |
| created_at | timestamptz | Default now() |

## Component Structure
```
src/
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   ├── listings/
│   │   ├── ListingCard.tsx
│   │   ├── ListingGrid.tsx
│   │   ├── ListingForm.tsx
│   │   └── ImageUpload.tsx
│   ├── messaging/
│   │   ├── ConversationList.tsx
│   │   └── ChatWindow.tsx
│   └── ui/ (shadcn components)
├── pages/
│   ├── Index.tsx (Homepage)
│   ├── Browse.tsx
│   ├── ListingDetail.tsx
│   ├── CreateListing.tsx
│   ├── EditListing.tsx
│   ├── Profile.tsx
│   ├── Messages.tsx
│   ├── Login.tsx
│   ├── Signup.tsx
│   └── NotFound.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useListings.ts
│   └── useMessages.ts
├── lib/
│   ├── utils.ts
│   └── constants.ts
└── integrations/
    └── supabase/
```

## Authentication Flow
1. User signs up with `@post.runi.ac.il` email + password + full name
2. Email confirmation sent
3. On confirmation, database trigger auto-creates profile row
4. Login returns session; stored in Supabase client
5. Protected routes check auth state via `onAuthStateChange`

## Real-time Features
- Messages use Supabase Realtime subscriptions on the `messages` table
- Conversation list updates when new messages arrive
- Read receipts updated when user views a conversation
