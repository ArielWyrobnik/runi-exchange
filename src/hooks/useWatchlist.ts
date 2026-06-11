import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ListingWithImages } from "@/hooks/useListings";

/** Set of listing ids the current user has watched — drives the heart state. */
export const useWatchlistIds = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["watchlist-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watchlist")
        .select("listing_id");
      if (error) throw error;
      return new Set(data.map((row) => row.listing_id));
    },
  });
};

/** Watched listings with full details for the watchlist page. */
export const useWatchlist = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["watchlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watchlist")
        .select("listing_id, created_at, listings(*, listing_images(image_url, display_order), profiles(full_name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data
        .map((row) => row.listings as unknown as ListingWithImages | null)
        .filter((l): l is ListingWithImages => !!l);
    },
  });
};

export const useToggleWatchlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingId, watched }: { listingId: string; watched: boolean }) => {
      if (!user) throw new Error("Must be logged in");
      if (watched) {
        const { error } = await supabase
          .from("watchlist")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("watchlist")
          .insert({ user_id: user.id, listing_id: listingId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist-ids"] });
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
};
