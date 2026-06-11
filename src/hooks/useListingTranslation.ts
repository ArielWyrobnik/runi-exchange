import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import type { ListingWithImages } from "@/hooks/useListings";

interface ListingTranslationResponse {
  title: string;
  description: string;
  language: "en" | "he";
  cached?: boolean;
}

const HEBREW_TEXT = /[\u0590-\u05FF]/;
const LATIN_TEXT = /[A-Za-z]/;

const needsTranslation = (
  listing: Pick<ListingWithImages, "title" | "description"> | null | undefined,
  lang: "en" | "he"
) => {
  const text = `${listing?.title ?? ""}\n${listing?.description ?? ""}`.trim();
  if (!text) return false;

  if (lang === "en") return HEBREW_TEXT.test(text);
  return LATIN_TEXT.test(text);
};

export const useListingTranslation = (
  listing: Pick<ListingWithImages, "id" | "title" | "description"> | null | undefined
) => {
  const { lang } = useLanguage();
  const shouldTranslate = useMemo(() => needsTranslation(listing, lang), [listing, lang]);

  const query = useQuery({
    queryKey: ["listing-translation", listing?.id, lang],
    enabled: !!listing && shouldTranslate,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<ListingTranslationResponse>(
        "translate-listing",
        {
          body: { listingId: listing!.id, targetLanguage: lang },
        }
      );

      if (error) throw error;
      if (!data) throw new Error("No translation returned");
      return data;
    },
  });

  return {
    title: query.data?.title?.trim() || listing?.title || "",
    description: query.data?.description?.trim() || listing?.description || "",
    isTranslating: query.isLoading,
    translationError: query.error,
  };
};
