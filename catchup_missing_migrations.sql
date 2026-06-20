-- ============================================================
-- CATCH-UP: applies migrations 2..11 that were never run on the
-- live DB (which only had the initial schema). Idempotent: safe to
-- run more than once. Run the whole thing at once in the SQL editor.
-- ============================================================

-- ============================================================
-- 1) EMAIL DOMAIN ENFORCEMENT  (20260610000000)
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_university_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NULL OR lower(NEW.email) NOT LIKE '%@post.runi.ac.il' THEN
    RAISE EXCEPTION 'Only Reichman University students can register. Please use your @post.runi.ac.il email.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_university_email_on_signup ON auth.users;
CREATE TRIGGER enforce_university_email_on_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_university_email();

DROP TRIGGER IF EXISTS enforce_university_email_on_update ON auth.users;
CREATE TRIGGER enforce_university_email_on_update
  BEFORE UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (NEW.email IS DISTINCT FROM OLD.email)
  EXECUTE FUNCTION public.enforce_university_email();

-- ============================================================
-- 2) PUBLIC READ  (20260610120000)
-- ============================================================
DROP POLICY IF EXISTS "Anyone authenticated can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Active listings are public" ON public.listings;
CREATE POLICY "Active listings are public"
  ON public.listings FOR SELECT
  USING (
    status = 'active'
    OR seller_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.conversations
      WHERE listing_id = listings.id
        AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Anyone authenticated can view listing images" ON public.listing_images;
DROP POLICY IF EXISTS "Images of visible listings are public" ON public.listing_images;
CREATE POLICY "Images of visible listings are public"
  ON public.listing_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.listings WHERE id = listing_images.listing_id));

DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view relevant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Relevant profiles are visible" ON public.profiles;
CREATE POLICY "Relevant profiles are visible"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.listings WHERE seller_id = profiles.id AND status = 'active')
    OR id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.conversations
      WHERE (buyer_id = auth.uid() AND seller_id = profiles.id)
         OR (seller_id = auth.uid() AND buyer_id = profiles.id)
    )
  );

-- ============================================================
-- 3) SECURITY HARDENING  (20260610130000)
-- ============================================================
DO $$ BEGIN
  ALTER TABLE public.messages ADD CONSTRAINT messages_content_length
    CHECK (length(btrim(content)) > 0 AND length(content) <= 2000);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.listings ADD CONSTRAINT listings_title_length
    CHECK (length(btrim(title)) BETWEEN 1 AND 100);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.listings ADD CONSTRAINT listings_description_length
    CHECK (length(btrim(description)) BETWEEN 1 AND 2000);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.listings ADD CONSTRAINT listings_price_range
    CHECK (price >= 0 AND price <= 1000000);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_full_name_length
    CHECK (length(full_name) BETWEEN 1 AND 100);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP POLICY IF EXISTS "Users can update own listing images" ON storage.objects;
CREATE POLICY "Users can update own listing images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Anyone can view listing images" ON storage.objects;

REVOKE EXECUTE ON FUNCTION public.enforce_university_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_conversation_participant(uuid) FROM PUBLIC, anon;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'graphql_public') THEN
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA graphql_public FROM anon, authenticated';
  END IF;
END $$;

-- ============================================================
-- 4) WATCHLIST  (20260611000000)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own watchlist" ON public.watchlist;
CREATE POLICY "Users can view own watchlist"
  ON public.watchlist FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can add to own watchlist" ON public.watchlist;
CREATE POLICY "Users can add to own watchlist"
  ON public.watchlist FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can remove from own watchlist" ON public.watchlist;
CREATE POLICY "Users can remove from own watchlist"
  ON public.watchlist FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- 5) WATCH COUNT  (20260611100000)
-- ============================================================
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS watch_count INTEGER NOT NULL DEFAULT 0;

UPDATE public.listings l
SET watch_count = COALESCE(sub.cnt, 0)
FROM (SELECT listing_id, count(*) AS cnt FROM public.watchlist GROUP BY listing_id) sub
WHERE l.id = sub.listing_id;

