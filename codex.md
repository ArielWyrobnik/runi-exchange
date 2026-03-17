## 2026-03-17
- **What changed**: Updated the homepage "Start Selling" button text color utility from `text-primary-foreground` to `text-secondary-foreground` in `src/pages/Index.tsx` so the label color matches the "Browse Listings" button text.
- **Why**: The previous text color rendered the "Start Selling" label effectively invisible against the button background.
- **Risks**: Very low risk; this is a single Tailwind class change affecting only hero CTA text color styling on the homepage.
# Codex Change Log

## 2026-02-25
- **What changed (files):** Added a new Supabase migration `supabase/migrations/20260225000000_update_profiles_select_policy.sql` to replace the profiles SELECT RLS policy with a scoped policy that allows access only to: (1) the requesting user's own profile, (2) sellers with active listings, or (3) users with an existing conversation with the requester.
- **Why:** The previous policy allowed any authenticated user to read all profiles, which was broader than the intended privacy model.
- **Important notes / risks:**
  - Existing application queries that assumed unrestricted profile visibility may now return fewer rows and should rely on joins through listings/conversations where needed.
  - The migration uses `DROP POLICY IF EXISTS` for safer rollout across environments.
