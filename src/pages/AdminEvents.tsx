import { FormEvent, useState } from "react";
import { format } from "date-fns";
import { he as heLocale } from "date-fns/locale";
import { CalendarPlus, Link2, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useIsAdmin } from "@/hooks/useReports";
import {
  useAdminEvents,
  useCreateEvent,
  useDeleteEvent,
  useParseEvent,
} from "@/hooks/useTicketEvents";
import { suggestEndsAt, toDatetimeLocal, fromDatetimeLocal } from "@/lib/eventTime";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "@/hooks/use-toast";

interface DraftEvent {
  title: string;
  venue: string;
  description: string;
  emoji: string;
  startsLocal: string;
  endsLocal: string;
  imageUrl: string | null;
  sourceUrl: string;
}

const emptyDraft: DraftEvent = {
  title: "",
  venue: "",
  description: "",
  emoji: "🎟️",
  startsLocal: "",
  endsLocal: "",
  imageUrl: null,
  sourceUrl: "",
};

const AdminEvents = () => {
  const { lang, t } = useLanguage();
  const dateLocale = lang === "he" ? heLocale : undefined;
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: events, isLoading } = useAdminEvents(!!isAdmin);

  const parseEvent = useParseEvent();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState<DraftEvent | null>(null);

  const handleImport = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    try {
      const parsed = await parseEvent.mutateAsync(url.trim());
      const startsLocal = parsed.startsAt ? toDatetimeLocal(parsed.startsAt) : "";
      const endsIso = parsed.endsAt ?? (parsed.startsAt ? suggestEndsAt(parsed.startsAt) : "");
      setDraft({
        title: parsed.title,
        venue: parsed.venue,
        description: parsed.description,
        emoji: "🎟️",
        startsLocal,
        endsLocal: endsIso ? toDatetimeLocal(endsIso) : "",
        imageUrl: parsed.imageUrl,
        sourceUrl: parsed.sourceUrl,
      });
      toast({ title: t("eventImported") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const startsAt = fromDatetimeLocal(draft.startsLocal);
    const endsAt = fromDatetimeLocal(draft.endsLocal);
    if (!draft.title.trim() || !startsAt || !endsAt) {
      toast({ title: t("error"), description: t("eventMissingFields"), variant: "destructive" });
      return;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      toast({ title: t("error"), description: t("eventEndAfterStart"), variant: "destructive" });
      return;
    }
    try {
      await createEvent.mutateAsync({
        title: draft.title.trim(),
        description: draft.description.trim(),
        venue: draft.venue.trim(),
        emoji: draft.emoji.trim() || "🎟️",
        startsAt,
        endsAt,
        sourceUrl: draft.sourceUrl,
        imageUrl: draft.imageUrl,
      });
      toast({ title: t("eventSaved") });
      setDraft(null);
      setUrl("");
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent.mutateAsync(id);
      toast({ title: t("eventDeleted") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  const setField = (field: keyof DraftEvent, value: string) =>
    setDraft((d) => (d ? { ...d, [field]: value } : d));

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
          {t("adminEvents")}
        </h1>

        {/* Import from link */}
        <section className="rounded-lg border p-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Link2 className="h-4 w-4 text-primary" />
            {t("importEventTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("importEventDesc")}</p>
          <form onSubmit={handleImport} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://go-out.co/event/..."
              required
            />
            <Button type="submit" disabled={parseEvent.isPending}>
              {parseEvent.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <CalendarPlus className="mr-1 h-4 w-4" />
              )}
              {parseEvent.isPending ? t("importing") : t("importBtn")}
            </Button>
          </form>
        </section>

        {/* Review form */}
        {draft && (
          <form onSubmit={handleSave} className="mt-4 rounded-lg border border-primary/30 bg-blue-50/40 p-4">
            <p className="mb-4 text-sm font-medium text-primary">{t("reviewBeforeSaving")}</p>

            {draft.imageUrl && (
              <img
                src={draft.imageUrl}
                alt={draft.title}
                referrerPolicy="no-referrer"
                className="mb-4 h-40 w-full rounded-md object-cover"
              />
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ev-title">{t("eventTitleLabel")}</Label>
                <Input
                  id="ev-title"
                  value={draft.title}
                  onChange={(e) => setField("title", e.target.value)}
                  maxLength={200}
                  required
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ev-venue">{t("eventVenueLabel")}</Label>
                <Input
                  id="ev-venue"
                  value={draft.venue}
                  onChange={(e) => setField("venue", e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-start">{t("eventStartLabel")}</Label>
                <Input
                  id="ev-start"
                  type="datetime-local"
                  value={draft.startsLocal}
                  onChange={(e) => setField("startsLocal", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-end">{t("eventEndLabel")}</Label>
                <Input
                  id="ev-end"
                  type="datetime-local"
                  value={draft.endsLocal}
                  onChange={(e) => setField("endsLocal", e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">{t("endTimeHint")}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-emoji">{t("eventEmojiLabel")}</Label>
                <Input
                  id="ev-emoji"
                  value={draft.emoji}
                  onChange={(e) => setField("emoji", e.target.value)}
                  maxLength={8}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ev-desc">{t("eventDescLabel")}</Label>
                <Textarea
                  id="ev-desc"
                  value={draft.description}
                  onChange={(e) => setField("description", e.target.value)}
                  rows={4}
                  maxLength={2000}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="submit" disabled={createEvent.isPending}>
                {createEvent.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                {t("saveEvent")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setDraft(null)}>
                {t("cancel")}
              </Button>
            </div>
          </form>
        )}

        {/* Existing events */}
        <h2 className="mb-3 mt-8 text-lg font-semibold">{t("existingEvents")}</h2>
        {isLoading ? (
          <div className="flex min-h-[20vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !events || events.length === 0 ? (
          <p className="text-muted-foreground">{t("noEventsAdmin")}</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const ended = new Date(event.endsAt).getTime() < Date.now();
              return (
                <div key={event.id} className="flex items-center gap-3 rounded-lg border p-3">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      referrerPolicy="no-referrer"
                      className="h-12 w-12 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-blue-100 text-2xl">
                      <span aria-hidden>{event.emoji}</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.date), "d MMM yyyy, HH:mm", { locale: dateLocale })}
                      {" → "}
                      {format(new Date(event.endsAt), "d MMM, HH:mm", { locale: dateLocale })}
                      {ended && ` · ${t("eventEnded")}`}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={deleteEvent.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("deleteEventConfirmTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("deleteEventConfirmDesc")}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(event.id)}>
                          {t("deleteEvent")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminEvents;
