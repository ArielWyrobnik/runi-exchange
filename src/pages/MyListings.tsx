import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useMyListings, useSetListingStatus, useDeleteListing } from "@/hooks/useListings";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Package, Pencil, Tag, Trash2, RotateCcw } from "lucide-react";

const MyListings = () => {
  const { t, tCategory, tCondition } = useLanguage();
  const { data: listings, isLoading } = useMyListings();
  const setStatus = useSetListingStatus();
  const deleteListing = useDeleteListing();

  const handleStatus = async (id: string, status: "active" | "sold") => {
    try {
      await setStatus.mutateAsync({ id, status });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteListing.mutateAsync(id);
      toast({ title: t("listingDeleted") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-6">
        <h1 className="mb-6 text-2xl font-bold">{t("myListings")}</h1>

        {isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !listings || listings.length === 0 ? (
          <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
            <Package className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">{t("noMyListings")}</p>
            <Button asChild className="mt-4">
              <Link to="/sell">{t("startSelling")}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => {
              const image = listing.listing_images
                ?.slice()
                .sort((a, b) => a.display_order - b.display_order)[0]?.image_url;
              const isSold = listing.status === "sold";

              return (
                <div
                  key={listing.id}
                  className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
                >
                  <Link
                    to={`/listing/${listing.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={listing.title}
                        className="h-16 w-16 shrink-0 rounded-md border object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-medium">{listing.title}</p>
                      <p className="font-bold text-primary">₪{listing.price}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant={isSold ? "destructive" : "default"} className="text-xs">
                          {isSold ? t("sold") : t("active")}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {tCondition(listing.condition)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {tCategory(listing.category)}
                        </Badge>
                      </div>
                    </div>
                  </Link>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {isSold ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatus(listing.id, "active")}
                        disabled={setStatus.isPending}
                      >
                        <RotateCcw className="mr-1 h-4 w-4" />
                        {t("relist")}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatus(listing.id, "sold")}
                        disabled={setStatus.isPending}
                      >
                        <Tag className="mr-1 h-4 w-4" />
                        {t("markAsSold")}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/listing/${listing.id}/edit`}>
                        <Pencil className="mr-1 h-4 w-4" />
                        {t("edit")}
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={deleteListing.isPending}>
                          <Trash2 className="mr-1 h-4 w-4" />
                          {t("deleteListing")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
                          <AlertDialogDescription>{t("deleteConfirmDesc")}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(listing.id)}>
                            {t("deleteListing")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyListings;
