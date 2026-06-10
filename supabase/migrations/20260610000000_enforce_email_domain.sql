-- ============================================================
-- SERVER-SIDE EMAIL DOMAIN ENFORCEMENT
-- ============================================================
-- The frontend already rejects non-university emails, but that
-- check can be bypassed by calling the Supabase Auth API directly.
-- This trigger enforces the @post.runi.ac.il restriction at the
-- database level, so no signup can slip through regardless of how
-- the request reaches Supabase.

CREATE OR REPLACE FUNCTION public.enforce_university_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NULL OR lower(NEW.email) NOT LIKE '%@post.runi.ac.il' THEN
    RAISE EXCEPTION 'Only Reichman University students can register. Please use your @post.runi.ac.il email.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER enforce_university_email_on_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_university_email();

-- Also guard against email changes to a non-university address
-- (e.g. via the updateUser API after signup).
CREATE TRIGGER enforce_university_email_on_update
  BEFORE UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (NEW.email IS DISTINCT FROM OLD.email)
  EXECUTE FUNCTION public.enforce_university_email();
