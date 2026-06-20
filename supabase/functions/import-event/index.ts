import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Only links from this host can be imported. Keeps the server-side fetch
// scoped to the intended source (and limits SSRF surface for the admin tool).
const ALLOWED_HOST_SUFFIX = "go-out.co";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const getServiceKey = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// ---------- HTML metadata parsing (defensive: OpenGraph + JSON-LD) ----------

const decodeEntities = (input: string): string =>
  input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .trim();

/** Build a map of og:* / name=* / itemprop=* meta tags → content. */
const extractMeta = (html: string): Record<string, string> => {
  const meta: Record<string, string> = {};
  const tagRe = /<meta\b[^>]*>/gi;
  const attrRe = /(\w[\w:-]*)\s*=\s*"([^"]*)"|(\w[\w:-]*)\s*=\s*'([^']*)'/g;
  let tag: RegExpExecArray | null;
  while ((tag = tagRe.exec(html))) {
    const attrs: Record<string, string> = {};
    let a: RegExpExecArray | null;
    attrRe.lastIndex = 0;
    while ((a = attrRe.exec(tag[0]))) {
      const key = (a[1] ?? a[3]).toLowerCase();
      const val = a[2] ?? a[4] ?? "";
      attrs[key] = val;
    }
    const key = attrs.property ?? attrs.name ?? attrs.itemprop;
    if (key && attrs.content != null) {
      meta[key.toLowerCase()] = decodeEntities(attrs.content);
    }
  }
  return meta;
};

/** Collect every JSON-LD object on the page, flattening arrays and @graph. */
const extractJsonLd = (html: string): Record<string, unknown>[] => {
  const out: Record<string, unknown>[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length) {
        const node = queue.shift();
        if (node && typeof node === "object") {
          if (Array.isArray((node as Record<string, unknown>)["@graph"])) {
            queue.push(...((node as Record<string, unknown>)["@graph"] as unknown[]));
          }
          out.push(node as Record<string, unknown>);
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }
  return out;
};

const typeMatchesEvent = (type: unknown): boolean => {
  const types = Array.isArray(type) ? type : [type];
  return types.some((t) => typeof t === "string" && /event/i.test(t));
};

const asString = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** Pull a usable image URL out of a JSON-LD image field (string|array|object). */
const imageFromLd = (image: unknown): string => {
  if (typeof image === "string") return image;
  if (Array.isArray(image) && image.length) return imageFromLd(image[0]);
  if (image && typeof image === "object") {
    return asString((image as Record<string, unknown>).url);
  }
  return "";
};

/** Pull a venue/location string out of a JSON-LD location field. */
const venueFromLd = (location: unknown): string => {
  if (typeof location === "string") return location;
  if (Array.isArray(location) && location.length) return venueFromLd(location[0]);
  if (location && typeof location === "object") {
    const loc = location as Record<string, unknown>;
    const name = asString(loc.name);
    const address = loc.address;
    let addr = "";
    if (typeof address === "string") addr = address;
    else if (address && typeof address === "object") {
      const ad = address as Record<string, unknown>;
      addr = [asString(ad.streetAddress), asString(ad.addressLocality)]
        .filter(Boolean)
        .join(", ");
    }
    return [name, addr].filter(Boolean).join(" · ");
  }
  return "";
};

interface ParsedEvent {
  title: string;
  description: string;
  venue: string;
  startsAt: string | null;
  endsAt: string | null;
  imageUrl: string | null;
  sourceUrl: string;
}

const toIso = (value: string): string | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const parseEventHtml = (html: string, sourceUrl: string): ParsedEvent => {
  const meta = extractMeta(html);
  const ld = extractJsonLd(html);
  const event = ld.find((node) => typeMatchesEvent(node["@type"])) ?? {};

  const titleTagMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const titleTag = titleTagMatch ? decodeEntities(titleTagMatch[1]) : "";

  const title =
    asString(event.name) || meta["og:title"] || meta["twitter:title"] || titleTag;
  const description =
    asString(event.description) ||
    meta["og:description"] ||
    meta["twitter:description"] ||
    meta["description"] ||
    "";
  const venue = venueFromLd(event.location) || meta["event:location"] || "";
  const image =
    imageFromLd(event.image) ||
    meta["og:image:secure_url"] ||
    meta["og:image"] ||
    meta["twitter:image"] ||
    "";

  const startsAt =
    toIso(asString(event.startDate)) ||
    toIso(meta["event:start_time"]) ||
    toIso(meta["event:start_date"]);
  const endsAt =
    toIso(asString(event.endDate)) ||
    toIso(meta["event:end_time"]) ||
    toIso(meta["event:end_date"]);

  return {
    title: title.slice(0, 200),
    description: description.slice(0, 2000),
    venue: venue.slice(0, 200),
    startsAt,
    endsAt,
    imageUrl: image || null,
    sourceUrl,
  };
};

// ---------- request handling ----------

const isAllowedUrl = (raw: string): URL | null => {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.toLowerCase();
    if (host !== ALLOWED_HOST_SUFFIX && !host.endsWith(`.${ALLOWED_HOST_SUFFIX}`)) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
};

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "he,en;q=0.9",
};

/**
 * Download a cover image server-side (sending a Referer that satisfies the
 * source CDN's hotlink protection) and copy it into the public event-images
 * bucket. Returns the stable public bucket URL, or the original URL as a
 * last-resort fallback if the copy fails.
 */
