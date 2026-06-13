-- ============================================================
-- STORAGE CLEANUP FOR DELETED LISTING IMAGES
-- ============================================================
-- Deleting a listing cascades to listing_images rows, but the
-- storage objects themselves were only removed client-side. The
-- storage DELETE policy is owner-folder only, so when an ADMIN
-- removes another user's listing the client remove() silently
-- fails and the files are orphaned. Account deletion (which
-- cascades through listings) had the same gap.
--
-- Fix it at the source: an AFTER DELETE trigger on listing_images
-- removes the matching storage object regardless of who deleted
-- the row. SECURITY DEFINER lets it bypass the owner-folder RLS
-- policy, so admin deletes and cascades clean up too. It is
-- idempotent with the eager client-side removal (the object is
-- simply already gone).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_listing_image_object()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  object_path text;
BEGIN
  -- image_url: https://<proj>.supabase.co/storage/v1/object/public/listing-images/<path>
  object_path := split_part(OLD.image_url, '/listing-images/', 2);
  IF object_path <> '' THEN
    DELETE FROM storage.objects
    WHERE bucket_id = 'listing-images' AND name = object_path;
  END IF;
  RETURN OLD;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_listing_image_object() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS delete_listing_image_object ON public.listing_images;
CREATE TRIGGER delete_listing_image_object
  AFTER DELETE ON public.listing_images
  FOR EACH ROW EXECUTE FUNCTION public.delete_listing_image_object();
