-- ============================================================
-- PROTECT MESSAGE CONTENT
-- ============================================================
-- The UPDATE policy on messages exists so participants can mark
-- messages as read, but RLS cannot restrict columns — without this
-- trigger a participant could rewrite the other person's message
-- text. Freeze everything except the read flag (which can only go
-- from unread to read).

CREATE OR REPLACE FUNCTION public.protect_message_content()
RETURNS TRIGGER AS $$
BEGIN
  NEW.content := OLD.content;
  NEW.sender_id := OLD.sender_id;
  NEW.conversation_id := OLD.conversation_id;
  NEW.created_at := OLD.created_at;
  NEW.is_read := OLD.is_read OR NEW.is_read;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.protect_message_content() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER protect_message_content
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.protect_message_content();
