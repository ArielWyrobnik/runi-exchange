-- ============================================================
-- WATCHLIST (favorites)
-- ============================================================
CREATE TABLE public.watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist"
  ON public.watchlist FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can add to own watchlist"
  ON public.watchlist FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove from own watchlist"
  ON public.watchlist FOR DELETE
  USING (user_id = auth.uid());
