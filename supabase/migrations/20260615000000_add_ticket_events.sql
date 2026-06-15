-- ============================================================
-- RUNI TICKETS: ADMIN-CURATED EVENTS (auto-expiring)
-- ============================================================
-- Replaces the static `ticketEvents.ts` scaffold with a real table.
-- Events are imported by admins from an external link (e.g. go-out.co)
-- via the `import-event` edge function, which parses the page metadata
-- and copies the cover image into the `event-images` bucket.
--
-- Auto-deletion: every event carries an `ends_at` timestamp. Events are
-- hidden from the public the moment they end (RLS predicate) and hard
-- deleted shortly after by a pg_cron job, which also frees the cover
-- image through the AFTER DELETE trigger below.
-- ------------------------------------------------------------

CREATE TABLE public.events (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  venue       TEXT,
  -- Decorative fallback shown when no cover image is available.
  emoji       TEXT NOT NULL DEFAULT '🎟️',
  -- Public URL inside the event-images bucket (nullable while parsing).
  image_url   TEXT,
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL,
  -- Original source link the event was imported from.
  source_url  TEXT,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT events_title_length CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  CONSTRAINT events_description_length CHECK (description IS NULL OR length(description) <= 2000),
  CONSTRAINT events_venue_length CHECK (venue IS NULL OR length(venue) <= 200),
  CONSTRAINT events_ends_after_start CHECK (ends_at > starts_at)
);

CREATE INDEX events_ends_at_idx ON public.events (ends_at);
CREATE INDEX events_starts_at_idx ON public.events (starts_at);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Explicit grants (RLS still restricts rows); mirrors the listings fix.
GRANT SELECT ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;

-- Everyone (anon + authenticated) can read events until they end. We do NOT
-- reference is_admin() here: anon has no EXECUTE on that SECURITY DEFINER
-- function and it is not inlinable, so calling it in an anon-facing SELECT
-- policy breaks public reads (this is exactly why is_admin was removed from
-- the public listings policy). Ended events are purged within minutes by the
-- pg_cron job below, so admins do not need a separate "see ended" branch.
CREATE POLICY "Active events are public"
  ON public.events FOR SELECT
  USING (ends_at > now());

CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() IS NOT NULL AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  USING (auth.uid() IS NOT NULL AND public.is_admin(auth.uid()));

-- ------------------------------------------------------------
-- Cover image storage: a public bucket. Uploads happen only through
-- the import-event edge function (service role, bypasses RLS), so no
-- client write policies are added. Public buckets serve objects via
-- their public URL without a SELECT policy.
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- Free the cover image when an event row is deleted (admin delete or
-- pg_cron purge). Mirrors delete_listing_image_object: SECURITY DEFINER
-- so it bypasses storage RLS, idempotent if the object is already gone.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_event_image_object()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  object_path text;
BEGIN
  -- image_url: https://<proj>.supabase.co/storage/v1/object/public/event-images/<path>
  object_path := split_part(OLD.image_url, '/event-images/', 2);
  IF object_path <> '' THEN
    DELETE FROM storage.objects
    WHERE bucket_id = 'event-images' AND name = object_path;
  END IF;
  RETURN OLD;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_event_image_object() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS delete_event_image_object ON public.events;
CREATE TRIGGER delete_event_image_object
  AFTER DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.delete_event_image_object();

-- ------------------------------------------------------------
-- Hard-delete expired events every 15 minutes via pg_cron. Wrapped
-- defensively: if the extension is not available on the current plan,
-- the migration still succeeds and the RLS predicate above keeps ended
-- events hidden from the UI (they just are not physically removed).
-- ------------------------------------------------------------
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  PERFORM cron.schedule(
    'purge-expired-ticket-events',
    '*/15 * * * *',
    $job$ DELETE FROM public.events WHERE ends_at < now() $job$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron unavailable; expired events stay hidden via RLS but are not hard-deleted (%).', SQLERRM;
END $$;
