import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { he as heLocale } from "date-fns/locale";
import { ArrowLeft, Calendar, Loader2, MapPin, User } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTicketEvent } from "@/hooks/useTicketEvents";

const TicketEvent = () => {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const { data: event, isLoading } = useTicketEvent(id);
  const dateLocale = lang === "he" ? heLocale : undefined;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="container flex min-h-[50vh] flex-col items-center justify-center text-center">
          <h1 className="text-xl font-semibold text-red-700">{t("eventNotFound")}</h1>
          <Link to="/tickets" className="mt-4 font-medium text-red-600 underline">
            {t("backToTickets")}
          </Link>
        </div>
      </Layout>
    );
  }

  // Cheapest first — buyers care about price
  const offers = [...event.offers].sort((a, b) => a.price - b.price);

  return (
    <Layout>
      <div className="container max-w-3xl py-6">
        <Link
          to="/tickets"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("backToTickets")}
        </Link>

        {/* Event header */}
        <div className="overflow-hidden rounded-lg border border-red-200 bg-red-50/60">
          <div className="flex items-center gap-4 p-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-700 text-4xl">
              <span aria-hidden>{event.emoji}</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-red-700">{event.title}</h1>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 shrink-0" />
                  {format(new Date(event.date), "d MMM yyyy", { locale: dateLocale })}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {event.venue}
                </span>
              </div>
            </div>
          </div>
          {event.description && (
            <p className="border-t border-red-200 px-5 py-4 text-sm text-foreground/80">
              {event.description}
            </p>
          )}
        </div>

        {/* Ticket offers */}
        <div className="mt-8">
          <h2 className="mb-1 text-xl font-semibold text-red-700">
            {t("ticketOffersHeading")} ({offers.length})
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">{t("sellTicketsSoon")}</p>

          {offers.length > 0 ? (
            <ul className="space-y-3">
              {offers.map((offer) => (
                <li
                  key={offer.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-4 transition hover:border-red-300"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-medium">
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{offer.sellerName}</span>
                      <Badge variant="secondary" className="text-xs">
                        {t("qtyLabel")}: {offer.quantity}
                      </Badge>
                    </div>
                    {offer.note && (
                      <p className="mt-1 text-sm text-muted-foreground">{offer.note}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right rtl:text-left">
                    <p className="text-lg font-bold text-red-700">₪{offer.price}</p>
                    <p className="text-xs text-muted-foreground">{t("perTicket")}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="border border-dashed bg-secondary/30 py-12 text-center">
              <p className="text-muted-foreground">{t("noOffersYet")}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TicketEvent;
