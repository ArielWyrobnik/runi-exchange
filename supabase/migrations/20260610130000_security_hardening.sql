-- ============================================================
-- SECURITY HARDENING
-- ============================================================
-- Addresses the issues flagged by the security scan.

-- ------------------------------------------------------------
-- Server-side content validation (frontend checks can be bypassed
-- by calling the API directly)
-- ------------------------------------------------------------
ALTER TABLE public.messages
  ADD CONSTRAINT messages_content_length
  CHECK (length(btrim(content)) > 0 AND length(content) <= 2000);

ALTER TABLE public.listings
  ADD CONSTRAINT listings_title_length
    CHECK (length(btrim(title)) BETWEEN 1 AND 100),
  ADD CONSTRAINT listings_description_length
    CHECK (length(btrim(description)) BETWEEN 1 AND 2000),
  ADD CONSTRAINT listings_price_range
    CHECK (price >= 0 AND price <= 1000000);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_full_name_length
  CHECK (length(full_name) BETWEEN 1 AND 100);

-- ------------------------------------------------------------
-- Storage: add the missing UPDATE policy (owner only) and stop
-- anonymous enumeration of the bucket. Objects themselves stay
-- readable through the bucket's public object URLs.
-- ------------------------------------------------------------
CREATE POLICY "Users can update own listing images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Anyone can view listing images" ON storage.objects;

-- ------------------------------------------------------------
-- Lock down function execution: trigger functions never need to be
-- callable by clients (triggers fire regardless), and the RLS helper
-- is only needed by authenticated queries.
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.enforce_university_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_conversation_participant(uuid) FROM PUBLIC, anon;

-- ------------------------------------------------------------
-- Disable the GraphQL endpoint for API roles — the app talks to
-- PostgREST only, so nothing should be queryable via GraphQL.
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'graphql_public') THEN
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA graphql_public FROM anon, authenticated';
  END IF;
END $$;
