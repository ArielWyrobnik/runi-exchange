import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ListingSort = "newest" | "price_asc" | "price_desc";

export interface ListingFilters {
  search?: string;
  category?: string;
  condition?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: ListingSort;
}

export interface ListingWithImages {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  status: string;
  seller_id: string;
  created_at: string;
  listing_images: { image_url: string; display_order: number }[];
  profiles: { full_name: string } | null;
}

export const useListings = (filters: ListingFilters = {}) => {
  return useQuery({
    queryKey: ["listings", filters],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("*, listing_images(image_url, display_order), profiles(full_name)")
        .eq("status", "active");

      if (filters.sort === "price_asc") {
        query = query.order("price", { ascending: true });
      } else if (filters.sort === "price_desc") {
        query = query.order("price", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.category) {
        query = query.eq("category", filters.category);
      }
      if (filters.condition) {
        query = query.eq("condition", filters.condition);
      }
      if (filters.priceMin !== undefined) {
        query = query.gte("price", filters.priceMin);
      }
      if (filters.priceMax !== undefined) {
        query = query.lte("price", filters.priceMax);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ListingWithImages[];
    },
  });
};

export const useListing = (id: string | undefined) => {
  return useQuery({
    queryKey: ["listing", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, listing_images(image_url, display_order), profiles(full_name)")
        .eq("id", id!)
        .maybeSingle();

      if (error) throw error;
      return data as ListingWithImages | null;
    },
  });
};

export const useMyListings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, listing_images(image_url, display_order), profiles(full_name)")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ListingWithImages[];
    },
  });
};

export const useUpdateListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...fields
    }: {
      id: string;
      title: string;
      description: string;
      price: number;
      category: string;
      condition: string;
    }) => {
      const { error } = await supabase.from("listings").update(fields).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["listing", vars.id] });
    },
  });
};

export const useSetListingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "sold" }) => {
      const { error } = await supabase.from("listings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["listing", vars.id] });
    },
  });
};

export const useDeleteListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    },
  });
};

export const useCreateListing = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      price,
      category,
      condition,
      images,
    }: {
      title: string;
      description: string;
      price: number;
      category: string;
      condition: string;
      images: File[];
    }) => {
      if (!user) throw new Error("Must be logged in");

      // Create listing
      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .insert({ seller_id: user.id, title, description, price, category, condition })
        .select()
        .single();

      if (listingError) throw listingError;

      // Upload images
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const filePath = `${user.id}/${listing.id}/${i}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("listing-images")
          .getPublicUrl(filePath);

        await supabase.from("listing_images").insert({
          listing_id: listing.id,
          image_url: urlData.publicUrl,
          display_order: i,
        });
      }

      return listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
};
