-- ============================================================
-- PUBLIC BROWSING
-- ============================================================
-- Anyone (logged in or not) can browse active listings, their images
-- and the seller names. Creating listings, messaging and everything
-- else still requires an authenticated account.

-- Listings: active ones are public; sellers always see their own,
-- and conversation participants keep access after a listing is sold.
DROP POLICY IF EXISTS "Anyone authenticated can view active listings" ON public.listings;
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

-- Listing images follow the listing's visibility.
DROP POLICY IF EXISTS "Anyone authenticated can view listing images" ON public.listing_images;
CREATE POLICY "Images of visible listings are public"
  ON public.listing_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_images.listing_id
    )
  );

-- Profiles: sellers with an active listing are publicly visible
-- (so anonymous visitors see seller names); otherwise unchanged.
DROP POLICY IF EXISTS "Authenticated users can view relevant profiles" ON public.profiles;
CREATE POLICY "Relevant profiles are visible"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE seller_id = profiles.id AND status = 'active'
    )
    OR id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.conversations
      WHERE (buyer_id = auth.uid() AND seller_id = profiles.id)
         OR (seller_id = auth.uid() AND buyer_id = profiles.id)
    )
  );
