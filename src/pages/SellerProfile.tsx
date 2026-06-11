import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import ListingCard from "@/components/listings/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Loader2, UserX } from "lucide-react";
import type { ListingWithImages } from "@/hooks/useListings";

const useSellerProfile = (id: string | undefined) =>
  useQuery({
    queryKey: ["seller-profile", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, created_at")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

const useSellerListings = (id: string | undefined) =>
  useQuery({
    queryKey: ["seller-listings", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, listing_images(image_url, display_order), profiles(full_name)")
        .eq("seller_id", id!)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ListingWithImages[];
    },
  });

const SellerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useLanguage();
  const { data: profile, isLoading: profileLoading } = useSellerProfile(id);
  const { data: listings, isLoading: listingsLoading } = useSellerListings(id);

  if (profileLoading) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <UserX className="mb-3 h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-semibold">{t("sellerNotFound")}</h1>
        </div>
      </Layout>
    );
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString(
    lang === "he" ? "he-IL" : "en-GB",
    { year: "numeric", month: "long" }
  );

  return (
    <Layout>
      <div className="container py-8">
        {/* Seller header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.full_name}</h1>
            <p className="text-sm text-muted-foreground">
              {t("memberSince")} {memberSince}
            </p>
          </div>
        </div>

        {/* Listings */}
        <h2 className="mb-4 text-lg font-semibold">
          {t("sellerListings")} ({listings?.length ?? 0})
        </h2>
        {listingsLoading ? (
          <div className="flex min-h-[20vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !listings || listings.length === 0 ? (
          <p className="text-muted-foreground">{t("noListingsYet")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SellerProfile;
