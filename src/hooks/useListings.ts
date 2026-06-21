import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { compressImage, storagePathFromPublicUrl } from "@/lib/image";

/** Compress and upload photos, then register them on the listing. */
const uploadListingImages = async (
  userId: string,
  listingId: string,
  files: File[],
  startOrder = 0
) => {
  for (let i = 0; i < files.length; i++) {
    const file = await compressImage(files[i]);
    const filePath = `${userId}/${listingId}/${Date.now()}-${i}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("listing-images")
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("listing_images").insert({
      listing_id: listingId,
      image_url: urlData.publicUrl,
      display_order: startOrder + i,
    });
    if (insertError) throw insertError;
  }
};

export type ListingSort = "newest" | "price_asc" | "price_desc";

export interface ListingFilters {
  search?: string;
  category?: string;
  condition?: string;
  pickup?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: ListingSort;
  limit?: number;
}

export interface ListingWithImages {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  pickup_location: string;
  status: string;
  seller_id: string;
  created_at: string;
  watch_count: number;
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
      if (filters.pickup) {
        query = query.eq("pickup_location", filters.pickup);
      }
      if (filters.priceMin !== undefined) {
        query = query.gte("price", filters.priceMin);
      }
      if (filters.priceMax !== undefined) {
        query = query.lte("price", filters.priceMax);
      }
      if (filters.limit !== undefined) {
        query = query.limit(filters.limit);
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
      title,
      description,
      price,
      category,
      condition,
      pickupLocation,
    }: {
      id: string;
      title: string;
      description: string;
      price: number;
      category: string;
      condition: string;
      pickupLocation: string;
    }) => {
      const { error } = await supabase
        .from("listings")
        .update({ title, description, price, category, condition, pickup_location: pickupLocation })
        .eq("id", id);
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
      // Eagerly remove the owner's image files. A DB trigger on
      // listing_images also cleans storage on delete (covering admin
      // deletes and account-deletion cascades, where this owner-folder
      // remove() is not permitted); the two are idempotent.
      const { data: images } = await supabase
        .from("listing_images")
        .select("image_url")
        .eq("listing_id", id);
      const paths = (images ?? [])
        .map((img) => storagePathFromPublicUrl(img.image_url, "listing-images"))
        .filter((p): p is string => !!p);
      if (paths.length > 0) {
        await supabase.storage.from("listing-images").remove(paths);
      }

      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    },
  });
};

export const useAddListingImages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      files,
      startOrder,
    }: {
      listingId: string;
      files: File[];
      startOrder: number;
    }) => {
      if (!user) throw new Error("Must be logged in");
      await uploadListingImages(user.id, listingId, files, startOrder);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["listing", vars.listingId] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    },
  });
};

export const useDeleteListingImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingId, imageUrl }: { listingId: string; imageUrl: string }) => {
      const { error } = await supabase
        .from("listing_images")
        .delete()
        .eq("listing_id", listingId)
        .eq("image_url", imageUrl);
      if (error) throw error;

      const path = storagePathFromPublicUrl(imageUrl, "listing-images");
      if (path) {
        await supabase.storage.from("listing-images").remove([path]);
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["listing", vars.listingId] });
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
      pickupLocation,
      images,
    }: {
      title: string;
      description: string;
      price: number;
      category: string;
      condition: string;
      pickupLocation: string;
      images: File[];
    }) => {
      if (!user) throw new Error("Must be logged in");

      // Create listing
      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .insert({
          seller_id: user.id,
          title,
          description,
          price,
          category,
          condition,
          pickup_location: pickupLocation,
        })
        .select()
        .single();

      if (listingError) throw listingError;

      await uploadListingImages(user.id, listing.id, images);

      return listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
};
