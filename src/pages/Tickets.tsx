import { Link } from "react-router-dom";
import { format } from "date-fns";
import { he as heLocale } from "date-fns/locale";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import TicketsLayout from "@/components/layout/TicketsLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTicketEvents } from "@/hooks/useTicketEvents";
import { lowestOfferPrice } from "@/data/ticketEvents";

const Tickets = () => {
  const { t, lang } = useLanguage();
  const { data: events } = useTicketEvents();
  const dateLocale = lang === "he" ? heLocale : undefined;

  return (
    <TicketsLayout>
      <section className="container py-8">
        <h2 className="mb-6 text-2xl font-semibold text-primary">{t("upcomingEvents")}</h2>

        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const minPrice = lowestOfferPrice(event);
              return (
                <Link
                  key={event.id}
                  to={`/tickets/${event.id}`}
                  className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"
                >
                  <div className="flex h-32 items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 text-5xl">
                    <span aria-hidden>{event.emoji}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-lg font-semibold text-primary">{event.title}</h3>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 shrink-0" />
                        {format(new Date(event.date), "d MMM yyyy", { locale: dateLocale })}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 shrink-0" />
                        {event.venue}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t pt-3">
                      <span className="text-sm text-muted-foreground">
                        {event.offers.length} {t("offersCount")}
                        {minPrice !== null && (
                          <>
                            {" · "}
                            <span className="font-semibold text-primary">
                              {t("fromPrice")} ₪{minPrice}
                            </span>
                          </>
                        )}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-medium text-primary group-hover:underline">
                        {t("viewTickets")}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed bg-secondary/30 py-16 text-center">
            <p className="text-muted-foreground">{t("noEventsYet")}</p>
          </div>
        )}
      </section>
    </TicketsLayout>
  );
};

export default Tickets;