const copyCoverImage = async (
  admin: ReturnType<typeof createClient>,
  sourceImageUrl: string,
  referer: string,
): Promise<string | null> => {
  if (!sourceImageUrl) return null;
  try {
    const imageHeaders = {
      ...BROWSER_HEADERS,
      Accept: "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8",
      Referer: referer,
    };
    const imgRes = await fetch(sourceImageUrl, { headers: imageHeaders, redirect: "follow" });
    if (!imgRes.ok) {
      console.error("Cover image fetch failed", imgRes.status, sourceImageUrl);
      return sourceImageUrl;
    }
    const buf = new Uint8Array(await imgRes.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > MAX_IMAGE_BYTES) return sourceImageUrl;
    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : contentType.includes("gif")
          ? "gif"
          : "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await admin.storage
      .from("event-images")
      .upload(path, buf, { contentType, upsert: false });
    if (uploadErr) {
      console.error("Cover image upload failed", uploadErr);
      return sourceImageUrl;
    }
    return admin.storage.from("event-images").getPublicUrl(path).data.publicUrl;
  } catch (err) {
    console.error("Cover image copy error", err);
    return sourceImageUrl;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = getServiceKey();
  if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
    return jsonResponse({ error: "Supabase service credentials are not configured" }, 500);
  }

  // --- authenticate + authorize (admins only) ---
  // Standard pattern: use the user's own JWT to verify identity, then service role for DB ops.
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return jsonResponse({ error: "Unauthorized" }, 401);
  const userId = user.id;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow) return jsonResponse({ error: "Admin access required" }, 403);

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action === "create" ? "create" : "parse";

    // ----- action: parse -----
    if (action === "parse") {
      const url = isAllowedUrl(String(body.url ?? ""));
      if (!url) {
        return jsonResponse(
          { error: `Only ${ALLOWED_HOST_SUFFIX} links are supported.` },
          400,
        );
      }
      const res = await fetch(url.toString(), { headers: BROWSER_HEADERS, redirect: "follow" });
      if (!res.ok) {
        return jsonResponse(
          { error: `Could not load the event page (HTTP ${res.status}).` },
          502,
        );
      }
      const html = await res.text();
      const parsed = parseEventHtml(html, url.toString());
      if (!parsed.title) {
        return jsonResponse(
          { error: "No event title found on the page. The link may not be a public event." },
          422,
        );
      }
      // Copy the cover image into our own bucket now, so the review form
      // previews the stable URL and the browser never hits go-out's hotlink
      // protection. Referer is the event page the image was embedded in.
      if (parsed.imageUrl) {
        parsed.imageUrl = await copyCoverImage(admin, parsed.imageUrl, url.toString());
      }
      return jsonResponse(parsed);
    }

    // ----- action: create -----
    const title = String(body.title ?? "").trim().slice(0, 200);
    const description = String(body.description ?? "").trim().slice(0, 2000);
    const venue = String(body.venue ?? "").trim().slice(0, 200);
    const emoji = String(body.emoji ?? "🎟️").trim().slice(0, 8) || "🎟️";
    const sourceUrl = String(body.sourceUrl ?? "").trim().slice(0, 2000);
    const startsAt = toIso(String(body.startsAt ?? ""));
    const endsAt = toIso(String(body.endsAt ?? ""));
    const sourceImageUrl = String(body.imageUrl ?? "").trim();

    if (!title) return jsonResponse({ error: "Title is required." }, 400);
    if (!startsAt || !endsAt) return jsonResponse({ error: "Start and end times are required." }, 400);
    if (new Date(endsAt) <= new Date(startsAt)) {
      return jsonResponse({ error: "End time must be after the start time." }, 400);
    }

    // Copy the cover image into our own storage so it stays stable.
    // Falls back to the original URL if the copy fails (e.g. CDN hotlink protection).
    let imageUrl: string | null = sourceImageUrl || null;
    if (sourceImageUrl) {
      try {
        const imgSourceUrl = new URL(sourceImageUrl);
        const imageHeaders = {
          ...BROWSER_HEADERS,
          Referer: `${imgSourceUrl.protocol}//${imgSourceUrl.hostname}/`,
          Origin: `${imgSourceUrl.protocol}//${imgSourceUrl.hostname}`,
        };
        const imgRes = await fetch(sourceImageUrl, { headers: imageHeaders, redirect: "follow" });
        if (imgRes.ok) {
          const buf = new Uint8Array(await imgRes.arrayBuffer());
          if (buf.byteLength > 0 && buf.byteLength <= MAX_IMAGE_BYTES) {
            const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
            const ext = contentType.includes("png")
              ? "png"
              : contentType.includes("webp")
                ? "webp"
                : contentType.includes("gif")
                  ? "gif"
                  : "jpg";
            const path = `${crypto.randomUUID()}.${ext}`;
            const { error: uploadErr } = await admin.storage
              .from("event-images")
              .upload(path, buf, { contentType, upsert: false });
            if (!uploadErr) {
              imageUrl = admin.storage.from("event-images").getPublicUrl(path).data.publicUrl;
            } else {
              console.error("Event image upload failed", uploadErr);
              // imageUrl stays as the original source URL (fallback)
            }
          }
        } else {
          console.error("Event image fetch failed with status", imgRes.status);
          // imageUrl stays as the original source URL (fallback)
        }
      } catch (err) {
        console.error("Event image fetch/upload error", err);
        // imageUrl stays as the original source URL (fallback)
      }
    }

    const { data: inserted, error: insertErr } = await admin
      .from("events")
      .insert({
        title,
        description: description || null,
        venue: venue || null,
        emoji,
        image_url: imageUrl,
        starts_at: startsAt,
        ends_at: endsAt,
        source_url: sourceUrl || null,
        created_by: userId,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;
    return jsonResponse({ event: inserted }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error(message);
    return jsonResponse({ error: message }, 500);
  }
});
