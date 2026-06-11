import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useListing } from "@/hooks/useListings";
import { useCreateConversation } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, Package } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he as heLocale } from "date-fns/locale";

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang, t, tCategory, tCondition } = useLanguage();
  const { data: listing, isLoading } = useListing(id);
  const createConversation = useCreateConversation();
  const [selectedImage, setSelectedImage] = useState(0);

  const handleContactSeller = async () => {
    if (!listing) return;
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const conversation = await createConversation.mutateAsync({
        listingId: listing.id,
        sellerId: listing.seller_id,
      });
      navigate(`/messages?c=${conversation.id}`);
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <Package className="mb-3 h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-semibold">{t("listingNotFound")}</h1>
          <Link to="/browse" className="mt-2 font-medium text-primary hover:underline">
            {t("backToBrowse")}
          </Link>
        </div>
      </Layout>
    );
  }

  const images = [...(listing.listing_images ?? [])].sort(
    (a, b) => a.display_order - b.display_order
  );
  const isOwn = user?.id === listing.seller_id;

  return (
    <Layout>
      <div className="container max-w-5xl py-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]?.image_url}
                  alt={listing.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  {t("noImage")}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={img.image_url}
                    onClick={() => setSelectedImage(i)}
                    className={`h-20 w-20 overflow-hidden rounded-md border-2 transition-colors ${
                      i === selectedImage ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold">{listing.title}</h1>
              <p className="mt-2 text-3xl font-bold text-primary">₪{listing.price}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {listing.status === "sold" && <Badge variant="destructive">{t("sold")}</Badge>}
              <Badge variant="secondary">{tCondition(listing.condition)}</Badge>
              <Badge variant="outline">{tCategory(listing.category)}</Badge>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {listing.description}
            </p>

            <div className="text-sm text-muted-foreground">
              {t("postedBy")}{" "}
              <span className="font-medium text-foreground">
                {listing.profiles?.full_name ?? t("unknown")}
              </span>{" "}
              ·{" "}
              {formatDistanceToNow(new Date(listing.created_at), {
                addSuffix: true,
                locale: lang === "he" ? heLocale : undefined,
              })}
            </div>

            <div className="mt-auto pt-4">
              {isOwn ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-muted-foreground">{t("yourListing")}</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/listing/${listing.id}/edit`}>{t("edit")}</Link>
                  </Button>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleContactSeller}
                  disabled={createConversation.isPending}
                >
                  {createConversation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="mr-2 h-4 w-4" />
                  )}
                  {t("contactSeller")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ListingDetail;