CREATE OR REPLACE FUNCTION public.update_watch_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings SET watch_count = watch_count + 1 WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.listings SET watch_count = greatest(watch_count - 1, 0) WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.update_watch_count() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS watchlist_count_insert ON public.watchlist;
CREATE TRIGGER watchlist_count_insert
  AFTER INSERT ON public.watchlist
  FOR EACH ROW EXECUTE FUNCTION public.update_watch_count();
DROP TRIGGER IF EXISTS watchlist_count_delete ON public.watchlist;
CREATE TRIGGER watchlist_count_delete
  AFTER DELETE ON public.watchlist
  FOR EACH ROW EXECUTE FUNCTION public.update_watch_count();

-- ============================================================
-- 6) PROTECT MESSAGE CONTENT  (20260611110000)
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_message_content()
RETURNS TRIGGER AS $$
BEGIN
  NEW.content := OLD.content;
  NEW.sender_id := OLD.sender_id;
  NEW.conversation_id := OLD.conversation_id;
  NEW.created_at := OLD.created_at;
  NEW.is_read := OLD.is_read OR NEW.is_read;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.protect_message_content() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_message_content ON public.messages;
CREATE TRIGGER protect_message_content
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.protect_message_content();

-- ============================================================
-- 7) ROLES / REPORTS / LIMITS / ACCOUNT DELETION  (20260611120000)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = uid AND role = 'admin'); $$;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;

-- Seed the project owner as admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'ariel.wyrobnik@post.runi.ac.il'
ON CONFLICT (user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (length(btrim(reason)) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, reporter_id)
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can report listings" ON public.reports;
CREATE POLICY "Authenticated users can report listings"
  ON public.reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
DROP POLICY IF EXISTS "Admins can view reports" ON public.reports;
CREATE POLICY "Admins can view reports"
  ON public.reports FOR SELECT USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can delete reports" ON public.reports;
CREATE POLICY "Admins can delete reports"
  ON public.reports FOR DELETE USING (public.is_admin(auth.uid()));

-- Admins can see/remove any listing
DROP POLICY IF EXISTS "Active listings are public" ON public.listings;
CREATE POLICY "Active listings are public"
  ON public.listings FOR SELECT
  USING (
    status = 'active'
    OR seller_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.conversations
      WHERE listing_id = listings.id
        AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings;
CREATE POLICY "Users can delete own listings"
  ON public.listings FOR DELETE
  USING (auth.uid() = seller_id OR public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.enforce_listing_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT count(*) FROM public.listings WHERE seller_id = NEW.seller_id AND status = 'active') >= 20 THEN
    RAISE EXCEPTION 'Listing limit reached: maximum 20 active listings per user.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.enforce_listing_limit() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS enforce_listing_limit ON public.listings;
CREATE TRIGGER enforce_listing_limit
  BEFORE INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_listing_limit();

CREATE OR REPLACE FUNCTION public.enforce_image_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT count(*) FROM public.listing_images WHERE listing_id = NEW.listing_id) >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 photos per listing.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.enforce_image_limit() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS enforce_image_limit ON public.listing_images;
CREATE TRIGGER enforce_image_limit
  BEFORE INSERT ON public.listing_images
  FOR EACH ROW EXECUTE FUNCTION public.enforce_image_limit();

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$ DELETE FROM auth.users WHERE id = auth.uid(); $$;
REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

-- ============================================================
-- 8) LISTING TRANSLATIONS  (20260611193000)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listing_translations (
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('en', 'he')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (listing_id, language)
);
ALTER TABLE public.listing_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view listing translations" ON public.listing_translations;
CREATE POLICY "Anyone can view listing translations"
  ON public.listing_translations FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS listing_translations_language_idx
  ON public.listing_translations(language);

CREATE OR REPLACE FUNCTION public.touch_listing_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS touch_listing_translations_updated_at ON public.listing_translations;
CREATE TRIGGER touch_listing_translations_updated_at
  BEFORE UPDATE ON public.listing_translations
  FOR EACH ROW EXECUTE FUNCTION public.touch_listing_translations_updated_at();

