-- ============================================================
-- PUBLIC WATCH COUNT
-- ============================================================
-- The watchlist itself is private (RLS: own rows only), so expose a
-- counter on the listing that a trigger keeps in sync. Everyone can
-- see how many people watch an item without seeing who.

ALTER TABLE public.listings
  ADD COLUMN watch_count INTEGER NOT NULL DEFAULT 0;

-- Backfill for existing watchlist rows
UPDATE public.listings l
SET watch_count = sub.cnt
FROM (
  SELECT listing_id, count(*) AS cnt
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

CREATE TRIGGER watchlist_count_insert
  AFTER INSERT ON public.watchlist
  FOR EACH ROW EXECUTE FUNCTION public.update_watch_count();

CREATE TRIGGER watchlist_count_delete
  AFTER DELETE ON public.watchlist
  FOR EACH ROW EXECUTE FUNCTION public.update_watch_count();
