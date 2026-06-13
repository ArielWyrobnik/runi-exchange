-- ============================================================
-- FIX ANONYMOUS PUBLIC LISTING READS
-- ============================================================
-- Public browsing is a core product requirement: anonymous visitors must
-- see active marketplace listings on the home page and browse page.
--
-- Keep active listings/images/seller names public, but guard all
-- authenticated-only relationship checks behind auth.uid() IS NOT NULL so
-- anon requests do not depend on protected conversation access. Also make
-- the table grants explicit for environments where default Supabase grants
-- were not present when earlier migrations ran.

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
    OR (
      auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.conversations
        WHERE listing_id = listings.id
          AND (buyer_id = auth.uid() OR seller_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Images of visible listings are public" ON public.listing_images;
CREATE POLICY "Images of visible listings are public"
  ON public.listing_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_images.listing_id
    )
  );

DROP POLICY IF EXISTS "Relevant profiles are visible" ON public.profiles;
CREATE POLICY "Relevant profiles are visible"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE seller_id = profiles.id AND status = 'active'
    )
    OR (auth.uid() IS NOT NULL AND id = auth.uid())
    OR (
      auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.conversations
        WHERE (buyer_id = auth.uid() AND seller_id = profiles.id)
           OR (seller_id = auth.uid() AND buyer_id = profiles.id)
      )
    )
  );