CREATE OR REPLACE FUNCTION public.clear_listing_translations()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.title IS DISTINCT FROM OLD.title OR NEW.description IS DISTINCT FROM OLD.description THEN
    DELETE FROM public.listing_translations WHERE listing_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.clear_listing_translations() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS clear_listing_translations_on_listing_update ON public.listings;
CREATE TRIGGER clear_listing_translations_on_listing_update
  AFTER UPDATE OF title, description ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.clear_listing_translations();

-- ============================================================
-- 9) STORAGE CLEANUP FOR LISTING IMAGES  (20260613000000)
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_listing_image_object()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage
AS $$
DECLARE object_path text;
BEGIN
  object_path := split_part(OLD.image_url, '/listing-images/', 2);
  IF object_path <> '' THEN
    DELETE FROM storage.objects WHERE bucket_id = 'listing-images' AND name = object_path;
  END IF;
  RETURN OLD;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.delete_listing_image_object() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS delete_listing_image_object ON public.listing_images;
CREATE TRIGGER delete_listing_image_object
  AFTER DELETE ON public.listing_images
  FOR EACH ROW EXECUTE FUNCTION public.delete_listing_image_object();

-- ============================================================
-- 10) FIX ANON PUBLIC LISTING READS  (20260613110000)
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.listings TO anon, authenticated;
GRANT SELECT ON public.listing_images TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;

DROP POLICY IF EXISTS "Active listings are public" ON public.listings;
CREATE POLICY "Active listings are public"
  ON public.listings FOR SELECT
  USING (
    status = 'active'
    OR (auth.uid() IS NOT NULL AND seller_id = auth.uid())
    OR (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE listing_id = listings.id
        AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    ))
  );

DROP POLICY IF EXISTS "Images of visible listings are public" ON public.listing_images;
CREATE POLICY "Images of visible listings are public"
  ON public.listing_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.listings WHERE id = listing_images.listing_id));

DROP POLICY IF EXISTS "Relevant profiles are visible" ON public.profiles;
CREATE POLICY "Relevant profiles are visible"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.listings WHERE seller_id = profiles.id AND status = 'active')
    OR (auth.uid() IS NOT NULL AND id = auth.uid())
    OR (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE (buyer_id = auth.uid() AND seller_id = profiles.id)
         OR (seller_id = auth.uid() AND buyer_id = profiles.id)
    ))
  );

-- ============================================================
-- 11) RUNI TICKETS EVENTS  (20260615000000)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  venue       TEXT,
  emoji       TEXT NOT NULL DEFAULT '🎟️',
  image_url   TEXT,
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL,
  source_url  TEXT,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT events_title_length CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  CONSTRAINT events_description_length CHECK (description IS NULL OR length(description) <= 2000),
  CONSTRAINT events_venue_length CHECK (venue IS NULL OR length(venue) <= 200),
  CONSTRAINT events_ends_after_start CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS events_ends_at_idx ON public.events (ends_at);
CREATE INDEX IF NOT EXISTS events_starts_at_idx ON public.events (starts_at);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;

DROP POLICY IF EXISTS "Active events are public" ON public.events;
CREATE POLICY "Active events are public"
  ON public.events FOR SELECT USING (ends_at > now());

DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update events" ON public.events;
CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() IS NOT NULL AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  USING (auth.uid() IS NOT NULL AND public.is_admin(auth.uid()));

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true) ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.delete_event_image_object()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage
AS $$
DECLARE object_path text;
BEGIN
  object_path := split_part(OLD.image_url, '/event-images/', 2);
  IF object_path <> '' THEN
    DELETE FROM storage.objects WHERE bucket_id = 'event-images' AND name = object_path;
  END IF;
  RETURN OLD;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.delete_event_image_object() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS delete_event_image_object ON public.events;
CREATE TRIGGER delete_event_image_object
  AFTER DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.delete_event_image_object();

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  PERFORM cron.schedule(
    'purge-expired-ticket-events',
    '*/15 * * * *',
    $job$ DELETE FROM public.events WHERE ends_at < now() $job$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron unavailable; expired events stay hidden via RLS only (%).', SQLERRM;
END $$;
