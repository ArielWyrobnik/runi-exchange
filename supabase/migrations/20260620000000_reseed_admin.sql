-- Re-seed the admin role in case the original migration ran before the
-- admin account was created. ON CONFLICT DO NOTHING makes this idempotent.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'ariel.wyrobnik@post.runi.ac.il'
ON CONFLICT (user_id) DO NOTHING;
