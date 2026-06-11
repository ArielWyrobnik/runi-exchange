-- RUNI Market manual Supabase setup
-- Run this once in Supabase Dashboard > SQL Editor.
-- It is written to be safe if parts already exist.

-- ============================================================
-- WATCHLIST
-- ============================================================
CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DELETE FROM public.watchlist a
USING public.watchlist b
WHERE a.ctid < b.ctid
  AND a.user_id = b.user_id
  AND a.listing_id = b.listing_id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'watchlist_user_listing_unique'
  ) THEN
    ALTER TABLE public.watchlist
      ADD CONSTRAINT watchlist_user_listing_unique UNIQUE (user_id, listing_id);
  END IF;
END $$;

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own watchlist" ON public.watchlist;
CREATE POLICY "Users can view own watchlist"
  ON public.watchlist FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can add to own watchlist" ON public.watchlist;
CREATE POLICY "Users can add to own watchlist"
  ON public.watchlist FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can remove from own watchlist" ON public.watchlist;
CREATE POLICY "Users can remove from own watchlist"
  ON public.watchlist FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- WATCH COUNT
-- ============================================================
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS watch_count INTEGER NOT NULL DEFAULT 0;

UPDATE public.listings l
SET watch_count = sub.cnt
FROM (
  SELECT listing_id, count(*)::integer AS cnt
  FROM public.watchlist
  GROUP BY listing_id
) sub
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
-- CACHED LISTING TRANSLATIONS
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
  ON public.listing_translations FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS listing_translations_language_idx
  ON public.listing_translations(language);

CREATE OR REPLACE FUNCTION public.touch_listing_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
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
