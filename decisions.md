# RUNI Market – Decision Log

## Technology Decisions

### Supabase via Lovable Cloud
**Decision**: Use Lovable Cloud (Supabase) for backend.
**Rationale**: Provides auth, database, storage, and realtime out of the box. No separate backend server needed. Perfect for a student project that needs to ship fast.

### Email Domain Restriction
**Decision**: Restrict signup to `@post.runi.ac.il` emails only.
**Rationale**: Ensures only Reichman University students can use the platform, building trust within the community. Validated client-side and enforced server-side.

### No Payment Processing
**Decision**: No integrated payments.
**Rationale**: All transactions happen in person on campus. Adding payments would introduce unnecessary complexity, legal requirements, and fees.

### React + Vite + Tailwind
**Decision**: Use the default Lovable stack.
**Rationale**: Fast development, excellent DX, wide ecosystem support. shadcn/ui provides accessible, customizable components.

### TanStack React Query
**Decision**: Use React Query for server state management.
**Rationale**: Handles caching, refetching, loading/error states elegantly. Reduces boilerplate compared to manual fetch + useState.

## Design Decisions

### Reichman Blue as Primary Color
**Decision**: HSL(226, 81%, 33%) as the primary color.
**Rationale**: Matches Reichman University's brand identity. Creates instant recognition and trust for students.

### Mobile-First Layout
**Decision**: Design mobile-first, enhance for desktop.
**Rationale**: Students primarily browse on their phones. The marketplace should feel native and fast on mobile devices.

### Maximum 3 Photos Per Listing
**Decision**: Limit listing images to 3.
**Rationale**: Keeps storage costs manageable, encourages concise listings, and simplifies the upload UX.

### English-Only Interface
**Decision**: No i18n, English only.
**Rationale**: Reichman University teaches in English. All students are comfortable with English. Simplifies development.
