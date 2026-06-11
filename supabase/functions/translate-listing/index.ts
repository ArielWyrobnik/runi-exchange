import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANGUAGES = {
  en: "English",
  he: "Hebrew",
} as const;

type TargetLanguage = keyof typeof LANGUAGES;

const isTargetLanguage = (value: unknown): value is TargetLanguage =>
  value === "en" || value === "he";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const listingId = typeof body.listingId === "string" ? body.listingId : "";
    const targetLanguage = body.targetLanguage;

    if (!listingId || !isTargetLanguage(targetLanguage)) {
      return jsonResponse({ error: "listingId and targetLanguage are required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Supabase service credentials are not configured" }, 500);
    }

    if (!openAiApiKey) {
      return jsonResponse({ error: "OPENAI_API_KEY is not configured" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: cached, error: cacheError } = await supabase
      .from("listing_translations")
      .select("title, description, language")
      .eq("listing_id", listingId)
      .eq("language", targetLanguage)
      .maybeSingle();

    if (!cacheError && cached) {
      return jsonResponse({ ...cached, cached: true });
    }

    if (cacheError) {
      console.error("Translation cache lookup failed", cacheError);
    }

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, title, description")
      .eq("id", listingId)
      .maybeSingle();

    if (listingError) throw listingError;
    if (!listing) return jsonResponse({ error: "Listing not found" }, 404);

    const sourceTitle = String(listing.title ?? "").slice(0, 300);
    const sourceDescription = String(listing.description ?? "").slice(0, 5000);
    const model = Deno.env.get("OPENAI_TRANSLATION_MODEL") ?? "gpt-4o-mini";

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You translate marketplace listing content. Return JSON only with string keys title and description. Preserve brand names, model numbers, prices, measurements, URLs, condition details, and all factual meaning. Do not add facts or sales copy.",
          },
          {
            role: "user",
            content: `Target language: ${LANGUAGES[targetLanguage]}\n\nTitle:\n${sourceTitle}\n\nDescription:\n${sourceDescription}\n\nReturn JSON in this exact shape: {"title":"...","description":"..."}`,
          },
        ],
      }),
    });

    const payload = await openAiResponse.json();

    if (!openAiResponse.ok) {
      const message = payload?.error?.message ?? "OpenAI translation failed";
      return jsonResponse({ error: message }, openAiResponse.status);
    }

    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("OpenAI response did not include translated content");
    }

    const parsed = JSON.parse(content);
    const title = typeof parsed.title === "string" && parsed.title.trim()
      ? parsed.title.trim()
      : sourceTitle;
    const description =
      typeof parsed.description === "string" && parsed.description.trim()
        ? parsed.description.trim()
        : sourceDescription;

    const result = {
      listing_id: listingId,
      language: targetLanguage,
      title,
      description,
    };

    const { error: upsertError } = await supabase
      .from("listing_translations")
      .upsert(result, { onConflict: "listing_id,language" });

    if (upsertError) {
      console.error("Translation cache write failed", upsertError);
    }

    return jsonResponse({ language: targetLanguage, title, description, cached: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected translation error";
    console.error(message);
    return jsonResponse({ error: message }, 500);
  }
});
