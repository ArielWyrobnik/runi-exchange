-- ============================================================
-- MAKE STORAGE-CLEANUP TRIGGERS BEST-EFFORT
-- ============================================================
-- Supabase now blocks direct DML on storage.objects ("Direct deletion
-- from storage tables is not allowed. Use the Storage API instead."),
-- which made these AFTER DELETE triggers abort the parent delete —
-- users could no longer delete their own listings.
--
-- The eager client-side Storage-API removal in useDeleteListing /
-- useDeleteListingImage still cleans up the common owner-delete case.
-- The trigger cleanup (admin deletes, account-deletion cascades) becomes
-- best-effort: if the direct delete is rejected, swallow the error and
-- let the row delete proceed. Orphaned objects in those rare cases are
-- an accepted tradeoff.

CREATE OR REPLACE FUNCTION public.delete_listing_image_object()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  object_path text;
BEGIN
  object_path := split_part(OLD.image_url, '/listing-images/', 2);
  IF object_path <> '' THEN
    BEGIN
      DELETE FROM storage.objects
      WHERE bucket_id = 'listing-images' AND name = object_path;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- storage cleanup is best-effort; never block the delete
    END;
  END IF;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_event_image_object()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  object_path text;
BEGIN
  object_path := split_part(OLD.image_url, '/event-images/', 2);
  IF object_path <> '' THEN
    BEGIN
      DELETE FROM storage.objects
      WHERE bucket_id = 'event-images' AND name = object_path;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- storage cleanup is best-effort; never block the delete
    END;
  END IF;
  RETURN OLD;
END;
$$;
