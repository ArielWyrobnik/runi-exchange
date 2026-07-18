import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

// Sends a branded "you have a new message" email to the other participant
// of a conversation, via Resend. Invoked fire-and-forget by the client
// right after a message insert (same client-side-first philosophy as
// useCreateEvent — no DB webhooks/pg_net to depend on).
//
// Anti-burst rule: if the recipient already has an older unread message in
// this conversation they were already notified and have not come back yet,
// so we skip — one email per unread burst, not one per message.
//
// Required secrets: RESEND_API_KEY. Optional: NOTIFY_FROM_EMAIL
// (default "RUNI Market <notifications@runimarket.org>").

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://runimarket.org";
const BRAND_BLUE = "#102C97";
const LOGO_URL = `${SITE_URL}/og-image.png`;
const PREVIEW_MAX_CHARS = 160;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escapeHtml = (input: string): string =>
  input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildEmailHtml = (opts: {
  senderName: string;
  listingTitle: string;
  preview: string;
  chatUrl: string;
}): string => {
  const senderName = escapeHtml(opts.senderName);
  const listingTitle = escapeHtml(opts.listingTitle);
  const preview = escapeHtml(opts.preview);
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background-color:${BRAND_BLUE};padding:20px 24px;" align="center">
              <img src="${LOGO_URL}" width="48" height="48" alt="RUNI Market" style="border-radius:10px;display:block;margin:0 auto 8px;" />
              <div style="color:#ffffff;font-size:18px;font-weight:700;">RUNI Market</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 8px;">
              <h1 style="margin:0 0 4px;font-size:18px;color:#111827;">You have a new message 📩</h1>
              <p dir="rtl" style="margin:0 0 16px;font-size:14px;color:#6b7280;">קיבלת הודעה חדשה</p>
              <p style="margin:0 0 6px;font-size:15px;color:#111827;">
                <strong>${senderName}</strong> sent you a message about
                <strong>${listingTitle}</strong>:
              </p>
              <blockquote style="margin:12px 0 20px;padding:12px 16px;background:#f4f5f7;border-left:3px solid ${BRAND_BLUE};border-radius:6px;font-size:14px;color:#374151;">
                ${preview}
              </blockquote>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 24px 28px;">
              <a href="${opts.chatUrl}"
                 style="display:inline-block;background-color:${BRAND_BLUE};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 32px;border-radius:8px;">
                Open chat · פתח צ׳אט
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;border-top:1px solid #e5e7eb;" align="center">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                RUNI Market · Reichman University, Herzliya<br />
                Student-run side project — not an official university initiative.
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!serviceKey) return jsonResponse({ error: "Service key not configured" }, 500);
  if (!resendKey) return jsonResponse({ skipped: "RESEND_API_KEY not configured" });

  // --- authenticate: the caller must be the sender of the message ---
  // Standard pattern: user JWT verifies identity, service role does DB work.
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return jsonResponse({ error: "Unauthorized" }, 401);

  let messageId: string | undefined;
  try {
    ({ messageId } = await req.json());
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  if (!messageId || typeof messageId !== "string") {
    return jsonResponse({ error: "messageId required" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: message } = await admin
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at")
    .eq("id", messageId)
    .maybeSingle();
  if (!message) return jsonResponse({ error: "Message not found" }, 404);
  if (message.sender_id !== user.id) {
    return jsonResponse({ error: "Not the sender of this message" }, 403);
  }

  const { data: conversation } = await admin
    .from("conversations")
    .select("id, buyer_id, seller_id, listing_id, listings(title)")
    .eq("id", message.conversation_id)
    .maybeSingle();
  if (!conversation) return jsonResponse({ error: "Conversation not found" }, 404);

  const recipientId =
    conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id;

  // Anti-burst: an older unread message means the recipient was already
  // notified for this burst — do not email again until they have read.
  const { count: olderUnread } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversation.id)
    .eq("sender_id", user.id)
    .eq("is_read", false)
    .neq("id", message.id)
    .lt("created_at", message.created_at);
  if ((olderUnread ?? 0) > 0) {
    return jsonResponse({ skipped: "recipient already notified for this burst" });
  }

  const { data: recipientUser } = await admin.auth.admin.getUserById(recipientId);
  const recipientEmail = recipientUser?.user?.email;
  if (!recipientEmail) return jsonResponse({ error: "Recipient email not found" }, 404);

  const { data: senderProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  const senderName = senderProfile?.full_name ?? "A RUNI student";
  const listingTitle =
    (conversation.listings as { title?: string } | null)?.title ?? "your listing";

  const preview =
    message.content.length > PREVIEW_MAX_CHARS
      ? `${message.content.slice(0, PREVIEW_MAX_CHARS)}…`
      : message.content;
  const chatUrl = `${SITE_URL}/messages?c=${conversation.id}`;

  const from =
    Deno.env.get("NOTIFY_FROM_EMAIL") ?? "RUNI Market <notifications@runimarket.org>";

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipientEmail],
      subject: `${senderName} sent you a message · RUNI Market`,
      html: buildEmailHtml({ senderName, listingTitle, preview, chatUrl }),
    }),
  });

  if (!resendRes.ok) {
    const detail = await resendRes.text().catch(() => "");
    console.error("Resend error", resendRes.status, detail);
    return jsonResponse({ error: "Email send failed" }, 502);
  }

  return jsonResponse({ sent: true });
});
