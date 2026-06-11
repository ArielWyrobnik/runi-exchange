import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import ListingCard from "@/components/listings/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UserX, Pencil } from "lucide-react";
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useSellerProfile(id);
  const { data: listings, isLoading: listingsLoading } = useSellerListings(id);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);

  const isOwn = !!user && user.id === id;

  const handleSaveName = async () => {
    const newName = nameInput.trim();
    if (!newName || !id) return;
    setSaving(true);
    // profiles drives the marketplace display, auth metadata drives the navbar
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: newName })
      .eq("id", id);
    if (!error) {
      await supabase.auth.updateUser({ data: { full_name: newName } });
    }
    setSaving(false);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("profileUpdated") });
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["seller-profile", id] });
      queryClient.invalidateQueries({ queryKey: ["seller-listings", id] });
    }
  };

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
            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={100}
                  className="h-9 w-56"
                />
                <Button size="sm" onClick={handleSaveName} disabled={saving || !nameInput.trim()}>
                  {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  {t("saveChanges")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  {t("cancel")}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                {isOwn && (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={t("editName")}
                    onClick={() => {
                      setNameInput(profile.full_name);
                      setEditing(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
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
