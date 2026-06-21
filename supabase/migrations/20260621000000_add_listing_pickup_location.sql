-- ============================================================
-- LISTINGS: PICKUP / HANDOVER LOCATION
-- ============================================================
-- Sellers must indicate whether an item can be handed over on campus
-- or has to be collected off campus. This matters for buyers without a
-- car (e.g. a student living in the dorms who needs a mattress) who can
-- realistically only take items that are handed over on campus.
--
-- Stored values are kept in English (like category/condition) and
-- translated for display only: 'on_campus' | 'off_campus'.
--
-- Existing listings predate this field. The marketplace's whole model
-- is meeting on campus ("Meet on Campus" on the home page), so the
-- column default backfills them to 'on_campus'; sellers can change it
-- by editing the listing. The Sell form still forces an explicit choice.
--
-- Idempotent (IF NOT EXISTS / DROP CONSTRAINT IF EXISTS) so it can be
-- replayed via the Supabase SQL editor if Lovable does not apply it.
-- ------------------------------------------------------------

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS pickup_location TEXT NOT NULL DEFAULT 'on_campus';

ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_pickup_location_valid;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_pickup_location_valid
    CHECK (pickup_location IN ('on_campus', 'off_campus'));
