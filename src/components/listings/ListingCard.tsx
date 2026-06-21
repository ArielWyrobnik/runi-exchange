import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he as heLocale } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useListingTranslation } from "@/hooks/useListingTranslation";
import { useWatchlistIds, useToggleWatchlist } from "@/hooks/useWatchlist";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { pickupLabelKey } from "@/lib/pickup";
import type { ListingWithImages } from "@/hooks/useListings";

const ListingCard = ({ listing }: { listing: ListingWithImages }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang, t, tCategory, tCondition } = useLanguage();
  const { title } = useListingTranslation(listing);
  const { data: watchedIds } = useWatchlistIds();
  const toggleWatchlist = useToggleWatchlist();

  const firstImage = listing.listing_images
    ?.slice()
    .sort((a, b) => a.display_order - b.display_order)[0]?.image_url;
  const isOwn = user?.id === listing.seller_id;
  const watched = watchedIds?.has(listing.id) ?? false;

  const handleHeart = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      await toggleWatchlist.mutateAsync({ listingId: listing.id, watched });
    } catch (err) {
      toast({
        title: t("error"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    }
  };

  return (
    <Link to={`/listing/${listing.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {firstImage ? (
            <img
              src={firstImage}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              {t("noImage")}
            </div>
          )}
          {!isOwn && (
            <button
              onClick={handleHeart}
              disabled={toggleWatchlist.isPending}
              aria-label={watched ? t("removeFromWatchlist") : t("addToWatchlist")}
              className="absolute right-2 top-2 rounded-full bg-background/90 p-2 shadow-sm transition-transform hover:scale-110 disabled:opacity-60 rtl:left-2 rtl:right-auto"
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  watched ? "fill-red-500 text-red-500" : "text-muted-foreground"
                )}
              />
            </button>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="line-clamp-1 font-medium">{title}</h3>
          <p className="mt-1 text-lg font-bold text-primary">₪{listing.price}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-xs">{tCondition(listing.condition)}</Badge>
            <Badge variant="outline" className="text-xs">{tCategory(listing.category)}</Badge>
            <Badge variant="outline" className="text-xs">
              <MapPin className="mr-1 h-3 w-3 rtl:ml-1 rtl:mr-0" />
              {t(pickupLabelKey(listing.pickup_location))}
            </Badge>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {formatDistanceToNow(new Date(listing.created_at), {
                addSuffix: true,
                locale: lang === "he" ? heLocale : undefined,
              })}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {listing.watch_count}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ListingCard;
