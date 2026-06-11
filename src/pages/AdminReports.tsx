import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useIsAdmin, useReports, useDismissReport } from "@/hooks/useReports";
import { useDeleteListing } from "@/hooks/useListings";
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
import { Loader2, ShieldCheck, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he as heLocale } from "date-fns/locale";

const AdminReports = () => {
  const { lang, t } = useLanguage();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: reports, isLoading } = useReports(!!isAdmin);
  const dismissReport = useDismissReport();
  const deleteListing = useDeleteListing();

  const handleDismiss = async (id: string) => {
    try {
      await dismissReport.mutateAsync(id);
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    try {
      await deleteListing.mutateAsync(listingId);
      toast({ title: t("listingDeleted") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  if (adminLoading) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <h1 className="text-xl font-semibold">{t("pageNotFound")}</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-3xl py-6">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
          <ShieldCheck className="h-6 w-6 text-primary" />
          {t("adminReports")}
        </h1>

        {isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !reports || reports.length === 0 ? (
          <p className="text-muted-foreground">{t("noReports")}</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {report.listings?.title ?? t("listingNotFound")}
                      </span>
                      {report.listings && (
                        <Badge
                          variant={report.listings.status === "sold" ? "destructive" : "default"}
                          className="text-xs"
                        >
                          {report.listings.status === "sold" ? t("sold") : t("active")}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("reportedBy")} {report.reporter?.full_name ?? t("unknown")} ·{" "}
                      {formatDistanceToNow(new Date(report.created_at), {
                        addSuffix: true,
                        locale: lang === "he" ? heLocale : undefined,
                      })}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{report.reason}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {report.listings && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/listing/${report.listing_id}`}>{t("viewListing")}</Link>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDismiss(report.id)}
                    disabled={dismissReport.isPending}
                  >
                    <X className="mr-1 h-4 w-4" />
                    {t("dismiss")}
                  </Button>
                  {report.listings && (
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
                          <AlertDialogAction onClick={() => handleDeleteListing(report.listing_id)}>
                            {t("deleteListing")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminReports;
