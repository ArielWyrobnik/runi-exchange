-- Restrict profile visibility to relevant users only
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view relevant profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.listings
        WHERE seller_id = profiles.id
          AND status = 'active'
      )
      OR EXISTS (
        SELECT 1
        FROM public.conversations
        WHERE (buyer_id = auth.uid() AND seller_id = profiles.id)
           OR (seller_id = auth.uid() AND buyer_id = profiles.id)
      )
    )
  );
