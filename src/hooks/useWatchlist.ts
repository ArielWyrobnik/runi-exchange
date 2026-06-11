import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ListingWithImages } from "@/hooks/useListings";

interface WatchlistRow {
  listing_id: string;
  created_at: string;
}

const fetchWatchlistRows = async (userId: string) => {
  const { data, error } = await supabase
    .from("watchlist")
    .select("listing_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as WatchlistRow[];
};

/** Set of listing ids the current user has watched - drives the heart state. */
export const useWatchlistIds = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["watchlist-ids", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const rows = await fetchWatchlistRows(user!.id);
      return new Set(rows.map((row) => row.listing_id));
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
      const rows = await fetchWatchlistRows(user!.id);
      const listingIds = rows.map((row) => row.listing_id);

      if (listingIds.length === 0) return [];

      const { data, error } = await supabase
        .from("listings")
        .select("*, listing_images(image_url, display_order), profiles(full_name)")
        .in("id", listingIds);

      if (error) throw error;

      const listingsById = new Map(
        ((data ?? []) as ListingWithImages[]).map((listing) => [listing.id, listing])
      );

      return listingIds
        .map((listingId) => listingsById.get(listingId))
        .filter((listing): listing is ListingWithImages => !!listing);
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
          .upsert(
            { user_id: user.id, listing_id: listingId },
            { onConflict: "user_id,listing_id", ignoreDuplicates: true }
          );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist-ids"] });
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      // watch_count lives on the listing rows - refresh them too.
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listing"] });
      queryClient.invalidateQueries({ queryKey: ["seller-listings"] });
    },
  });
};
