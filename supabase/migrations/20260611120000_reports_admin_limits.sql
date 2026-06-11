-- ============================================================
-- MODERATION, LIMITS, ACCOUNT DELETION
-- ============================================================

-- ------------------------------------------------------------
-- Roles: kept in a separate table (NOT on profiles, which users can
-- update themselves) so nobody can self-promote to admin. Rows are
-- managed via SQL only — there are no INSERT/UPDATE policies.
-- ------------------------------------------------------------
CREATE TABLE public.user_roles (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = uid AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;

-- Seed the first admin (project owner)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'ariel.wyrobnik@post.runi.ac.il'
ON CONFLICT (user_id) DO NOTHING;

-- ------------------------------------------------------------
-- Reports: any signed-in user can report a listing once; only
-- admins can read and resolve reports.
-- ------------------------------------------------------------
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (length(btrim(reason)) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, reporter_id)
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can report listings"
  ON public.reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can view reports"
  ON public.reports FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete reports"
  ON public.reports FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Admins can see and remove any listing
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

-- ------------------------------------------------------------
-- Anti-spam: cap active listings per user, and enforce the
-- 3-photos-per-listing rule in the database (was frontend-only).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_listing_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT count(*) FROM public.listings
    WHERE seller_id = NEW.seller_id AND status = 'active'
  ) >= 20 THEN
    RAISE EXCEPTION 'Listing limit reached: maximum 20 active listings per user.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.enforce_listing_limit() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER enforce_listing_limit
  BEFORE INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_listing_limit();

CREATE OR REPLACE FUNCTION public.enforce_image_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT count(*) FROM public.listing_images
    WHERE listing_id = NEW.listing_id
  ) >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 photos per listing.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.enforce_image_limit() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER enforce_image_limit
  BEFORE INSERT ON public.listing_images
  FOR EACH ROW EXECUTE FUNCTION public.enforce_image_limit();

-- ------------------------------------------------------------
-- Self-service account deletion (cascades through profiles,
-- listings, conversations, messages, watchlist, reports).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  DELETE FROM auth.users WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
