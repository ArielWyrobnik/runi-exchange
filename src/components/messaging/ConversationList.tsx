import { formatDistanceToNow } from "date-fns";
import { he as heLocale } from "date-fns/locale";
import { Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import type { ConversationWithDetails } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";

interface Props {
  conversations: ConversationWithDetails[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const ConversationList = ({ conversations, selectedId, onSelect }: Props) => {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  return (
    <div className="flex flex-col">
      {conversations.map((c) => {
        const otherName =
          c.buyer_id === user?.id
            ? c.seller?.full_name
            : c.buyer?.full_name;
        const image = c.listings?.listing_images
          ?.slice()
          .sort((a, b) => a.display_order - b.display_order)[0]?.image_url;

        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              "flex items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent rtl:text-right",
              selectedId === c.id && "bg-accent"
            )}
          >
            {/* Listing photo as the conversation avatar */}
            {image ? (
              <img
                src={image}
                alt={c.listings?.title ?? ""}
                className="h-12 w-12 shrink-0 rounded-md border object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                <Package className="h-5 w-5" />
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="line-clamp-1 font-medium">{c.listings?.title ?? t("unknown")}</span>
                {c.latest_message && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.latest_message.created_at), { addSuffix: true, locale: lang === "he" ? heLocale : undefined })}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{otherName ?? t("unknown")}</span>
              {c.latest_message && (
                <p className="line-clamp-1 text-sm text-muted-foreground">
                  {c.latest_message.content}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ConversationList;
