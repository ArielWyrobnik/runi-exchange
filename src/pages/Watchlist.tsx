import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ListingCard from "@/components/listings/ListingCard";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";

const Watchlist = () => {
  const { t } = useLanguage();
  const { data: listings, isLoading } = useWatchlist();

  return (
    <Layout>
      <div className="container py-6">
        <h1 className="mb-6 text-2xl font-bold">{t("watchlist")}</h1>

        {isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !listings || listings.length === 0 ? (
          <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
            <Heart className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">{t("emptyWatchlist")}</p>
            <Button asChild className="mt-4">
              <Link to="/browse">{t("browseListings")}</Link>
            </Button>
          </div>
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

export default Watchlist;
