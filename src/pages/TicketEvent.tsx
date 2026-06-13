import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { he as heLocale } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  MapPin,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import TicketsLayout from "@/components/layout/TicketsLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTicketEvent } from "@/hooks/useTicketEvents";
import { useAuth } from "@/hooks/useAuth";
import type { TicketBid } from "@/data/ticketEvents";

const TicketEvent = () => {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const { data: event, isLoading } = useTicketEvent(id);
  const { user } = useAuth();
  const dateLocale = lang === "he" ? heLocale : undefined;
  const [localBids, setLocalBids] = useState<TicketBid[]>([]);
  const [bidPrice, setBidPrice] = useState("");
  const [bidQuantity, setBidQuantity] = useState("1");
  const [bidNote, setBidNote] = useState("");

  if (isLoading) {
    return (
      <TicketsLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      </TicketsLayout>
    );
  }

  if (!event) {
    return (
      <TicketsLayout>
        <div className="container flex min-h-[50vh] flex-col items-center justify-center text-center">
          <h1 className="text-xl font-semibold text-red-700">
            {t("eventNotFound")}
          </h1>
          <Link
            to="/tickets"
            className="mt-4 font-medium text-red-600 underline"
          >
            {t("backToTickets")}
          </Link>
        </div>
      </TicketsLayout>
    );
  }

  const offers = [...event.offers].sort((a, b) => a.price - b.price);
  const bids = [...event.bids, ...localBids].sort((a, b) => b.price - a.price);
  const lowestAsk = offers[0]?.price ?? null;
  const highestBid = bids[0]?.price ?? null;

  const handleBidSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const price = Number(bidPrice);
    const quantity = Number(bidQuantity);
    const trimmedNote = bidNote.trim();

    if (
      !user ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(quantity) ||
      quantity < 1
    ) {
      return;
    }

    setLocalBids((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        buyerName:
          user.user_metadata?.full_name ?? user.email ?? t("runiStudent"),
        price,
        quantity,
        note: trimmedNote || undefined,
      },
    ]);
    setBidPrice("");
    setBidQuantity("1");
    setBidNote("");
  };

  return (
    <TicketsLayout>
      <div className="container max-w-5xl py-6">
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
                  {format(new Date(event.date), "d MMM yyyy", {
                    locale: dateLocale,
                  })}
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

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-red-200 bg-white p-4">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingDown className="h-4 w-4 text-red-600" />
              {t("lowestAsk")}
            </p>
            <p className="mt-2 text-2xl font-bold text-red-700">
              {lowestAsk ? `₪${lowestAsk}` : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-red-200 bg-white p-4">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-red-600" />
              {t("highestBid")}
            </p>
            <p className="mt-2 text-2xl font-bold text-red-700">
              {highestBid ? `₪${highestBid}` : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              {t("marketBalanceTitle")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("marketBalanceDesc")}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
          {/* Ticket offers */}
          <section>
            <h2 className="mb-1 text-xl font-semibold text-red-700">
              {t("ticketOffersHeading")} ({offers.length})
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              {t("ticketOffersDesc")}
            </p>

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
                        <p className="mt-1 text-sm text-muted-foreground">
                          {offer.note}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right rtl:text-left">
                      <p className="text-lg font-bold text-red-700">
                        ₪{offer.price}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("perTicket")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="border border-dashed bg-secondary/30 py-12 text-center">
                <p className="text-muted-foreground">{t("noOffersYet")}</p>
              </div>
            )}
          </section>

          {/* Ticket bids */}
          <section>
            <h2 className="mb-1 text-xl font-semibold text-red-700">
              {t("ticketBidsHeading")} ({bids.length})
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              {t("ticketBidsDesc")}
            </p>

            {user ? (
              <form
                onSubmit={handleBidSubmit}
                className="mb-4 rounded-lg border border-red-200 bg-red-50/60 p-4"
              >
                <p className="mb-3 text-sm text-muted-foreground">
                  {t("postingAs")} {user.user_metadata?.full_name ?? user.email}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="bidPrice">{t("bidPriceLabel")}</Label>
                    <Input
                      id="bidPrice"
                      type="number"
                      min="1"
                      step="1"
                      value={bidPrice}
                      onChange={(e) => setBidPrice(e.target.value)}
                      placeholder="₪"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bidQuantity">{t("bidQtyLabel")}</Label>
                    <Input
                      id="bidQuantity"
                      type="number"
                      min="1"
                      step="1"
                      value={bidQuantity}
                      onChange={(e) => setBidQuantity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="bidNote">{t("bidNoteLabel")}</Label>
                    <Textarea
                      id="bidNote"
                      value={bidNote}
                      onChange={(e) => setBidNote(e.target.value)}
                      placeholder={t("bidNotePlaceholder")}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="mt-4 w-full bg-red-700 text-white hover:bg-red-800 sm:w-auto"
                >
                  {t("placeBid")}
                </Button>
              </form>
            ) : (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50/60 p-4">
                <p className="font-medium text-red-700">
                  {t("ticketAuthRequiredTitle")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("ticketAuthRequiredDesc")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    asChild
                    className="bg-red-700 text-white hover:bg-red-800"
                  >
                    <Link to="/login">{t("logIn")}</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-red-700 text-red-700 hover:bg-red-50"
                  >
                    <Link to="/signup">{t("signUpRuni")}</Link>
                  </Button>
                </div>
              </div>
            )}

            {bids.length > 0 ? (
              <ul className="space-y-3">
                {bids.map((bid) => (
                  <li
                    key={bid.id}
                    className="flex items-center justify-between gap-4 rounded-lg border p-4 transition hover:border-red-300"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-medium">
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{bid.buyerName}</span>
                        <Badge variant="secondary" className="text-xs">
                          {t("qtyLabel")}: {bid.quantity}
                        </Badge>
                      </div>
                      {bid.note && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {bid.note}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right rtl:text-left">
                      <p className="text-lg font-bold text-red-700">
                        ₪{bid.price}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("bidPerTicket")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="border border-dashed bg-secondary/30 py-12 text-center">
                <p className="text-muted-foreground">{t("noBidsYet")}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </TicketsLayout>
  );
};

export default TicketEvent;
